<script>
  /*
    The hook. We hold the 30-year 8% bond for H years and sell. Just after we
    buy, rates move to a new level and stay there; everything is valued and
    reinvested at it. The curve is our money at H against the promise of 8%,
    for every new rate from 4% to 12%. Short horizons lose when rates rise,
    long ones when they fall; at the average wait the curve is a valley whose
    floor is the promise.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { atHorizon, dates } from "../duration.js";
  import { pct, signedPct } from "../format.js";

  let { width } = $props();
  const C = 0.08, T = 30, Y0 = 0.08;
  const D = dates(C, T, Y0).D;
  let user = $state(null);
  let H = $derived(user ?? 5);
  const RS = Array.from({ length: 161 }, (_, i) => 0.04 + i * 0.0005);
  let gains = $derived(RS.map((r) => atHorizon(C, T, Y0, H, r) - 1));
  let lo = $derived(Math.min(...gains)), hi = $derived(Math.max(...gains));
  const steps = [0.02, 0.05, 0.1, 0.2, 0.25, 0.5];
  let span = $derived.by(() => { const a = Math.min(lo, -0.01), b = Math.max(hi, 0.01); const st = steps.find((s) => (b - a) / s <= 6) ?? 0.5; return { a: Math.floor(a / st) * st, b: Math.ceil(b / st) * st, st }; });
  const Hh = 270, m = { top: 12, right: 14, bottom: 44, left: 52 };
  let X = $derived(linear(0.04, 0.12, m.left, width - m.right));
  let Y = $derived(linear(span.a, span.b, Hh - m.bottom, m.top));
  let yt = $derived.by(() => { const o = []; for (let v = span.a; v <= span.b + 1e-9; v += span.st) o.push(+v.toFixed(4)); return o; });
  let curve = $derived(RS.map((r, i) => `${i ? "L" : "M"}${X(r).toFixed(2)},${Y(gains[i]).toFixed(2)}`).join(""));
  let at4 = $derived(atHorizon(C, T, Y0, H, 0.04) - 1), at12 = $derived(atHorizon(C, T, Y0, H, 0.12) - 1);
</script>

<div class="controls">
  <Slider id="hl-h" label="Years we hold the bond" min={1} max={30} step={0.01} bind:value={() => H, (v) => (user = +v)} format={(v) => v.toFixed(1)} width={300} />
  <button type="button" class="again" id="hl-d" onclick={() => (user = D)}>Sell at the average wait, {D.toFixed(1)} years</button>
</div>

<svg width={width} height={Hh} viewBox="0 0 {width} {Hh}" role="img" aria-label="Our money when we sell, against the promise, for each new rate" class="horizon-panel">
  <AxisY scale={Y} ticks={yt} x0={m.left} x1={width - m.right} format={(t) => signedPct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={Hh - m.bottom} y2={Hh - m.bottom} />
    {#each [0.04, 0.06, 0.08, 0.1, 0.12] as t (t)}
      <g transform="translate({X(t)},{Hh - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={Hh - 6} text-anchor="middle">the new rate, just after we buy</text>
  </g>
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-width="1.4" />
  <line class="yield" x1={X(Y0)} x2={X(Y0)} y1={m.top} y2={Hh - m.bottom} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="3 3" />
  <path class="gain" d={curve} fill="none" stroke="var(--c1)" stroke-width="2.6" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>money when we sell, against the promise</span>
  <span><i style="background:var(--ink)"></i>exactly the promise</span>
</div>

<div class="readouts">
  <Readout id="hl-4" label="If rates fall to 4%" value={signedPct(at4, 2)} />
  <Readout id="hl-12" label="If rates rise to 12%" value={signedPct(at12, 2)} />
  <Readout id="hl-worst" label="Worst case, rates from 4% to 12%" value={signedPct(lo, 2)} />
</div>

<style>
  svg { display: block; }
  .again { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; align-self: flex-end; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
