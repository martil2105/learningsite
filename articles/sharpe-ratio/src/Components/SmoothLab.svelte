<script>
  /*
    The hook. Fifteen seeded years of true monthly returns (blue), the same
    returns reported through smoothing (pink), and, switched on, the reported
    returns run backwards through the smoothing (ink, dashed), which lands on
    the true line. Growth of $1 on a log axis. The readouts are the long-run
    values from the closed forms, not estimates from this one path.
  */
  import { log10Scale, linear, path, logTicks } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { truePath, smooth, unsmooth, growth, smoothed, MU, SEED, YEARS } from "../smoothing.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let a = $state(0.6);
  let show = $state("off");
  const R = truePath(12 * YEARS, SEED);
  let Ro = $derived(smooth(R, a, MU));
  let U = $derived(unsmooth(Ro, a, MU));
  let o = $derived(smoothed(a));

  const H = 270;
  const m = { top: 26, right: 18, bottom: 46, left: 44 };
  let x = $derived(linear([0, 12 * YEARS], [m.left, width - m.right]));
  const y = log10Scale([0.8, 4.5], [H - m.bottom, m.top]);
  const line = (rets) => path(growth(rets).map((v, i) => [x(i), y(v)]));
  let dTrue = $derived(line(R));
  let dRep = $derived(line(Ro));
  let dUn = $derived(line(U));
</script>

<div class="controls">
  <Slider label="Smoothing, a" id="sl-a" min={0} max={0.85} step={0.05} bind:value={a} format={(u) => fixed(+u, 2)} width={260} />
  <Segmented label="Unsmoothed series" id="sl-show" options={[{ value: "off", label: "Hide" }, { value: "on", label: "Show" }]} bind:value={show} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What a dollar in the fund was worth, truly and as reported, over fifteen years" class="path-panel">
  <AxisY scale={y} ticks={[1, 2, 3, 4]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <AxisX scale={x} ticks={[0, 36, 72, 108, 144, 180]} y={H - m.bottom} format={(t) => String(t / 12)} title="Years" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">What $1 is worth</text>
  <path class="series true" d={dTrue} fill="none" stroke="var(--c1)" stroke-width="2" />
  <path class="series rep" d={dRep} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  {#if show === "on"}
    <path class="series un" d={dUn} fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="5 4" />
  {/if}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>true value</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>reported value</span>
  {#if show === "on"}<span class="key"><span class="swatch dash"></span>reported returns, unsmoothed</span>{/if}
</p>

<div class="readouts">
  <Readout id="sl-r-vt" label="True volatility" value={pct(o.sdTrue * Math.sqrt(12), 1)} color="var(--c1)" />
  <Readout id="sl-r-vr" label="Reported volatility" value={pct(o.sdRep * Math.sqrt(12), 1)} color="var(--c2)" />
  <Readout id="sl-r-naive" label="Reported Sharpe, times √12" value={fixed(o.naive, 2)} color="var(--c2)" />
  <Readout id="sl-r-lo" label="With Lo's correction" value={fixed(o.lo, 2)} />
  <Readout id="sl-r-true" label="True Sharpe ratio" value={fixed(o.truth, 2)} color="var(--c1)" />
  <Readout id="sl-r-ac" label="Reported, month to month correlation" value={fixed(a, 2)} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); height: 2px; }
</style>
