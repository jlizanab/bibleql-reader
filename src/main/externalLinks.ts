import { shell, type BrowserWindow } from "electron";

// Without this, Electron's default handling of `target="_blank"` is to
// open a bare child BrowserWindow — inheriting this app's preload and
// webPreferences — with no address bar or back button. That matters for
// compliance, not just polish: the Unsplash API guidelines require a
// working "link back to their Unsplash profile" (the attribution links in
// features/image-creator/components/PhotoCredit.tsx), and a chromeless
// in-app window is a poor substitute for the user's own browser. It's
// also the standard Electron hardening step.
//
// This lives in main rather than behind platform/index.ts or an IPC
// channel because there's no renderer API surface involved: the renderer
// markup is already correct plain-web behaviour that a browser or a
// future non-Electron shell handles natively. Only the Electron shell
// misbehaves, so only the Electron shell is patched.

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function sameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

export function attachExternalLinkHandling(win: BrowserWindow): void {
  // Deny unconditionally — no child window is ever created, whatever the
  // scheme — and hand https off to the system browser. Anything else
  // (file:, about:, custom schemes) is dropped silently.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isHttps(url)) void shell.openExternal(url);
    return { action: "deny" };
  });

  // Belt and braces for a link without target="_blank", which would
  // otherwise navigate the app itself away to unsplash.com. Same-origin
  // navigation has to stay allowed: the renderer is a HashRouter over
  // file:// in production and over ELECTRON_RENDERER_URL in dev (HMR).
  win.webContents.on("will-navigate", (event, url) => {
    if (sameOrigin(url, win.webContents.getURL())) return;
    event.preventDefault();
    if (isHttps(url)) void shell.openExternal(url);
  });
}
