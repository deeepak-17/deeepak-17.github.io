# deepak@portfolio — Terminal + UI Portfolio

Terminal-first portfolio in Catppuccin Mocha. Visitors land in an interactive terminal; typing `ui` switches to a full graphical site with a button to drop back into the shell.

Zero build step — plain HTML/CSS/JS. Open `index.html` and it works.

## Structure

```
portfolio/
├── index.html      # both views (terminal + UI) in one page
├── style.css       # Catppuccin Mocha tokens + all styling
├── script.js       # terminal engine, commands, easter eggs, view switching
└── assets/
    └── resume.pdf  # ⚠ PLACEHOLDER — replace with your real resume
```

## Terminal commands

`help` `about` `skills` `projects` `resume` `contact` `socials` `ui` `banner` `history` `clear` `echo` `whoami` `pwd` `ls` `cat` `date` `ping`

**Easter eggs (not listed in help):** `neofetch` · `sudo hire-me` · `sudo <anything>` · `rm -rf /` · `vim` (then `:q` to escape) · `coffee` · `matrix` · `cat .secrets`

**Power features:** Tab autocomplete · ↑/↓ history · Ctrl+L clear · Ctrl+C cancel line

## Before you deploy — TODO

1. **Replace `assets/resume.pdf`** with your actual resume.
2. **Update contact placeholders** in two places:
   - `index.html` → `#contact` section (`your.email@example.com`, LinkedIn `#`)
   - `script.js` → `CONTACT` array (same placeholders)
3. Point each project card's `↗` link (`index.html`) at the actual repo instead of your profile, once repos are public.

## Deploy

**GitHub Pages (recommended, free):**
```bash
cd portfolio
git init && git add . && git commit -m "terminal portfolio"
# create repo named deeepak-17.github.io on GitHub, then:
git remote add origin git@github.com:deeepak-17/deeepak-17.github.io.git
git push -u origin main
```
Live at `https://deeepak-17.github.io` within a minute. (Settings → Pages → deploy from `main` if it doesn't auto-enable.)

**Vercel:** `npx vercel` from the folder, or import the repo at vercel.com. Either works — there's nothing to build.

## Customizing

- Colors: everything derives from the Catppuccin variables at the top of `style.css`.
- Add a terminal command: add an entry to the `commands` object in `script.js`; add its name to `VISIBLE_COMMANDS` if it should appear in `help`/autocomplete (leave it out to make it an easter egg).
