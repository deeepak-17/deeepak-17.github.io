/* First-visit boot screen: a short console boot that shrinks into the terminal toggle. Any key or tap skips it. */

export const BOOT_LINES = Object.freeze([
  { html: `<span class="c-dim">[  OK  ]</span> Mounting /home/deepak`, ms: 110 },
  { html: `<span class="c-dim">[  OK  ]</span> Loading Catppuccin Mocha`, ms: 110 },
  { html: `<span class="c-dim">[  OK  ]</span> Starting zsh`, ms: 110 },
  { html: `<span class="c-green">[ DONE ]</span> portfolio.service started`, ms: 160 },
]);
const TYPED = "ui";
const KEY_MS = 90;
const LEAVE_MS = 420;
const SKIP_EVENTS = ["keydown", "pointerdown", "wheel", "touchstart"];

const wait = (ms, signal) =>
  new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });

/**
 * @param {{ root: HTMLElement }} deps
 * @returns {Promise<"done" | "skipped">}
 */
export async function runBoot({ root }) {
  root.insertAdjacentHTML(
    "beforeend",
    `<div class="boot" id="boot" aria-hidden="true"><div><div class="boot__log" id="boot-log"></div><p class="boot__skip">press any key to skip</p></div></div>`
  );
  const overlay = root.querySelector("#boot");
  const log = overlay.querySelector("#boot-log");
  const controller = new AbortController();
  const { signal } = controller;
  const skip = () => controller.abort();
  SKIP_EVENTS.forEach((type) => document.addEventListener(type, skip, { once: true, passive: true }));
  const addLine = (html) => { const d = document.createElement("div"); d.innerHTML = html; log.appendChild(d); return d; };

  for (const line of BOOT_LINES) {
    if (signal.aborted) break;
    addLine(line.html);
    await wait(line.ms, signal);
  }
  if (!signal.aborted) {
    const prompt = addLine(`<span class="prompt-user">deepak@portfolio</span> <span class="prompt-path">~</span> <span class="prompt-char">❯</span> `);
    for (const ch of TYPED) {
      if (signal.aborted) break;
      prompt.append(ch);
      await wait(KEY_MS, signal);
    }
  }
  const skipped = signal.aborted;
  SKIP_EVENTS.forEach((type) => document.removeEventListener(type, skip));
  if (!skipped) {
    overlay.classList.add("is-leaving");
    await wait(LEAVE_MS, signal);
  }
  overlay.remove();
  return skipped ? "skipped" : "done";
}
