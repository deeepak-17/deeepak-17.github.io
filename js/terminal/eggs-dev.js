/* Developer-flavoured easter eggs: clasp --train, git log, top. Facts come from the resume only; no invented metrics. */

const TRAIN_STEP_MS = 320;
const BAR_STEPS = 6;
const BAR_MS = 140;

const ok = `<span class="c-green">ok</span>`;

const TRAIN_LINES = [
  `<span class="c-dim">clasp v1 (simulation for this site; the real run lives in the repo)</span>`,
  `loading DeepSeek-Coder base, NF4 quantised to fit 4 GB VRAM … ${ok}`,
  `spawning 6 simulated federated clients … ${ok}`,
  `clustering clients: <span class="c-blue">1-3 → cluster A</span>, <span class="c-blue">4-6 → cluster B</span>`,
];

const AFTER_TRAINING = [
  `aggregating cluster adapters with SVD low-rank aggregation … ${ok}`,
  `composing <span class="c-mauve">base + cluster + client</span> QLoRA adapters … ${ok}`,
  `registry: versioned, checksum-audited artifact written … ${ok}`,
  `HumanEval gate … <span class="c-green">passed</span>, rollback armed`,
];

async function streamLines(ctx, lines) {
  for (const line of lines) {
    ctx.out.line(line);
    await ctx.sleep(TRAIN_STEP_MS);
  }
}

async function trainingBar(ctx) {
  const label = "training client adapters under differential privacy (Opacus)";
  for (let i = 1; i <= BAR_STEPS; i++) {
    await ctx.sleep(BAR_MS);
    if (i === BAR_STEPS) ctx.out.line(`${label} <span class="c-green">${"█".repeat(BAR_STEPS)}</span> ${ok}`);
  }
}

async function clasp(ctx, args) {
  if (args[0] !== "--train") {
    ctx.out.line("usage: clasp --train");
    ctx.out.line();
    return;
  }
  await streamLines(ctx, TRAIN_LINES);
  await trainingBar(ctx);
  await streamLines(ctx, AFTER_TRAINING);
  ctx.out.line(`<span class="c-dim">done. Type</span> <span class="c-yellow">open clasp</span> <span class="c-dim">for the real story.</span>`);
  ctx.out.line();
}

const COMMITS = [
  ["e7c41a2", "achievement: Amazon ML Challenge 2026, ranked among the top 1000 teams", true],
  ["c1a5b01", "feat: CLASP, federated cluster-personalised code assistant"],
  ["9fd03be", "feat: robust vision-language document understanding (LoRA, robustness eval)"],
  ["5b2e7d1", "research: text-aware video compression, benchmarked against H.264, H.265, VP9"],
  ["3a8c0f4", "init: B.S. Data Science and Applications, IIT Madras (Jan 2024)"],
  ["0000001", "init: B.Tech Computer Science, Amrita Vishwa Vidyapeetham (Aug 2023)"],
];

function git(ctx, args) {
  if (args[0] !== "log") {
    ctx.out.line(`git: only <span class="c-yellow">git log</span> works here. This repo is read-only.`);
    ctx.out.line();
    return;
  }
  COMMITS.forEach(([hash, msg, head]) => {
    const ref = head ? ` <span class="c-teal">(HEAD -&gt; main)</span>` : "";
    ctx.out.line(`<span class="c-yellow">${hash}</span>${ref} ${ctx.esc(msg)}`);
  });
  ctx.out.line();
}

const PROCESSES = [
  ["1", "deepak", "34.0", "pytorch --fine-tune"],
  ["42", "deepak", "21.5", "fastapi --reload"],
  ["128", "deepak", "17.0", "dsa.cpp"],
  ["256", "deepak", "12.0", "caffeine --daemon"],
  ["512", "deepak", "9.0", "kubectl get pods -w"],
  ["1024", "deepak", "0.1", "sleep"],
];

function top(ctx) {
  ctx.out.line(`<span class="c-dim">${"PID".padEnd(7)}${"USER".padEnd(9)}${"%CPU".padEnd(7)}COMMAND</span>`);
  PROCESSES.forEach(([pid, user, cpu, cmd]) =>
    ctx.out.line(`${pid.padEnd(7)}${user.padEnd(9)}<span class="c-green">${cpu.padEnd(7)}</span>${ctx.esc(cmd)}`)
  );
  ctx.out.line(`<span class="c-dim">(sleep is still waiting for its turn)</span>`);
  ctx.out.line();
}

export const DEV_EGGS = Object.freeze({ clasp, git, top });
