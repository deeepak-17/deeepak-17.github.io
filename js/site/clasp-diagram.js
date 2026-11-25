/* CLASP architecture diagram (inline SVG). The markup is the finished state; clasp-scenes.js animates into it. */

const REPO_COUNT = 6;
const REPO_STEP = 77;
const REPO_X0 = 12;
const REPO_TOP = 12;
const REPO_W = 66;
const REPO_H = 40;
const CLUSTERS = [
  { id: "a", label: "cluster A", cx: 130, cy: 132 },
  { id: "b", label: "cluster B", cx: 350, cy: 132 },
];

const repoCx = (i) => REPO_X0 + i * REPO_STEP + REPO_W / 2;
const clusterFor = (i) => CLUSTERS[i < REPO_COUNT / 2 ? 0 : 1];

function lockIcon(x, y) {
  return `<g class="dg-lock" data-lock>
      <path class="dg-lock__shackle" d="M${x + 1.5} ${y} v-2.5 a2.5 2.5 0 0 1 5 0 v2.5"/>
      <rect class="dg-lock__body" x="${x}" y="${y}" width="8" height="6" rx="1"/>
    </g>`;
}

function repos() {
  return Array.from({ length: REPO_COUNT }, (_, i) => {
    const x = REPO_X0 + i * REPO_STEP;
    return `<g class="dg-repo" data-repo>
        <rect class="dg-box" x="${x}" y="${REPO_TOP}" width="${REPO_W}" height="${REPO_H}" rx="6"/>
        <text class="dg-text" x="${repoCx(i) - 4}" y="${REPO_TOP + 24}" text-anchor="middle">repo ${i + 1}</text>
        ${lockIcon(x + REPO_W - 14, REPO_TOP + 6)}
      </g>`;
  }).join("");
}

function flows() {
  const bottom = REPO_TOP + REPO_H;
  return Array.from({ length: REPO_COUNT }, (_, i) => {
    const c = clusterFor(i);
    return `<path class="dg-line dg-flow" pathLength="1" d="M${repoCx(i)} ${bottom} L${c.cx} ${c.cy - 14}"/>`;
  }).join("");
}

function dots() {
  const bottom = REPO_TOP + REPO_H;
  return Array.from({ length: REPO_COUNT }, (_, i) => {
    const c = clusterFor(i);
    return `<circle class="dg-dot" cx="${repoCx(i)}" cy="${bottom}" r="4" data-dx="${c.cx - repoCx(i)}" data-dy="${c.cy - bottom}"/>`;
  }).join("");
}

function clusters() {
  return CLUSTERS.map(
    (c) => `<g data-node><circle class="dg-node" cx="${c.cx}" cy="${c.cy}" r="14"/></g>
      <text class="dg-text" data-node-label x="${c.cx + 22}" y="${c.cy + 4}">${c.label}</text>`
  ).join("");
}

const layer = (name, y, label, accent) => `<g data-layer="${name}">
    <rect class="dg-box${accent ? " dg-box--accent" : ""}" x="120" y="${y}" width="240" height="30" rx="6"/>
    <text class="dg-text" x="240" y="${y + 20}" text-anchor="middle">${label}</text>
  </g>`;

export const CLASP_DIAGRAM = `
  <svg viewBox="0 0 480 420" role="img" aria-labelledby="clasp-svg-title clasp-svg-desc">
    <title id="clasp-svg-title">CLASP architecture</title>
    <desc id="clasp-svg-desc">Six client repositories keep their code local and train adapters. Updates flow to two clusters and are merged by SVD-based low-rank aggregation. Base, cluster and client adapters stack on DeepSeek-Coder. A registry versions adapters and a HumanEval gate triggers rollback.</desc>
    <g data-g="flows">${flows()}</g>
    <g data-g="repos">${repos()}</g>
    <g data-g="clusters">${clusters()}</g>
    <g data-g="dots">${dots()}</g>
    <g data-g="agg">
      <text class="dg-text dg-text--accent" x="240" y="176" text-anchor="middle">SVD low-rank aggregation</text>
      <text class="dg-text dg-text--muted" x="240" y="194" text-anchor="middle">differentially private updates</text>
    </g>
    ${layer("client", 214, "client adapter", true)}
    ${layer("cluster", 248, "cluster adapter", true)}
    ${layer("base", 282, "base: DeepSeek-Coder (frozen)", false)}
    <path class="dg-line dg-flow" data-connector pathLength="1" d="M240 312 L240 336"/>
    <g data-g="registry">
      <rect class="dg-box" x="60" y="336" width="360" height="72" rx="6"/>
      <text class="dg-text" x="240" y="358" text-anchor="middle">adapter registry (FastAPI)</text>
      <text class="dg-text dg-text--muted" x="240" y="378" text-anchor="middle">versioned, checksum-audited, NF4 on 4 GB VRAM</text>
    </g>
    <g data-g="gate">
      <text class="dg-text dg-text--accent" x="240" y="398" text-anchor="middle">✓ HumanEval gate, rollback on regression</text>
    </g>
  </svg>`;
