import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, createHistory, complete, suggest } from "../../js/terminal/core.js";

const NAMES = ["help", "about", "skills", "projects", "pwd", "clear"];

test("parse trims, collapses whitespace, lowercases only the command", () => {
  assert.deepEqual(parse("  CD   Projects "), { cmd: "cd", args: ["Projects"] });
});

test("parse collapses pasted newlines into args", () => {
  assert.deepEqual(parse("echo a\nb"), { cmd: "echo", args: ["a", "b"] });
});

test("parse of empty input", () => {
  assert.deepEqual(parse(""), { cmd: "", args: [] });
  assert.deepEqual(parse("   \n "), { cmd: "", args: [] });
});

test("history walks back and forward, clamping at both ends", () => {
  const h = createHistory();
  h.push("a");
  h.push("b");
  assert.equal(h.prev(), "b");
  assert.equal(h.prev(), "a");
  assert.equal(h.prev(), "a");
  assert.equal(h.next(), "b");
  assert.equal(h.next(), "");
  assert.equal(h.next(), "");
});

test("history ignores blank lines and resets the cursor on push", () => {
  const h = createHistory();
  h.push("a");
  h.push("   ");
  h.prev();
  h.push("c");
  assert.deepEqual(h.all(), ["a", "c"]);
  assert.equal(h.prev(), "c");
});

test("history.all returns a snapshot, not internal state", () => {
  const h = createHistory();
  h.push("a");
  const snap = h.all();
  assert.throws(() => snap.push("x"));
  assert.deepEqual(h.all(), ["a"]);
});

test("prev on empty history returns null", () => {
  assert.equal(createHistory().prev(), null);
});

test("complete returns one match", () => {
  assert.deepEqual(complete("pr", NAMES), { kind: "one", value: "projects" });
});

test("complete returns many matches", () => {
  assert.deepEqual(complete("p", NAMES), { kind: "many", matches: ["projects", "pwd"] });
});

test("complete returns none for empty or unmatched prefix", () => {
  assert.deepEqual(complete("", NAMES), { kind: "none" });
  assert.deepEqual(complete("zz", NAMES), { kind: "none" });
});

test("suggest finds the closest name within distance 2", () => {
  assert.equal(suggest("hlep", NAMES), "help");
  assert.equal(suggest("skils", NAMES), "skills");
});

test("suggest returns null when nothing is close", () => {
  assert.equal(suggest("zzzzzz", NAMES), null);
  assert.equal(suggest("", NAMES), null);
});
