import { test, expect } from "@playwright/test";
import { skipBoot, waitForApp, waitForLayout } from "./helpers.mjs";

test.describe("desktop", () => {
  test.beforeEach(async ({ page }) => {
    await skipBoot(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await waitForApp(page);
    await waitForLayout(page);
  });

  test("tab completion keeps focus in the input", async ({ page }) => {
    await page.keyboard.press("`");
    await page.locator("#term-input").fill("pro");
    await page.locator("#term-input").press("Tab");
    await expect(page.locator("#term-input")).toHaveValue("projects ");
    await expect(page.locator("#term-input")).toBeFocused();
  });

  test("unreached CLASP steps stay readable when the pin starts", async ({ page }) => {
    const top = await page.evaluate(() => document.querySelector("#clasp .chapter__body").getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y - 64 + 5), top);
    await page.waitForTimeout(300);
    const opacities = await page.locator("#clasp .chapter__step").evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
    for (const o of opacities) expect(o).toBeGreaterThanOrEqual(0.45);
  });

  test("hero facts render from the same content as neofetch", async ({ page }) => {
    await expect(page.locator(".facts")).toContainText("Studying");
    await page.keyboard.press("`");
    await page.locator("#term-input").fill("neofetch");
    await page.locator("#term-input").press("Enter");
    await expect(page.locator("#term-output")).toContainText("Studying");
  });

  test("CLASP ends with something to act on", async ({ page }) => {
    await expect(page.locator("#clasp a[href^='mailto:'], #clasp a[href^='https://github.com']")).toHaveCount(1);
  });

  test("contact heading is specific to this page", async ({ page }) => {
    await expect(page.locator("#contact-title")).not.toHaveText(/Let.s build something/);
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  test.skip(({ browserName }) => browserName === "webkit", "isMobile emulation is Chromium-only");

  test.beforeEach(async ({ page }) => {
    await skipBoot(page);
    await page.goto("/");
    await waitForApp(page);
  });

  test("terminal input is at least 16px so iOS does not zoom", async ({ page }) => {
    await page.locator("#term-toggle").tap();
    const size = await page.locator("#term-input").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  });

  test("opening on touch does not raise the keyboard over the chips", async ({ page }) => {
    await page.locator("#term-toggle").tap();
    await expect(page.locator("#term-drawer")).toBeVisible();
    await expect(page.locator("#term-input")).not.toBeFocused();
    await expect(page.locator(".term-chips button").first()).toBeInViewport();
  });

  test("diagram labels stay legible (svg at least 560px wide)", async ({ page }) => {
    const w = await page.locator("#clasp .chapter__figure svg").evaluate((el) => el.getBoundingClientRect().width);
    expect(w).toBeGreaterThanOrEqual(560);
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw);
  });

  test("terminal toggle never covers the end of the page", async ({ page }) => {
    const pad = await page.locator("main").evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    expect(pad).toBeGreaterThanOrEqual(52);
  });

  test("skills fit in a compact ls layout", async ({ page }) => {
    const h = await page.locator("#skills").evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThan(1300);
  });
});
