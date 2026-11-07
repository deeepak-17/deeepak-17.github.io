/* Checks content shape at boot. Never throws; reports dotted paths of missing fields. */

const PROFILE_FIELDS = ["name", "headline", "pitch", "email", "linkedin", "github", "resumeUrl"];
const PROJECT_FIELDS = ["id", "title", "tagline"];

const isText = (v) => typeof v === "string" && v.trim().length > 0;
const isNonEmptyArray = (v) => Array.isArray(v) && v.length > 0;

function checkProfile(profile) {
  if (!profile) return ["profile"];
  return PROFILE_FIELDS.filter((f) => !isText(profile[f])).map((f) => `profile.${f}`);
}

function checkAbout(about) {
  if (!about) return ["about"];
  const errors = [];
  if (!isNonEmptyArray(about.paragraphs) || !about.paragraphs.every(isText)) errors.push("about.paragraphs");
  if (!isNonEmptyArray(about.education)) errors.push("about.education");
  return errors;
}

function checkSkills(skills) {
  if (!isNonEmptyArray(skills)) return ["skills"];
  return skills.flatMap((s, i) =>
    isText(s?.group) && isNonEmptyArray(s?.items) ? [] : [`skills[${i}]`]
  );
}

function checkProject(p, i) {
  const errors = PROJECT_FIELDS.filter((f) => !isText(p?.[f])).map((f) => `projects[${i}].${f}`);
  if (!isNonEmptyArray(p?.steps)) errors.push(`projects[${i}].steps`);
  if (!isNonEmptyArray(p?.stack)) errors.push(`projects[${i}].stack`);
  if (p?.repoUrl !== null && p?.repoUrl !== undefined && !isText(p.repoUrl)) errors.push(`projects[${i}].repoUrl`);
  return errors;
}

function checkProjects(projects) {
  if (!isNonEmptyArray(projects)) return ["projects"];
  return projects.flatMap(checkProject);
}

const CHECKS = {
  profile: (c) => checkProfile(c.profile),
  about: (c) => checkAbout(c.about),
  skills: (c) => checkSkills(c.skills),
  projects: (c) => checkProjects(c.projects),
};

export function validateContent(content) {
  if (!content || typeof content !== "object") {
    return { ok: false, errors: ["content"], valid: {} };
  }
  const results = Object.entries(CHECKS).map(([section, check]) => [section, check(content)]);
  const errors = results.flatMap(([, errs]) => errs);
  const valid = Object.fromEntries(results.map(([section, errs]) => [section, errs.length === 0]));
  return { ok: errors.length === 0, errors, valid };
}
