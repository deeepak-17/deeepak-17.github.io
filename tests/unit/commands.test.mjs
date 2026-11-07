import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENT } from "../../js/content.js";
import { createCommands, escapeHtml } from "../../js/terminal/commands.js";

function harness() {
  const lines = [];
  const calls = [];
  let sleeps = 0;
  const out = { line: (html = "") => lines.push(html), clear: () => lines.splice(0) };
  const site = {
    scrollToSection: (id) => calls.push(["scrollToSection", id]),
    openProject: (id) => calls.push(["openProject", id]),
    closeTerminal: () => calls.push("closeTerminal"),
    downloadResume: () => calls.push("downloadResume"),
  };
  const sleep = () => { sleeps++; return Promise.resolve(); };
  const commands = createCommands({ content: CONTENT, out, site, sleep, now: () => new Date(0) });
  return { commands, lines, calls, text: () => lines.join("\n"), sleeps: () => sleeps };
}

test("cd <section> closes the terminal then scrolls", async () => {
  const h = harness();
  await h.commands.run("cd projects");
  assert.deepEqual(h.calls, ["closeTerminal", ["scrollToSection", "projects"]]);
});

test("cd ~ and cd .. scroll to top", async () => {
  const h = harness();
  await h.commands.run("cd ~");
  await h.commands.run("cd ..");
  assert.deepEqual(h.calls.filter(Array.isArray), [["scrollToSection", "top"], ["scrollToSection", "top"]]);
});

test("cd to an unknown place prints an error and does not scroll", async () => {
  const h = harness();
  await h.commands.run("cd nowhere");
  assert.match(h.text(), /no such directory: nowhere/);
  assert.deepEqual(h.calls, []);
});

test("open clasp scrolls to the project", async () => {
  const h = harness();
  await h.commands.run("open clasp");
  assert.deepEqual(h.calls, ["closeTerminal", ["openProject", "clasp"]]);
});

test("open unknown project lists valid ids", async () => {
  const h = harness();
  await h.commands.run("open mcw");
  assert.match(h.text(), /clasp/);
  assert.deepEqual(h.calls, []);
});

test("skills is generated from content", async () => {
  const h = harness();
  await h.commands.run("skills");
  assert.match(h.text(), /FAISS/);
  assert.doesNotMatch(h.text(), /gRPC/);
});

test("ls lists sections then projects", async () => {
  const h = harness();
  await h.commands.run("ls");
  const t = h.text();
  for (const id of ["about", "skills", "projects", "contact", "clasp"]) assert.match(t, new RegExp(id));
});

test("contact shows the real email and no placeholders", async () => {
  const h = harness();
  await h.commands.run("contact");
  assert.match(h.text(), /deepaksenthilkumar242@gmail\.com/);
  assert.doesNotMatch(h.text(), /example\.com|your-handle/);
});

test("resume and sudo hire-me trigger a download", async () => {
  const h = harness();
  await h.commands.run("resume");
  await h.commands.run("sudo hire-me");
  assert.equal(h.calls.filter((c) => c === "downloadResume").length, 2);
});

test("ui and exit close the terminal", async () => {
  const h = harness();
  await h.commands.run("ui");
  await h.commands.run("exit");
  assert.deepEqual(h.calls, ["closeTerminal", "closeTerminal"]);
});

test("sudo rm -rf / resolves only after its final line", async () => {
  const h = harness();
  await h.commands.run("sudo rm -rf /");
  assert.match(h.lines.at(-2) ?? h.lines.at(-1), /Just kidding/);
  assert.ok(h.sleeps() >= 3);
});

test("isBusy is true while a command runs", async () => {
  const h = harness();
  const p = h.commands.run("rm -rf /");
  assert.equal(h.commands.isBusy(), true);
  await p;
  assert.equal(h.commands.isBusy(), false);
});

test("user text is escaped", async () => {
  const h = harness();
  await h.commands.run("echo <b>x</b>");
  assert.match(h.text(), /&lt;b&gt;x&lt;\/b&gt;/);
  assert.equal(escapeHtml(`<a href="x">&`), "&lt;a href=&quot;x&quot;&gt;&amp;");
});

test("unknown command suggests the closest one", async () => {
  const h = harness();
  await h.commands.run("hlep");
  assert.match(h.text(), /command not found/);
  assert.match(h.text(), /help/);
});

test("vim traps input until :q", async () => {
  const h = harness();
  await h.commands.run("vim");
  await h.commands.run("ls");
  assert.match(h.text(), /still in vim/);
  await h.commands.run(":q");
  assert.match(h.text(), /escaped vim/);
  h.lines.splice(0);
  await h.commands.run("ls");
  assert.doesNotMatch(h.text(), /still in vim/);
});

test("history command lists previous commands", async () => {
  const h = harness();
  await h.commands.run("about");
  await h.commands.run("history");
  assert.match(h.text(), /about/);
});

test("clear empties the output", async () => {
  const h = harness();
  await h.commands.run("about");
  await h.commands.run("clear");
  assert.equal(h.lines.length, 0);
});

test("visible names exclude easter eggs", () => {
  const h = harness();
  assert.ok(h.commands.visibleNames.includes("cd"));
  assert.ok(!h.commands.visibleNames.includes("neofetch"));
  assert.ok(h.commands.allNames.includes("neofetch"));
});

test("no command output mentions CyberShield or hackathons", async () => {
  const h = harness();
  for (const c of ["help", "about", "projects", "neofetch", "banner", "whoami", "cat .secrets"]) await h.commands.run(c);
  assert.doesNotMatch(h.text(), /cybershield|hackathon/i);
});
