<script>
  /*
    What the spread costs in certain return, against risk aversion: nothing for
    a saver who would not borrow anyway, a little in the pinned band, and the
    most for the saver who borrows the most.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Readout from "./Readout.svelte";
  import Slider from "./Slider.svelte";
  import { clippedPath } from "../clip.js";
  import { givenCurve, given, sharpe, kept, bandLo, bandHi } from "../kink.js";
  import { pct, fixed } from "../format.js";

  let { width, sp = $bindable(2), g = $bindable(1) } = $props();

  const H = 240, TOP = 4;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const GLO = 0.5, GHI = 4;
  let x = $derived(linear([GLO, GHI], [m.left, width - m.right]));
  const y = linear([0, TOP], [H - m.bottom, m.top]);
  let s = $derived(sp / 100);
  let curve = $derived(clippedPath(givenCurve(s).map(([gg, v]) => [gg, 100 * v]), x, y, 0, TOP));
  let lo = $derived(Math.max(GLO, bandLo(s)));
  let hi = $derived(bandHi());
  let here = $derived(100 * given(g, s));
</script>

<div class="controls">
  <Slider label="Spread over the safe rate, in points" id="cs-s" min={0} max={5} step={0.25} bind:value={sp} format={(v) => `${+(+v).toFixed(2)}`} width={220} />
  <Slider label="Risk aversion" id="cs-g" min={0.5} max={4} step={0.05} bind:value={g} format={(v) => fixed(+v, 2)} width={220} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Certain return given up because of the spread, against risk aversion" class="cost-panel">
  {#if hi > lo}
    <rect class="band" x={x(lo)} y={m.top} width={Math.max(0, x(hi) - x(lo))} height={H - m.bottom - m.top} fill="var(--c2-soft)" opacity="0.6" />
  {/if}
  <AxisY scale={y} ticks={[0, 1, 2, 3, 4]} x0={m.left} x1={width - m.right} format={(v) => fixed(v, 0)} title="points a year" />
  <AxisX scale={x} ticks={[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]} y={H - m.bottom} title="risk aversion" />
  <path class="given" d={curve} fill="none" stroke="var(--c2)" stroke-width="2.8" />
  <line class="g-marker" x1={x(g)} x2={x(g)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" stroke-opacity="0.5" />
  <circle class="dot" cx={x(g)} cy={y(Math.min(here, TOP))} r="5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
</svg>

<div class="readouts">
  <Readout id="cs-r-given" label="Return given up, points a year" value={fixed(here, 2)} color="var(--c2)" />
  <Readout id="cs-r-sharpe" label="Sharpe ratio of stocks, to a borrower" value={fixed(sharpe(s), 2)} />
  <Readout id="cs-r-kept" label="Reward for risk kept, if she borrows either way" value={pct(kept(s), 0)} />
</div>
