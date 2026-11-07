/* sessionStorage wrapper that never throws (Safari private mode, blocked site data). */

const PROBE_KEY = "portfolio.probe";

function probe(backing) {
  try {
    backing.setItem(PROBE_KEY, "1");
    return backing.getItem(PROBE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {Storage | undefined} backing
 * @returns {{ available: boolean, get(key: string): string | null, set(key: string, value: string): boolean }}
 */
export function createSafeStorage(backing) {
  const available = Boolean(backing) && probe(backing);
  return Object.freeze({
    available,
    get(key) {
      if (!available) return null;
      try {
        return backing.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      if (!available) return false;
      try {
        backing.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
  });
}
