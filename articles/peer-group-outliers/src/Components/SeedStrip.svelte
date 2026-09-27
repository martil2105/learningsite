<script>
  /*
    Forty random seeds for the same k-means on the same month. Each dot is one
    seed, placed by how many of the ring's 20 members its 50 alerts caught.
    With one start per fit the dots scatter; with ten, most k settle.
  */
  import P from "../precomputed.js";
  import { linear, clampW } from "../chart.js";

  let k = $state(8);
  let nInit = $state(1);
  let S = $derived(P.III3[`${k}-${nInit}`]);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const M = { left: 18, right: 18 };
  let x = $derived(linear(0, 20, M.left, W - M.right));
  let stacks = $derived.by(() => {
    const h = {}; return S.ring.map((v) => { h[v] = (h[v] || 0) + 1; return [v, h[v]]; });
  });
  let tallest = $derived(Math.max(...stacks.map((s) => s[1])));
  let R = $derived(tallest > 12 ? 3 : 5);
  let H = $derived(Math.max(90, tallest * (2 * R + 1) + 42));
  let summary = $derived(`${S.distinct} different local optima from 40 seeds · worst inertia ${((S.worst - 1) * 100).toFixed(1)}% above the best · alert lists overlap ${S.Jmean.toFixed(2)} on average, ${S.Jmin.toFixed(2)} at worst`);
</script>

<div class="fig seed-strip" id="seed-strip">
  <p class="fig-title">The same k-means with 40 different random seeds</p>
  <div class="pills">
    <span class="ctl-label">clusters k</span>
    {#each [5, 8, 10] as kk}
      <button class="pill kpill" class:active={k === kk} onclick={() => (k = kk)}>{kk}</button>
    {/each}
  </div>
  <div class="pills">
    <span class="ctl-label">starts per fit</span>
    {#each [1, 10] as n}
      <button class="pill ninit" class:active={nInit === n} data-n={n} onclick={() => (nInit = n)}>{n}</button>
    {/each}
  </div>
  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ring members caught for each of 40 seeds">
      <line class="axis" x1={M.left} x2={W - M.right} y1={H - 28} y2={H - 28} />
      {#each [0, 5, 10, 15, 20] as t}
        <text class="tick" x={x(t)} y={H - 14} text-anchor="middle">{t}</text>
      {/each}
      <text class="axis-title" x={W / 2} y={H - 1} text-anchor="middle">ring members among the 50 alerts</text>
      {#each stacks as [v, h]}
        <circle class="seed-dot" cx={x(v)} cy={H - 28 - R - 1 - (h - 1) * (2 * R + 1)} r={R} />
      {/each}
    </svg>
  </div>
  <p class="readout seed-summary">{summary}</p>
</div>

<style>
  .seed-dot { fill: #df2a5d; opacity: 0.85; }
  .axis { stroke: #8a94a2; }
</style>
