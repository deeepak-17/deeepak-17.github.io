/* Loads GSAP + ScrollTrigger from cdnjs once; every caller shares the same promise. */

const GSAP_SRC = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
const SCROLL_TRIGGER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";

let pending = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/** @returns {Promise<any>} window.gsap with ScrollTrigger registered */
export function loadGsap() {
  if (!pending) {
    pending = (async () => {
      if (!window.gsap) await loadScript(GSAP_SRC);
      if (!window.ScrollTrigger) await loadScript(SCROLL_TRIGGER_SRC);
      window.gsap.registerPlugin(window.ScrollTrigger);
      return window.gsap;
    })();
    pending.catch(() => { pending = null; });
  }
  return pending;
}
