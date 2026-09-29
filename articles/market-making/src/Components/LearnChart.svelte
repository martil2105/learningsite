<script>
  /*
    The average spread against the number of trades, as a share of its opening
    width, for three shares of informed traders, on a log axis of trades. On
    that axis halving the informed share slides the curve right by a factor of
    four. The dots mark where each curve crosses the chosen level.
  */
  import { log10Scale, linear } from "../scale.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { expectedSpreads } from "../gm.js";
  import { thousands } from "../format.js";

  let { width } = $props();

  const H = 270;
  const m = { top: 14, right: 16, bottom: 46, left: 50 };
  const NMAX = 2000;
  const FAMILY = [
    { mu: 0.2, cls: "mu20", color: "#8c82d2", label: "20%" },
    { mu: 0.1, cls: "mu10", color: "#5b4ba1", label: "10%" },
    { mu: 0.05, cls: "mu5", color: "#311072", label: "5%" },
  ];
  // computed once: the average spread before each trade, relative to the first
  const curves = FAMILY.map((f) => {
    const s = expectedSpreads(f.mu, NMAX);
    return Array.from(s, (v) => v / s[0]);
  });
  let level = $state("half");
  let lv = $derived(level === "half" ? 0.5 : 0.1);
  let x = $derived(log10Scale([1, NMAX], [m.left, width - m.right]));
  const y = linear([0, 1], [H - m.bottom, m.top]);
  // c[n] is the average spread after n trades; the log axis starts at one trade
  const pathOf = (c) => {
    let s = "";
    for (let n = 1; n < NMAX; n++) s += `${n > 1 ? "L" : "M"}${x(n).toFixed(2)},${y(c[n]).toFixed(2)}`;
    return s;
  };
  let paths = $derived(curves.map(pathOf));
  let hits = $derived(curves.map((c) => { for (let n = 1; n < NMAX; n++) if (c[n] < lv) return n; return NaN; }));
  const xt = [1, 10, 100, 1000];
</script>

<div class="controls">
  <Segmented label="Mark where the average spread falls to" id="lc-level" bind:value={level} options={[{ value: "half", label: "half its opening width" }, { value: "tenth", label: "a tenth" }]} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The average spread against the number of trades for three shares of informed traders" class="learn-panel">
  <AxisY scale={y} ticks={[0, 0.25, 0.5, 0.75, 1]} x0={m.left} x1={width - m.right} format={(v) => Math.round(100 * v) + "%"} />
  <g class="axis axis-x">
    <line x1={m.left} x2={width - m.right} y1={H - m.bottom} y2={H - m.bottom} />
    {#each xt as t (t)}
      <g transform="translate({x(t)},{H - m.bottom})">
        <line y2="5" />
        <text class="tick-label" y="18" text-anchor="middle">{thousands(t)}</text>
      </g>
    {/each}
    <text class="axis-title" x={(m.left + width - m.right) / 2} y={H - m.bottom + 36} text-anchor="middle">trades so far, on a log scale</text>
  </g>
  <line class="level" x1={m.left} x2={width - m.right} y1={y(lv)} y2={y(lv)} stroke="var(--ink)" stroke-opacity="0.35" stroke-dasharray="4 4" />
  {#each FAMILY as f, i (f.cls)}
    <path class="curve {f.cls}" d={paths[i]} fill="none" stroke={f.color} stroke-width="2.4" />
    {#if Number.isFinite(hits[i])}
      <circle class="hit {f.cls}" cx={x(hits[i])} cy={y(lv)} r="4.5" fill={f.color} stroke="white" stroke-width="1.2" />
    {/if}
  {/each}
</svg>
<p class="legend">
  {#each FAMILY as f (f.cls)}
    <span class="key"><span class="swatch" style="background:{f.color}"></span>{f.label} of traders know</span>
  {/each}
</p>

<div class="readouts">
  {#each FAMILY as f, i (f.cls)}
    <Readout id="lc-r-{f.cls}" label="{f.label} know" value={thousands(hits[i]) + " trades"} color={f.color} />
  {/each}
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
</style>
