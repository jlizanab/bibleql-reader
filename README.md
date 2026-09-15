# Bible Reader

An open-source desktop Bible reader built on the [BibleQL](https://github.com/lporras/bibleql) GraphQL API.

## What it does

- Read any translation BibleQL serves (43 translations, 31 languages)
- Compare two translations side by side
- Concordance: exhaustive, canonically ordered word study with keyword-in-context
- Text search across the current translation
- AI assistant for Bible questions, answering with openable references
- Light / dark themes, English and Spanish interface locales

Version 2 (server-side): bookmarks and reading plans.

## Stack

Electron + React + TypeScript, built with [electron-vite](https://electron-vite.org). Server state
(translations, passages, concordance, search) is managed with
[TanStack Query](https://tanstack.com/query), navigation with
[React Router](https://reactrouter.com) (hash-based, since the renderer loads from `file://` in
production), and styling with Sass — a single token partial
(`src/renderer/src/styles/_tokens.scss`) drives both the light and dark palettes as CSS custom
properties, and every component has its own colocated `.module.scss`.

```
src/
  main/       Electron main process (window setup, the AI IPC handler)
  preload/    contextBridge — exposes window.desktop and window.ai to the renderer
  renderer/   the React app (components/, queries/, hooks/, state/, lib/, data/, styles/)
```

## Running as a desktop app

```bash
npm install
cp .env.example .env   # set BIBLEQL_API_KEY
npm run dev            # dev server + Electron, with HMR
npm run build          # type-checks, then builds main/preload/renderer to out/
```

Requests go to `https://bibleql.org/graphql` with an `Authorization: Bearer` header. The BibleQL
key comes from `BIBLEQL_API_KEY` in `.env` (loaded via `dotenv`) and is compiled into the app at
build time — it's never entered by end users and never committed. Release builds get their key the
same way, from a `BIBLEQL_API_KEY` GitHub Actions secret set on the workflow. Without a key, the
reader shows a bundled public-domain sample chapter (Psalm 23).

The AI assistant calls Claude via the [Vercel AI SDK](https://ai-sdk.dev) from the main process, so
its API key never touches the renderer. That key is still entered per-user from the key dialog (key
icon in the title bar) and stored locally — never committed or sent anywhere else.

Get a BibleQL key at https://bibleql.org/api-keys/request/new (docs: https://docs.bibleql.org) and
an Anthropic key at https://console.anthropic.com.

## Running tests

```bash
npm test          # Vitest — pure-logic unit tests (no network, no Electron)
npm run test:e2e  # Playwright — builds the app, then drives the real Electron window
```

`npm test` covers things like project serialization, layout math, and reference formatting —
fast, and safe to run without any keys configured. `npm run test:e2e` (`e2e/*.spec.ts`) launches
the actual packaged app and drives it like a user would: selecting verses, handing off to the
Verse Image Creator, picking a background, editing text, exporting. It needs a real
`BIBLEQL_API_KEY` set at build time (same as `npm run dev`/`dist:*` — see above), since the
editor's passage fetch isn't covered by the no-key sample fallback. Electron always opens a real
window — there's no headless mode — so running it in CI (see `.github/workflows/ci.yml`, which
runs both suites on every pull request) needs a virtual display (Xvfb on Linux runners).

## macOS: "is damaged and can't be opened"

Release builds aren't code-signed/notarized yet, so macOS Gatekeeper blocks them after download
with `"BibleQL Reader" is damaged and can't be opened. You should move it to the Trash.` This is a
Gatekeeper quarantine issue, not an actual corrupt download. Workaround:

```bash
xattr -cr "/Applications/BibleQL Reader.app"
```

(adjust the path if you didn't install it to `/Applications`). This only fixes it for the copy you
run it on — every user hitting a release build hits the same dialog until the mac build is signed
with an Apple Developer ID and notarized in CI.

## License

MIT. Bible texts keep their own licenses — each translation's `note` field carries it, and the
app shows it in the status bar.
