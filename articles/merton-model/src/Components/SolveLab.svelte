<script>
  /*
    The hook. Two clues about a firm we can't see: what its shares are worth
    and how much they move. In the plane of asset volatility (x) and asset
    value (y), the first clue alone is a curve of possible firms (blue), and so
    is the second (pink). The firm is where they cross.
  */
  import { linear } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { solve, assetsFor, assetsForVol, E0, SE0 } from "../merton.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  let e = $state(E0);
  let se = $state(SE0);
  const H = 300, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(0, 0.6, m.left, width - m.right));
  const Y = linear(60, 140, H - m.bottom, m.top);
  const SV = Array.from({ length: 119 }, (_, i) => 0.005 + i * 0.005);
  let sol = $derived(solve(e, se));
  let priceCurve = $derived(bandPath(SV.map((s) => [X(s), Y(assetsFor(e, s))]), m.top, H - m.bottom));
  let volCurve = $derived(bandPath(SV.filter((s) => s >= 0.03 && s < se - 1e-9).map((s) => [X(s), Y(assetsForVol(se, s))]), m.top, H - m.bottom));
</script>

<div class="controls">
  <Slider id="sl-e" label="The shares are worth" min={10} max={50} step={0.5} bind:value={e} format={(v) => money(v, 2)} width={260} />
  <Slider id="sl-se" label="The shares move, a year" min={0.3} max={1.2} step={0.01} bind:value={se} format={(v) => pct(v, 0)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Two curves of possible firms, crossing at the one we see" class="solve-panel">
  <AxisY scale={Y} ticks={[60, 80, 100, 120, 140]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">how much the assets move, a year</text>
  </g>
  <path class="price-curve" d={priceCurve} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="vol-curve" d={volCurve} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <line class="cross-v" x1={X(sol.s)} x2={X(sol.s)} y1={Y(sol.V)} y2={H - m.bottom} stroke="#8a94a2" stroke-width="1" stroke-dasharray="3 3" />
  <circle class="cross" cx={X(sol.s)} cy={Y(sol.V)} r="6" fill="white" stroke="var(--ink)" stroke-width="2" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>firms whose shares are worth {money(e, 2)}</span>
  <span><i style="background:var(--c2)"></i>firms whose shares move {pct(se, 0)}</span>
</div>

<div class="readouts">
  <Readout id="sl-v" label="The assets are worth" value={money(sol.V, 2)} />
  <Readout id="sl-sv" label="They move, a year" value={pct(sol.s, 2)} />
  <Readout id="sl-d" label="Distance to default" value={sol.d2.toFixed(2) + " sd"} />
  <Readout id="sl-pd" label="The market's chance of default" value={pct(sol.pdQ, 2)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
