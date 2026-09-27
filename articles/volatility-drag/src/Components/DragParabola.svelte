<script>
  import { linear, ticks, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import { dragCoefficient } from "../drag.js";

  // The drag coefficient (L^2 - L)/2 against leverage L. It's symmetric about
  // L = 1/2, so L and 1 - L bleed at the same rate.
  let { width } = $props();
  const height = 280;
  const m = { top: 16, right: 16, bottom: 46, left: 58 };
  let x = $derived(linear([-3.5, 4], [m.left, width - m.right]));
  const y = linear([-0.5, 7], [height - m.bottom, m.top]);
  let curve = $derived(path(Array.from({ length: 151 }, (_, i) => { const L = -3.2 + (7.2 * i) / 150; return [x(L), y(dragCoefficient(L))]; })));
  const pts = [-3, -2, -1, 0, 1, 2, 3];
  const lab = (L) => (L > 0 ? `${L}×` : L < 0 ? `−${-L}×` : "cash");
</script>

<svg {width} {height} role="img" aria-label="Drag against leverage" class="drag-parabola" viewBox="0 0 {width} {height}">
  <AxisY scale={y} ticks={[0, 1, 2, 3, 4, 5, 6, 7]} x0={m.left} x1={width - m.right} title="drag × σ²" />
  <AxisX scale={x} ticks={[-3, -2, -1, 0, 1, 2, 3, 4]} y={height - m.bottom} title="leverage L" />
  <line x1={x(0.5)} x2={x(0.5)} y1={m.top} y2={height - m.bottom} stroke="var(--muted)" stroke-dasharray="3 3" />
  <text x={x(0.5) + 4} y={m.top + 10} font-size="11" fill="var(--muted)">L = ½</text>
  <path d={curve} fill="none" stroke="var(--c4)" stroke-width="2" />
  {#each [[-1, 2], [-2, 3]] as [a, b] (a)}
    <line class="pair" x1={x(a)} x2={x(b)} y1={y(dragCoefficient(a))} y2={y(dragCoefficient(b))} stroke="var(--c2)" stroke-width="1.2" stroke-dasharray="4 3" />
  {/each}
  {#each pts as L (L)}
    <circle cx={x(L)} cy={y(dragCoefficient(L))} r="4.5" fill={L === 0 || L === 1 ? "white" : "var(--c4)"} stroke="var(--c4)" stroke-width="1.5" />
    <text x={L < 0.5 ? x(L) - 9 : x(L) + 9} y={y(dragCoefficient(L)) + (L === 0 || L === 1 ? -8 : 4)} text-anchor={L < 0.5 ? "end" : "start"} font-size="11" fill="var(--ink-soft)">{lab(L)}</text>
  {/each}
</svg>
