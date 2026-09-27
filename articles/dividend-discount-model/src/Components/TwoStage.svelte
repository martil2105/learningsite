<script>
  import { linear, ticks } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { twoStage, pvDividend } from "../ddm.js";
  import { pct } from "../format.js";

  // A company that grows fast for N years and then settles at g2 for ever.
  // Colour splits the present values into the years we forecast one by one and
  // the "terminal value" that covers everything after.
  let { width } = $props();
  const r = 0.08, g2 = 0.04;
  let g1 = $state(0.12);
  let N = $state(10);
  const T = 60, height = 260;
  const m = { top: 16, right: 16, bottom: 46, left: 56 };
  let x = $derived(linear([0.5, T + 0.5], [m.left, width - m.right]));
  let res = $derived(twoStage(1, r, g1, N, g2));
  let bars = $derived(Array.from({ length: T }, (_, i) => {
    const t = i + 1;
    const div = t <= N ? Math.pow(1 + g1, t - 1) : Math.pow(1 + g1, N - 1) * Math.pow(1 + g2, t - N);
    return { t, pv: div / Math.pow(1 + r, t), terminal: t > N };
  }));
  let yMax = $derived(Math.max(1.2, ...bars.map((b) => b.pv)) * 1.08);
  let y = $derived(linear([0, yMax], [height - m.bottom, m.top]));
  let bw = $derived(Math.max(1, (x(2) - x(1)) * 0.8));
  let splitW = $derived(width - m.left - m.right);
</script>

<div class="controls">
  <Slider label="Early growth" id="ts-g1" min={0} max={0.25} step={0.01} bind:value={g1} format={(v) => pct(v, 0)} width={200} />
  <Slider label="Years of early growth" id="ts-n" min={1} max={20} step={1} bind:value={N} width={200} />
</div>
<svg {width} {height} role="img" aria-label="Two-stage dividend stream" class="twostage-chart" viewBox="0 0 {width} {height}">
  <AxisY scale={y} ticks={ticks(0, yMax, 4)} x0={m.left} x1={width - m.right} format={(v) => "$" + v.toFixed(1)} title="value today" />
  <AxisX scale={x} ticks={[1, 10, 20, 30, 40, 50, 60].filter((t) => width > 500 || t % 20 === 0 || t === 1)} y={height - m.bottom} title="year" />
  {#each bars as b (b.t)}
    <rect class={b.terminal ? "tv-bar" : "ex-bar"} x={x(b.t) - bw / 2} y={y(b.pv)} width={bw} height={y(0) - y(b.pv)} fill={b.terminal ? "var(--c2)" : "var(--c1)"} opacity={b.terminal ? 0.55 : 1} />
  {/each}
</svg>
<svg width={width} height="44" class="split-bar" role="img" aria-label="Split of the price" viewBox="0 0 {width} 44">
  <rect x={m.left} y="6" width={splitW * (1 - res.terminalShare)} height="18" fill="var(--c1)" />
  <rect class="tv-share" x={m.left + splitW * (1 - res.terminalShare)} y="6" width={splitW * res.terminalShare} height="18" fill="var(--c2)" opacity="0.55" />
  <text x={m.left} y="38" font-size="11" fill="var(--c1)">forecast years {pct(1 - res.terminalShare, 0)}</text>
  <text x={width - m.right} y="38" font-size="11" fill="var(--c2)" text-anchor="end">everything after {pct(res.terminalShare, 0)}</text>
</svg>
<div class="readouts">
  <Readout id="ts-price" label="Price, per $1 of next year's dividend" value={"$" + res.price.toFixed(2)} />
  <Readout id="ts-share" label="Share from after the forecast years" value={pct(res.terminalShare, 1)} color="var(--c2)" />
</div>
