<script>
  /*
    Top: the kurtosis of seeded Student t samples as they grow from 100 to
    100,000 days, on log axes. With a tail exponent of 6 (blue) the fourth
    moment exists and every sample settles near 6 (dashed). With an exponent
    of 3 (pink) it doesn't, and each sample's kurtosis jumps whenever a new
    extreme day arrives. Bottom: the US market's kurtosis in windows of 10 or
    20 years, each bar split into the part its single biggest day supplies
    (pink) and the rest.
  */
  import { linear, log } from "../chart.js";
  import Segmented from "./Segmented.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import RUNS from "../precomputed.js";
  import { windows, GRID } from "../tails.js";
  import { fixed, thousands } from "../format.js";

  let { width } = $props();
  let gi = $state(GRID.length - 1);
  let L = $state(10);
  const H1 = 260, H2 = 240, m = { top: 12, right: 30, bottom: 44, left: 48 };
  let X = $derived(log(100, 100000, m.left, width - m.right));
  const Y = log(2, 500, H1 - m.bottom, m.top);
  const lineOf = (run) => run.map(([n, k], i) => (i ? "L" : "M") + X(n).toFixed(2) + "," + Y(Math.min(500, Math.max(2, k))).toFixed(2)).join("");
  let p3 = $derived(RUNS[3].map(lineOf));
  let p6 = $derived(RUNS[6].map(lineOf));
  let n = $derived(GRID[gi]);
  const at = (nu) => RUNS[nu].map((r) => r[gi][1]);
  let k3 = $derived(at(3)), k6 = $derived(at(6));
  const range = (a) => fixed(Math.min(...a), 1) + " to " + fixed(Math.max(...a), 1);

  let W = $derived(windows(L));
  let slot = $derived((width - m.left - m.right) / W.length);
  const Y2 = linear(0, 80, H2 - m.bottom, m.top);
  let top = $derived(W.reduce((a, b) => (b.kurt > a.kurt ? b : a)));
  let low = $derived(W.reduce((a, b) => (b.kurt < a.kurt ? b : a)));
  const dateOf = (d) => `${d % 100} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][Math.floor(d / 100) % 100 - 1]} ${Math.floor(d / 1e4)}`;
</script>

<div class="controls">
  <Slider id="kl-n" label="Days in the sample" min={0} max={GRID.length - 1} step={1} bind:value={gi} format={(i) => thousands(GRID[i])} width={300} />
</div>

<p class="panel-title">Kurtosis as a simulated sample grows</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Kurtosis of simulated samples against their size" class="kurt-sim">
  <g class="axis axis-y">
    {#each [3, 10, 30, 100, 300] as t (t)}
      <g class="grid"><line x1={m.left} x2={width - m.right} y1={Y(t)} y2={Y(t)} /></g>
      <text class="tick-label" x={m.left - 6} y={Y(t) + 4} text-anchor="end">{t}</text>
    {/each}
  </g>
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H1 - m.bottom} y2={H1 - m.bottom} />
    {#each [100, 1000, 10000, 100000] as t (t)}
      <g transform="translate({X(t)},{H1 - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{thousands(t)}</text>
      </g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H1 - 8} text-anchor="middle">days in the sample (log scale)</text>
  </g>
  <line class="six" x1={m.left} x2={width - m.right} y1={Y(6)} y2={Y(6)} stroke="var(--c1)" stroke-dasharray="5 4" stroke-width="1.4" />
  {#each p6 as d, i (i)}<path class="t6" d={d} fill="none" stroke="var(--c1)" stroke-width="1.6" stroke-opacity="0.85" />{/each}
  {#each p3 as d, i (i)}<path class="t3" d={d} fill="none" stroke="var(--c2)" stroke-width="1.6" stroke-opacity="0.85" />{/each}
  <line class="scrub" x1={X(n)} x2={X(n)} y1={m.top} y2={H1 - m.bottom} stroke="var(--ink)" stroke-opacity="0.5" />
</svg>
<div class="legend">
  <span><i style="background:var(--c2)"></i>tail exponent 3, four samples</span>
  <span><i style="background:var(--c1)"></i>tail exponent 6, four samples</span>
</div>
<div class="readouts">
  <Readout id="kl-r-3" label="Exponent 3 at this size" value={range(k3)} color="var(--c2)" />
  <Readout id="kl-r-6" label="Exponent 6 at this size" value={range(k6)} color="var(--c1)" />
</div>

<div class="controls second">
  <Segmented id="kl-L" label="US windows of" options={[{ value: 10, label: "10 years" }, { value: 20, label: "20 years" }]} bind:value={L} />
</div>
<p class="panel-title">The US market's kurtosis, window by window</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Kurtosis of US daily returns by window, with the biggest day's part" class="kurt-us">
  <g class="axis axis-y">
    {#each [0, 20, 40, 60, 80] as t (t)}
      <g class="grid"><line x1={m.left} x2={width - m.right} y1={Y2(t)} y2={Y2(t)} /></g>
      <text class="tick-label" x={m.left - 6} y={Y2(t) + 4} text-anchor="end">{t}</text>
    {/each}
  </g>
  {#each W as w, i (w.a)}
    {@const x0 = m.left + slot * i + slot * 0.15}
    {@const bw = Math.max(1, slot * 0.7)}
    <rect class="rest" data-i={i} x={x0} width={bw} y={Y2(w.kurt * (1 - w.share))} height={Y2(0) - Y2(w.kurt * (1 - w.share))} fill="var(--c1)" fill-opacity="0.75" />
    <rect class="biggest" data-i={i} x={x0} width={bw} y={Y2(w.kurt)} height={Y2(w.kurt * (1 - w.share)) - Y2(w.kurt)} fill="var(--c2)" />
  {/each}
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H2 - m.bottom} y2={H2 - m.bottom} />
    {#each W as w, i (w.a)}
      {#if width >= 560 || L === 20 || i % 2 === 0}
        <g transform="translate({m.left + slot * i + slot / 2},{H2 - m.bottom})">
          <line y2="5" />
          <text class="tick-label" y="18" text-anchor="middle">{w.a}</text>
        </g>
      {/if}
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H2 - 8} text-anchor="middle">first year of the window</text>
  </g>
</svg>
<div class="legend">
  <span><i style="background:var(--c2)"></i>the window's biggest day</span>
  <span><i style="background:var(--c1);opacity:0.75"></i>every other day</span>
</div>
<div class="readouts">
  <Readout id="kl-r-top" label="Highest" value={`${top.a}–${top.b}: ${fixed(top.kurt, 1)}`} color="var(--c2)" />
  <Readout id="kl-r-share" label="From its biggest day" value={fixed(100 * top.share, 0) + "%, " + dateOf(top.day)} />
  <Readout id="kl-r-low" label="Lowest" value={`${low.a}–${low.b}: ${fixed(low.kurt, 1)}`} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .controls.second { margin-top: 1.4rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
