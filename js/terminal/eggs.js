import { DEV_EGGS } from "./eggs-dev.js";

/* Easter eggs: unlisted commands. Each is (ctx, args) => void | Promise<void>. */

const RM_STEPS = ["Deleting /usr…", "Deleting /home…", "Deleting portfolio…"];
const RM_STEP_MS = 400;

async function fakeRm(ctx, args) {
  const joined = args.join(" ");
  const isScary = joined.includes("-rf") && (joined.includes("/") || joined.includes("*"));
  if (!isScary) {
    ctx.out.line(`rm: missing operand (or missing courage, try <span class="c-yellow">rm -rf /</span>)`);
    ctx.out.line();
    return;
  }
  for (const step of RM_STEPS) {
    ctx.out.line(`<span class="c-red">${step}</span>`);
    await ctx.sleep(RM_STEP_MS);
  }
  ctx.out.clear();
  await ctx.sleep(RM_STEP_MS);
  ctx.out.line(`<span class="c-green">Just kidding.</span> Everything's containerized anyway. 🐳`);
  ctx.out.line();
}

function neofetch(ctx) {
  const { profile, neofetch: facts } = ctx.content;
  ctx.out.line(`<span class="c-green">deepak</span>@<span class="c-green">portfolio</span>`);
  ctx.out.line(`<span class="c-dim">─────────────────</span>`);
  ctx.out.line(`<span class="c-blue">Name</span>: ${ctx.esc(profile.name)}`);
  facts.forEach(({ key, value }) => ctx.out.line(`<span class="c-blue">${ctx.esc(key)}</span>: ${ctx.esc(value)}`));
  ctx.out.line(`<span class="c-blue">Kernel</span>: caffeine-lts`);
  ctx.out.line();
  ctx.out.line(
    ["red", "peach", "yellow", "green", "teal", "blue", "mauve", "pink"]
      .map((c) => `<span class="c-${c}">███</span>`)
      .join("")
  );
  ctx.out.line();
}

async function sudo(ctx, args) {
  const rest = args.join(" ").toLowerCase();
  if (rest === "hire-me" || rest === "hire me") {
    ctx.out.line(`<span class="c-green">[sudo] permission granted. Excellent decision.</span>`);
    ctx.out.line(`<span class="c-green">Opening resume…</span>`);
    ctx.site.downloadResume();
    ctx.out.line();
    return;
  }
  if (args[0] === "rm") {
    await fakeRm(ctx, args.slice(1));
    return;
  }
  ctx.out.line(`<span class="c-red">deepak is not in the sudoers file. This incident will be reported.</span>`);
  ctx.out.line(`<span class="c-dim">(reported to absolutely no one)</span>`);
  ctx.out.line();
}

function coffee(ctx) {
  ["      ( (", "       ) )", "    ........", "    |      |]", "    \\      /", "     `----'"].forEach((l) =>
    ctx.out.line(ctx.esc(l))
  );
  ctx.out.line(`<span class="c-peach">Brewing… filter coffee &gt; everything.</span>`);
  ctx.out.line();
}

function lines(...text) {
  return (ctx) => {
    text.forEach((t) => ctx.out.line(t));
    ctx.out.line();
  };
}

export const EGGS = Object.freeze({
  ...DEV_EGGS,
  neofetch,
  sudo,
  rm: fakeRm,
  coffee,
  matrix: lines(
    `<span class="c-green">Wake up, Neo…</span>`,
    `<span class="c-green">Follow the white rabbit.</span> <span class="c-dim">(try</span> <span class="c-yellow">cd projects</span><span class="c-dim">)</span>`
  ),
  ping: lines("PONG (0.001ms, localhost never lies)"),
  hello: lines(`Hey! Type <span class="c-yellow">help</span> to look around.`),
  hi: lines(`Hey! Type <span class="c-yellow">help</span> to look around.`),
});
