# deepak@portfolio

One portfolio, two views:

- **The site:** a scrolling page with a pinned, scroll-driven CLASP case study.
- **The terminal:** a drop-down shell that can drive the page. Press `` ` `` or Ctrl+K, or click `❯_`. Try `help`, `cd projects`, `open clasp`.

First-time visitors see a 1-second boot that hands off to the site. Any key or tap skips it.

Plain HTML, CSS and ES modules, with no build step. GSAP (for the CLASP chapter only) loads from cdnjs.

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```bash
python3 scripts/serve.py 8000   # then open http://localhost:8000
```

- `?view=terminal` opens with the terminal showing.
- `#projects` skips the boot and scrolls to that section.

## Structure

```
index.html              page shell (hero is static HTML so it works without JS)
css/tokens.css          Catppuccin Mocha in OKLCH, spacing/type scale
css/base.css            base rules
css/site.css            scrolling site
css/terminal.css        drawer + boot screen
js/content.js           single source of truth for both views
js/validate.js          content checks at startup
js/main.js              entry: renders, wires drawer, boot, ?view=, copy email
js/boot.js              first-visit boot screen
js/boot-decision.js     pure: should the boot play?
js/storage.js           sessionStorage wrapper that never throws
js/site/render.js       sections from content
js/site/reveal.js       reveal-once on scroll
js/site/clasp-chapter.js  GSAP pinned chapter (desktop, motion allowed)
js/terminal/core.js     parsing, history, completion, suggestions
js/terminal/commands.js commands (content + page control)
js/terminal/eggs.js     unlisted commands
js/terminal/drawer.js   dialog, focus trap, keys
assets/                 resume, favicon, link-preview image
```

## Edit content

Everything visitors read lives in `js/content.js`, and both views render from it.

- **Add a project:** append an object to `projects` (`id`, `title`, `tagline`, `steps`, `stack`, `repoUrl`). It gets a panel, an `open <id>` command and an `ls` entry. The CLASP diagram is project-specific, so a new project shows its steps without a diagram until one is added in `render.js`.
- **Add a CLASP repo link:** set `repoUrl` on the CLASP entry.
- **Replace the resume:** overwrite `assets/Deepak_S_Resume.pdf`.

## Tests

```bash
npm install
npx playwright install chromium webkit
npm test              # unit tests (node:test)
npm run test:cov      # unit tests with coverage
npm run e2e           # Playwright, Chromium + WebKit
```

## Deploy (GitHub Pages)

Push this folder to a repo named `deeepak-17.github.io`. Under Settings → Pages, deploy from the `main` branch root. There's nothing to build.
