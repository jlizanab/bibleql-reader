import { test, expect } from "@playwright/test";
import { launchApp, goTo, type App } from "./helpers";

// Requires the app to have been built with a real BIBLEQL_API_KEY (see
// `npm run test:e2e` / CI) — verse selection hands off real passage data
// fetched by the editor, which the app's own no-key sample fallback
// doesn't cover (that fallback only feeds the Reader, not the editor's
// re-fetch). Locally this works via .env.local; in CI the workflow
// passes the same repo secret release builds already use.
test.describe("Image Creator", () => {
  let ctx: App;

  test.beforeEach(async () => {
    ctx = await launchApp();
    const { page } = ctx;

    // Wait for the default route to actually mount before touching the
    // hash ourselves — changing it too early can race RootRedirect's own
    // pending navigation.
    await page.waitForSelector("[data-verse]");
    await goTo(page, "#/read/JHN/3/ai");
    await page.waitForSelector('p[data-verse="16"]');

    // Click verse 16, shift-click verse 17 to extend the range — no
    // checkbox, per this app's selection UI (see VerseList.tsx). .first():
    // only the primary column is ever selectable, but both would match
    // if "Compare" happened to be on.
    await page.locator('p[data-verse="16"]').first().click({ position: { x: 20, y: 10 } });
    await page.locator('p[data-verse="17"]').first().click({ modifiers: ["Shift"], position: { x: 20, y: 10 } });

    await page.getByRole("button", { name: /Create Image|Crear imagen/i }).click();
    await page.waitForSelector('[role="textbox"]');
  });

  test.afterEach(async () => {
    await ctx.app.close();
    await ctx.cleanup();
  });

  test("hands off the selected verses as scripture + reference elements", async () => {
    const { page } = ctx;
    const textBoxes = page.locator('[role="textbox"]');
    await expect(textBoxes).toHaveCount(2);

    const reference = textBoxes.filter({ hasText: /\d+:\d/ });
    await expect(reference).toContainText("3:16");

    const scripture = textBoxes.filter({ hasNotText: /^\D*\d+:\d/ });
    await expect(scripture).toContainText("God so loved the world");
  });

  test("selecting a curated background applies it with attribution", async () => {
    const { page } = ctx;
    // "Curated" is the default Background tab — no tab click needed.
    const thumb = page.locator("img[src*='bible-images/thumb/']").first();
    await thumb.waitFor();
    await thumb.click();

    await expect(page.locator("img[src*='bible-images/full/']")).toBeVisible();
    // Not getByText: the "Unsplash" background-source tab shares that text.
    await expect(page.getByRole("link", { name: "Unsplash" })).toBeVisible();
  });

  test("double-clicking the scripture text enters edit mode and commits a shortened version", async () => {
    const { page } = ctx;
    const scripture = page.locator('[role="textbox"]').filter({ hasNotText: /^\D*\d+:\d/ });

    await scripture.dblclick();
    await expect(scripture).toHaveAttribute("contenteditable", "true");

    // Entering edit mode selects the existing text, so Backspace clears
    // it before typing the replacement.
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Shortened version.");
    await page.keyboard.press("Escape");

    await expect(scripture).toHaveAttribute("contenteditable", "false");
    await expect(scripture).toHaveText("Shortened version.");
  });

  test("copying the image places real PNG bytes on the clipboard", async () => {
    const { page } = ctx;
    await page.getByRole("button", { name: /Copy Image|Copiar imagen/i }).click();
    await expect(page.getByText(/Copied|Copiado/i)).toBeVisible({ timeout: 10_000 });

    const clipboardHasPng = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      return items.some((item) => item.types.includes("image/png"));
    });
    expect(clipboardHasPng).toBe(true);
  });
});
