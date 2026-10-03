<script>
  /*
    Ten deciles sorted on estimated beta, average excess return up. The x axis
    is either the beta each decile was sorted on or the beta it then had. The
    dashed line is the CAPM's (through zero, rising by the market premium per
    unit of beta); the blue line is the best straight line through the dots.
    mode="world": a world where the CAPM holds, with the noise in the betas on
    a slider. mode="us": Kenneth French's US deciles, 1963 to 2026.
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { world, usDeciles, usPremium, lineThrough, NOISE_US } from "../capm.js";
  import { fixed } from "../format.js";

  let { width, mode = "world", id = "sl" } = $props();
  let axis = $state("sorted");
  let noise = $state(Math.round(NOISE_US * 100) / 100);
  const US = usDeciles();
  const PREM = usPremium();
  let pts = $derived(mode === "world" ? world({ e: noise }).deciles : US);
  let xs = $derived(pts.map((d) => d[axis]));
  let ys = $derived(pts.map((d) => d.mean));
  let fit = $derived(lineThrough(xs, ys));
  let spread = $derived(pts[9][axis] - pts[0][axis]);

  const H = 290, XL = -0.8, XH = 2.8, YL = -5, YH = 20;
  const m = { top: 26, right: 16, bottom: 46, left: 44 };
  let X = $derived(linear([XL, XH], [m.left, width - m.right]));
  const Y = linear([YL, YH], [H - m.bottom, m.top]);
  // a straight line cut to the window
  const lineIn = (a, b) => {
    let x0 = XL, x1 = XH;
    if (b > 1e-12) { x0 = Math.max(x0, (YL - a) / b); x1 = Math.min(x1, (YH - a) / b); }
    else if (b < -1e-12) { x0 = Math.max(x0, (YH - a) / b); x1 = Math.min(x1, (YL - a) / b); }
    return path([[X(x0), Y(a + b * x0)], [X(x1), Y(a + b * x1)]]);
  };
  let capmD = $derived(lineIn(0, PREM));
  let fitD = $derived(lineIn(fit.intercept, fit.slope));
</script>

<div class="controls">
  <Segmented label="Across" id="{id}-axis" options={[{ value: "sorted", label: "The beta we sorted on" }, { value: "had", label: "The beta it then had" }]} bind:value={axis} />
  {#if mode === "world"}
    <Slider label="Noise in each estimated beta" id="{id}-noise" min={0} max={0.8} step={0.01} bind:value={noise} format={(u) => fixed(+u, 2)} width={240} />
  {/if}
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Average excess return against beta for ten beta-sorted portfolios" class="sml-panel">
  <AxisY scale={Y} ticks={[-5, 0, 5, 10, 15, 20]} x0={m.left} x1={width - m.right} format={(t) => t + "%"} />
  <AxisX scale={X} ticks={[-0.5, 0, 0.5, 1, 1.5, 2, 2.5]} y={H - m.bottom} format={(t) => fixed(t, 1)} title={axis === "sorted" ? "Beta we sorted on" : "Beta it then had"} />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">Average excess return a year</text>
  <path class="capm" d={capmD} fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="6 4" />
  <path class="fit" d={fitD} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  {#each pts as d, i (i)}
    <circle class="dec d{i}" cx={X(d[axis])} cy={Y(d.mean)} r="5.5" fill="var(--c1)" stroke="white" stroke-width="1.5" />
  {/each}
</svg>
<p class="legend">
  <span class="key"><span class="dot"></span>a decile</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>best straight line through the deciles</span>
  <span class="key"><span class="swatch dash"></span>the CAPM's line</span>
</p>

<div class="readouts">
  <Readout id="{id}-r-slope" label="Slope of the blue line" value={fixed(fit.slope, 1) + " pts"} color="var(--c1)" />
  <Readout id="{id}-r-int" label="Where it crosses zero beta" value={fixed(fit.intercept, 1) + "%"} />
  <Readout id="{id}-r-capm" label="The CAPM's slope" value={fixed(PREM, 1) + " pts"} />
  <Readout id="{id}-r-spread" label="Lowest to highest beta" value={fixed(pts[0][axis], 2) + " to " + fixed(pts[9][axis], 2)} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); height: 2px; }
  .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: var(--c1); }
</style>
