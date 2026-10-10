<script>
  /*
    Every day of the century, binned by its size in standard deviations, on a
    log axis of days, with the count the normal distribution expects in each
    bin. The threshold k marks the tails; bars beyond it are pink. Readouts
    count the days beyond k and say how many years apart they come, in the
    data and under the normal.
  */
  import { linear, log } from "../chart.js";
  import AxisX from "./AxisX.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { histogram, beyond, normalExpects, dataYearsApart, normalYearsApartCal, N } from "../tails.js";
  import { fixed, thousands, wide } from "../format.js";

  let { width } = $props();
  let k = $state(5);
  const B = histogram(0.5, -18, 16);
  const H = 290, m = { top: 12, right: 14, bottom: 42, left: 50 };
  let X = $derived(linear(-18, 16, m.left, width - m.right));
  const Y = log(0.5, 20000, H - m.bottom, m.top);
  const YT = [1, 10, 100, 1000, 10000];
  const ylab = (v) => (v >= 1000 ? v / 1000 + "k" : String(v));
  // the normal's expected count per bin, drawn down to the bottom of the window
  let normalPath = $derived.by(() => {
    let d = "";
    for (let i = 0; i <= 340; i++) {
      const z = -18 + i * 0.1;
      const c = (N * 0.5 * Math.exp(-0.5 * z * z)) / Math.sqrt(2 * Math.PI);
      if (c < 0.5) continue;
      d += (d ? "L" : "M") + X(z).toFixed(2) + "," + Y(c).toFixed(2);
    }
    return d;
  });
  
  let n = $derived(beyond(k));
  let normN = $derived(normalExpects(k));
</script>

<div class="controls">
  <Slider id="cl-k" label="Days beyond" min={2} max={10} step={0.5} bind:value={k} format={(v) => fixed(+v, 1) + " standard deviations"} width={320} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="US daily returns by size, with the normal distribution's expected counts" class="count-panel">
  <g class="axis axis-y">
    {#each YT as t (t)}
      <g class="grid"><line x1={m.left} x2={width - m.right} y1={Y(t)} y2={Y(t)} /></g>
      <text class="tick-label" x={m.left - 6} y={Y(t) + 4} text-anchor="end">{ylab(t)}</text>
    {/each}
  </g>
  <AxisX scale={X} ticks={[-15, -10, -5, 0, 5, 10, 15]} y={H - m.bottom} format={(v) => (v === 0 ? "0" : fixed(v, 0) + "σ")} title="size of the day, in standard deviations" />
  {#each B as b, i (i)}
    {#if b.c > 0}
      <rect class="bin" class:tail={b.b <= -k + 1e-9 || b.a >= k - 1e-9} data-c={b.c} x={X(b.a) + 0.5} width={Math.max(1, X(b.b) - X(b.a) - 1)} y={Y(b.c)} height={Y(0.5) - Y(b.c)}
        fill={b.b <= -k + 1e-9 || b.a >= k - 1e-9 ? "var(--c2)" : "var(--c1)"} fill-opacity="0.8" />
    {/if}
  {/each}
  <path class="normal" d={normalPath} fill="none" stroke="var(--ink)" stroke-width="2" />
  <line class="k-lo" x1={X(-k)} x2={X(-k)} y1={m.top} y2={H - m.bottom} stroke="var(--c2)" stroke-dasharray="4 3" />
  <line class="k-hi" x1={X(k)} x2={X(k)} y1={m.top} y2={H - m.bottom} stroke="var(--c2)" stroke-dasharray="4 3" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>days, by size</span>
  <span><i style="background:var(--c2)"></i>days beyond the threshold</span>
  <span><i style="background:var(--ink)"></i>what the normal expects</span>
</div>

<div class="readouts">
  <Readout id="cl-r-n" label="Days beyond it" value={thousands(n)} color="var(--c2)" />
  <Readout id="cl-r-norm" label="The normal expects" value={wide(normN)} />
  <Readout id="cl-r-data" label="In the data, one every" value={wide(dataYearsApart(k)) + " years"} color="var(--c2)" />
  <Readout id="cl-r-normal" label="Under the normal, one every" value={wide(normalYearsApartCal(k)) + " years"} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
