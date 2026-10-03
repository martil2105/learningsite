<script>
  /*
    The hook. Expected returns against the debt-to-equity ratio, for a firm
    whose assets earn 8% on average with the volatility on the slider, and a
    one-year loan priced in Merton's model. The dashed blue line is
    Modigliani and Miller's straight line for a safe loan; the solid blue is
    what shareholders actually expect, the pink is what lenders expect, and
    the ink line is the cost of capital, flat at 8%.
  */
  import { linear, path } from "../scale.js";
  import { clipTop } from "../clip.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { atDE, mm2, RA } from "../firm.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let s = $state(0.25);
  let de = $state(1);
  let o = $derived(atDE(de, s));

  const H = 300;
  const m = { top: 26, right: 18, bottom: 46, left: 44 };
  const XMAX = 4, YMAX = 0.3;
  let x = $derived(linear([0, XMAX], [m.left, width - m.right]));
  const y = linear([0, YMAX], [H - m.bottom, m.top]);
  let grid = $derived.by(() => {
    const out = [];
    for (let i = 0; i <= 80; i++) { const d = (XMAX * i) / 80; out.push({ d, f: atDE(d, s) }); }
    return out;
  });
  const P = (pts) => path(clipTop(pts, YMAX).map(([a, b]) => [x(a), y(b)]));
  let lineD = $derived(P(grid.map((g) => [g.d, mm2(g.d)])));
  let eqD = $derived(P(grid.map((g) => [g.d, g.f.rE])));
  let debtD = $derived(P(grid.map((g) => [g.d, g.f.rD])));
</script>

<div class="controls">
  <Slider label="Debt to equity" id="rl-de" min={0} max={4} step={0.05} bind:value={de} format={(u) => fixed(+u, 2)} width={240} />
  <Slider label="Volatility of the assets" id="rl-s" min={0.05} max={0.45} step={0.01} bind:value={s} format={(u) => pct(+u, 0)} width={240} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Expected returns of shareholders and lenders, and the cost of capital, against the debt-to-equity ratio" class="ret-panel">
  <AxisY scale={y} ticks={[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <AxisX scale={x} ticks={[0, 1, 2, 3, 4]} y={H - m.bottom} title="Debt to equity, by value" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">Expected return</text>
  <line class="marker" x1={x(de)} x2={x(de)} y1={y(0)} y2={y(YMAX)} stroke="#8a94a2" stroke-width="1" stroke-dasharray="2 3" />
  <path class="line mm" d={lineD} fill="none" stroke="var(--c1)" stroke-width="2" stroke-dasharray="6 4" />
  <line class="wacc" x1={x(0)} x2={x(XMAX)} y1={y(RA)} y2={y(RA)} stroke="var(--ink)" stroke-width="2.2" />
  <path class="line debt" d={debtD} fill="none" stroke="var(--c2)" stroke-width="2.6" />
  <path class="line equity" d={eqD} fill="none" stroke="var(--c1)" stroke-width="3" />
  {#if o.rE <= YMAX}<circle class="pt-e" cx={x(de)} cy={y(o.rE)} r="5.5" fill="var(--c1)" stroke="white" stroke-width="1.5" />{/if}
  <circle class="pt-d" cx={x(de)} cy={y(o.rD)} r="5" fill="var(--c2)" stroke="white" stroke-width="1.5" />
  <circle class="pt-w" cx={x(de)} cy={y(o.wacc)} r="5" fill="var(--ink)" stroke="white" stroke-width="1.5" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>shareholders expect</span>
  <span class="key"><span class="swatch dash"></span>the straight line for a safe loan</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>lenders expect</span>
  <span class="key"><span class="swatch" style="background:var(--ink)"></span>cost of capital</span>
</p>

<div class="readouts">
  <Readout id="rl-r-e" label="Shareholders expect" value={pct(o.rE, 1)} color="var(--c1)" />
  <Readout id="rl-r-line" label="Straight line" value={pct(mm2(de), 1)} />
  <Readout id="rl-r-d" label="Lenders expect" value={pct(o.rD, 1)} color="var(--c2)" />
  <Readout id="rl-r-y" label="Loan's promised yield" value={pct(o.y, 1)} />
  <Readout id="rl-r-w" label="Cost of capital" value={pct(o.wacc, 1)} />
  <Readout id="rl-r-p" label="Chance the loan isn't repaid" value={pct(o.pDefault, 1)} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dash { background: repeating-linear-gradient(90deg, var(--c1) 0 6px, transparent 6px 10px); }
</style>
