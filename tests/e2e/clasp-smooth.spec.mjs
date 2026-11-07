import { test, expect } from "@playwright/test";
import { skipBoot, waitForLayout } from "./helpers.mjs";

test("a wheel notch eases the CLASP steps over several frames instead of snapping", async ({ page }) => {
  await skipBoot(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await waitForLayout(page);
  // just before step 2 takes focus (timeline 2.9 of ~12), so the next wheel notch crosses a transition
  await page.evaluate(() => {
    const st = window.ScrollTrigger.getAll().find((t) => t.pin);
    scrollTo(0, st.start + (st.end - st.start) * (2.9 / st.animation.duration()));
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.__frames = [];
    const tick = () => {
      window.__frames.push([...document.querySelectorAll(".clasp__step")].map((e) => Number(getComputedStyle(e).opacity)));
      if (window.__frames.length < 60) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(1200);
  const frames = await page.evaluate(() => window.__frames);
  const deltas = frames.slice(1).map((f, i) => Math.max(...f.map((v, j) => Math.abs(v - frames[i][j]))));
  const changing = deltas.filter((d) => d > 0.001).length;
  expect(Math.max(...deltas)).toBeLessThan(0.05);
  expect(changing).toBeGreaterThan(5);
});
