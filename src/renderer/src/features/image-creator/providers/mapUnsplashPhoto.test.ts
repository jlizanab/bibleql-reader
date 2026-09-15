import { describe, expect, it } from "vitest";
import { mapUnsplashPhoto } from "./mapUnsplashPhoto";
import { MOUNTAIN_PHOTO } from "./__fixtures__/unsplashPhotos";

// Pure-mapping only — no network call, no SDK instance (mapUnsplashPhoto
// is deliberately split out of UnsplashProvider.ts for exactly this).
describe("mapUnsplashPhoto", () => {
  it("maps a search result to this app's provider-neutral shape", () => {
    const result = mapUnsplashPhoto(MOUNTAIN_PHOTO);

    expect(result.id).toBe("Bkci_8qcdvQ");
    expect(result.thumbnailUrl).toBe(MOUNTAIN_PHOTO.urls.thumb);
    expect(result.previewUrl).toBe(MOUNTAIN_PHOTO.urls.regular);
    expect(result.width).toBe(5760);
    expect(result.height).toBe(3840);
  });

  it("builds UTM-tagged attribution from the photo's user", () => {
    const result = mapUnsplashPhoto(MOUNTAIN_PHOTO);

    expect(result.attribution.photographerName).toBe("Kalen Emsley");
    expect(result.attribution.sourceName).toBe("Unsplash");
    expect(result.attribution.photographerUrl).toContain("unsplash.com/@kalenemsley");
    expect(result.attribution.photographerUrl).toContain("utm_source=bibleql-reader");
    expect(result.attribution.sourceUrl).toContain("utm_medium=referral");
  });
});
