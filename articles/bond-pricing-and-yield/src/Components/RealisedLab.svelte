<script>
  /*
    The hook. We buy a bond at an 8% yield and hold it to maturity. Just after
    we buy, rates move to a new level and stay there, and every coupon is
    reinvested at it. Top: what our position is worth, on a log axis; the grey
    dashed line is the promise, the price at 8% grown at 8%, and the blue line
    is the price at the new rate grown at the new rate. Bottom: the money at
    maturity in three parts, promised and real.
  */
  import { linear, log } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { price, worth, atMaturity, realised, macaulay } from "../bonds.js";
  import { pct, money, thousands } from "../format.js";

  let { width } = $props();
  const YB = 0.08;
  let c = $state(0.08);
  let T = $state(30);
  let r = $state(0.04);
  let p0 = $derived(price(c, T, YB));
  let wy = $derived(atMaturity(c, T, YB));
  let wr = $derived(atMaturity(c, T, r));
  let R = $derived(realised(c, T, YB, r));
  let D = $derived(macaulay(c, T, YB));
  // where the two lines cross, if they do
  let cross = $derived.by(() => { const a = Math.log(price(c, T, r) / p0), b = Math.log((1 + YB) / (1 + r)); if (Math.abs(b) < 1e-12) return null; const h = a / b; return h > 1e-6 && h < T - 1e-6 ? h : null; });

  const H1 = 240, m = { top: 12, right: 16, bottom: 42, left: 56 };
  let X = $derived(linear(0, T, m.left, width - m.right));
  const CANDS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let lo = $derived(Math.min(p0, price(c, T, r)) * 0.9);
  let hi = $derived(Math.max(wy.total, wr.total) * 1.1);
  let Y = $derived(log(lo, hi, H1 - m.bottom, m.top));
  let yt = $derived(CANDS.filter((v) => v >= lo && v <= hi));
  const N = 120;
  const line = (f) => Array.from({ length: N + 1 }, (_, i) => { const t = (i / N) * T; return `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(f(t)).toFixed(2)}`; }).join("");
  let promised = $derived(line((t) => worth(c, T, YB, t) * (p0 / price(c, T, YB))));
  let actual = $derived(line((t) => worth(c, T, r, t)));
  let xt = $derived(T <= 10 ? Array.from({ length: T + 1 }, (_, i) => i).filter((t) => T <= 5 || t % 2 === 0) : [0, 5, 10, 15, 20, 25, 30].filter((t) => t <= T));

  // the money at maturity, in three parts
  const H2 = 150, n2 = { top: 22, right: 16, bottom: 30, left: 8 };
  let XB = $derived(linear(0, Math.max(wy.total, wr.total) * 1.05, n2.left, width - n2.right));
  const PARTS = [
    { key: "principal", label: "the $100 back", color: "var(--ink)" },
    { key: "coupons", label: "coupons", color: "var(--c1)" },
    { key: "interest", label: "interest on coupons", color: "var(--c2)" },
  ];
  let rows = $derived([
    { key: "promised", label: `promised, everything at ${pct(YB, 0)}`, w: wy, y: n2.top },
    { key: "real", label: `what we get, coupons at ${pct(r, 2)}`, w: wr, y: n2.top + 62 },
  ]);
  const seg = (w) => { let x = 0; return PARTS.map((p) => { const s = { ...p, x0: x, x1: x + w[p.key] }; x += w[p.key]; return s; }); };
</script>

<div class="controls">
  <Slider id="rl-c" label="Coupon" min={0} max={0.12} step={0.005} bind:value={c} format={(v) => pct(v, 1)} width={200} />
  <Slider id="rl-t" label="Years to maturity" min={1} max={30} step={1} bind:value={T} format={(v) => String(v)} width={200} />
  <Slider id="rl-r" label="New rate, after we buy" min={0} max={0.12} step={0.0025} bind:value={r} format={(v) => pct(v, 2)} width={200} />
</div>

<p class="panel-title">What our position is worth, bought at {money(p0, 2)}</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="The value of the position over the bond's life" class="worth-panel">
  <AxisY scale={Y} ticks={yt} x0={m.left} x1={width - m.right} format={(t) => "$" + t.toLocaleString("en-GB")} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H1 - m.bottom} y2={H1 - m.bottom} />
    {#each xt as t (t)}
      <g transform="translate({X(t)},{H1 - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H1 - 6} text-anchor="middle">years after we buy</text>
  </g>
  <path class="promised" d={promised} fill="none" stroke="#5f6b7a" stroke-width="1.8" stroke-dasharray="6 4" />
  <path class="actual" d={actual} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  {#if cross !== null}
    <circle class="cross" cx={X(cross)} cy={Y(worth(c, T, r, cross))} r="4.5" fill="white" stroke="var(--ink)" stroke-width="1.6" />
  {/if}
</svg>
<div class="legend">
  <span><i class="dash"></i>the promise: everything at {pct(YB, 0)}</span>
  <span><i style="background:var(--c1)"></i>at the new rate</span>
</div>

<p class="panel-title">The money at maturity</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The money at maturity, in three parts" class="parts-panel">
  {#each rows as row (row.key)}
    <text class="row-label" x={n2.left} y={row.y - 6}>{row.label}: ${thousands(row.w.total)}</text>
    {#each seg(row.w) as s (s.key)}
      <rect class="part {row.key} {s.key}" x={XB(s.x0)} width={Math.max(0, XB(s.x1) - XB(s.x0))} y={row.y} height="26" fill={s.color} />
    {/each}
  {/each}
  <g class="axis axis-x">
    <line x1={n2.left} x2={width - n2.right} y1={H2 - n2.bottom} y2={H2 - n2.bottom} />
  </g>
</svg>
<div class="legend">
  {#each PARTS as p (p.key)}<span><i style="background:{p.color}"></i>{p.label}</span>{/each}
</div>

<div class="readouts">
  <Readout id="rl-real" label="What we earn a year" value={pct(R, 2)} />
  <Readout id="rl-d" label="Average wait for the money" value={`${D.toFixed(1)} years`} />
  <Readout id="rl-share" label="Average wait over maturity" value={pct(D / T, 0)} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .row-label { font-size: 12px; fill: var(--ink-soft); font-weight: 600; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #5f6b7a 0 6px, transparent 6px 10px); }
</style>
