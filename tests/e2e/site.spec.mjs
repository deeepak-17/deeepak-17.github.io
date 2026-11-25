import { test, expect } from "@playwright/test";
import { skipBoot } from "./helpers.mjs";

test.beforeEach(async ({ page }) => { await skipBoot(page); });

test("hero headline, pitch and primary action fit 1280x800", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("h1")).toBeInViewport();
  await expect(page.locator(".hero__pitch")).toBeInViewport();
  await expect(page.getByRole("link", { name: "view work" })).toBeInViewport();
});

test("sections render from content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#about")).toContainText("IIT Madras");
  await expect(page.locator("#skills")).toContainText("FAISS");
  await expect(page.locator("#clasp")).toContainText("HumanEval");
  await expect(page.locator("#contact")).toContainText("deepaksenthilkumar242@gmail.com");
  await expect(page.locator("body")).not.toContainText(/cybershield|hackathon/i);
});

test("no horizontal scroll at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
});

test("reduced motion shows every CLASP step without pinning", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await skipBoot(page);
  await page.goto("/#projects");
  const steps = page.locator("#clasp .chapter__step h4");
  await expect(steps).toHaveCount(4);
  for (const step of await steps.all()) {
    await step.scrollIntoViewIfNeeded();
    await expect(step).toBeVisible();
    expect(await step.evaluate((el) => getComputedStyle(el.closest(".chapter__step")).opacity)).toBe("1");
  }
  expect(await page.locator(".pin-spacer").count()).toBe(0);
  await context.close();
});

test("no-JS visitors see the noscript contact", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".noscript a[href^='mailto:']")).toBeVisible();
  await context.close();
});

test("resizing below 40rem mid-chapter unpins and shows all steps", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator("#clasp").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(400);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(600);
  expect(await page.locator(".pin-spacer").count()).toBe(0);
  for (const step of await page.locator("#clasp .chapter__step").all()) {
    expect(Number(await step.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  }
});

test("clasp chapter pins and scrubs on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator("#clasp").scrollIntoViewIfNeeded();
  await expect(page.locator("#clasp .pin-spacer")).toHaveCount(1, { timeout: 5000 });
});
