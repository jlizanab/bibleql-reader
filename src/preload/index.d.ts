import type { AiAnswer } from "../renderer/src/types/ai";
import type { SaveImageResult } from "../renderer/src/types/imageCreator";

export {};

declare global {
  interface Window {
    desktop: {
      platform: NodeJS.Platform;
      version: string;
    };
    ai: {
      ask(question: string, locale: "en" | "es", anthropicApiKey: string): Promise<AiAnswer>;
    };
    imageCreator: {
      saveImage(data: Uint8Array, suggestedName: string, mimeType: "image/png" | "image/jpeg"): Promise<SaveImageResult>;
    };
  }
}
