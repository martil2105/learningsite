<script>
  import PathChart from "./PathChart.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { zigzag, indexPath, fundPath } from "../drag.js";
  import { signedPct } from "../format.js";

  // The index goes up x one day and down x the next, for 60 trading days.
  let { width } = $props();
  let x = $state(0.02);
  let L = $state(3);
  const DAYS = 60;
  let r = $derived(zigzag(x, DAYS));
  let idx = $derived(indexPath(r));
  let fund = $derived(fundPath(r, L));
  const lab = (L) => (L > 0 ? `${L}×` : `−${-L}×`);
</script>

<div class="controls">
  <Slider label="Daily move, up then down" id="zz-x" min={0.005} max={0.05} step={0.005} bind:value={x} format={(v) => "±" + (100 * v).toFixed(1) + "%"} width={240} />
  <Segmented label="Fund" id="zz-L" bind:value={L} options={[3, 2, -1, -3].map((v) => ({ value: v, label: lab(v) }))} />
</div>
<PathChart {width} height={260}
  series={[{ values: idx, color: "#6a7080", label: "index", cls: "zz-index", thin: true }, { values: fund, color: "var(--c2)", label: `${lab(L)} fund`, cls: "zz-fund" }]} />
<div class="readouts">
  <Readout id="zz-r-index" label="Index after 60 days" value={signedPct(idx[DAYS] - 1)} />
  <Readout id="zz-r-fund" label={`${lab(L)} fund after 60 days`} value={signedPct(fund[DAYS] - 1)} color="var(--c2)" />
  <Readout id="zz-r-naive" label={`${lab(L)} the index's return`} value={signedPct(L * (idx[DAYS] - 1))} />
</div>
