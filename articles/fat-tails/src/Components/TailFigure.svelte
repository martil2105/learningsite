<script>
  /*
    One tail of the daily returns on log-log axes: the share of all days that
    were at least x standard deviations down (or up), against x. The normal
    falls off a cliff; the data fall on a straight line, a power law. The
    dashed line is Hill's fit through the chosen number of largest days:
    share = (k/N)·(x/x_k)^(−α).
  */
  import { log } from "../chart.js";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { survival, hill, N } from "../tails.js";
  import { Phi } from "../stats.js";
  import { fixed, thousands } from "../format.js";

  let { width } = $props();
  let side = $state(-1);
  let k = $state(200);
  const H = 300, m = { top: 12, right: 16, bottom: 44, left: 56 };
  const XLO = 1, XHI = 20, YLO = 2e-5, YHI = 0.5;
  let X = $derived(log(XLO, XHI, m.left, width - m.right));
  const Y = log(YLO, YHI, H - m.bottom, m.top);
  const S = { "-1": survival(-1), "1": survival(1) };
  let pts = $derived(S[String(side)].filter(([x]) => x >= XLO && x <= XHI));
  // every point in the tail, every tenth in the body
  let dataPath = $derived(pts.filter((_, i) => i < 2000 || i % 10 === 0).map(([x, s], i) => (i ? "L" : "M") + X(x).toFixed(2) + "," + Y(s).toFixed(2)).join(""));
  let normPath = $derived.by(() => {
    let d = "";
    for (let i = 0; i <= 200; i++) {
      const x = XLO * Math.pow(XHI / XLO, i / 200), s = Phi(-x);
      if (s < YLO) break;
      d += (d ? "L" : "M") + X(x).toFixed(2) + "," + Y(s).toFixed(2);
    }
    return d;
  });
  let fit = $derived(hill(k, side));
  let fitPath = $derived.by(() => {
    const s0 = k / N, x0 = fit.xk;
    const x1 = Math.min(XHI, x0 * Math.pow(s0 / YLO, 1 / fit.alpha));
    return `M${X(x0).toFixed(2)},${Y(s0).toFixed(2)}L${X(x1).toFixed(2)},${Y(s0 * Math.pow(x1 / x0, -fit.alpha)).toFixed(2)}`;
  });
  const XT = [1, 2, 5, 10, 20], YT = [1e-4, 1e-3, 1e-2, 1e-1];
  const ylab = (v) => (v >= 0.01 ? fixed(100 * v, 0) + "%" : fixed(100 * v, v >= 1e-3 ? 1 : 2) + "%");
</script>

<div class="controls">
  <Segmented id="tf-side" label="Tail" options={[{ value: -1, label: "Falls" }, { value: 1, label: "Rises" }]} bind:value={side} />
  <Segmented id="tf-k" label="Fit through the largest" options={[50, 100, 200, 400, 800].map((v) => ({ value: v, label: thousands(v) + " days" }))} bind:value={k} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Share of days beyond each size, on log-log axes" class="tail-panel">
  <g class="axis axis-y">
    {#each YT as t (t)}
      <g class="grid"><line x1={m.left} x2={width - m.right} y1={Y(t)} y2={Y(t)} /></g>
      <text class="tick-label" x={m.left - 6} y={Y(t) + 4} text-anchor="end">{ylab(t)}</text>
    {/each}
  </g>
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each XT as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{t}</text>
      </g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 8} text-anchor="middle">size, in standard deviations (log scale)</text>
  </g>
  <path class="normal" d={normPath} fill="none" stroke="var(--ink)" stroke-width="2" />
  <path class="data" d={dataPath} fill="none" stroke={side < 0 ? "var(--c2)" : "var(--c1)"} stroke-width="2.4" />
  <path class="fit" d={fitPath} fill="none" stroke="var(--c3)" stroke-width="2" stroke-dasharray="6 4" />
  <circle class="anchor" cx={X(fit.xk)} cy={Y(k / N)} r="4" fill="var(--c3)" />
</svg>
<div class="legend">
  <span><i style="background:{side < 0 ? 'var(--c2)' : 'var(--c1)'}"></i>US days</span>
  <span><i style="background:var(--ink)"></i>the normal</span>
  <span><i class="dash"></i>power-law fit</span>
</div>

<div class="readouts">
  <Readout id="tf-r-alpha" label="Tail exponent" value={fixed(fit.alpha, 1)} color="var(--c3)" />
  <Readout id="tf-r-from" label="Fitted from" value={fixed(fit.xk, 1) + " sd out"} />
  <Readout id="tf-r-twice" label="Twice as big is rarer by" value={fixed(Math.pow(2, fit.alpha), 0) + " times"} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--c3) 0 6px, transparent 6px 10px); }
</style>
