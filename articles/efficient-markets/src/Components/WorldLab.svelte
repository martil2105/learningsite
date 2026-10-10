<script>
  /*
    The hook. A market whose true value is a random walk, recorded in one of
    two ways. Stale prices: an index where a share π of stocks doesn't trade
    each day. Bid–ask bounce: one stock whose trades print at the bid or the
    ask. Top: forty days of the true and the recorded price. Bottom: the
    recorded series' variance ratio, the formula (line) and 25 simulated
    years (dots); the dashed line at 1 is the true value's.
  */
  import { linear } from "../chart.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { staleWorld, bounceWorld, vrStale, vrBounce, rhoStale, rhoBounce, rollSpread, LAB_DAYS, LAB_SEED } from "../worlds.js";
  import { acf, vr, mean } from "../vr.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let kind = $state("stale");
  let pi = $state(0.3);
  let spread = $state(1);
  let W = $derived(kind === "stale" ? staleWorld(LAB_DAYS, pi, LAB_SEED.stale) : bounceWorld(LAB_DAYS, spread / 100, LAB_SEED.bounce));
  let rec = $derived(Array.from(W.recorded));
  // forty days of levels, starting at 100
  const DAYS = 40;
  let levels = $derived.by(() => {
    let lt = 0, lr = kind === "bounce" ? W.h * W.side[0] : 0;
    const t = [100], r = [100 * Math.exp(lr)];
    for (let i = 0; i < DAYS; i++) { lt += W.truth[i]; lr += W.recorded[i]; t.push(100 * Math.exp(lt)); r.push(100 * Math.exp(lr)); }
    return { t, r };
  });
  const H1 = 220, H2 = 240, m = { top: 12, right: 16, bottom: 42, left: 48 };
  let X1 = $derived(linear(0, DAYS, m.left, width - m.right));
  let yr = $derived.by(() => { const all = [...levels.t, ...levels.r]; const lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.08; return [Math.floor(lo - pad), Math.ceil(hi + pad)]; });
  let Y1 = $derived(linear(yr[0], yr[1], H1 - m.bottom, m.top));
  let y1ticks = $derived.by(() => { const step = yr[1] - yr[0] > 12 ? 5 : 2; const out = []; for (let v = Math.ceil(yr[0] / step) * step; v <= yr[1]; v += step) out.push(v); return out; });
  const lineOf = (arr, X, Y) => arr.map((v, i) => (i ? "L" : "M") + X(i).toFixed(2) + "," + Y(v).toFixed(2)).join("");

  const QS = Array.from({ length: 20 }, (_, i) => i + 2);
  let X2 = $derived(linear(1, 21, m.left, width - m.right));
  let Y2 = $derived(kind === "stale" ? linear(0.8, 4, H2 - m.bottom, m.top) : linear(0.2, 1.2, H2 - m.bottom, m.top));
  let y2ticks = $derived(kind === "stale" ? [1, 2, 3, 4] : [0.2, 0.4, 0.6, 0.8, 1, 1.2]);
  const theoryVR = (q) => (q === 1 ? 1 : kind === "stale" ? vrStale(q, pi) : vrBounce(q, spread / 100));
  let theory = $derived([1, ...QS].map((q, i) => (i ? "L" : "M") + X2(q).toFixed(2) + "," + Y2(theoryVR(q)).toFixed(2)).join(""));
  let sample = $derived(QS.map((q) => ({ q, v: vr(rec, q) })));
  let rhoTh = $derived(kind === "stale" ? rhoStale(1, pi) : rhoBounce(1, spread / 100));
  let rhoS = $derived(acf(rec, 1));
  let cov1 = $derived.by(() => { const mm = mean(rec); let c = 0; for (let i = 1; i < rec.length; i++) c += (rec[i] - mm) * (rec[i - 1] - mm); return c / rec.length; });
</script>

<div class="controls">
  <Segmented id="wl-kind" label="How prices are recorded" options={[{ value: "stale", label: "Stale prices" }, { value: "bounce", label: "Bid–ask bounce" }]} bind:value={kind} />
  {#if kind === "stale"}
    <Slider id="wl-pi" label="Stocks that don't trade on a day" min={0} max={0.6} step={0.05} bind:value={pi} format={(v) => pct(+v, 0)} width={260} />
  {:else}
    <Slider id="wl-s" label="Bid–ask spread" min={0} max={2} step={0.1} bind:value={spread} format={(v) => fixed(+v, 1) + "%"} width={260} />
  {/if}
</div>

<p class="panel-title">Forty days, true and recorded</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Forty days of the true and the recorded price" class="world-days">
  <AxisY scale={Y1} ticks={y1ticks} x0={m.left} x1={width - m.right} />
  <AxisX scale={X1} ticks={[0, 10, 20, 30, 40]} y={H1 - m.bottom} title="days" />
  <path class="truth" d={lineOf(levels.t, X1, Y1)} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="recorded" d={lineOf(levels.r, X1, Y1)} fill="none" stroke="var(--c2)" stroke-width="2" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>true value</span>
  <span><i style="background:var(--c2)"></i>recorded price</span>
</div>

<p class="panel-title">The recorded price's variance ratio</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Variance ratio of the recorded price against the number of days" class="world-vr">
  <AxisY scale={Y2} ticks={y2ticks} x0={m.left} x1={width - m.right} format={(v) => fixed(v, 1)} />
  <AxisX scale={X2} ticks={[1, 5, 10, 15, 21]} y={H2 - m.bottom} title="days in each return, q" />
  <line class="walk" x1={m.left} x2={width - m.right} y1={Y2(1)} y2={Y2(1)} stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" />
  <path class="theory" d={theory} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  {#each sample as s (s.q)}
    <circle class="sample" cx={X2(s.q)} cy={Y2(s.v)} r="3.2" fill="white" stroke="var(--c2)" stroke-width="1.6" />
  {/each}
</svg>
<div class="legend">
  <span><i style="background:var(--c2)"></i>formula</span>
  <span><i class="ring"></i>25 simulated years</span>
  <span><i class="dash"></i>the true value, a random walk</span>
</div>

<div class="readouts">
  <Readout id="wl-r-rho" label="Lag-1 autocorrelation" value={fixed(rhoTh, 2)} color="var(--c2)" />
  <Readout id="wl-r-rhos" label="In these 25 years" value={fixed(rhoS, 2)} />
  <Readout id="wl-r-vr" label="VR(21)" value={fixed(theoryVR(21), 2)} color="var(--c2)" />
  {#if kind === "bounce"}
    <Readout id="wl-r-roll" label="Roll's spread from prices" value={fixed(100 * rollSpread(cov1), 2) + "%"} />
  {:else}
    <Readout id="wl-r-vrs" label="VR(21) in these 25 years" value={fixed(sample[19].v, 2)} />
  {/if}
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.ring { width: 8px; height: 8px; border-radius: 50%; border: 1.6px solid var(--c2); background: white; vertical-align: 0; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); }
</style>
