<script>
  /*
    The hook: thirty years of one simulated market. Above, what a dollar in
    each index grows to, on a log scale. Below, the identity at every date:
    the rebalancing gain (green, never falls), the change in concentration
    (pink) and their sum, which is the log of equal over cap (blue). The blue
    line is computed from the two indices, not by adding the other two.
  */
  import { linear, log10Scale } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { market, run } from "../index.js";
  import { fixed } from "../format.js";

  let { width } = $props();

  const MARKETS = [15, 34, 7, 52, 3, 21, 44, 60];
  let world = $state("same");
  let n = $state(100);
  let mk = $state(0);
  let seed = $derived(MARKETS[mk % MARKETS.length] + 100 * Math.floor(mk / MARKETS.length));
  let res = $derived(run(market(n, seed, world === "same" ? 0 : 0.05)));
  let P = $derived(res.path);
  let e = $derived(res.end);

  const H1 = 230, H2 = 230;
  const m = { top: 12, right: 16, bottom: 40, left: 52 };
  let x = $derived(linear([0, 360], [m.left, width - m.right]));
  let top = $derived(Math.max(...P.map((p) => Math.max(p.lnEW, p.lnCW))));
  let bot = $derived(Math.min(...P.map((p) => Math.min(p.lnEW, p.lnCW))));
  let lo = $derived(Math.min(0.5, Math.exp(bot) * 0.9));
  let hi = $derived(Math.max(20, Math.exp(top) * 1.1));
  let y1 = $derived(log10Scale([lo, hi], [H1 - m.bottom, m.top]));
  let ticks1 = $derived([0.5, 1, 2, 5, 10, 20, 50, 100, 200].filter((v) => v >= lo && v <= hi));
  // the lower panel is symmetric about zero and grows if a market's terms need it
  let lim = $derived(Math.max(1.6, 1.08 * Math.max(...P.map((p) => Math.max(Math.abs(p.gain), Math.abs(p.conc), Math.abs(p.lnEW - p.lnCW))))));
  let y2 = $derived(linear([-lim, lim], [H2 - m.bottom, m.top]));
  let ticks2 = $derived.by(() => { const st = lim > 2 ? 1 : 0.5, out = []; for (let v = -Math.floor(lim / st) * st; v <= lim + 1e-9; v += st) out.push(+v.toFixed(2)); return out; });
  const line = (f, y) => P.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(2)},${y(f(p)).toFixed(2)}`).join("");
  let ewD = $derived(line((p) => Math.exp(p.lnEW), y1));
  let cwD = $derived(line((p) => Math.exp(p.lnCW), y1));
  let gainD = $derived(line((p) => p.gain, y2));
  let concD = $derived(line((p) => p.conc, y2));
  let gapD = $derived(line((p) => p.lnEW - p.lnCW, y2));
  const yearTicks = [0, 60, 120, 180, 240, 300, 360];
  const times = (v) => fixed(v, 1) + "×";
  const signed = (v) => (v >= 0 ? "+" : "−") + fixed(Math.abs(v), 2);
</script>

<div class="controls">
  <Segmented label="Our market" id="il-world" bind:value={world} options={[{ value: "same", label: "Same prospects for every stock" }, { value: "pull", label: "Big firms slow down" }]} />
  <Segmented label="Stocks" id="il-n" bind:value={n} options={[{ value: 30, label: "30" }, { value: 100, label: "100" }, { value: 500, label: "500" }]} />
  <div class="btn-wrap"><button type="button" id="il-another" onclick={() => (mk += 1)}>Another market</button></div>
</div>

<p class="sub-title">What a dollar grows to</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="What a dollar in each index grows to over thirty years" class="value-panel">
  <AxisY scale={y1} ticks={ticks1} x0={m.left} x1={width - m.right} format={(v) => "$" + v} />
  <AxisX scale={x} ticks={yearTicks} y={H1 - m.bottom} format={(v) => String(v / 12)} title="years" />
  <path class="cw" d={cwD} fill="none" stroke="var(--c2)" stroke-width="2.2" />
  <path class="ew" d={ewD} fill="none" stroke="var(--c1)" stroke-width="2.2" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>equal-weighted</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>cap-weighted</span>
</p>

<p class="sub-title">The gap, split in two</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The log of equal-weighted over cap-weighted, and the two terms it splits into" class="split-panel">
  <AxisY scale={y2} ticks={ticks2} x0={m.left} x1={width - m.right} format={(v) => fixed(v, 1)} />
  <AxisX scale={x} ticks={yearTicks} y={H2 - m.bottom} format={(v) => String(v / 12)} title="years" />
  <line class="zero" x1={m.left} x2={width - m.right} y1={y2(0)} y2={y2(0)} stroke="var(--ink)" stroke-opacity="0.45" />
  <path class="gain" d={gainD} fill="none" stroke="var(--c3)" stroke-width="2.2" />
  <path class="conc" d={concD} fill="none" stroke="var(--c2)" stroke-width="2.2" />
  <path class="gap" d={gapD} fill="none" stroke="var(--c1)" stroke-width="2.8" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c3)"></span>rebalancing gain</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>change in concentration</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>log of equal over cap</span>
</p>

<div class="readouts">
  <Readout id="il-r-ew" label="A dollar, equal-weighted" value={times(Math.exp(e.lnEW))} color="var(--c1)" />
  <Readout id="il-r-cw" label="A dollar, cap-weighted" value={times(Math.exp(e.lnCW))} color="var(--c2)" />
  <Readout id="il-r-gain" label="Rebalancing gain" value={signed(e.gain)} color="var(--c3)" />
  <Readout id="il-r-conc" label="Change in concentration" value={signed(e.conc)} color="var(--c2)" />
  <Readout id="il-r-gap" label="Log of equal over cap" value={signed(e.lnEW - e.lnCW)} color="var(--c1)" />
  <Readout id="il-r-neff" label="Effective stocks, cap-weighted" value={fixed(e.neff, 1)} />
</div>

<style>
  .btn-wrap { display: flex; align-items: flex-end; }
  #il-another { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 5px 12px; border-radius: 999px; cursor: pointer; }
  .sub-title { font-size: 0.92rem; font-weight: 700; margin: 0.6rem 0 0.1rem; color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
