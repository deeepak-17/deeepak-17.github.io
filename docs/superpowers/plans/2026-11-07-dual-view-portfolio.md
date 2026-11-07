# Dual-View Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the terminal-first portfolio with a scroll-animated site plus a drop-down terminal that drives it, both rendered from one content source.

**Architecture:**
- Static site with plain ES modules and no build step.
- Pure logic (content validation, boot decision, terminal engine, commands) lives in DOM-free modules that are unit-tested with `node:test`.
- Thin DOM layers (render, reveal, drawer, boot, CLASP chapter) are covered by Playwright.
- GSAP is lazily loaded only for the CLASP pinned chapter.

**Tech Stack:**
- HTML, CSS and plain JS (ES2022 modules)
- GSAP 3.12.5 + ScrollTrigger from cdnjs
- `node:test` (Node 25)
- `@playwright/test` 1.65.0 (dev only)
- Hallmark scaffold and sloplint

**Spec:** `docs/superpowers/specs/2026-11-07-dual-view-portfolio-design.md`

## Global Constraints

- No runtime dependencies except GSAP, loaded from `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` and `.../ScrollTrigger.min.js`.
- Lenis, smooth-scroll libraries and scroll listeners for animation are not allowed.
- Every colour and font goes through a token in `css/tokens.css`. There are no literal colours or `font-family` values outside the token block.
- Fonts:
  - Display and terminal: JetBrains Mono.
  - Body: IBM Plex Sans (Google Fonts).
  - Body text is at least 16px.
- Palette: Catppuccin Mocha. Keep the existing variable values from the old `style.css` `:root`.
- Motion:
  - Only the hero load reveal (under 600 ms), reveal-once, and the CLASP GSAP scrub are allowed.
  - Only `transform` and `opacity` may animate. Never `transition: all`.
  - Every animation has a `prefers-reduced-motion: reduce` fallback.
  - Content is visible with JS off.
- Hallmark floor:
  - No traffic-light dots or drawn window chrome.
  - No eyebrows.
  - No tracked capitals.
  - No middle-dot meta strings.
  - No emoji icons in the UI.
  - No invented or joke metrics.
  - `overflow-x: clip` on `html` and `body`.
  - `:focus-visible` on every interactive element.
  - About 80 words or fewer per screen.
- Hero: the headline is 7 words or fewer, the sentence is 12 words or fewer, and the actions are `view work` and `resume`. All of it is visible at 1280×800.
- Content facts come only from `/Users/deepak/Resumes/Resume-Master.pdf`. No CyberShield, no hackathon claims, no journey section.
- Email `deepaksenthilkumar242@gmail.com`. LinkedIn `https://www.linkedin.com/in/deepak-senthilkumar-66674a2a5`. GitHub `https://github.com/deeepak-17`.
- The CLASP `repoUrl` is `null`, and the repo link is not rendered when null.
- Commits use conventional commit format with no AI attribution lines.
- Preview command: `python3 -m http.server 8000` from `portfolio/`.

## Review Focus

1. **Typing a backtick inside the terminal input:** it should insert a backtick when the input is non-empty, and close the drawer only when the input is empty. The test lives in Task 6.
2. **`sessionStorage` throws (Safari private browsing):** the page must still load, with no boot and no errors. Tests live in Tasks 2 and 7.
3. **Resizing across 40rem while the CLASP chapter is pinned:** this must not leave a stuck pin or hidden steps. ScrollTrigger `matchMedia` must revert. The test lives in Task 5.
4. **Pasting a multi-line or very long string into the terminal:** it should run as one command with newlines collapsed to spaces, and the line should wrap rather than overflow. Tests live in Tasks 3 and 6.
5. **Pressing the shortcut or the button during the boot animation:** this should skip the boot and open the drawer, with no double-init. The test lives in Task 7.

---

### Task 1: Tooling, content and validation

**Files:**
- Create:
  - `package.json`: `"type": "module"`, plus scripts:
    - `test`: `node --test tests/unit/`
    - `test:cov`: `node --test --experimental-test-coverage tests/unit/`
    - `e2e`: `playwright test`
  - `js/content.js`
  - `js/validate.js`
  - `tests/unit/validate.test.mjs`
- Modify: `.gitignore` (already has `node_modules/`, so nothing to add if present)

**Interfaces:**
- Produces:
  - `CONTENT` (a deep-frozen object, shape below)
  - `validateContent(content) -> { ok: boolean, errors: string[], valid: { [section]: boolean } }`
  - `deepFreeze(obj) -> obj`

`CONTENT` shape (exact keys):
```js
{
  profile:  { name, headline, pitch, email, linkedin, github, resumeUrl },
  about:    { paragraphs: string[], education: [{ institution, programme, dates }] },
  neofetch: [{ key, value }],
  skills:   [{ group, colorToken, items: string[] }],
  projects: [{ id, title, tagline, steps: [{ title, body }], stack: string[], repoUrl }],
}
```

Values:
- **`profile`:**
  - `name`: "Deepak S"
  - `headline`: "I build backends and make models fit." (7 words; avoids the two-fragment shape Hallmark bans)
  - `pitch`: "Final-year CS student building backend systems and applied ML."
  - `resumeUrl`: "assets/Deepak_S_Resume.pdf"
- **`about.paragraphs`:** two paragraphs rewritten from the resume summary. Mention no hackathons. Stay at or under 80 words in total.
- **`education`:** the two entries from spec §5.3.
- **`skills`:** the four groups from spec §5.4, with `colorToken` set to `--blue`, `--mauve`, `--green` and `--peach`.
- **`projects`:** one entry with `id: "clasp"` and the four steps from spec §5.5, with `repoUrl: null`.

- [ ] **Step 0: Baseline commit** of the legacy files so they stay in history: `git add index.html style.css script.js README.md assets && git commit -m "chore: import legacy terminal portfolio"`
- [ ] **Step 1: Write failing tests**
  - `validateContent(CONTENT).ok === true`
  - removing `profile.email` gives `ok === false` and an error containing `"profile.email"`, while `valid.skills` stays `true`
  - `projects[0].steps.length === 4`
  - `Object.isFrozen(CONTENT.projects[0].steps)`
  - `JSON.stringify(CONTENT)` doesn't match `/cybershield|hackathon/i`
  - a project with `repoUrl: null` is valid
- [ ] **Step 2: Run** `npm test`. Expected: FAIL, because the modules aren't found yet.
- [ ] **Step 3: Implement** `content.js` and `validate.js`.
  - `validateContent` checks required string fields per section, records a dotted path for each missing field, and never throws.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add content source and validation`

### Task 2: Safe storage and the boot decision

**Files:**
- Create:
  - `js/storage.js`
  - `js/boot-decision.js`
  - `tests/unit/storage.test.mjs`
  - `tests/unit/boot-decision.test.mjs`

**Interfaces:**
- Produces:
  - `createSafeStorage(backing) -> { get(key): string|null, set(key, value): boolean }`. It never throws. When `backing` throws or is undefined, `get` returns null and `set` returns false.
  - `shouldBoot({ storage, hash, search, reducedMotion }) -> boolean`
  - `BOOT_SEEN_KEY = "portfolio.bootSeen"`

- [ ] **Step 1: Write failing tests**
  - `shouldBoot` is true only when `storage.get(BOOT_SEEN_KEY) === null`, `hash === ""`, `search` has no `view` param, and `reducedMotion === false`.
  - Each condition flipped individually gives false.
  - A storage whose backing throws on `getItem` gives `shouldBoot === false` (Review Focus 2), and `set` returns false.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** both modules.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add safe storage and boot decision`

### Task 3: Terminal engine core (DOM-free)

**Files:**
- Create:
  - `js/terminal/core.js`
  - `tests/unit/core.test.mjs`

**Interfaces:**
- Produces:
  - `parse(raw) -> { cmd: string, args: string[] }`. It trims, collapses whitespace including `\n`, and lowercases `cmd` only.
  - `createHistory() -> { push(line), prev(): string|null, next(): string, all(): string[] }`. Immutable snapshots come from `all()`, and empty lines aren't pushed.
  - `complete(prefix, names) -> { kind: "none"|"one"|"many", value?: string, matches?: string[] }`
  - `suggest(cmd, names) -> string|null`. This is a Levenshtein distance of 2 or less against the full name list, picking the lowest distance. It replaces the old 2-character prefix guess.

- [ ] **Step 1: Write failing tests**
  - `parse("  CD   projects ")` deep-equals `{cmd:"cd", args:["projects"]}`.
  - `parse("echo a\nb")` gives args `["a","b"]` (Review Focus 4).
  - `parse("")` gives `{cmd:"", args:[]}`.
  - History: after pushing "a" then "b", `prev()` is "b", `prev()` again is "a", `prev()` at the start stays "a", and `next()` past the end is "".
  - `complete("pr", ["projects","pwd","help"])` gives `{kind:"one", value:"projects"}`. Prefix matching is used, and "pwd" doesn't start with "pr".
  - `complete("p", ...)` gives `many`.
  - `suggest("hlep", names)` is "help", and `suggest("zzzzzz", names)` is null.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `core.js`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add DOM-free terminal core`

### Task 4: Commands

**Files:**
- Create:
  - `js/terminal/commands.js`
  - `js/terminal/eggs.js`
  - `tests/unit/commands.test.mjs`

**Interfaces:**
- Consumes:
  - `CONTENT` (Task 1)
  - `suggest` and `parse` (Task 3)
- Produces:
  - `createCommands({ content, out, site, sleep, now }) -> { run(raw): Promise<void>, visibleNames: string[], allNames: string[], isBusy(): boolean }`
  - `out` is `{ line(html), clear() }`.
  - `site` is the `siteApi`: `{ scrollToSection(id), openProject(id), closeTerminal(), downloadResume() }`.
  - `run` awaits every command, including `sudo rm` (the review fix), and sets busy for its duration.
  - All user text goes through `escapeHtml(s)`, which is exported.

Commands:
- **Info commands** are listed in spec §7. Their text is generated from `content`, with no literal content strings. For example, `skills` maps over `content.skills`.
- **`ls`** lists the section ids `about`, `skills`, `projects` and `contact`, followed by the project ids.
- **`cd <id>`:**
  - A known section calls `site.closeTerminal()` then `site.scrollToSection(id)`.
  - `~` and `..` scroll to `"top"`.
  - Anything else prints `cd: no such directory: <id>`.
- **`open <id>`:** a known project id calls `closeTerminal` then `openProject`. Anything else prints an error listing the valid ids.
- **`ui` and `exit`** call `closeTerminal()`.
- **Vim mode** is state inside the closure, as in the old `script.js`.
- **The easter eggs** port from the old `script.js` into `eggs.js` as `(ctx, args) => …`. Nothing references CyberShield.

- [ ] **Step 1: Write failing tests** using a fake `out` that records lines and a fake `site` that records calls.
  - `run("cd projects")` records `["closeTerminal", ["scrollToSection","projects"]]`.
  - `run("cd nowhere")` produces a line containing "no such directory".
  - `run("open clasp")` records `openProject("clasp")`.
  - `run("skills")` produces lines containing "FAISS" and not containing "gRPC".
  - `run("sudo rm -rf /")` resolves only after its final line "Just kidding" is printed, using a `sleep` stub that counts calls.
  - `isBusy()` is true during an awaited `run`.
  - `run("echo <b>x</b>")` outputs `&lt;b&gt;`.
  - `run("hlep")` suggests "help".
  - `run("vim")` then `run("ls")` stays in vim mode, and `run(":q")` exits it.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `commands.js` and `eggs.js`.
- [ ] **Step 4: Run** `npm run test:cov`. Expected: PASS, with 80% or more line coverage on `js/terminal/*` and `js/*.js` logic files.
- [ ] **Step 5: Commit:** `feat: add terminal commands driven by content and siteApi`

### Task 5: Site shell, tokens, render, reveal and CLASP chapter

Do this with the `hallmark` skill loaded, in a custom direction with the palette preserved, and with `ui-ux-pro-max` for any stack or accessibility lookup.

**Files:**
- Create:
  - `css/tokens.css`
  - `css/base.css`: from `node ~/.claude/skills/hallmark/scripts/theme.mjs scaffold --custom --dir css`, then fill the Catppuccin tokens and the font tokens.
  - `css/site.css`
  - `js/site/render.js`
  - `js/site/reveal.js`
  - `js/site/clasp-chapter.js`
- Replace: `index.html`
- Test: `tests/e2e/site.spec.mjs`

**Interfaces:**
- Consumes:
  - `CONTENT`
  - `validateContent`
- Produces:
  - `renderSite(root: HTMLElement, content, validity) -> void`. It fills `#about`, `#skills`, `#projects` and `#contact`.
  - `initReveal(root) -> () => void`. It adds the `.js` class to `<html>` and sets `.is-seen` once through IntersectionObserver.
  - `initClaspChapter(section: HTMLElement) -> Promise<() => void>`:
    - It runs only under `(min-width: 40rem) and (prefers-reduced-motion: no-preference)` through `gsap.matchMedia()`.
    - It injects the GSAP scripts lazily the first time the section comes within 1 viewport.
    - On load failure it logs `console.warn("clasp-chapter: GSAP unavailable, static layout")` and resolves.
  - DOM ids: `#hero`, `#about`, `#skills`, `#projects`, `#clasp`, `#contact`, `#hero-cmd` (the signature command button), `#term-toggle`.

`index.html` contents:
- The static hero (name, headline, pitch, actions, `#hero-cmd` showing `❯ cd projects`, and the neofetch facts list) is written directly in HTML. That way it's visible with no JS and passes the 1280×800 check.
- Below the hero, the sections are empty `<section>` shells filled by `renderSite`.
- A `<noscript>` block holds the name, pitch and email/GitHub/resume links.
- The `<head>` contains:
  - Open Graph and Twitter tags (title "Deepak S — Software Engineer", the description from `pitch`)
  - `<link rel="icon" href="assets/favicon.svg">`, a mauve `❯` glyph on crust
  - the Google Fonts link for JetBrains Mono 400/500/700 and IBM Plex Sans 400/500/600
- The CLASP chapter is an SVG with four groups:
  - `#g-problem`
  - `#g-layers`: base, cluster and client rectangles stacked
  - `#g-clients`: 6 client nodes flowing into an aggregation node labelled "SVD low-rank aggregation"
  - `#g-registry`: a registry box labelled "versioned adapters · HumanEval gate". In the SVG, the dot is replaced with a line break to respect the floor rule.
- It includes `<title>` and `<desc>`. Its base CSS shows every group at full opacity. The GSAP timeline scrubs the groups from `opacity: 0.15` and `y: 12` to their final state, with steps synced at 0–25%, 25–50%, 50–75% and 75–100% of a `300vh` track using `scrub: true` and `pin: ".clasp__pin"`.

- [ ] **Step 1: Write failing Playwright tests** in `site.spec.mjs` (Task 8 sets up the config; create a minimal `playwright.config.mjs` now with `webServer: { command: "python3 -m http.server 8000", url: "http://localhost:8000" }` and the projects chromium and webkit).
  - At 1280×800, the `h1`, the `.hero__pitch` and `a:has-text("view work")` are in the viewport.
  - At 360×780, `document.documentElement.scrollWidth <= clientWidth`.
  - With `reducedMotion: "reduce"`, all 4 CLASP step headings are visible, and `.clasp__pin` has computed `position` other than `fixed`.
  - With `javaScriptEnabled: false`, the noscript email link is visible.
  - Review Focus 3: at 1280 wide, scroll to the middle of `#clasp`, resize to 375, then assert that every step heading has opacity 1 and the section isn't pinned (no `pin-spacer` with a fixed child).
- [ ] **Step 2: Run** `npx playwright install chromium webkit && npm run e2e -- site.spec.mjs`. Expected: FAIL.
- [ ] **Step 3: Hero first.** Write the nav and hero, then run `node ~/.claude/skills/hallmark/scripts/sloplint.mjs index.html css/site.css --render --stage hero`. Fix every FAIL, then run the Hallmark hero review (gates §6).
- [ ] **Step 4: Implement** the rest of `render.js`, `reveal.js`, `clasp-chapter.js` and `site.css`, filling the stamp line and critique line at the top of `site.css`.
- [ ] **Step 5: Run** `npm run e2e -- site.spec.mjs`. Expected: PASS on chromium and webkit.
- [ ] **Step 6: Commit:** `feat: build scrolling site with CLASP pinned chapter`

### Task 6: Drawer and terminal DOM layer

**Files:**
- Create:
  - `css/terminal.css`
  - `js/terminal/drawer.js`
- Test: `tests/e2e/terminal.spec.mjs`

**Interfaces:**
- Consumes:
  - `createCommands` (Task 4)
  - `createHistory` and `complete` (Task 3)
- Produces:
  - `createDrawer({ root, commands, history }) -> { open(), close(), toggle(), isOpen(): boolean, out: { line, clear } }`
  - Markup: `#term-drawer[role=dialog][aria-modal=true][aria-label="Terminal"]`, `#term-output[role=log]`, `#term-input` (a real visible `<input>` styled as a prompt, which replaces the hidden-input hack), `#term-close`, `.term-chips button[data-cmd]`, and `#term-backdrop`.

Behaviour:
- **Opening:** slides with `transform: translateY` and is 60vh tall at 40rem and above, full-screen below that. While open, `document.body` has `overflow: hidden`.
- **Focus:** focus is trapped (Tab and Shift+Tab cycle between the input, the chips and the close button), and on close it returns to the element that was active before opening.
- **Keys in the input:**
  - Enter runs the command, ignored while `commands.isBusy()`.
  - Up and Down walk the history, and Tab completes.
  - Ctrl+L clears the screen, and Ctrl+C prints the line with `^C` appended.
  - Esc closes the drawer.
  - Backtick closes the drawer only when `input.value === ""`. Otherwise it types normally (Review Focus 1).
- **Long input:** the CSS sets `overflow-wrap: anywhere` on output and input (Review Focus 4).

- [ ] **Step 1: Write failing Playwright tests:**
  - Press backtick on the body, and the drawer is visible with the input focused.
  - Type `cd projects` and press Enter, and the drawer is hidden while `#projects` is in the viewport within 1500 ms.
  - Type `echo a` then press backtick, and the drawer is still open with the input value "echo a`".
  - Esc closes the drawer, and focus returns to `#term-toggle` when the drawer was opened by clicking it.
  - Tab focus stays inside the drawer across 5 presses.
  - At 375px, clicking the chip `about` runs `about` (the output contains "Amrita").
  - Paste a 500-character string and press Enter, and `#term-output` has `scrollWidth <= clientWidth`.
- [ ] **Step 2: Run** `npm run e2e -- terminal.spec.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `drawer.js` and `terminal.css`, with no window dots and no title bar dots. The header shows the prompt path `deepak@portfolio ~` and the close button.
- [ ] **Step 4: Run** `npm run e2e -- terminal.spec.mjs`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: add drop-down terminal drawer`

### Task 7: Boot sequence and main wiring

**Files:**
- Create:
  - `js/boot.js`
  - `js/main.js`
- Test: `tests/e2e/boot.spec.mjs`

**Interfaces:**
- Consumes everything above.
- Produces:
  - `runBoot({ overlay, lines, signal }) -> Promise<"done"|"skipped">`. Any key or pointer event aborts it through an `AbortController`.
  - `main.js` (no exports) builds `siteApi`:
    - `scrollToSection(id)` uses `el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })`, and `"top"` scrolls to `#hero`.
    - `openProject(id)` scrolls to `#<id>`.
    - `closeTerminal()` calls `drawer.close()`.
    - `downloadResume()` clicks a temporary `<a download>`.
  - `main.js` wires:
    - the global shortcuts (backtick and Ctrl+K, ignored in `input`, `textarea` and `[contenteditable]` outside the drawer)
    - `#hero-cmd` (clicking runs `cd projects`)
    - `?view=terminal`, which opens the drawer
    - the email copy button: `navigator.clipboard.writeText`. On rejection it selects the email text and shows "press Ctrl/Cmd+C".
    - the footer year
  - On boot completion, `storage.set(BOOT_SEEN_KEY, "1")`.

- [ ] **Step 1: Write failing Playwright tests:**
  - A new context shows `#boot` and then `#hero` within 2500 ms.
  - Reloading the same page shows no `#boot`.
  - `/#projects` and `?view=terminal` show no boot, and `?view=terminal` shows the drawer open.
  - Pressing a key during the boot makes the boot disappear within 300 ms.
  - Review Focus 5: pressing backtick during the boot skips it and opens the drawer, with exactly one `#term-drawer` in the DOM.
  - Review Focus 2: an init script that makes `sessionStorage` throw causes no console errors and shows the hero.
  - Clicking `#hero-cmd` puts `#projects` in view.
- [ ] **Step 2: Run** `npm run e2e -- boot.spec.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `boot.js` and `main.js`:
  - The boot lines match the old `BOOT_LINES` text and are followed by an auto-typed `❯ ui`.
  - The boot ends by transforming the overlay to scale 0.1 at the `#term-toggle` position, using opacity and transform only.
- [ ] **Step 4: Run** `npm run e2e`. Expected: all specs PASS on chromium and webkit.
- [ ] **Step 5: Commit:** `feat: add boot sequence and wire views together`

### Task 8: Cleanup, assets and docs

**Files:**
- Delete:
  - `style.css`, `script.js` (old)
  - `assets/resume.pdf` (the placeholder)
  - `/Users/deepak/projects/Potrtfolio/index.html`, `style.css`, `script.js` (the root duplicates, outside the repo, identical to the old files: verify with `cmp` before deleting)
- Create:
  - `assets/Deepak_S_Resume.pdf` (copied from `/Users/deepak/Resumes/Resume-Master.pdf`)
  - `assets/favicon.svg`, if not already created in Task 5
  - `assets/og.png`: a 1200×630 capture of the hero via `node ~/.claude/skills/hallmark/scripts/capture.mjs` or a Playwright screenshot
- Modify: `README.md` (new structure, `python3 -m http.server`, `npm test`, `npm run e2e`, deploy steps, how to add a project in `content.js`)

- [ ] **Step 1: Verify** that the root duplicates match the legacy baseline commit from Task 1, Step 0: run `git show HEAD~N:index.html | cmp - ../index.html` (and the same for `style.css` and `script.js`), where N is the number of commits back to that baseline. Expected: no output. They were already confirmed identical on 2026-11-07.
- [ ] **Step 2: Copy** the resume and delete the placeholder and old files.
- [ ] **Step 3: Run** `npm test && npm run e2e`. Expected: PASS. Then run `grep -rn "your.email\|your-handle\|placeholder" index.html js css`. Expected: no output.
- [ ] **Step 4: Commit:** `chore: remove legacy files, add real resume and docs`

### Task 9: Hallmark sweep and final verification

- [ ] **Step 1: Run** `node ~/.claude/skills/hallmark/scripts/sloplint.mjs index.html css/*.css --genre modern-minimal --render`. Fix every FAIL, and fix or waive every REFLEX in the stamp. Re-run until there are 0 FAIL.
- [ ] **Step 2: Walk** `gates.md` §5 (J and R/J gates), then run the finish review in fresh context (§6) and act on its verdict.
- [ ] **Step 3: Run** `npm run test:cov && npm run e2e`. Expected: all pass, with 80% or more coverage on the logic modules.
- [ ] **Step 4: Manual check** in Chrome and Safari at desktop size and at 375px:
  - the boot
  - the backtick shortcut
  - `cd projects`
  - the CLASP scrub
  - the resume download (must open the real PDF)
  - copying the email
- [ ] **Step 5: Log** with `theme.mjs log --entry '<json>'`, then update the Picks block outcome in the stamp.
- [ ] **Step 6: Commit:** `chore: hallmark sweep fixes`
