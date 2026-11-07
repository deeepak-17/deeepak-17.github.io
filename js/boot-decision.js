/* Pure decision: should the first-visit boot sequence play? */

export const BOOT_SEEN_KEY = "portfolio.bootSeen";

/**
 * @param {{ storage: { available: boolean, get(k: string): string | null }, hash: string, search: string, reducedMotion: boolean }} env
 * @returns {boolean}
 */
export function shouldBoot({ storage, hash, search, reducedMotion }) {
  if (reducedMotion) return false;
  if (hash && hash !== "#") return false;
  if (new URLSearchParams(search).has("view")) return false;
  if (!storage.available) return false;
  return storage.get(BOOT_SEEN_KEY) === null;
}
