import { test } from "node:test";
import assert from "node:assert/strict";
import { createSafeStorage } from "../../js/storage.js";
import { shouldBoot, BOOT_SEEN_KEY } from "../../js/boot-decision.js";

const memory = (seed = {}) => {
  const map = new Map(Object.entries(seed));
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) };
};
const fresh = () => createSafeStorage(memory());
const base = () => ({ storage: fresh(), hash: "", search: "", reducedMotion: false });

test("boots on a fresh first visit", () => {
  assert.equal(shouldBoot(base()), true);
});

test("skips when boot already seen this session", () => {
  const storage = createSafeStorage(memory({ [BOOT_SEEN_KEY]: "1" }));
  assert.equal(shouldBoot({ ...base(), storage }), false);
});

test("skips when a hash is present", () => {
  assert.equal(shouldBoot({ ...base(), hash: "#projects" }), false);
});

test("skips when a view param is present", () => {
  assert.equal(shouldBoot({ ...base(), search: "?view=terminal" }), false);
});

test("still boots with unrelated query params", () => {
  assert.equal(shouldBoot({ ...base(), search: "?utm_source=linkedin" }), true);
});

test("skips under reduced motion", () => {
  assert.equal(shouldBoot({ ...base(), reducedMotion: true }), false);
});

test("skips when storage is unusable (private mode)", () => {
  const storage = createSafeStorage({ getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); } });
  assert.equal(shouldBoot({ ...base(), storage }), false);
});
