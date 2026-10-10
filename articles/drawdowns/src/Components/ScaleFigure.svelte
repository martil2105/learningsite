<script>
  /*
    How the typical (median) worst drawdown grows with the length of the
    record. In years: four Sharpe ratios at 15% volatility, money lost against
    years on a log axis. In the strategy's own units: depth in σ/SR log points
    against SR²·T, where every strategy with an edge lies on one curve (the
    wide grey line) between its two ends, 1.149·√τ and ½ ln τ + 0.530.
  */
  import { linear, log } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import P from "../precomputed.js";
  import { lost, median, SIGMA, MU } from "../drawdown.js";
  import { pct } from "../format.js";

  let { width } = $props();
  let view = $state("years");
  const SR = [
    { sr: 0, color: "#5f6b7a", cls: "sr0", label: "no edge" },
    { sr: 0.25, color: "var(--c3)", cls: "sr025", label: "Sharpe 0.25" },
    { sr: 0.5, color: "var(--c1)", cls: "sr05", label: "Sharpe 0.5" },
    { sr: 1, color: "var(--c2)", cls: "sr1", label: "Sharpe 1" },
  ];
  const H = 290, m = { top: 12, right: 14, bottom: 44, left: 48 };
  let XY = $derived(log(0.25, 100, m.left, width - m.right));
  let XT = $derived(log(0.01, 1000, m.left, width - m.right));
  const YY = linear(0, 0.9, H - m.bottom, m.top);
  const YT = linear(0, 4.5, H - m.bottom, m.top);
  const C0 = 1.14897, C1 = 0.52997;
  const line = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(2)},${b.toFixed(2)}`).join("");
  let curves = $derived(
    SR.map((s) => ({
      ...s,
      d: view === "years"
        ? line(P.YEARS.map((T, i) => [XY(T), YY(lost(P.MEDIANS[s.sr][i]))]))
        : s.sr === 0
          ? ""
          : line(P.YEARS.map((T, i) => [XT(s.sr * s.sr * T), YT((P.MEDIANS[s.sr][i] * s.sr) / SIGMA)])),
    }))
  );
  let master = $derived(line(P.TAUS.map((t, i) => [XT(t), YT(P.MASTER[i])])));
  let shortEnd = $derived(line(P.TAUS.filter((t) => C0 * Math.sqrt(t) <= 4.5).map((t) => [XT(t), YT(C0 * Math.sqrt(t))])));
  let longEnd = $derived(line(P.TAUS.filter((t) => t >= 0.2).map((t) => [XT(t), YT(0.5 * Math.log(t) + C1)])));
  const at = [1, 10, 40].map((T) => lost(median(MU, SIGMA, T)));
</script>

<div class="controls">
  <Segmented id="sc-view" label="Measure in" options={[{ value: "years", label: "Years and money" }, { value: "scaled", label: "The strategy's own units" }]} bind:value={view} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The typical worst drawdown against the length of the record" class="scale-panel {view}">
  {#if view === "years"}
    <AxisY scale={YY} ticks={[0, 0.2, 0.4, 0.6, 0.8]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
    <g class="axis axis-x">
      <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
      {#each [0.25, 1, 4, 10, 25, 100] as t (t)}
        <g transform="translate({XY(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
      {/each}
      <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">years watched (log scale)</text>
    </g>
  {:else}
    <AxisY scale={YT} ticks={[0, 1, 2, 3, 4]} x0={m.left} x1={width - m.right} />
    <g class="axis axis-x">
      <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
      {#each [0.01, 0.1, 1, 10, 100, 1000] as t (t)}
        <g transform="translate({XT(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
      {/each}
      <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">years × Sharpe ratio squared (log scale)</text>
    </g>
    <path class="master" d={master} fill="none" stroke="#d4dada" stroke-width="9" stroke-linecap="round" />
    <path class="short-end" d={shortEnd} fill="none" stroke="#5f6b7a" stroke-width="1.3" stroke-dasharray="5 4" />
    <path class="long-end" d={longEnd} fill="none" stroke="#5f6b7a" stroke-width="1.3" stroke-dasharray="2 3" />
  {/if}
  {#each curves as c (c.cls)}
    {#if c.d}<path class="med {c.cls}" d={c.d} fill="none" stroke={c.color} stroke-width="2.2" />{/if}
  {/each}
</svg>
<div class="legend">
  {#each SR as s (s.cls)}{#if view === "years" || s.sr > 0}<span><i style="background:{s.color}"></i>{s.label}</span>{/if}{/each}
  {#if view === "scaled"}
    <span><i class="wide"></i>every strategy with an edge</span>
    <span><i class="dash"></i>a short record: √</span>
    <span><i class="dot"></i>a long record: log</span>
  {/if}
</div>

<div class="readouts">
  <Readout id="sc-1" label="Sharpe 0.5, typical worst in 1 year" value={pct(at[0], 1)} />
  <Readout id="sc-10" label="In 10 years" value={pct(at[1], 1)} />
  <Readout id="sc-40" label="In 40 years" value={pct(at[2], 1)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.wide { height: 8px; vertical-align: 1px; background: #d4dada; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #5f6b7a 0 5px, transparent 5px 9px); }
  .legend i.dot { background: repeating-linear-gradient(90deg, #5f6b7a 0 2px, transparent 2px 5px); }
</style>
