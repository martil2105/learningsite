<script>
  /*
    The hook. P/E against growth for a firm earning a return on equity ROE, with
    shareholders needing r = 8%. Every curve starts from 1/r = 12.5 at zero
    growth: above ROE = r growth lifts the P/E, below it growth lowers it, and
    at ROE = r the curve lies on the flat dashed line. Grey curves are other
    returns on equity, 4% at the bottom to 20% at the top.
  */
  import { linear, path } from "../scale.js";
  import { clipTop } from "../clip.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { value, peOf, R } from "../growth.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let roe = $state(0.12);
  let g = $state(0.06);
  const GMAX = 0.065;
  let gMax = $derived(Math.min(GMAX, roe));
  let gEff = $derived(Math.min(g, gMax));
  let v = $derived(value({ roe, g: gEff }));

  const H = 300;
  const m = { top: 26, right: 18, bottom: 46, left: 44 };
  const XMAX = 0.075, YMAX = 50;
  let x = $derived(linear([0, XMAX], [m.left, width - m.right]));
  const y = linear([0, YMAX], [H - m.bottom, m.top]);
  const FAMILY = [0.04, 0.06, 0.1, 0.12, 0.16, 0.2];
  const curvePts = (rr) => {
    const top = Math.min(XMAX, rr), pts = [];
    for (let i = 0; i <= 300; i++) { const gg = (top * i) / 300; pts.push([gg, peOf(R, gg, rr)]); }
    return clipTop(pts, YMAX);
  };
  let family = $derived(FAMILY.map((rr) => ({ rr, d: path(curvePts(rr).map(([a, b]) => [x(a), y(b)])) })));
  let sel = $derived(path(curvePts(roe).map(([a, b]) => [x(a), y(b)])));
  const money = (u) => (u < -0.004 ? "−$" : u > 0.004 ? "+$" : "$") + fixed(Math.abs(u), 2);
</script>

<div class="controls">
  <Slider label="Return on equity" id="gl-roe" min={0.04} max={0.2} step={0.005} bind:value={roe} format={(u) => pct(+u, 1)} width={240} />
  <Slider label="Growth a year" id="gl-g" min={0} max={GMAX} step={0.0025} bind:value={g} format={() => pct(gEff, 2)} width={240} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="P/E against growth, for the chosen return on equity and for others" class="pe-panel">
  <AxisY scale={y} ticks={[0, 10, 20, 30, 40, 50]} x0={m.left} x1={width - m.right} />
  <AxisX scale={x} ticks={[0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07]} y={H - m.bottom} format={(t) => pct(t, 0)} title="Growth a year" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">P/E</text>
  {#each family as f (f.rr)}
    <path class="fam roe-{Math.round(f.rr * 1000)}" d={f.d} fill="none" stroke="#8a94a2" stroke-width="1.2" opacity="0.55" />
  {/each}
  <line class="flat" x1={x(0)} x2={x(XMAX)} y1={y(1 / R)} y2={y(1 / R)} stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="5 4" />
  <text class="flat-label halo" x={x(XMAX) - 4} y={y(1 / R) + 16} text-anchor="end">ROE = r = 8%</text>
  <path class="curve sel" d={sel} fill="none" stroke="var(--c1)" stroke-width="3" />
  <circle class="firm" cx={x(gEff)} cy={y(v.PE)} r="6.5" fill="var(--c1)" stroke="white" stroke-width="2" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>our firm's return on equity</span>
  <span class="key"><span class="swatch" style="background:#8a94a2"></span>other returns on equity, 4% to 20%</span>
  <span class="key"><span class="swatch dash"></span>return on equity equal to the 8% shareholders need</span>
</p>
{#if g > gMax + 1e-9}
  <p class="note" id="gl-cap">Growth can't be faster than the return on equity without new money, so it stops at {pct(gMax, 1)}.</p>
{/if}

<div class="readouts">
  <Readout id="gl-r-pe" label="P/E" value={fixed(v.PE, 1)} color="var(--c1)" />
  <Readout id="gl-r-pb" label="Price to book" value={fixed(v.PB, 2)} />
  <Readout id="gl-r-pay" label="Paid out" value={pct(1 - v.b, 0)} />
  <Readout id="gl-r-nog" label="Worth with no growth" value={"$" + fixed(v.noGrowth, 2)} />
  <Readout id="gl-r-pvgo" label="Value of growth" value={money(v.pvgo)} />
  <Readout id="gl-r-ey" label="Earnings yield" value={pct(v.EY, 1)} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); height: 2px; }
  .note { font-size: 0.85rem; color: var(--muted); margin: 0.4rem 0 0; }
  .halo { stroke: #fff; stroke-width: 3px; paint-order: stroke; font-size: 11.5px; fill: var(--ink); }
</style>
