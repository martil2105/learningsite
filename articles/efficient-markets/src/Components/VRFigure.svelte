<script>
  /*
    The variance ratio of US daily returns for one period, against the number
    of days q in each return. A random walk sits on the dashed line at 1, and
    the grey band is two of its standard errors (independent days with
    constant variance) either side of it.
  */
  import { linear } from "../chart.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { vrCurve, zScores } from "../history.js";
  import { fixed } from "../format.js";
  import { bandOf } from "../chart.js";

  let { width } = $props();
  const PERIODS = { "1927": [1927, 1961], "1962": [1962, 1986], "1987": [1987, 1999], "2000": [2000, 2026] };
  let period = $state("1962");
  let ab = $derived(PERIODS[period]);
  let C = $derived(vrCurve(ab[0], ab[1]));
  let Z = $derived(zScores(21, ab[0], ab[1]));
  const H = 270, m = { top: 14, right: 16, bottom: 44, left: 44 };
  let X = $derived(linear(1, 21, m.left, width - m.right));
  const Y = linear(0.6, 2.0, H - m.bottom, m.top);
  let band = $derived(bandOf(C.map((c) => X(c.q)), C.map((c) => Y(1 - 2 * c.se)), C.map((c) => Y(1 + 2 * c.se))));
  let line = $derived(C.map((c, i) => (i ? "L" : "M") + X(c.q).toFixed(2) + "," + Y(c.vr).toFixed(2)).join(""));
</script>

<div class="controls">
  <Segmented id="vf-period" label="Period" options={[{ value: "1927", label: "1927–61" }, { value: "1962", label: "1962–86" }, { value: "1987", label: "1987–99" }, { value: "2000", label: "2000–26" }]} bind:value={period} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Variance ratio against the number of days in each return" class="vr-panel">
  <AxisY scale={Y} ticks={[0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2]} x0={m.left} x1={width - m.right} format={(v) => fixed(v, 1)} />
  <AxisX scale={X} ticks={[1, 5, 10, 15, 21]} y={H - m.bottom} title="days in each return, q" />
  <path class="band" d={band} fill="#8a94a2" fill-opacity="0.22" />
  <line class="walk" x1={m.left} x2={width - m.right} y1={Y(1)} y2={Y(1)} stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" />
  <path class="vr" d={line} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  {#each C as c (c.q)}
    <circle class="vr-dot" cx={X(c.q)} cy={Y(c.vr)} r="3" fill="var(--c1)" />
  {/each}
</svg>

<div class="readouts">
  <Readout id="vf-r-2" label="VR(2)" value={fixed(C[1].vr, 2)} color="var(--c1)" />
  <Readout id="vf-r-21" label="VR(21)" value={fixed(C[20].vr, 2)} color="var(--c1)" />
  <Readout id="vf-r-z" label="Standard errors from 1" value={fixed(Z.z, 1)} />
</div>

<style>
  svg { display: block; }
</style>
