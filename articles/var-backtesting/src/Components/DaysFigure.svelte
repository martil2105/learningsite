<script>
  /*
    How many days of exceptions it takes to catch a model whose real rate is
    above 1%. A one-sided test rejects when the count reaches the smallest c
    with P(K ≥ c | 1%) ≤ 5%; each curve is its chance of rejecting a model with
    a higher real rate, against the days of data on a log axis. The dot is
    where the curve stops dipping under 80%.
  */
  import { linear, log } from "../chart.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { power, daysToCatch, YEAR } from "../backtest.js";
  import { pct, thousands } from "../format.js";

  let { width } = $props();
  const RATES = [
    { value: 0.015, label: "1.5%", color: "var(--c3)", cls: "r15" },
    { value: 0.02, label: "2%", color: "var(--c2)", cls: "r20" },
    { value: 0.03, label: "3%", color: "var(--c1)", cls: "r30" },
  ];
  let pick = $state(0.02);
  const H = 280, m = { top: 14, right: 16, bottom: 44, left: 46 };
  const D0 = 100, D1 = 10000;
  let X = $derived(log(D0, D1, m.left, width - m.right));
  const Y = linear(0, 1, H - m.bottom, m.top);
  // every day count to 400, then thinner: the jags have a period of about 100 days
  const NS = (() => { const o = []; for (let n = D0; n <= D1; n += n < 400 ? 1 : n < 1000 ? 2 : n < 3000 ? 5 : 10) o.push(n); return o; })();
  const curves = RATES.map((r) => ({ ...r, pts: NS.map((n) => [n, power(n, r.value)]) }));
  const caught = Object.fromEntries(RATES.map((r) => [r.value, daysToCatch(r.value, 0.8, 9000)]));
  let pathOf = $derived((pts) => pts.map(([n, q], i) => `${i ? "L" : "M"}${X(n).toFixed(2)},${Y(q).toFixed(2)}`).join(""));
  let days = $derived(caught[pick]);
  const xt = [100, 250, 1000, 2500, 10000];
</script>

<div class="controls">
  <Segmented id="df-rate" label="The model's real rate" options={RATES.map((r) => ({ value: r.value, label: r.label }))} bind:value={pick} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The chance of catching a model against the days of data" class="days-panel">
  <AxisY scale={Y} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]} x0={m.left} x1={width - m.right} format={(t) => pct(t, 0)} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each xt as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{thousands(t)}</text>
      </g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">days of data (log scale)</text>
  </g>
  <line class="target" x1={m.left} x2={width - m.right} y1={Y(0.8)} y2={Y(0.8)} stroke="#5f6b7a" stroke-width="1.4" stroke-dasharray="5 4" />
  <line class="size" x1={m.left} x2={width - m.right} y1={Y(0.05)} y2={Y(0.05)} stroke="#8a94a2" stroke-width="1.2" stroke-dasharray="2 3" />
  <line class="one-year" x1={X(YEAR)} x2={X(YEAR)} y1={m.top} y2={H - m.bottom} stroke="#8a94a2" stroke-width="1.2" />
  {#each curves as c (c.cls)}
    <path class="power {c.cls}" class:dim={c.value !== pick} d={pathOf(c.pts)} fill="none" stroke={c.color} stroke-width={c.value === pick ? 2.2 : 1.3} />
  {/each}
  <circle class="caught" cx={X(days)} cy={Y(0.8)} r="5.5" fill={RATES.find((r) => r.value === pick).color} stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  {#each RATES as r (r.cls)}<span><i style="background:{r.color}"></i>real rate {r.label}</span>{/each}
  <span><i class="dash"></i>80% of the time</span>
  <span><i class="dot"></i>5%: a right model, by bad luck</span>
</div>

<div class="readouts">
  <Readout id="df-days" label="Days until it's caught 80% of the time" value={thousands(days)} />
  <Readout id="df-years" label="Years of 250 days" value={(days / YEAR).toFixed(1)} />
  <Readout id="df-one" label="Chance it's caught in one year" value={pct(power(YEAR, pick), 0)} />
</div>

<style>
  svg { display: block; }
  .power.dim { opacity: 0.45; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, #5f6b7a 0 5px, transparent 5px 9px); }
  .legend i.dot { background: repeating-linear-gradient(90deg, #8a94a2 0 2px, transparent 2px 5px); }
</style>
