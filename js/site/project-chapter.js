import { loadGsap } from "./gsap-loader.js";
import { CLASP_SCENES } from "./clasp-scenes.js";
import { GIGGUARD_SCENES } from "./gigguard-scenes.js";

/* Pinned project chapters. GSAP is loaded lazily and only drives desktop, motion-allowed viewports.
   The base CSS layout is the finished state; gsap.matchMedia reverts every change when conditions stop matching.
   Each project with a diagram registers its scenes here; a project without scenes still pins and steps through. */

const MOTION_QUERY = "(min-width: 40rem) and (prefers-reduced-motion: no-preference)";
const PIN_LENGTH = "+=300%";
const DIM = 0.5;
const SCRUB_SMOOTHING_S = 1;
const SCENE = 3; // timeline units per step; the four steps share the pin evenly
const STEP_SHIFT_PX = 8;

const SCENES_BY_ID = Object.freeze({ clasp: CLASP_SCENES, gigguard: GIGGUARD_SCENES });

function navOffset() {
  const nav = document.getElementById("nav");
  return nav ? nav.offsetHeight : 0;
}

const q = (root, sel) => [...root.querySelectorAll(sel)];

function addStepFocus(tl, steps) {
  steps.forEach((step, i) => {
    tl.to(step, { opacity: 1, x: STEP_SHIFT_PX, duration: 0.5 }, i * SCENE);
    if (i < steps.length - 1) tl.to(step, { opacity: DIM, x: 0, duration: 0.5 }, (i + 1) * SCENE);
  });
}

function buildTimeline(gsap, chapter) {
  const steps = q(chapter, ".chapter__step");
  const svg = chapter.querySelector(".chapter__figure svg");
  const scenes = svg ? SCENES_BY_ID[chapter.id] : undefined;
  gsap.set(steps, { opacity: DIM, x: 0 });
  scenes?.setStart(gsap, svg);
  const tl = gsap.timeline({
    defaults: { ease: "none", duration: 1 },
    scrollTrigger: {
      trigger: chapter.querySelector(".chapter__body"), // below the chapter heading, which scrolls past normally
      pin: chapter.querySelector(".chapter__pin"),
      start: () => `top top+=${navOffset()}`,
      end: PIN_LENGTH,
      scrub: SCRUB_SMOOTHING_S, // eases toward the scroll position so mouse-wheel notches don't snap
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const active = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        steps.forEach((st, i) => st.classList.toggle("is-active", i === active));
      },
      onLeave: () => steps.forEach((st) => st.classList.remove("is-active")),
    },
  });
  addStepFocus(tl, steps);
  scenes?.addScenes(tl, svg, SCENE);
  tl.to({}, { duration: 0.01 }, SCENE * steps.length); // hold the finished state for the last scene
  return () => steps.forEach((st) => st.classList.remove("is-active"));
}

const whenIdle = () =>
  new Promise((resolve) => {
    const go = () => ("requestIdleCallback" in window ? requestIdleCallback(resolve, { timeout: 800 }) : setTimeout(resolve, 200));
    if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
  });

/**
 * Loads GSAP once the page has loaded (idle), so the pins exist before anyone scrolls to them.
 * Building them mid-scroll would interrupt a smooth scroll in progress. Chapters are built top to bottom,
 * so each later pin is measured with the earlier pin's spacer already in place.
 * @param {ArrayLike<HTMLElement>} chapters the .chapter elements, in page order
 * @returns {Promise<() => void>} resolves once every chapter is set up (or skipped); value is a teardown
 */
export function initProjectChapters(chapters) {
  const list = [...(chapters ?? [])];
  if (list.length === 0) return Promise.resolve(() => {});
  return whenIdle().then(async () => {
    try {
      const gsap = await loadGsap();
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        const teardowns = list.map((chapter) => buildTimeline(gsap, chapter));
        return () => teardowns.forEach((undo) => undo());
      });
      return () => mm.revert();
    } catch (err) {
      console.warn("project-chapter: GSAP unavailable, static layout", err);
      return () => {};
    }
  });
}
