/* Entry point: render the site, build the terminal, wire the two views together. */
import { CONTENT } from "./content.js";
import { validateContent } from "./validate.js";
import { renderSite } from "./site/render.js";
import { initReveal } from "./site/reveal.js";
import { initClaspChapter } from "./site/clasp-chapter.js";
import { createDrawer } from "./terminal/drawer.js";
import { createCommands } from "./terminal/commands.js";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function scrollToId(id) {
  const target = document.getElementById(id === "top" ? "hero" : id);
  target?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
}

function downloadResume(url) {
  const a = document.createElement("a");
  a.href = url;
  a.download = "Deepak_S_Resume.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const validity = validateContent(CONTENT);
if (!validity.ok) console.error("content invalid:", validity.errors.join(", "));
renderSite(document, CONTENT, validity);
initReveal(document);
initClaspChapter(document.querySelector(".clasp"));

const drawer = createDrawer({ root: document.body, toggle: document.getElementById("term-toggle"), reducedMotion });
const siteApi = Object.freeze({
  scrollToSection: scrollToId,
  openProject: scrollToId,
  closeTerminal: () => drawer.close(),
  downloadResume: () => downloadResume(CONTENT.profile.resumeUrl),
});
drawer.attach(createCommands({ content: CONTENT, out: drawer.out, site: siteApi }));

document.documentElement.classList.add("is-ready");
