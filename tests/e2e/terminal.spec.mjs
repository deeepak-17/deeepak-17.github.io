import { test, expect } from "@playwright/test";
import { skipBoot, waitForLayout } from "./helpers.mjs";

test.beforeEach(async ({ page }) => {
  await skipBoot(page);
  await page.goto("/");
  await expect(page.locator("#about")).toContainText("IIT Madras");
  await waitForLayout(page);
});

const drawer = (page) => page.locator("#term-drawer");
const input = (page) => page.locator("#term-input");

test("backtick opens the drawer with the input focused", async ({ page }) => {
  await page.keyboard.press("`");
  await expect(drawer(page)).toBeVisible();
  await expect(input(page)).toBeFocused();
  await expect(page.locator("#term-toggle")).toHaveAttribute("aria-expanded", "true");
});

test("ctrl+k also opens the drawer", async ({ page }) => {
  await page.keyboard.press("Control+k");
  await expect(drawer(page)).toBeVisible();
});

test("cd projects closes the drawer and scrolls to projects", async ({ page }) => {
  await page.keyboard.press("`");
  await input(page).fill("cd projects");
  await input(page).press("Enter");
  await expect(drawer(page)).toBeHidden();
  await expect(page.locator("#projects-title")).toBeInViewport({ timeout: 1500 });
});

test("backtick types normally when the input has text", async ({ page }) => {
  await page.keyboard.press("`");
  await input(page).fill("echo a");
  await input(page).press("`");
  await expect(drawer(page)).toBeVisible();
  await expect(input(page)).toHaveValue("echo a`");
});

test("backtick on an empty input closes the drawer", async ({ page }) => {
  await page.keyboard.press("`");
  await input(page).press("`");
  await expect(drawer(page)).toBeHidden();
});

test("escape closes and returns focus to the toggle that opened it", async ({ page }) => {
  await page.locator("#term-toggle").click();
  await expect(drawer(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer(page)).toBeHidden();
  await expect(page.locator("#term-toggle")).toBeFocused();
});

test("tab focus stays inside the drawer", async ({ page }) => {
  await page.keyboard.press("`");
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.getElementById("term-drawer").contains(document.activeElement))).toBe(true);
  }
});

test("output persists between openings", async ({ page }) => {
  await page.keyboard.press("`");
  await input(page).fill("whoami");
  await input(page).press("Enter");
  await page.keyboard.press("Escape");
  await page.keyboard.press("`");
  await expect(page.locator("#term-output")).toContainText("refuses light mode");
});

test("history recalls with arrow up and tab completes", async ({ page }) => {
  await page.keyboard.press("`");
  await input(page).fill("pwd");
  await input(page).press("Enter");
  await input(page).press("ArrowUp");
  await expect(input(page)).toHaveValue("pwd");
  await input(page).fill("ski");
  await input(page).press("Tab");
  await expect(input(page)).toHaveValue("skills ");
});

test("clicking the backdrop closes the drawer", async ({ page }) => {
  await page.keyboard.press("`");
  const { height } = page.viewportSize();
  await page.mouse.click(10, height - 10);
  await expect(drawer(page)).toBeHidden();
});

test("page does not scroll while the drawer is open", async ({ page }) => {
  await page.keyboard.press("`");
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
});

test("a 500-character paste wraps instead of overflowing", async ({ page }) => {
  await page.keyboard.press("`");
  await input(page).fill("echo " + "x".repeat(500));
  await input(page).press("Enter");
  const { sw, cw } = await page.locator("#term-output").evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
});

test("chips run commands on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator("#term-toggle").click();
  await page.locator(".term-chips button[data-cmd='about']").click();
  await expect(page.locator("#term-output")).toContainText("Amrita");
});

test("shortcuts are ignored while typing in a page field", async ({ page }) => {
  await page.evaluate(() => {
    const i = document.createElement("input");
    i.id = "probe";
    document.body.appendChild(i);
  });
  await page.locator("#probe").focus();
  await page.keyboard.press("`");
  await expect(drawer(page)).toBeHidden();
  await expect(page.locator("#probe")).toHaveValue("`");
});
