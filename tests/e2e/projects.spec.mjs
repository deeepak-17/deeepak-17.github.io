import { test, expect } from "@playwright/test";
import { skipBoot, waitForApp, waitForLayout } from "./helpers.mjs";

/** Scrolls to a fraction of the pinned chapter whose trigger is #id, then lets the scrub settle. */
async function scrollIntoChapter(page, id, fraction) {
  await page.evaluate(([i, f]) => {
    const st = window.ScrollTrigger.getAll().find((t) => t.pin && t.trigger.closest(".chapter")?.id === i);
    scrollTo(0, st.start + (st.end - st.start) * f);
  }, [id, fraction]);
  await page.waitForTimeout(1600);
}

/** Horizontal scale of an SVG element, whether GSAP wrote it as CSS (Chromium) or as an attribute (WebKit). */
const scaleXOf = (page, sel) =>
  page.locator(sel).evaluate((el) => {
    const css = getComputedStyle(el).transform;
    if (css && css !== "none") return new DOMMatrix(css).a;
    const m = el.transform?.baseVal?.consolidate()?.matrix;
    return m ? m.a : 1;
  });

test.beforeEach(async ({ page }) => { await skipBoot(page); });

test("gigguard sits below clasp with its own heading and a repo link", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("#projects .chapter").evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(["clasp", "gigguard"]);
  await expect(page.locator("#gigguard-title")).toHaveText(/^GigGuard/);
  await expect(page.locator("#clasp-title")).toHaveText(/^CLASP personalises a code LLM/);
  await expect(page.locator("#gigguard .section__cmd-text")).toHaveText("open gigguard");
  await expect(page.locator("#gigguard a[href='https://github.com/deeepak-17/GigGuard']")).toHaveCount(1);
  await expect(page.locator("#clasp a[href='https://github.com/deeepak-17/CLASP']")).toHaveText("source on GitHub");
  await expect(page.locator("#gigguard svg title")).toHaveText(/GigGuard/);
  await expect(page.locator("#projects")).not.toContainText(/hackathon|devtrails|guidewire/i);
});

test.describe("desktop motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitForLayout(page);
  });

  test("both chapters pin", async ({ page }) => {
    await expect(page.locator(".pin-spacer")).toHaveCount(2, { timeout: 5000 });
  });

  test("the gigguard severity gauge fills as you scroll", async ({ page }) => {
    await scrollIntoChapter(page, "gigguard", 0.02);
    expect(await scaleXOf(page, "#gigguard [data-gauge-fill]")).toBeLessThan(0.1);
    await scrollIntoChapter(page, "gigguard", 0.98);
    expect(await scaleXOf(page, "#gigguard [data-gauge-fill]")).toBeGreaterThan(0.95);
  });

  test("the gigguard payout box arrives in the last scene", async ({ page }) => {
    await scrollIntoChapter(page, "gigguard", 0.3);
    const early = await page.locator('#gigguard [data-g="payout"]').evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(early).toBeLessThan(0.1);
    await scrollIntoChapter(page, "gigguard", 0.98);
    const late = await page.locator('#gigguard [data-g="payout"]').evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(late).toBeGreaterThan(0.95);
  });

  test("one gigguard step leads at a time", async ({ page }) => {
    await scrollIntoChapter(page, "gigguard", 0.6);
    const ops = await page.locator("#gigguard .chapter__step").evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
    expect(ops.filter((o) => o > 0.95)).toHaveLength(1);
  });
});

test("reduced motion shows gigguard finished and unpinned", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await skipBoot(page);
  await page.goto("/#projects");
  await page.waitForTimeout(1500);
  expect(await page.locator(".pin-spacer").count()).toBe(0);
  expect(await scaleXOf(page, "#gigguard [data-gauge-fill]")).toBe(1);
  for (const step of await page.locator("#gigguard .chapter__step").all()) {
    expect(Number(await step.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  }
  await context.close();
});

test("open gigguard in the terminal scrolls to the chapter", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await waitForApp(page);
  await waitForLayout(page);
  await page.keyboard.press("Control+k");
  await page.locator("#term-input").fill("open gigguard");
  await page.locator("#term-input").press("Enter");
  await expect(page.locator("#gigguard")).toBeInViewport({ timeout: 5000 });
});
