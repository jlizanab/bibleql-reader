import { app, BrowserWindow, nativeTheme } from "electron";
import { join } from "node:path";
import { attachExternalLinkHandling } from "./externalLinks";
import { registerAiHandlers } from "./ipc/ai";
import { registerImageCreatorHandlers } from "./ipc/imageCreator";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 620,
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    titleBarOverlay:
      process.platform === "darwin" ? false : { color: "#eae9e9", symbolColor: "#201f1d", height: 46 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#171615" : "#f3f2f2",
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.once("ready-to-show", () => win.show());

  // Attribution and other outbound links go to the user's browser, never
  // a child window — see externalLinks.ts.
  attachExternalLinkHandling(win);

  // Forward renderer console output to this process's stdout in dev, so
  // renderer-side errors are visible without opening DevTools.
  if (process.env.ELECTRON_RENDERER_URL) {
    win.webContents.on("console-message", (event) => {
      console.log(`[renderer:${event.level}]`, event.message);
    });
  }

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  registerAiHandlers();
  registerImageCreatorHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
