import type { Attribution } from "../model/types";

// A small, fixed, developer-curated background library (spec's "Flow C
// / curated-local-library" option) — bundled under
// src/renderer/public/bible-images/ so Vite serves it as static files
// (thumb/ for the picker grid, full/ for the actual background) rather
// than importing each photo through the JS bundle. Originals came from
// /Users/lporras/Pictures/bible_images (already-downloaded Unsplash
// photos); each was resized once (thumb ≤480px, full ≤2000px — comfortably
// above every social preset in model/presets.ts) to keep the app's
// install size reasonable, then copied here — the ~/Pictures originals
// were left untouched.
//
// Attribution is still required and preserved even though these aren't
// fetched live (spec §8): photographer name and photo id were parsed
// from Unsplash's own download filename convention
// (`{name-slug}-{11-char-photo-id}-unsplash.jpg` — the id is always
// exactly 11 characters, which is what makes the split reliable even
// though the id itself can contain a "-"). `photographerUrl` assumes the
// Unsplash username matches the name slug, which is Unsplash's own
// convention but isn't guaranteed — worth double-checking if a listed
// photographer's profile link ever 404s.
export interface CuratedImage {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  attribution: Attribution;
}

function unsplashAttribution(nameSlug: string, photoId: string, nameOverride?: string): Attribution {
  const photographerName =
    nameOverride ??
    nameSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  return {
    photographerName,
    photographerUrl: `https://unsplash.com/@${nameSlug}`,
    sourceName: "Unsplash",
    sourceUrl: `https://unsplash.com/photos/${photoId}`
  };
}

function curated(
  fileName: string,
  nameSlug: string,
  photoId: string,
  width: number,
  height: number,
  nameOverride?: string
): CuratedImage {
  return {
    id: photoId,
    // Relative, not "/bible-images/..." — the production build loads
    // index.html over file:// (see App.tsx's HashRouter), where a
    // leading "/" resolves against the filesystem root, not the app's
    // own out/renderer directory. electron-vite already builds
    // index.html's own <script>/<link> tags relative for the same
    // reason; this matches that.
    thumbUrl: `bible-images/thumb/${fileName}`,
    fullUrl: `bible-images/full/${fileName}`,
    width,
    height,
    attribution: unsplashAttribution(nameSlug, photoId, nameOverride)
  };
}

export const CURATED_IMAGES: CuratedImage[] = [
  curated("aaron-burden-9zsHNt5OpqE-unsplash.jpg", "aaron-burden", "9zsHNt5OpqE", 2000, 1500),
  curated("aaron-burden-Ncn1jiEe-Wc-unsplash.jpg", "aaron-burden", "Ncn1jiEe-Wc", 1429, 2000),
  curated("alicia-quan-kBybHJ3CEWI-unsplash.jpg", "alicia-quan", "kBybHJ3CEWI", 2000, 1500),
  curated("rod-long-DRgrzQQsJDA-unsplash.jpg", "rod-long", "DRgrzQQsJDA", 2000, 1333),
  curated("samuel-mcgarrigle-GVRRtaLj3LU-unsplash.jpg", "samuel-mcgarrigle", "GVRRtaLj3LU", 2000, 1333, "Samuel McGarrigle"),
  curated("wesley-tingey-y2-FG8oiSiQ-unsplash.jpg", "wesley-tingey", "y2-FG8oiSiQ", 1333, 2000)
];
