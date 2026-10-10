<script>
  /*
    The hook. Call and put prices against the strike in one of two models (the
    other model's prices dashed and faint), and the call minus the put, which
    is the same line in both: the value of a forward to buy at the strike.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { MODELS, forwardValue } from "../parity.js";
  import { money } from "../format.js";

  let { width } = $props();
  let model = $state("calm");
  let K = $state(110);
  const H = 290, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(70, 130, m.left, width - m.right));
  const Y = linear(-30, 35, H - m.bottom, m.top);
  const KS = Array.from({ length: 121 }, (_, i) => 70 + i * 0.5);
  const curve = (f) => KS.map((k, i) => `${i ? "L" : "M"}${X(k).toFixed(2)},${Y(f(k)).toFixed(2)}`).join("");
  let other = $derived(model === "calm" ? "crash" : "calm");
  let callD = $derived(curve((k) => MODELS[model].price(k, true)));
  let putD = $derived(curve((k) => MODELS[model].price(k, false)));
  let callO = $derived(curve((k) => MODELS[other].price(k, true)));
  let putO = $derived(curve((k) => MODELS[other].price(k, false)));
  let diffD = $derived(curve((k) => MODELS[model].price(k, true) - MODELS[model].price(k, false)));
  let c = $derived(MODELS[model].price(K, true)), p = $derived(MODELS[model].price(K, false));
  const fmt = (v) => (v < 0 ? "−$" + -v : "$" + v);
</script>

<div class="controls">
  <Segmented id="ml-model" label="Model of the share" options={[{ value: "calm", label: MODELS.calm.label }, { value: "crash", label: MODELS.crash.label }]} bind:value={model} />
  <Slider id="ml-k" label="Strike" min={70} max={130} step={1} bind:value={K} format={(v) => "$" + v} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Call and put prices against the strike in two models" class="models-panel {model}">
  <AxisY scale={Y} ticks={[-30, -15, 0, 15, 30]} x0={m.left} x1={width - m.right} format={fmt} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [70, 80, 90, 100, 110, 120, 130] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">${t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">strike</text>
  </g>
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-width="1" />
  <path class="call-other" d={callO} fill="none" stroke="var(--c1)" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.45" />
  <path class="put-other" d={putO} fill="none" stroke="var(--c2)" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.45" />
  <path class="call" d={callD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="put" d={putD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="diff" d={diffD} fill="none" stroke="var(--ink)" stroke-width="2.4" />
  <line class="k" x1={X(K)} x2={X(K)} y1={m.top} y2={H - m.bottom} stroke="#8a94a2" stroke-width="1" stroke-dasharray="3 3" />
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>calls</span>
  <span><i style="background:var(--c2)"></i>puts</span>
  <span><i class="dash"></i>the other model</span>
  <span><i style="background:var(--ink)"></i>the call minus the put</span>
</div>

<div class="readouts">
  <Readout id="ml-call" label="The call costs" value={money(c, 2)} />
  <Readout id="ml-put" label="The put costs" value={money(p, 2)} />
  <Readout id="ml-diff" label="The call minus the put" value={money(c - p, 2)} />
  <Readout id="ml-fwd" label="A forward to buy at the strike" value={money(forwardValue(K), 2)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #8a94a2 0 4px, transparent 4px 7px); }
</style>
