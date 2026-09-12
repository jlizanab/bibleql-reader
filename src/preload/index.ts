import { contextBridge, ipcRenderer } from "electron";
import type { AiAnswer, AskAiArgs } from "../renderer/src/types/ai";
import type { SaveImageArgs, SaveImageResult } from "../renderer/src/types/imageCreator";

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  version: process.versions.electron
});

contextBridge.exposeInMainWorld("ai", {
  ask: (question: string, locale: "en" | "es", anthropicApiKey: string): Promise<AiAnswer> =>
    ipcRenderer.invoke("ai:ask", { question, locale, anthropicApiKey } satisfies AskAiArgs)
});

contextBridge.exposeInMainWorld("imageCreator", {
  saveImage: (data: Uint8Array, suggestedName: string, mimeType: SaveImageArgs["mimeType"]): Promise<SaveImageResult> =>
    ipcRenderer.invoke("imageCreator:saveImage", { data, suggestedName, mimeType } satisfies SaveImageArgs)
});
