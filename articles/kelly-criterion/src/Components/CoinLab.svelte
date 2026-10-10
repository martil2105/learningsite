<script>
  /*
    Sixty-one seeded players, 300 flips each, all betting the same share of
    their money on heads every flip. Grey lines are the players' money on a
    log axis (clipped to the window), the blue line is the typical path
    25·exp(t·g(f)), the dashed line is the $25 start and the green line is
    the experiment's $250 cap. Changing the share keeps every player's flips.
  */
  import { linear, log } from "../chart.js";
  import { bandPath } from "../clip.js";
  import AxisX from "./AxisX.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { players, wealthAfter, growth, everBelow, START, CAP, FLIPS, PLAYERS } from "../kelly.js";
  import { thousands } from "../format.js";

  let { width, share = $bindable(50) } = $props();
  const P = players();
  const H = 320, m = { top: 12, right: 14, bottom: 42, left: 50 };
  const LO = 0.01, HI = 1e6;
  let X = $derived(linear(0, FLIPS, m.left, width - m.right));
  const Y = log(LO, HI, H - m.bottom, m.top);
  const YT = [0.01, 1, 100, 1e4, 1e6];
  const ylab = (v) => (v < 1 ? "1¢" : v >= 1e6 ? "$1M" : v >= 1e3 ? "$" + v / 1e3 + "k" : "$" + v);
  let f = $derived(share / 100);
  // paths in screen units, cut where they leave the window
  const T = m.top, BOT = H - m.bottom;
  const pathFor = (h, f) => bandPath(Array.from(h, (k, t) => [X(t), Y(Math.max(1e-300, wealthAfter(f, k, t)))]), T, BOT);
  let lines = $derived(P.map((h) => pathFor(h, f)));
  let typical = $derived(
    bandPath(Array.from({ length: 61 }, (_, i) => { const t = (i * FLIPS) / 60; return [X(t), Y(START * Math.exp(t * growth(f)))]; }), T, BOT)
  );
  let finals = $derived(P.map((h) => wealthAfter(f, h[FLIPS], FLIPS)).sort((a, b) => a - b));
  let median = $derived(finals[(PLAYERS - 1) / 2]);
  let behind = $derived(finals.filter((w) => w < START).length);
  let halved = $derived(P.filter((h) => everBelow(h, f, START / 2)).length);
  let capped = $derived(P.filter((h) => h.some((k, t) => wealthAfter(f, k, t) >= CAP)).length);
  const money = (w) => (w < 0.01 ? "under 1¢" : w < 1 ? Math.round(w * 100) + "¢" : "$" + thousands(w));
</script>

<div class="controls">
  <Slider id="cl-share" label="Share bet on every flip" min={1} max={100} step={1} bind:value={share} format={(v) => v + "%"} width={300} />
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="Sixty-one players' money over 300 flips, on a log scale" class="coin-panel">
  <g class="axis axis-y">
    {#each YT as t (t)}
      <g class="grid"><line x1={m.left} x2={width - m.right} y1={Y(t)} y2={Y(t)} /></g>
      <text class="tick-label" x={m.left - 6} y={Y(t) + 4} text-anchor="end">{ylab(t)}</text>
    {/each}
  </g>
  <AxisX scale={X} ticks={[0, 100, 200, 300]} y={H - m.bottom} title="flips" />
  <g class="paths">
    {#each lines as d, i (i)}
      <path class="player" d={d} fill="none" stroke="#8a94a2" stroke-opacity="0.38" stroke-width="1" />
    {/each}
    <path class="typical" d={typical} fill="none" stroke="var(--c1)" stroke-width="2.6" />
  </g>
  <line class="start" x1={m.left} x2={width - m.right} y1={Y(START)} y2={Y(START)} stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4" />
  <line class="cap" x1={m.left} x2={width - m.right} y1={Y(CAP)} y2={Y(CAP)} stroke="var(--c3)" stroke-width="1.6" stroke-dasharray="2 3" />
  <text class="cap-label" x={width - m.right - 4} y={Y(CAP) - 5} text-anchor="end">$250 cap</text>
</svg>

<div class="legend">
  <span><i style="background:#8a94a2"></i>one player</span>
  <span><i style="background:var(--c1)"></i>typical path</span>
  <span><i class="dash"></i>$25 start</span>
</div>

<div class="readouts">
  <Readout id="cl-r-median" label="Middle player after 300 flips" value={money(median)} color="var(--c1)" />
  <Readout id="cl-r-behind" label="Behind their $25" value={behind + " of 61"} />
  <Readout id="cl-r-halved" label="Cut to half at some point" value={halved + " of 61"} />
  <Readout id="cl-r-cap" label="Reached $250" value={capped + " of 61"} color="var(--c3)" />
</div>

<style>
  svg { display: block; }
  .cap-label { font-size: 11px; fill: var(--c3); font-weight: 600; stroke: #fff; stroke-width: 3px; paint-order: stroke; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; }
  .legend i { display: inline-block; width: 18px; height: 3px; margin-right: 6px; vertical-align: 3px; }
  .legend i.dash { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 9px); }
</style>
