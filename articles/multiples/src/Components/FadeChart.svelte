<script>
  /*
    How long does the margin have to last? The firm reinvests at its return on
    equity for N years; after that new money earns only r and adds nothing.
    P/E against N, from 12.5 with no advantage to the perpetual P/E, with the
    year by which half the value of growth has been earned.
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { value, pvgoFor, R } from "../growth.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  const FIRMS = {
    a: { roe: 0.12, g: 0.06, label: "ROE 12%, growth 6%" },
    b: { roe: 0.2, g: 0.05, label: "ROE 20%, growth 5%" },
  };
  let key = $state("a");
  let N = $state(10);
  let f = $derived(FIRMS[key]);
  let full = $derived(value(f));
  let peN = $derived(1 / R + pvgoFor(N, f));
  let share = $derived(pvgoFor(N, f) / full.pvgo);
  let half = $derived(Math.log(0.5) / Math.log((1 + f.g) / (1 + R)));

  const H = 270, NMAX = 150;
  const m = { top: 26, right: 18, bottom: 46, left: 44 };
  let x = $derived(linear([0, NMAX], [m.left, width - m.right]));
  const y = linear([10, 26], [H - m.bottom, m.top]);
  let curve = $derived.by(() => {
    const pts = [];
    for (let n = 0; n <= NMAX; n++) pts.push([x(n), y(1 / R + pvgoFor(n, f))]);
    return path(pts);
  });
</script>

<div class="controls">
  <Segmented label="Firm" id="fc-firm" options={Object.entries(FIRMS).map(([k, o]) => ({ value: k, label: o.label }))} bind:value={key} />
  <Slider label="Years the margin lasts" id="fc-n" min={0} max={NMAX} step={1} bind:value={N} format={(u) => u + " years"} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="P/E against the number of years the firm earns more than its cost of capital" class="fade-panel">
  <AxisY scale={y} ticks={[10, 15, 20, 25]} x0={m.left} x1={width - m.right} />
  <AxisX scale={x} ticks={[0, 25, 50, 75, 100, 125, 150]} y={H - m.bottom} title="Years the margin lasts" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">P/E</text>
  <line class="forever" x1={x(0)} x2={x(NMAX)} y1={y(full.PE)} y2={y(full.PE)} stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" />
  <text class="lab halo" x={x(NMAX) - 4} y={y(full.PE) - 6} text-anchor="end">for ever</text>
  <line class="none" x1={x(0)} x2={x(NMAX)} y1={y(1 / R)} y2={y(1 / R)} stroke="#8a94a2" stroke-width="1.4" stroke-dasharray="2 3" />
  <text class="lab halo" x={x(NMAX) - 4} y={y(1 / R) + 15} text-anchor="end">no margin</text>
  <line class="half" x1={x(half)} x2={x(half)} y1={y(10)} y2={y((1 / R + full.PE) / 2)} stroke="var(--c2)" stroke-width="1.4" stroke-dasharray="3 3" />
  <path class="curve fade" d={curve} fill="none" stroke="var(--c1)" stroke-width="3" />
  <circle class="pt" cx={x(N)} cy={y(peN)} r="6.5" fill="var(--c1)" stroke="white" stroke-width="2" />
  <circle class="half-pt" cx={x(half)} cy={y((1 / R + full.PE) / 2)} r="4.5" fill="var(--c2)" stroke="white" stroke-width="1.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>P/E if the margin lasts that long</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>half the value of growth</span>
</p>

<div class="readouts">
  <Readout id="fc-r-pe" label={"P/E at " + N + " years"} value={fixed(peN, 1)} color="var(--c1)" />
  <Readout id="fc-r-share" label="Share of the growth value" value={pct(share, 0)} />
  <Readout id="fc-r-half" label="Half the growth value is earned by" value={"year " + fixed(half, 0)} color="var(--c2)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .halo { stroke: #fff; stroke-width: 3px; paint-order: stroke; font-size: 11.5px; fill: var(--ink-soft); }
</style>
