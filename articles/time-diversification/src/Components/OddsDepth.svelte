<script>
  /*
    Two panels sharing the horizon axis. The first is the chance that stocks
    end behind bonds; the second is how far behind, on average, when they do
    (pink), and the average shortfall over every outcome (ink, dashed), which
    is the first panel times the pink line. No dual axis: two panels.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { chanceBehind, shortfallWhenBehind, expectedShortfall, shortfallPeak, PREMIUM, YEARS } from "../horizon.js";
  import { pathOf } from "../chart.js";
  import { pct } from "../format.js";

  let { width, T = 30, sigma = $bindable(0.2) } = $props();

  const H = 190;
  const m = { top: 12, right: 16, bottom: 42, left: 62 };
  let x = $derived(linear([0, YEARS], [m.left, width - m.right]));
  const y = linear([0, 0.5], [H - m.bottom, m.top]);
  const ts = Array.from({ length: YEARS * 4 }, (_, i) => 0.25 + i / 4);
  let chanceD = $derived(pathOf(ts.map((t) => [x(t), y(chanceBehind(t, PREMIUM, sigma))])));
  let depthD = $derived(pathOf(ts.map((t) => [x(t), y(shortfallWhenBehind(t, PREMIUM, sigma))])));
  let esD = $derived(pathOf(ts.map((t) => [x(t), y(expectedShortfall(t, PREMIUM, sigma))])));
  let peak = $derived(shortfallPeak(PREMIUM, sigma));
  const yt = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
  const xt = [0, 10, 20, 30, 40];
</script>

<div class="controls">
  <Segmented label="Stock volatility" id="od-sigma" bind:value={sigma}
    options={[0.15, 0.2, 0.25].map((v) => ({ value: v, label: pct(v, 0) }))} />
</div>

<p class="panel-title">Chance that stocks end behind bonds</p>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Chance of ending behind, by horizon" class="odds-panel">
  <AxisY scale={y} ticks={yt} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={x} ticks={xt} y={H - m.bottom} title="years held" />
  <path class="chance-line" d={chanceD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="t-marker" x1={x(T)} x2={x(T)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="chance-dot" cx={x(T)} cy={y(chanceBehind(T, PREMIUM, sigma))} r="4.5" fill="var(--c1)" />
</svg>

<p class="panel-title">How far behind, as a share of the bonds' value</p>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Size of the shortfall, by horizon" class="depth-panel">
  <AxisY scale={y} ticks={yt} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={x} ticks={xt} y={H - m.bottom} title="years held" />
  <path class="depth-line" d={depthD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="es-line" d={esD} fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="5 4" />
  <circle class="es-peak" cx={x(peak.T)} cy={y(peak.value)} r="4" fill="white" stroke="var(--ink)" stroke-width="1.6" />
  <line class="t-marker" x1={x(T)} x2={x(T)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="depth-dot" cx={x(T)} cy={y(shortfallWhenBehind(T, PREMIUM, sigma))} r="4.5" fill="var(--c2)" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>average shortfall when behind</span>
  <span class="key"><span class="swatch dashed"></span>average shortfall over all outcomes</span>
</p>
<div class="readouts">
  <Readout id="od-r-T" label="Horizon" value={`${T} ${T === 1 ? "year" : "years"}`} />
  <Readout id="od-r-chance" label="Chance behind" value={pct(chanceBehind(T, PREMIUM, sigma), 0)} color="var(--c1)" />
  <Readout id="od-r-depth" label="Shortfall when behind" value={pct(shortfallWhenBehind(T, PREMIUM, sigma), 0)} color="var(--c2)" />
  <Readout id="od-r-es" label="Over all outcomes" value={pct(expectedShortfall(T, PREMIUM, sigma), 1)} />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
</style>
