<script>
  /*
    One month of 500 forecasts against the returns that followed, both
    standardised. The slider sets the information coefficient; the draws are
    fixed, so only the tilt changes. The line is the least-squares fit.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { scatter, hitRate } from "../law.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let ic = $state(0.02);
  const S = scatter(500, 5);
  let P = $derived(S.at(ic));
  let fit = $derived.by(() => {
    const n = P.length, mx = P.reduce((a, p) => a + p[0], 0) / n, my = P.reduce((a, p) => a + p[1], 0) / n;
    let sxy = 0, sxx = 0;
    for (const [x, y] of P) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; }
    const b = sxy / sxx;
    return { b, a: my - b * mx };
  });
  let right = $derived(P.filter(([x, y]) => x * y > 0).length / P.length);

  const H = 300, m = { top: 12, right: 14, bottom: 44, left: 44 };
  const LIM = 3.6;
  let X = $derived(linear([-LIM, LIM], [m.left, width - m.right]));
  const Y = linear([-LIM, LIM], [H - m.bottom, m.top]);
  const cl = (v) => Math.max(-LIM, Math.min(LIM, v));
  const T = [-3, -2, -1, 0, 1, 2, 3];
  const pct = (v) => fixed(100 * v, 1) + "%";
</script>

<div class="controls">
  <Slider id="ic-ic" label="Information coefficient" min={0} max={0.5} step={0.01} bind:value={ic} format={(v) => fixed(v, 2)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Five hundred forecasts against the returns that followed" class="ic-panel">
  <AxisY scale={Y} ticks={T} x0={m.left} x1={width - m.right} title="" />
  {#each P as [x, y], i (i)}
    <circle class="dot" cx={X(cl(x))} cy={Y(cl(y))} r="2.2" fill="var(--c1)" fill-opacity="0.45" />
  {/each}
  <line class="fit" x1={X(-LIM)} x2={X(LIM)} y1={Y(cl(fit.a - fit.b * LIM))} y2={Y(cl(fit.a + fit.b * LIM))} stroke="var(--c2)" stroke-width="2.5" />
  <AxisX scale={X} ticks={T} y={H - m.bottom} title="Forecast, in standard deviations" />
  <text class="axis-title" transform="translate(13,{(H - m.bottom + m.top) / 2}) rotate(-90)" text-anchor="middle">Return that followed</text>
</svg>

<div class="readouts">
  <Readout id="ic-r-hit" label="Direction right, on average" value={pct(hitRate(ic))} />
  <Readout id="ic-r-sample" label="In this month's 500" value={pct(right)} />
  <Readout id="ic-r-slope" label="Slope of the fit" value={fixed(fit.b, 2)} color="var(--c2)" />
</div>

<style>
  svg { display: block; }
</style>
