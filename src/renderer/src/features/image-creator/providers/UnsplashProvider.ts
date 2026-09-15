import { createApi } from "unsplash-js";
import { putImageAsset } from "../assets/imageAssets";
import { mapUnsplashPhoto } from "./mapUnsplashPhoto";
import type { Background } from "../model/types";
import type { ImageProvider, ImageSearchPage, ImageSearchResult } from "./ImageProvider";

const PER_PAGE = 24;

// The official Unsplash SDK's own README suggests proxying browser
// requests through a server so the access key isn't visible in a public
// website's bundle. That threat model doesn't fit a downloaded desktop
// app: the key ends up embedded in the installed binary either way, no
// differently than BIBLEQL_API_KEY already is (see docs/unsplash.md) —
// and Unsplash's own API docs describe exactly this Client-ID flow as
// the intended one for installed/client apps with no user login.
export const HAS_UNSPLASH_KEY = Boolean(__UNSPLASH_ACCESS_KEY__);

const unsplash = createApi({ accessKey: __UNSPLASH_ACCESS_KEY__ });

async function search(query: string, page = 1): Promise<ImageSearchPage> {
  const result = await unsplash.GET("/search/photos", {
    params: { query: { query, page, per_page: PER_PAGE, content_filter: "high" } }
  });

  if (result.error) {
    throw new Error(result.error.errors?.[0] ?? "Unsplash search failed.");
  }

  return {
    results: result.data.results.map(mapUnsplashPhoto),
    page,
    hasMore: page < result.data.total_pages
  };
}

function triggerDownload(imageResult: ImageSearchResult): void {
  // Fire-and-forget, per the guideline ("trigger a GET request... don't
  // let it block the user's action") — a failed tracking ping shouldn't
  // disrupt the editor.
  void unsplash.GET("/photos/{id}/download", { params: { path: { id: imageResult.id } } }).catch(() => {});
}

export const unsplashProvider: ImageProvider = { search, triggerDownload };

/**
 * Turns a search result the user picked into a ready-to-use `Background`.
 * The image is hotlinked directly from Unsplash's CDN (per the API
 * guideline — never downloaded/rehosted); its CORS headers permit
 * `crossOrigin="anonymous"` loading, which is what lets the export
 * renderer read it back out of a `<canvas>` (see rendering/renderProject.ts).
 *
 * Also fires the required download-tracking ping — this is the moment
 * the guideline means by "setting" the photo, not the original search.
 */
export function selectUnsplashBackground(result: ImageSearchResult): Background {
  triggerDownload(result);

  const assetId = crypto.randomUUID();
  putImageAsset(assetId, { objectUrl: result.previewUrl, width: result.width, height: result.height });

  return {
    type: "unsplash",
    assetId,
    sourceId: result.id,
    width: result.width,
    height: result.height,
    attribution: result.attribution,
    crop: { x: 0.5, y: 0.5, scale: 1 }
  };
}
