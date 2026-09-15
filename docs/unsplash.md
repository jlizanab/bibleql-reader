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
attention (higher limits beyond 1,000/hr require contacting Unsplash partnerships directly). A
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
doesn't change the compliance requirement. `BackgroundPanel.tsx` renders it as two links whenever
`background.attribution` is set, for any background type.

## Triggering a download

The guideline requires a `GET /photos/:id/download` ping — not for the image bytes themselves,
purely an analytics counter — "when a user does something with the photo, usually inserting or
setting it somewhere" (explicitly *not* the same moment as displaying it in search results).

In this app, that moment is **selecting a search result as the background**
(`selectUnsplashBackground` in `UnsplashProvider.ts`), fired-and-forgotten so a slow or failed
ping never blocks the editor. It is not fired again at export time — the guideline's definition
of "download" is the insert/set action, and exporting the finished design is a different action
on a different (final, composited) image.

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
- **E2E** (`e2e/unsplash-search.spec.ts`) intercepts `api.unsplash.com` via Playwright's
  `page.route()` and fulfills it with the same fixture data, so the suite stays deterministic and
  never touches the shared 50/hour demo quota.
