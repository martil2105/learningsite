<script>
  /*
    Order against count. The two strips mark every exception of a model over
    the 26,000 tested days: as they happened, and moved to randomly shuffled
    days (the same number of them). Below, how many blocks of 250 days had each
    count, for the order chosen, with the grey caps showing what independent
    days at the model's own rate would give.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { MODELS, tested, shuffled, describe, binomialBlocks, upper, BLOCKS, YEAR, YELLOW, RED } from "../backtest.js";
  import { pct } from "../format.js";

  let { width } = $props();
  const SHORT = { century: "Knows the century", history: "Last 250 days", riskmetrics: "RiskMetrics", filtered: "Filtered history" };
  let model = $state("century");
  let order = $state("real");
  let seed = $state(1);
  let I = $derived(tested(model));
  let J = $derived(shuffled(I, seed));
  let real = $derived(describe(I));
  let mixed = $derived(describe(J));
  let d = $derived(order === "real" ? real : mixed);

  const ND = BLOCKS * YEAR;
  const S = { top: 6, h: 26, gap: 22, left: 8, right: 8 };
  let XS = $derived(linear(0, ND, S.left, width - S.right));
  const ticksOf = (A) => { const o = []; for (let t = 0; t < A.length; t++) if (A[t]) o.push(t); return o; };
  let tReal = $derived(ticksOf(I));
  let tMix = $derived(ticksOf(J));
  const HS = S.top + 2 * S.h + S.gap + 18;
  let stripPath = $derived((ts, y) => ts.map((t) => `M${XS(t + 0.5).toFixed(1)},${y}v${S.h}`).join(""));

  // the histogram of block counts
  const H = 230, m = { top: 12, right: 12, bottom: 40, left: 40 };
  let KM = $derived(Math.max(14, real.most + 1));
  let bw = $derived((width - m.left - m.right) / (KM + 1));
  let X = $derived((k) => m.left + (k + 0.5) * bw);
  const nice = (v) => [10, 20, 30, 40, 50, 60].find((t) => t >= v) ?? 60;
  const expectBlocks = (rate, k, km) => (k === km ? BLOCKS * upper(YEAR, rate, km) : binomialBlocks(rate, k));
  const freq = (cs, k, km) => cs.filter((c) => (k === km ? c >= km : c === k)).length;
  let ymax = $derived(nice(Math.max(...Array.from({ length: KM + 1 }, (_, k) => Math.max(freq(real.counts, k, KM), freq(mixed.counts, k, KM), expectBlocks(real.rate, k, KM))))));
  let Y = $derived(linear(0, ymax, H - m.bottom, m.top));
  let hist = $derived(Array.from({ length: KM + 1 }, (_, k) => ({ k, n: freq(d.counts, k, KM), e: expectBlocks(real.rate, k, KM) })));
</script>

<div class="controls">
  <Segmented id="sf-model" label="Model" options={MODELS.map((o) => ({ value: o.key, label: SHORT[o.key] }))} bind:value={model} />
  <Segmented id="sf-order" label="Days" options={[{ value: "real", label: "As they happened" }, { value: "mixed", label: "Shuffled" }]} bind:value={order} />
  <button type="button" class="again" id="sf-again" onclick={() => { seed += 1; order = "mixed"; }}>Shuffle again</button>
</div>

<svg {width} height={HS} viewBox="0 0 {width} {HS}" role="img" aria-label="Every exception as it happened, and shuffled" class="strips">
  <text class="strip-label" x={S.left} y={S.top + 9}>as they happened</text>
  <path class="strip real" d={stripPath(tReal, S.top + 13)} stroke="var(--c2)" stroke-width="1" />
  <text class="strip-label" x={S.left} y={S.top + S.h + S.gap + 9}>shuffled</text>
  <path class="strip mixed" d={stripPath(tMix, S.top + S.h + S.gap + 13)} stroke="var(--c1)" stroke-width="1" />
</svg>

<p class="panel-title">Blocks of 250 days with each number of exceptions</p>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="How many blocks had each number of exceptions" class="hist-panel">
  <rect class="band red" x={X(RED) - bw / 2} width={(KM - RED + 1) * bw} y={m.top} height={H - m.bottom - m.top} fill="var(--c2-soft)" />
  <rect class="band green" x={X(0) - bw / 2} width={YELLOW * bw} y={m.top} height={H - m.bottom - m.top} fill="var(--c3-soft)" />
  <AxisY scale={Y} ticks={[0, ymax / 2, ymax]} x0={m.left} x1={width - m.right} />
  {#each hist as h (h.k)}
    <rect class="hbar k{h.k}" x={X(h.k) - bw * 0.36} width={bw * 0.72} y={Y(h.n)} height={Y(0) - Y(h.n)} fill={order === "real" ? "var(--c2)" : "var(--c1)"} />
  {/each}
  {#each hist as h (h.k)}
    <line class="ecap k{h.k}" x1={X(h.k) - bw * 0.45} x2={X(h.k) + bw * 0.45} y1={Y(Math.min(h.e, ymax))} y2={Y(Math.min(h.e, ymax))} stroke="#5f6b7a" stroke-width="2.2" />
  {/each}
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 5, 10] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{t}</text>
      </g>
    {/each}
    <g transform="translate({X(KM)},{H - m.bottom})">
      <line y2="5" />
      <text class="tick-label" y="18" text-anchor="middle">{KM}+</text>
    </g>
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">exceptions in the block</text>
  </g>
</svg>
<div class="legend">
  <span><i style="background:{order === 'real' ? 'var(--c2)' : 'var(--c1)'}"></i>{order === "real" ? "as they happened" : "shuffled"}</span>
  <span><i style="background:#5f6b7a"></i>independent days at the same rate</span>
</div>

<div class="readouts">
  <Readout id="sf-red" label="Red blocks" value={String(d.red)} />
  <Readout id="sf-none" label="Blocks with none" value={String(d.none)} />
  <Readout id="sf-after" label="Exception the day after one" value={pct(d.after, 1)} />
  <Readout id="sf-factor" label="Spread against independent days" value={`${d.factor.toFixed(1)}×`} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .strip-label { font-size: 11px; font-weight: 700; fill: var(--ink-soft); }
  .again { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; align-self: flex-end; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
