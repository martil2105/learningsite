<script>
  /*
    The hook. Forty pairs of investors in the same market, one at the Kelly
    share and one at c times it. Top: Kelly's money divided by the rival's,
    year by year, on a log axis, so a line above 1 means Kelly is ahead.
    Bottom: the chance that Kelly is ahead after T years,
    Φ(|1 − c|·SR·√T / 2). The scrubber marks one year on both panels.
  */
  import { linear, log } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { brownian, gapAt, raceStocks, yearsFor, YEARS, PAIRS } from "../kelly.js";
  import { pct, thousands } from "../format.js";

  let { width } = $props();
  let c = $state(0.5);
  let year = $state(30);
  const B = brownian();
  const H1 = 260, H2 = 200, m = { top: 12, right: 16, bottom: 42, left: 50 };
  const LO = 0.01, HI = 100;
  let X = $derived(linear(0, YEARS, m.left, width - m.right));
  const Y1 = log(LO, HI, H1 - m.bottom, m.top);
  const Y2 = linear(0.5, 1, H2 - m.bottom, m.top);
  const ratioLabel = (v) => (v < 1 ? (v === 0.01 ? "0.01×" : "0.1×") : v + "×");
  let lines = $derived(B.map((b) => bandPath(Array.from(b, (_, t) => [X(t), Y1(Math.exp(gapAt(c, b, t)))]), m.top, H1 - m.bottom)));
  let ahead = $derived(B.filter((b) => gapAt(c, b, year) > 0).length);
  let chance = $derived(raceStocks(c, year));
  let curve = $derived(
    Array.from({ length: 151 }, (_, i) => {
      const t = (i * YEARS) / 150;
      return (i ? "L" : "M") + X(t).toFixed(2) + "," + Y2(raceStocks(c, t)).toFixed(2);
    }).join("")
  );
  let y90 = $derived(yearsFor(0.9, c));
  const OPTIONS = [
    { value: 0.25, label: "¼ Kelly" },
    { value: 0.5, label: "½ Kelly" },
    { value: 0.75, label: "¾ Kelly" },
    { value: 1.25, label: "1¼ Kelly" },
    { value: 1.5, label: "1½ Kelly" },
    { value: 2, label: "2 × Kelly" },
  ];
</script>

<div class="controls">
  <Segmented id="rl-rival" label="The rival holds" options={OPTIONS} bind:value={c} />
  <Slider id="rl-year" label="Years" min={1} max={YEARS} step={1} bind:value={year} format={(v) => String(v)} width={260} />
</div>

<p class="panel-title">Kelly's money divided by the rival's, in 40 pairs</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Kelly's money over the rival's for forty pairs of investors" class="race-paths">
  <AxisY scale={Y1} ticks={[0.01, 0.1, 1, 10, 100]} x0={m.left} x1={width - m.right} format={ratioLabel} />
  <AxisX scale={X} ticks={[0, 50, 100, 150, 200, 250, 300]} y={H1 - m.bottom} title="years" />
  <g class="paths">
    {#each lines as d, i (i)}
      <path class="pair" d={d} fill="none" stroke="#8a94a2" stroke-opacity="0.45" stroke-width="1" />
    {/each}
  </g>
  <line class="even" x1={m.left} x2={width - m.right} y1={Y1(1)} y2={Y1(1)} stroke="var(--ink)" stroke-width="1.4" />
  <line class="scrub" x1={X(year)} x2={X(year)} y1={m.top} y2={H1 - m.bottom} stroke="var(--c1)" stroke-width="1.6" />
</svg>

<p class="panel-title">The chance that Kelly is ahead</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The chance that the Kelly investor is ahead, by years" class="race-chance">
  <AxisY scale={Y2} ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={X} ticks={[0, 50, 100, 150, 200, 250, 300]} y={H2 - m.bottom} title="years" />
  <path class="chance" d={curve} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  <line class="scrub" x1={X(year)} x2={X(year)} y1={m.top} y2={H2 - m.bottom} stroke="var(--c1)" stroke-width="1.6" />
  <circle class="dot" cx={X(year)} cy={Y2(chance)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
</svg>

<div class="readouts">
  <Readout id="rl-r-chance" label={"Kelly ahead after " + year + (year === 1 ? " year" : " years")} value={pct(chance, 0)} color="var(--c1)" />
  <Readout id="rl-r-pairs" label="Of these 40 pairs" value={ahead + " ahead"} />
  <Readout id="rl-r-90" label="Years to be ahead 9 times in 10" value={thousands(y90)} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
</style>
