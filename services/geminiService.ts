import { GoogleGenAI } from "@google/genai";
import type { AspectRatio } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerateVideoParams {
    prompt: string;
    imageBase64?: string;
    mimeType?: string;
    aspectRatio: AspectRatio;
    soundEnabled: boolean;
    resolution: string;
    onStatusUpdate: (message: string) => void;
}

export const generateVideo = async ({
    prompt,
    imageBase64,
    mimeType,
    onStatusUpdate,
}: GenerateVideoParams): Promise<string> => {
    onStatusUpdate("Initializing video generation...");

    const requestPayload: any = {
        model: 'veo-3.0-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
        },
    };

    if (imageBase64 && mimeType) {
        requestPayload.image = {
            imageBytes: imageBase64,
            mimeType: mimeType,
        };
    }

    // Note: As of the current API documentation, aspectRatio, soundEnabled, 
    // and resolution are not supported parameters for the veo-2.0-generate-001 model.
    // The UI elements are included for future compatibility.

    let operation = await ai.models.generateVideos(requestPayload);
    onStatusUpdate("Video generation process started. This may take several minutes...");

    let pollCount = 0;
    while (!operation.done) {
        pollCount++;
        onStatusUpdate(`Processing... (Status check ${pollCount})`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onStatusUpdate("Finalizing video...");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Failed to get video download link from the operation response.");
    }

    onStatusUpdate("Fetching generated video...");
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    onStatusUpdate("Video ready!");
    return videoUrl;
};
