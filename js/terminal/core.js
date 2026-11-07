/* DOM-free terminal core: parsing, history, completion, suggestions. */

const MAX_SUGGEST_DISTANCE = 2;

/** @param {string} raw @returns {{ cmd: string, args: string[] }} */
export function parse(raw) {
  const parts = String(raw ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { cmd: "", args: [] };
  const [cmd, ...args] = parts;
  return { cmd: cmd.toLowerCase(), args };
}

/** @returns {{ push(line: string): void, prev(): string | null, next(): string, all(): readonly string[] }} */
export function createHistory() {
  let entries = [];
  let cursor = 0;
  return {
    push(line) {
      const trimmed = String(line ?? "").trim();
      if (trimmed) entries = [...entries, trimmed];
      cursor = entries.length;
    },
    prev() {
      if (entries.length === 0) return null;
      cursor = Math.max(0, cursor - 1);
      return entries[cursor];
    },
    next() {
      cursor = Math.min(entries.length, cursor + 1);
      return cursor < entries.length ? entries[cursor] : "";
    },
    all() {
      return Object.freeze([...entries]);
    },
  };
}

/** @param {string} prefix @param {string[]} names */
export function complete(prefix, names) {
  const p = String(prefix ?? "").trim().toLowerCase();
  if (!p) return { kind: "none" };
  const matches = names.filter((n) => n.startsWith(p));
  if (matches.length === 0) return { kind: "none" };
  if (matches.length === 1) return { kind: "one", value: matches[0] };
  return { kind: "many", matches };
}

function distance(a, b) {
  let prevRow = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prevRow[j] + 1, row[j - 1] + 1, prevRow[j - 1] + cost);
    }
    prevRow = row;
  }
  return prevRow[b.length];
}

/** @param {string} cmd @param {string[]} names @returns {string | null} */
export function suggest(cmd, names) {
  const c = String(cmd ?? "").toLowerCase();
  if (!c) return null;
  const best = names
    .map((name) => ({ name, d: distance(c, name) }))
    .filter(({ d }) => d <= MAX_SUGGEST_DISTANCE)
    .sort((x, y) => x.d - y.d)[0];
  return best ? best.name : null;
}
