/* GigGuard diagram scenes, one per step: disruptions arrive, severity scales, pricing and fraud checks, payout. */

const q = (root, sel) => [...root.querySelectorAll(sel)];

/** @param {any} gsap @param {SVGElement} svg */
function setStart(gsap, svg) {
  gsap.set(q(svg, "[data-trigger]"), { opacity: 0, y: -24 });
  gsap.set(q(svg, ".dg-flow"), { strokeDashoffset: 1 });
  gsap.set(q(svg, '[data-g="curfew-note"]'), { opacity: 0 });
  gsap.set(q(svg, '[data-g="engine"]'), { opacity: 0, y: 16 });
  gsap.set(q(svg, "[data-gauge-fill]"), { scaleX: 0, transformOrigin: "0% 50%" });
  gsap.set(q(svg, '[data-g="premium"]'), { opacity: 0, x: -40 });
  gsap.set(q(svg, '[data-g="fraud"]'), { opacity: 0, x: 40 });
  gsap.set(q(svg, '[data-g="payout"]'), { opacity: 0, y: 30 });
  gsap.set(q(svg, '[data-g="no-forms"]'), { opacity: 0, scale: 0.9, transformOrigin: "50% 50%" });
}

/** @param {any} tl @param {SVGElement} svg @param {number} scene timeline units per step */
function addScenes(tl, svg, scene) {
  // 1. the problem: disruptions drop in one after another
  tl.to(q(svg, "[data-trigger]"), { opacity: 1, y: 0, duration: 0.9, stagger: 0.25, ease: "power2.out" }, 0);
  // 2. scaling payouts: triggers feed the engine, the gauge fills to the example severity
  const t = scene;
  tl.to(q(svg, '[data-g="engine"]'), { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, t)
    .to(q(svg, "[data-trigger-flow]"), { strokeDashoffset: 0, duration: 0.8, stagger: 0.08 }, t + 0.3)
    .to(q(svg, '[data-g="curfew-note"]'), { opacity: 1, duration: 0.4 }, t + 1)
    .to(q(svg, "[data-gauge-fill]"), { scaleX: 1, duration: 1.2, ease: "power1.inOut" }, t + 1.3);
  // 3. pricing and fraud: the two checks slide in from either side
  const s = scene * 2;
  tl.to(q(svg, '[data-g="premium"]'), { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }, s)
    .to(q(svg, '[data-g="fraud"]'), { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }, s + 0.5);
  // 4. payout: both checks connect down to the UPI payout, then the no-forms line lights up
  const r = scene * 3;
  tl.to(q(svg, "[data-payout-flow]"), { strokeDashoffset: 0, duration: 0.5 }, r)
    .to(q(svg, '[data-g="payout"]'), { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, r + 0.4)
    .to(q(svg, '[data-g="no-forms"]'), { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, r + 1.3);
}

export const GIGGUARD_SCENES = Object.freeze({ setStart, addScenes });
