<script>
  /*
    The hook. A model's exceptions over 250 days are Binomial(250, p), with p
    the model's real exception rate. The bars are that distribution, over the
    three zones of the traffic light; the grey caps are a right model's (1%).
    The readouts are the chance of each zone and the average multiplier.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { pmf, upper, zoneChances, capitalRatio, YEAR, YELLOW, RED, P0 } from "../backtest.js";
  import { pct, fixed } from "../format.js";

  let { width, p = $bindable(0.01) } = $props();
  const KMAX = 20; // the last bar holds 20 or more
  const H = 280, m = { top: 26, right: 12, bottom: 44, left: 46 };
  const prob = (q, k) => (k < KMAX ? pmf(YEAR, q, k) : upper(YEAR, q, KMAX));
  let bw = $derived((width - m.left - m.right) / (KMAX + 1));
  let X = $derived((k) => m.left + (k + 0.5) * bw);
  const Y = linear(0, 0.4, H - m.bottom, m.top);
  const yt = [0, 0.1, 0.2, 0.3, 0.4];
  let bars = $derived(Array.from({ length: KMAX + 1 }, (_, k) => ({ k, q: prob(p, k), r: prob(P0, k) })));
  let z = $derived(zoneChances(p));
  const bands = [
    { key: "green", from: 0, to: YELLOW - 1, fill: "var(--c3-soft)" },
    { key: "yellow", from: YELLOW, to: RED - 1, fill: "#f6f7f8" },
    { key: "red", from: RED, to: KMAX, fill: "var(--c2-soft)" },
  ];
  const kTicks = [0, 5, 10, 15, 20];
</script>

<div class="controls">
  <Slider id="zl-p" label="The model's real exception rate" min={0.005} max={0.04} step={0.0025} bind:value={p} format={(x) => pct(x, 2)} width={300} />
  <div class="presets">
    <button type="button" data-p="0.01" class:on={Math.abs(p - 0.01) < 1e-9} onclick={() => (p = 0.01)}>Right model, 1%</button>
    <button type="button" data-p="0.02" class:on={Math.abs(p - 0.02) < 1e-9} onclick={() => (p = 0.02)}>Twice too many, 2%</button>
  </div>
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The chance of each number of exceptions in 250 days" class="zone-panel">
  {#each bands as b (b.key)}
    <rect class="band {b.key}" x={X(b.from) - bw / 2} width={(b.to - b.from + 1) * bw} y={m.top} height={H - m.bottom - m.top} fill={b.fill} />
    <text class="band-label" x={X(b.from) - bw / 2 + 4} y={m.top - 8}>{b.key}</text>
  {/each}
  <AxisY scale={Y} ticks={yt} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  {#each bars as b (b.k)}
    <rect class="bar k{b.k}" x={X(b.k) - bw * 0.36} width={bw * 0.72} y={Y(b.q)} height={Y(0) - Y(b.q)} fill="var(--c1)" />
  {/each}
  {#each bars as b (b.k)}
    <line class="cap k{b.k}" x1={X(b.k) - bw * 0.45} x2={X(b.k) + bw * 0.45} y1={Y(b.r)} y2={Y(b.r)} stroke="#5f6b7a" stroke-width="2.2" />
  {/each}
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each kTicks as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{t === KMAX ? "20+" : t}</text>
      </g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">exceptions in 250 days</text>
  </g>
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>this model</span>
  <span><i style="background:#5f6b7a"></i>a right model, for comparison</span>
</div>

<div class="readouts">
  <Readout id="zl-green" label="Chance of green" value={pct(z.green, 1)} />
  <Readout id="zl-yellow" label="Chance of yellow" value={pct(z.yellow, 1)} />
  <Readout id="zl-red" label="Chance of red" value={pct(z.red, z.red < 0.01 ? 2 : 1)} />
  <Readout id="zl-mult" label="Average multiplier" value={fixed(z.multiplier, 2)} />
  <Readout id="zl-cap" label="Capital against a right model's, on US losses" value={pct(capitalRatio(p), 0)} />
</div>

<style>
  svg { display: block; }
  .band-label { font-size: 11px; font-weight: 700; fill: var(--ink-soft); }
  .presets { display: flex; gap: 6px; flex-wrap: wrap; align-items: flex-end; }
  .presets button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; }
  .presets button.on { background: var(--ink); color: white; border-color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
</style>
