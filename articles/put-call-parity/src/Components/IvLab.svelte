<script>
  /*
    Calls and puts on a share that costs a fee to borrow, priced with a true
    volatility of 25%, then turned back into implied volatilities. Computed
    with the share price grown at the safe rate, calls and puts disagree (and
    some calls have no implied volatility at all); computed with the forward
    the options themselves imply, they're one line at 25%.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { S0, R, T, bs, iv, impliedForward } from "../parity.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  let fee = $state(0.03);
  let which = $state("naive");
  const SIG = 0.25;
  const H = 260, m = { top: 12, right: 16, bottom: 44, left: 48 };
  let X = $derived(linear(80, 120, m.left, width - m.right));
  const Y = linear(0, 0.4, H - m.bottom, m.top);
  const KS = Array.from({ length: 81 }, (_, i) => 80 + i * 0.5);
  // the forward the options imply, as a carry b: F = S e^((r-b)T)
  let fwd = $derived(impliedForward(bs(100, SIG, { b: fee }), bs(100, SIG, { b: fee, call: false }), 100));
  let bUsed = $derived(which === "naive" ? 0 : R - Math.log(fwd / S0) / T);
  const segs = (vals) => { let d = "", open = false; vals.forEach(([x, y]) => { if (Number.isFinite(y)) { d += `${open ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`; open = true; } else open = false; }); return d; };
  let callIv = $derived(KS.map((k) => iv(bs(k, SIG, { b: fee }), k, { b: bUsed })));
  let putIv = $derived(KS.map((k) => iv(bs(k, SIG, { b: fee, call: false }), k, { b: bUsed, call: false })));
  let callD = $derived(segs(KS.map((k, i) => [X(k), Y(callIv[i])])));
  let putD = $derived(segs(KS.map((k, i) => [X(k), Y(putIv[i])])));
  let at100 = $derived(KS.indexOf(100));
  let missing = $derived(KS.filter((k, i) => !Number.isFinite(callIv[i])));
</script>

<div class="controls">
  <Slider id="iv-fee" label="Fee for borrowing the share, a year" min={0} max={0.06} step={0.005} bind:value={fee} format={(v) => pct(v, 1)} width={260} />
  <Segmented id="iv-fwd" label="Volatilities worked out with" options={[{ value: "naive", label: "the share price grown at 4%" }, { value: "implied", label: "the forward the options imply" }]} bind:value={which} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Implied volatilities of calls and puts against the strike" class="iv-panel {which}">
  <AxisY scale={Y} ticks={[0, 0.1, 0.2, 0.3, 0.4]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [80, 90, 100, 110, 120] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">${t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">strike</text>
  </g>
  <line class="truth" x1={m.left} x2={width - m.right} y1={Y(SIG)} y2={Y(SIG)} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="5 4" />
  <path class="put-iv" d={putD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="call-iv" d={callD} fill="none" stroke="var(--c1)" stroke-width="2.4" stroke-dasharray={which === "implied" ? "7 5" : "none"} />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>calls</span>
  <span><i style="background:var(--c2)"></i>puts</span>
  <span><i class="dash"></i>the true volatility, 25%</span>
</div>

<div class="readouts">
  <Readout id="iv-call" label="Call at $100" value={pct(callIv[at100], 2)} />
  <Readout id="iv-put" label="Put at $100" value={pct(putIv[at100], 2)} />
  <Readout id="iv-f" label="Forward the options imply" value={money(fwd, 2)} />
  <Readout id="iv-none" label="Calls with no volatility" value={missing.length ? "below $" + (missing[missing.length - 1] + 0.5) : "none"} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #8a94a2 0 5px, transparent 5px 9px); }
</style>
