import { GoogleGenAI } from "@google/genai";
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
        promptStyle = "simple, iconic black and white line drawing of";
    } else if (round <= 7) {
        prompts = PROMPT_DIFFICULTY_LEVELS[1];
        promptStyle = "detailed black and white line drawing of";
    } else {
        prompts = PROMPT_DIFFICULTY_LEVELS[2];
        promptStyle = "3d render style black and white line drawing of";
    }

    const generatedImages: GeneratedImage[] = [];
    const shuffledPrompts = shuffleArray(prompts);
    let promptIndex = 0;

    // Keep trying prompts until we have 4 images or run out of prompts.
    while (generatedImages.length < 4 && promptIndex < shuffledPrompts.length) {
        const prompt = shuffledPrompts[promptIndex];
        const fullPrompt = `${promptStyle} ${prompt}, on a white background`;

        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png',
                    aspectRatio: '1:1',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                generatedImages.push({
                    prompt: prompt,
                    base64: base64ImageBytes,
                });
            } else {
                console.warn(`Image generation failed for prompt: "${prompt}". No images returned.`);
            }
        } catch (error) {
            console.error(`Error generating image for prompt: "${prompt}"`, error);
        }
        
        promptIndex++;
    }

    if (generatedImages.length < 4) {
        throw new Error("Could not generate enough images for the game after trying multiple prompts.");
    }

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