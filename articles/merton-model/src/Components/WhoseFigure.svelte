<script>
  /*
    The market's (risk-neutral) chance of default against the real one. For a
    real chance P on the x axis (log), the market's chance is
    Phi(PhiInv(P) + lam * sqrt(T)), and the y axis (log) shows how many times
    P that is: blue for a loan due in a year, pink for ten years. Dots mark our
    firm and the safer one, both with debt due in a year.
  */
  import { log } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { solve, pdP, Phi, PhiInv, R, SAFE } from "../merton.js";
  import { pct } from "../format.js";

  let { width } = $props();
  let lam = $state(0.2);
  const ours = solve(), safe = solve(SAFE.E, SAFE.sE, SAFE.F);
  const H = 290, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(log(0.0001, 0.3, m.left, width - m.right));
  const Y = log(1, 100, H - m.bottom, m.top);
  const PS = Array.from({ length: 121 }, (_, i) => Math.pow(10, -4 + (i * Math.log10(3000)) / 120));
  const Z = PS.map(PhiInv);
  const curve = (l, t) => PS.map((p, i) => [X(p), Y(Phi(Z[i] + l * Math.sqrt(t)) / p)]);
  let one = $derived(bandPath(curve(lam, 1), m.top, H - m.bottom));
  let ten = $derived(bandPath(curve(lam, 10), m.top, H - m.bottom));
  let pOurs = $derived(pdP(ours.V, ours.s, R + lam * ours.s));
  let pSafe = $derived(pdP(safe.V, safe.s, R + lam * safe.s, SAFE.F));
</script>

<div class="controls">
  <Slider id="wf-lam" label="The firm's Sharpe ratio" min={0} max={0.5} step={0.01} bind:value={lam} format={(v) => v.toFixed(2)} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="How many times the real chance of default the market's chance is" class="whose-panel">
  <AxisY scale={Y} ticks={[1, 2, 5, 10, 20, 50, 100]} x0={m.left} x1={width - m.right} format={(t) => t + "×"} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0.0001, 0.001, 0.01, 0.1] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, t < 0.001 ? 2 : t < 0.01 ? 1 : 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">the real chance of default (log scale)</text>
  </g>
  <path class="ten-year" d={ten} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="one-year" d={one} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <circle class="dot-ours" cx={X(pOurs)} cy={Y(ours.pdQ / pOurs)} r="5.5" fill="var(--ink)" stroke="white" stroke-width="1.2" />
  <circle class="dot-safe" cx={X(pSafe)} cy={Y(safe.pdQ / pSafe)} r="5.5" fill="white" stroke="var(--ink)" stroke-width="2" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>a loan due in a year</span>
  <span><i style="background:var(--c2)"></i>a loan due in ten years</span>
  <span><i class="dot"></i>our firm</span>
  <span><i class="ring"></i>the safer firm</span>
</div>

<div class="readouts">
  <Readout id="wf-q" label="Our firm, the market's chance" value={pct(ours.pdQ, 2)} />
  <Readout id="wf-p" label="The real chance" value={pct(pOurs, 2)} />
  <Readout id="wf-r" label="Times as likely, to the market" value={(ours.pdQ / pOurs).toFixed(2) + "×"} />
  <Readout id="wf-rs" label="The safer firm" value={(safe.pdQ / pSafe).toFixed(2) + "×"} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dot, .legend i.ring { width: 10px; height: 10px; border-radius: 50%; vertical-align: -1px; }
  .legend i.dot { background: var(--ink); }
  .legend i.ring { background: white; border: 2px solid var(--ink); }
</style>
