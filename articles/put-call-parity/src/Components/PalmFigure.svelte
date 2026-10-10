<script>
  /*
    Palm on 17 March 2000 (quotes from Lamont and Thaler 2003, Table 6). For
    each expiry, the range of prices at which options let us sell (left end)
    or buy (right end) a Palm share for delivery then, against the share's
    price that day.
  */
  import { linear } from "../chart.js";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { PALM, synthetic } from "../parity.js";
  import { money, pct } from "../format.js";

  let { width } = $props();
  let pick = $state("nov");
  const ROW = 46, top = 22, H = top + ROW * 3 + 34, m = { left: 16, right: 16 };
  let X = $derived(linear(35, 60, m.left, width - m.right));
  const rows = PALM.rows.map((r) => ({ ...r, s: synthetic(r) }));
  let sel = $derived(rows.find((r) => r.key === pick));
  const yOf = (i) => top + i * ROW + 18;
</script>

<div class="controls">
  <Segmented id="pm-exp" label="Options expiring in" options={rows.map((r) => ({ value: r.key, label: r.label }))} bind:value={pick} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What Palm's options said a share was worth, against its price" class="palm-panel">
  <line class="price" x1={X(PALM.price)} x2={X(PALM.price)} y1={6} y2={top + ROW * 3} stroke="var(--c2)" stroke-width="2.4" />
  {#each rows as r, i (r.key)}
    <text class="row-label" x={X(35)} y={yOf(i) - 8}>{r.label}</text>
    <rect class="range {r.key}" class:on={r.key === pick} x={X(r.s.short)} y={yOf(i)} width={X(r.s.long) - X(r.s.short)} height="14" fill={r.key === pick ? "var(--c1)" : "var(--c1-soft)"} />
  {/each}
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={top + ROW * 3} y2={top + ROW * 3} />
    {#each [35, 40, 45, 50, 55, 60] as t (t)}
      <g transform="translate({X(t)},{top + ROW * 3})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">${t}</text></g>
    {/each}
  </g>
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>a Palm share for delivery then, from its options</span>
  <span><i style="background:var(--c2)"></i>Palm's share price, $55.25</span>
</div>

<div class="readouts">
  <Readout id="pm-short" label="Selling one through options" value={money(sel.s.short, 2)} />
  <Readout id="pm-long" label="Buying one" value={money(sel.s.long, 2)} />
  <Readout id="pm-below" label="Below the share price" value={pct(1 - sel.s.long / PALM.price, 0) + " to " + pct(1 - sel.s.short / PALM.price, 0)} />
</div>

<style>
  svg { display: block; }
  .row-label { font-size: 12px; font-weight: 600; fill: var(--ink-soft); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
