<script>
  /*
    The luck premium on a chart. The black curve is the true chance of a real
    loss over each horizon. The blue curve is what the luckiest of n records
    implies on average: the same formula with the growth rate overstated by
    E[max_n] sigma / sqrt(Y). With one market there's nothing to choose.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { pathOf, bandOf } from "../chart.js";
  import { lossChance, luckPremium, zShift, GROWTH, SIGMA, HORIZON } from "../markets.js";
  import { pct, fixed } from "../format.js";

  let { width, n = $bindable(39), Y = $bindable(130) } = $props();

  const H = 260, T0 = 30;
  const m = { top: 14, right: 16, bottom: 46, left: 62 };
  let x = $derived(linear([0, HORIZON], [m.left, width - m.right]));
  const y = linear([0, 0.5], [H - m.bottom, m.top]);
  const ts = Array.from({ length: HORIZON }, (_, i) => i + 1);
  let luck = $derived(luckPremium(n, Y));
  const truth = (t) => lossChance(GROWTH, SIGMA, t);
  let seen = $derived((t) => lossChance(GROWTH + luck, SIGMA, t));
  let truthD = $derived(pathOf(ts.map((t) => [x(t), y(truth(t))])));
  let seenD = $derived(pathOf(ts.map((t) => [x(t), y(seen(t))])));
  let gapD = $derived(bandOf(ts.map((t) => x(t)), ts.map((t) => y(truth(t))), ts.map((t) => y(seen(t)))));
</script>

<div class="controls">
  <Segmented label="Markets to choose from" id="lf-n" bind:value={n} options={[1, 10, 39, 100].map((v) => ({ value: v, label: `${v}` }))} />
  <Segmented label="Years of record" id="lf-Y" bind:value={Y} options={[50, 130, 180].map((v) => ({ value: v, label: `${v}` }))} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="True loss chance against the luckiest record's" class="luck">
  <path class="gap" d={gapD} fill="var(--c1-soft)" opacity="0.7" />
  <AxisY scale={y} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="loss chance" />
  <AxisX scale={x} ticks={[0, 10, 20, 30, 40, 50]} y={H - m.bottom} title="horizon, years" />
  <path class="truth-curve" d={truthD} fill="none" stroke="var(--ink)" stroke-width="2" />
  <path class="seen-curve" d={seenD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="t-marker" x1={x(T0)} x2={x(T0)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" opacity="0.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--ink)"></span>the truth</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>what the luckiest record implies, on average</span>
</p>
<div class="readouts">
  <Readout id="lf-r-luck" label="Growth overstated by" value={`${fixed(100 * luck, 1)} points`} color="var(--c1)" />
  <Readout id="lf-r-z" label="Shift at 30 years" value={`${fixed(zShift(n, T0, Y), 2)} sd`} />
  <Readout id="lf-r-truth" label="True, 30 years" value={pct(truth(T0), 1)} />
  <Readout id="lf-r-seen" label="Luckiest record, 30 years" value={pct(seen(T0), 1)} color="var(--c1)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
