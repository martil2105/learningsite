<script>
  /*
    Ten simulated years of one manager's monthly active returns, sized so her
    risk model predicts a tracking error of 4% a year. The swing in the
    IC leaves the average where it was and widens the bars, and the risk
    model can't see it. The green line is her expected monthly return and the
    dashed lines are two predicted standard deviations either side of it.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { riskRun, sdOf, kappa, expectedMonth, MANAGERS, TE, ROOT12 } from "../law.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let id = $state("B");
  let swing = $state(0);
  let R = $derived(riskRun(id, swing));
  let g = $derived(MANAGERS[id]);
  const band = (2 * TE) / ROOT12;
  let mu = $derived(expectedMonth(id));
  let outside = $derived(R.filter((r) => Math.abs(r - mu) > band).length);

  const H = 250, m = { top: 12, right: 12, bottom: 30, left: 44 }, LIM = 12;
  const Y = linear(-LIM, LIM, H - m.bottom, m.top);
  let slot = $derived((width - m.left - m.right) / 120);
  const cl = (v) => Math.max(-LIM, Math.min(LIM, v));
</script>

<div class="controls">
  <Segmented id="rl-mgr" label="Manager" options={[{ value: "A", label: "A: 0.06 on 50" }, { value: "B", label: "B: 0.02 on 1,000" }]} bind:value={id} />
  <Slider id="rl-swing" label="Month-to-month swing in the IC" min={0} max={0.1} step={0.01} bind:value={swing} format={(x) => fixed(x, 2)} width={240} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Ten years of simulated monthly active returns" class="risk-panel">
  <AxisY scale={Y} ticks={[-10, -5, 0, 5, 10]} x0={m.left} x1={width - m.right} format={(t) => t + "%"} />
  {#each R as r, i (i)}
    <rect class="bar" x={m.left + slot * i + slot * 0.12} width={Math.max(1, slot * 0.76)} y={Y(Math.max(0, cl(r)))} height={Math.abs(Y(cl(r)) - Y(0))}
      fill={r >= 0 ? "var(--c1)" : "var(--c2)"} />
  {/each}
  <line class="band-hi" x1={m.left} x2={width - m.right} y1={Y(mu + band)} y2={Y(mu + band)} stroke="var(--ink)" stroke-dasharray="5 4" />
  <line class="band-lo" x1={m.left} x2={width - m.right} y1={Y(mu - band)} y2={Y(mu - band)} stroke="var(--ink)" stroke-dasharray="5 4" />
  <line class="expected" x1={m.left} x2={width - m.right} y1={Y(mu)} y2={Y(mu)} stroke="var(--c3)" stroke-width="2" />
  <line x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
  <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 8} text-anchor="middle">Ten years of months</text>
</svg>

<div class="readouts">
  <Readout id="rl-r-model" label="Risk model's tracking error" value={fixed(TE, 1) + "%"} />
  <Readout id="rl-r-run" label="Realised in these ten years" value={fixed(sdOf(R) * ROOT12, 1) + "%"} color="var(--c1)" />
  <Readout id="rl-r-long" label="Realised in the long run" value={fixed(TE * kappa(g.ic, g.n, swing), 1) + "%"} />
  <Readout id="rl-r-out" label="Months past the dashed lines" value={String(outside)} />
</div>

<style>
  svg { display: block; }
</style>
