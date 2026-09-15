import { test, expect } from "@playwright/test";
import { launchApp, goTo, type App } from "./helpers";

test.describe("Reader verse selection", () => {
  let ctx: App;

  test.beforeEach(async () => {
    ctx = await launchApp();
    const { page } = ctx;
    await page.waitForSelector("[data-verse]");
    await goTo(page, "#/read/JHN/3/ai");
    await page.waitForSelector('p[data-verse="16"]');
  });

  test.afterEach(async () => {
    await ctx.app.close();
  });

  test("clicking a verse selects it without a checkbox", async () => {
    const { page } = ctx;
    const verse16 = page.locator('p[data-verse="16"]');

    await expect(verse16).toHaveAttribute("data-sel", "off");
    await verse16.click({ position: { x: 20, y: 10 } });
    await expect(verse16).toHaveAttribute("data-sel", "on");
    await expect(page.getByText(/1 selected|1 seleccionado/i)).toBeVisible();

    // No checkbox element anywhere in the verse — selection is the click
    // target itself (per this app's design).
    await expect(verse16.locator("input, [type='checkbox']")).toHaveCount(0);
  });

  test("shift-click extends a range without leaving a native text selection", async () => {
    const { page } = ctx;
    await page.click('p[data-verse="16"]', { position: { x: 20, y: 10 } });
    await page.click('p[data-verse="18"]', { modifiers: ["Shift"], position: { x: 20, y: 10 } });

    await expect(page.getByText(/3 selected|3 seleccionado/i)).toBeVisible();
    for (const n of [16, 17, 18]) {
      await expect(page.locator(`p[data-verse="${n}"]`)).toHaveAttribute("data-sel", "on");
    }

    const nativeSelection = await page.evaluate(() => window.getSelection()?.toString());
    expect(nativeSelection).toBe("");
  });

  test("Clear empties the selection and hides the selection bar", async () => {
    const { page } = ctx;
    await page.click('p[data-verse="16"]', { position: { x: 20, y: 10 } });
    await expect(page.getByText(/1 selected|1 seleccionado/i)).toBeVisible();

    await page.getByRole("button", { name: /Clear|Borrar/i }).click();
    await expect(page.getByText(/selected|seleccionado/i)).toHaveCount(0);
    await expect(page.locator('p[data-verse="16"]')).toHaveAttribute("data-sel", "off");
  });
});
