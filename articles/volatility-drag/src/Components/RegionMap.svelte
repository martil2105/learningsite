<script>
  import { linear, ticks } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import { beatMargin } from "../drag.js";
  import { signedPct, pct } from "../format.js";

  // Where does a daily-reset fund beat L times the index's return over a
  // year? Only the index's return and its realised volatility matter.
  let { width, L, point = null } = $props();

  const height = 300;
  const m = { top: 14, right: 16, bottom: 46, left: 60 };
  const R0 = -0.4, R1 = 0.6, V0 = 0, V1 = 0.6;
  let x = $derived(linear([R0, R1], [m.left, width - m.right]));
  const y = linear([V0, V1], [height - m.bottom, m.top]);

  // For each volatility, the range of index returns where the fund trails.
  let region = $derived.by(() => {
    const left = [], right = [];
    const NR = 600, NV = 60;
    for (let i = 0; i <= NV; i++) {
      const vol = V0 + ((V1 - V0) * i) / NV, V = vol * vol;
      let lo = null, hi = null;
      for (let k = 0; k <= NR; k++) {
        const R = R0 + ((R1 - R0) * k) / NR;
        if (beatMargin(1 + R, V, L) < 0) { if (lo === null) lo = R; hi = R; }
      }
      if (lo !== null) { left.push([x(lo), y(vol)]); right.push([x(hi), y(vol)]); }
    }
    if (!left.length) return "";
    const pts = left.concat(right.reverse());
    return "M" + pts.map(([a, b]) => a.toFixed(1) + "," + b.toFixed(1)).join("L") + "Z";
  });
  const lab = (L) => (L > 0 ? `${L}×` : `−${-L}×`);
</script>

<svg {width} {height} role="img" aria-label="Where the fund beats or trails" class="region-map" viewBox="0 0 {width} {height}">
  <rect x={m.left} y={m.top} width={width - m.left - m.right} height={height - m.top - m.bottom} fill="var(--c3-soft)" />
  <path class="trail-region" d={region} fill="var(--c5-soft)" stroke="var(--c5)" stroke-width="1.2" />
  <AxisY scale={y} ticks={ticks(V0, V1, 6)} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="realised volatility" />
  <AxisX scale={x} ticks={ticks(R0, R1, width < 500 ? 5 : 10)} y={height - m.bottom} format={(v) => signedPct(v, 0)} title="index return over the year" />
  <text x={x(0)} y={m.top + 18} text-anchor="middle" font-size="11" fill="var(--c5)" font-weight="600">trails</text>
  <text x={x(R1) - 6} y={height - m.bottom - 12} text-anchor="end" font-size="11" fill="var(--c3)" font-weight="600">beats {lab(L)} the index</text>
  {#if point}
    <circle class="region-point" cx={x(point.R)} cy={y(Math.min(V1, point.vol))} r="5.5" fill="white" stroke="var(--ink)" stroke-width="2" />
  {/if}
</svg>
