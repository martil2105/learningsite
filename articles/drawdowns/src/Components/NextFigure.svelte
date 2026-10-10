<script>
  /*
    The chance that L live years bring a deeper drawdown than the worst of B
    backtest years, each measured from its own start, against L. At L = B it
    is exactly one half, whatever the strategy: before either stretch is run,
    they're the same kind of thing.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import P from "../precomputed.js";
  import { pct } from "../format.js";

  let { width } = $props();
  let B = $state(10);
  let sr = $state(0.5);
  const COL = { 5: "var(--c3)", 10: "var(--c1)", 20: "var(--c2)" };
  const H = 270, m = { top: 12, right: 14, bottom: 44, left: 46 };
  let X = $derived(linear(0, 40, m.left, width - m.right));
  const Y = linear(0, 1, H - m.bottom, m.top);
  let curves = $derived(P.BACK.map((b) => ({ b, d: [[0, 0], ...P.LIVE.map((L, i) => [L, P.BEAT[sr][b][i]])].map(([L, q], i) => `${i ? "L" : "M"}${X(L).toFixed(2)},${Y(q).toFixed(2)}`).join("") })));
  const at = (L) => P.BEAT[sr][B][P.LIVE.findIndex((x) => Math.abs(x - L) < 1e-9)];
</script>

<div class="controls">
  <Segmented id="nf-b" label="Years of backtest" options={P.BACK.map((b) => ({ value: b, label: String(b) }))} bind:value={B} />
  <Segmented id="nf-sr" label="Sharpe ratio" options={[{ value: 0.5, label: "0.5" }, { value: 0, label: "0" }]} bind:value={sr} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The chance that live trading goes past the backtest's worst drawdown" class="next-panel">
  <AxisY scale={Y} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 5, 10, 20, 30, 40] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">years of live trading</text>
  </g>
  <line class="half" x1={m.left} x2={width - m.right} y1={Y(0.5)} y2={Y(0.5)} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="4 4" />
  <line class="same" x1={X(B)} x2={X(B)} y1={Y(0)} y2={Y(0.5)} stroke="#8a94a2" stroke-width="1.2" />
  {#each curves as c (c.b)}
    <path class="beat b{c.b}" class:dim={c.b !== B} d={c.d} fill="none" stroke={COL[c.b]} stroke-width={c.b === B ? 2.4 : 1.3} />
  {/each}
  <circle class="mid" cx={X(B)} cy={Y(at(B))} r="5.5" fill={COL[B]} stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  {#each P.BACK as b (b)}<span><i style="background:{COL[b]}"></i>{b}-year backtest</span>{/each}
</div>

<div class="readouts">
  <Readout id="nf-1" label="Gone past within 1 live year" value={pct(at(1), 1)} />
  <Readout id="nf-same" label="Within as many years as the backtest" value={pct(at(B), 1)} />
  <Readout id="nf-double" label="Within twice as many" value={pct(at(2 * B), 1)} />
</div>

<style>
  svg { display: block; }
  .beat.dim { opacity: 0.45; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
