<script>
  import { linear, ticks } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { gordon, pvDividend, shareAfter, halfLife, modifiedDuration } from "../ddm.js";
  import { pct } from "../format.js";

  // The dividend stream and what each year is worth today. Bars are present
  // values; the faint line is the dividend itself, clipped at the top.
  let { width, r = $bindable(0.08), g = $bindable(0.05) } = $props();
  const T = 80, height = 250, cumH = 150;
  const m = { top: 16, right: 16, bottom: 46, left: 60 };
  const mc = { top: 12 };
  const mt = { bottom: 28 }; // the top panel's axis carries tick labels only
  let x = $derived(linear([0.5, T + 0.5], [m.left, width - m.right]));
  const yMax = 1.6;
  const y = linear([0, yMax], [height - mt.bottom, m.top]);
  const yc = linear([0, 1], [cumH - m.bottom, mc.top]);
  let gg = $derived(Math.min(g, r - 0.005));
  let P = $derived(gordon(1, r, gg));
  let bars = $derived(Array.from({ length: T }, (_, i) => ({ t: i + 1, pv: pvDividend(1, r, gg, i + 1), div: Math.pow(1 + gg, i) })));
  let cum = $derived.by(() => { let c = 0; return bars.map((b) => { c += b.pv; return [x(b.t + 0.5), yc(c / P)]; }); });
  let half = $derived(halfLife(r, gg));
  let xt = $derived([1, 10, 20, 30, 40, 50, 60, 70, 80].filter((t) => width > 500 || t % 20 === 0 || t === 1));
  let bw = $derived(Math.max(1, (x(2) - x(1)) * 0.8));
  let divLine = $derived("M" + bars.map((b) => `${x(b.t).toFixed(1)},${y(Math.min(b.div, yMax * 1.02)).toFixed(1)}`).join("L"));
  $effect(() => { if (g > r - 0.005) g = +(r - 0.005).toFixed(3); });
</script>

<div class="controls">
  <Slider label="Discount rate r" id="s-r" min={0.04} max={0.14} step={0.005} bind:value={r} format={(v) => pct(v, 1)} width={220} />
  <Slider label="Dividend growth g" id="s-g" min={0} max={0.1} step={0.005} bind:value={g} format={(v) => pct(v, 1)} width={220} />
</div>
<svg {width} {height} role="img" aria-label="Present value of each year's dividend" class="stream-chart" viewBox="0 0 {width} {height}">
  <defs><clipPath id="plot-clip"><rect x={m.left} y={m.top} width={width - m.left - m.right} height={height - m.top - mt.bottom} /></clipPath></defs>
  <AxisY scale={y} ticks={ticks(0, yMax, 4)} x0={m.left} x1={width - m.right} format={(v) => "$" + v.toFixed(1)} title="value today" />
  <AxisX scale={x} ticks={xt} y={height - mt.bottom} />
  <g clip-path="url(#plot-clip)">
    {#each bars as b (b.t)}
      <rect class="pv-bar" x={x(b.t) - bw / 2} y={y(b.pv)} width={bw} height={y(0) - y(b.pv)} fill={b.t <= half ? "var(--c1)" : "var(--c1-soft)"} />
    {/each}
    <path d={divLine} fill="none" stroke="var(--c2)" stroke-width="1.5" stroke-dasharray="4 3" />
  </g>
  <line class="half-line" x1={x(half + 0.5)} x2={x(half + 0.5)} y1={m.top} y2={height - mt.bottom} stroke="var(--c4)" stroke-dasharray="3 3" />
  <text x={Math.min(x(half + 0.5) + 5, width - m.right - 150)} y={m.top + 12} font-size="11" fill="var(--c4)">half the value by year {half.toFixed(1)}</text>
</svg>
<!-- The running total has its own panel and its own axis: never a dual axis. -->
<svg {width} height={cumH} role="img" aria-label="Running total as a share of the price" class="cum-chart" viewBox="0 0 {width} {cumH}">
  <AxisY scale={yc} ticks={[0, 0.5, 1]} x0={m.left} x1={width - m.right} format={(v) => v * 100 + "%"} title="share of price" />
  <AxisX scale={x} ticks={xt} y={cumH - m.bottom} title="year the dividend is paid" />
  <line x1={x(half + 0.5)} x2={x(half + 0.5)} y1={mc.top} y2={cumH - m.bottom} stroke="var(--c4)" stroke-dasharray="3 3" />
  <path class="cum-line" d={"M" + cum.map(([a, b]) => a.toFixed(1) + "," + b.toFixed(1)).join("L")} fill="none" stroke="var(--c4)" stroke-width="2" />
</svg>
<div class="readouts">
  <Readout id="st-price" label="Price, per $1 of next year's dividend" value={"$" + P.toFixed(2)} />
  <Readout id="st-yield" label="Dividend yield" value={pct(1 / P, 2)} />
  <Readout id="st-half" label="Half the value arrives after year" value={half.toFixed(1)} color="var(--c4)" />
  <Readout id="st-after10" label="Value from after year 10" value={pct(shareAfter(r, gg, 10), 1)} />
  <Readout id="st-dur" label="Duration (years)" value={modifiedDuration(r, gg).toFixed(1)} />
</div>
