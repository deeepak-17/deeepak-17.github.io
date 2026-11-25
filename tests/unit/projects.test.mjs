import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENT } from "../../js/content.js";
import { validateContent } from "../../js/validate.js";

const gigguard = () => CONTENT.projects.find((p) => p.id === "gigguard");

test("gigguard is the second project, right after clasp", () => {
  assert.deepEqual(CONTENT.projects.map((p) => p.id), ["clasp", "gigguard"]);
});

test("gigguard tells its story in four steps and links to its repo", () => {
  const p = gigguard();
  assert.equal(p.steps.length, 4);
  assert.equal(p.steps.at(-1).title, "Built with");
  assert.equal(p.repoUrl, "https://github.com/deeepak-17/GigGuard");
  assert.ok(p.stack.length >= 4);
  assert.ok(Object.isFrozen(p.steps[0]));
});

test("every project carries its own headline", () => {
  for (const p of CONTENT.projects) assert.ok(p.headline?.trim(), `${p.id} has no headline`);
  assert.match(CONTENT.projects[0].headline, /^CLASP personalises a code LLM/);
  assert.match(gigguard().headline, /^GigGuard/);
});

test("a project missing its headline is invalid", () => {
  const broken = { ...CONTENT, projects: [{ ...CONTENT.projects[0], headline: "" }] };
  const result = validateContent(broken);
  assert.equal(result.valid.projects, false);
  assert.ok(result.errors.some((e) => e.includes("projects[0].headline")));
});

test("gigguard copy names no event and invents no figures beyond the README", () => {
  const text = JSON.stringify(gigguard());
  assert.doesNotMatch(text, /hackathon|devtrails|guidewire|cybershield/i);
  assert.doesNotMatch(text, /\d+\s?%\s+of (their|monthly)/i); // README's 20-30% earnings claim stays out
});

test("clasp links to its public repo", () => {
  assert.equal(CONTENT.projects[0].repoUrl, "https://github.com/deeepak-17/CLASP");
});
