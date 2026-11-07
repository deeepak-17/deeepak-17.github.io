/* Builds the sections below the hero from CONTENT. Skips (and leaves empty) any section that failed validation. */

import { escapeHtml as esc } from "../terminal/commands.js";

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

const CLASP_DIAGRAM = `
  <svg viewBox="0 0 480 420" role="img" aria-labelledby="clasp-svg-title clasp-svg-desc">
    <title id="clasp-svg-title">CLASP architecture</title>
    <desc id="clasp-svg-desc">Six client repositories keep their code local and train adapters. Updates flow to two clusters and are merged by SVD-based low-rank aggregation. Base, cluster and client adapters stack on DeepSeek-Coder. A registry versions adapters and a HumanEval gate triggers rollback.</desc>
    <g data-g="problem">
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect class="dg-box" x="${12 + i * 77}" y="12" width="66" height="40" rx="6"/><text class="dg-text" x="${45 + i * 77}" y="36" text-anchor="middle">repo ${i + 1}</text>`).join("")}
    </g>
    <g data-g="clients">
      ${[0, 1, 2].map((i) => `<path class="dg-line" d="M${45 + i * 77} 52 L130 120"/>`).join("")}
      ${[3, 4, 5].map((i) => `<path class="dg-line" d="M${45 + i * 77} 52 L350 120"/>`).join("")}
      <circle class="dg-node" cx="130" cy="132" r="14"/><text class="dg-text" x="152" y="136">cluster A</text>
      <circle class="dg-node" cx="350" cy="132" r="14"/><text class="dg-text" x="372" y="136">cluster B</text>
      <text class="dg-text dg-text--accent" x="240" y="176" text-anchor="middle">SVD low-rank aggregation</text>
      <text class="dg-text dg-text--muted" x="240" y="194" text-anchor="middle">differentially private updates</text>
    </g>
    <g data-g="layers">
      <rect class="dg-box dg-box--accent" x="120" y="214" width="240" height="30" rx="6"/><text class="dg-text" x="240" y="234" text-anchor="middle">client adapter</text>
      <rect class="dg-box dg-box--accent" x="120" y="248" width="240" height="30" rx="6"/><text class="dg-text" x="240" y="268" text-anchor="middle">cluster adapter</text>
      <rect class="dg-box" x="120" y="282" width="240" height="30" rx="6"/><text class="dg-text" x="240" y="302" text-anchor="middle">base: DeepSeek-Coder (frozen)</text>
    </g>
    <g data-g="registry">
      <path class="dg-line" d="M240 312 L240 336"/>
      <rect class="dg-box" x="60" y="336" width="360" height="72" rx="6"/>
      <text class="dg-text" x="240" y="358" text-anchor="middle">adapter registry (FastAPI)</text>
      <text class="dg-text dg-text--muted" x="240" y="378" text-anchor="middle">versioned, checksum-audited, NF4 on 4 GB VRAM</text>
      <text class="dg-text dg-text--accent" x="240" y="398" text-anchor="middle">HumanEval gate, rollback on regression</text>
    </g>
  </svg>`;

function projectHtml(project) {
  const steps = project.steps
    .map((s, i) => {
      const isLast = i === project.steps.length - 1;
      const stack = isLast ? `<ul class="clasp__stack" aria-label="Stack">${project.stack.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
      const repo = isLast && project.repoUrl ? `<a class="btn btn--ghost" href="${esc(project.repoUrl)}" target="_blank" rel="noopener">source on GitHub</a>` : "";
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

function projectsHtml({ projects }) {
  return `${heading("projects", "CLASP personalises a code LLM without collecting the code.")}
    ${projects.map(projectHtml).join("")}`;
}

function contactHtml({ profile }) {
  return `${heading("contact", "Let's build something.", "Open to SWE and ML roles. Email is fastest.")}
    <div class="container contact" data-reveal>
      <ul class="contact__links">
        <li><span class="contact__key">email</span><a href="mailto:${esc(profile.email)}" id="contact-email">${esc(profile.email)}</a><button class="copy-btn" type="button" id="copy-email">copy</button><span class="copy-status" id="copy-status" role="status"></span></li>
        <li><span class="contact__key">linkedin</span><a href="${esc(profile.linkedin)}" target="_blank" rel="noopener">deepak-senthilkumar</a></li>
        <li><span class="contact__key">github</span><a href="${esc(profile.github)}" target="_blank" rel="noopener">deeepak-17</a></li>
      </ul>
      <a class="btn btn--primary" href="${esc(profile.resumeUrl)}" download="Deepak_S_Resume.pdf">download resume</a>
      <p class="contact__hint">Prefer a shell? Press <kbd>\`</kbd> anywhere.</p>
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
export function renderSite(root, content, validity) {
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
