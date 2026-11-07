/* Entry point. Task 5 scope: render the site; later tasks add drawer, boot and wiring. */
import { CONTENT } from "./content.js";
import { validateContent } from "./validate.js";
import { renderSite } from "./site/render.js";
import { initReveal } from "./site/reveal.js";
import { initClaspChapter } from "./site/clasp-chapter.js";

const validity = validateContent(CONTENT);
if (!validity.ok) console.error("content invalid:", validity.errors.join(", "));
renderSite(document, CONTENT, validity);
initReveal(document);
initClaspChapter(document.querySelector(".clasp"));
document.documentElement.classList.add("is-ready");
