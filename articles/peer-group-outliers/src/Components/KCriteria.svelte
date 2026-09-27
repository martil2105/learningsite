<script>
  /*
    Five ways to choose k, drawn side by side for k = 1 to 12, with the k you
    pick marked on each and each criterion's own favourite ringed. Underneath,
    what the 50 alerts caught at your k. The criteria don't agree with each
    other, and none of them is asking whether the planted cases are found.
  */
  import P from "../precomputed.js";
  import CatchStrip from "./CatchStrip.svelte";
  import { linear, pathOf, clampW } from "../chart.js";

  const rows = P.III4.rows;
  const picks = P.III4.picks;
  const PANELS = [
    { key: "inertia", label: "inertia (lower is tighter)", pick: null, fmt: (v) => Math.round(v).toLocaleString("en-GB") },
    { key: "d2", label: "elbow: bend in the inertia curve", pick: picks.elbow, fmt: (v) => Math.round(v).toLocaleString("en-GB") },
    { key: "ch", label: "Calinski–Harabasz (higher)", pick: picks.ch, fmt: (v) => Math.round(v).toLocaleString("en-GB") },
    { key: "db", label: "Davies–Bouldin (lower)", pick: picks.db, fmt: (v) => v.toFixed(3) },
    { key: "sil", label: "silhouette (higher)", pick: picks.sil, fmt: (v) => v.toFixed(3) },
    { key: "gap", label: "gap statistic", pick: picks.gap, fmt: (v) => v.toFixed(3) },
  ];

  let k = $state(3);
  let row = $derived(rows[k - 1]);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let cols = $derived(W >= 600 ? 3 : 2);
  let pw = $derived(Math.floor((W - (cols - 1) * 12 - 2) / cols));
  const PH = 96, M = { top: 8, bottom: 16, left: 6, right: 6 };
  let x = $derived(linear(1, 12, M.left + 4, pw - M.right - 4));
  const series = (key) => rows.filter((r) => r[key] !== null).map((r) => [r.k, r[key]]);
</script>

<div class="fig k-criteria" id="k-criteria">
  <p class="fig-title">Five criteria for choosing k, and what each k catches</p>
  <div class="controls-bar">
    <label class="slider">
      <span class="s-name">clusters k <b>{k}</b></span>
      <input type="range" min="1" max="12" step="1" bind:value={k} aria-label="clusters k" />
    </label>
  </div>
  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <div class="grid-panels" style="grid-template-columns: repeat({cols}, {pw}px)">
      {#each PANELS as pn}
        {@const pts = series(pn.key)}
        {@const lo = Math.min(...pts.map((p) => p[1]))}
        {@const hi = Math.max(...pts.map((p) => p[1]))}
        {@const y = linear(lo, hi, PH - M.bottom, M.top)}
        {@const cur = pts.find((p) => p[0] === k)}
        <div class="panel" data-crit={pn.key}>
          <p class="panel-title">{pn.label}</p>
          <svg width={pw} height={PH} viewBox={`0 0 ${pw} ${PH}`} role="img" aria-label={pn.label}>
            <line class="axis" x1={M.left} x2={pw - M.right} y1={PH - M.bottom + 4} y2={PH - M.bottom + 4} />
            {#each [1, 4, 8, 12] as t}
              <text class="tick" x={x(t)} y={PH - 2} text-anchor="middle">{t}</text>
            {/each}
            <line class="k-mark" x1={x(k)} x2={x(k)} y1={M.top} y2={PH - M.bottom + 4} />
            <path class="curve crit" d={pathOf(pts.map(([kk, v]) => [x(kk), y(v)]))} />
            {#each pts as [kk, v]}
              <circle class="pt" class:pick={kk === pn.pick} cx={x(kk)} cy={y(v)} r={kk === pn.pick ? 5 : 2.2} />
            {/each}
          </svg>
          <p class="panel-value">{cur ? pn.fmt(cur[1]) : "not defined at k = 1"}{pn.pick !== null ? ` · picks k = ${pn.pick}` : ""}</p>
        </div>
      {/each}
    </div>
  </div>
  <CatchStrip c={row.c} />
</div>

<style>
  .grid-panels { display: grid; gap: 12px; }
  .panel { min-width: 0; }
  .panel svg { display: block; background: #fff; border-radius: 4px; }
  .panel-title { font-family: var(--font-main); font-size: 0.74rem; color: #61707d; margin: 0 0 3px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .panel-value { font-family: var(--font-mono); font-size: 0.74rem; color: #232f3e; margin: 2px 0 0 0; }
  .curve.crit { fill: none; stroke: #2074d5; stroke-width: 1.6; }
  .pt { fill: #2074d5; }
  .pt.pick { fill: none; stroke: #df2a5d; stroke-width: 2; }
  .k-mark { stroke: #232f3e; stroke-width: 1.4; stroke-dasharray: 3 3; }
  .axis { stroke: #d4dada; }
</style>
