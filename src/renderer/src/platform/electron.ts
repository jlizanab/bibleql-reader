import type { PlatformCapabilities, SaveImageRequest, SaveImageResult } from "./types";

// The only capability that genuinely needs Electron: a sandboxed renderer
// has no filesystem access of its own, so the native "Save As" dialog and
// disk write go through window.imageCreator (src/preload/index.ts →
// src/main/ipc/imageCreator.ts). Everything else in PlatformCapabilities
// is plain web platform behavior — see platform/web.ts.
async function saveImage(request: SaveImageRequest): Promise<SaveImageResult> {
  return window.imageCreator.saveImage(request.data, request.suggestedName, request.mimeType);
}

export const electronPlatform: Pick<PlatformCapabilities, "saveImage"> = { saveImage };
