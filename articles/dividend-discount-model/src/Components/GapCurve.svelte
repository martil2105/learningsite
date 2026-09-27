<script>
  import { linear, ticks, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { pct, signedPct } from "../format.js";

  // Price per dollar of next year's dividend against the gap r - g. The
  // tangent is what duration predicts; the curve is what happens.
  let { width, gap = $bindable(0.03) } = $props();
  const height = 300;
  const m = { top: 16, right: 16, bottom: 46, left: 56 };
  let x = $derived(linear([0.01, 0.1], [m.left, width - m.right]));
  const y = linear([0, 100], [height - m.bottom, m.top]);
  let curve = $derived(path(Array.from({ length: 181 }, (_, i) => { const s = 0.01 + (0.09 * i) / 180; return [x(s), y(1 / s)]; })));
  let P = $derived(1 / gap);
  let up = $derived(1 / (gap + 0.01)), down = $derived(1 / (gap - 0.01));
  // tangent: dP/dgap = -1/gap^2
  let tan = $derived([gap - 0.012, gap + 0.012].map((s) => [x(s), y(P - (s - gap) / (gap * gap))]));
</script>

<div class="controls">
  <Slider label="Gap r − g" id="gap" min={0.02} max={0.08} step={0.0025} bind:value={gap} format={(v) => pct(v, 2)} width={240} />
</div>
<svg {width} {height} role="img" aria-label="Price against the gap between discount rate and growth" class="gap-chart" viewBox="0 0 {width} {height}">
  <defs><clipPath id="gap-clip"><rect x={m.left} y={m.top} width={width - m.left - m.right} height={height - m.top - m.bottom} /></clipPath></defs>
  <AxisY scale={y} ticks={[0, 20, 40, 60, 80, 100]} x0={m.left} x1={width - m.right} format={(v) => "$" + v} title="price per $1 dividend" />
  <AxisX scale={x} ticks={[0.01, 0.02, 0.04, 0.06, 0.08, 0.1]} y={height - m.bottom} format={(v) => pct(v, 0)} title="gap between discount rate and growth" />
  <g clip-path="url(#gap-clip)">
    <path d={curve} fill="none" stroke="var(--c1)" stroke-width="2.2" />
    <line class="tangent" x1={tan[0][0]} y1={tan[0][1]} x2={tan[1][0]} y2={tan[1][1]} stroke="var(--c5)" stroke-width="1.4" stroke-dasharray="5 4" />
  </g>
  <circle class="pt-up" cx={x(gap + 0.01)} cy={y(up)} r="4.5" fill="var(--c2)" />
  <circle class="pt-down" cx={x(gap - 0.01)} cy={y(Math.min(100, down))} r="4.5" fill="var(--c3)" />
  <circle class="pt-now" cx={x(gap)} cy={y(P)} r="5.5" fill="white" stroke="var(--c1)" stroke-width="2" />
</svg>
<div class="readouts">
  <Readout id="gc-price" label="Price" value={"$" + P.toFixed(2)} />
  <Readout id="gc-up" label="If r rises a point" value={signedPct(up / P - 1, 1)} color="var(--c2)" />
  <Readout id="gc-down" label="If r falls a point" value={signedPct(down / P - 1, 1)} color="var(--c3)" />
  <Readout id="gc-tan" label="Duration's straight-line guess" value={"∓" + pct(0.01 / gap, 1)} color="var(--c5)" />
</div>
