<script>
  /*
    Two variances of the same k-year total, per year, in units of a one-year
    variance at 20% volatility. The world's is what a long record measures
    (nothing conditioned on, every parameter known). The investor's is what
    someone holding 206 years of returns should expect: the paper's five
    pieces, averaged over any doubt about persistence. Below, the five pieces
    at the marked horizon.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { pathOf } from "../chart.js";
  import { worldVariance, doubtedSeries, perYear, REVERSION, DOUBT, BETA, HORIZON } from "../longrun.js";
  import { fixed } from "../format.js";

  let { width, reversion = $bindable("moderate"), doubt = $bindable("known"), k = $bindable(30) } = $props();

  const height = 280;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const ks = Array.from({ length: HORIZON }, (_, i) => i + 1);
  let rho = $derived(REVERSION[reversion]);
  let series = $derived(doubtedSeries(DOUBT[doubt], rho));
  let world = $derived(ks.map((j) => perYear(worldVariance(j, BETA, rho), j)));
  let investor = $derived(ks.map((j) => perYear(series[j].total, j)));
  let yMax = $derived(Math.max(1.4, Math.ceil(Math.max(...investor, ...world) * 5) / 5));
  let x = $derived(linear([0, HORIZON], [m.left, width - m.right]));
  let y = $derived(linear([0, yMax], [height - m.bottom, m.top]));
  let worldD = $derived(pathOf(ks.map((j, i) => [x(j), y(world[i])])));
  let investorD = $derived(pathOf(ks.map((j, i) => [x(j), y(investor[i])])));
  let yTicks = $derived(Array.from({ length: Math.round(yMax / 0.2) + 1 }, (_, i) => +(i * 0.2).toFixed(1)));

  // the pieces at the marked horizon
  const NAMES = [
    ["iid", "Surprises, one year at a time"],
    ["reversion", "Mean reversion"],
    ["future", "Future expected returns"],
    ["today", "Today's expected return"],
    ["estimation", "Estimation risk"],
  ];
  let pieces = $derived(NAMES.map(([key, label]) => ({ key, label, v: perYear(series[k][key], k) })));
  let total = $derived(perYear(series[k].total, k));
  const bh = 232;
  const bm = { left: 12, right: 16 };
  const B = 1.2;
  let bx = $derived(linear([-B, B], [bm.left, width - bm.right]));
  const rowH = 36;
  const sgn = (v) => (v < 0 ? "−" : "+") + fixed(Math.abs(v), 2);
</script>

<div class="controls">
  <Segmented label="Mean reversion" id="tv-rev" bind:value={reversion}
    options={[{ value: "strong", label: "Strong" }, { value: "moderate", label: "Moderate" }, { value: "weak", label: "Weak" }]} />
  <Segmented label="Persistence of expected returns" id="tv-doubt" bind:value={doubt}
    options={[{ value: "known", label: "Known: 0.83" }, { value: "fair", label: "0.75 to 0.91" }, { value: "unsure", label: "0.66 to 1" }]} />
  <Slider label="Horizon" id="tv-k" min={1} max={HORIZON} step={1} bind:value={k} format={(v) => `${v} ${v === 1 ? "year" : "years"}`} width={220} />
</div>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="Per-year variance by horizon, the world's and the investor's" class="two-variances">
  <AxisY scale={y} ticks={yTicks} x0={m.left} x1={width - m.right} format={(v) => fixed(v, 1)} title="variance per year" />
  <AxisX scale={x} ticks={width < 500 ? [0, 10, 20, 30, 40, 50] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]} y={height - m.bottom} title="horizon, years" />
  <line class="one-line" x1={m.left} x2={width - m.right} y1={y(1)} y2={y(1)} stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7" />
  <path class="world-line" d={worldD} fill="none" stroke="var(--ink)" stroke-width="2" />
  <path class="investor-line" d={investorD} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  <line class="horizon-marker" x1={x(k)} x2={x(k)} y1={m.top} y2={height - m.bottom} stroke="var(--ink)" stroke-width="1" opacity="0.5" />
  <circle class="world-dot" cx={x(k)} cy={y(world[k - 1])} r="4.5" fill="var(--ink)" />
  <circle class="investor-dot" cx={x(k)} cy={y(investor[k - 1])} r="5" fill="var(--c1)" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--ink)"></span>the world, as a long record measures it</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>an investor with 206 years of data</span>
  <span class="key"><span class="swatch dashed"></span>the one-year variance</span>
</p>
<div class="readouts">
  <Readout id="tv-r-world" label={`World, ${k}-year horizon`} value={`${fixed(world[k - 1], 2)}`} />
  <Readout id="tv-r-investor" label={`Investor, ${k}-year horizon`} value={`${fixed(investor[k - 1], 2)}`} color="var(--c1)" />
</div>

<p class="panel-title">The investor's variance per year at {k} {k === 1 ? "year" : "years"}, piece by piece</p>
<svg {width} height={bh} viewBox="0 0 {width} {bh}" role="img" aria-label="The five pieces of the investor's variance" class="pieces">
  <line class="zero" x1={bx(0)} x2={bx(0)} y1="4" y2={bh - 4} stroke="var(--ink)" stroke-width="1" opacity="0.6" />
  {#each pieces as p, i (p.key)}
    <text class="piece-label" x={bm.left} y={8 + i * rowH + 12}>{p.label}: {sgn(p.v)}</text>
    <rect class="piece-bar {p.key}" x={Math.min(bx(0), bx(Math.max(-B, p.v)))} y={8 + i * rowH + 17} width={Math.abs(bx(Math.max(-B, Math.min(B, p.v))) - bx(0))} height="12"
      fill={p.v < 0 ? "var(--c2)" : "var(--c1)"} />
  {/each}
  <text class="piece-label total-label" x={bm.left} y={8 + 5 * rowH + 12}>Total: {fixed(total, 2)}</text>
  <rect class="piece-bar total" x={bx(0)} y={8 + 5 * rowH + 17} width={Math.abs(bx(Math.min(B, total)) - bx(0))} height="12" fill="var(--ink)" />
</svg>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 1.2rem 0 0.3rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
  :global(.pieces .piece-label) { font-size: 12px; fill: var(--ink-soft); stroke: #fff; stroke-width: 3px; paint-order: stroke; }
  :global(.pieces .total-label) { font-weight: 700; }
</style>
