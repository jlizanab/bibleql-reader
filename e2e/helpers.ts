import { _electron as electron, type ElectronApplication, type Page } from "@playwright/test";
// Importing "electron" from plain Node (not run *as* Electron) resolves
// to the platform-correct binary path string rather than the API —
// the standard way to find the executable for `_electron.launch()`
// without hardcoding a per-OS path.
import electronPath from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

const APP_DIR = path.resolve(import.meta.dirname, "..");

export interface App {
  app: ElectronApplication;
  page: Page;
  /** Call in an `afterEach` alongside `app.close()` to remove the temp profile dir. */
  cleanup(): Promise<void>;
}

/**
 * Launches the built app (see `out/`, produced by `electron-vite build` —
 * the `test:e2e` npm script builds first) and returns its main window.
 *
 * Each call gets a fresh `--user-data-dir` — without this, every launch
 * on a given machine shares the same real profile (localStorage, theme,
 * "Compare" toggle, translation choices…), so a test's outcome would
 * depend on whatever was last left there by manual testing or a prior
 * run, rather than starting from the same clean-install state a real
 * first-time user sees.
 */
export async function launchApp(): Promise<App> {
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "bibleql-e2e-"));
  const app = await electron.launch({
    executablePath: electronPath as unknown as string,
    args: [APP_DIR, `--user-data-dir=${userDataDir}`],
    // Some shells (this repo's dev sandbox, notably) set
    // ELECTRON_RUN_AS_NODE, which makes the Electron binary behave as
    // plain Node instead of launching the app — strip it defensively.
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "" }
  });
  const page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  return {
    app,
    page,
    cleanup: () => fs.rm(userDataDir, { recursive: true, force: true })
  };
}

/** Navigates the (already-launched) app to a hash route and waits for it to settle. */
export async function goTo(page: Page, hashRoute: string): Promise<void> {
  await page.evaluate((route) => {
    window.location.hash = route;
  }, hashRoute);
}

/** Matches either locale's label for a button — this app ships en/es strings. */
export function labelPattern(en: string, es: string): RegExp {
  return new RegExp(`${en}|${es}`, "i");
}
