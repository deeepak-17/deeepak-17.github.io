import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONTENT } from "../../js/content.js";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const mlFirst = (s) => /ml|models/i.test(s) && s.search(/ml|models/i) < s.search(/backend/i);

test("headline, pitch and focus lead with ML, then backend", () => {
  assert.ok(mlFirst(CONTENT.profile.headline), CONTENT.profile.headline);
  assert.ok(mlFirst(CONTENT.profile.pitch), CONTENT.profile.pitch);
  assert.ok(mlFirst(CONTENT.neofetch.find((f) => f.key === "Focus").value));
});

test("static hero HTML matches content.js (no-JS visitors see the same copy)", () => {
  assert.ok(html.includes(`>${CONTENT.profile.headline}</h1>`));
  assert.ok(html.includes(`>${CONTENT.profile.pitch}</p>`));
  assert.doesNotMatch(html, /backend systems and applied ML|Backend and applied ML|backends and make models/i);
});
