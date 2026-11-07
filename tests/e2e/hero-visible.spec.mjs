import { test, expect } from "@playwright/test";

const opacityOf = (page, sel) => page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));

test("after the first-visit boot, the hero is fully visible and stays readable on a small scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#boot")).toBeHidden({ timeout: 3000 });
  await page.waitForFunction(() => document.documentElement.dataset.motion === "ready");
  await page.waitForTimeout(900);
  expect(await opacityOf(page, ".hero__copy")).toBeGreaterThan(0.95);
  expect(await opacityOf(page, ".facts")).toBeGreaterThan(0.95);
  await page.evaluate(() => scrollTo(0, 150));
  await page.waitForTimeout(900);
  expect(await opacityOf(page, ".hero__copy")).toBeGreaterThan(0.75);
});
