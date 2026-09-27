<script>
  import PathChart from "./PathChart.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { simulate, pinEnd, indexPath, fundPath, realisedVariance, predictFund } from "../drag.js";
  import { signedPct, pct } from "../format.js";

  // One simulated year. The reader sets the two numbers the rule needs, the
  // index's return and its volatility, and a seed picks the path between them.
  let { width, L = $bindable(3), target = $bindable(0), vol = $bindable(0.2), seed = $bindable(7) } = $props();

  let r = $derived(pinEnd(simulate(seed, 0, vol), target));
  let idx = $derived(indexPath(r));
  let fund = $derived(fundPath(r, L));
  let rv = $derived(realisedVariance(r));
  let pred = $derived(predictFund(idx[idx.length - 1], rv, L));
  let naive = $derived(1 + L * target);
  const lab = (L) => (L > 0 ? `${L}×` : `−${-L}×`);
</script>

<div class="controls">
  <Segmented label="Fund" id="lab-L" bind:value={L} options={[3, 2, -1, -2, -3].map((v) => ({ value: v, label: lab(v) }))} />
  <Slider label="Index return over the year" id="lab-target" min={-0.4} max={0.6} step={0.05} bind:value={target} format={(v) => signedPct(v, 0)} width={230} />
  <Slider label="Index volatility" id="lab-vol" min={0.05} max={0.6} step={0.05} bind:value={vol} format={(v) => pct(v, 0)} width={200} />
  <div class="seed">
    <span class="lab">Path</span>
    <button type="button" id="lab-seed" onclick={() => (seed = (seed % 997) + 1)}>Draw another year</button>
  </div>
</div>
<PathChart {width} height={300}
  series={[{ values: idx, color: "#6a7080", label: "index", cls: "lab-index", thin: true }, { values: fund, color: "var(--c2)", label: `${lab(L)} fund`, cls: "lab-fund" }]}
  refs={naive > 0 ? [{ y: naive, color: "var(--c1)", label: `${lab(L)} index return`, cls: "lab-naive" }] : []}
  markers={[{ y: pred, color: "var(--c4)", label: "rule", cls: "lab-pred" }]} />
<div class="readouts">
  <Readout id="lab-r-index" label="Index return" value={signedPct(target)} />
  <Readout id="lab-r-rv" label="Realised volatility" value={pct(Math.sqrt(rv), 1)} />
  <Readout id="lab-r-fund" label="Fund return" value={signedPct(fund[fund.length - 1] - 1)} color="var(--c2)" />
  <Readout id="lab-r-pred" label="Rule's prediction" value={signedPct(pred - 1)} color="var(--c4)" />
  <Readout id="lab-r-naive" label={`${lab(L)} the index's return`} value={signedPct(naive - 1)} color="var(--c1)" />
</div>

<style>
  .seed { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
  .lab { color: var(--muted); }
  button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; padding: 4px 12px; border-radius: 999px; cursor: pointer; }
</style>
