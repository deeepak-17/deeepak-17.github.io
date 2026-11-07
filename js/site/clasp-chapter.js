/* CLASP pinned chapter. GSAP is loaded lazily and only drives desktop, motion-allowed viewports.
   The base CSS layout is the finished state; gsap.matchMedia reverts every change when conditions stop matching. */

const GSAP_SRC = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
const SCROLL_TRIGGER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";
const MOTION_QUERY = "(min-width: 40rem) and (prefers-reduced-motion: no-preference)";
const PIN_LENGTH = "+=300%";
const DIM = 0.5;
const SCRUB_SMOOTHING_S = 1;
const SCENE = 3; // timeline units per step; the four steps share the pin evenly
const STEP_SHIFT_PX = 8;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { existing.addEventListener("load", resolve, { once: true }); return; }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function loadGsap() {
  if (!window.gsap) await loadScript(GSAP_SRC);
  if (!window.ScrollTrigger) await loadScript(SCROLL_TRIGGER_SRC);
  window.gsap.registerPlugin(window.ScrollTrigger);
  return window.gsap;
}

function navOffset() {
  const nav = document.getElementById("nav");
  return nav ? nav.offsetHeight : 0;
}

const q = (root, sel) => [...root.querySelectorAll(sel)];

function setStartStates(gsap, svg, steps) {
  gsap.set(steps, { opacity: DIM, x: 0 });
  gsap.set(q(svg, "[data-repo]"), { opacity: 0, y: -24 });
  gsap.set(q(svg, "[data-lock]"), { scale: 0, transformOrigin: "50% 100%" });
  gsap.set(q(svg, ".dg-flow"), { strokeDashoffset: 1 });
  gsap.set(q(svg, ".dg-dot"), { opacity: 0, x: 0, y: 0 });
  gsap.set(q(svg, "[data-node]"), { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(q(svg, "[data-node-label]"), { opacity: 0 });
  gsap.set(q(svg, '[data-g="agg"]'), { opacity: 0, y: 8 });
  gsap.set(q(svg, '[data-layer="base"]'), { opacity: 0, y: 40 });
  gsap.set(q(svg, '[data-layer="cluster"]'), { opacity: 0, y: -70 });
  gsap.set(q(svg, '[data-layer="client"]'), { opacity: 0, y: -110 });
  gsap.set(q(svg, '[data-g="registry"]'), { opacity: 0, y: 30 });
  gsap.set(q(svg, '[data-g="gate"]'), { opacity: 0, scale: 0.9, transformOrigin: "50% 50%" });
}

function addStepFocus(tl, steps) {
  steps.forEach((step, i) => {
    tl.to(step, { opacity: 1, x: STEP_SHIFT_PX, duration: 0.5 }, i * SCENE);
    if (i < steps.length - 1) tl.to(step, { opacity: DIM, x: 0, duration: 0.5 }, (i + 1) * SCENE);
  });
}

function addScenes(tl, svg) {
  const dotsEls = q(svg, ".dg-dot");
  // 1. the problem: repos arrive, each locked
  tl.to(q(svg, "[data-repo]"), { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power2.out" }, 0)
    .to(q(svg, "[data-lock]"), { scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(2)" }, 1.6);
  // 2. federated training: lines draw, updates travel, clusters pulse in, aggregation appears
  const t = SCENE;
  tl.to(q(svg, ".dg-flow:not([data-connector])"), { strokeDashoffset: 0, duration: 0.8, stagger: 0.08 }, t)
    .to(dotsEls, { opacity: 1, duration: 0.2 }, t + 0.7)
    .to(dotsEls, { x: (_, el) => Number(el.dataset.dx), y: (_, el) => Number(el.dataset.dy), duration: 1.2, stagger: 0.05, ease: "power1.inOut" }, t + 0.8)
    .to(q(svg, "[data-node]"), { scale: 1, duration: 0.5, ease: "back.out(2.5)" }, t + 1.6)
    .to(q(svg, "[data-node-label]"), { opacity: 1, duration: 0.4 }, t + 1.7)
    .to(dotsEls, { opacity: 0, duration: 0.2 }, t + 2.1)
    .to(q(svg, '[data-g="agg"]'), { opacity: 1, y: 0, duration: 0.5 }, t + 2.2);
  // 3. stacking: base rises, adapters drop on top
  const s = SCENE * 2;
  tl.to(q(svg, '[data-layer="base"]'), { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, s)
    .to(q(svg, '[data-layer="cluster"]'), { opacity: 1, y: 0, duration: 0.8, ease: "power3.in" }, s + 0.7)
    .to(q(svg, '[data-layer="client"]'), { opacity: 1, y: 0, duration: 0.8, ease: "power3.in" }, s + 1.6);
  // 4. registry: connector draws, box rises, gate lights up
  const r = SCENE * 3;
  tl.to(q(svg, "[data-connector]"), { strokeDashoffset: 0, duration: 0.5 }, r)
    .to(q(svg, '[data-g="registry"]'), { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, r + 0.4)
    .to(q(svg, '[data-g="gate"]'), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, r + 1.3);
}

function buildTimeline(gsap, section) {
  const steps = q(section, ".clasp__step");
  const svg = section.querySelector("svg");
  setStartStates(gsap, svg, steps);
  const tl = gsap.timeline({
    defaults: { ease: "none", duration: 1 },
    scrollTrigger: {
      trigger: section,
      pin: section.querySelector(".clasp__pin"),
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
  addScenes(tl, svg);
  tl.to({}, { duration: 0.01 }, SCENE * steps.length); // hold the finished state for the last scene
  return () => steps.forEach((st) => st.classList.remove("is-active"));
}

/**
 * Loads GSAP once the page has loaded (idle), so the pin exists before anyone scrolls to it.
 * Building it mid-scroll would interrupt a smooth scroll in progress.
 * @param {HTMLElement | null} section the .clasp element
 * @returns {Promise<() => void>} resolves once the chapter is set up (or skipped); value is a teardown
 */
export function initClaspChapter(section) {
  if (!section) return Promise.resolve(() => {});
  const whenIdle = () =>
    new Promise((resolve) => {
      const go = () => ("requestIdleCallback" in window ? requestIdleCallback(resolve, { timeout: 800 }) : setTimeout(resolve, 200));
      if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
    });
  return whenIdle().then(async () => {
    try {
      const gsap = await loadGsap();
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => buildTimeline(gsap, section));
      return () => mm.revert();
    } catch (err) {
      console.warn("clasp-chapter: GSAP unavailable, static layout", err);
      return () => {};
    }
  });
}
