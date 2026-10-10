<script>
  /*
    Bootstrapping, one bond at a time. Each press of "Next bond" prices one
    more maturity: the bond's earlier payments are discounted at spot rates we
    already have, and what's left of the price buys its last payment, which
    gives the next spot rate. Blue dots are spot rates, pink steps the
    one-year forward rates between them, grey rings the bonds' own yields.
    The slider puts an error into the 3-year bond's price.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { BONDS, PRICES, bootstrap, forwards, ytm } from "../curve.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  let k = $state(1);
  let err = $state(0);
  let prices = $derived(PRICES.map((p, i) => (i === 2 ? p + err : p)));
  let b = $derived(bootstrap(prices));
  let fw = $derived(forwards(b.spots));
  let ys = $derived(BONDS.map((x, i) => ytm(x.c, x.T, prices[i])));
  const H = 260, m = { top: 14, right: 16, bottom: 44, left: 46 };
  let X = $derived(linear(0, 5.3, m.left, width - m.right));
  const Y = linear(0.02, 0.05, H - m.bottom, m.top);
  let shown = $derived(b.spots.slice(0, k));
  let spotPath = $derived(shown.map((s, i) => `${i ? "L" : "M"}${X(i + 1).toFixed(2)},${Y(s).toFixed(2)}`).join(""));
  let fwdPath = $derived(fw.slice(0, k).map((f, i) => `M${X(i).toFixed(2)},${Y(f).toFixed(2)}L${X(i + 1).toFixed(2)},${Y(f).toFixed(2)}`).join(""));
  let st = $derived(b.steps[k - 1]);
  const usd = (x) => money(x, 2);
  let stepText = $derived(
    k === 1
      ? `The 1-year bond pays ${usd(st.last)} in a year and costs ${usd(st.price)}, so the 1-year spot rate is ${pct(st.spot, 2)}.`
      : `The ${st.T}-year bond's first ${st.T - 1 === 1 ? "payment is" : st.T - 1 + " payments are"} worth ${usd(st.known)} at the spot rates we already have. The rest of its price, ${usd(st.rest)}, buys its last payment of ${usd(st.last)} in ${st.T} years, so the ${st.T}-year spot rate is ${pct(st.spot, 2)}.`
  );
</script>

<div class="controls">
  <div class="buttons">
    <button type="button" id="bl-next" disabled={k >= 5} onclick={() => (k = Math.min(5, k + 1))}>Next bond</button>
    <button type="button" id="bl-reset" onclick={() => (k = 1)}>Start again</button>
  </div>
  <Slider id="bl-err" label="Error in the 3-year bond's price" min={-0.5} max={0.5} step={0.05} bind:value={err} format={(v) => (v > 0 ? "+" : v < 0 ? "−" : "") + "$" + Math.abs(v).toFixed(2)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Spot rates, forward rates and yields, bootstrapped from five bonds" class="boot-panel">
  <AxisY scale={Y} ticks={[0.02, 0.03, 0.04, 0.05]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 1, 2, 3, 4, 5] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">years</text>
  </g>
  <path class="fwd" d={fwdPath} fill="none" stroke="var(--c2)" stroke-width="2.6" />
  <path class="spot-line" d={spotPath} fill="none" stroke="var(--c1)" stroke-width="1.6" />
  {#each ys.slice(0, k) as y, i (i)}
    <circle class="ytm y{i + 1}" cx={X(i + 1)} cy={Y(y)} r="6.5" fill="none" stroke="#8a94a2" stroke-width="1.6" />
  {/each}
  {#each shown as s, i (i)}
    <circle class="spot s{i + 1}" cx={X(i + 1)} cy={Y(s)} r="4.5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
  {/each}
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>spot rate</span>
  <span><i style="background:var(--c2)"></i>forward rate for that year</span>
  <span><i class="ring"></i>the bond's own yield</span>
</div>
<p class="step" id="bl-step">{stepText}</p>

<div class="readouts">
  <Readout id="bl-s3" label="3-year spot rate" value={k >= 3 ? pct(b.spots[2], 2) : "not yet"} />
  <Readout id="bl-f3" label="Forward, year 2 to 3" value={k >= 3 ? pct(fw[2], 2) : "not yet"} />
  <Readout id="bl-f4" label="Forward, year 3 to 4" value={k >= 4 ? pct(fw[3], 2) : "not yet"} />
</div>

<style>
  svg { display: block; }
  .buttons { display: flex; gap: 6px; flex-wrap: wrap; align-items: flex-end; }
  .buttons button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; }
  .buttons button:disabled { opacity: 0.45; cursor: default; }
  .step { font-size: 0.9rem; line-height: 1.5; margin: 0.4rem 0; color: var(--ink-soft); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.ring { width: 10px; height: 10px; border: 1.6px solid #8a94a2; border-radius: 50%; background: none; vertical-align: -1px; }
</style>
