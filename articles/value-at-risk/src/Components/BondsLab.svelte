<script>
  /*
    The hook. $100 split over n bonds. Top: the worst tenth of outcomes as
    the quantile function (loss against level u, 90% to 100%). The value at
    risk is its height at α (pink dot); the shaded area beyond α, divided by
    1 − α, is the expected shortfall, drawn as the dashed rectangle of the
    same area. Bottom: both numbers against the number of bonds, on a log
    axis, with the expected loss (where both end up with many bonds).
  */
  import { linear, log } from "../chart.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { losses, varOf, esOf, quantileSteps, bonds, STAKE, LGD, P } from "../risk.js";
  import { money, pct } from "../format.js";

  let { width, n = $bindable(1), alpha = $bindable(0.95) } = $props();
  const U0 = 0.9;
  let dist = $derived(losses(n));
  let v = $derived(varOf(dist, alpha));
  let es = $derived(esOf(dist, alpha));
  let steps = $derived(quantileSteps(dist).filter(([a, b]) => b > U0));
  const H1 = 260, H2 = 230, m = { top: 14, right: 16, bottom: 44, left: 50 };
  let X1 = $derived(linear(U0, 1, m.left, width - m.right));
  const nice = (x) => { const c = [10, 20, 40, 60, 80]; return c.find((t) => t >= x) ?? 80; };
  let ymax = $derived(nice(1.15 * Math.max(es, v, ...steps.filter(([a]) => a < 0.999).map(([, , l]) => l))));
  let Y1 = $derived(linear(0, ymax, H1 - m.bottom, m.top));
  let y1ticks = $derived(Array.from({ length: 5 }, (_, i) => (ymax * i) / 4));
  const clampU = (u) => Math.min(1, Math.max(U0, u));
  let qPath = $derived(steps.map(([a, b, l], i) => `${i ? "L" : "M"}${X1(clampU(a)).toFixed(2)},${Y1(Math.min(l, ymax)).toFixed(2)}L${X1(clampU(b)).toFixed(2)},${Y1(Math.min(l, ymax)).toFixed(2)}`).join(""));
  let area = $derived.by(() => {
    let d = `M${X1(alpha).toFixed(2)},${Y1(0).toFixed(2)}`;
    for (const [a, b, l] of steps) {
      const lo = Math.max(a, alpha), hi = Math.min(b, 1);
      if (hi <= lo) continue;
      d += `L${X1(lo).toFixed(2)},${Y1(Math.min(l, ymax)).toFixed(2)}L${X1(hi).toFixed(2)},${Y1(Math.min(l, ymax)).toFixed(2)}`;
    }
    return d + `L${X1(1).toFixed(2)},${Y1(0).toFixed(2)}Z`;
  });

  let X2 = $derived(log(1, 100, m.left, width - m.right));
  const Y2 = linear(0, 70, H2 - m.bottom, m.top);
  const NS = Array.from({ length: 100 }, (_, i) => i + 1);
  const stepPath = (vals) => vals.map((y, i) => `${i ? "L" : "M"}${X2(NS[i]).toFixed(2)},${Y2(y).toFixed(2)}${i < vals.length - 1 ? "L" + X2(NS[i + 1]).toFixed(2) + "," + Y2(y).toFixed(2) : ""}`).join("");
  let curves = $derived.by(() => { const vs = [], es2 = []; for (const k of NS) { const b = bonds(k, alpha); vs.push(b.var); es2.push(b.es); } return { v: stepPath(vs), e: stepPath(es2) }; });
  const EL = STAKE * LGD * P;
  let b = $derived(bonds(n, alpha));
</script>

<div class="controls">
  <Slider id="bl-n" label="Bonds the $100 is split over" min={1} max={100} step={1} bind:value={n} format={(x) => String(x)} width={300} />
  <Segmented id="bl-a" label="Level" options={[{ value: 0.95, label: "95%" }, { value: 0.99, label: "99%" }]} bind:value={alpha} />
</div>

<p class="panel-title">The worst tenth of years</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="The loss at each level, from 90% to 100%" class="quantile-panel">
  <AxisY scale={Y1} ticks={y1ticks} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <AxisX scale={X1} ticks={[0.9, 0.92, 0.94, 0.96, 0.98, 1]} y={H1 - m.bottom} format={(t) => pct(t, 0)} title="level: the share of years with a smaller loss" />
  <path class="area" d={area} fill="var(--c1)" fill-opacity="0.25" />
  <rect class="es-rect" x={X1(alpha)} width={X1(1) - X1(alpha)} y={Y1(Math.min(es, ymax))} height={Y1(0) - Y1(Math.min(es, ymax))} fill="none" stroke="var(--c1)" stroke-width="2" stroke-dasharray="5 4" />
  <path class="quantile" d={qPath} fill="none" stroke="var(--ink)" stroke-width="2" />
  <line class="alpha" x1={X1(alpha)} x2={X1(alpha)} y1={m.top} y2={H1 - m.bottom} stroke="var(--c2)" stroke-width="1.4" stroke-dasharray="3 3" />
  <circle class="var-dot" cx={X1(alpha)} cy={Y1(v)} r="5.5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  <span><i style="background:var(--ink)"></i>loss at each level</span>
  <span><i style="background:var(--c2)"></i>value at risk</span>
  <span><i class="dash"></i>expected shortfall: same area as the shading</span>
</div>

<p class="panel-title">Both numbers, for every number of bonds</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Value at risk and expected shortfall against the number of bonds" class="bynumber-panel">
  <AxisY scale={Y2} ticks={[0, 10, 20, 30, 40, 50, 60, 70]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H2 - m.bottom} y2={H2 - m.bottom} />
    {#each [1, 2, 5, 10, 20, 50, 100] as t (t)}
      <g transform="translate({X2(t)},{H2 - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{t}</text>
      </g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H2 - 8} text-anchor="middle">bonds (log scale)</text>
  </g>
  <line class="expected" x1={m.left} x2={width - m.right} y1={Y2(EL)} y2={Y2(EL)} stroke="#8a94a2" stroke-width="1.6" stroke-dasharray="5 4" />
  <path class="es-curve" d={curves.e} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <path class="var-curve" d={curves.v} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <circle class="es-dot" cx={X2(n)} cy={Y2(b.es)} r="5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
  <circle class="var-dot2" cx={X2(n)} cy={Y2(b.var)} r="5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
</svg>
<div class="legend">
  <span><i style="background:var(--c2)"></i>value at risk</span>
  <span><i style="background:var(--c1)"></i>expected shortfall</span>
  <span><i class="dash grey"></i>average loss</span>
</div>

<div class="readouts">
  <Readout id="bl-r-var" label="Value at risk" value={money(v, 2)} color="var(--c2)" />
  <Readout id="bl-r-es" label="Expected shortfall" value={money(es, 2)} color="var(--c1)" />
  <Readout id="bl-r-any" label="Chance of any default" value={pct(b.anyDefault, 1)} />
  <Readout id="bl-r-el" label="Average loss" value={money(EL, 2)} />
</div>

<style>
  svg { display: block; }
  .panel-title { font-size: 0.9rem; font-weight: 700; margin: 0.6rem 0 0.2rem; color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--c1) 0 5px, transparent 5px 9px); }
  .legend i.dash.grey { background: repeating-linear-gradient(90deg, #8a94a2 0 5px, transparent 5px 9px); }
</style>
