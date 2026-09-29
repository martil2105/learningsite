<script>
  /*
    What the limit costs. One horizontal bar per risk aversion: the rise in
    consumption, every year of life, that a worker who can't borrow would need
    to be as well off as a worker who may hold up to twice her savings in stocks.
    The chosen risk aversion is drawn in blue and the others in grey.
  */
  import { linear } from "../scale.js";
  import Segmented from "./Segmented.svelte";
  import { ceGain } from "../policy.js";
  import { pct } from "../format.js";

  let { width, g = $bindable(5), rho = $bindable(0) } = $props();
  const GS = [3, 5, 10];
  const m = { top: 8, right: 16, bottom: 30, left: 16 };
  const ROW = 50;
  let H = $derived(m.top + GS.length * ROW + m.bottom);
  const MAXV = 0.035;
  let x = $derived(linear([0, MAXV], [m.left, width - m.right]));
  let rows = $derived(GS.map((gg, i) => ({ g: gg, v: ceGain(gg, rho), y: m.top + i * ROW })));
  const ticks = [0, 0.01, 0.02, 0.03];
</script>

<div class="controls">
  <Segmented label="Risk aversion" id="cl-g" bind:value={g} options={[{ value: 3, label: "3" }, { value: 5, label: "5" }, { value: 10, label: "10" }]} />
  <Segmented label="Pay and stocks" id="cl-rho" bind:value={rho} options={[{ value: 0, label: "Unrelated" }, { value: 0.3, label: "Correlation 0.3" }]} />
</div>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What a ban on borrowing costs, in consumption every year, for three levels of risk aversion" class="cost-panel">
  {#each ticks as t (t)}
    <line class="grid" x1={x(t)} x2={x(t)} y1={m.top} y2={H - m.bottom} stroke="#e6e9ea" />
    <text class="tick-label" x={x(t)} y={H - m.bottom + 16} text-anchor="middle">{pct(t, 0)}</text>
  {/each}
  {#each rows as r (r.g)}
    <text class="bar-label" x={m.left} y={r.y + 14}>Risk aversion {r.g}: {pct(r.v, r.v < 0.005 ? 2 : 1)}</text>
    <rect class="cost-bar" data-g={r.g} x={x(0)} y={r.y + 20} width={Math.max(0, x(r.v) - x(0))} height="16" fill={r.g === g ? "var(--c1)" : "#8a94a2"} />
  {/each}
</svg>

<style>
  .bar-label { font-size: 12.5px; font-weight: 600; fill: var(--ink); }
</style>
