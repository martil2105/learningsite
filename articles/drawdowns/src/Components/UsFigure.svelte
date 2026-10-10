<script>
  /*
    The US stock market (total return, French's daily file) below its last
    peak, 1926 to 2026, against what a random walk with the market's own
    drift and volatility does in a century: the dashed line is the median
    century's worst drawdown and the dotted one is passed in 1 century in 100.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Readout from "./Readout.svelte";
  import { US_LOG, US_MU, US_SIGMA, US_YEARS, usDate, usEpisodes, quantile, lost } from "../drawdown.js";
  import { pct } from "../format.js";

  let { width } = $props();
  const H = 240, m = { top: 12, right: 14, bottom: 34, left: 48 };
  const fy = (d) => Math.floor(d / 1e4) + ((Math.floor(d / 100) % 100) - 1) / 12 + ((d % 100) - 1) / 365;
  let X = $derived(linear(fy(usDate(0)), fy(usDate(US_LOG.length - 1)), m.left, width - m.right));
  const Y = linear(0, 0.9, m.top, H - m.bottom);
  // the deepest point of each week, so every low is drawn
  const pts = (() => {
    const o = []; let peak = US_LOG[0];
    let best = 0, bi = 0;
    for (let i = 0; i < US_LOG.length; i++) {
      if (US_LOG[i] > peak) peak = US_LOG[i];
      const d = peak - US_LOG[i];
      if (d >= best) { best = d; bi = i; }
      if (i % 5 === 4 || i === US_LOG.length - 1) { o.push([fy(usDate(bi)), lost(best)]); best = 0; }
    }
    return o;
  })();
  let area = $derived(`M${X(pts[0][0]).toFixed(2)},${Y(0).toFixed(2)}` + pts.map(([t, v]) => `L${X(t).toFixed(2)},${Y(v).toFixed(2)}`).join("") + `L${X(pts[pts.length - 1][0]).toFixed(2)},${Y(0).toFixed(2)}Z`);
  const med = lost(quantile(0.5, US_MU, US_SIGMA, US_YEARS));
  const p99 = lost(quantile(0.99, US_MU, US_SIGMA, US_YEARS));
  const worst = usEpisodes()[0];
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const when = (d) => `${M[(Math.floor(d / 100) % 100) - 1]} ${Math.floor(d / 1e4)}`;
</script>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The US stock market below its last peak since 1926" class="us-panel">
  <AxisY scale={Y} ticks={[0, 0.2, 0.4, 0.6, 0.8]} x0={m.left} x1={width - m.right} format={(t) => (t ? "−" : "") + pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [1930, 1950, 1970, 1990, 2010] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
  </g>
  <path class="us-area" d={area} fill="var(--c1)" fill-opacity="0.35" stroke="var(--c1)" stroke-width="0.8" />
  <line class="med" x1={m.left} x2={width - m.right} y1={Y(med)} y2={Y(med)} stroke="var(--c2)" stroke-width="1.6" stroke-dasharray="6 4" />
  <line class="p99" x1={m.left} x2={width - m.right} y1={Y(p99)} y2={Y(p99)} stroke="var(--c2)" stroke-width="1.6" stroke-dasharray="2 3" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1);opacity:0.6"></i>the US market below its last peak</span>
  <span><i class="dash"></i>a random walk's typical worst in a century</span>
  <span><i class="dot"></i>passed in 1 century in 100</span>
</div>

<div class="readouts">
  <Readout id="us-worst" label="Worst fall" value={`${pct(lost(worst.depth), 1)}, ${when(usDate(worst.peak))} to ${when(usDate(worst.low))}`} />
  <Readout id="us-back" label="Back at the 1929 peak" value={when(usDate(worst.back))} />
  <Readout id="us-walk" label="A random walk's century" value={`${pct(med, 1)} typical, 1 in 100 past ${pct(p99, 1)}`} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--c2) 0 6px, transparent 6px 10px); }
  .legend i.dot { background: repeating-linear-gradient(90deg, var(--c2) 0 2px, transparent 2px 5px); }
</style>
