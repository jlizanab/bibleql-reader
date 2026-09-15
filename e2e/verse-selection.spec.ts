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
    await ctx.cleanup();
  });

  // .first() throughout: with "Compare" on, both translation columns
  // render a p[data-verse="16"] — only the first (primary) column is
  // ever selectable (see ReaderPane.tsx), so that's always the intended
  // match regardless of compare state.

  test("clicking a verse selects it without a checkbox", async () => {
    const { page } = ctx;
    const verse16 = page.locator('p[data-verse="16"]').first();

    await expect(verse16).toHaveAttribute("data-sel", "off");
    await verse16.click({ position: { x: 20, y: 10 } });
    await expect(verse16).toHaveAttribute("data-sel", "on");
    await expect(page.getByText(/1 selected|1 seleccionado/i)).toBeVisible();

    // No checkbox element anywhere in the verse — selection is the click
    // target itself (per this app's design).
    await expect(verse16.locator("input, [type='checkbox']")).toHaveCount(0);
  });

  test("clicking again deselects the verse", async () => {
    const { page } = ctx;
    const verse16 = page.locator('p[data-verse="16"]').first();

    await verse16.click({ position: { x: 20, y: 10 } });
    await expect(verse16).toHaveAttribute("data-sel", "on");

    await verse16.click({ position: { x: 20, y: 10 } });
    await expect(verse16).toHaveAttribute("data-sel", "off");
    await expect(page.getByText(/selected|seleccionado/i)).toHaveCount(0);
  });

  test("the selected outline is visible immediately, even while still hovered", async () => {
    // Regression test: `.selectable:hover` and `[data-sel="on"]` both set
    // `outline` (a non-stacking property) with equal CSS specificity —
    // without `:not([data-sel="on"])` on the hover rule, the hover style
    // (being later in the stylesheet) wins while the cursor is still
    // over the verse, so the accent-colored selected outline only became
    // visible once the mouse moved away. Assert the *computed* outline
    // color right after the click, cursor still in place — not just the
    // data-sel attribute, which was already correct even when this bug
    // was present.
    const { page } = ctx;
    const verse16 = page.locator('p[data-verse="16"]').first();

    await verse16.hover({ position: { x: 20, y: 10 } });
    await verse16.click({ position: { x: 20, y: 10 } });

    const [outlineColor, outlineStyle, accentColor] = await page.evaluate(() => {
      const el = document.querySelector('p[data-verse="16"]')!;
      const style = getComputedStyle(el);
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      return [style.outlineColor, style.outlineStyle, accent];
    });

    // Both read back as computed rgb() strings — comparing via a shared
    // temp element normalizes the accent CSS variable to the same format.
    const normalized = await page.evaluate((color) => {
      const probe = document.createElement("div");
      probe.style.color = color;
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      probe.remove();
      return rgb;
    }, accentColor);

    expect(outlineStyle).toBe("dashed"); // not "none" — the hover rule didn't suppress it
    expect(outlineColor).toBe(normalized);
  });

  test("shift-click extends a range without leaving a native text selection", async () => {
    const { page } = ctx;
    await page.locator('p[data-verse="16"]').first().click({ position: { x: 20, y: 10 } });
    await page.locator('p[data-verse="18"]').first().click({ modifiers: ["Shift"], position: { x: 20, y: 10 } });

    await expect(page.getByText(/3 selected|3 seleccionado/i)).toBeVisible();
    for (const n of [16, 17, 18]) {
      await expect(page.locator(`p[data-verse="${n}"]`).first()).toHaveAttribute("data-sel", "on");
    }

    const nativeSelection = await page.evaluate(() => window.getSelection()?.toString());
    expect(nativeSelection).toBe("");
  });

  test("Clear empties the selection and hides the selection bar", async () => {
    const { page } = ctx;
    await page.locator('p[data-verse="16"]').first().click({ position: { x: 20, y: 10 } });
    await expect(page.getByText(/1 selected|1 seleccionado/i)).toBeVisible();

    await page.getByRole("button", { name: /Clear|Borrar/i }).click();
    await expect(page.getByText(/selected|seleccionado/i)).toHaveCount(0);
    await expect(page.locator('p[data-verse="16"]').first()).toHaveAttribute("data-sel", "off");
  });
});
