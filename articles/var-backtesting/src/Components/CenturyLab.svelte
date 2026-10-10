<script>
  /*
    Four models over the last 104 blocks of 250 US trading days. Top: each
    block's exceptions, over the three zones. Bottom: the chosen block's days,
    each day's return as a dot and the model's value at risk as a line drawn
    at minus the VaR, so a dot under the line is an exception (pink).
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { MODELS, blocks, blockDays, blockOf, summary, BLOCKS, YELLOW, RED, FIRST, YEAR } from "../backtest.js";
  import { DATES } from "../market.js";
  import { pct, thousands } from "../format.js";

  let { width, model = $bindable("century"), block = $bindable(BLOCKS - 1) } = $props();
  const SHORT = { century: "Knows the century", history: "Last 250 days", riskmetrics: "RiskMetrics", filtered: "Filtered history" };
  let bl = $derived(blocks(model));
  let s = $derived(summary(model));

  // ---- the blocks
  const H1 = 230, m = { top: 12, right: 44, bottom: 40, left: 40 };
  // x runs in trading days, so a year is placed where its first trading day falls
  let X1 = $derived(linear(0, BLOCKS * YEAR, m.left, width - m.right));
  const dayOfYear = (y) => { let t = FIRST; while (DATES[t] < y * 1e4) t++; return t - FIRST; };
  const YMAX = 25;
  const Y1 = linear(0, YMAX, H1 - m.bottom, m.top);
  let bw = $derived((width - m.left - m.right) / BLOCKS);
  const xt = [1930, 1950, 1970, 1990, 2010];
  let svg1 = $state(null);
  function pick(ev) {
    if (!svg1) return;
    const r = svg1.getBoundingClientRect(), sc = r.width / width;
    const x = (ev.clientX - r.left) / sc;
    const b = Math.floor((x - m.left) / bw);
    if (b >= 0 && b < BLOCKS) block = b;
  }

  // ---- one block's days
  const H2 = 250, n2 = { top: 12, right: 14, bottom: 42, left: 46 };
  let days = $derived(blockDays(model, block));
  let X2 = $derived(linear(0, 249, n2.left, width - n2.right));
  let wmax = $derived.by(() => {
    let a = 0;
    for (const d of days) a = Math.max(a, Math.abs(d.r), d.v);
    return [3, 4, 5, 6, 8, 10, 12].find((t) => t >= a * 100 * 1.05) ?? 12;
  });
  let Y2 = $derived(linear(-wmax / 100, wmax / 100, H2 - n2.bottom, n2.top));
  let y2t = $derived([-wmax, -wmax / 2, 0, wmax / 2, wmax].map((t) => t / 100));
  const clampY = (r, w) => Math.max(-w / 100, Math.min(w / 100, r));
  let varPath = $derived(days.map((d, i) => `${i ? "L" : "M"}${X2(i).toFixed(2)},${Y2(-d.v).toFixed(2)}${i < days.length - 1 ? "L" + X2(i + 1).toFixed(2) + "," + Y2(-d.v).toFixed(2) : ""}`).join(""));
  let here = $derived(bl[block]);
  let off = $derived(days.filter((d) => Math.abs(d.r) * 100 > wmax).length);
  const fmtDate = (d) => { const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return `${d % 100} ${M[(Math.floor(d / 100) % 100) - 1]} ${Math.floor(d / 1e4)}`; };
  const PRESETS = [
    { label: "1931–32", date: 19320601 },
    { label: "1986–87", date: 19871019 },
    { label: "2008–09", date: 20081231 },
    { label: "2019–20", date: 20200316 },
    { label: "Latest", date: 99999999 },
  ];
</script>

<div class="controls">
  <Segmented id="cl-model" label="Model" options={MODELS.map((o) => ({ value: o.key, label: SHORT[o.key] }))} bind:value={model} />
</div>

<p class="panel-title">Exceptions in each block of 250 days</p>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="pick" onclick={pick}>
  <svg bind:this={svg1} {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Exceptions in each block of 250 trading days" class="blocks-panel">
    <rect class="band green" x={m.left} width={width - m.left - m.right} y={Y1(YELLOW - 0.5)} height={Y1(0) - Y1(YELLOW - 0.5)} fill="var(--c3-soft)" />
    <rect class="band red" x={m.left} width={width - m.left - m.right} y={Y1(YMAX)} height={Y1(RED - 0.5) - Y1(YMAX)} fill="var(--c2-soft)" />
    <text class="band-label" x={width - m.right + 4} y={Y1(2) + 4}>green</text>
    <text class="band-label" x={width - m.right + 4} y={Y1(7) + 4}>yellow</text>
    <text class="band-label" x={width - m.right + 4} y={Y1(17) + 4}>red</text>
    <AxisY scale={Y1} ticks={[0, 5, 10, 15, 20, 25]} x0={m.left} x1={width - m.right} />
    <g class="axis axis-x">
      <line x1={m.left} x2={width - m.right} y1={H1 - m.bottom} y2={H1 - m.bottom} />
      {#each xt as t (t)}
        <g transform="translate({X1(dayOfYear(t))},{H1 - m.bottom})">
          <line y2="5" />
          <text class="tick-label" y="18" text-anchor="middle">{t}</text>
        </g>
      {/each}
      <text class="axis-title" x={(m.left + width - m.right) / 2} y={H1 - 6} text-anchor="middle">year</text>
    </g>
    {#each bl as b (b.b)}
      {#if b.k > 0}
        <rect class="blk b{b.b} {b.zone}" class:sel={b.b === block} x={m.left + b.b * bw + bw * 0.12} width={bw * 0.76} y={Y1(Math.min(b.k, YMAX))} height={Y1(0) - Y1(Math.min(b.k, YMAX))} fill={b.b === block ? "var(--ink)" : "var(--c1)"} />
      {/if}
    {/each}
    <line class="sel-mark" x1={m.left + (block + 0.5) * bw} x2={m.left + (block + 0.5) * bw} y1={H1 - m.bottom} y2={H1 - m.bottom + 7} stroke="var(--ink)" stroke-width="2.4" />
  </svg>
</div>

<div class="controls second">
  <Slider id="cl-block" label="Block" min={0} max={BLOCKS - 1} step={1} bind:value={block} format={(b) => fmtDate(bl[b].start).slice(-4) + " to " + fmtDate(bl[b].end).slice(-4)} width={300} />
  <div class="presets">
    {#each PRESETS as p (p.label)}
      <button type="button" data-b={p.label} onclick={() => (block = blockOf(p.date))}>{p.label}</button>
    {/each}
  </div>
</div>

<p class="panel-title" id="cl-days-title">{SHORT[model]}: the 250 days from {fmtDate(here.start)} to {fmtDate(here.end)}</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Each day's return and the value at risk" class="days-of-block">
  <AxisY scale={Y2} ticks={y2t} x0={n2.left} x1={width - n2.right} format={(t) => (t > 0 ? "+" : "") + pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={n2.left} x2={width - n2.right} y1={H2 - n2.bottom} y2={H2 - n2.bottom} />
    {#each [1, 50, 100, 150, 200, 250] as t (t)}
      <g transform="translate({X2(t - 1)},{H2 - n2.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{t}</text>
      </g>
    {/each}
    <text class="axis-title" x={(n2.left + width - n2.right) / 2} y={H2 - 6} text-anchor="middle">trading day of the block</text>
  </g>
  <line class="zero" x1={n2.left} x2={width - n2.right} y1={Y2(0)} y2={Y2(0)} stroke="#b9c0c7" />
  {#each days as d, i (d.t)}
    <circle class="day" class:ex={d.ex} class:off={Math.abs(d.r) * 100 > wmax} cx={X2(i)} cy={Y2(clampY(d.r, wmax))} r={d.ex ? 3.4 : 2} fill={d.ex ? "var(--c2)" : "#8a94a2"} />
  {/each}
  <path class="var-line" d={varPath} fill="none" stroke="var(--c1)" stroke-width="2" />
</svg>
<div class="legend">
  <span><i style="background:#8a94a2"></i>a day's return</span>
  <span><i style="background:var(--c1)"></i>minus the value at risk</span>
  <span><i style="background:var(--c2)"></i>an exception</span>
</div>
{#if off}<p class="note" id="cl-off">{off === 1 ? "One day falls" : `${off} days fall`} outside the chart and {off === 1 ? "is" : "are"} drawn at its edge.</p>{/if}

<div class="readouts">
  <Readout id="cl-rate" label="Exceptions in 26,000 days" value={`${thousands(s.k)}, ${pct(s.rate, 2)}`} />
  <Readout id="cl-zones" label="Blocks green, yellow, red" value={`${s.green}, ${s.yellow}, ${s.red}`} />
  <Readout id="cl-none" label="Blocks with none" value={String(s.none)} />
  <Readout id="cl-this" label="This block" value={`${here.k}, ${here.zone}`} />
</div>

<style>
  svg { display: block; }
  .pick { cursor: pointer; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .band-label { font-size: 11px; font-weight: 700; fill: var(--ink-soft); }
  .controls.second { margin-top: 0.6rem; }
  .presets { display: flex; gap: 6px; flex-wrap: wrap; align-items: flex-end; }
  .presets button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .note { font-size: 0.8rem; color: var(--muted); margin: 0 0 0.4rem; }
</style>
