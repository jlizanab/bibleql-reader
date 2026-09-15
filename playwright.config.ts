import { defineConfig } from "@playwright/test";

// Electron E2E — not a browser suite, so most of Playwright's usual
// config (browsers, webServer, devices) doesn't apply. Each spec launches
// the packaged app itself via `_electron` (see e2e/helpers.ts). Requires
// `npm run build` (or `electron-vite build`) to have produced `out/`
// first — see the `test:e2e` script in package.json.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false, // one Electron app instance per test; avoid resource contention
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  timeout: 60_000
});
