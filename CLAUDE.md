# CLAUDE.md

Guidance for agents working in this repository.

## What this is

Electron 44 + electron-vite 5 + React 19 + TypeScript 5.9 (strict) desktop Bible reader over the
BibleQL GraphQL API (`https://bibleql.org/graphql`). `"type": "module"`. Small codebase (~2.6k
lines) — read the neighbouring file before inventing a pattern; there is almost always precedent.

## Commands

```bash
npm run dev             # electron-vite dev, HMR
npm run build           # typecheck (both tsconfig projects), then electron-vite build
npm run typecheck       # tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json
npm test                # vitest run (once added — see below)
npm run dist:mac|win|linux
```

No ESLint/Prettier. Match surrounding style by hand.

## Layout

```
src/
  main/           Electron main process — window setup, ipc/ (currently just ai.ts)
  preload/        contextBridge — exposes window.desktop and window.ai to the renderer
  renderer/src/
    components/   Reader/, Sidebar/, StudyPanel/, TitleBar/, + a few standalone (Spinner, icons…)
    routes/       route-level composition shells (thin — pull their own state/data)
    queries/      TanStack Query hooks, one per BibleQL query, key factory in keys.ts
    state/        AppStateContext (Context + useReducer) + persist.ts (localStorage)
    lib/          graphql client, refs.ts (book/reference helpers), speech.ts
    data/         static data: books.ts, strings.ts (i18n), sample.ts, fallbackTranslations.ts
    types/        shared TS types (bible.ts, app.ts, ai.ts)
    styles/       _tokens.scss (palette), _theme.scss (tokens → CSS vars), _mixins.scss, global.scss
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
  (`window.desktop`, `window.ai`), with the `Window` augmentation declared in
  `src/preload/index.d.ts`. New IPC should follow this shape rather than a single kitchen-sink
  namespace.

## Gotchas

- **Frameless window** (`titleBarStyle: "hiddenInset"` on macOS, `titleBarOverlay` elsewhere,
  set in `src/main/index.ts`). Any new full-window route needs its own
  `-webkit-app-region: drag` region and must honour `hooks/useOverlayInset.ts` on Windows/Linux —
  don't assume OS chrome exists.
- `noUnusedLocals: true` in **both** tsconfig projects — leftover scaffolding breaks
  `npm run typecheck`.
- Types shared between main/preload and the renderer must be added to `tsconfig.node.json`'s
  `include` array (today it hardcodes just `src/renderer/src/types/ai.ts`).
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
- No filesystem/dialog/clipboard IPC exists yet; persistence today is `localStorage` only
  (`state/persist.ts`). If you add file I/O, isolate it behind an adapter interface rather than
  calling `electron`/`node:fs` APIs directly from renderer-adjacent domain code — see
  `docs/platform-abstraction.md` if present.

## Git

The user commits their own work — do not run `git commit` unless explicitly asked to.
