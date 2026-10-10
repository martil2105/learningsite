<script>
  /*
    Default before the debt is due. 200 seeded years of our firm's assets,
    growing at the real expected rate (a Sharpe ratio of 0.2), with the debt
    as a dashed line at $70. Under Merton's rule a path defaults only if it
    ends below the debt; under Black and Cox's, if it touches the debt at any
    point in the year. Paths that default under the chosen rule are pink.
  */
  import { linear } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { solve, paths, pdP, firstPassage, F, R } from "../merton.js";
  import { normals } from "../random.js";
  import { pct } from "../format.js";

  let { width } = $props();
  const SEED = 105, N = 200, STEPS = 100, LAM = 0.2;
  const x = solve(), mu = R + LAM * x.s;
  const P = paths(x.V, x.s, mu, normals(SEED), N, STEPS);
  const ends = P.map((p) => p[STEPS] < F), touches = P.map((p) => p.some((v) => v < F));
  let rule = $state("end");
  const H = 300, m = { top: 12, right: 16, bottom: 44, left: 52 };
  let X = $derived(linear(0, STEPS, m.left, width - m.right));
  const Y = linear(60, 170, H - m.bottom, m.top);
  let lines = $derived(P.map((p) => bandPath(p.map((v, i) => [X(i), Y(v)]), m.top, H - m.bottom)));
  let hit = $derived(rule === "end" ? ends : touches);
  let count = $derived(hit.filter(Boolean).length);
</script>

<div class="controls">
  <Segmented id="pf-rule" label="A default is when the assets" options={[{ value: "end", label: "end the year below $70" }, { value: "touch", label: "touch $70 at any point" }]} bind:value={rule} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="A year of the firm's assets, two hundred times" class="paths-panel">
  <AxisY scale={Y} ticks={[60, 80, 100, 120, 140, 160]} x0={m.left} x1={width - m.right} format={(t) => "$" + t} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each [0, 25, 50, 75, 100] as t (t)}
      <g transform="translate({X(t)},{H - m.bottom})"><line y2="5" /><text class="tick-label" y="18" text-anchor="middle">{t === 0 ? "now" : t === 100 ? "a year" : t / 100 + " yr"}</text></g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - 6} text-anchor="middle">through the year</text>
  </g>
  {#each lines as d, i (i)}
    {#if !hit[i]}<path class="path ok" {d} fill="none" stroke="#c3c9d0" stroke-width="0.8" />{/if}
  {/each}
  {#each lines as d, i (i)}
    {#if hit[i]}<path class="path bad" {d} fill="none" stroke="var(--c2)" stroke-width="1.6" />{/if}
  {/each}
  <line class="debt" x1={m.left} x2={width - m.right} y1={Y(F)} y2={Y(F)} stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="6 4" />
</svg>
<div class="legend">
  <span><i class="dash"></i>the debt, $70</span>
  <span><i style="background:var(--c2)"></i>a default under this rule</span>
</div>

<div class="readouts">
  <Readout id="pf-n" label="Pink lines, of 200" value={String(count)} />
  <Readout id="pf-p" label="The real chance, from the formula" value={pct(rule === "end" ? pdP(x.V, x.s, mu) : firstPassage(x.V, x.s, mu), 2)} />
</div>

<style>
  svg { display: block; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 6px, transparent 6px 10px); }
</style>
