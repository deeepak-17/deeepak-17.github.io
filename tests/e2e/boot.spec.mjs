import { test, expect } from "@playwright/test";
import { skipBoot, waitForApp, waitForLayout } from "./helpers.mjs";

test("first visit boots, then lands on the hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#boot")).toBeVisible();
  await expect(page.locator("#boot")).toBeHidden({ timeout: 2500 });
  await expect(page.locator("#hero-title")).toBeInViewport();
});

test("a reload in the same session skips the boot", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#boot")).toBeHidden({ timeout: 2500 });
  await page.reload();
  await expect(page.locator("#boot")).toHaveCount(0);
});

test("a hash link skips the boot", async ({ page }) => {
  await page.goto("/#projects");
  await expect(page.locator("#boot")).toHaveCount(0);
});

test("?view=terminal skips the boot and opens the drawer", async ({ page }) => {
  await page.goto("/?view=terminal");
  await expect(page.locator("#boot")).toHaveCount(0);
  await expect(page.locator("#term-drawer")).toBeVisible();
});

test("any key skips the boot quickly", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#boot")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("#boot")).toBeHidden({ timeout: 600 });
});

test("backtick during the boot skips it and opens one drawer", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#boot")).toBeVisible();
  await page.keyboard.press("`");
  await expect(page.locator("#boot")).toBeHidden({ timeout: 600 });
  await expect(page.locator("#term-drawer")).toBeVisible();
  await expect(page.locator("#term-drawer")).toHaveCount(1);
});

test("throwing sessionStorage: no boot, no errors, hero visible", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("SecurityError"); } });
  });
  await page.goto("/");
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator("#boot")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("reduced motion never boots", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#boot")).toHaveCount(0);
  await context.close();
});

test.describe("after boot", () => {
  test.beforeEach(async ({ page }) => { await skipBoot(page); });

  test("the hero command scrolls to projects", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);
    await waitForLayout(page);
    await page.locator("#hero-cmd").click();
    await expect(page.locator("#projects-title")).toBeInViewport({ timeout: 1500 });
  });

  test("copy email confirms visibly", async ({ page, context, browserName }) => {
    test.skip(browserName === "webkit", "clipboard permissions are Chromium-only in Playwright");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#contact");
    await waitForApp(page);
    await page.locator("#copy-email").click();
    await expect(page.locator("#copy-status")).toHaveText("copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("deepaksenthilkumar242@gmail.com");
  });

  test("copy email falls back when the clipboard is unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) } });
    });
    await page.goto("/#contact");
    await waitForApp(page);
    await page.locator("#copy-email").click();
    await expect(page.locator("#copy-status")).toContainText("Ctrl/Cmd+C");
  });

  test("footer year is current", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#footer-year")).toHaveText(String(new Date().getFullYear()));
  });
});
