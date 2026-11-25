import { test, expect } from "@playwright/test";
import { skipBoot, waitForLayout } from "./helpers.mjs";

async function scrollIntoChapter(page, fraction) {
  await page.evaluate((f) => {
    const st = window.ScrollTrigger.getAll().find((t) => t.pin);
    scrollTo(0, st.start + (st.end - st.start) * f);
  }, fraction);
  await page.waitForTimeout(1600); // let the scrub smoothing settle
}

/** GSAP writes SVG transforms as CSS in Chromium and as the transform attribute in WebKit; read whichever is set. */
const transformOf = (el) => {
  const css = getComputedStyle(el).transform;
  if (css && css !== "none") return css;
  const attr = el.getAttribute("transform");
  if (!attr) return "none";
  const m = el.transform.baseVal.consolidate()?.matrix;
  return m && (m.a !== 1 || m.b || m.c || m.d !== 1 || m.e || m.f) ? attr : "none";
};
const matrixOf = (page, sel) => page.locator(sel).evaluate((el, src) => new Function(`return (${src})`)()(el), transformOf.toString());
const dashOf = (page, sel) => page.locator(sel).first().evaluate((el) => Number(getComputedStyle(el).strokeDashoffset.replace("px", "")));

test.describe("CLASP diagram animates on desktop", () => {
  test.beforeEach(async ({ page }) => {
    await skipBoot(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitForLayout(page);
  });

  test("the pin is about three screens long", async ({ page }) => {
    const len = await page.evaluate(() => { const st = window.ScrollTrigger.getAll().find((t) => t.pin); return (st.end - st.start) / innerHeight; });
    expect(len).toBeGreaterThanOrEqual(2.8);
  });

  test("adapters start displaced and snap onto the base by the end", async ({ page }) => {
    await scrollIntoChapter(page, 0.02);
    const early = await matrixOf(page, '[data-layer="client"]');
    expect(early).not.toBe("none");
    await scrollIntoChapter(page, 0.98);
    const late = await matrixOf(page, '[data-layer="client"]');
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(late);
  });

  test("lines draw from undrawn to drawn", async ({ page }) => {
    await scrollIntoChapter(page, 0.02);
    expect(await dashOf(page, ".dg-flow")).toBeGreaterThan(0.5);
    await scrollIntoChapter(page, 0.98);
    expect(await dashOf(page, ".dg-flow")).toBeLessThan(0.05);
  });

  test("update dots travel during the training scene", async ({ page }) => {
    await expect(page.locator("#clasp .dg-dot")).toHaveCount(6);
    await scrollIntoChapter(page, 0.37); // scene 2 travel window: timeline 3.8 to 5.0 of 12
    const moved = await matrixOf(page, ".dg-dot >> nth=0");
    expect(moved).not.toBe("none");
  });

  test("the current step leads and the others dim", async ({ page }) => {
    await scrollIntoChapter(page, 0.6);
    const ops = await page.locator("#clasp .chapter__step").evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
    expect(Math.max(...ops)).toBeGreaterThan(0.95);
    expect(ops.filter((o) => o > 0.95)).toHaveLength(1);
  });
});

test("reduced motion shows the finished diagram with no moving parts", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await skipBoot(page);
  await page.goto("/#projects");
  await page.waitForTimeout(1500);
  expect(await matrixOf(page, '[data-layer="client"]')).toBe("none");
  expect(await page.locator(".dg-dot").first().evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
  expect(await dashOf(page, ".dg-flow")).toBe(0);
  await context.close();
});
