import { test } from "node:test";
import assert from "node:assert/strict";
import { createSafeStorage } from "../../js/storage.js";

const memoryBacking = () => {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) };
};
const throwingBacking = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("QuotaExceededError"); },
};

test("round-trips values through a working backing", () => {
  const s = createSafeStorage(memoryBacking());
  assert.equal(s.get("k"), null);
  assert.equal(s.set("k", "1"), true);
  assert.equal(s.get("k"), "1");
});

test("throwing backing yields null and false, never throws", () => {
  const s = createSafeStorage(throwingBacking);
  assert.equal(s.get("k"), null);
  assert.equal(s.set("k", "1"), false);
});

test("undefined backing yields null and false", () => {
  const s = createSafeStorage(undefined);
  assert.equal(s.get("k"), null);
  assert.equal(s.set("k", "1"), false);
});
