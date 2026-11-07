import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENT } from "../../js/content.js";
import { createCommands } from "../../js/terminal/commands.js";

function harness() {
  const lines = [];
  let sleeps = 0;
  const out = { line: (html = "") => lines.push(html), clear: () => lines.splice(0) };
  const site = { scrollToSection() {}, openProject() {}, closeTerminal() {}, downloadResume() {} };
  const commands = createCommands({ content: CONTENT, out, site, sleep: () => { sleeps++; return Promise.resolve(); } });
  return { commands, text: () => lines.join("\n"), sleeps: () => sleeps };
}

test("clasp --train streams a simulated run built from resume facts", async () => {
  const h = harness();
  await h.commands.run("clasp --train");
  const t = h.text();
  assert.match(t, /simulation/i);
  for (const fact of [/DeepSeek-Coder/, /4 GB VRAM/, /6 (simulated )?(federated )?clients/, /SVD/, /HumanEval/, /differential privacy/i]) {
    assert.match(t, fact);
  }
  assert.ok(h.sleeps() >= 5, "lines should stream in over time");
  assert.match(t, /open clasp/);
});

test("clasp --train never invents metrics (no loss, accuracy or percentages)", async () => {
  const h = harness();
  await h.commands.run("clasp --train");
  assert.doesNotMatch(h.text(), /loss|accuracy|\d+(\.\d+)?\s*%/i);
});

test("clasp without flags prints usage", async () => {
  const h = harness();
  await h.commands.run("clasp");
  assert.match(h.text(), /usage: clasp --train/);
});

test("git log lists real milestones newest first", async () => {
  const h = harness();
  await h.commands.run("git log");
  const t = h.text();
  const order = ["Amazon ML Challenge 2026", "CLASP", "IIT Madras", "Amrita"].map((s) => t.indexOf(s));
  order.forEach((i) => assert.ok(i >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.match(t, /HEAD -&gt; main/); // rendered as escaped HTML
});

test("git with another subcommand gets a hint", async () => {
  const h = harness();
  await h.commands.run("git push");
  assert.match(h.text(), /git log/);
});

test("top shows a process table led by the header row", async () => {
  const h = harness();
  await h.commands.run("top");
  const t = h.text();
  assert.match(t, /PID\s+USER\s+%CPU\s+COMMAND/);
  for (const p of ["pytorch", "fastapi", "dsa.cpp", "caffeine"]) assert.match(t, new RegExp(p));
});

test("new eggs stay unlisted in help", async () => {
  const h = harness();
  await h.commands.run("help");
  assert.doesNotMatch(h.text(), /clasp --train|git log|\btop\b/);
});
