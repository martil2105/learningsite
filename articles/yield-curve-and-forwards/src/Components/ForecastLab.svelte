<script>
  /*
    The hook. In Vasicek's model the expected short rate is flat at 4%. The
    forward curve is that expectation, plus a premium for holding long bonds
    (green), minus a convexity term that grows with the volatility of rates
    (pink). The green line is the zero-coupon yield, the average of the
    forwards. Volatility and the premium are on sliders.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { expected, convexity, premium, forwardV, yieldV } from "../curve.js";
  import { pct, signedPct } from "../format.js";

  let { width, sigma = $bindable(0.01), prem = $bindable(0) } = $props();
  const H = 290, m = { top: 12, right: 16, bottom: 44, left: 48 };
  let X = $derived(linear(0, 30, m.left, width - m.right));
  const Y = linear(0.02, 0.055, H - m.bottom, m.top);
  const TS = Array.from({ length: 121 }, (_, i) => i * 0.25);
  const line = (f) => TS.map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(f(t)).toFixed(2)}`).join("");
  const band = (lo, hi) => TS.map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(hi(t)).toFixed(2)}`).join("") + TS.slice().reverse().map((t) => `L${X(t).toFixed(2)},${Y(lo(t)).toFixed(2)}`).join("") + "Z";
  let fwd = $derived(line((t) => forwardV(t, sigma, prem)));
  let yld = $derived(line((t) => yieldV(t, sigma, prem)));
  let exp = $derived(line((t) => expected(t)));
  let premBand = $derived(band((t) => expected(t), (t) => expected(t) + premium(t, prem)));
  let convBand = $derived(band((t) => forwardV(t, sigma, prem), (t) => expected(t) + premium(t, prem)));
</script>

<div class="controls">
  <Slider id="fl-sigma" label="Volatility of rates, a year" min={0} max={0.02} step={0.001} bind:value={sigma} format={(v) => (100 * v).toFixed(1) + " points"} width={260} />
  <Slider id="fl-prem" label="Premium for long bonds" min={0} max={0.015} step={0.0005} bind:value={prem} format={(v) => (100 * v).toFixed(2) + " points"} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Forward rates against the expected short rate" class="forecast-panel">
  <AxisY scale={Y} ticks={[0.02, 0.03, 0.04, 0.05]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 5, 10, 15, 20, 25, 30] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">years from now</text>
  </g>
  <path class="prem-band" d={premBand} fill="var(--c3-soft)" />
  <path class="conv-band" d={convBand} fill="var(--c2-soft)" />
  <path class="expected" d={exp} fill="none" stroke="#5f6b7a" stroke-width="1.8" stroke-dasharray="6 4" />
  <path class="yield" d={yld} fill="none" stroke="var(--c3)" stroke-width="2" />
  <path class="forward" d={fwd} fill="none" stroke="var(--c1)" stroke-width="2.6" />
</svg>
<div class="legend">
  <span><i class="dash"></i>the short rate investors expect</span>
  <span><i style="background:var(--c1)"></i>forward rate</span>
  <span><i style="background:var(--c3)"></i>zero-coupon yield</span>
  <span><i class="soft green"></i>premium</span>
  <span><i class="soft pink"></i>convexity</span>
</div>

<div class="readouts">
  <Readout id="fl-f30" label="Forward rate in 30 years" value={pct(forwardV(30, sigma, prem), 2)} color="var(--c1)" />
  <Readout id="fl-c30" label="Convexity, at 30 years" value={pct(-convexity(30, sigma), 2)} />
  <Readout id="fl-p30" label="Premium, at 30 years" value={signedPct(premium(30, prem), 2)} />
  <Readout id="fl-y30" label="30-year yield" value={pct(yieldV(30, sigma, prem), 2)} color="var(--c3)" />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #5f6b7a 0 6px, transparent 6px 10px); }
  .legend i.soft { height: 10px; vertical-align: -1px; }
  .legend i.soft.green { background: var(--c3-soft); }
  .legend i.soft.pink { background: var(--c2-soft); }
</style>
