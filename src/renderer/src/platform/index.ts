import { webPlatform } from "./web";
import { electronPlatform } from "./electron";
import type { PlatformCapabilities } from "./types";

// Single seam for platform-specific behavior. Most capabilities
// (file picker, clipboard) are plain Chromium/web-platform behavior and
// serve any shell unchanged; `saveImage` is the one piece that currently
// needs a real Electron adapter. A Tauri (or other) adapter would extend
// this composition without callers changing.
export function getPlatform(): PlatformCapabilities {
  return { ...webPlatform, ...electronPlatform };
}

export type { PlatformCapabilities, PickedFile, SaveImageRequest, SaveImageResult } from "./types";
