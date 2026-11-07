import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENT } from "../../js/content.js";
import { validateContent } from "../../js/validate.js";

test("shipped content is valid", () => {
  const result = validateContent(CONTENT);
  assert.equal(result.ok, true, result.errors.join("; "));
});

test("missing profile.email fails only the profile section", () => {
  const broken = { ...CONTENT, profile: { ...CONTENT.profile, email: undefined } };
  const result = validateContent(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("profile.email")));
  assert.equal(result.valid.profile, false);
  assert.equal(result.valid.skills, true);
});

test("clasp has four steps and is deeply frozen", () => {
  assert.equal(CONTENT.projects[0].id, "clasp");
  assert.equal(CONTENT.projects[0].steps.length, 4);
  assert.ok(Object.isFrozen(CONTENT.projects[0].steps));
  assert.ok(Object.isFrozen(CONTENT.projects[0].steps[0]));
});

test("content never mentions CyberShield or hackathons", () => {
  assert.doesNotMatch(JSON.stringify(CONTENT), /cybershield|hackathon/i);
});

test("a project with a null repoUrl is valid", () => {
  assert.equal(CONTENT.projects[0].repoUrl, null);
  assert.equal(validateContent(CONTENT).valid.projects, true);
});

test("a project missing its steps is invalid", () => {
  const broken = { ...CONTENT, projects: [{ ...CONTENT.projects[0], steps: [] }] };
  const result = validateContent(broken);
  assert.equal(result.valid.projects, false);
  assert.ok(result.errors.some((e) => e.includes("projects[0].steps")));
});

test("validateContent never throws on garbage", () => {
  const result = validateContent(null);
  assert.equal(result.ok, false);
});
