<script>
  /* The two effects, drawn on one axis so their sizes are comparable. Free time
     only: hours worked is the same statement backwards. */
  import { linear, ticks, clampW } from "../chart.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { BASE } from "../datasets.js";
  import { hicks } from "../choice.js";

  const H = 232;
  const M = { top: 46, right: 22, bottom: 40, left: 22 };
  const T = BASE.T;
  const p = { a: BASE.a, sigma: 1, T };
  const W0 = 25;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let w1 = $state(400);

  let x = $derived(linear(0, T, M.left + 18, W - M.right - 18));
  let d = $derived(hicks(W0, w1, p));

  const ROW = { sub: 100, inc: 142, net: 176 };

  let readout = $derived(
    `Going from ${W0} kr to ${w1} kr an hour: the substitution effect takes ${Math.abs(d.substitution).toFixed(2)} hours of free time away, the income effect hands ${Math.abs(d.income).toFixed(2)} back, and the worker ends the day exactly where they started.`
  );
  let netLabel = $derived(
    Math.abs(d.total) < 1e-12
      ? "net change: 0.00 hours"
      : `net change: ${d.total.toFixed(2)} hours`
  );

  let xTicks = $derived(ticks(0, T, 4));

  function arrow(from, to, yy) {
    const x1 = x(from), x2 = x(to);
    const dir = x2 >= x1 ? 1 : -1;
    const head = Math.min(9, Math.abs(x2 - x1) / 2);
    return {
      line: `M ${x1} ${yy} L ${x2 - dir * head} ${yy}`,
      head: `M ${x2} ${yy} L ${x2 - dir * head} ${yy - 5} L ${x2 - dir * head} ${yy + 5} Z`,
      mid: (x1 + x2) / 2,
    };
  }

  let aSub = $derived(arrow(d.f0, d.fh, ROW.sub));
  let aInc = $derived(arrow(d.fh, d.f1, ROW.inc));
</script>

<div class="fig" id="decomposition">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <p class="fig-title">{readout}</p>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g class="axis">
        {#each xTicks as t}
          <line x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} class="grid" />
          <text x={x(t)} y={H - M.bottom + 16} text-anchor="middle">{t}</text>
        {/each}
        <line x1={x(0)} y1={H - M.bottom} x2={x(T)} y2={H - M.bottom} class="rule" />
        <text class="axis-title" x={(x(0) + x(T)) / 2} y={H - 4} text-anchor="middle">
          free time, hours
        </text>
      </g>

      <line class="start" x1={x(d.f0)} y1={M.top - 14} x2={x(d.f0)} y2={H - M.bottom}
        stroke={BACKGROUND_CLASS} />
      <text class="lab" x={x(d.f0)} y={M.top - 20} text-anchor="middle">start and finish</text>

      <path d={aSub.line} stroke={SERIES[1]} class="arrow" fill="none" />
      <path d={aSub.head} fill={SERIES[1]} />
      <text class="tag" x={aSub.mid} y={ROW.sub - 10} text-anchor="middle">
        substitution −{Math.abs(d.substitution).toFixed(2)} h
      </text>

      <path d={aInc.line} stroke={SERIES[0]} class="arrow" fill="none" />
      <path d={aInc.head} fill={SERIES[0]} />
      <text class="tag" x={aInc.mid} y={ROW.inc - 10} text-anchor="middle">
        income +{Math.abs(d.income).toFixed(2)} h
      </text>

      <circle cx={x(d.f1)} cy={ROW.net} r="6" fill={SERIES[2]} />
    </svg>
  </div>

  <p class="net">{netLabel}</p>

  <label class="ctl">
    new wage, kr per hour
    <input type="range" min="30" max="400" step="5" bind:value={w1} />
    <span class="val">{w1}</span>
  </label>
</div>

<style>
  .fig { max-width: 680px; margin: 1.8rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title {
    font-family: var(--font-main); font-size: 0.95rem; line-height: 1.45;
    margin: 0 0 0.5rem 0; color: var(--squid-ink);
  }
  .plot svg { display: block; max-width: 100%; height: auto; }
  .arrow { stroke-width: 2.5; }
  .start { stroke-width: 1.5; stroke-dasharray: 4 3; }
  .axis text { font-family: var(--font-mono); font-size: 11px; fill: #8a94a2; }
  .axis-title { font-family: var(--font-main); }
  .lab { font-family: var(--font-main); font-size: 11px; fill: #8a94a2; }
  .tag {
    font-family: var(--font-mono); font-size: 11px; fill: var(--squid-ink);
    stroke: #fff; stroke-width: 3px; paint-order: stroke;
  }
  .net {
    font-family: var(--font-mono); font-size: 0.85rem; color: #2f7d32;
    margin: 0.5rem 0 0 0; line-height: 1.45;
  }
  .grid { stroke: #eef1f2; stroke-width: 1; }
  .rule { stroke: #8a94a2; stroke-width: 1; }
  .ctl {
    display: flex; align-items: center; gap: 0.6rem;
    font-family: var(--font-main); font-size: 0.9rem; margin-top: 0.7rem;
    color: var(--squid-ink);
  }
  .ctl input { flex: 1; min-width: 110px; accent-color: #7c5aed; }
  .val { font-family: var(--font-mono); min-width: 2.6rem; text-align: right; }
</style>
