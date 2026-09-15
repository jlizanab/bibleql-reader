import type { Attribution } from "../model/types";

// Provider abstraction (spec §8) so components never call an image source
// directly — UnsplashProvider.ts is the only thing that knows about
// Unsplash specifically.
export interface ImageSearchResult {
  id: string;
  thumbnailUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  attribution: Attribution;
}

export interface ImageSearchPage {
  results: ImageSearchResult[];
  page: number;
  hasMore: boolean;
}

export interface ImageProvider {
  search(query: string, page?: number): Promise<ImageSearchPage>;
  /**
   * Fire-and-forget download-tracking ping, required whenever a photo is
   * actually used (not merely displayed in search results) — see
   * docs/unsplash.md.
   */
  triggerDownload(result: ImageSearchResult): void;
}
