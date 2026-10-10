<script>
  /*
    The hook. A share at $100 goes to $120 or $90; a call struck at $100 pays
    $20 or $0. The reader picks how many shares to hold and how much to owe
    the bank next year (borrowed today at 5%), and sees what the portfolio pays
    in each branch against the call, and what it costs today.
  */
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { S0, UP, DOWN, GROWTH, onePeriod } from "../binomial.js";
  import { money, fixed } from "../format.js";

  let { width } = $props();
  let shares = $state(0.5);
  let owe = $state(40);
  const o = onePeriod();
  let up = $derived(shares * UP - owe), down = $derived(shares * DOWN - owe);
  let cost = $derived(shares * S0 - owe / GROWTH);
  let matched = $derived(Math.abs(up - o.cu) < 1e-9 && Math.abs(down - o.cd) < 1e-9);
  const H = 200;
  let x0 = $derived(Math.min(90, width * 0.16)), x1 = $derived(width - Math.min(200, width * 0.42));
  const yUp = 50, yMid = 104, yDn = 158;
</script>

<div class="controls">
  <Slider id="cl-shares" label="Shares to hold" min={0} max={1} step={1 / 60} bind:value={shares} format={(v) => fixed(v, 3)} width={260} />
  <Slider id="cl-owe" label="Owe the bank next year" min={0} max={90} step={1} bind:value={owe} format={(v) => money(v, 0)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="A one-step tree, with what the call and the portfolio pay in each branch" class="copy-panel">
  <line class="branch up" x1={x0} y1={yMid} x2={x1} y2={yUp} stroke="#8a94a2" stroke-width="1.6" />
  <line class="branch down" x1={x0} y1={yMid} x2={x1} y2={yDn} stroke="#8a94a2" stroke-width="1.6" />
  <circle cx={x0} cy={yMid} r="6" fill="var(--ink)" />
  <circle cx={x1} cy={yUp} r="6" fill="var(--ink)" />
  <circle cx={x1} cy={yDn} r="6" fill="var(--ink)" />
  <text class="node-label" x={x0} y={yMid + 24} text-anchor="middle">share $100</text>
  <text class="node-label" x={x1 + 12} y={yUp - 12}>share $120</text>
  <text class="node-label call" x={x1 + 12} y={yUp + 6}>call pays $20</text>
  <text class="node-label mine" x={x1 + 12} y={yUp + 24}>yours pays {money(up, 2)}</text>
  <text class="node-label" x={x1 + 12} y={yDn - 12}>share $90</text>
  <text class="node-label call" x={x1 + 12} y={yDn + 6}>call pays $0</text>
  <text class="node-label mine" x={x1 + 12} y={yDn + 24}>yours pays {money(down, 2)}</text>
</svg>

<div class="readouts">
  <Readout id="cl-up" label="Yours pays if it rises" value={money(up, 2)} />
  <Readout id="cl-down" label="If it falls" value={money(down, 2)} />
  <Readout id="cl-cost" label="Yours costs today" value={money(cost, 2)} />
  <Readout id="cl-match" label="A copy of the call?" value={matched ? "Yes" : "Not yet"} />
</div>

<style>
  svg { display: block; }
  .node-label { font-size: 12px; fill: var(--ink-soft); }
  .node-label.call { fill: var(--c1); font-weight: 600; }
  .node-label.mine { fill: var(--c2); font-weight: 600; }
</style>
