/* CLASP diagram scenes. Start states are set first; each scene then animates into the finished SVG markup. */

const q = (root, sel) => [...root.querySelectorAll(sel)];

/** @param {any} gsap @param {SVGElement} svg */
function setStart(gsap, svg) {
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

/** @param {any} tl @param {SVGElement} svg @param {number} scene timeline units per step */
function addScenes(tl, svg, scene) {
  const dotsEls = q(svg, ".dg-dot");
  // 1. the problem: repos arrive, each locked
  tl.to(q(svg, "[data-repo]"), { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power2.out" }, 0)
    .to(q(svg, "[data-lock]"), { scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(2)" }, 1.6);
  // 2. federated training: lines draw, updates travel, clusters pulse in, aggregation appears
  const t = scene;
  tl.to(q(svg, ".dg-flow:not([data-connector])"), { strokeDashoffset: 0, duration: 0.8, stagger: 0.08 }, t)
    .to(dotsEls, { opacity: 1, duration: 0.2 }, t + 0.7)
    .to(dotsEls, { x: (_, el) => Number(el.dataset.dx), y: (_, el) => Number(el.dataset.dy), duration: 1.2, stagger: 0.05, ease: "power1.inOut" }, t + 0.8)
    .to(q(svg, "[data-node]"), { scale: 1, duration: 0.5, ease: "back.out(2.5)" }, t + 1.6)
    .to(q(svg, "[data-node-label]"), { opacity: 1, duration: 0.4 }, t + 1.7)
    .to(dotsEls, { opacity: 0, duration: 0.2 }, t + 2.1)
    .to(q(svg, '[data-g="agg"]'), { opacity: 1, y: 0, duration: 0.5 }, t + 2.2);
  // 3. stacking: base rises, adapters drop on top
  const s = scene * 2;
  tl.to(q(svg, '[data-layer="base"]'), { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, s)
    .to(q(svg, '[data-layer="cluster"]'), { opacity: 1, y: 0, duration: 0.8, ease: "power3.in" }, s + 0.7)
    .to(q(svg, '[data-layer="client"]'), { opacity: 1, y: 0, duration: 0.8, ease: "power3.in" }, s + 1.6);
  // 4. registry: connector draws, box rises, gate lights up
  const r = scene * 3;
  tl.to(q(svg, "[data-connector]"), { strokeDashoffset: 0, duration: 0.5 }, r)
    .to(q(svg, '[data-g="registry"]'), { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, r + 0.4)
    .to(q(svg, '[data-g="gate"]'), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, r + 1.3);
}

export const CLASP_SCENES = Object.freeze({ setStart, addScenes });
