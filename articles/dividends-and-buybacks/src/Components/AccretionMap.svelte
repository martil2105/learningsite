<script>
  /*
    When does a buyback raise earnings per share? The map has the firm's P/E
    across and the after-tax yield on the cash it spends up the side. Below
    the curve (yield = 1 / P/E, that is, below the earnings yield) a buyback
    raises EPS; above it, it lowers them. The dot is our firm, and the two
    sliders move it: what the business earns, and what the cash earns.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { accretion } from "../payout.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let e = $state(6);
  let r = $state(0.03);
  let a = $derived(accretion(e, r));

  const H = 260;
  const m = { top: 12, right: 16, bottom: 44, left: 52 };
  const XL = 5, XH = 40, YH = 0.1;
  let x = $derived(linear([XL, XH], [m.left, width - m.right]));
  const y = linear([0, YH], [H - m.bottom, m.top]);
  // the boundary: yield = 1 / (P/E), drawn inside the window only
  let edge = $derived.by(() => {
    const pts = [];
    for (let i = 0; i <= 140; i++) { const pe = XL + ((XH - XL) * i) / 140, v = 1 / pe; if (v <= YH) pts.push([x(pe), y(v)]); }
    return pts;
  });
  let edgeD = $derived(edge.map(([u, v], i) => `${i ? "L" : "M"}${u.toFixed(2)},${v.toFixed(2)}`).join(""));
  // the accretive region: under the curve, down to zero
  let below = $derived(`M${x(XL).toFixed(2)},${y(YH).toFixed(2)} ` + edgeD.replace(/^M/, "L") + ` L${x(XH).toFixed(2)},${y(0).toFixed(2)} L${x(XL).toFixed(2)},${y(0).toFixed(2)} Z`);
  let above = $derived(edgeD + ` L${x(XH).toFixed(2)},${y(YH).toFixed(2)} L${edge[0][0].toFixed(2)},${y(YH).toFixed(2)} Z`);
  const signed = (v) => (v > 0.00005 ? "+" : v < -0.00005 ? "−" : "") + fixed(Math.abs(100 * v), 1) + "%";
</script>

<div class="controls">
  <Slider label="After-tax yield on the cash" id="am-r" min={0.005} max={0.08} step={0.005} bind:value={r} format={(v) => pct(+v, 1)} width={220} />
  <Slider label="What the business earns, a share" id="am-e" min={2.5} max={10} step={0.5} bind:value={e} format={(v) => "$" + fixed(+v, 2)} width={220} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Where a buyback raises and lowers earnings per share, by P/E and the yield on cash" class="map-panel">
  <path class="accretive" d={below} fill="var(--c3-soft)" opacity="0.8" />
  <path class="dilutive" d={above} fill="var(--c2-soft)" opacity="0.6" />
  <AxisY scale={y} ticks={[0, 0.02, 0.04, 0.06, 0.08, 0.1]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} />
  <AxisX scale={x} ticks={[5, 10, 15, 20, 25, 30, 35, 40]} y={H - m.bottom} title="P/E" />
  <path class="edge" d={edgeD} fill="none" stroke="var(--ink)" stroke-width="2" />
  <circle class="firm" cx={x(a.PE)} cy={y(r)} r="6" fill={a.change >= 0 ? "var(--c3)" : "var(--c2)"} stroke="white" stroke-width="1.5" />
</svg>
<p class="legend">
  <span class="key"><span class="block" style="background:var(--c3-soft)"></span>a buyback raises EPS</span>
  <span class="key"><span class="block" style="background:var(--c2-soft)"></span>a buyback lowers EPS</span>
</p>

<div class="readouts">
  <Readout id="am-r-pe" label="P/E" value={fixed(a.PE, 1)} />
  <Readout id="am-r-ey" label="Earnings yield" value={pct(a.EY, 1)} />
  <Readout id="am-r-eps" label="EPS before" value={"$" + fixed(a.EPS, 2)} />
  <Readout id="am-r-after" label="EPS after a $10 buyback" value={"$" + fixed(a.after, 2)} />
  <Readout id="am-r-change" label="Change" value={signed(a.change)} color={a.change >= 0 ? "var(--c3)" : "var(--c2)"} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .block { display: inline-block; width: 14px; height: 10px; }
</style>
