# Dual-View Portfolio — Design Spec

**Date:** 2026-11-07 · **Owner:** Deepak S · **Status:** awaiting review

## 1. Goal

One portfolio, two views: a scroll-animated site that a non-technical visitor understands in about 10 seconds, plus the existing terminal, now a drop-down console that can drive the site.

**Audience:** recruiters and hiring managers for SWE/ML roles come first. Developers are a secondary audience.
**Job:** hire. The action is to contact Deepak or download the resume.
**Success:**
- A newcomer sees Deepak's name, his pitch and a primary action without scrolling, at 1280×800.
- A developer discovers the terminal and uses it to navigate.
- Both views render from one content source.

## 2. Direction ("best of both": Hallmark floor + one rich animation)

- **Idea:** *the portfolio is a shell: every section is a place you can scroll to or `cd` into.*
- **Look:**
  - The existing Catppuccin Mocha tokens are preserved (pre-flight: project palette).
  - Display and terminal face: JetBrains Mono. Monospace is the material of this site.
  - Body face: IBM Plex Sans, replacing Space Grotesk, which is saturated as a default.
- **Signature:** the terminal driving the page. A real command line in the hero shows `❯ cd projects`. Pressing Enter or clicking it runs the command and the page scrolls.
- **Motion budget:** three primitives, all with a static end state.
  1. **Hero load reveal:** opacity and transform, under 600 ms. The name is readable immediately and is never typed out.
  2. **Reveal-once on sections:** IntersectionObserver adds `.is-seen`. Content is visible without JS.
  3. **CLASP pinned chapter:** GSAP ScrollTrigger scrubs the diagram. This is the page's one rich animation, and the only place GSAP is used.
- **Excluded:**
  - Lenis or any scroll hijacking (native scrolling only; `scroll-behavior: smooth` for anchor links)
  - typing effects, count-ups, parallax, staggered chips, the scroll progress bar
- **Hallmark floor items to honour:**
  - No drawn OS window or traffic-light dots.
  - No eyebrows or tracked capitals.
  - No middle-dot meta strings.
  - No emoji used as icons in the UI. Emoji inside terminal easter-egg output is fine.
  - No invented or joke metrics.
  - About 80 words per screen at most.
  - Tokens only for colour and font.
  - `overflow-x: clip` on `html` and `body`.
  - `:focus-visible` on every control.
  - A reduced-motion fallback for every animation.
  - The sloplint `--render` sweep passes before hand-off.

## 3. Architecture

Static site with plain ES modules and no build step, deployed on GitHub Pages. The local preview needs `python3 -m http.server`, because ES modules don't load from `file://`.

```
portfolio/
├── index.html                 shell: boot screen, site sections, terminal drawer, <noscript> fallback
├── css/
│   ├── tokens.css             Catppuccin Mocha + type/space scale (Hallmark scaffold)
│   ├── base.css               floor rules (Hallmark scaffold)
│   ├── site.css               scrolling site
│   └── terminal.css           drawer + boot screen
├── js/
│   ├── content.js             single source of truth (frozen object)
│   ├── validate.js            validateContent(content) → { ok, errors }
│   ├── main.js                entry: boot decision, drawer open/close, ?view=, site API
│   ├── boot.js                first-visit boot sequence
│   ├── storage.js             safe sessionStorage wrapper
│   ├── site/render.js         builds sections from content
│   ├── site/reveal.js         reveal-once observer
│   ├── site/clasp-chapter.js  lazily loads GSAP and builds the scrubbed diagram
│   ├── terminal/engine.js     input, history, Tab completion, keys (DOM-free core + thin DOM layer)
│   └── terminal/commands.js   info, page-control and easter-egg commands
├── assets/resume.pdf
├── tests/unit/*.test.mjs      node:test
└── tests/e2e/*.spec.mjs       Playwright
```

**Boundaries:**
- `content.js` feeds `render.js` and `commands.js`. Neither of those holds content of its own.
- The terminal talks to the site only through `siteApi`, which `main.js` provides: `{ scrollToSection(id), openProject(id), closeTerminal(), sections(), projects() }`.
- The engine's core (parsing, history, completion, suggestions) is pure and DOM-free, so it can be unit tested.

## 4. Entry and view switching (A + C)

**Boot screen:**
- It plays only when all of the following hold:
  - it's the first visit this session (`sessionStorage`)
  - there's no `#hash`
  - there's no `?view=`
  - reduced motion is not requested
- It runs for about 1.2 s and shows: the full-screen console, the `[ OK ]` boot lines, then `❯ ui` auto-typed.
- It then shrinks and fades towards the `❯_` button while the hero reveals.
- Any key, click or tap skips it.

**Drawer:**
- **Open:** the floating `❯_` button, the `` ` `` key or Ctrl+K. Shortcuts are ignored while focus is in an editable field.
- **Layout:** slides down to about 60% of the viewport height on desktop and goes full-screen below 40rem.
- **Accessibility:** `role="dialog"` with `aria-modal`. Focus is trapped inside while open and returns to the trigger on close. Page scrolling is locked while open.
- **Close:** `Esc`, `exit`, `` ` ``, clicking the backdrop, or the close button.
- **Mobile:** a row of tappable command chips (`about`, `projects`, `resume`, `contact`) sits above the input.

**State:**
- Terminal history and output persist for the life of the page.
- `?view=terminal` loads with the drawer open.
- `#section` scrolls to that section and skips the boot.

## 5. Site sections

1. **Nav** (sticky, native)
   - Wordmark `deepak@portfolio`, links `about`, `skills`, `projects`, `contact`, and `resume`.
   - Collapses to a burger below 820px.
2. **Hero** (full viewport)
   - A headline of 7 words or fewer (proposed: "Deepak S builds backends and trains models"; final copy is set at build time to fit Hallmark's 7-word headline limit).
   - One sentence of 12 words or fewer, and the actions `view work` (primary) and `resume`.
   - The live command line (the signature).
   - The neofetch card stays as a static facts panel: OS, shell, editor, focus.
3. **About**
   - A two-paragraph bio that mentions no hackathons or CyberShield.
   - Two education fact cards (no CGPA):
     - Amrita Vishwa Vidyapeetham, B.Tech in Computer Science, Aug 2023 – May 2027
     - IIT Madras, B.S. in Data Science and Applications, Jan 2024 – present
4. **Skills:** four groups taken from the resume, as chip lists, with no motion beyond the section reveal.
   - **Languages:** Python, C/C++, Java, JavaScript, TypeScript, SQL, Go, Bash
   - **ML and AI:** PyTorch, TensorFlow/Keras, Hugging Face, PEFT (LoRA/QLoRA), Flower, Opacus, FAISS, scikit-learn, OpenCV
   - **Backend and web:** FastAPI, Flask, Node.js, Express, Spring Boot, React, Next.js, Socket.io, REST APIs, microservices
   - **Data and cloud:** PostgreSQL, MongoDB, Redis, AWS (EKS, RDS, S3, Cognito), Docker, Kubernetes, GitHub Actions, Git
5. **Projects: CLASP** (the pinned chapter)
   - The track is about 300vh tall. A sticky pane holds the heading and a diagram drawn as inline SVG.
   - The scroll-scrubbed steps are below. All facts come from Resume-Master.pdf, and nothing is added beyond it.
     1. **Problem:** personalise a code LLM for many teams without centralising their private code.
     2. **Composition:** three QLoRA layers (base, cluster and client) are composed on DeepSeek-Coder. They're trained across 6 simulated federated clients under differential privacy, and cluster updates are combined with SVD-based low-rank aggregation.
     3. **State registry:**
        - A FastAPI service versions the adapters as immutable, checksum-audited artifacts.
        - Serving is NF4-quantised to fit a 4 GB VRAM budget.
        - A HumanEval gate triggers rollback.
        - mTLS secures the traffic.
     4. **Stack and link:** PyTorch, PEFT, Flower, Opacus, FastAPI, Docker, as a plain list, plus a repo link if one is supplied.
   - **Fallback:** below 40rem, with reduced motion, or if GSAP fails to load, it becomes a normal stacked layout with the diagram in its final state and the four steps as a list.
   - The SVG has a `<title>` and `<desc>` that describe the architecture.
6. **Contact**
   - Heading: "Let's build something."
   - Email (copy-to-clipboard, with a visible confirmation), LinkedIn, GitHub, and the resume button.
   - A hint line: "press `` ` `` for the terminal".
7. **Footer:** a prompt-style line with the year computed by JS (the static HTML carries 2026).

Below the hero, all sections animate in with reveal-once only.

## 6. Content model

```js
export const CONTENT = Object.freeze({
  profile:   { name, headline, pitch, email, linkedin, github, resumeUrl },
  about:     { paragraphs: [string], education: [{ institution, programme, year }] },
  neofetch:  [{ key, value }],
  skills:    [{ group, colorToken, items: [string] }],
  projects:  [{ id, title, tagline, steps: [{ title, body }], stack: [string], repoUrl }],
});
```

- Adding a project means adding an object to `projects`. That produces a new chapter or panel, an `open <id>` command and an `ls` entry. When there are two or more projects, the chapter layout repeats per project. This spec delivers CLASP only.
- `validateContent()` runs at boot. Invalid sections are skipped and logged with `console.error` naming the missing field. The rest of the page still renders.

## 7. Terminal commands

- **Info:** `help`, `about`, `skills`, `projects`, `resume`, `contact`, `socials`, `banner`, `history`, `clear`, `ls`, `pwd`, `whoami`, `date`, `echo`, `cat`.
- **Page control:**
  - `cd <section>` closes the drawer and scrolls to that section.
  - `cd ~` and `cd ..` scroll to the top.
  - `open <project>` scrolls to the project's chapter.
  - `ui` and `exit` close the drawer.
- **Easter eggs:** kept as they are, minus anything that references CyberShield:
  - `neofetch`
  - `sudo hire-me`, `sudo <x>`
  - `rm -rf /`
  - `vim` (escape with `:q`)
  - `coffee`
  - `matrix`
  - `cat .secrets`
  - `ping`
  - `hi`
- **Fixes from the earlier review:**
  - async commands are awaited (`sudo rm`)
  - Enter is ignored while a command is running
  - "did you mean" checks against the full visible command list

## 8. Error handling

- **GSAP fails to load:** the CLASP fallback layout is used and `console.warn` records why.
- **`sessionStorage` throws (private browsing):** the boot is treated as already seen, so it never blocks the page.
- **Resume button:** rendered only when `profile.resumeUrl` is set. The placeholder PDF is deleted.
- **Copy-to-clipboard fails:** the email is selected, and a "press Ctrl/Cmd+C" message is shown.
- **No JS:** the `<noscript>` block shows the name, the pitch, and links to the resume, GitHub and email.

## 9. Testing

- **Unit tests** (`node --test`, with coverage via `--experimental-test-coverage`), 80% or more on `js/**` logic:
  - command parsing and dispatch
  - history navigation and Tab completion
  - "did you mean" suggestions
  - `validateContent`
  - the boot decision (`shouldBoot({ storage, hash, query, reducedMotion })`)
  - the safe storage wrapper
  - the shortcut guard (ignored in editable fields)
- **E2E** (Playwright, Chromium and WebKit):
  - A first visit boots into the site.
  - A reload in the same session skips the boot.
  - `` ` `` opens the drawer, `cd projects` closes it and the projects section is in view.
  - `?view=terminal` loads with the drawer open.
  - At a 360px viewport, `scrollWidth <= clientWidth` (no horizontal scrolling).
  - With reduced motion, all section content is visible and there's no pinning.
  - With JS disabled, the noscript content is visible.
- **Hallmark sweep:** `sloplint.mjs index.html css/*.css --render` until 0 FAIL, then the hero and finish reviews.

## 10. Cleanup in scope

- Delete the duplicate root copy in `Potrtfolio/` (`index.html`, `style.css`, `script.js`).
- Add `.gitignore` covering `.DS_Store`, `.claude/`, `node_modules/`, `test-results/`, `.hallmark/`.
- Add Open Graph and Twitter meta tags and an SVG favicon.
- Update the README with the new structure, preview command, test commands and deploy steps.

## 11. Inputs

**Supplied (2026-11-07):**
- **Email:** deepaksenthilkumar242@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/deepak-senthilkumar-66674a2a5
- **Resume:** `/Users/deepak/Resumes/Resume-Master.pdf`, copied to `assets/Deepak_S_Resume.pdf` at build time. It contains the email and LinkedIn only, no phone number.
- **Source of truth:** the resume. Where the old portfolio disagrees with it, the resume wins. The old portfolio's CLASP details (rank-8, FedProx, vLLM, 6.7B) and its skills (gRPC, Tailwind, Recharts, LaTeX, Neovim, tmux) are dropped unless Deepak re-confirms them.

**Still open** (non-blocking: the page omits the item until it's supplied):
1. CLASP repo URL, if public. Until then, the repo link is left out rather than pointing at the GitHub profile.
2. Optional material: a CLASP screenshot, training curve or terminal recording, or a photo.

## 12. Out of scope

- Other projects (MCW, MediStore and so on), to be added later through `content.js`
- A light theme
- A journey timeline
- A blog
- Analytics
