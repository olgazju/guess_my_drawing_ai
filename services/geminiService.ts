import { GoogleGenAI, Modality } from "@google/genai";
import { PROMPT_DIFFICULTY_LEVELS, GUESSING_SYSTEM_PROMPT } from '../constants';
import { GeneratedImage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function shuffleArray<T,>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export const generateImagesForGame = async (round: number): Promise<GeneratedImage[]> => {
    let prompts: string[];
    let promptStyle: string;

    if (round <= 3) {
        prompts = PROMPT_DIFFICULTY_LEVELS[0];
        promptStyle = "a simple, iconic black and white line drawing";
    } else if (round <= 7) {
        prompts = PROMPT_DIFFICULTY_LEVELS[1];
        promptStyle = "a detailed black and white line drawing";
    } else {
        prompts = PROMPT_DIFFICULTY_LEVELS[2];
        promptStyle = "a 3d render style black and white line drawing";
    }

    const shuffledPrompts = shuffleArray(prompts);
    const promptsToTry = shuffledPrompts.slice(0, 4);

    if (promptsToTry.length < 4) {
        throw new Error("Could not find enough unique prompts for the game.");
    }

    // Create an array of promises, one for each image generation request.
    const imagePromises = promptsToTry.map(prompt => {
        const fullPrompt = `Generate ${promptStyle} of a ${prompt}.`;
        return ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: fullPrompt,
            config: {
                responseModalities: [Modality.IMAGE],
            },
        }).then(response => {
            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            const base64ImageBytes = imagePart?.inlineData?.data;
            if (!base64ImageBytes) {
                const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text)?.text;
                throw new Error(`Model did not return an image for prompt "${prompt}". Model's text response: "${textPart || 'None'}"`);
            }
            return {
                prompt: prompt,
                base64: base64ImageBytes,
            };
        });
    });

    // Wait for all promises to resolve.
    const generatedImages = await Promise.all(imagePromises);
    return generatedImages;
};


const base64ToPart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64,
            mimeType,
        },
    };
};

export const guessDrawing = async (userSketchBase64: string, referenceImages: GeneratedImage[]) => {
    const userSketchPart = base64ToPart(userSketchBase64, 'image/png');
    const referenceImageParts = referenceImages.map(img => base64ToPart(img.base64, 'image/png'));
    const referencePromptsText = referenceImages.map((img, index) => `${index + 1}: ${img.prompt}`).join('\n');
    
    const textPart = { text: `${GUESSING_SYSTEM_PROMPT}\n\nHere are the original prompts for the reference images:\n${referencePromptsText}` };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [userSketchPart, ...referenceImageParts, textPart] },
    });

    return response.text;
};