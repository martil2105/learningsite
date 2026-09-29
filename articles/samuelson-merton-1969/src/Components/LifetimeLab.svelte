<script>
  /*
    The hook: the backward solution, run in the browser. For each number of
    years to go (read left to right, as time passes), the best share in stocks
    at three levels of wealth, or after an up year and a down year in the
    mean-reverting market. In Samuelson's case every line lies on the one-year
    share. A floor or returns that revert bring the horizon back.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { pathOf } from "../chart.js";
  import { solve, shareAt, SAMUELSON_SHARE, YEARS } from "../lifetime.js";
  import { pct } from "../format.js";

  let { width, kase = $bindable("samuelson") } = $props();

  const H = 300;
  const m = { top: 14, right: 16, bottom: 46, left: 58 };
  const cache = {};
  const sol = (c) => (cache[c] ??= solve(c)); // solved once, when first shown
  const RAMP = ["#8c82d2", "#5b4ba1", "#311072"];
  const ks = Array.from({ length: YEARS }, (_, i) => YEARS - i);
  let series = $derived(
    kase === "revert"
      ? [
          { key: "down", label: "after a down year", color: "var(--c1)", f: (k) => shareAt(sol("revert"), k, 1, 1) },
          { key: "up", label: "after an up year", color: "var(--c2)", f: (k) => shareAt(sol("revert"), k, 0, 1) },
        ]
      : [4, 2, 1.25].map((W, i) => ({
          key: `w${i}`,
          label: kase === "floor" ? `wealth ${W}× the floor` : `wealth ${W}`,
          color: RAMP[2 - i],
          f: (k) => shareAt(sol(kase), k, 0, W),
        }))
  );
  let x = $derived(linear([YEARS, 1], [m.left, width - m.right]));
  const y = linear([0, 1.8], [H - m.bottom, m.top]);
  let lines = $derived(series.map((s) => ({ ...s, d: pathOf(ks.map((k) => [x(k), y(s.f(k))])) })));
  let mid = $derived(series[kase === "revert" ? 0 : 1]);
</script>

<div class="controls">
  <Segmented label="The setup" id="ll-case" bind:value={kase}
    options={[{ value: "samuelson", label: "Samuelson's" }, { value: "floor", label: "A floor to stay above" }, { value: "revert", label: "Returns that revert" }]} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Best share in stocks by years to go" class="lifetime-lab">
  <AxisY scale={y} ticks={[0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8]} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="best share in stocks" />
  <AxisX scale={x} ticks={[30, 25, 20, 15, 10, 5, 1]} y={H - m.bottom} title="years to go" />
  {#each lines as l (l.key)}
    <path class="share-line {l.key}" d={l.d} fill="none" stroke={l.color} stroke-width="2.4" />
  {/each}
  <line class="one-year" x1={m.left} x2={width - m.right} y1={y(SAMUELSON_SHARE)} y2={y(SAMUELSON_SHARE)} stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" />
</svg>
<p class="legend">
  {#each series as s (s.key)}
    <span class="key"><span class="swatch" style="background:{s.color}"></span>{s.label}</span>
  {/each}
  <span class="key"><span class="swatch dashed"></span>Samuelson's share</span>
</p>
<div class="readouts">
  <Readout id="ll-r-30" label={`30 years to go, ${mid.label}`} value={pct(mid.f(30), 0)} />
  <Readout id="ll-r-1" label={`1 year to go, ${mid.label}`} value={pct(mid.f(1), 0)} />
  <Readout id="ll-r-base" label="Samuelson's share" value={pct(SAMUELSON_SHARE, 0)} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
</style>
