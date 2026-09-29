<script>
  /*
    What the uninformed pay, in all, before a piece of news is out, against the
    share of informed traders. One curve for the chosen horizon (the news comes
    out after n trades), and a dashed curve for news that never comes out. The
    dot is the peak of the chosen curve. The window is cut at $30, and the
    dashed curve leaves it on the left.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { MUS, billCurve } from "../gm.js";
  import { pct } from "../format.js";

  let { width, n = $bindable(100) } = $props();

  const H = 270;
  const m = { top: 14, right: 16, bottom: 46, left: 56 };
  const TOP = 3000; // cents
  let x = $derived(linear([0, 0.5], [m.left, width - m.right]));
  const y = linear([0, TOP], [H - m.bottom, m.top]);
  let curve = $derived(billCurve(n));
  let never = $derived(billCurve(Infinity));
  let ipeak = $derived(curve.indexOf(Math.max(...curve)));
  // only the points inside the window are drawn
  const inside = (c) => {
    let s = "", open = false;
    MUS.forEach((mu, i) => {
      if (c[i] <= TOP) { s += `${open ? "L" : "M"}${x(mu).toFixed(2)},${y(c[i]).toFixed(2)}`; open = true; }
      else open = false;
    });
    return s;
  };
  let curvePath = $derived(inside(curve));
  let neverPath = $derived(inside(never));
  const dollars = (c) => "$" + (c / 100).toFixed(2);
  const at = (c, mu) => c[Math.round(mu * 100) - 1];
  const OPTS = [
    { value: 100, label: "100 trades" },
    { value: 250, label: "250" },
    { value: 1000, label: "1,000" },
  ];
</script>

<div class="controls">
  <Segmented label="The news comes out after" id="bc-n" bind:value={n} options={OPTS} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What the uninformed pay before the news comes out, against the share of informed traders" class="bill-panel">
  <AxisY scale={y} ticks={[0, 1000, 2000, 3000]} x0={m.left} x1={width - m.right} format={(v) => "$" + v / 100} />
  <AxisX scale={x} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} y={H - m.bottom} format={(v) => pct(v, 0)} title="share of traders who know" />
  <path class="never" d={neverPath} fill="none" stroke="var(--ink)" stroke-opacity="0.6" stroke-width="1.8" stroke-dasharray="6 4" />
  <path class="bill" d={curvePath} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  <circle class="peak" cx={x(MUS[ipeak])} cy={y(curve[ipeak])} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>news comes out after {n.toLocaleString("en-GB")} trades</span>
  <span class="key"><span class="swatch dashed"></span>news never comes out</span>
</p>

<div class="readouts">
  <Readout id="bc-r-peak" label="The bill peaks at" value={pct(MUS[ipeak], 0) + " who know"} color="var(--c1)" />
  <Readout id="bc-r-peakbill" label="Largest bill" value={dollars(curve[ipeak])} />
  <Readout id="bc-r-10" label="Bill at 10% who know" value={dollars(at(curve, 0.1))} />
  <Readout id="bc-r-5" label="Bill at 5% who know" value={dollars(at(curve, 0.05))} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); opacity: 0.7; }
</style>
