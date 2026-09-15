# CLAUDE.md

Guidance for agents working in this repository.

## What this is

Electron 44 + electron-vite 5 + React 19 + TypeScript 5.9 (strict) desktop Bible reader over the
BibleQL GraphQL API (`https://bibleql.org/graphql`), plus a Verse Image Creator (select verses →
style them over a background → export as PNG/JPEG). `"type": "module"`. Read the neighbouring
file before inventing a pattern; there is almost always precedent.

## Commands

```bash
npm run dev             # electron-vite dev, HMR
npm run build           # typecheck + vitest, then electron-vite build
npm run typecheck       # tsc --noEmit across tsconfig.node.json, tsconfig.web.json, e2e/tsconfig.json
npm test                # vitest run — pure-logic unit tests, no network, no Electron
npm run test:e2e        # electron-vite build, then Playwright drives the real packaged app
npm run dist:mac|win|linux
```

`npm run test:e2e` needs a real `BIBLEQL_API_KEY` (`.env.local` locally, a repo secret in CI) —
see the Testing section below. No ESLint/Prettier. Match surrounding style by hand.

## Layout

```
src/
  main/                    Electron main process — window setup, ipc/ (ai.ts, imageCreator.ts)
  preload/                 contextBridge — exposes window.desktop/ai/imageCreator to the renderer
  renderer/
    public/bible-images/   curated Unsplash backgrounds (full/ + thumb/), served as static files
    src/
      components/          Reader/, Sidebar/, StudyPanel/, TitleBar/, + standalone (Spinner, icons…)
      features/
        image-creator/     the Verse Image Creator — model/, components/, providers/, rendering/,
                            lib/, data/, state/, hooks/, assets/ (see its own files for detail)
      platform/            PlatformCapabilities — the Electron-vs-future-shell seam (see
                            docs/platform-abstraction.md)
      routes/              route-level composition shells (thin — pull their own state/data)
      queries/             TanStack Query hooks, one per BibleQL query, key factory in keys.ts
      state/               AppStateContext (Context + useReducer) + persist.ts (localStorage)
      lib/                 graphql client, refs.ts (book/reference helpers), speech.ts, format.ts
      data/                static data: books.ts, strings.ts (i18n), sample.ts, fallbackTranslations.ts
      types/               shared TS types (bible.ts, app.ts, ai.ts, imageCreator.ts)
      styles/              _tokens.scss (palette), _theme.scss, _mixins.scss, _fonts.scss, global.scss
e2e/                       Playwright specs driving the packaged Electron app (see Testing below)
```

Every component has a colocated `.module.scss`.

## Architecture rules this codebase actually follows

- **URL is the source of truth** for reading location, the active study-panel tab, and the
  verse highlight (`?from=&to=`). Routes: `src/renderer/src/App.tsx` (`HashRouter`, since the
  renderer loads from `file://` in production).
- **Three state layers, nothing else** — no zustand/redux/jotai:
  1. `AppStateContext` (`state/AppStateContext.tsx`): Context + `useReducer`, mirrored to
     `localStorage` via `state/persist.ts`.
  2. TanStack Query for server state (`queries/*.ts`, key factory in `queries/keys.ts`).
  3. Route + search params for location/selection.
- **No component library, no Tailwind.** Styling is Sass Modules + a token system
  (`styles/_tokens.scss` → CSS custom properties in `_theme.scss`, shared mixins in
  `_mixins.scss`). There is no generic `Button`/`Dialog`/`Select` — copy the shape of a
  neighbour (`components/KeyDialog.tsx` is the modal pattern; `icons.tsx` holds inline SVGs).
- **All user-facing strings live in `data/strings.ts`** (`STR[locale]`, `Locale = "en" | "es"`).
  Adding a key to `StringsShape` without both `en` and `es` entries fails `npm run typecheck`.
- Imports are relative, not the `@renderer/*` alias (configured in `tsconfig.web.json` but unused
  in practice).
- **Preload pattern**: one `contextBridge.exposeInMainWorld` namespace per concern
  (`window.desktop`, `window.ai`, `window.imageCreator`), with the `Window` augmentation declared
  in `src/preload/index.d.ts`. New IPC should follow this shape rather than a single kitchen-sink
  namespace.
- **Image Creator stays platform-neutral.** Its code (`features/image-creator/**`) must go
  through `platform/index.ts`'s `getPlatform()`, never `window.desktop`/`ipcRenderer`/Electron
  APIs directly — see `docs/platform-abstraction.md`. Most capabilities (file picker, clipboard)
  are plain web-platform APIs and need no IPC; only `saveImage` (native "Save As" dialog) is
  Electron-backed today.

## Testing

Two layers, deliberately different in kind:

- **Vitest** (`npm test`, `src/**/*.test.ts`) — pure logic only (serialization, presets, crop
  math, text layout, filenames, reducers). No DOM, no network, no Electron. Per standing
  guidance: **mock any external/API call in a spec — never hit BibleQL, Unsplash, or any other
  live service from a test.**
- **Playwright E2E** (`npm run test:e2e`, `e2e/*.spec.ts`) — launches the real packaged app
  (`_electron.launch`, see `e2e/helpers.ts`) and drives it like a user: select verses, hand off
  to the editor, pick a background, edit text, export. This *does* hit the real BibleQL API (the
  editor's passage re-fetch is gated on `HAS_BIBLEQL_KEY`, which the app's offline/no-key sample
  fallback doesn't cover) — needs `BIBLEQL_API_KEY` set at build time, same as `dist:*`. Runs in
  CI (`.github/workflows/ci.yml`) under Xvfb, since Electron always opens a real window — there's
  no headless mode, on any platform.

## Gotchas

- **Frameless window** (`titleBarStyle: "hiddenInset"` on macOS, `titleBarOverlay` elsewhere,
  set in `src/main/index.ts`). Any new full-window route needs its own
  `-webkit-app-region: drag` region and must honour `hooks/useOverlayInset.ts` on Windows/Linux —
  don't assume OS chrome exists.
- `noUnusedLocals: true` in **both** tsconfig projects — leftover scaffolding breaks
  `npm run typecheck`.
- Types shared between main/preload and the renderer must be added to `tsconfig.node.json`'s
  `include` array (see `types/ai.ts` and `types/imageCreator.ts` there for the pattern).
- `sandbox: false` in `BrowserWindow.webPreferences` is required because the preload is an ESM
  `.mjs` bundle; `contextIsolation: true` and `nodeIntegration: false` are on.
- `BIBLEQL_API_KEY` is compile-time inlined into the renderer bundle via `define:` in
  `electron.vite.config.ts` (from `.env` / `.env.local`, dotenv, `.env.local` overrides). The
  Anthropic key is deliberately **not** bundled — it's read from `localStorage` and passed
  per-call into the `ai:ask` IPC handler (`src/main/ipc/ai.ts`). Follow the un-bundled pattern
  for any future secret; only ship a key at build time if it's meant to be public (as
  `BIBLEQL_API_KEY` already is).
- `p[data-hl="on"]` (the verse-highlight rule) is defined **globally** in
  `styles/global.scss`, not scoped to a module — new `<p>` elements elsewhere inherit it.
- Reader/app preferences persist via `localStorage` only (`state/persist.ts`); the Image
  Creator's own project persistence (`.bibleql` files) hasn't been built yet. Any new file I/O
  should go through `platform/index.ts`, not straight to `electron`/`node:fs`.
- **contentEditable + React don't mix well** (`features/image-creator/components/TextBox.tsx`).
  React stops reconciling a node's children once `contentEditable` is true, so the DOM keeps
  whatever the user typed even after state changes; when edit mode ends and React resumes
  rendering `{element.text}` as children, it doesn't know a text node is already sitting there
  and inserts its own alongside it — the committed text visibly doubles. Fix: explicitly clear
  the DOM node's `textContent` in the "commit" step, before flipping `contentEditable` back off.
  Also guard that commit function with a ref (not state) against being called twice in the same
  tick — a blur and a "deselected" prop change can both fire from one click.

## Git

The user commits their own work — do not run `git commit` unless explicitly asked to.
