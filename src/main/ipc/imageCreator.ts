import { ipcMain, dialog } from "electron";
import { writeFile } from "node:fs/promises";

export interface SaveImageArgs {
  data: Uint8Array;
  suggestedName: string;
  mimeType: "image/png" | "image/jpeg";
}

export interface SaveImageResult {
  canceled: boolean;
  filePath?: string;
}

function extensionFor(mimeType: SaveImageArgs["mimeType"]): string {
  return mimeType === "image/png" ? "png" : "jpg";
}

export function registerImageCreatorHandlers(): void {
  ipcMain.handle("imageCreator:saveImage", async (_event, args: SaveImageArgs): Promise<SaveImageResult> => {
    const ext = extensionFor(args.mimeType);
    const result = await dialog.showSaveDialog({
      defaultPath: args.suggestedName,
      filters: [{ name: "Image", extensions: [ext] }]
    });

    if (result.canceled || !result.filePath) return { canceled: true };

    try {
      await writeFile(result.filePath, Buffer.from(args.data));
      return { canceled: false, filePath: result.filePath };
    } catch (err) {
      const message = (err as { message?: string }).message ?? "Unknown filesystem error";
      throw new Error(`Couldn't save the image: ${message}`);
    }
  });
}
