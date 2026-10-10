<script>
  /*
    Which forward prices an arbitrage rules out. For the index, which can be
    bought, stored for free and lent, both sides are ruled out and only the
    carry price survives. For oil, which can be stored but not lent, only
    prices above the carry ceiling are ruled out; below it, the gap is what
    holding oil now is worth to the people who hold it.
  */
  import { linear } from "../chart.js";
  import Segmented from "./Segmented.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { forward, ceiling, OIL } from "../forwards.js";
  import { money } from "../format.js";

  let { width } = $props();
  let asset = $state("index");
  let qIndex = $state(100);
  let qOil = $state(64);
  const CI = forward(), CO = ceiling(12);
  const RANGE = { index: [90, 115], oil: [50, 75] };
  const H = 120, m = { left: 16, right: 16 }, y0 = 36, BH = 30;
  let X = $derived(linear(RANGE[asset][0], RANGE[asset][1], m.left, width - m.right));
  let cap = $derived(asset === "index" ? CI : CO);
  let quoted = $derived(asset === "index" ? qIndex : qOil);
  let gap = $derived(cap - quoted);
  let ruled = $derived(asset === "index" ? Math.abs(gap) > 0.005 : gap < -0.005);
  let ticks = $derived(asset === "index" ? [90, 95, 100, 105, 110, 115] : [50, 55, 60, 65, 70, 75]);
</script>

<div class="controls">
  <Segmented id="cf-asset" label="Something that can be" options={[{ value: "index", label: "stored and lent: the index" }, { value: "oil", label: "stored, not lent: oil" }]} bind:value={asset} />
  {#if asset === "index"}
    <Slider id="cf-qi" label="Quoted price for a year's time" min={90} max={115} step={0.05} bind:value={qIndex} format={(v) => money(v, 2)} width={280} />
  {:else}
    <Slider id="cf-qo" label="Quoted price for a year's time" min={50} max={75} step={0.05} bind:value={qOil} format={(v) => money(v, 2)} width={280} />
  {/if}
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The forward prices an arbitrage rules out" class="ceiling-panel {asset}">
  {#if asset === "index"}
    <rect class="ruled below" x={X(RANGE.index[0])} y={y0} width={X(CI) - X(RANGE.index[0])} height={BH} fill="var(--c2-soft)" />
    <rect class="ruled above" x={X(CI)} y={y0} width={X(RANGE.index[1]) - X(CI)} height={BH} fill="var(--c2-soft)" />
  {:else}
    <rect class="allowed" x={X(RANGE.oil[0])} y={y0} width={X(CO) - X(RANGE.oil[0])} height={BH} fill="var(--c1-soft)" />
    <rect class="ruled above" x={X(CO)} y={y0} width={X(RANGE.oil[1]) - X(CO)} height={BH} fill="var(--c2-soft)" />
  {/if}
  <line class="cap" x1={X(cap)} x2={X(cap)} y1={y0 - 8} y2={y0 + BH + 8} stroke="var(--c1)" stroke-width="3" />
  <line class="quoted" x1={X(quoted)} x2={X(quoted)} y1={y0 - 14} y2={y0 + BH} stroke="var(--ink)" stroke-width="1.6" />
  <circle class="quoted-dot" cx={X(quoted)} cy={y0 - 14} r="5" fill="white" stroke="var(--ink)" stroke-width="2" />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={y0 + BH} y2={y0 + BH} />
    {#each ticks as t (t)}
      <g transform="translate({X(t)},{y0 + BH})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">${t}</text></g>
    {/each}
  </g>
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>the cost of buying now and carrying</span>
  <span><i class="pink"></i>ruled out by an arbitrage</span>
  {#if asset === "oil"}<span><i class="blue"></i>allowed</span>{/if}
  <span><i class="ring"></i>the quoted price</span>
</div>

<div class="readouts">
  <Readout id="cf-cap" label={asset === "index" ? "Buying now and carrying" : "Buying, storing and carrying"} value={money(cap, 2)} />
  <Readout id="cf-verdict" label="An arbitrage" value={ruled ? "locks in " + money(Math.abs(gap), 2) : "isn't possible"} />
  {#if asset === "oil"}<Readout id="cf-conv" label="Holding oil now is worth at least" value={gap > 0 ? money(gap, 2) : "$0.00"} />{/if}
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.pink, .legend i.blue { height: 10px; vertical-align: -1px; }
  .legend i.pink { background: var(--c2-soft); }
  .legend i.blue { background: var(--c1-soft); }
  .legend i.ring { width: 10px; height: 10px; border: 2px solid var(--ink); border-radius: 50%; background: white; vertical-align: -1px; }
</style>
