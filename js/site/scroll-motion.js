/* Scroll-linked motion for every section outside the CLASP chapter.
   The HTML is the finished state. gsap.matchMedia sets start states only while its query matches,
   and reverts them (plus typed text) when it stops matching or under reduced motion. */

import { loadGsap } from "./gsap-loader.js";

const DESKTOP = "(min-width: 40rem) and (prefers-reduced-motion: no-preference)";
const PHONE = "(max-width: 39.99rem) and (prefers-reduced-motion: no-preference)";
const SCRUB = 0.6;
const ENTER = { start: "top 85%", end: "top 45%" };

const all = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Ties typing of el's data-type text to a scroll range. Returns a restore function for revert. */
function typeOnScroll(gsap, el, trigger, range = ENTER) {
  const full = el.dataset.type ?? el.textContent;
  const state = { n: 0 };
  el.textContent = "";
  gsap.to(state, {
    n: full.length,
    ease: "none",
    scrollTrigger: { trigger, ...range, scrub: SCRUB },
    onUpdate: () => { el.textContent = full.slice(0, Math.round(state.n)); },
  });
  return () => { el.textContent = full; };
}

function enter(gsap, targets, trigger, from, range = ENTER, stagger = 0.08) {
  if (targets.length === 0) return;
  gsap.from(targets, { ...from, stagger, ease: "power2.out", scrollTrigger: { trigger, ...range, scrub: SCRUB } });
}

function progressBar(gsap) {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;
  gsap.fromTo(bar, { scaleX: 0 }, {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 },
  });
}

function heroExit(gsap) {
  const hero = document.getElementById("hero");
  if (!hero) return;
  const range = { trigger: hero, start: "top top", end: "bottom top", scrub: SCRUB };
  gsap.to(".hero__copy", { y: -90, opacity: 0.15, ease: "none", scrollTrigger: range });
  gsap.to(".facts", { y: -180, opacity: 0, ease: "none", scrollTrigger: range });
}

function headings(gsap, { typing }) {
  const restores = [];
  all(".section__head").forEach((head) => {
    const cmd = head.querySelector(".section__cmd-text");
    if (typing && cmd) restores.push(typeOnScroll(gsap, cmd, head, { start: "top 90%", end: "top 70%" }));
    enter(gsap, all(".section__title .w > span", head), head, { yPercent: 110 }, { start: "top 80%", end: "top 55%" }, 0.06);
    enter(gsap, all(".section__lead", head), head, { opacity: 0, y: 16 }, { start: "top 75%", end: "top 55%" });
  });
  return restores;
}

function about(gsap) {
  const grid = document.querySelector(".about__grid");
  if (!grid) return;
  enter(gsap, all(".about__text p", grid), grid, { opacity: 0, y: 30 }, ENTER, 0.25);
  enter(gsap, all(".edu li", grid), grid, { opacity: 0, x: 60 }, ENTER, 0.25);
  enter(gsap, all(".edu__rule", grid), grid, { scaleX: 0 }, { start: "top 75%", end: "top 40%" }, 0.25);
}

function skills(gsap, { typing }) {
  const restores = [];
  all(".skill").forEach((group) => {
    const name = group.querySelector("[data-type]");
    if (typing && name) restores.push(typeOnScroll(gsap, name, group, { start: "top 90%", end: "top 75%" }));
    enter(gsap, all(".skill__items li", group), group, { opacity: 0, x: -6 }, { start: "top 85%", end: "top 50%" }, 0.05);
  });
  return restores;
}

function contact(gsap, { typing }) {
  const box = document.querySelector(".contact");
  if (!box) return [];
  const restores = [];
  const email = document.getElementById("contact-email");
  if (typing && email) restores.push(typeOnScroll(gsap, email, box, { start: "top 85%", end: "top 55%" }));
  enter(gsap, all(".contact__links li:not(:first-child), .contact > .btn, .contact__hint", box), box, { opacity: 0, y: 24 }, { start: "top 70%", end: "top 40%" }, 0.12);
  return restores;
}

/** The CSS reveal-once would fight GSAP over the same transforms, so hand those elements to GSAP. */
function retireCssReveal() {
  all("[data-reveal]").forEach((el) => {
    el.classList.add("is-seen");
    el.removeAttribute("data-reveal");
  });
}

function build(gsap, { typing }) {
  progressBar(gsap);
  heroExit(gsap);
  about(gsap);
  const restores = [...headings(gsap, { typing }), ...skills(gsap, { typing }), ...contact(gsap, { typing })];
  return () => restores.forEach((restore) => restore());
}

/** @returns {Promise<void>} resolves once motion is set up, or skipped if GSAP cannot load */
export async function initScrollMotion() {
  try {
    const gsap = await loadGsap();
    retireCssReveal();
    const mm = gsap.matchMedia();
    mm.add(DESKTOP, () => build(gsap, { typing: true }));
    mm.add(PHONE, () => build(gsap, { typing: false }));
    window.ScrollTrigger.refresh();
  } catch (err) {
    console.warn("scroll-motion: GSAP unavailable, using CSS reveal", err);
  }
}
