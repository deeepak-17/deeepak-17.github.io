/* Entry point: render the site, build the terminal, wire the two views together. */
import { CONTENT } from "./content.js";
import { validateContent } from "./validate.js";
import { renderSite } from "./site/render.js";
import { initReveal } from "./site/reveal.js";
import { initProjectChapters } from "./site/project-chapter.js";
import { initScrollMotion } from "./site/scroll-motion.js";
import { createDrawer } from "./terminal/drawer.js";
import { createCommands } from "./terminal/commands.js";
import { createSafeStorage } from "./storage.js";
import { shouldBoot, BOOT_SEEN_KEY } from "./boot-decision.js";
import { runBoot } from "./boot.js";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const LAYOUT_WAIT_MS = 1200;
let layoutSettled = Promise.resolve();

/** Waits (briefly) for the project pins to exist, so a smooth scroll is not cut short by its setup. */
async function scrollToId(id) {
  await Promise.race([layoutSettled, new Promise((r) => setTimeout(r, LAYOUT_WAIT_MS))]);
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
layoutSettled = initProjectChapters(document.querySelectorAll(".chapter")).finally(() => {
  document.documentElement.dataset.layout = "ready";
});
// Section motion is created after the project pins so ScrollTrigger measures positions with the pin spacer in place.
layoutSettled.then(initScrollMotion).finally(() => {
  document.documentElement.dataset.motion = "ready";
});

const drawer = createDrawer({ root: document.body, toggle: document.getElementById("term-toggle"), reducedMotion });
const siteApi = Object.freeze({
  scrollToSection: scrollToId,
  openProject: scrollToId,
  closeTerminal: () => drawer.close(),
  downloadResume: () => downloadResume(CONTENT.profile.resumeUrl),
});
drawer.attach(createCommands({ content: CONTENT, out: drawer.out, site: siteApi }));

document.getElementById("hero-cmd")?.addEventListener("click", () => drawer.run("cd projects"));
document.addEventListener("click", (e) => {
  if (e.target instanceof Element && e.target.closest(".term-open")) drawer.open();
});
wireCopyEmail(CONTENT.profile.email);
const year = document.getElementById("footer-year");
if (year) year.textContent = String(new Date().getFullYear());

document.documentElement.dataset.app = "ready";
startUp();

function readSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

async function startUp() {
  const storage = createSafeStorage(readSessionStorage());
  const env = { storage, hash: location.hash, search: location.search, reducedMotion: reducedMotion() };
  if (shouldBoot(env)) {
    await runBoot({ root: document.body });
    storage.set(BOOT_SEEN_KEY, "1");
  }
  document.documentElement.classList.add("is-ready");
  if (new URLSearchParams(location.search).get("view") === "terminal") drawer.open();
}

function wireCopyEmail(email) {
  const button = document.getElementById("copy-email");
  const status = document.getElementById("copy-status");
  const link = document.getElementById("contact-email");
  if (!button || !status) return;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email);
      status.textContent = "copied";
    } catch {
      if (link) window.getSelection()?.selectAllChildren(link);
      status.textContent = "Selected. Press Ctrl/Cmd+C to copy.";
    }
  });
}
