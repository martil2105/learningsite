<script>
  /*
    Who sends a buy order. Two columns, one for each value the stock could have
    (equally likely, so equally wide). Each column is split by who arrives: the
    informed, the random buyers and the random sellers, with heights equal to
    their shares. The buy cells are pink and the sell cells blue; the ask is
    the average value over the pink area.
  */
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { cells, highGivenBuy, VL, VH, D } from "../gm.js";
  import { pct } from "../format.js";

  let { width, mu = $bindable(0.1) } = $props();

  const H = 240;
  const m = { top: 30, right: 4, bottom: 6, left: 4 };
  const GAP = 12;
  let colW = $derived(Math.floor((width - m.left - m.right - GAP) / 2));
  const plotH = H - m.top - m.bottom;
  let c = $derived(cells(mu));
  let hb = $derived(highGivenBuy(mu));
  let a = $derived(VL + D * hb);
  let b = $derived(VH - D * hb);

  // stacked cells for one column, top to bottom
  function stack(col, x0) {
    const rows = col === "high"
      ? [["informed", "informed buyers", c.high.informedBuy, "buy"], ["rbuy", "random buyers", c.high.randomBuy, "buy"], ["rsell", "random sellers", c.high.randomSell, "sell"]]
      : [["informed", "informed sellers", c.low.informedSell, "sell"], ["rbuy", "random buyers", c.low.randomBuy, "buy"], ["rsell", "random sellers", c.low.randomSell, "sell"]];
    let y = m.top;
    return rows.map(([key, label, share, side]) => {
      const h = share * plotH;
      const cell = { key, label, share, side, x: x0, y, w: colW, h };
      y += h;
      return cell;
    });
  }
  let left = $derived(stack("high", m.left));
  let right = $derived(stack("low", m.left + colW + GAP));
  const money = (cents) => "$" + (cents / 100).toFixed(2);
</script>

<div class="controls">
  <Slider label="Share of traders who know" id="bf-mu" min={0} max={0.5} step={0.01} bind:value={mu} format={(v) => pct(+v, 0)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Who sends buy and sell orders when the stock is worth $101 and when it is worth $99" class="bayes-panel">
  <text class="col-title" x={m.left + colW / 2} y={18} text-anchor="middle">Worth $101</text>
  <text class="col-title" x={m.left + colW + GAP + colW / 2} y={18} text-anchor="middle">Worth $99</text>
  {#each [...left.map((q) => ({ ...q, col: "high" })), ...right.map((q) => ({ ...q, col: "low" }))] as q (q.col + q.key)}
    {#if q.h > 0.01}
      <rect class="cell {q.side} {q.col}-{q.key}" x={q.x} y={q.y} width={q.w} height={q.h}
        fill={q.side === "buy" ? "var(--c2-soft)" : "var(--c1-soft)"} stroke={q.side === "buy" ? "var(--c2)" : "var(--c1)"} stroke-width="1.5" />
      {#if q.h >= 18}
        <text class="cell-label" x={q.x + q.w / 2} y={q.y + q.h / 2 + 4} text-anchor="middle">{q.label} {pct(q.share / 2, 1)}</text>
      {/if}
    {/if}
  {/each}
</svg>
<p class="legend">
  <span class="key"><span class="block" style="background:var(--c2-soft);border:1.5px solid var(--c2)"></span>sends a buy order</span>
  <span class="key"><span class="block" style="background:var(--c1-soft);border:1.5px solid var(--c1)"></span>sends a sell order</span>
</p>

<div class="readouts">
  <Readout id="bf-r-hb" label="Worth $101, given a buy" value={pct(hb, 1)} />
  <Readout id="bf-r-ask" label="Ask" value={money(a)} color="var(--c2)" />
  <Readout id="bf-r-bid" label="Bid" value={money(b)} color="var(--c1)" />
  <Readout id="bf-r-spread" label="Spread" value={(a - b).toFixed(0) + "¢"} />
</div>

<style>
  .col-title { font-weight: 700; fill: var(--ink); font-size: 13px; }
  .cell-label { font-size: 11.5px; fill: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .block { display: inline-block; width: 14px; height: 10px; box-sizing: border-box; }
</style>
