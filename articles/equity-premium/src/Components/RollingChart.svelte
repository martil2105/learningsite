<script>
  /*
    The average premium over a trailing window, plotted at the window's last
    year, with its 95% band. The dashed line is the average over every year.
    A slider picks one window and the readouts give its numbers.
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { rolling, extremes, band, FIRST_YEAR, LAST_YEAR, Z95 } from "../premium.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let win = $state(30);
  let end = $state(LAST_YEAR);
  let R = $derived(rolling(win));
  let E = $derived(extremes(win));
  let endUsed = $derived(Math.max(end, FIRST_YEAR + win - 1));
  let pick = $derived(R.find((r) => r.end === endUsed));
  const ALL = band();

  const H = 260, m = { top: 14, right: 14, bottom: 32, left: 44 };
  let X = $derived(linear([FIRST_YEAR + 19, LAST_YEAR], [m.left, width - m.right]));
  const Y = linear([-10, 30], [H - m.bottom, m.top]);
  const cl = (v) => Math.max(-10, Math.min(30, v));
  let line = $derived(path(R.map((r) => [X(r.end), Y(r.mean)])));
  let area = $derived(
    path(R.map((r) => [X(r.end), Y(cl(r.mean + Z95 * r.se))])) + "L" + R.slice().reverse().map((r) => X(r.end).toFixed(2) + "," + Y(cl(r.mean - Z95 * r.se)).toFixed(2)).join("L") + "Z"
  );
  const pctStr = (v) => fixed(v, 1) + "%";
  const span = (r) => r.start + " to " + r.end;
</script>

<div class="controls">
  <Segmented id="rc-window" label="Window" options={[{ value: 20, label: "20 years" }, { value: 30, label: "30 years" }, { value: 50, label: "50 years" }]} bind:value={win} />
  <Slider id="rc-end" label="Window ending in" min={FIRST_YEAR + 19} max={LAST_YEAR} bind:value={end} format={() => String(endUsed)} width={240} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Average premium over a trailing window, with its 95% band" class="rolling-panel">
  <AxisY scale={Y} ticks={[-10, 0, 10, 20, 30]} x0={m.left} x1={width - m.right} format={(t) => t + "%"} />
  <path class="rband" d={area} fill="var(--c1)" fill-opacity="0.18" />
  <line class="all" x1={m.left} x2={width - m.right} y1={Y(ALL.mean)} y2={Y(ALL.mean)} stroke="var(--ink)" stroke-dasharray="5 4" stroke-opacity="0.7" />
  <path class="rmean" d={line} fill="none" stroke="var(--c1)" stroke-width="2.2" />
  <circle class="lo" cx={X(E.lo.end)} cy={Y(E.lo.mean)} r="4.5" fill="var(--c2)" />
  <circle class="hi" cx={X(E.hi.end)} cy={Y(E.hi.mean)} r="4.5" fill="var(--c3)" />
  {#if pick}
    <line class="pick" x1={X(pick.end)} x2={X(pick.end)} y1={Y(cl(pick.mean + Z95 * pick.se))} y2={Y(cl(pick.mean - Z95 * pick.se))} stroke="var(--ink)" stroke-width="2" />
    <circle class="pickdot" cx={X(pick.end)} cy={Y(pick.mean)} r="4" fill="white" stroke="var(--ink)" stroke-width="2" />
  {/if}
  <AxisX scale={X} ticks={[1950, 1970, 1990, 2010]} y={H - m.bottom} />
</svg>

<div class="readouts">
  <Readout id="rc-r-lo" label="Lowest window" value={pctStr(E.lo.mean) + ", " + span(E.lo)} color="var(--c2)" />
  <Readout id="rc-r-hi" label="Highest window" value={pctStr(E.hi.mean) + ", " + span(E.hi)} color="var(--c3)" />
  {#if pick}<Readout id="rc-r-pick" label={"Window " + span(pick)} value={pctStr(pick.mean) + " ± " + fixed(Z95 * pick.se, 1)} />{/if}
</div>

<style>
  svg { display: block; }
</style>
