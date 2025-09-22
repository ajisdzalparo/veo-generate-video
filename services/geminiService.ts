import { GoogleGenAI } from "@google/genai";
import type { AspectRatio } from "../types";

interface GenerateVideoParams {
  apiKey: string; // Tambahkan API key dari user
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio: AspectRatio;
  soundEnabled: boolean;
  resolution: string;
  onStatusUpdate: (message: string) => void;
}

export const generateVideo = async ({ apiKey, prompt, imageBase64, mimeType, onStatusUpdate }: GenerateVideoParams): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is required.");
  }

  const ai = new GoogleGenAI({ apiKey }); // Gunakan API key dari parameter

  onStatusUpdate("Initializing video generation...");

  const requestPayload: any = {
    model: "veo-3.0-generate-preview",
    prompt,
    config: {
      numberOfVideos: 1,
    },
  };

  if (imageBase64 && mimeType) {
    requestPayload.image = {
      imageBytes: imageBase64,
      mimeType,
    };
  }

  // Start video generation
  let operation = await ai.models.generateVideos(requestPayload);
  onStatusUpdate("Video generation process started. This may take several minutes...");

  let pollCount = 0;
  while (!operation.done) {
    pollCount++;
    onStatusUpdate(`Processing... (Status check ${pollCount})`);
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Poll setiap 10 detik
    operation = await ai.operations.getVideosOperation({ operation });
  }

  onStatusUpdate("Finalizing video...");

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error("Failed to get video download link from the operation response.");
  }

  onStatusUpdate("Fetching generated video...");

  // Fetch video tanpa menggunakan process.env.API_KEY
  const videoResponse = await fetch(downloadLink, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.statusText}`);
  }

  const videoBlob = await videoResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);

  onStatusUpdate("Video ready!");
  return videoUrl;
};
