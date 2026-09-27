<script>
  /*
    Losses counted lambda times, gains once, measured from the wealth we
    walked in with. Per bet, the value of the bets judged one at a time
    against the value of a hundred judged as one package.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { kinkedValue, oneAtATime, N_MAX } from "../bets.js";
  import { pathOf } from "../chart.js";
  import { thousands } from "../format.js";

  let { width, lambda = $bindable(2.25) } = $props();

  const height = 240;
  const m = { top: 14, right: 16, bottom: 46, left: 60 };
  const L0 = 1, L1 = 4;
  let x = $derived(linear([L0, L1], [m.left, width - m.right]));
  const y = linear([-100, 100], [height - m.bottom, m.top]);
  const ls = Array.from({ length: 61 }, (_, i) => L0 + (i * (L1 - L0)) / 60);
  const pkg = ls.map((l) => kinkedValue(N_MAX, l) / N_MAX);
  let oneD = $derived(pathOf(ls.map((l) => [x(l), y(kinkedValue(1, l))])));
  let pkgD = $derived(pathOf(ls.map((l, i) => [x(l), y(pkg[i])])));
  const money = (v) => (Math.round(v) < 0 ? "−" : "") + "$" + thousands(Math.abs(v));
  const lamText = (v) => `${v.toFixed(2)}×`;
  const money2 = (v) => { const r = Math.round(v * 100) / 100; return (r < 0 ? "−" : "") + "$" + Math.abs(r).toFixed(2); };
</script>

<div class="controls">
  <Slider label="How much more a loss hurts than a gain helps" id="kf-lambda" min={1} max={4} step={0.05} bind:value={lambda} format={lamText} width={300} />
</div>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="The bets judged one at a time or as a package" class="kink-fig">
  <AxisY scale={y} ticks={[-100, -50, 0, 50, 100]} x0={m.left} x1={width - m.right} format={money} title="worth per bet" />
  <AxisX scale={x} ticks={[1, 2, 3, 4]} y={height - m.bottom} format={(v) => `${v}×`} title="weight on losses" />
  <line x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} stroke="var(--ink)" stroke-width="1.2" />
  <path class="one-line" d={oneD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="pkg-line" d={pkgD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="lam-marker" x1={x(lambda)} x2={x(lambda)} y1={m.top} y2={height - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="one-dot" cx={x(lambda)} cy={y(kinkedValue(1, lambda))} r="4.5" fill="var(--c2)" />
  <circle class="pkg-dot" cx={x(lambda)} cy={y(kinkedValue(N_MAX, lambda) / N_MAX)} r="4.5" fill="var(--c1)" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>judged one bet at a time</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>a hundred judged as one package</span>
</p>
<div class="readouts">
  <Readout id="kf-r-one" label="One bet" value={money2(kinkedValue(1, lambda))} color="var(--c2)" />
  <Readout id="kf-r-seq" label="A hundred, one at a time" value={money(oneAtATime(N_MAX, lambda))} color="var(--c2)" />
  <Readout id="kf-r-pkg" label="A hundred, as a package" value={money(kinkedValue(N_MAX, lambda))} color="var(--c1)" />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
