/* Builds the sections below the hero from CONTENT. Skips (and leaves empty) any section that failed validation. */

import { escapeHtml as esc } from "../terminal/commands.js";
import { CLASP_DIAGRAM } from "./clasp-diagram.js";

const heading = (id, title, lead) => `
  <div class="container section__head" data-reveal>
    <h2 class="section__title" id="${id}-title">${esc(title)}</h2>
    ${lead ? `<p class="section__lead">${esc(lead)}</p>` : ""}
  </div>`;

function aboutHtml({ about }) {
  const paragraphs = about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
  const education = about.education
    .map((e) => `<li><span class="edu__school">${esc(e.institution)}</span><span class="edu__programme">${esc(e.programme)}</span><span class="edu__dates">${esc(e.dates)}</span></li>`)
    .join("");
  return `${heading("about", "Computer science at Amrita, data science at IIT Madras.")}
    <div class="container about__grid" data-reveal>
      <div class="about__text">${paragraphs}</div>
      <ul class="edu" aria-label="Education">${education}</ul>
    </div>`;
}

function skillsHtml({ skills }) {
  const groups = skills
    .map((s) => `<div class="skill skill--${esc(s.colorToken.replace("--", ""))}">
        <h3 class="skill__group">${esc(s.group)}/</h3>
        <ul class="skill__items">${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>`)
    .join("");
  return `${heading("skills", "Python, PyTorch and FastAPI, mostly.")}
    <div class="container skills__grid" data-reveal>${groups}</div>`;
}

function projectHtml(project, email) {
  const steps = project.steps
    .map((s, i) => {
      const isLast = i === project.steps.length - 1;
      const stack = isLast ? `<ul class="clasp__stack" aria-label="Stack">${project.stack.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
      const repo = !isLast ? "" : project.repoUrl
        ? `<a class="btn btn--ghost" href="${esc(project.repoUrl)}" target="_blank" rel="noopener">source on GitHub</a>`
        : `<a class="clasp__ask" href="mailto:${esc(email)}?subject=${encodeURIComponent(project.title)}">Ask me about ${esc(project.title)}</a>`;
      return `<li class="clasp__step" data-step="${i}"><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p>${stack}${repo}</li>`;
    })
    .join("");
  return `<div class="clasp" id="${esc(project.id)}">
      <div class="container clasp__pin">
        <ol class="clasp__steps">${steps}</ol>
        <figure class="clasp__figure">${CLASP_DIAGRAM}<figcaption>${esc(project.title)}: ${esc(project.tagline)}</figcaption></figure>
      </div>
    </div>`;
}

function projectsHtml({ projects, profile }) {
  return `${heading("projects", "CLASP personalises a code LLM without collecting the code.")}
    ${projects.map((p) => projectHtml(p, profile.email)).join("")}`;
}

function contactHtml({ profile }) {
  return `${heading("contact", "Hiring for backend or ML? Email is fastest.")}
    <div class="container contact" data-reveal>
      <ul class="contact__links">
        <li><span class="contact__key">email</span><a href="mailto:${esc(profile.email)}" id="contact-email">${esc(profile.email)}</a><button class="copy-btn" type="button" id="copy-email">copy</button><span class="copy-status" id="copy-status" role="status"></span></li>
        <li><span class="contact__key">linkedin</span><a href="${esc(profile.linkedin)}" target="_blank" rel="noopener">deepak-senthilkumar</a></li>
        <li><span class="contact__key">github</span><a href="${esc(profile.github)}" target="_blank" rel="noopener">deeepak-17</a></li>
      </ul>
      <a class="btn btn--primary" href="${esc(profile.resumeUrl)}" download="Deepak_S_Resume.pdf">download resume</a>
      <p class="contact__hint">Prefer a shell? Press <button class="term-open" type="button" aria-label="Open the terminal"><kbd>\`</kbd></button> anywhere.</p>
    </div>`;
}

const SECTIONS = [
  ["about", "about", aboutHtml],
  ["skills", "skills", skillsHtml],
  ["projects", "projects", projectsHtml],
  ["contact", "profile", contactHtml],
];

/**
 * @param {ParentNode} root
 * @param {object} content
 * @param {{ valid: Record<string, boolean> }} validity
 */
function renderFacts(root, facts) {
  const dl = root.querySelector(".facts");
  if (!dl || !Array.isArray(facts) || facts.length === 0) return;
  dl.innerHTML = facts.map(({ key, value }) => `<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join("");
}

export function renderSite(root, content, validity) {
  renderFacts(root, content.neofetch);
  for (const [id, key, build] of SECTIONS) {
    const el = root.querySelector(`#${id}`);
    if (!el) continue;
    if (validity.valid[key] === false) {
      console.error(`render: skipped #${id}, content.${key} is invalid`);
      continue;
    }
    el.innerHTML = build(content);
  }
}
