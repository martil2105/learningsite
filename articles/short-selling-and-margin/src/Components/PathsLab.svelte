<script>
  /*
    Forty possible years for one stock, each a path of daily prices with no
    drift in the log, on a log price axis. The
    blue line is where a long bought on 50% margin is called, the pink line
    where a short is. A dot marks the first day a path touches each line. The
    small chart below it is the chance of a call within the year against the
    volatility, from the reflection principle, with the chosen volatility
    marked.
  */
  import { linear, log10Scale } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { paths, firstTouch, callPrice, callChance, DAYS } from "../margin.js";
  import { pct } from "../format.js";

  let { width, sigma = $bindable(0.3) } = $props();

  const N = 40, SEED = 21;
  const H = 300, H2 = 190;
  const m = { top: 12, right: 16, bottom: 44, left: 52 };
  let x = $derived(linear([0, DAYS], [m.left, width - m.right]));
  const y = log10Scale([45, 220], [H - m.bottom, m.top]);
  let P = $derived(paths(N, sigma, SEED));
  const LONG = callPrice("long"), SHORT = callPrice("short");
  // clip each path to the window: stop drawing once it leaves
  const pathD = (p) => {
    let s = "", open = false;
    for (let d = 0; d <= DAYS; d++) {
      const v = p[d];
      if (v >= 45 && v <= 220) { s += `${open ? "L" : "M"}${x(d).toFixed(1)},${y(v).toFixed(1)}`; open = true; } else open = false;
    }
    return s;
  };
  let drawn = $derived(P.map((p, i) => ({ i, d: pathD(p), lt: firstTouch(p, LONG, "long"), st: firstTouch(p, SHORT, "short") })));
  let nLong = $derived(drawn.filter((q) => q.lt >= 0).length);
  let nShort = $derived(drawn.filter((q) => q.st >= 0).length);
  let chLong = $derived(callChance("long", sigma));
  let chShort = $derived(callChance("short", sigma));

  // the chance chart
  const m2 = { top: 12, right: 16, bottom: 44, left: 52 };
  let x2 = $derived(linear([0.1, 0.6], [m2.left, width - m2.right]));
  const y2 = linear([0, 1], [H2 - m2.bottom, m2.top]);
  const SIGS = Array.from({ length: 101 }, (_, i) => 0.1 + (0.5 * i) / 100);
  const curve = (side) => SIGS.map((s, i) => `${i ? "L" : "M"}${x2(s).toFixed(2)},${y2(callChance(side, s)).toFixed(2)}`).join("");
  let longD = $derived(curve("long"));
  let shortD = $derived(curve("short"));
</script>

<div class="controls">
  <Slider label="Volatility of the stock" id="pl-s" min={0.1} max={0.6} step={0.05} bind:value={sigma} format={(v) => pct(+v, 0)} width={260} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Forty possible years of daily prices, with the prices at which a long and a short are called" class="paths-panel">
  <AxisY scale={y} ticks={[50, 75, 100, 150, 200]} x0={m.left} x1={width - m.right} format={(v) => "$" + v} />
  <AxisX scale={x} ticks={[0, 63, 126, 189, 252]} y={H - m.bottom} format={(v) => ["start", "3 months", "6 months", "9 months", "a year"][v / 63]} />
  {#each drawn as q (q.i)}
    <path class="price" d={q.d} fill="none" stroke="#8a94a2" stroke-opacity="0.45" stroke-width="1" />
  {/each}
  <line class="short-call" x1={m.left} x2={width - m.right} y1={y(SHORT)} y2={y(SHORT)} stroke="var(--c2)" stroke-width="2" />
  <line class="long-call" x1={m.left} x2={width - m.right} y1={y(LONG)} y2={y(LONG)} stroke="var(--c1)" stroke-width="2" />
  {#each drawn as q (q.i)}
    {#if q.st >= 0}<circle class="touch short" cx={x(q.st)} cy={y(SHORT)} r="3.5" fill="var(--c2)" stroke="white" stroke-width="1" />{/if}
    {#if q.lt >= 0}<circle class="touch long" cx={x(q.lt)} cy={y(LONG)} r="3.5" fill="var(--c1)" stroke="white" stroke-width="1" />{/if}
  {/each}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>a short is called ($115.38)</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>a long is called ($66.67)</span>
  <span class="key"><span class="swatch" style="background:#8a94a2"></span>one possible year</span>
</p>

<div class="readouts">
  <Readout id="pl-r-nshort" label="Of these 40 years, short called" value={String(nShort)} color="var(--c2)" />
  <Readout id="pl-r-nlong" label="Of these 40 years, long called" value={String(nLong)} color="var(--c1)" />
  <Readout id="pl-r-cshort" label="Chance a short is called in a year" value={pct(chShort, 1)} color="var(--c2)" />
  <Readout id="pl-r-clong" label="Chance a long is called in a year" value={pct(chLong, 1)} color="var(--c1)" />
</div>

<p class="sub-title">The chance of a call within a year, by volatility</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="The chance of a margin call within a year against the stock's volatility, for a long and a short" class="chance-panel">
  <AxisY scale={y2} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m2.left} x1={width - m2.right} format={(v) => pct(v, 0)} />
  <AxisX scale={x2} ticks={[0.1, 0.2, 0.3, 0.4, 0.5, 0.6]} y={H2 - m2.bottom} format={(v) => pct(v, 0)} title="volatility" />
  <path class="chance short" d={shortD} fill="none" stroke="var(--c2)" stroke-width="2.4" />
  <path class="chance long" d={longD} fill="none" stroke="var(--c1)" stroke-width="2.4" />
  <line class="s-marker" x1={x2(sigma)} x2={x2(sigma)} y1={m2.top} y2={H2 - m2.bottom} stroke="var(--ink)" stroke-opacity="0.5" />
  <circle class="dot short" cx={x2(sigma)} cy={y2(chShort)} r="4.5" fill="var(--c2)" stroke="white" stroke-width="1.2" />
  <circle class="dot long" cx={x2(sigma)} cy={y2(chLong)} r="4.5" fill="var(--c1)" stroke="white" stroke-width="1.2" />
</svg>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .sub-title { font-size: 0.92rem; font-weight: 700; margin: 1.2rem 0 0.2rem; color: var(--ink); }
</style>
