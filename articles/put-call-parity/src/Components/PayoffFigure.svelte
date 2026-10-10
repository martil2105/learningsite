<script>
  /*
    What a call and a put pay at expiry against where the share ends, for a
    strike on the slider, and (on the toggle) the call minus the put, which is
    the straight line S_T - K a forward to buy at K pays. A second slider
    marks one ending price and the readouts give the three payoffs there.
  */
  import { linear } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { money } from "../format.js";

  let { width } = $props();
  let K = $state(100);
  let ST = $state(120);
  let show = $state("both");
  const H = 280, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(60, 140, m.left, width - m.right));
  const Y = linear(-40, 40, H - m.bottom, m.top);
  const XS = [60, 140];
  let callD = $derived(bandPath([[X(60), Y(0)], [X(K), Y(0)], [X(140), Y(140 - K)]], m.top, H - m.bottom));
  let putD = $derived(bandPath([[X(60), Y(K - 60)], [X(K), Y(0)], [X(140), Y(0)]], m.top, H - m.bottom));
  let diffD = $derived(bandPath(XS.map((s) => [X(s), Y(s - K)]), m.top, H - m.bottom));
  let call = $derived(Math.max(ST - K, 0)), put = $derived(Math.max(K - ST, 0));
  const fmt = (v) => (v < 0 ? "−$" + -v : "$" + v);
</script>

<div class="controls">
  <Slider id="pf-k" label="Strike" min={80} max={120} step={1} bind:value={K} format={(v) => "$" + v} width={220} />
  <Slider id="pf-st" label="Where the share ends" min={60} max={140} step={1} bind:value={ST} format={(v) => "$" + v} width={220} />
  <Segmented id="pf-show" label="Show" options={[{ value: "both", label: "a call and a put" }, { value: "diff", label: "the call minus the put" }]} bind:value={show} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="What a call and a put pay at expiry" class="payoff-panel {show}">
  <AxisY scale={Y} ticks={[-40, -20, 0, 20, 40]} x0={m.left} x1={width - m.right} format={fmt} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [60, 80, 100, 120, 140] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">${t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">where the share ends</text>
  </g>
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-width="1" />
  <line class="end" x1={X(ST)} x2={X(ST)} y1={m.top} y2={H - m.bottom} stroke="#8a94a2" stroke-width="1" stroke-dasharray="3 3" />
  <path class="call" d={callD} fill="none" stroke="var(--c1)" stroke-width={show === "both" ? 2.6 : 1.4} opacity={show === "both" ? 1 : 0.35} />
  <path class="put" d={putD} fill="none" stroke="var(--c2)" stroke-width={show === "both" ? 2.6 : 1.4} opacity={show === "both" ? 1 : 0.35} />
  {#if show === "diff"}<path class="diff" d={diffD} fill="none" stroke="var(--ink)" stroke-width="2.6" />{/if}
  <circle class="dot-call" cx={X(ST)} cy={Y(call)} r="4.5" fill="var(--c1)" stroke="white" stroke-width="1" />
  <circle class="dot-put" cx={X(ST)} cy={Y(put)} r="4.5" fill="var(--c2)" stroke="white" stroke-width="1" />
  {#if show === "diff"}<circle class="dot-diff" cx={X(ST)} cy={Y(ST - K)} r="5" fill="var(--ink)" stroke="white" stroke-width="1" />{/if}
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>a call</span>
  <span><i style="background:var(--c2)"></i>a put</span>
  {#if show === "diff"}<span><i style="background:var(--ink)"></i>the call minus the put</span>{/if}
</div>

<div class="readouts">
  <Readout id="pf-call" label="The call pays" value={money(call, 0)} />
  <Readout id="pf-put" label="The put pays" value={money(put, 0)} />
  <Readout id="pf-diff" label="The call minus the put" value={money(ST - K, 0)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
