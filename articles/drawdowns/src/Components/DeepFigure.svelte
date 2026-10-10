<script>
  /*
    How deep is too deep? The worst drawdown over a few live years for a
    strategy that still works (Sharpe 0.5) and one whose edge has gone
    (Sharpe 0), both at 15% volatility, as densities over the money lost.
    The line is a stopping rule: switch the strategy off if it falls that far.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import P from "../precomputed.js";
  import { cdf, quantile, lost, logOf, SIGMA, MU } from "../drawdown.js";
  import { pct } from "../format.js";

  let { width } = $props();
  let T = $state(5);
  let user = $state(null);
  const rule = (t) => Math.round(1000 * lost(quantile(0.95, MU, SIGMA, t))) / 1000;
  let thr = $derived(user ?? rule(T));
  const H = 250, m = { top: 12, right: 14, bottom: 44, left: 40 };
  const XMAX = 0.85;
  let X = $derived(linear(0, XMAX, m.left, width - m.right));
  // the densities come per log point; per unit of money lost they're f(d)/(1 − x)
  const n = P.DENS[5][0.5].length, dd = P.DMAX / n;
  const series = (t, sr) => P.DENS[t][sr].map((f, i) => { const d = (i + 0.5) * dd, x = lost(d); return [x, f / (1 - x)]; });
  let ws = $derived(series(T, 0.5)), ds = $derived(series(T, 0));
  let ymax = $derived(Math.max(...ws.map((p) => p[1]), ...ds.map((p) => p[1])) * 1.08);
  let Y = $derived(linear(0, ymax, H - m.bottom, m.top));
  const line = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join("");
  const tail = (pts, t) => { const p = pts.filter(([x]) => x >= t); if (!p.length) return ""; return `M${X(t).toFixed(2)},${Y(0).toFixed(2)}` + p.map(([x, y]) => `L${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join("") + `L${X(p[p.length - 1][0]).toFixed(2)},${Y(0).toFixed(2)}Z`; };
  let pw = $derived(1 - cdf(logOf(thr), MU, SIGMA, T));
  let pd = $derived(1 - cdf(logOf(thr), 0, SIGMA, T));
</script>

<div class="controls">
  <Segmented id="df-t" label="Years of live trading" options={[2, 5, 10].map((v) => ({ value: v, label: String(v) }))} bind:value={() => T, (v) => { T = v; user = null; }} />
  <Slider id="df-thr" label="Switch it off after a fall of" min={0.1} max={0.8} step={0.001} bind:value={() => thr, (v) => (user = +v)} format={(v) => pct(v, 1)} width={280} />
  <button type="button" class="again" id="df-rule" onclick={() => (user = null)}>A working strategy goes past 1 time in 20</button>
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The worst drawdown of a working and a dead strategy" class="deep-panel">
  <AxisY scale={Y} ticks={[]} x0={m.left} x1={width - m.right} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 0.2, 0.4, 0.6, 0.8] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">worst fall below a peak</text>
  </g>
  <path class="tail working" d={tail(ws, thr)} fill="var(--c1)" fill-opacity="0.25" />
  <path class="tail dead" d={tail(ds, thr)} fill="var(--c2)" fill-opacity="0.2" />
  <path class="dens working" d={line(ws)} fill="none" stroke="var(--c1)" stroke-width="2.2" />
  <path class="dens dead" d={line(ds)} fill="none" stroke="var(--c2)" stroke-width="2.2" />
  <line class="thr" x1={X(thr)} x2={X(thr)} y1={m.top} y2={H - m.bottom} stroke="var(--ink)" stroke-width="1.6" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>still works, Sharpe 0.5</span>
  <span><i style="background:var(--c2)"></i>edge gone, Sharpe 0</span>
</div>

<div class="readouts">
  <Readout id="df-working" label="A working strategy goes past it" value={pct(pw, 1)} />
  <Readout id="df-dead" label="A dead one goes past it" value={pct(pd, 1)} />
</div>

<style>
  svg { display: block; }
  .again { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; align-self: flex-end; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
