<script>
  /*
    The hook. One seeded strategy over 40 years: a 10-year backtest, then 30
    live years. Top: the value of $1 on a log axis. Bottom: how far below its
    last peak it is, measured from the start in the backtest and afresh from
    the start of live trading, with each part's worst so far as a staircase.
    The pink dashed line carries the backtest's worst into the live years, and
    the pink dot is the first live day that goes past it.
  */
  import { linear } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { path, underwater, lost, SEEDS, DAYS } from "../drawdown.js";
  import { pct } from "../format.js";

  let { width, sr = $bindable(0.5) } = $props();
  let k = $state(0);
  const YEARS = 40, BT = 10, STEP = 5;
  let x = $derived(path(sr, SEEDS[k], YEARS));
  let back = $derived(underwater(x.subarray(0, BT * DAYS + 1)));
  let live = $derived(underwater(x.subarray(BT * DAYS)));
  let btWorst = $derived(back.worst[BT * DAYS]);
  let first = $derived.by(() => { for (let i = 0; i < live.dd.length; i++) if (live.dd[i] > btWorst) return i; return -1; });
  let liveWorst = $derived(live.worst[live.worst.length - 1]);

  const H1 = 200, H2 = 210, m = { top: 12, right: 14, bottom: 34, left: 52 };
  let X = $derived(linear(0, YEARS, m.left, width - m.right));
  // the value panel: a log axis fitted to the path, in whole powers of two
  let lim = $derived.by(() => { let lo = 0, hi = 0; for (const v of x) { if (v < lo) lo = v; if (v > hi) hi = v; } return [Math.floor(lo / Math.LN2) * Math.LN2, Math.ceil(hi / Math.LN2) * Math.LN2]; });
  let Y1 = $derived(linear(lim[0], lim[1], H1 - m.bottom, m.top));
  let y1t = $derived.by(() => { const o = []; const a = Math.round(lim[0] / Math.LN2), b = Math.round(lim[1] / Math.LN2), st = Math.max(1, Math.ceil((b - a) / 5)); for (let e = a; e <= b; e += st) o.push(e * Math.LN2); return o; });
  const money = (v) => { const d = Math.exp(v); return d >= 1 ? "$" + Math.round(d) : "$" + d.toFixed(d < 0.1 ? 3 : 2); };
  let valuePath = $derived.by(() => { let d = ""; for (let i = 0; i < x.length; i += STEP) d += `${d ? "L" : "M"}${X(i / DAYS).toFixed(2)},${Y1(x[i]).toFixed(2)}`; return d; });

  // the drawdown panel, in money lost, downwards
  const FLOOR = 0.9;
  const Y2 = linear(0, FLOOR, m.top, H2 - m.bottom);
  const yOf = (d) => Y2(Math.min(FLOOR, lost(d)));
  const seg = (u, t0) => {
    let area = `M${X(t0).toFixed(2)},${Y2(0).toFixed(2)}`, stair = "";
    for (let i = 0; i < u.dd.length; i += STEP) {
      const t = t0 + i / DAYS;
      // keep the deepest day of each step, so the area reaches every low
      let d = 0; for (let j = i; j < Math.min(i + STEP, u.dd.length); j++) d = Math.max(d, u.dd[j]);
      area += `L${X(t).toFixed(2)},${yOf(d).toFixed(2)}`;
      stair += `${stair ? "L" : "M"}${X(t).toFixed(2)},${yOf(u.worst[Math.min(i + STEP - 1, u.dd.length - 1)]).toFixed(2)}`;
    }
    const tEnd = t0 + (u.dd.length - 1) / DAYS;
    area += `L${X(tEnd).toFixed(2)},${Y2(0).toFixed(2)}Z`;
    return { area, stair };
  };
  let sBack = $derived(seg(back, 0));
  let sLive = $derived(seg(live, BT));
  const y2t = [0, 0.2, 0.4, 0.6, 0.8];
  let deepest = $derived(Math.max(btWorst, liveWorst));
</script>

<div class="controls">
  <Segmented id="pl-sr" label="Sharpe ratio" options={[0, 0.25, 0.5, 1].map((v) => ({ value: v, label: String(v) }))} bind:value={sr} />
  <button type="button" class="again" id="pl-again" onclick={() => (k = (k + 1) % SEEDS.length)}>Another path</button>
</div>

<p class="panel-title">What $1 grows to</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="The strategy's value over 40 years" class="value-panel">
  <rect class="bt-band" x={X(0)} width={X(BT) - X(0)} y={m.top} height={H1 - m.bottom - m.top} fill="#eef0f2" />
  <text class="band-label" x={X(BT / 2)} y={m.top + 14} text-anchor="middle">backtest</text>
  <text class="band-label" x={X((BT + YEARS) / 2)} y={m.top + 14} text-anchor="middle">live</text>
  <AxisY scale={Y1} ticks={y1t} x0={m.left} x1={width - m.right} format={money} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H1 - m.bottom} y2={H1 - m.bottom} />
    {#each [0, 10, 20, 30, 40] as t (t)}
      <g transform="translate({X(t)},{H1 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
  </g>
  <path class="value" d={valuePath} fill="none" stroke="var(--ink)" stroke-width="1.4" />
</svg>

<p class="panel-title">How far below its last peak</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="How far the strategy sits below its last peak" class="dd-panel">
  <rect class="bt-band" x={X(0)} width={X(BT) - X(0)} y={m.top} height={H2 - m.bottom - m.top} fill="#eef0f2" />
  <AxisY scale={Y2} ticks={y2t} x0={m.left} x1={width - m.right} format={(t) => (t ? "−" : "") + pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H2 - m.bottom} y2={H2 - m.bottom} />
    {#each [0, 10, 20, 30, 40] as t (t)}
      <g transform="translate({X(t)},{H2 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H2 - 4} text-anchor="middle">years</text>
  </g>
  <path class="dd-area back" d={sBack.area} fill="var(--c1)" fill-opacity="0.22" />
  <path class="dd-area live" d={sLive.area} fill="var(--c1)" fill-opacity="0.22" />
  <path class="stair back" d={sBack.stair} fill="none" stroke="var(--c1)" stroke-width="2" />
  <path class="stair live" d={sLive.stair} fill="none" stroke="var(--c1)" stroke-width="2" />
  <line class="bt-worst" x1={X(0)} x2={X(YEARS)} y1={yOf(btWorst)} y2={yOf(btWorst)} stroke="var(--c2)" stroke-width="1.6" stroke-dasharray="5 4" />
  {#if first >= 0}
    <circle class="beaten" cx={X(BT + first / DAYS)} cy={yOf(live.dd[first])} r="5.5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
  {/if}
</svg>
<div class="legend">
  <span><i style="background:var(--c1);opacity:0.35"></i>below the last peak</span>
  <span><i style="background:var(--c1)"></i>worst so far</span>
  <span><i class="dash"></i>the backtest's worst</span>
</div>

{#if lost(deepest) > FLOOR}<p class="note" id="pl-off">This path falls more than 90% below a peak, and the chart stops at 90%.</p>{/if}

<div class="readouts">
  <Readout id="pl-bt" label="Backtest's worst, years 0 to 10" value={pct(lost(btWorst), 1)} />
  <Readout id="pl-live" label="Worst in 30 live years" value={pct(lost(liveWorst), 1)} />
  <Readout id="pl-first" label="First gone past" value={first >= 0 ? `live year ${(first / DAYS).toFixed(1)}` : "not in 30 years"} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .band-label { font-size: 11px; font-weight: 700; fill: var(--ink-soft); }
  .again { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; align-self: flex-end; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .note { font-size: 0.8rem; color: var(--muted); margin: 0 0 0.4rem; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--c2) 0 5px, transparent 5px 9px); }
</style>
