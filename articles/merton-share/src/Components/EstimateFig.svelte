<script>
  /*
    Two hundred investors, each with N years of data, each plugging their own
    average premium into the formula. The first panel is where their shares
    land; outside the shaded middle (below 0 or above twice the Merton share)
    a share is worth less than holding no stocks at all. The second panel is
    the fraction of the best gain they keep on average, 1 - 1/(N SR^2), for
    every length of record.
  */
  import { linear, log10Scale } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { pathOf } from "../chart.js";
  import { mulberry32 } from "../random.js";
  import { pluginShares, mertonShare, gain, bestGain, keptAfterEstimating, breakEvenYears, shareError } from "../merton.js";
  import { pct, fixed } from "../format.js";

  let { width, N = $bindable(100) } = $props();

  const COUNT = 200, X0 = -1.5, X1 = 3.5;
  const H1 = 190, H2 = 230;
  const m = { top: 14, right: 16, bottom: 46, left: 62 };
  const star = mertonShare();
  let shares = $derived(pluginShares(11, N, COUNT));
  const jitter = (() => { const u = mulberry32(5); return Array.from({ length: COUNT }, () => u()); })();
  let x = $derived(linear([X0, X1], [m.left, width - m.right]));
  const band = [m.top + 8, H1 - m.bottom - 8];
  let worse = $derived(shares.filter((p) => p < 0 || p > 2 * star).length);
  let kept = $derived(shares.reduce((s, p) => s + gain(p), 0) / COUNT / bestGain());

  // second panel
  let xN = $derived(log10Scale([5, 500], [m.left, width - m.right]));
  const yK = linear([-1, 1], [H2 - m.bottom, m.top]);
  const Ns = Array.from({ length: 200 }, (_, i) => 5 * Math.pow(100, i / 199));
  const Kc = (n) => Math.max(-1, keptAfterEstimating(n));
  let keptD = $derived(pathOf(Ns.filter((n) => keptAfterEstimating(n) >= -1).map((n) => [xN(n), yK(Kc(n))])));
  const be = breakEvenYears();
</script>

<div class="controls">
  <Segmented label="Years of data each" id="ef-N" bind:value={N} options={[13, 30, 100, 200].map((v) => ({ value: v, label: `${v}` }))} />
</div>

<p class="panel-title">Where two hundred investors' shares land</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Plug-in shares of two hundred investors" class="shares">
  <rect class="better-zone" x={x(0)} y={m.top} width={x(2 * star) - x(0)} height={H1 - m.bottom - m.top} fill="var(--c1-soft)" opacity="0.6" />
  <AxisX scale={x} ticks={[-1, 0, 1, 2, 3]} y={H1 - m.bottom} format={(v) => pct(v, 0)} title="share in stocks" />
  <line class="star-line" x1={x(star)} x2={x(star)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" stroke-width="1.6" />
  <g class="dots">
    {#each shares as p, i (i)}
      <circle class={p < 0 || p > 2 * star ? "dot worse" : "dot"} cx={x(p)} cy={band[0] + jitter[i] * (band[1] - band[0])} r="3"
        fill={p < 0 || p > 2 * star ? "var(--c2)" : "var(--c1)"} fill-opacity="0.75" />
    {/each}
  </g>
</svg>

<p class="panel-title">Share of the best gain kept, on average</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Share of the gain kept against years of data" class="kept">
  <AxisY scale={yK} ticks={[-1, -0.5, 0, 0.5, 1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={xN} ticks={[5, 10, 20, 50, 100, 200, 500]} y={H2 - m.bottom} title="years of data" />
  <line class="zero-line" x1={m.left} x2={width - m.right} y1={yK(0)} y2={yK(0)} stroke="var(--ink)" stroke-width="1" opacity="0.6" />
  <path class="kept-curve" d={keptD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="n-marker" x1={xN(N)} x2={xN(N)} y1={m.top} y2={H2 - m.bottom} stroke="var(--ink)" opacity="0.5" />
  <circle class="n-dot" cx={xN(N)} cy={yK(keptAfterEstimating(N))} r="5" fill="var(--c1)" />
  <circle class="be-dot" cx={xN(be)} cy={yK(0)} r="4.5" fill="white" stroke="var(--c2)" stroke-width="2" />
</svg>
<p class="legend">
  <span class="key"><span class="dotkey" style="background:var(--c1)"></span>better than no stocks</span>
  <span class="key"><span class="dotkey" style="background:var(--c2)"></span>worse than no stocks</span>
  <span class="key"><span class="swatch" style="background:var(--ink)"></span>the true Merton share</span>
</p>
<div class="readouts">
  <Readout id="ef-r-se" label="Spread of their shares" value={`±${pct(shareError(N), 0)}`} />
  <Readout id="ef-r-worse" label="Worse than no stocks" value={`${worse} of ${COUNT}`} color="var(--c2)" />
  <Readout id="ef-r-kept" label="These investors keep" value={`${fixed(100 * kept, 0)}%`} />
  <Readout id="ef-r-theory" label="Kept on average" value={`${fixed(100 * keptAfterEstimating(N), 0)}%`} color="var(--c1)" />
</div>

<style>
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .dotkey { display: inline-block; width: 9px; height: 9px; border-radius: 50%; }
</style>
