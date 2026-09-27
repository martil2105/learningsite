<script>
  /*
    A small line chart for the sweeps in the article: an x value (an amount, a
    ring size, a number of noise features) against one to four series. A
    slider picks an x and the readout lists every series there, so the reader
    can read values rather than estimate them.

    series: [{ name, cls, colour, ys, dash? }]   ys aligned with xs
  */
  import { linear, log, ticks, logTicks, shortN, pathOf, clampW } from "../chart.js";

  let {
    id, title, xs, series, xLabel, yLabel, yMax = null, yMin = 0, xLog = false,
    yFormat = (v) => String(v), xFormat = (v) => shortN(v), initial = null, xAsIndex = false, children,
  } = $props();

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 230;
  const M = { top: 12, right: 14, bottom: 42, left: 44 };

  let top = $derived(yMax ?? Math.max(...series.flatMap((s) => s.ys)) * 1.08);
  // xAsIndex: evenly spaced categories (e.g. 1, 5, 10, 20, 40), labelled by value.
  let xpos = $derived(xAsIndex ? xs.map((_, i) => i) : xs);
  let x = $derived(
    xAsIndex ? linear(0, xs.length - 1, M.left, W - M.right)
      : xLog ? log(Math.min(...xs), Math.max(...xs), M.left, W - M.right)
      : linear(Math.min(...xs), Math.max(...xs), M.left, W - M.right)
  );
  let y = $derived(linear(yMin, top, H - M.bottom, M.top));
  let yt = $derived(ticks(yMin, top, 4));
  let xt = $derived(xAsIndex ? xpos : xLog ? logTicks(Math.min(...xs), Math.max(...xs), true) : ticks(Math.min(...xs), Math.max(...xs), 5));

  let userIdx = $state(null);
  let sel = $derived(userIdx ?? (initial !== null ? Math.max(0, xs.indexOf(initial)) : 0));
</script>

<div class="fig series-figure" {id}>
  <p class="fig-title">{title}</p>
  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      {#each yt as t}
        <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={M.left - 6} y={y(t) + 3.5} text-anchor="end">{yFormat(t)}</text>
      {/each}
      {#each xt as t}
        <text class="tick" x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{xAsIndex ? xFormat(xs[t]) : xFormat(t)}</text>
      {/each}
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 6} text-anchor="middle">{xLabel}</text>
      <text class="axis-title" transform={`translate(11 ${(M.top + H - M.bottom) / 2}) rotate(-90)`} text-anchor="middle">{yLabel}</text>
      <line class="sel-line" x1={x(xpos[sel])} x2={x(xpos[sel])} y1={M.top} y2={H - M.bottom} />
      {#each series as s}
        <path class="curve {s.cls}" d={pathOf(xpos.map((v, i) => [x(v), y(s.ys[i])]))} stroke={s.colour} stroke-dasharray={s.dash ?? null} />
        {#each xpos as v, i}
          <circle class="pt {s.cls}" cx={x(v)} cy={y(s.ys[i])} r={i === sel ? 4.5 : 2.6} fill={s.colour} />
        {/each}
      {/each}
    </svg>
  </div>
  <label class="slider">
    <span class="s-name">{xLabel} <b>{xFormat(xs[sel])}</b></span>
    <input type="range" min="0" max={xs.length - 1} step="1" bind:value={() => sel, (v) => (userIdx = +v)} />
  </label>
  <p class="legend">
    {#each series as s}
      <span class="key"><span class="swatch" style="background: {s.colour}"></span>{s.name} <b>{yFormat(s.ys[sel])}</b></span>
    {/each}
  </p>
  {#if children}<div class="caption">{@render children()}</div>{/if}
</div>
