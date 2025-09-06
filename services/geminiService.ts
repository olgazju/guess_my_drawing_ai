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
        promptStyle = "Draw a simple, iconic black and white line drawing";
    } else if (round <= 7) {
        prompts = PROMPT_DIFFICULTY_LEVELS[1];
        promptStyle = "Draw a detailed black and white line drawing";
    } else {
        prompts = PROMPT_DIFFICULTY_LEVELS[2];
        promptStyle = "Draw a 3d render style black and white line drawing";
    }

    const shuffledPrompts = shuffleArray(prompts);
    const promptsToTry = shuffledPrompts.slice(0, 4);

    if (promptsToTry.length < 4) {
        throw new Error("Could not find enough unique prompts for the game.");
    }

    const promptList = promptsToTry.map((p, i) => `${i + 1}. A drawing of a ${p}`).join('\n');
    const fullPrompt = `${promptStyle}. Generate 4 separate images. Return exactly 4 image parts in your response, in the following order:\n${promptList}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: fullPrompt,
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const imageParts = response.candidates?.[0]?.content?.parts?.filter(part => part.inlineData);

    if (!imageParts || imageParts.length < 4) {
        const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text)?.text;
        throw new Error(`Model did not return 4 images as requested. It returned ${imageParts?.length || 0}. Model's text response: "${textPart || 'None'}"`);
    }

    // We are assuming the model respects the prompt and returns images in the requested order.
    const generatedImages = imageParts.slice(0, 4).map((part, index) => {
        const base64ImageBytes = part.inlineData?.data;
        if (!base64ImageBytes) {
            // This should not be reached due to the filter, but it's a good safeguard.
            throw new Error(`API response included an image part without data at index ${index}.`);
        }
        return {
            prompt: promptsToTry[index],
            base64: base64ImageBytes,
        };
    });

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