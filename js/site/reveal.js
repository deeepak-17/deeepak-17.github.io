/* Reveal-once: adds .is-seen the first time each [data-reveal] enters the viewport. */

const ROOT_MARGIN = "0px 0px -15% 0px";

/** @param {ParentNode} root @returns {() => void} disconnect */
export function initReveal(root) {
  const targets = [...root.querySelectorAll("[data-reveal]")];
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-seen"));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-seen");
        io.unobserve(entry.target);
      }),
    { rootMargin: ROOT_MARGIN }
  );
  targets.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
