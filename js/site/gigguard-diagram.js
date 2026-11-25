/* GigGuard architecture diagram (inline SVG). The markup is the finished state; gigguard-scenes.js animates into it.
   Facts and numbers come from the GigGuard README. */

const TRIGGERS = ["rain", "heat", "AQI", "flood", "traffic", "curfew"];
const CHIP_STEP = 77;
const CHIP_X0 = 12;
const CHIP_TOP = 12;
const CHIP_W = 66;
const CHIP_H = 34;
const ENGINE = { x: 90, y: 120, w: 300, h: 74 };
const GAUGE = { x: 120, y: 156, w: 240, h: 10 };
const EXAMPLE_SEVERITY = 0.5; // README example: 42.25 °C sits halfway between 39.5 °C and 45 °C

const chipCx = (i) => CHIP_X0 + i * CHIP_STEP + CHIP_W / 2;
const engineCx = ENGINE.x + ENGINE.w / 2;

function chips() {
  return TRIGGERS.map((label, i) => {
    const x = CHIP_X0 + i * CHIP_STEP;
    return `<g data-trigger>
        <rect class="dg-box" x="${x}" y="${CHIP_TOP}" width="${CHIP_W}" height="${CHIP_H}" rx="6"/>
        <text class="dg-text" x="${chipCx(i)}" y="${CHIP_TOP + 21}" text-anchor="middle">${label}</text>
      </g>`;
  }).join("");
}

function triggerFlows() {
  const bottom = CHIP_TOP + CHIP_H;
  return TRIGGERS.map(
    (_, i) => `<path class="dg-line dg-flow" data-trigger-flow pathLength="1" d="M${chipCx(i)} ${bottom} L${engineCx} ${ENGINE.y}"/>`
  ).join("");
}

const box = (name, x, y, w, title, detail) => `<g data-g="${name}">
    <rect class="dg-box dg-box--accent" x="${x}" y="${y}" width="${w}" height="60" rx="6"/>
    <text class="dg-text" x="${x + w / 2}" y="${y + 25}" text-anchor="middle">${title}</text>
    <text class="dg-text dg-text--muted" x="${x + w / 2}" y="${y + 44}" text-anchor="middle">${detail}</text>
  </g>`;

export const GIGGUARD_DIAGRAM = `
  <svg viewBox="0 0 480 420" role="img" aria-labelledby="gigguard-svg-title gigguard-svg-desc">
    <title id="gigguard-svg-title">GigGuard architecture</title>
    <desc id="gigguard-svg-desc">Six live disruption triggers (rain, heat, AQI, flood, traffic and curfew) feed a fuzzy-logic severity engine; the curfew trigger blends GDELT events with zero-shot NLP. An XGBoost model prices the weekly premium and an Isolation Forest with GPS checks screens claims. Qualifying claims pay out automatically over UPI.</desc>
    <g data-g="flows">${triggerFlows()}</g>
    <g data-g="triggers">${chips()}</g>
    <text class="dg-text dg-text--muted" data-g="curfew-note" x="${engineCx}" y="${ENGINE.y + ENGINE.h + 18}" text-anchor="middle">curfew trigger: GDELT events + zero-shot NLP</text>
    <g data-g="engine">
      <rect class="dg-box" x="${ENGINE.x}" y="${ENGINE.y}" width="${ENGINE.w}" height="${ENGINE.h}" rx="6"/>
      <text class="dg-text" x="${engineCx}" y="${ENGINE.y + 22}" text-anchor="middle">fuzzy severity engine</text>
      <rect class="dg-gauge" x="${GAUGE.x}" y="${GAUGE.y}" width="${GAUGE.w}" height="${GAUGE.h}" rx="5"/>
      <rect class="dg-gauge__fill" data-gauge-fill x="${GAUGE.x}" y="${GAUGE.y}" width="${GAUGE.w * EXAMPLE_SEVERITY}" height="${GAUGE.h}" rx="5"/>
      <text class="dg-text dg-text--accent" x="${engineCx}" y="${ENGINE.y + 64}" text-anchor="middle">42.25 °C heat → 0.5 severity</text>
    </g>
    ${box("premium", 20, 228, 210, "weekly premium", "XGBoost, 25 features")}
    ${box("fraud", 250, 228, 210, "fraud check", "Isolation Forest + GPS")}
    <path class="dg-line dg-flow" data-payout-flow pathLength="1" d="M125 288 L240 322"/>
    <path class="dg-line dg-flow" data-payout-flow pathLength="1" d="M355 288 L240 322"/>
    <g data-g="payout">
      <rect class="dg-box" x="60" y="322" width="360" height="64" rx="6"/>
      <text class="dg-text" x="240" y="346" text-anchor="middle">auto-claim → UPI payout</text>
      <text class="dg-text dg-text--muted" x="240" y="366" text-anchor="middle">fraud score above 0.75 holds it for review</text>
    </g>
    <g data-g="no-forms">
      <text class="dg-text dg-text--accent" x="240" y="408" text-anchor="middle">✓ no claim form to file</text>
    </g>
  </svg>`;
