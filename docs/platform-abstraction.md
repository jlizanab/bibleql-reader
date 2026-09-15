# Platform abstraction

The app is Electron today. The Image Creator feature (see `plan bible image.md`) is being
built so it can also run under a future non-Electron shell (e.g. Tauri) without a rewrite. This
document describes the seam and what's on each side of it.

## The interface

`src/renderer/src/platform/types.ts` declares `PlatformCapabilities` — everything the Image
Creator's domain code is allowed to assume about the host environment. Domain/model code
(`src/renderer/src/features/image-creator/**`) must call into this interface, never
`window.desktop`, `ipcRenderer`, or a Node/Electron API directly.

```ts
export interface PlatformCapabilities {
  pickImageFile(): Promise<PickedFile | null>;
  saveImage(request: SaveImageRequest): Promise<SaveImageResult>;
  copyImageToClipboard(data: Uint8Array, mimeType: "image/png"): Promise<void>;
}
```

`getPlatform()` in `src/renderer/src/platform/index.ts` composes the implementations below; it's
the only place that decides which backs the interface.

## Today's implementations

Two capabilities are plain Chromium/web-platform behavior (`src/renderer/src/platform/web.ts`)
and need **no Electron-specific code at all**, so they work unchanged in a plain browser tab or
a future Tauri webview:

- `pickImageFile` — a hidden `<input type="file" accept="image/*">`. Chromium already opens the
  real native OS file dialog (Finder/Explorer/GTK picker) for this.
- `copyImageToClipboard` — the standard Async Clipboard API
  (`navigator.clipboard.write([new ClipboardItem(...)])`).

One capability genuinely needs Electron (`src/renderer/src/platform/electron.ts`), because a
sandboxed renderer has no filesystem access of its own:

- `saveImage` — a native "Save As" dialog + disk write. Backed by `window.imageCreator.saveImage`
  (`src/preload/index.ts`) → the `imageCreator:saveImage` IPC handler
  (`src/main/ipc/imageCreator.ts`), which calls `dialog.showSaveDialog` then writes the bytes with
  `node:fs/promises`. The shared arg/result types live in
  `src/renderer/src/types/imageCreator.ts` and are included in `tsconfig.node.json` alongside
  `types/ai.ts`, following the same pattern the `ai:ask` IPC already established.

`getPlatform()` returns `{ ...webPlatform, ...electronPlatform }` — when a Tauri adapter is
added, it would only need to override `saveImage` (and anything else that turns out to need a
real OS call), not the whole interface.

## Deliberately not here yet

Revealing a file in Finder/Explorer after saving it, and the three social "Share" buttons (spec
§16) are not implemented — direct posting to Facebook/X/Instagram needs a registered developer
app + OAuth credentials for each platform, which this project doesn't have. If that's revisited,
the realistic ceiling without those credentials is a browser share-intent URL (opened via
`shell.openExternal`, itself another small Electron-backed capability) with the verse reference
pre-filled as text — the user still has to attach the already-saved image manually, since none of
those URLs accept image bytes.
