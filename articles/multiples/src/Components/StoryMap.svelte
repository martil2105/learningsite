<script>
  /*
    One P/E, many stories. A P/E and a P/B fix the return on equity (P/B over
    P/E). Then each growth rate goes with exactly one required return,
    r = E/P + g (1 - B/P), a straight line. At a price equal to book the line is
    flat: the earnings yield is the required return whatever the growth.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { impliedR, impliedROE } from "../growth.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let PE = $state(20);
  let PB = $state(3);
  let g = $state(0.03);
  const PRESETS = [
    { id: "base", label: "P/E 20, P/B 3", PE: 20, PB: 3 },
    { id: "book", label: "P/E 12.5, at book", PE: 12.5, PB: 1 },
    { id: "below", label: "P/E 12.5, below book", PE: 12.5, PB: 0.6 },
  ];
  let roe = $derived(impliedROE(PE, PB));
  let gTop = $derived(Math.min(0.07, roe));
  let ok = $derived(g < roe - 1e-12);
  let r = $derived(impliedR(PE, PB, g));

  const H = 270;
  const m = { top: 26, right: 18, bottom: 46, left: 44 };
  const YMAX = 0.14;
  let x = $derived(linear([0, 0.07], [m.left, width - m.right]));
  const y = linear([0, YMAX], [H - m.bottom, m.top]);
  // the line, drawn only where growth stays below the return on equity and
  // the required return stays inside the window
  let seg = $derived.by(() => {
    const a = 0, b = Math.max(0, gTop - 1e-9);
    const pts = [];
    for (let i = 0; i <= 200; i++) { const gg = a + ((b - a) * i) / 200, rr = impliedR(PE, PB, gg); if (rr >= 0 && rr <= YMAX) pts.push([x(gg), y(rr)]); }
    return pts;
  });
  let d = $derived(seg.map(([u, w], i) => `${i ? "L" : "M"}${u.toFixed(2)},${w.toFixed(2)}`).join(""));
</script>

<div class="controls">
  <div class="presets" role="group" aria-label="Presets">
    {#each PRESETS as p (p.id)}
      <button type="button" data-p={p.id} class:on={PE === p.PE && PB === p.PB} onclick={() => { PE = p.PE; PB = p.PB; }}>{p.label}</button>
    {/each}
  </div>
  <Slider label="P/E" id="sm-pe" min={8} max={40} step={0.5} bind:value={PE} format={(u) => fixed(+u, 1)} width={200} />
  <Slider label="Price to book" id="sm-pb" min={0.5} max={6} step={0.1} bind:value={PB} format={(u) => fixed(+u, 1)} width={200} />
  <Slider label="Growth a year" id="sm-g" min={0} max={0.07} step={0.0025} bind:value={g} format={(u) => pct(+u, 2)} width={200} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The required return that goes with each growth rate, for one P/E and one price-to-book ratio" class="story-panel">
  <AxisY scale={y} ticks={[0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <AxisX scale={x} ticks={[0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07]} y={H - m.bottom} format={(t) => pct(t, 0)} title="Growth a year" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">Return shareholders need</text>
  {#if d}<path class="story" d={d} fill="none" stroke="var(--c1)" stroke-width="3" />{/if}
  {#if ok && r <= YMAX}
    <circle class="pt" cx={x(g)} cy={y(r)} r="6.5" fill="var(--c1)" stroke="white" stroke-width="2" />
  {/if}
</svg>
{#if !ok}
  <p class="note" id="sm-cap">At this growth the firm would have to reinvest more than it earns, since growth can't pass the return on equity of {pct(roe, 1)}.</p>
{/if}

<div class="readouts">
  <Readout id="sm-r-roe" label="Return on equity" value={pct(roe, 1)} />
  <Readout id="sm-r-ey" label="Earnings yield" value={pct(1 / PE, 1)} />
  <Readout id="sm-r-r" label="Return needed at this growth" value={ok ? pct(r, 1) : "–"} color="var(--c1)" />
  <Readout id="sm-r-growth" label="Share of the price that is growth" value={ok ? pct(1 - 1 / PE / r, 0) : "–"} />
</div>

<style>
  .presets { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; }
  .presets button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; }
  .presets button.on { background: var(--ink); color: white; border-color: var(--ink); }
  .note { font-size: 0.85rem; color: var(--muted); margin: 0.4rem 0 0; }
</style>
