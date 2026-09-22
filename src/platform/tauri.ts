import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { PlatformCapabilities, SaveImageRequest, SaveImageResult } from "./types";

// The only capability that genuinely needs the shell: a webview has no
// filesystem access of its own, so the native "Save As" dialog and disk
// write go through Tauri's dialog + fs plugins. Everything else in
// PlatformCapabilities is plain web platform behaviour — see platform/web.ts.
//
// `writeFile` requires the chosen path to fall inside the `fs:allow-write-file`
// scope declared in src-tauri/capabilities/default.json; that scope lists the
// user directories a save dialog can realistically land in.
async function saveImage(request: SaveImageRequest): Promise<SaveImageResult> {
  const ext = request.mimeType === "image/png" ? "png" : "jpg";

  const filePath = await save({
    defaultPath: request.suggestedName,
    filters: [{ name: "Image", extensions: [ext] }]
  });

  if (!filePath) return { canceled: true };

  try {
    await writeFile(filePath, request.data);
  } catch (err) {
    const message = (err as { message?: string }).message ?? String(err);
    throw new Error(`Couldn't save the image: ${message}`);
  }

  return { canceled: false, filePath };
}

export const tauriPlatform: Pick<PlatformCapabilities, "saveImage"> = { saveImage };
