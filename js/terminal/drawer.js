/* Drop-down terminal: dialog markup, focus trap, key handling. Commands are attached after creation
   because they need this drawer's `out` (see ledger ruling). */

import { complete } from "./core.js";

const CHIPS = ["about", "projects", "resume", "contact"];
const CLOSE_MS = 260;
const FOCUSABLE = "button, [href], input, [tabindex]:not([tabindex='-1'])";

const MARKUP = `
  <div class="term-backdrop" id="term-backdrop" hidden></div>
  <div class="term-drawer" id="term-drawer" role="dialog" aria-modal="true" aria-label="Terminal" hidden>
    <div class="term-head">
      <span class="term-head__path"><span class="prompt-user">deepak@portfolio</span> <span class="prompt-path">~</span></span>
      <button class="term-close" id="term-close" type="button" aria-label="Close terminal">esc</button>
    </div>
    <div class="term-body" id="term-body">
      <div class="term-output" id="term-output" role="log" aria-live="polite"></div>
      <label class="term-line">
        <span class="visually-hidden">Terminal command</span>
        <span class="prompt-char" aria-hidden="true">❯</span>
        <input class="term-input" id="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" />
      </label>
    </div>
    <div class="term-chips" aria-label="Quick commands">
      ${CHIPS.map((c) => `<button type="button" data-cmd="${c}">${c}</button>`).join("")}
    </div>
  </div>`;

const isEditable = (el) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * @param {{ root: HTMLElement, toggle: HTMLElement | null, reducedMotion: () => boolean }} deps
 */
export function createDrawer({ root, toggle, reducedMotion }) {
  root.insertAdjacentHTML("beforeend", MARKUP);
  const el = root.querySelector("#term-drawer");
  const backdrop = root.querySelector("#term-backdrop");
  const output = el.querySelector("#term-output");
  const body = el.querySelector("#term-body");
  const input = el.querySelector("#term-input");
  let commands = null;
  let returnFocus = null;
  let closeTimer = null;
  let welcomed = false;

  const out = {
    line(html = "") {
      const div = document.createElement("div");
      div.className = "term-row";
      div.innerHTML = html || "&nbsp;";
      output.appendChild(div);
      body.scrollTop = body.scrollHeight;
    },
    clear() { output.replaceChildren(); },
  };

  const isOpen = () => !el.hidden && el.classList.contains("is-open");

  function open() {
    if (isOpen()) return;
    clearTimeout(closeTimer);
    const active = document.activeElement;
    returnFocus = active instanceof HTMLElement && active !== document.body ? active : toggle;
    el.hidden = false;
    backdrop.hidden = false;
    void el.offsetWidth; // let the transition start from the closed state
    el.classList.add("is-open");
    backdrop.classList.add("is-open");
    document.body.classList.add("term-locked");
    toggle?.setAttribute("aria-expanded", "true");
    if (!welcomed && commands) {
      welcomed = true;
      commands.run("banner").then(() => {
        output.lastElementChild?.remove(); // drop the echoed prompt spacing
        out.line(`Type <span class="c-yellow">help</span>, or try <span class="c-green">cd projects</span>. <span class="c-dim">Esc closes.</span>`);
        out.line();
      });
    }
    input.focus();
  }

  function close() {
    if (el.hidden) return;
    el.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    document.body.classList.remove("term-locked");
    toggle?.setAttribute("aria-expanded", "false");
    const finish = () => { el.hidden = true; backdrop.hidden = true; };
    if (reducedMotion()) finish(); else closeTimer = setTimeout(finish, CLOSE_MS);
    const target = returnFocus && document.contains(returnFocus) ? returnFocus : toggle;
    target?.focus({ preventScroll: true });
  }

  const toggleOpen = () => (isOpen() ? close() : open());

  async function submit(raw) {
    if (!commands || commands.isBusy()) return;
    input.value = "";
    await commands.run(raw);
    if (isOpen()) input.focus();
  }

  function onInputKey(e) {
    const history = commands?.history;
    if (e.key === "Enter") { e.preventDefault(); submit(input.value); return; }
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "`" && input.value === "") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowUp" && history) { e.preventDefault(); const v = history.prev(); if (v !== null) input.value = v; return; }
    if (e.key === "ArrowDown" && history) { e.preventDefault(); input.value = history.next(); return; }
    if (e.key === "Tab" && !e.shiftKey && input.value.trim()) {
      e.preventDefault();
      const result = complete(input.value, [...(commands?.visibleNames ?? [])]);
      if (result.kind === "one") input.value = `${result.value} `;
      if (result.kind === "many") { out.line(result.matches.map((m) => `<span class="c-teal">${m}</span>`).join("  ")); out.line(); }
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); out.clear(); return; }
    if (e.ctrlKey && e.key.toLowerCase() === "c" && !window.getSelection()?.toString()) {
      e.preventDefault();
      out.line(`<span class="c-dim">${input.value.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}^C</span>`);
      input.value = "";
    }
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const items = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function onGlobalKey(e) {
    if (isOpen() || el.contains(e.target)) return;
    const wantsToggle = e.key === "`" || (e.ctrlKey && e.key.toLowerCase() === "k");
    if (!wantsToggle || e.metaKey || e.altKey) return;
    if (isEditable(document.activeElement)) return;
    e.preventDefault();
    open();
  }

  input.addEventListener("keydown", onInputKey);
  el.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); else trapFocus(e); });
  el.querySelector("#term-close").addEventListener("click", close);
  el.querySelectorAll(".term-chips button").forEach((b) => b.addEventListener("click", () => submit(b.dataset.cmd)));
  body.addEventListener("click", (e) => { if (!window.getSelection()?.toString() && e.target === body) input.focus(); });
  backdrop.addEventListener("click", close);
  toggle?.addEventListener("click", toggleOpen);
  document.addEventListener("keydown", onGlobalKey);

  return {
    out,
    open,
    close,
    toggle: toggleOpen,
    isOpen,
    attach(cmds) { commands = cmds; },
    run: (raw) => submit(raw),
  };
}
