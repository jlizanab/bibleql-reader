import type { Attribution } from "../model/types";

// Provider abstraction (spec §8) so components never call an image source
// directly. The Unsplash implementation of this interface arrives in a
// later phase; this slice only needs the shape to exist so nothing has to
// be refactored when it does.
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

export interface ImageAsset {
  id: string;
  url: string;
  width: number;
  height: number;
  attribution: Attribution;
}

export interface ImageProvider {
  search(query: string, page?: number): Promise<ImageSearchPage>;
  getImage(id: string): Promise<ImageAsset>;
}
