<script>
  /*
    How much the equal-weighted index trades, and what it gains, against how
    often it rebalances, on a log axis of rebalances per year. The lines are
    the formulas; the dots come from ten simulated years of daily moves in 100
    stocks, rebalanced at each frequency. Two panels, sharing the x axis, so
    the two quantities keep their own units.
  */
  import { linear, log10Scale } from "../scale.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { FREQS, turnoverRate, gainRate, byFrequency } from "../index.js";
  import { pct } from "../format.js";

  let { width } = $props();
  let si = $state(0.3);
  let sim = $derived(byFrequency(si));

  const H1 = 200, H2 = 170;
  const m = { top: 12, right: 18, bottom: 40, left: 52 };
  let x = $derived(log10Scale([1, 252], [m.left + 8, width - m.right - 8]));
  const y1 = linear([0, 3.5], [H1 - m.bottom, m.top]);
  const y2 = linear([0, 0.14], [H2 - m.bottom, m.top]);
  const F = Array.from({ length: 81 }, (_, i) => Math.pow(252, i / 80));
  let tPath = $derived(F.map((f, i) => `${i ? "L" : "M"}${x(f).toFixed(2)},${y1(turnoverRate(si, f)).toFixed(2)}`).join(""));
  let gPath = $derived(`M${x(1).toFixed(2)},${y2(gainRate(si)).toFixed(2)}L${x(252).toFixed(2)},${y2(gainRate(si)).toFixed(2)}`);
  const short = { yearly: "yearly", quarterly: "quarterly", monthly: "monthly", weekly: "weekly", daily: "daily" };
  let narrow = $derived(width < 440);
</script>

<div class="controls">
  <Slider label="Stock-specific volatility" id="tc-s" min={0.1} max={0.5} step={0.05} bind:value={si} format={(v) => pct(+v, 0)} width={260} />
</div>

<p class="sub-title">Share of the fund traded in a year</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Turnover a year against how often the equal-weighted index rebalances" class="turn-panel">
  <AxisY scale={y1} ticks={[0, 1, 2, 3]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H1 - m.bottom} y2={H1 - m.bottom} />
    {#each FREQS as f, i (f.label)}
      <g transform="translate({x(f.perYear)},{H1 - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{narrow && i % 2 ? "" : short[f.label]}</text>
      </g>
    {/each}
  </g>
  <path class="turn-line" d={tPath} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  {#each sim as f (f.label)}
    <circle class="turn-dot" data-f={f.label} cx={x(f.perYear)} cy={y1(f.turn)} r="4.5" fill="white" stroke="var(--c1)" stroke-width="2" />
  {/each}
</svg>

<p class="sub-title">Rebalancing gain in a year</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The rebalancing gain a year against how often the equal-weighted index rebalances" class="gain-panel">
  <AxisY scale={y2} ticks={[0, 0.04, 0.08, 0.12]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H2 - m.bottom} y2={H2 - m.bottom} />
    {#each FREQS as f, i (f.label)}
      <g transform="translate({x(f.perYear)},{H2 - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{narrow && i % 2 ? "" : short[f.label]}</text>
      </g>
    {/each}
  </g>
  <path class="gain-line" d={gPath} fill="none" stroke="var(--c3)" stroke-width="2.4" />
  {#each sim as f (f.label)}
    <circle class="gain-dot" data-f={f.label} cx={x(f.perYear)} cy={y2(f.gain)} r="4.5" fill="white" stroke="var(--c3)" stroke-width="2" />
  {/each}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--ink)"></span>the formula</span>
  <span class="key"><span class="ring"></span>ten simulated years of daily moves in 100 stocks</span>
</p>

<div class="readouts">
  <Readout id="tc-r-q" label="Traded a year, quarterly" value={pct(turnoverRate(si, 4), 0)} color="var(--c1)" />
  <Readout id="tc-r-d" label="Traded a year, daily" value={pct(turnoverRate(si, 252), 0)} color="var(--c1)" />
  <Readout id="tc-r-g" label="Gain a year, at any frequency" value={pct(gainRate(si), 1)} color="var(--c3)" />
</div>

<style>
  .sub-title { font-size: 0.92rem; font-weight: 700; margin: 0.6rem 0 0.1rem; color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .ring { display: inline-block; width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--ink); background: white; }
</style>
