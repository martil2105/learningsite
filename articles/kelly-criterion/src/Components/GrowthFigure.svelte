<script>
  /*
    Growth per flip against the share bet. Blue: the expected log growth
    g(f) = 0.6 ln(1 + f) + 0.4 ln(1 − f), which is what a typical player's
    money does. Pink: the log growth of the average across players,
    ln(1 + 0.2 f), which keeps rising. The open dot marks Kelly's 20% and the
    tick marks where the blue curve returns to zero.
  */
  import { linear } from "../chart.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { growth, meanGrowth, medianWealth, meanWealth, zeroGrowth, KELLY_COIN } from "../kelly.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let share = $state(20);
  const H = 280, m = { top: 14, right: 16, bottom: 44, left: 48 };
  const XMAX = 50, YLO = -4, YHI = 10;
  let X = $derived(linear(0, XMAX, m.left, width - m.right));
  const Y = linear(YLO, YHI, H - m.bottom, m.top);
  const grid = Array.from({ length: 201 }, (_, i) => (i * XMAX) / 200);
  const pts = (fn) => grid.map((s) => [s, 100 * fn(s / 100)]).filter(([, v]) => v >= YLO && v <= YHI);
  let gPath = $derived(pts(growth).map(([s, v], i) => (i ? "L" : "M") + X(s).toFixed(2) + "," + Y(v).toFixed(2)).join(""));
  let mPath = $derived(pts(meanGrowth).map(([s, v], i) => (i ? "L" : "M") + X(s).toFixed(2) + "," + Y(v).toFixed(2)).join(""));
  const Z = 100 * zeroGrowth();
  const K = 100 * KELLY_COIN;
  let f = $derived(share / 100);
  const big = (w) => {
    if (w < 1) return w < 0.01 ? "under 1¢" : Math.round(w * 100) + "¢";
    if (w < 1e6) return "$" + Math.round(w).toLocaleString("en-GB");
    const e = Math.floor(Math.log10(w)), c = w / Math.pow(10, e);
    return "$" + c.toFixed(1) + " × 10" + String(e).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]).join("");
  };
</script>

<div class="controls">
  <Slider id="gf-share" label="Share bet on every flip" min={0} max={XMAX} step={1} bind:value={share} format={(v) => v + "%"} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Growth per flip against the share bet, for a typical player and for the average" class="growth-panel">
  <AxisY scale={Y} ticks={[-4, -2, 0, 2, 4, 6, 8, 10]} x0={m.left} x1={width - m.right} format={(v) => fixed(v, 0) + "%"} />
  <AxisX scale={X} ticks={[0, 10, 20, 30, 40, 50]} y={H - m.bottom} format={(v) => v + "%"} title="share bet on every flip" />
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.55" />
  <path class="mean" d={mPath} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="typical" d={gPath} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  <circle class="kelly" cx={X(K)} cy={Y(100 * growth(KELLY_COIN))} r="8.5" fill="none" stroke="var(--c1)" stroke-width="2" />
  <text class="kelly-label" x={X(K)} y={Y(100 * growth(KELLY_COIN)) - 14} text-anchor="middle">Kelly</text>
  <line class="zero-tick" x1={X(Z)} x2={X(Z)} y1={Y(0) - 6} y2={Y(0) + 6} stroke="var(--c1)" stroke-width="2" />
  <line class="marker" x1={X(share)} x2={X(share)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" stroke-opacity="0.45" />
  <circle class="dot typical" cx={X(share)} cy={Y(Math.max(YLO, 100 * growth(f)))} r="4.5" fill="var(--c1)" />
  <circle class="dot mean" cx={X(share)} cy={Y(Math.min(YHI, 100 * meanGrowth(f)))} r="4.5" fill="var(--c2)" />
</svg>

<div class="legend">
  <span><i style="background:var(--c1)"></i>typical player</span>
  <span><i style="background:var(--c2)"></i>average of all players</span>
</div>

<div class="readouts">
  <Readout id="gf-r-g" label="Typical growth a flip" value={fixed(100 * growth(f), 2) + "%"} color="var(--c1)" />
  <Readout id="gf-r-m" label="Growth of the average" value={fixed(100 * meanGrowth(f), 2) + "%"} color="var(--c2)" />
  <Readout id="gf-r-med" label="Typical player after 300" value={big(medianWealth(f))} color="var(--c1)" />
  <Readout id="gf-r-avg" label="Average after 300" value={big(meanWealth(f))} color="var(--c2)" />
</div>

<style>
  svg { display: block; }
  .kelly-label { font-size: 11px; font-weight: 600; fill: var(--c1); stroke: #fff; stroke-width: 3px; paint-order: stroke; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
