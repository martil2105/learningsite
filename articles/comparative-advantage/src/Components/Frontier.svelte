<script>
  /*
    One economy's options, per worker per day. Shared by PriceTest and SizeLab.

    Every panel uses the SAME scales, fixed here rather than fitted to the
    frontier it draws. The article's argument is about slopes (a frontier's
    slope is the opportunity cost), and a panel fitted to its own frontier draws
    every frontier from corner to corner, which would make the Valley and the
    Coast look identical.

      country   { tools, grain }: a worker's output on one good for a whole day
      corner    "tools" or "grain": the good this economy sells
      p         the price in sacks per tool, or null for no deal
      basket    what a worker consumes with trade, or null
      autarky   what a worker consumes without trade
      W         the panel width, measured and clamped by the parent
  */
  import { linear, ticks, pathOf } from "../chart.js";

  let { title, tag, country, colour, corner, p = null, basket = null, autarky, W = 300 } = $props();

  const X_MAX = 10;
  const Y_MAX = 22;
  const H = 232;
  const M = { top: 12, right: 14, bottom: 36, left: 40 };

  let x = $derived(linear(0, X_MAX, M.left, W - M.right));
  const y = linear(0, Y_MAX, H - M.bottom, M.top);

  let T = $derived(country.tools);
  let G = $derived(country.grain);

  // The trading line runs through the economy's specialised output with slope
  // -p. Clip it to the plot box analytically rather than drawing it long and
  // letting the <svg> hide the rest, which still widens the document.
  let tradeLine = $derived.by(() => {
    if (p === null) return null;
    const [x0, y0] = corner === "tools" ? [T, 0] : [0, G];
    const xTop = x0 - (Y_MAX - y0) / p;
    const xBot = x0 + y0 / p;
    const xa = Math.max(0, xTop);
    const xb = Math.min(X_MAX, xBot);
    const at = (v) => y0 - p * (v - x0);
    return { x1: xa, y1: at(xa), x2: xb, y2: at(xb) };
  });

  // Sutherland–Hodgman against the plot rectangle, in data units.
  function clip(poly) {
    const edges = [
      (q) => q[0] >= 0, (q) => q[0] <= X_MAX, (q) => q[1] >= 0, (q) => q[1] <= Y_MAX,
    ];
    const cross = [
      (a, b) => { const t = (0 - a[0]) / (b[0] - a[0]); return [0, a[1] + t * (b[1] - a[1])]; },
      (a, b) => { const t = (X_MAX - a[0]) / (b[0] - a[0]); return [X_MAX, a[1] + t * (b[1] - a[1])]; },
      (a, b) => { const t = (0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), 0]; },
      (a, b) => { const t = (Y_MAX - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), Y_MAX]; },
    ];
    let out = poly;
    for (let e = 0; e < 4; e++) {
      const input = out;
      out = [];
      for (let i = 0; i < input.length; i++) {
        const cur = input[i], prev = input[(i + input.length - 1) % input.length];
        const inCur = edges[e](cur), inPrev = edges[e](prev);
        if (inCur) {
          if (!inPrev) out.push(cross[e](prev, cur));
          out.push(cur);
        } else if (inPrev) {
          out.push(cross[e](prev, cur));
        }
      }
      if (!out.length) break;
    }
    return out;
  }

  // What trade adds: the triangle between the trading line and the frontier.
  // It has zero area when p equals this economy's opportunity cost.
  let gainArea = $derived.by(() => {
    if (p === null) return "";
    const own = G / T;
    if (Math.abs(p - own) < 1e-12) return "";
    const tri = corner === "tools"
      ? [[0, G], [0, p * T], [T, 0]]
      : [[T, 0], [G / p, 0], [0, G]];
    const poly = clip(tri);
    if (poly.length < 3) return "";
    return pathOf(poly.map(([a, b]) => [x(a), y(b)])) + " Z";
  });

  const xTicks = ticks(0, X_MAX, 5);
  const yTicks = ticks(0, Y_MAX, 4);
</script>

<div class={`frontier ${tag}`}>
  <p class="panel-title">{title}</p>
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: what one worker can make, and what trade lets them reach`}>
    <g class="axis">
      {#each xTicks as t}
        <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
        <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
      {/each}
      {#each yTicks as t}
        <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
        <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}</text>
      {/each}
      <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
      <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
      <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">tools</text>
      <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle"
        transform={`rotate(-90 12 ${(M.top + H - M.bottom) / 2})`}>sacks</text>
    </g>

    {#if gainArea}
      <path class="gain-area" d={gainArea} fill={colour} />
    {/if}

    <line class="own-frontier" x1={x(0)} y1={y(G)} x2={x(T)} y2={y(0)} stroke={colour} />

    {#if tradeLine}
      <line
        class="trade-line"
        x1={x(tradeLine.x1)}
        y1={y(tradeLine.y1)}
        x2={x(tradeLine.x2)}
        y2={y(tradeLine.y2)}
      />
    {/if}

    <circle class="no-trade" cx={x(autarky.tools)} cy={y(autarky.grain)} r="5" stroke={colour} />
    {#if basket}
      <circle class="with-trade" cx={x(basket.tools)} cy={y(basket.grain)} r="5.5" fill={colour} />
    {/if}
  </svg>
</div>

<style>
  .frontier {
    min-width: 0;
  }

  .panel-title {
    font-family: var(--font-main);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--squid-ink);
    margin: 0 0 0.25rem 0;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
    overflow: hidden;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: #8a94a2;
  }

  .axis .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .grid {
    stroke: #eef1f3;
    stroke-width: 1;
  }

  .rule {
    stroke: #8a94a2;
    stroke-width: 1;
  }

  .own-frontier {
    stroke-width: 2.5;
  }

  .trade-line {
    stroke: #232f3e;
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }

  .gain-area {
    opacity: 0.14;
  }

  .no-trade {
    fill: #fff;
    stroke-width: 2;
  }

  .with-trade {
    stroke: #fff;
    stroke-width: 2;
  }
</style>
