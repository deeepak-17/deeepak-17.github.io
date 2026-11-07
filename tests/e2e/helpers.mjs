/** Mark the boot as already seen so site tests start on the hero. */
export async function skipBoot(page) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem("portfolio.bootSeen", "1"); } catch {}
  });
}

/** Wait until main.js has wired every handler. */
export async function waitForApp(page) {
  await page.waitForFunction(() => document.documentElement.dataset.app === "ready");
}

/** Wait until the CLASP chapter has finished setting up (GSAP loaded and pinned, or skipped). */
export async function waitForLayout(page) {
  await page.waitForFunction(() => document.documentElement.dataset.layout === "ready", null, { timeout: 10000 });
}
