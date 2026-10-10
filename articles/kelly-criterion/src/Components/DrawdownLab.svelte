<script>
  /*
    The chance of ever falling to a fraction x of today's money, measured
    against cash, for a bet of c times the Kelly share: x^(2/c − 1) over an
    endless future, and the first-passage formula for Brownian motion with
    drift over a fixed number of years. The dashed diagonal is full Kelly
    over an endless future, where the chance equals the fraction.
  */
  import { linear } from "../chart.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { everFall, fallWithin, drift, vol } from "../kelly.js";
  import { pct, fixed } from "../format.js";

  let { width } = $props();
  let c = $state(1);
  let horizon = $state("ever");
  const H = 290, m = { top: 14, right: 16, bottom: 44, left: 50 };
  let X = $derived(linear(0, 1, m.left, width - m.right));
  const Y = linear(0, 1, H - m.bottom, m.top);
  const chanceOf = (c, x, h) => (h === "ever" ? everFall(c, x) : fallWithin(c, x, h === "30" ? 30 : 10));
  const xs = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
  let curve = $derived(xs.map((x, i) => (i ? "L" : "M") + X(x).toFixed(2) + "," + Y(chanceOf(c, x, horizon)).toFixed(2)).join(""));
  let half = $derived(chanceOf(c, 0.5, horizon));
  let tenth = $derived(chanceOf(c, 0.1, horizon));
  let kept = $derived(drift(c) / drift(1));
</script>

<div class="controls">
  <Slider id="dl-c" label="Bet, as a multiple of the Kelly share" min={0.25} max={2} step={0.05} bind:value={c} format={(v) => fixed(+v, 2) + "×"} width={260} />
  <Segmented id="dl-h" label="Over" options={[{ value: "ever", label: "an endless future" }, { value: "30", label: "30 years" }, { value: "10", label: "10 years" }]} bind:value={horizon} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The chance of ever falling to each fraction of today's money" class="drawdown-panel">
  <AxisY scale={Y} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={X} ticks={[0, 0.25, 0.5, 0.75, 1]} y={H - m.bottom} format={(v) => pct(v, 0)} title="falls to this share of today's money" />
  <line class="diagonal" x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" />
  <path class="curve" d={curve} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  <circle class="dot half" cx={X(0.5)} cy={Y(half)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
  <circle class="dot tenth" cx={X(0.1)} cy={Y(tenth)} r="5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
</svg>

<div class="legend">
  <span><i style="background:var(--c1)"></i>this bet</span>
  <span><i class="dash"></i>full Kelly, endless future</span>
</div>

<div class="readouts">
  <Readout id="dl-r-half" label="Chance of halving" value={pct(half, 1)} color="var(--c1)" />
  <Readout id="dl-r-tenth" label="Chance of losing 90%" value={pct(tenth, 1)} color="var(--c2)" />
  <Readout id="dl-r-kept" label="Share of Kelly's growth" value={pct(Math.max(0, kept), 0)} />
  <Readout id="dl-r-vol" label="Volatility" value={pct(vol(c), 1)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); }
</style>
