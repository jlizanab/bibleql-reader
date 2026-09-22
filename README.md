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

[Tauri 2](https://tauri.app) + React + TypeScript, built with [Vite](https://vite.dev). The UI runs
in the platform's own webview and the shell is a small Rust binary, so there's no bundled browser
engine. Server state (translations, passages, concordance, search) is managed with
[TanStack Query](https://tanstack.com/query), navigation with
[React Router](https://reactrouter.com) (hash-based), and styling with Sass — a single token
partial (`src/styles/_tokens.scss`) drives both the light and dark palettes as CSS custom
properties, and every component has its own colocated `.module.scss`.

```
src/         the React app (components/, features/, queries/, hooks/, state/, lib/, data/, styles/)
  platform/  the one seam onto the desktop shell — see docs/platform-abstraction.md
src-tauri/   the Rust shell: window config, plugin registration, capability permissions
```

## Running as a desktop app

Needs [Node](https://nodejs.org), [Yarn](https://yarnpkg.com) and a
[Rust toolchain](https://www.rust-lang.org/tools/install) (plus Tauri's
[system prerequisites](https://tauri.app/start/prerequisites/) — Xcode command line tools on macOS,
WebView2 on Windows, `libwebkit2gtk` on Linux).

```bash
yarn install
cp .env.example .env   # set BIBLEQL_API_KEY
yarn tauri dev         # Rust shell + Vite dev server, with HMR
yarn tauri build       # type-checks, runs unit tests, then bundles installers
```

`yarn dev` on its own serves just the frontend in a browser at http://localhost:1420 — useful for
UI work, though the native Save-As dialog and the AI assistant need the real shell.

Requests go to `https://bibleql.org/graphql` with an `Authorization: Bearer` header. The BibleQL
key comes from `BIBLEQL_API_KEY` in `.env` (loaded via `dotenv`) and is compiled into the app at
build time — it's never entered by end users and never committed. Release builds get their key the
same way, from a `BIBLEQL_API_KEY` GitHub Actions secret set on the workflow. Without a key, the
reader shows a bundled public-domain sample chapter (Psalm 23).

The AI assistant calls Claude via the [Vercel AI SDK](https://ai-sdk.dev) (`src/lib/ai.ts`), with
the request itself issued by the Rust side through Tauri's HTTP plugin — `api.anthropic.com`
refuses cross-origin requests. (The plugin still attaches its own `Origin`, so the call also
opts in via `anthropic-dangerous-direct-browser-access`; the key is the user's own and the
request is made by the Rust process, not by a page anyone else can script.) Unlike the two keys above, the Anthropic key is never compiled in:
it's entered per-user from the key dialog (key icon in the title bar) and stored locally — never
committed or sent anywhere else.

Get a BibleQL key at https://bibleql.org/api-keys/request/new (docs: https://docs.bibleql.org) and
an Anthropic key at https://console.anthropic.com.

## Running tests

```bash
yarn test       # Vitest — pure-logic unit tests (no network, no shell)
yarn test:e2e   # Playwright — builds the app, then drives it in a browser
```

`yarn test` covers things like project serialization, layout math, and reference formatting —
fast, and safe to run without any keys configured. `yarn test:e2e` (`e2e/*.spec.ts`) drives the app
like a user would: selecting verses, handing off to the Verse Image Creator, picking a background,
editing text, exporting. It runs the same bundle in headless Chromium rather than in the Tauri
window, because Tauri's own WebDriver harness (`tauri-driver`) has no macOS support at all; the
handful of genuine shell calls are stubbed and recorded (see `e2e/helpers.ts`). It builds the app
and serves it with `vite preview`, so it wants a real `BIBLEQL_API_KEY` in the environment, since
the editor's passage fetch isn't covered by the no-key sample fallback. CI (`.github/workflows/ci.yml`) runs both suites plus
a `cargo check` of the Rust shell on every pull request.

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
