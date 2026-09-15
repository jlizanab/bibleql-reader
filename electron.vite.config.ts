import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

// .env holds shared defaults; .env.local (git-ignored) overrides it for a
// machine-local key, same convention Vite itself uses.
loadEnv();
loadEnv({ path: resolve(".env.local"), override: true });

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    define: {
      __BIBLEQL_API_KEY__: JSON.stringify(process.env.BIBLEQL_API_KEY ?? ""),
      // Unsplash's public Client-ID auth is designed to be embedded in
      // client apps (no user login, no secret) — see docs/unsplash.md.
      __UNSPLASH_ACCESS_KEY__: JSON.stringify(process.env.UNSPLASH_ACCESS_KEY ?? "")
    },
    plugins: [react()]
  }
});
