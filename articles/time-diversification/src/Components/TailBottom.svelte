<script>
  /*
    For each bad outcome, how many years it keeps getting worse before the
    median's lead finally pulls it back: T* = (z sigma / 2m)^2, drawn as a bar
    on a log axis, with how far behind bonds it is at its worst.
  */
  import { log10Scale } from "../scale.js";
  import Segmented from "./Segmented.svelte";
  import { worstYear, SIGMA, TAILS } from "../horizon.js";
  import { pct } from "../format.js";

  let { width, premium = $bindable(0.06) } = $props();

  const rowH = 48;
  const m = { top: 10, right: 16, bottom: 44, left: 92 };
  const height = m.top + rowH * TAILS.length + m.bottom;
  let x = $derived(log10Scale([1, 300], [m.left, width - m.right]));
  let rows = $derived(TAILS.map((n) => ({ n, ...worstYear(1 / n, premium, SIGMA) })));
  const xt = [1, 3, 10, 30, 100, 300];
  const yearsText = (T) => `${Math.round(T)} years`;
  const barLabel = (r) => `${yearsText(r.T)}, ${pct(1 - r.ratio, 0)} behind`;
</script>

<div class="controls">
  <Segmented label="Expected yearly premium of stocks over bonds" id="tb-premium" bind:value={premium}
    options={[0.04, 0.06, 0.08].map((v) => ({ value: v, label: pct(v, 0) }))} />
</div>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="How long each bad outcome keeps getting worse" class="tail-bottom-fig">
  <g class="axis axis-x">
    {#each xt as t (t)}
      <g class="grid"><line x1={x(t)} x2={x(t)} y1={m.top} y2={height - m.bottom} /></g>
      <text class="tick-label" x={x(t)} y={height - m.bottom + 18} text-anchor="middle">{t}</text>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={height - 8} text-anchor="middle">years until it’s at its worst</text>
  </g>
  <line class="life-line" x1={x(40)} x2={x(40)} y1={m.top} y2={height - m.bottom} stroke="var(--ink)" stroke-dasharray="4 3" />
  <text x={x(40) + 4} y={m.top + 10} font-size="11" fill="var(--ink-soft)">40 years</text>
  {#each rows as r, i (r.n)}
    {@const yy = m.top + i * rowH + 18}
    <text class="row-label" x={m.left - 8} y={yy + 13} text-anchor="end">{`1 in ${r.n.toLocaleString("en-GB")}`}</text>
    <rect class={`bar bar-${r.n}`} x={x(1)} y={yy} width={Math.max(0, Math.min(x(300), x(Math.max(1, r.T))) - x(1))} height="18" fill={r.T <= 40 ? "var(--c2)" : "var(--c2-soft)"} />
    <text class="bar-label" x={x(1)} y={yy - 5} text-anchor="start" fill="var(--ink)" font-size="11">{barLabel(r)}</text>
  {/each}
</svg>
