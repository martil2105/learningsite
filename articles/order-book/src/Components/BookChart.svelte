<script>
  import { book, walk, BEST_BID, BEST_ASK, MID, LEVELS } from "../book.js";
  import { linear } from "../scale.js";

  // A depth chart: price along the bottom, shares waiting at each price as a
  // bar. Bids (buyers) to the left in blue, asks (sellers) to the right in
  // orange. A market buy eats the asks from the inside out.
  let { width, shape = "flat", buyQ = 0, sellQ = 0, annotate = false, height = 250 } = $props();

  const m = { top: 46, right: 14, bottom: 34, left: 14 };
  let b = $derived(book(shape, LEVELS));
  let nShow = $derived(Math.max(12, Math.min(LEVELS, Math.floor((width - m.left - m.right) / 2 / 8))));
  let x = $derived(linear([BEST_BID - (nShow - 1) - 0.6, BEST_ASK + (nShow - 1) + 0.6], [m.left, width - m.right]));
  let step = $derived(x(1) - x(0));
  let bw = $derived(Math.max(2, step * 0.78));
  let maxDepth = $derived(Math.max(...b.asks.slice(0, nShow).map((l) => l.qty)));
  let y = $derived(linear([0, maxDepth * 1.05], [height - m.bottom, m.top]));

  let buy = $derived(buyQ > 0 ? walk(b.asks, buyQ) : null);
  let sell = $derived(sellQ > 0 ? walk(b.bids, sellQ) : null);
  const taken = (res, j) => (res ? (res.fills.find((f) => f.j === j)?.qty ?? 0) : 0);

  let labelEvery = $derived(width < 900 ? 10 : 5);
  let priceTicks = $derived.by(() => {
    const out = [];
    const lo = Math.ceil((BEST_BID - (nShow - 1)) / labelEvery) * labelEvery;
    for (let p = lo; p <= BEST_ASK + nShow - 1; p += labelEvery) out.push(p);
    return out;
  });
  const dollars = (c) => "$" + (c / 100).toFixed(2);
  const dollars3 = (c) => "$" + (c / 100).toFixed(3);
  const clampX = (px, pad = 40) => Math.max(m.left + pad, Math.min(width - m.right - pad, px));
  let offChart = $derived(buy && buy.lastLevel >= nShow ? buy.lastLevel - nShow + 1 : 0);
</script>

<svg {width} {height} role="img" aria-label="Order book depth chart" class="book-chart" data-shape={shape} viewBox="0 0 {width} {height}">
  <!-- bars -->
  {#each b.bids.slice(0, nShow) as l (l.j)}
    {@const t = taken(sell, l.j)}
    <rect class="bid" x={x(l.price) - bw / 2} y={y(l.qty)} width={bw} height={y(0) - y(l.qty)} fill="var(--c1-soft)" />
    {#if t > 0}<rect class="bid-taken" x={x(l.price) - bw / 2} y={y(t)} width={bw} height={y(0) - y(t)} fill="var(--c1)" />{/if}
  {/each}
  {#each b.asks.slice(0, nShow) as l (l.j)}
    {@const t = taken(buy, l.j)}
    <rect class="ask" data-price={l.price} data-qty={l.qty} x={x(l.price) - bw / 2} y={y(l.qty)} width={bw} height={y(0) - y(l.qty)} fill="var(--c2-soft)" />
    {#if t > 0}<rect class="ask-taken" data-price={l.price} data-qty={t} x={x(l.price) - bw / 2} y={y(t)} width={bw} height={y(0) - y(t)} fill="var(--c2)" />{/if}
  {/each}

  <!-- baseline and price axis -->
  <line x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} stroke="#c4c8d0" />
  {#each priceTicks as p (p)}
    <line x1={x(p)} x2={x(p)} y1={y(0)} y2={y(0) + 4} stroke="#c4c8d0" />
    <text class="tick-label" x={x(p)} y={y(0) + 17} text-anchor="middle">{dollars(p)}</text>
  {/each}

  <!-- mid marker -->
  <line x1={x(MID)} x2={x(MID)} y1={m.top - 4} y2={y(0)} stroke="var(--muted)" stroke-dasharray="3 3" />
  {#if !annotate}<text x={x(MID)} y={m.top - 8} text-anchor="middle" class="mid-label" font-size="11">mid</text>{/if}

  {#if annotate}
    <text x={x(BEST_BID) - 4} y={16} text-anchor="end" font-size="11" fill="var(--c1)">best bid {dollars(BEST_BID)}</text>
    <line x1={x(BEST_BID)} x2={x(BEST_BID)} y1={20} y2={y(b.bids[0].qty) - 2} stroke="var(--c1)" />
    <text x={x(BEST_ASK) + 4} y={16} text-anchor="start" font-size="11" fill="var(--c2)">best ask {dollars(BEST_ASK)}</text>
    <line x1={x(BEST_ASK)} x2={x(BEST_ASK)} y1={20} y2={y(b.asks[0].qty) - 2} stroke="var(--c2)" />
    <text x={(m.left + x(BEST_BID)) / 2} y={(y(0) + y(b.bids[0].qty)) / 2} text-anchor="middle" font-size="12" fill="var(--c1)" font-weight="600">buyers waiting</text>
    <text x={(x(BEST_ASK) + width - m.right) / 2} y={(y(0) + y(b.asks[0].qty)) / 2} text-anchor="middle" font-size="12" fill="var(--c2)" font-weight="600">sellers waiting</text>
  {/if}

  {#if buy && buy.filled > 0}
    <g class="avg-marker">
      <line x1={x(buy.avg)} x2={x(buy.avg)} y1={42} y2={y(0)} stroke="var(--ink)" stroke-width="1.5" />
      <text x={clampX(x(buy.avg), 60)} y={16} text-anchor="middle" font-size="11" fill="var(--ink)">average {dollars3(buy.avg)}</text>
    </g>
    {#if buy.lastLevel < nShow}
      <line class="last-marker" x1={x(buy.last)} x2={x(buy.last)} y1={32} y2={y(0)} stroke="var(--c4)" stroke-width="1.4" stroke-dasharray="4 3" />
      <text x={clampX(x(buy.last) + 4, 36)} y={36} text-anchor="start" font-size="11" fill="var(--c4)">last {dollars(buy.last)}</text>
    {:else}
      <text x={width - m.right} y={36} text-anchor="end" font-size="11" fill="var(--c4)">last {dollars(buy.last)} →</text>
    {/if}
  {/if}
</svg>

<style>
  .mid-label { fill: var(--muted); }
</style>
