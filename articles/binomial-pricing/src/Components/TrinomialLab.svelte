<script>
  /*
    A third branch. The share can end at $120, $105 or $90. No portfolio of
    the share and the bank copies the call, so no-arbitrage only bounds its
    price (the shaded band). An investor with constant relative risk aversion
    who prices the share and the bank correctly picks one price in the band,
    and it moves with the real chances on the sliders.
  */
  import { linear } from "../chart.js";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { bounds, investorPrice } from "../binomial.js";
  import { pct, money, fixed } from "../format.js";

  let { width } = $props();
  let pm = $state(0.3);
  let upShare = $state(0.6);
  const b = bounds();
  let pu = $derived((1 - pm) * upShare), pd = $derived((1 - pm) * (1 - upShare));
  let inv = $derived(investorPrice(pu, pm, pd));
  const H = 96, m = { left: 16, right: 16 }, y0 = 30, BH = 28;
  let X = $derived(linear(4, 10, m.left, width - m.right));
</script>

<div class="controls">
  <Slider id="tr-pm" label="Real chance of the middle branch, $105" min={0} max={0.9} step={0.05} bind:value={pm} format={(v) => pct(v, 0)} width={280} />
  <Slider id="tr-up" label="Of the rest, the share rises" min={0.45} max={0.75} step={0.05} bind:value={upShare} format={(v) => pct(v, 0)} width={280} />
</div>

<p class="chances">Real chances: $120 {pct(pu, 0)} · $105 {pct(pm, 0)} · $90 {pct(pd, 0)}</p>
<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The prices no arbitrage allows for the call, and the one an investor picks" class="tri-panel">
  <rect class="band" x={X(b.lo)} y={y0} width={X(b.hi) - X(b.lo)} height={BH} fill="var(--c1-soft)" />
  <line class="binomial" x1={X(b.hi)} x2={X(b.hi)} y1={y0 - 8} y2={y0 + BH + 8} stroke="var(--c1)" stroke-width="2.4" />
  <circle class="inv" cx={X(inv.price)} cy={y0 + BH / 2} r="7" fill="var(--c2)" stroke="white" stroke-width="1.5" />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={y0 + BH} y2={y0 + BH} />
    {#each [4, 5, 6, 7, 8, 9, 10] as t (t)}
      <g transform="translate({X(t)},{y0 + BH})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">${t}</text></g>
    {/each}
  </g>
</svg>
<div class="legend">
  <span><i class="soft"></i>prices no arbitrage allows</span>
  <span><i style="background:var(--c1)"></i>the two-branch price</span>
  <span><i class="dot"></i>what the investor pays</span>
</div>

<div class="readouts">
  <Readout id="tr-band" label="No arbitrage allows" value={money(b.lo, 2) + " to " + money(b.hi, 2)} />
  <Readout id="tr-price" label="The investor pays" value={money(inv.price, 2)} />
  <Readout id="tr-gamma" label="Her risk aversion" value={fixed(inv.gamma, 2)} />
</div>

<style>
  svg { display: block; }
  .chances { font-size: 0.85rem; color: var(--ink-soft); margin: 0.2rem 0 0.4rem; font-family: var(--font-mono); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.soft { height: 10px; vertical-align: -1px; background: var(--c1-soft); }
  .legend i.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c2); vertical-align: -1px; }
</style>
