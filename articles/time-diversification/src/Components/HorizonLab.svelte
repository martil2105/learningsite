<script>
  /*
    The hook. Two hundred seeded paths of stocks ÷ bonds over forty years,
    drawn on either of two rulers: the average yearly growth gap (the funnel
    people have in mind) or the money at the end (a fan, on a log axis). The
    median and one tail quantile are the closed forms from horizon.js; the
    paths are there so the reader can count them.
  */
  import { linear, ticks } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { ratioPaths, chanceBehind, ratioQuantile, worstYear, medianGap, logRatio, PREMIUM, SIGMA, YEARS, PATHS } from "../horizon.js";
  import { normInv } from "../stats.js";
  import { pct, signedPct, fixed } from "../format.js";

  let { width, view = $bindable("annual"), T = $bindable(30), tail = $bindable(20) } = $props();

  const height = 330;
  const m = { top: 14, right: 16, bottom: 46, left: 62 };
  const paths = ratioPaths();
  const mGap = medianGap(PREMIUM, SIGMA);

  // v is the plotted coordinate: ln(ratio) on the money ruler, the yearly
  // average ln(ratio)/t on the other.
  const WIN = { money: [Math.log(0.1), Math.log(20)], annual: [-0.5, 0.5] };
  let lo = $derived(WIN[view][0]);
  let hi = $derived(WIN[view][1]);
  let x = $derived(linear([0, YEARS], [m.left, width - m.right]));
  let y = $derived(linear([lo, hi], [height - m.bottom, m.top]));
  const coord = (t, lr, v) => (v === "money" ? lr : t > 0 ? lr / t : NaN);

  let pathDs = $derived(
    paths.map((p) => clippedPath(p.map((r, t) => [t, coord(t, Math.log(r), view)]), x, y, lo, hi)).filter((d) => d.length)
  );
  const grid = Array.from({ length: YEARS * 4 + 1 }, (_, i) => i / 4);
  let z = $derived(normInv(1 / tail));
  let medD = $derived(clippedPath(grid.map((t) => [t, coord(t, mGap * t, view)]), x, y, lo, hi));
  let tailD = $derived(clippedPath(grid.map((t) => [t, coord(t, mGap * t + z * SIGMA * Math.sqrt(t), view)]), x, y, lo, hi));
  let bottom = $derived(worstYear(1 / tail));

  let behindDrawn = $derived(paths.filter((p) => p[T] < 1).length);
  let chance = $derived(chanceBehind(T));
  let med = $derived(Math.exp(logRatio(T).mu));
  let tq = $derived(ratioQuantile(T, 1 / tail));

  const moneyTicks = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20];
  let yTicks = $derived(view === "money" ? moneyTicks.map(Math.log) : [-0.4, -0.2, 0, 0.2, 0.4]);
  const fmtY = (v) => (view === "money" ? `${+Math.exp(v).toPrecision(2)}×` : signedPct(v, 0));
  let yTitle = $derived(view === "money" ? "stocks ÷ bonds" : "yearly growth gap");
  let lineY = $derived(y(0));
  let medText = $derived(view === "money" ? `${fixed(med, 2)}×` : `${signedPct(mGap, 1)} a year`);
  let tailText = $derived(view === "money" ? `${fixed(tq, 2)}×` : `${signedPct(Math.log(tq) / T, 1)} a year`);
</script>

<div class="controls">
  <Segmented label="Ruler" id="hz-view" bind:value={view}
    options={[{ value: "annual", label: "Yearly average" }, { value: "money", label: "Money at the end" }]} />
  <Slider label="Horizon" id="hz-T" min={1} max={YEARS} step={1} bind:value={T} format={(v) => `${v} ${v === 1 ? "year" : "years"}`} width={220} />
  <Segmented label="Bad outcome" id="hz-tail" bind:value={tail}
    options={[{ value: 20, label: "1 in 20" }, { value: 100, label: "1 in 100" }]} />
</div>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="Stocks against bonds over forty years" class="horizon-lab">
  <rect class="behind-zone" x={m.left} y={lineY} width={width - m.left - m.right} height={Math.max(0, height - m.bottom - lineY)} fill="var(--c2-soft)" opacity="0.45" />
  <AxisY scale={y} ticks={yTicks} x0={m.left} x1={width - m.right} format={fmtY} title={yTitle} />
  <AxisX scale={x} ticks={ticks(0, YEARS, width < 500 ? 4 : 8)} y={height - m.bottom} title="years held" />
  <g class="paths">
    {#each pathDs as d, i (i)}
      <path {d} fill="none" stroke="#8a94a2" stroke-opacity="0.28" stroke-width="0.9" />
    {/each}
  </g>
  <line class="shortfall-line" x1={m.left} x2={width - m.right} y1={lineY} y2={lineY} stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" />
  <path class="median-line" d={medD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="tail-line" d={tailD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  {#if view === "money" && bottom.T <= YEARS}
    <circle class="tail-bottom" cx={x(bottom.T)} cy={y(Math.log(bottom.ratio))} r="5" fill="white" stroke="var(--c2)" stroke-width="2" />
  {/if}
  <line class="horizon-marker" x1={x(T)} x2={x(T)} y1={m.top} y2={height - m.bottom} stroke="var(--ink)" stroke-width="1" opacity="0.55" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch grey"></span>one path each</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>the median</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>{`the 1-in-${tail} bad outcome`}</span>
  <span class="key"><span class="swatch dashed"></span>level with bonds</span>
</p>
<div class="readouts">
  <Readout id="hz-r-chance" label="Chance stocks end behind" value={pct(chance, 0)} color="var(--c2)" />
  <Readout id="hz-r-drawn" label="Paths drawn that end behind" value={`${behindDrawn} of ${PATHS}`} />
  <Readout id="hz-r-median" label="Median" value={medText} color="var(--c1)" />
  <Readout id="hz-r-tail" label={`1-in-${tail} bad outcome`} value={tailText} color="var(--c2)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.grey { background: #8a94a2; opacity: 0.6; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
</style>
