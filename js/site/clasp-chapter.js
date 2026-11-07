/* CLASP pinned chapter. GSAP is loaded lazily and only drives desktop, motion-allowed viewports.
   The base CSS layout is the finished state; gsap.matchMedia reverts every change when conditions stop matching. */

const GSAP_SRC = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
const SCROLL_TRIGGER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";
const MOTION_QUERY = "(min-width: 40rem) and (prefers-reduced-motion: no-preference)";
const PIN_LENGTH = "+=200%";
const DIM = 0.2;
/** Which diagram groups each step reveals. */
const STEP_GROUPS = [["problem"], ["clients", "layers"], ["registry"], []];

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

function buildTimeline(gsap, section) {
  const steps = [...section.querySelectorAll(".clasp__step")];
  const groupsFor = (i) => STEP_GROUPS[i].map((g) => section.querySelector(`[data-g="${g}"]`)).filter(Boolean);
  const allGroups = [...section.querySelectorAll("[data-g]")];

  gsap.set([...steps, ...allGroups], { opacity: DIM });
  const tl = gsap.timeline({
    defaults: { ease: "none", duration: 1 },
    scrollTrigger: {
      trigger: section,
      pin: section.querySelector(".clasp__pin"),
      start: () => `top top+=${navOffset()}`,
      end: PIN_LENGTH,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const active = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        steps.forEach((s, i) => s.classList.toggle("is-active", i === active));
      },
      onLeave: () => steps.forEach((s) => s.classList.remove("is-active")),
    },
  });
  steps.forEach((step, i) => {
    tl.to([step, ...groupsFor(i)], { opacity: 1 }, i);
  });
  return () => steps.forEach((s) => s.classList.remove("is-active"));
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
