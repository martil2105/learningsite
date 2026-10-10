<script>
  /*
    The price of the 30-year 8% bond against its yield. The dashed line is the
    tangent at 8%, whose slope is the duration's guess; the dotted curve adds
    the convexity term. A move in the yield is on the slider, and the three
    dots are where the move lands on each.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { price, priceMove, dates } from "../duration.js";
  import { signedPct, pct } from "../format.js";

  let { width } = $props();
  const C = 0.08, T = 30, Y0 = 0.08;
  let dy = $state(-0.04);
  let mv = $derived(priceMove(C, T, Y0, dy));
  const H = 270, m = { top: 12, right: 14, bottom: 44, left: 48 };
  let X = $derived(linear(0.02, 0.14, m.left, width - m.right));
  const Y = linear(20, 240, H - m.bottom, m.top);
  const YS = Array.from({ length: 121 }, (_, i) => 0.02 + i * 0.001);
  const d = dates(C, T, Y0);
  const lineOf = (f) => YS.map((y, i) => `${i ? "L" : "M"}${X(y).toFixed(2)},${Y(f(y)).toFixed(2)}`).join("");
  let curve = $derived(lineOf((y) => price(C, T, y)));
  let tangent = $derived(lineOf((y) => 100 * (1 + priceMove(C, T, Y0, y - Y0).duration)));
  let bent = $derived(lineOf((y) => 100 * (1 + priceMove(C, T, Y0, y - Y0).withConvexity)));
</script>

<div class="controls">
  <Slider id="pc-dy" label="Move in the yield" min={-0.04} max={0.04} step={0.0025} bind:value={dy} format={(v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(100 * v).toFixed(2) + " points"} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The bond's price against its yield, with the duration line" class="curve-panel">
  <AxisY scale={Y} ticks={[50, 100, 150, 200]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{pct(t, 0)}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">yield</text>
  </g>
  <path class="tangent" d={tangent} fill="none" stroke="#5f6b7a" stroke-width="1.6" stroke-dasharray="6 4" />
  <path class="bent" d={bent} fill="none" stroke="var(--c3)" stroke-width="1.6" stroke-dasharray="2 3" />
  <path class="price" d={curve} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="gap" x1={X(Y0 + dy)} x2={X(Y0 + dy)} y1={Y(100 * (1 + mv.duration))} y2={Y(100 * (1 + mv.exact))} stroke="var(--c2)" stroke-width="2.4" />
  <circle class="on-tangent" cx={X(Y0 + dy)} cy={Y(100 * (1 + mv.duration))} r="4.5" fill="#5f6b7a" stroke="white" stroke-width="1.2" />
  <circle class="on-curve" cx={X(Y0 + dy)} cy={Y(100 * (1 + mv.exact))} r="5.5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>the price</span>
  <span><i class="dash"></i>duration's straight line</span>
  <span><i class="dot"></i>with convexity added</span>
  <span><i style="background:var(--c2)"></i>what the straight line misses</span>
</div>

<div class="readouts">
  <Readout id="pc-exact" label="Price change" value={signedPct(mv.exact, 2)} />
  <Readout id="pc-dur" label="Duration's guess" value={signedPct(mv.duration, 2)} />
  <Readout id="pc-conv" label="With convexity" value={signedPct(mv.withConvexity, 2)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #5f6b7a 0 6px, transparent 6px 10px); }
  .legend i.dot { background: repeating-linear-gradient(90deg, var(--c3) 0 2px, transparent 2px 5px); }
</style>
