<script>
  /*
    What each of our six features looks like in one month, as recorded and
    after log(1 + x). The raw view stops at the 99.5th percentile and says how
    many customers are further out, because the house sales would otherwise
    squash every other bar into the first bin.
  */
  import P from "../precomputed.js";
  import { FEATURE_LABELS } from "../bank.js";
  import { linear, ticks, shortN, clampW } from "../chart.js";

  let fi = $state(0);
  let view = $state("raw");
  let F = $derived(P.I2.feats[fi]);
  let hist = $derived(F[view]);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 200, M = { top: 10, right: 12, bottom: 36, left: 46 };
  let x = $derived(linear(hist.lo, hist.hi, M.left, W - M.right));
  let ymax = $derived(Math.max(...hist.h));
  let y = $derived(linear(0, ymax * 1.05, H - M.bottom, M.top));
  let bw = $derived((W - M.left - M.right) / hist.h.length);
  let xt = $derived(ticks(hist.lo, hist.hi, 4));
  let yt = $derived(ticks(0, ymax, 3));
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  let facts = $derived(
    `zeros ${pct(F.zeros)} · distinct values ${F.distinct.toLocaleString("en-GB")} · median ${F.median.toLocaleString("en-GB")} · 99th percentile ${F.p99.toLocaleString("en-GB")} · max ${F.max.toLocaleString("en-GB")} · skew ${view === "raw" ? F.skew : F.logSkew}`
  );
  let overNote = $derived(view === "raw" && hist.over > 0 ? `${hist.over} customers are beyond the right edge of this chart` : "");
</script>

<div class="fig feature-shape" id="feature-shape">
  <p class="fig-title">How each feature is distributed in our month</p>
  <div class="pills">
    <span class="ctl-label">feature</span>
    {#each P.I2.feats as f, i}
      <button class="pill feat" class:active={fi === i} onclick={() => (fi = i)}>{FEATURE_LABELS[f.name]}</button>
    {/each}
  </div>
  <div class="pills">
    <span class="ctl-label">scale</span>
    <button class="pill view" class:active={view === "raw"} onclick={() => (view = "raw")}>as recorded</button>
    <button class="pill view" class:active={view === "log"} onclick={() => (view = "log")}>log(1 + x)</button>
  </div>
  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogram of the chosen feature">
      {#each yt as t}
        <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={M.left - 6} y={y(t) + 3.5} text-anchor="end">{shortN(t)}</text>
      {/each}
      {#each hist.h as h, i}
        <rect class="hbar" x={M.left + i * bw + 0.5} y={y(h)} width={Math.max(0.5, bw - 1)} height={y(0) - y(h)} />
      {/each}
      {#each xt as t}
        <text class="tick" x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{view === "raw" ? shortN(t) : t}</text>
      {/each}
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">{view === "raw" ? "kroner (or count) per month" : "log(1 + value)"}</text>
    </svg>
  </div>
  <p class="readout shape-facts">{facts}</p>
  {#if overNote}<p class="readout shape-over">{overNote}</p>{/if}
</div>

<style>
  .hbar { fill: #2074d5; opacity: 0.85; }
</style>
