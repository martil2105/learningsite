<script>
  /*
    The rule in the lab's two worlds over the same 25 simulated years, at the
    default settings (30% of stocks idle; a 1% spread). Pink: $1 on paper,
    earning the recorded returns. Blue: $1 for real, earning the true value's
    returns (and, with the bounce, paying the spread each time it trades).
    Grey dashed: $1 simply held. Log axis; lines leaving it are cut.
  */
  import { linear, log } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisX from "./AxisX.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { staleWorld, bounceWorld, runRule, LAB_DAYS, LAB_SEED, DAYS_A_YEAR } from "../worlds.js";
  import { pct } from "../format.js";

  let { width } = $props();
  let kind = $state("stale");
  const RUNS = {
    stale: runRule(staleWorld(LAB_DAYS, 0.3, LAB_SEED.stale), "stale"),
    bounce: runRule(bounceWorld(LAB_DAYS, 0.01, LAB_SEED.bounce), "bounce"),
  };
  let R = $derived(RUNS[kind]);
  const H = 290, m = { top: 12, right: 16, bottom: 42, left: 50 };
  const LO = 0.01, HI = 1e4;
  let X = $derived(linear(0, 25, m.left, width - m.right));
  const Y = log(LO, HI, H - m.bottom, m.top);
  const step = 5; // draw every fifth day
  const pathOf = (cum) => bandPath(cum.filter((_, i) => i % step === 0 || i === cum.length - 1).map((c, j, arr) => {
    const i = Math.min(j * step, cum.length - 1);
    return [X(i / DAYS_A_YEAR), Y(Math.exp(c))];
  }), m.top, H - m.bottom);
  let paper = $derived(pathOf(R.paperPath));
  let real = $derived(pathOf(R.realPath));
  let hold = $derived(pathOf(R.holdPath));
  const YT = [0.01, 1, 100, 1e4];
  const ylab = (v) => (v < 1 ? "1¢" : v >= 1e4 ? "$10k" : "$" + v);
</script>

<div class="controls">
  <Segmented id="pf-kind" label="World" options={[{ value: "stale", label: "Stale prices: buy after a rise" }, { value: "bounce", label: "Bid–ask bounce: buy after a fall" }]} bind:value={kind} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Growth of one dollar under the rule, on paper and for real" class="profit-panel">
  <g class="axis axis-y">
    {#each YT as t (t)}
      <g class="grid"><line x1={m.left} x2={width - m.right} y1={Y(t)} y2={Y(t)} /></g>
      <text class="tick-label" x={m.left - 6} y={Y(t) + 4} text-anchor="end">{ylab(t)}</text>
    {/each}
  </g>
  <AxisX scale={X} ticks={[0, 5, 10, 15, 20, 25]} y={H - m.bottom} title="years" />
  <path class="hold" d={hold} fill="none" stroke="#8a94a2" stroke-width="2" stroke-dasharray="5 4" />
  <path class="paper" d={paper} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="real" d={real} fill="none" stroke="var(--c1)" stroke-width="2.4" />
</svg>
<div class="legend">
  <span><i style="background:var(--c2)"></i>the rule on paper</span>
  <span><i style="background:var(--c1)"></i>the rule for real</span>
  <span><i class="dash"></i>holding all the time</span>
</div>

<div class="readouts">
  <Readout id="pf-r-paper" label="On paper, a year" value={pct(R.paper, 1)} color="var(--c2)" />
  <Readout id="pf-r-real" label="For real, a year" value={pct(R.real, 1)} color="var(--c1)" />
  <Readout id="pf-r-hold" label="Holding, a year" value={pct(R.hold, 1)} />
  <Readout id="pf-r-in" label="Days in the market" value={pct(R.held, 0)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #8a94a2 0 5px, transparent 5px 9px); }
</style>
