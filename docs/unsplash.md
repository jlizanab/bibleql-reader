# Unsplash integration

Live search of Unsplash's library for Verse Image Creator backgrounds. This documents the
decisions the spec (`plan bible image.md` §8) asked to have recorded here, verified against
Unsplash's current documentation and a live API call as of 2026-09 (not just recalled from
memory — API terms can change; re-verify before a release if this integration is touched again).

## Authentication — Access Key, embedded client-side

Unsplash's public API supports two auth flows. This app uses **public authentication**:
`Authorization: Client-ID <access-key>`, no user login, no Secret Key involved. Per Unsplash's
own docs, this is "generally cacheable by our system" and is the intended flow for exactly this
kind of client app (many mobile/desktop apps embed just the Access Key).

`UNSPLASH_ACCESS_KEY` is compile-time inlined into the renderer bundle via `define:` in
`electron.vite.config.ts`, loaded from `.env`/`.env.local` — the identical pattern already used
for `BIBLEQL_API_KEY` (see `lib/graphql.ts`). No IPC, no proxy, no Secret Key anywhere in the app.

We use the official [`unsplash-js`](https://github.com/unsplash/unsplash-js) SDK
(`features/image-creator/providers/UnsplashProvider.ts`) rather than a hand-rolled fetch client.
Its own README recommends proxying browser requests through a server so the key isn't visible in
a public website's JS bundle — that threat model doesn't fit here: the key ends up embedded in
the installed binary either way (same as `BIBLEQL_API_KEY` already is), and Unsplash's actual API
documentation describes Client-ID auth as the intended flow for installed client apps with no
user login. `createApi({ accessKey })` is used directly.

### Rate limit — a real, shared constraint

New apps start in **Demo mode: 50 requests/hour**, shared across *every install of this app*,
not per-user (verified live: a single search burns 1 of the 50). Approval for **Production: 1,000
requests/hour** is available via the app's Unsplash dashboard ("Apply for Production") and
requires complying with the API Guidelines below — still one shared pool per access key, not
per-user. If this app gets meaningful distribution, this is the first thing that will need
attention (higher limits beyond 1,000/hr require contacting Unsplash partnerships directly).
Production access is what the checklist at the end of this document is for. A
server-side proxy would allow per-user throttling instead, at the cost of infrastructure the
project doesn't otherwise need — worth reconsidering only if the shared limit becomes a real
problem in practice.

## Only free photos

Unsplash+ (their separate paid stock library) isn't mentioned anywhere in the public API
documentation's photo object fields, request parameters, or the `/search/photos` endpoint —
there's no `plus`/`premium` flag to filter on, and nothing suggesting the public search API
returns anything but the regular, free Unsplash-licensed library. In practice, the public
developer API and Unsplash+ appear to be separate products entirely; this integration only ever
talks to the former, so "only free photos" is the API's default behavior here, not something this
app has to filter for.

## Attribution — mandatory, UTM-tagged

Per the [API Guidelines](https://help.unsplash.com/en/articles/2511315-api-guidelines), every use
of a photo obtained via the API must display: **"Photo by `<photographer>` on Unsplash"**, both
the photographer's name and "Unsplash" as links, each carrying `utm_source=bibleql-reader` and
`utm_medium=referral`.

This is built once, in `features/image-creator/lib/attribution.ts`
(`buildUnsplashAttribution`), and shared by **both** the curated local library
(`data/curatedImages.ts`) and live search (`providers/mapUnsplashPhoto.ts`) — a photo's origin
doesn't change the compliance requirement.

It's rendered in one place too: `components/PhotoCredit.tsx`, used under **every** search-result
thumbnail, under **every** curated thumbnail, and for the selected background. (The grids
previously had the credit only as `title`/`alt` hover text. Strictly, the guideline's "applies to
all uses and not just search results" sentence belongs to the *hotlinking* rule rather than the
attribution one — but visible credits are what a reviewer sees in a screenshot, and it's the
easier thing to defend.) Word order comes from the translated `photoBy` template via
`lib/format.ts`'s `splitTemplate`, not from the component, so Spanish reads "Foto de … en …"
naturally. Both grids are two columns rather than three to make room for the caption.

### ⚠️ The photographer's @handle is not derivable from the filename

The curated entries used to guess the profile URL as `unsplash.com/@{name-slug}`, taking the slug
from Unsplash's download filename convention (`{name-slug}-{11-char-photo-id}-unsplash.jpg`).
That slug is a slugified *display name*, which is a different thing from the account handle —
**all six links 404'd.** Verified against unsplash.com on 2026-09-15:

| photo id | old guess (dead) | actual handle | display name |
|---|---|---|---|
| `9zsHNt5OpqE` | `@aaron-burden` | `aaronburden` | Aaron Burden |
| `Ncn1jiEe-Wc` | `@aaron-burden` | `aaronburden` | Aaron Burden |
| `kBybHJ3CEWI` | `@alicia-quan` | `alicia2joy` | Alicia Quan |
| `DRgrzQQsJDA` | `@rod-long` | `rodlong` | Rod Long |
| `GVRRtaLj3LU` | `@samuel-mcgarrigle` | `tempographics` | Samuel McGarrigle |
| `y2-FG8oiSiQ` | `@wesley-tingey` | `wesleyphotography` | Wesley Tingey |

Display name and handle are now explicit per-entry fields on `CuratedImageSource`, and the
derivation helper is gone, so a slug-derived URL can no longer be expressed.
`data/curatedImages.test.ts` asserts the shape (handles are `[a-z0-9_]+`, never equal to the old
derivation, URLs UTM-tagged) but **cannot prove a handle exists** — verify any new entry, and
re-verify all of them before re-submitting, by opening the photo page by hand.

## Curated library and the hotlinking rule

The six photos under `src/renderer/public/bible-images/` are bundled with the app rather than
hotlinked. That's deliberate and permitted: they were downloaded from unsplash.com under the
**Unsplash License**, not obtained through the API, and the hotlinking rule governs "all API
uses". They're what makes the Image Creator usable with no API key and offline, which is why the
curated tab is the default. Everything that *does* come from the API is hotlinked — see below.

## Triggering a download

The guideline is specific about *which* URL to hit: "you must send a request to the download
endpoint returned under the `photo.links.download_location` property". This is not for the image
bytes — it's purely an analytics counter — and the URL matters as much as the call. The API's
`download_location` carries a signed `ixid` that ties the event back to the search it came from;
a hand-built `/photos/:id/download` still registers a count but drops that correlation, and is
not what the guideline asks for. So `links.download_location` is mapped through
`mapUnsplashPhoto.ts` onto `ImageSearchResult.downloadLocation` and sent verbatim.

**Why a plain `fetch` instead of the SDK:** `unsplash-js` 8.x is an `openapi-fetch` client, and
its generated type for that path declares `query?: never` — so the `ixid` can't be passed through
a typed call at all. (v7's `photos.trackDownload` helper no longer exists.) `triggerDownload` in
`UnsplashProvider.ts` therefore fetches the absolute URL with the same headers `createApi` sends
(`Authorization: Client-ID …`, `Accept-Version: v1`).

Because we attach the access key by hand to a URL that came out of a response body,
`providers/unsplashDownload.ts`'s `isTrackableDownloadLocation` first checks the URL is really
`https://api.unsplash.com/photos/…/download`. Without that guard, an unexpected or tampered
`download_location` would hand the key to whatever host it names.

**When it fires:** on **selecting a search result as the background**
(`selectUnsplashBackground`), fired-and-forgotten so a slow or failed ping never blocks the
editor. That's the guideline's "when a user does something with the photo, usually inserting or
setting it somewhere" — explicitly *not* the moment a result is merely displayed in the grid. It
is not fired again at export time: exporting the finished design is a different action on a
different (final, composited) image.

## Hotlinking and canvas export

Photos are used exactly as Unsplash's guideline requires: the CDN URL (`photo.urls.regular`) is
used directly as the background's image source — never downloaded and rehosted, never cached to
disk. This matters for the export renderer too: `images.unsplash.com` sends
`Access-Control-Allow-Origin: *` (verified live), which is what allows a `<canvas>` to read the
pixels back out for `toBlob()`/clipboard export without a `SecurityError`. Both the editor's
preview `<img>` (`EditorCanvas.tsx`) and the export loader (`rendering/renderProject.ts`) set
`crossOrigin="anonymous"` for the *same* URL — asking for CORS mode inconsistently for one
resource can make the browser reuse a cached non-CORS ("opaque") response either way, tainting
the canvas regardless of what the second request asks for.

## Opening attribution links

An attribution link that doesn't work isn't attribution. Electron's default handling of
`target="_blank"` is to open a bare child `BrowserWindow` — inheriting this app's preload, with no
address bar or back button — which is a poor substitute for the user's own browser and a
hardening gap besides. `src/main/externalLinks.ts` (`attachExternalLinkHandling`, called from
`src/main/index.ts`) installs a `setWindowOpenHandler` that always returns `{ action: "deny" }`
and hands `https:` URLs to `shell.openExternal`, plus a `will-navigate` listener for links
without `target="_blank"` that lets same-origin navigation through (the renderer is a HashRouter
over `file://` in production, `ELECTRON_RENDERER_URL` in dev).

This lives in main rather than behind `platform/index.ts` or an IPC channel because there's no
renderer API surface involved: the renderer markup is already correct plain-web behaviour that a
browser or a future non-Electron shell handles natively. Only the Electron shell misbehaves, so
only the Electron shell is patched — `features/image-creator/**` stays platform-neutral.

Note `rel="noreferrer"` on those anchors does *not* strip the UTM parameters; they live in the
URL, not the `Referer` header.

## Testing

Per this project's standing rule, specs never call the real API:

- **Vitest** (`providers/mapUnsplashPhoto.test.ts`, `lib/attribution.test.ts`) tests the pure
  response-mapping and attribution-building logic against fixture data
  (`providers/__fixtures__/unsplashPhotos.ts`, captured from a real response during development)
  — no network, no SDK instance. `mapUnsplashPhoto` is deliberately split out of
  `UnsplashProvider.ts` (which calls `createApi` at module scope) so it has no dependency on
  `__UNSPLASH_ACCESS_KEY__` being defined, which Vitest's config doesn't do (mirrors
  `electron.vite.config.ts`'s `define`, set to empty strings, in `vitest.config.ts`, as a
  defensive fallback for anything imported transitively).
  Also `providers/unsplashDownload.test.ts` (the download-URL origin guard),
  `data/curatedImages.test.ts` (verified handles, UTM-tagged URLs, relative asset paths) and
  `src/renderer/src/lib/format.test.ts` (`splitTemplate`, which `PhotoCredit` renders through).
  None of them touch the filesystem: `tsconfig.web.json` has no node types on purpose, since the
  renderer runs with `nodeIntegration: false`.
- **E2E** (`e2e/unsplash-search.spec.ts`) intercepts `api.unsplash.com` via Playwright's
  `page.route()` and fulfills it with the same fixture data, so the suite stays deterministic and
  never touches the shared 50/hour demo quota. The fixtures carry an `ixid` on each
  `download_location` so the spec can assert the *pinged URL* contains it (a hand-built path
  can't produce one) along with its `Authorization: Client-ID` header. Both specs scope
  attribution assertions to `getByTestId("selected-attribution")` now that every thumbnail has
  its own credit links; `e2e/image-creator.spec.ts` additionally asserts a curated photographer
  link resolves to the verified handle and that clicking a credit opens no second window.

## Production access checklist

Audited against the [API guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)
(re-fetched 2026-09-15) for the "Apply for Production" review. One row per checklist item, with
the file that implements it, so this can be re-verified later without re-auditing from scratch.

| Requirement | Where it's implemented |
|---|---|
| Photos hotlinked to the original Unsplash URL | `providers/mapUnsplashPhoto.ts` passes `urls.thumb`/`urls.regular` straight through; `UnsplashProvider.ts` stores the CDN URL as the asset's `objectUrl` — never downloaded, proxied or cached. The six bundled curated photos are Unsplash-License downloads, not API uses (see above). |
| Download triggered on use | `UnsplashProvider.ts`'s `triggerDownload`, fetching `links.download_location` verbatim, fired from `selectUnsplashBackground`. |
| No Unsplash logo; name not similar to "Unsplash" | App is **BibleQL Reader** (`package.json` `productName`, appId `org.bibleql.reader`). No Unsplash logo asset in the repo; the Background tab is labelled generically ("Search"/"Buscar"). |
| Accurate app name and description | Submitted description kept in sync with this document's opening paragraph. |
| Photographer and Unsplash attributed and linked | `components/PhotoCredit.tsx`, rendered under every search thumbnail, every curated thumbnail, and for the selected background. Both links UTM-tagged by `lib/attribution.ts`; they open in the system browser via `src/main/externalLinks.ts`. |

**Description submitted to Unsplash** (keep this and the dashboard entry identical):

> A free desktop Bible reader (macOS/Windows/Linux). Its Verse Image Creator lets a reader select
> verses and compose them over a background photo, exported as PNG/JPEG for personal or church
> use. Unsplash powers optional background search: photos are always hotlinked from
> images.unsplash.com and never rehosted, every photo displays "Photo by \<photographer\> on
> Unsplash" with both links UTM-tagged, and a download is triggered via `links.download_location`
> the moment a photo is set as a background.

Before submitting, confirm `APP_SLUG` in `features/image-creator/lib/attribution.ts` still matches
the `utm_source` the Unsplash app dashboard expects, and re-verify the six curated handles.
