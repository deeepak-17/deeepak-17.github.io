import { test, expect } from "@playwright/test";
import { skipBoot, waitForApp } from "./helpers.mjs";

test.beforeEach(async ({ page }) => {
  await skipBoot(page);
  await page.goto("/");
  await waitForApp(page);
});

const pressPhysicalBackquote = (page, key) =>
  page.evaluate((k) => {
    document.activeElement?.blur?.();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: k, code: "Backquote", bubbles: true, cancelable: true }));
  }, key);

for (const key of ["Dead", "₹", "§"]) {
  test(`the backquote key opens the terminal even when the layout reports "${key}"`, async ({ page }) => {
    await pressPhysicalBackquote(page, key);
    await expect(page.locator("#term-drawer")).toBeVisible();
  });
}

test("the key hints are clickable and open the terminal", async ({ page }) => {
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.locator(".contact__hint .term-open").click();
  await expect(page.locator("#term-drawer")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator("#hero").scrollIntoViewIfNeeded();
  await page.locator(".hero__hint .term-open").click();
  await expect(page.locator("#term-drawer")).toBeVisible();
});
