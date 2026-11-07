/** Mark the boot as already seen so site tests start on the hero. */
export async function skipBoot(page) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem("portfolio.bootSeen", "1"); } catch {}
  });
}
