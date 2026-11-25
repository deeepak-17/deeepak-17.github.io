import { test, expect } from "@playwright/test";
import { skipBoot, waitForLayout } from "./helpers.mjs";

const EMAIL = "deepaksenthilkumar242@gmail.com";
const settle = (page) => page.waitForTimeout(900);
const scrollToEl = (page, sel, offsetVh) =>
  page.evaluate(([s, o]) => { const el = document.querySelector(s); scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * o); }, [sel, offsetVh]);
/** Reads a transform whether GSAP wrote it as CSS (Chromium) or an attribute (WebKit SVG). */
const isMoved = (page, sel) => page.locator(sel).first().evaluate((el) => {
  const t = getComputedStyle(el).transform;
  return Boolean(t && t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)");
});

test.describe("desktop scroll motion", () => {
  test.beforeEach(async ({ page }) => {
    await skipBoot(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitForLayout(page);
    await page.waitForFunction(() => document.documentElement.dataset.motion === "ready");
  });

  test("progress bar fills as the page scrolls", async ({ page }) => {
    const at = async () => page.locator(".scroll-progress").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(await at()).toBeLessThan(0.05);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2));
    await settle(page);
    const mid = await at();
    expect(mid).toBeGreaterThan(0.3);
    expect(mid).toBeLessThan(0.7);
  });

  test("each section has a cd line that types in as it scrolls into view", async ({ page }) => {
    for (const id of ["about", "skills", "projects", "contact"]) {
      await expect(page.locator(`#${id} > .section__head .section__cmd-text`)).toHaveAttribute("data-type", `cd ${id}`);
    }
    for (const id of ["clasp", "gigguard"]) {
      await expect(page.locator(`#${id} > .section__head .section__cmd-text`)).toHaveAttribute("data-type", `open ${id}`);
    }
    expect((await page.locator("#about .section__cmd-text").textContent()).length).toBeLessThan("cd about".length);
    await scrollToEl(page, "#about", 0.1);
    await settle(page);
    await expect(page.locator("#about .section__cmd-text")).toHaveText("cd about");
  });

  test("heading words rise into place", async ({ page }) => {
    expect(await isMoved(page, "#skills .section__title .w > span")).toBe(true);
    await scrollToEl(page, "#skills", 0.1);
    await settle(page);
    expect(await isMoved(page, "#skills .section__title .w > span")).toBe(false);
  });

  test("each project heading types its open line and its words rise, like a section heading", async ({ page }) => {
    for (const id of ["clasp", "gigguard"]) {
      const head = `#${id} > .section__head`;
      expect(await isMoved(page, `${head} .section__title .w > span`)).toBe(true);
      await scrollToEl(page, head, 0.1);
      await settle(page);
      expect(await isMoved(page, `${head} .section__title .w > span`)).toBe(false);
      await expect(page.locator(`${head} .section__cmd-text`)).toHaveText(`open ${id}`);
    }
  });

  test("hero copy drifts and fades as you leave it", async ({ page }) => {
    await page.evaluate(() => scrollTo(0, 450));
    await settle(page);
    expect(await isMoved(page, ".hero__copy")).toBe(true);
    expect(Number(await page.locator(".facts").evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1);
  });

  test("about education entries slide in", async ({ page }) => {
    expect(await isMoved(page, ".edu li")).toBe(true);
    await scrollToEl(page, "#about", 0);
    await settle(page);
    expect(await isMoved(page, ".edu li")).toBe(false);
  });

  test("skill items print in like ls output", async ({ page }) => {
    const firstOpacity = () => page.locator(".skill__items li").first().evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(await firstOpacity()).toBeLessThan(0.1);
    await scrollToEl(page, "#skills", 0);
    await settle(page);
    expect(await firstOpacity()).toBe(1);
  });

  test("the email types itself out when contact comes into view", async ({ page }) => {
    await expect(page.locator("#contact-email")).toHaveAttribute("aria-label", EMAIL);
    expect((await page.locator("#contact-email").textContent()).length).toBeLessThan(EMAIL.length);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await settle(page);
    await expect(page.locator("#contact-email")).toHaveText(EMAIL);
  });
});

test.describe("phone scroll motion", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("phones skip typing so text is never held back", async ({ page }) => {
    await skipBoot(page);
    await page.goto("/");
    await page.waitForFunction(() => document.documentElement.dataset.motion === "ready");
    await expect(page.locator("#contact-email")).toHaveText(EMAIL);
    await expect(page.locator("#about .section__cmd-text")).toHaveText("cd about");
  });
});

test("reduced motion shows everything at once", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await skipBoot(page);
  await page.goto("/");
  await page.waitForFunction(() => document.documentElement.dataset.motion === "ready");
  await expect(page.locator("#contact-email")).toHaveText(EMAIL);
  await expect(page.locator("#about .section__cmd-text")).toHaveText("cd about");
  expect(await page.locator(".skill__items li").first().evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  expect(await isMoved(page, ".edu li")).toBe(false);
  await context.close();
});
