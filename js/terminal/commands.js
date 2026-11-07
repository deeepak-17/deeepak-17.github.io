/* Terminal commands. All content comes from CONTENT; all page effects go through siteApi. */

import { parse, createHistory, suggest } from "./core.js";
import { EGGS } from "./eggs.js";

export const SECTION_IDS = Object.freeze(["about", "skills", "projects", "contact"]);
const TOP_ALIASES = new Set(["~", "..", "/", "top"]);
const VIM_EXITS = new Set([":q", ":q!", ":wq", ":x"]);

const BANNER = [
  ["mauve", " ██████╗ ███████╗███████╗██████╗  █████╗ ██╗  ██╗"],
  ["mauve", " ██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██║ ██╔╝"],
  ["blue", " ██║  ██║█████╗  █████╗  ██████╔╝███████║█████╔╝ "],
  ["blue", " ██║  ██║██╔══╝  ██╔══╝  ██╔═══╝ ██╔══██║██╔═██╗ "],
  ["teal", " ██████╔╝███████╗███████╗██║     ██║  ██║██║  ██╗"],
  ["teal", " ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝"],
];

const HELP_ROWS = [
  ["about", "who I am"],
  ["skills", "tech I work with"],
  ["projects", "things I've built"],
  ["cd <place>", "jump the page to a section (try: cd projects)"],
  ["open <project>", "jump to a project (try: open clasp)"],
  ["ls", "list places and projects"],
  ["resume", "download my resume"],
  ["contact", "how to reach me"],
  ["history", "commands you've run"],
  ["clear", "clear the screen"],
  ["exit", "close the terminal"],
];

export const VISIBLE_NAMES = Object.freeze([
  "help", "about", "skills", "projects", "cd", "open", "ls", "resume",
  "contact", "socials", "banner", "history", "clear", "ui", "exit",
]);

/** @param {string} s */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const link = (href, text) =>
  `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
const heading = (title) => `<span class="c-mauve">── ${title} ──────────────────────────</span>`;

function buildCommands(ctx) {
  const { content, out, site, history } = ctx;
  const esc = escapeHtml;
  const projectIds = content.projects.map((p) => p.id);
  const block = (rows) => { rows.forEach((r) => out.line(r)); out.line(); };

  const contact = () => block([
    heading("contact"),
    `  <span class="c-blue">email</span>      <a href="mailto:${esc(content.profile.email)}">${esc(content.profile.email)}</a>`,
    `  <span class="c-blue">linkedin</span>   ${link(content.profile.linkedin, "deepak-senthilkumar")}`,
    `  <span class="c-blue">github</span>     ${link(content.profile.github, "deeepak-17")}`,
  ]);

  return {
    help: () => block([
      `<span class="c-yellow">Commands:</span>`,
      ...HELP_ROWS.map(([n, d]) => `  <span class="c-green">${esc(n.padEnd(16))}</span>${esc(d)}`),
      `<span class="c-dim">Tab completes, ↑/↓ walks history. A few commands aren't listed.</span>`,
    ]),
    about: () => block([
      heading("about"),
      ...content.about.paragraphs.map(esc),
      ...content.about.education.map(
        (e) => `  <span class="c-blue">${esc(e.institution)}</span>  ${esc(e.programme)}  <span class="c-dim">${esc(e.dates)}</span>`
      ),
    ]),
    skills: () => block([
      heading("skills"),
      ...content.skills.map(
        (s) => `  <span class="c-${s.colorToken.replace("--", "")}">${esc((s.group + "/").padEnd(18))}</span>${esc(s.items.join(", "))}`
      ),
    ]),
    projects: () => block([
      heading("projects"),
      ...content.projects.map((p) => `  <span class="c-mauve">${esc(p.id)}</span>  ${esc(p.title)}: ${esc(p.tagline)}`),
      `<span class="c-dim">Try</span> <span class="c-yellow">open ${esc(projectIds[0])}</span>`,
    ]),
    contact,
    socials: contact,
    banner: () => block([...BANNER.map(([c, l]) => `<span class="c-${c}">${l}</span>`), "", esc(content.profile.pitch)]),
    resume: () => {
      out.line(`<span class="c-green">Fetching resume…</span>`);
      site.downloadResume();
      out.line();
    },
    ls: () => block([
      SECTION_IDS.map((id) => `<span class="c-blue">${id}/</span>`).join("  "),
      projectIds.map((id) => `<span class="c-mauve">projects/${esc(id)}</span>`).join("  "),
    ]),
    cd: ([target]) => {
      const t = (target ?? "~").toLowerCase().replace(/\/$/, "");
      if (TOP_ALIASES.has(t)) { site.closeTerminal(); site.scrollToSection("top"); return; }
      if (SECTION_IDS.includes(t)) { site.closeTerminal(); site.scrollToSection(t); return; }
      block([`cd: no such directory: ${esc(t)}`]);
    },
    open: ([target]) => {
      const t = (target ?? "").toLowerCase();
      if (projectIds.includes(t)) { site.closeTerminal(); site.openProject(t); return; }
      block([`open: unknown project${t ? ` "${esc(t)}"` : ""}. Projects: ${projectIds.map(esc).join(", ")}`]);
    },
    ui: () => site.closeTerminal(),
    exit: () => site.closeTerminal(),
    clear: () => out.clear(),
    history: () => {
      const all = history.all();
      block(all.length ? all.map((h, i) => `  <span class="c-dim">${i + 1}</span>  ${esc(h)}`) : [`<span class="c-dim">(empty)</span>`]);
    },
    echo: (args) => block([esc(args.join(" "))]),
    whoami: () => block(["deepak: builds backends, trains models, refuses light mode."]),
    pwd: () => block(["/home/deepak/portfolio"]),
    date: () => block([esc(ctx.now().toString())]),
    cat: ([file]) => {
      const f = (file ?? "").toLowerCase();
      if (f === ".secrets") return block([`<span class="c-red">Nice try.</span> Curiosity is a good sign. Type <span class="c-yellow">sudo hire-me</span>.`]);
      if (!f) return block(["usage: cat &lt;file&gt;"]);
      return block([`cat: ${esc(f)}: No such file or directory`]);
    },
    vim: () => {
      ctx.setVim(true);
      block([`<span class="c-green">~</span>  VIM - Vi IMproved`, `<span class="c-green">~</span>  You are now trapped in vim. Type <span class="c-yellow">:q</span> to escape.`]);
    },
  };
}

/**
 * @param {{ content: object, out: { line(html?: string): void, clear(): void },
 *   site: { scrollToSection(id: string): void, openProject(id: string): void, closeTerminal(): void, downloadResume(): void },
 *   sleep?: (ms: number) => Promise<void>, now?: () => Date }} deps
 */
export function createCommands({ content, out, site, sleep, now = () => new Date() }) {
  const history = createHistory();
  let busy = false;
  let vimMode = false;
  const ctx = {
    content, out, site, history, now, esc: escapeHtml,
    sleep: sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))),
    setVim: (v) => { vimMode = v; },
  };
  const builtIns = Object.fromEntries(
    Object.entries(buildCommands(ctx)).map(([name, fn]) => [name, (_ctx, args) => fn(args)])
  );
  const table = { ...builtIns, nvim: (c) => table.vim(c, []), ...EGGS };
  const allNames = Object.freeze(Object.keys(table));

  const echoPrompt = (raw) =>
    out.line(`<span class="prompt-user">deepak@portfolio</span> <span class="prompt-path">~</span> <span class="prompt-char">❯</span> ${escapeHtml(raw)}`);

  async function dispatch(raw) {
    const trimmed = String(raw ?? "").replace(/\s+/g, " ").trim();
    echoPrompt(trimmed);
    if (vimMode) {
      if (VIM_EXITS.has(trimmed)) { vimMode = false; out.line(`<span class="c-green">You escaped vim. Achievement unlocked.</span>`); }
      else out.line(`<span class="c-dim">You're still in vim. (hint: :q)</span>`);
      out.line();
      return;
    }
    const { cmd, args } = parse(trimmed);
    if (!cmd) return;
    history.push(trimmed);
    const fn = table[cmd];
    if (fn) { await fn(ctx, args); return; }
    out.line(`<span class="c-red">command not found:</span> ${escapeHtml(cmd)}`);
    const guess = suggest(cmd, [...VISIBLE_NAMES]);
    if (guess) out.line(`<span class="c-dim">did you mean</span> <span class="c-yellow">${guess}</span><span class="c-dim">?</span>`);
    out.line();
  }

  return {
    visibleNames: VISIBLE_NAMES,
    allNames,
    history,
    isBusy: () => busy,
    async run(raw) {
      busy = true;
      try {
        await dispatch(raw);
      } finally {
        busy = false;
      }
    },
  };
}
