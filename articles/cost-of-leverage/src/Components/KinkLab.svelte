<script>
  /*
    The hook. The share of wealth in stocks against risk aversion, for a lender
    at the safe rate (dashed) and for the saver who pays a spread on what she
    borrows (solid). The band of risk aversions held at exactly 100% is
    shaded, and the chosen risk aversion is marked.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { clippedPath } from "../clip.js";
  import { shareCurve, share, lenderShare, borrowerShare, regime, bandLo, bandHi, given } from "../kink.js";
  import { pct, fixed } from "../format.js";

  let { width, sp = $bindable(2), g = $bindable(1) } = $props();

  const H = 270;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const GLO = 0.5, GHI = 4, HI = 3.2;
  let x = $derived(linear([GLO, GHI], [m.left, width - m.right]));
  const y = linear([0, HI], [H - m.bottom, m.top]);
  let s = $derived(sp / 100);
  let lender = $derived(clippedPath(shareCurve(0), x, y, 0, HI));
  let plan = $derived(clippedPath(shareCurve(s), x, y, 0, HI));
  let lo = $derived(Math.max(GLO, bandLo(s)));
  let hi = $derived(bandHi());
  let mine = $derived(share(g, s));
  let theirs = $derived(lenderShare(g));
  let mode = $derived(regime(g, s));
  const label = { lend: "Lends", pinned: "Stays at exactly 100%", lever: "Borrows" };
</script>

<div class="controls">
  <Slider label="Spread over the safe rate, in points" id="kl-s" min={0} max={5} step={0.25} bind:value={sp} format={(v) => `${+(+v).toFixed(2)}`} width={220} />
  <Slider label="Risk aversion" id="kl-g" min={0.5} max={4} step={0.05} bind:value={g} format={(v) => fixed(+v, 2)} width={220} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Share of wealth in stocks against risk aversion, with and without a borrowing spread" class="kink-panel">
  {#if hi > lo}
    <rect class="band" x={x(lo)} y={m.top} width={Math.max(0, x(hi) - x(lo))} height={H - m.bottom - m.top} fill="var(--c2-soft)" opacity="0.6" />
  {/if}
  <AxisY scale={y} ticks={[0, 1, 2, 3]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="in stocks" />
  <AxisX scale={x} ticks={[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]} y={H - m.bottom} title="risk aversion" />
  <path class="lender" d={lender} fill="none" stroke="var(--ink)" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="6 4" />
  <path class="plan" d={plan} fill="none" stroke="var(--c1)" stroke-width="2.8" />
  <line class="g-marker" x1={x(g)} x2={x(g)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" stroke-opacity="0.5" />
  {#if theirs <= HI}<circle class="lender-dot" cx={x(g)} cy={y(theirs)} r="4.5" fill="white" stroke="var(--ink)" stroke-width="1.6" />{/if}
  <circle class="dot" cx={x(g)} cy={y(mine)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch dashed"></span>a saver who borrows at the safe rate</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>a saver who pays the spread</span>
  <span class="key"><span class="block" style="background:var(--c2-soft)"></span>held at exactly 100%</span>
</p>

<div class="readouts">
  <Readout id="kl-r-lend" label="At the safe rate" value={pct(theirs, 0)} />
  <Readout id="kl-r-borrow" label="At the borrower's rate" value={pct(borrowerShare(g, s), 0)} />
  <Readout id="kl-r-share" label="With the spread" value={pct(mine, 0)} color="var(--c1)" />
  <Readout id="kl-r-regime" label="What she does" value={label[mode]} />
  <Readout id="kl-r-band" label="Held at exactly 100%, risk aversion" value={s === 0 ? "none" : `${fixed(bandLo(s), 2)} to ${fixed(bandHi(), 2)}`} />
  <Readout id="kl-r-given" label="Return given up, points a year" value={fixed(100 * given(g, s), 2)} color="var(--c2)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .block { display: inline-block; width: 14px; height: 10px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); opacity: 0.6; }
</style>
