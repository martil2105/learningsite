<script>
  /*
    The hook. Two ways to own the index in a year: buy it now and carry it
    (the blue line, S0 e^((r-q)t)), or agree a price today. The first panel is
    40 seeded years of the index with the carry line and the quoted forward
    price. The second shows what each piece of the arbitrage pays at the end of
    the year against where the index ends: the share less its loan, the
    forward, and the two together, flat at the quoted price minus the fair one.
  */
  import { linear } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { S0, forward, arbitrage, pieces, paths } from "../forwards.js";
  import { normals } from "../random.js";
  import { pct, money } from "../format.js";

  let { width } = $props();
  let quoted = $state(104);
  let r = $state(0.04);
  let q = $state(0.015);
  const STEPS = 50;
  const P = paths(normals(4), 40, STEPS, 0.08);
  const H1 = 230, H2 = 250, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X1 = $derived(linear(0, 1, m.left, width - m.right));
  const Y1 = linear(60, 160, H1 - m.bottom, m.top);
  let X2 = $derived(linear(60, 160, m.left, width - m.right));
  const Y2 = linear(-60, 60, H2 - m.bottom, m.top);
  let a = $derived(arbitrage(quoted, S0, r, q));
  let lines = $derived(P.map((p) => bandPath(p.map((v, i) => [X1(i / STEPS), Y1(v)]), m.top, H1 - m.bottom)));
  let carry = $derived(Array.from({ length: 51 }, (_, i) => `${i ? "L" : "M"}${X1(i / 50).toFixed(2)},${Y1(S0 * Math.exp((r - q) * (i / 50))).toFixed(2)}`).join(""));
  const ends = P.map((p) => p[STEPS]);
  const seg = (f) => { const pts = [60, 160].map((s) => [X2(s), Y2(f(s))]); return bandPath(pts, m.top, H2 - m.bottom); };
  let shareLine = $derived(seg((s) => pieces(s, quoted, S0, r, q).share));
  let fwdLine = $derived(seg((s) => pieces(s, quoted, S0, r, q).forward));
  let side = $derived(a.side === "carry" ? "Buy the index, sell forward" : a.side === "reverse" ? "Sell the index, buy forward" : "Nothing to do");
</script>

<div class="controls">
  <Slider id="cl-quoted" label="Quoted price for a year's time" min={96} max={110} step={0.05} bind:value={quoted} format={(v) => money(v, 2)} width={300} />
  <Slider id="cl-r" label="Safe rate" min={0} max={0.08} step={0.0025} bind:value={r} format={(v) => pct(v, 2)} width={200} />
  <Slider id="cl-q" label="Dividend yield" min={0} max={0.05} step={0.0025} bind:value={q} format={(v) => pct(v, 2)} width={200} />
</div>

<p class="panel-title">Forty possible years for the index</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Forty possible years for the index, with the cost of carrying it" class="fan-panel">
  <AxisY scale={Y1} ticks={[60, 80, 100, 120, 140, 160]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H1 - m.bottom} y2={H1 - m.bottom} />
    {#each [0, 0.25, 0.5, 0.75, 1] as t (t)}
      <g transform="translate({X1(t)},{H1 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t * 12}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H1 - 6} text-anchor="middle">months from now</text>
  </g>
  {#each lines as d, i (i)}<path class="path" {d} fill="none" stroke="#c3c9d0" stroke-width="0.9" />{/each}
  <path class="carry" d={carry} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  <circle class="fair" cx={X1(1)} cy={Y1(a.fair)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
  <circle class="quoted" cx={X1(1)} cy={Y1(quoted)} r="5" fill="white" stroke="var(--c2)" stroke-width="2.2" />
</svg>

<p class="panel-title">What each piece pays at the end of the year</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="What the share, the forward and the two together pay against where the index ends" class="pay-panel">
  <AxisY scale={Y2} ticks={[-60, -30, 0, 30, 60]} x0={m.left} x1={width - m.right} format={(t) => (t < 0 ? "−$" + -t : "$" + t)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H2 - m.bottom} y2={H2 - m.bottom} />
    {#each [60, 80, 100, 120, 140, 160] as t (t)}
      <g transform="translate({X2(t)},{H2 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">${t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H2 - 6} text-anchor="middle">where the index ends the year</text>
  </g>
  <path class="share-line" d={shareLine} fill="none" stroke="#8a94a2" stroke-width="1.8" />
  <path class="fwd-line" d={fwdLine} fill="none" stroke="#8a94a2" stroke-width="1.8" stroke-dasharray="6 4" />
  <line class="total" x1={X2(60)} x2={X2(160)} y1={Y2(quoted - a.fair)} y2={Y2(quoted - a.fair)} stroke="var(--c1)" stroke-width="2.6" />
  {#each ends as e, i (i)}
    {#if e > 60 && e < 160}<circle class="end" cx={X2(e)} cy={Y2(quoted - a.fair)} r="3" fill="var(--c1)" opacity="0.7" />{/if}
  {/each}
</svg>
<div class="legend">
  <span><i style="background:var(--c1)"></i>buying now and carrying</span>
  <span><i class="ring"></i>the quoted price</span>
  <span><i style="background:#8a94a2"></i>the index, less the loan that bought it</span>
  <span><i class="dash"></i>the forward we sold</span>
</div>

<div class="readouts">
  <Readout id="cl-fair" label="The cost of carrying" value={money(a.fair, 2)} />
  <Readout id="cl-locked" label="Locked in, per share" value={money(a.locked, 2)} />
  <Readout id="cl-side" label="The trade" value={side} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.85rem; font-weight: 700; color: var(--ink-soft); margin: 0.4rem 0 0.2rem; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #8a94a2 0 6px, transparent 6px 10px); }
  .legend i.ring { width: 10px; height: 10px; border: 2px solid var(--c2); border-radius: 50%; background: white; vertical-align: -1px; }
</style>
