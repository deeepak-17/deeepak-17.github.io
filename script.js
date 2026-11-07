/* ============================================================
   Deepak S — Terminal + UI Portfolio · script.js
   Terminal engine: commands, autocomplete, history, easter eggs
   ============================================================ */

(() => {
  "use strict";

  // ---------- DOM ----------
  const termView = document.getElementById("terminal-view");
  const uiView = document.getElementById("ui-view");
  const termBody = document.getElementById("term-body");
  const output = document.getElementById("term-output");
  const inputLine = document.getElementById("term-input-line");
  const typedSpan = document.getElementById("term-typed");
  const hiddenInput = document.getElementById("term-hidden-input");
  const btnToTerminal = document.getElementById("btn-to-terminal");
  const navBurger = document.getElementById("nav-burger");
  const navLinks = document.getElementById("nav-links");

  // ---------- state ----------
  let history = [];
  let historyIdx = -1;
  let booted = false;
  let vimMode = false;

  // ---------- helpers ----------
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function print(html = "") {
    const div = document.createElement("div");
    div.className = "line";
    div.innerHTML = html || "&nbsp;";
    output.appendChild(div);
    scrollBottom();
  }

  function printBlock(lines) {
    lines.forEach((l) => print(l));
  }

  function scrollBottom() {
    termBody.scrollTop = termBody.scrollHeight;
  }

  function promptEcho(cmd) {
    print(
      `<span class="prompt-user">deepak@portfolio</span> <span class="prompt-path">~</span> <span class="prompt-char">❯</span> <span class="c-text">${esc(cmd)}</span>`
    );
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- content ----------
  const BANNER = [
    `<span class="c-mauve"> ██████╗ ███████╗███████╗██████╗  █████╗ ██╗  ██╗</span>`,
    `<span class="c-mauve"> ██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██║ ██╔╝</span>`,
    `<span class="c-blue"> ██║  ██║█████╗  █████╗  ██████╔╝███████║█████╔╝ </span>`,
    `<span class="c-blue"> ██║  ██║██╔══╝  ██╔══╝  ██╔═══╝ ██╔══██║██╔═██╗ </span>`,
    `<span class="c-teal"> ██████╔╝███████╗███████╗██║     ██║  ██║██║  ██╗</span>`,
    `<span class="c-teal"> ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝</span>`,
    ``,
    `<span class="c-dim">Software engineer in the making · backend + ML</span>`,
    ``,
    `Welcome! Type <span class="c-yellow">help</span> to see available commands, or <span class="c-green">ui</span> to open the graphical site.`,
    ``,
  ];

  const HELP = [
    `<span class="c-yellow">Available commands:</span>`,
    ``,
    `  <span class="c-green">about</span>       who I am`,
    `  <span class="c-green">skills</span>      tech I work with`,
    `  <span class="c-green">projects</span>    things I've built`,
    `  <span class="c-green">resume</span>      download my resume`,
    `  <span class="c-green">contact</span>     how to reach me`,
    `  <span class="c-green">socials</span>     links around the web`,
    `  <span class="c-green">ui</span>          switch to the graphical site`,
    `  <span class="c-green">banner</span>      re-print the welcome banner`,
    `  <span class="c-green">history</span>     commands you've run`,
    `  <span class="c-green">clear</span>       clear the screen`,
    ``,
    `<span class="c-dim">Tab = autocomplete · ↑/↓ = history · ...and a few commands aren't listed here 👀</span>`,
    ``,
  ];

  const ABOUT = [
    `<span class="c-mauve">── about ──────────────────────────────</span>`,
    ``,
    `Hi, I'm <span class="c-text">Deepak S</span> — a final-year CSE undergrad at <span class="c-blue">Amrita Vishwa Vidyapeetham</span> (Coimbatore),`,
    `also pursuing the <span class="c-blue">BS in Data Science at IIT Madras</span> in parallel.`,
    ``,
    `I like problems where <span class="c-green">systems</span> meet <span class="c-mauve">machine learning</span>: making models faster,`,
    `smaller, more private, and actually deployable. Recent work includes federated`,
    `LoRA fine-tuning of code LLMs, fraud detection on heavily imbalanced bank data,`,
    `and Go microservices that behave like production, not coursework.`,
    ``,
    `Currently: grinding DSA in C++, shipping projects, and ricing my terminal.`,
    ``,
    `<span class="c-dim">Try: projects · skills · resume</span>`,
    ``,
  ];

  const SKILLS = [
    `<span class="c-mauve">── skills ─────────────────────────────</span>`,
    ``,
    `  <span class="c-blue">languages/</span>   C++ · Go · Python · JavaScript · Bash · SQL`,
    `  <span class="c-green">backend/</span>     Go microservices · FastAPI · Redis · Docker · REST · gRPC`,
    `  <span class="c-mauve">ml/</span>          PyTorch · LightGBM · LoRA/PEFT · Federated Learning · DP`,
    `  <span class="c-peach">frontend/</span>    Next.js · React · Tailwind · Recharts`,
    `  <span class="c-teal">tools/</span>       Linux · Git · tmux · LaTeX · Neovim`,
    ``,
  ];

  const PROJECTS = [
    `<span class="c-mauve">── projects ───────────────────────────</span>`,
    ``,
    `<span class="c-mauve">[1] CLASP</span> — federated LoRA for secure, personalized code generation`,
    `    <span class="c-dim">DeepSeek-Coder-6.7B · Flower · FedProx · DP-SGD · vLLM</span>`,
    ``,
    `<span class="c-blue">[2] MCW</span> — text-aware video compression for screen recordings`,
    `    <span class="c-dim">CRAFT text detection · adaptive DCT quadtree · SSIM temporal filtering</span>`,
    ``,
    `<span class="c-green">[3] MediStore</span> — full-stack medical eCommerce on Go microservices`,
    `    <span class="c-dim">Go · Next.js · Redis · Docker</span>`,
    ``,
    `<span class="c-red">[4] CyberShield</span> — mule account detection · national finale @ IIT Hyderabad`,
    `    <span class="c-dim">LightGBM · 91 features · 100% precision / 75% recall on extreme imbalance</span>`,
    ``,
    `Type <span class="c-yellow">ui</span> for full write-ups, or visit <a href="https://github.com/deeepak-17" target="_blank" rel="noopener">github.com/deeepak-17</a>`,
    ``,
  ];

  const CONTACT = [
    `<span class="c-mauve">── contact ────────────────────────────</span>`,
    ``,
    `  <span class="c-blue">email</span>      your.email@example.com`,
    `  <span class="c-blue">github</span>     <a href="https://github.com/deeepak-17" target="_blank" rel="noopener">github.com/deeepak-17</a>`,
    `  <span class="c-blue">linkedin</span>   /in/your-handle`,
    ``,
    `<span class="c-dim">Open to SWE/ML roles and interesting collaborations.</span>`,
    ``,
  ];

  const NEOFETCH = [
    `<span class="c-mauve">        ▄▄▄▄▄▄        </span>  <span class="c-green">deepak</span>@<span class="c-green">portfolio</span>`,
    `<span class="c-mauve">     ▄█▀▀    ▀▀█▄     </span>  ─────────────────`,
    `<span class="c-mauve">    ██   ▄▄▄▄   ██    </span>  <span class="c-blue">OS</span>: Ubuntu · macOS (dual wielder)`,
    `<span class="c-blue">    ██  ██  ██  ██    </span>  <span class="c-blue">Host</span>: Amrita CSE '27 + IITM BS DS`,
    `<span class="c-blue">    ██  ██  ██  ██    </span>  <span class="c-blue">Kernel</span>: caffeine-6.7.0-lts`,
    `<span class="c-blue">    ██   ▀▀▀▀   ██    </span>  <span class="c-blue">Uptime</span>: 20 years`,
    `<span class="c-teal">     ▀█▄▄    ▄▄█▀     </span>  <span class="c-blue">Shell</span>: zsh + Starship`,
    `<span class="c-teal">        ▀▀▀▀▀▀        </span>  <span class="c-blue">Terminal</span>: Ghostty`,
    `                          <span class="c-blue">Theme</span>: Catppuccin Mocha`,
    `                          <span class="c-blue">Packages</span>: DSA, Go, PyTorch, LightGBM`,
    `                          <span class="c-blue">CPU</span>: Brain @ 3–5 gym days/week`,
    ``,
    `                          <span class="c-red">███</span><span class="c-peach">███</span><span class="c-yellow">███</span><span class="c-green">███</span><span class="c-teal">███</span><span class="c-blue">███</span><span class="c-mauve">███</span><span class="c-pink">███</span>`,
    ``,
  ];

  // ---------- commands ----------
  const commands = {
    help: () => printBlock(HELP),
    about: () => printBlock(ABOUT),
    skills: () => printBlock(SKILLS),
    projects: () => printBlock(PROJECTS),
    contact: () => printBlock(CONTACT),
    socials: () => printBlock(CONTACT),

    banner: () => printBlock(BANNER),

    resume: () => {
      print(`<span class="c-green">Fetching resume.pdf…</span>`);
      triggerResumeDownload();
      print(`<span class="c-dim">If the download didn't start, grab it from the UI side (type: ui).</span>`);
      print("");
    },

    ui: async () => {
      print(`<span class="c-green">Launching graphical interface…</span>`);
      await sleep(450);
      switchToUI();
    },

    clear: () => {
      output.innerHTML = "";
    },

    history: () => {
      if (!history.length) return print(`<span class="c-dim">(empty)</span>`);
      history.forEach((h, i) => print(`  <span class="c-dim">${i + 1}</span>  ${esc(h)}`));
      print("");
    },

    echo: (args) => {
      print(esc(args.join(" ")));
    },

    whoami: () => {
      print(`deepak — builds backends, trains models, refuses light mode.`);
      print("");
    },

    date: () => {
      print(new Date().toString());
      print("");
    },

    pwd: () => { print(`/home/deepak/portfolio`); print(""); },

    ls: () => {
      print(`<span class="c-blue">about/</span>  <span class="c-blue">projects/</span>  <span class="c-blue">skills/</span>  <span class="c-green">resume.pdf</span>  <span class="c-dim">.secrets</span>`);
      print("");
    },

    cat: (args) => {
      const f = (args[0] || "").toLowerCase();
      if (f === ".secrets") {
        print(`<span class="c-red">Nice try.</span> But curiosity is a good sign — type <span class="c-yellow">sudo hire-me</span>.`);
      } else if (f === "resume.pdf") {
        print(`Binary file. Use <span class="c-yellow">resume</span> to download it like a civilized person.`);
      } else if (!f) {
        print(`usage: cat &lt;file&gt;`);
      } else {
        print(`cat: ${esc(f)}: No such file or directory`);
      }
      print("");
    },

    exit: () => {
      print(`<span class="c-dim">There is no escape. Try</span> <span class="c-yellow">ui</span> <span class="c-dim">instead.</span>`);
      print("");
    },

    // ---------- easter eggs ----------
    neofetch: () => printBlock(NEOFETCH),

    sudo: (args) => {
      const rest = args.join(" ").toLowerCase();
      if (rest === "hire-me" || rest === "hire me") {
        print(`<span class="c-green">[sudo] permission granted — excellent decision.</span>`);
        print(`<span class="c-green">Opening resume…</span>`);
        triggerResumeDownload();
        print("");
      } else if (rest.startsWith("rm")) {
        commands["rm"](args.slice(1), true);
      } else {
        print(`<span class="c-red">deepak is not in the sudoers file. This incident will be reported.</span>`);
        print(`<span class="c-dim">(reported to absolutely no one)</span>`);
        print("");
      }
    },

    rm: async (args) => {
      const joined = args.join(" ");
      if (joined.includes("-rf") && (joined.includes("/") || joined.includes("*"))) {
        print(`<span class="c-red">Deleting /usr…</span>`);
        await sleep(400);
        print(`<span class="c-red">Deleting /home…</span>`);
        await sleep(400);
        print(`<span class="c-red">Deleting portfolio…</span>`);
        await sleep(600);
        output.innerHTML = "";
        await sleep(700);
        print(`<span class="c-green">Just kidding.</span> Everything's containerized anyway. 🐳`);
        print("");
      } else {
        print(`rm: missing operand (or missing courage — try <span class="c-yellow">rm -rf /</span>)`);
        print("");
      }
    },

    vim: () => {
      vimMode = true;
      print(`<span class="c-green">~</span>`);
      print(`<span class="c-green">~</span>          <span class="c-text">VIM - Vi IMproved</span>`);
      print(`<span class="c-green">~</span>`);
      print(`<span class="c-green">~</span>          You are now trapped in vim.`);
      print(`<span class="c-green">~</span>          Type <span class="c-yellow">:q</span> to escape (if you can).`);
      print(`<span class="c-green">~</span>`);
      print("");
    },

    nvim: (a) => commands.vim(a),

    coffee: () => {
      print(`      ( (`);
      print(`       ) )`);
      print(`    ........`);
      print(`    |      |]`);
      print(`    \\      /`);
      print(`     \`----'`);
      print(`<span class="c-peach">Brewing… productivity +20%. Filter coffee > everything.</span>`);
      print("");
    },

    matrix: () => {
      print(`<span class="c-green">Wake up, Neo…</span>`);
      print(`<span class="c-green">The Matrix has you. Follow the white rabbit 🐇</span>`);
      print(`<span class="c-dim">(knock knock — type</span> <span class="c-yellow">projects</span><span class="c-dim">)</span>`);
      print("");
    },

    ping: () => { print(`PONG (0.001ms — localhost never lies)`); print(""); },

    hello: () => { print(`Hey! 👋 Type <span class="c-yellow">help</span> to look around.`); print(""); },
    hi: (a) => commands.hello(a),
  };

  const COMMAND_LIST = Object.keys(commands);
  const VISIBLE_COMMANDS = ["help","about","skills","projects","resume","contact","socials","ui","banner","history","clear"];

  // ---------- resume download ----------
  function triggerResumeDownload() {
    const a = document.createElement("a");
    a.href = "assets/resume.pdf";
    a.download = "Deepak_S_Resume.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ---------- executor ----------
  async function run(raw) {
    const cmdline = raw.trim();
    promptEcho(cmdline);

    if (vimMode) {
      if (cmdline === ":q" || cmdline === ":q!" || cmdline === ":wq") {
        vimMode = false;
        print(`<span class="c-green">You escaped vim. Achievement unlocked. 🏆</span>`);
      } else {
        print(`<span class="c-dim">You're still in vim. (hint: :q)</span>`);
      }
      print("");
      return;
    }

    if (!cmdline) return;

    history.push(cmdline);
    historyIdx = history.length;

    const [cmd, ...args] = cmdline.split(/\s+/);
    const fn = commands[cmd.toLowerCase()];

    if (fn) {
      await fn(args);
    } else {
      print(`<span class="c-red">command not found:</span> ${esc(cmd)}`);
      const guess = VISIBLE_COMMANDS.find((c) => c.startsWith(cmd.toLowerCase().slice(0, 2)));
      if (guess) print(`<span class="c-dim">did you mean</span> <span class="c-yellow">${guess}</span><span class="c-dim">?</span>`);
      print(`<span class="c-dim">type</span> <span class="c-yellow">help</span> <span class="c-dim">for the list</span>`);
      print("");
    }
  }

  // ---------- input handling ----------
  function refreshTyped() {
    typedSpan.textContent = hiddenInput.value;
    scrollBottom();
  }

  hiddenInput.addEventListener("input", refreshTyped);

  hiddenInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const val = hiddenInput.value;
      hiddenInput.value = "";
      refreshTyped();
      inputLine.style.display = "none";
      await run(val);
      inputLine.style.display = "flex";
      scrollBottom();
      hiddenInput.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx > 0) {
        historyIdx--;
        hiddenInput.value = history[historyIdx];
        refreshTyped();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        historyIdx++;
        hiddenInput.value = history[historyIdx];
      } else {
        historyIdx = history.length;
        hiddenInput.value = "";
      }
      refreshTyped();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const cur = hiddenInput.value.trim().toLowerCase();
      if (!cur) return;
      const matches = VISIBLE_COMMANDS.filter((c) => c.startsWith(cur));
      if (matches.length === 1) {
        hiddenInput.value = matches[0] + " ";
        refreshTyped();
      } else if (matches.length > 1) {
        promptEcho(hiddenInput.value);
        print(matches.map((m) => `<span class="c-teal">${m}</span>`).join("  "));
        print("");
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      output.innerHTML = "";
    } else if (e.key === "c" && e.ctrlKey) {
      promptEcho(hiddenInput.value + "^C");
      hiddenInput.value = "";
      refreshTyped();
    }
  });

  // click anywhere in terminal focuses input (mobile keyboard too)
  termBody.addEventListener("click", () => hiddenInput.focus());
  termView.addEventListener("click", () => hiddenInput.focus());

  // ---------- boot sequence ----------
  const BOOT_LINES = [
    { t: `<span class="c-dim">[  OK  ]</span> Mounting /home/deepak ...`, d: 120 },
    { t: `<span class="c-dim">[  OK  ]</span> Loading Catppuccin Mocha theme ...`, d: 140 },
    { t: `<span class="c-dim">[  OK  ]</span> Starting zsh with Starship prompt ...`, d: 140 },
    { t: `<span class="c-dim">[  OK  ]</span> Injecting caffeine ...`, d: 160 },
    { t: `<span class="c-green">[ DONE ]</span> portfolio.service started in 0.42s`, d: 260 },
  ];

  async function boot() {
    if (booted) return;
    booted = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      for (const line of BOOT_LINES) {
        print(line.t);
        await sleep(line.d);
      }
      print("");
      await sleep(150);
    }
    printBlock(BANNER);
    inputLine.style.display = "flex";
    hiddenInput.focus();
    scrollBottom();
  }

  // ---------- view switching ----------
  function switchToUI() {
    termView.classList.add("leaving");
    setTimeout(() => {
      termView.style.display = "none";
      uiView.hidden = false;
      window.scrollTo(0, 0);
    }, 420);
  }

  function switchToTerminal() {
    uiView.hidden = true;
    termView.style.display = "flex";
    // force reflow so the transition replays
    void termView.offsetWidth;
    termView.classList.remove("leaving");
    hiddenInput.focus();
    scrollBottom();
  }

  btnToTerminal.addEventListener("click", switchToTerminal);

  // mobile nav
  navBurger.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") navLinks.classList.remove("open");
  });

  // go!
  boot();
})();
