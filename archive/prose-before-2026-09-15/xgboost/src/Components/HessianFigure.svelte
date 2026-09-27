<script>
  /*
    The one picture that shows what the second-order term actually buys you.

    Under squared error every point contributes a Hessian of exactly 1, so the
    Hessian cancels out of the leaf weight and the gain and the whole
    second-order apparatus is decoration. Under logistic loss it is p(1-p): a
    point the model already calls correctly with 95% confidence carries about a
    fifth of the weight of a point sitting on the fence, and one at 99% about a
    twenty-fifth.
  */
  import { scaleLinear } from "d3-scale";
  import { INK, SKY, MUTED } from "../palette.js";

  let boxWidth = 0;
  $: narrow = boxWidth > 0 && boxWidth < 480;
  $: height = narrow ? 190 : 220;
  $: margin = { top: 34, right: narrow ? 16 : 24, bottom: 44, left: 54 };
  $: width = Math.max(240, boxWidth);

  $: xScale = scaleLinear()
    .domain([0, 1])
    .range([margin.left, width - margin.right]);
  $: yScale = scaleLinear()
    .domain([0, 1.1])
    .range([height - margin.bottom, margin.top]);

  const curve = Array.from({ length: 101 }, (_, i) => {
    const p = i / 100;
    return { p, h: p * (1 - p) };
  });

  $: curvePath = curve
    .map((d, i) => `${i ? "L" : "M"} ${xScale(d.p)} ${yScale(d.h)}`)
    .join(" ");

  const marks = [
    { p: 0.5, text: "on the fence", anchor: "middle" },
    { p: 0.75, text: "leaning", anchor: "middle" },
    { p: 0.95, text: "confident", anchor: "end" },
  ];
</script>

<figure class="hessian-figure" bind:offsetWidth={boxWidth}>
  {#if width > 0}
    <svg {width} {height} role="img" aria-label="Hessian weight against predicted probability: flat at 1 for squared error, a parabola peaking at 0.25 for logistic loss">
      {#each [0, 0.25, 0.5, 0.75, 1.0] as t}
        <line class="grid" x1={margin.left} x2={width - margin.right} y1={yScale(t)} y2={yScale(t)} />
        <text class="tick" x={margin.left - 8} y={yScale(t) + 4} text-anchor="end">{t}</text>
      {/each}

      <!-- squared error: every point weighted the same -->
      <line
        class="flat"
        x1={margin.left}
        x2={width - margin.right}
        y1={yScale(1)}
        y2={yScale(1)}
      />
      <text class="series-label" x={margin.left + 8} y={yScale(1) - 8} fill={INK}>
        squared error — h = 1 for every point
      </text>

      <!-- logistic loss -->
      <path d={curvePath} fill="none" stroke={SKY} stroke-width="2.5" />
      <text class="series-label" x={xScale(0.21)} y={yScale(0.40)} text-anchor="middle" fill={SKY}>
        logistic — h = p(1 − p)
      </text>

      {#each marks as m}
        <circle class="mark" cx={xScale(m.p)} cy={yScale(m.p * (1 - m.p))} r="4.5" fill={SKY} />
        <text
          class="mark-label"
          x={xScale(m.p)}
          y={yScale(m.p * (1 - m.p)) - 12}
          text-anchor={m.anchor}
        >
          {(m.p * (1 - m.p)).toFixed(2)}
        </text>
        <text
          class="mark-note"
          x={xScale(m.p)}
          y={yScale(m.p * (1 - m.p)) - 26}
          text-anchor={m.anchor}
        >
          {m.text}
        </text>
      {/each}

      <line
        class="axis"
        x1={margin.left}
        x2={width - margin.right}
        y1={height - margin.bottom}
        y2={height - margin.bottom}
      />
      {#each [0, 0.25, 0.5, 0.75, 1] as t}
        <text class="tick" x={xScale(t)} y={height - margin.bottom + 16} text-anchor="middle">{t}</text>
      {/each}
      <text class="axis-title" x={(width + margin.left) / 2} y={height - 6} text-anchor="middle">
        Model's predicted probability p
      </text>
      <text class="axis-title" transform="rotate(-90)" x={-(height - margin.bottom + margin.top) / 2} y={13} text-anchor="middle">
        Hessian h
      </text>
    </svg>
  {/if}
  <figcaption>
    How much each point counts when choosing the next split. Squared error gives
    every point the same say. Logistic loss gives the loudest say to the points
    the model is least sure about, and almost none to the ones it has already
    settled — which is the entire reason for carrying a second derivative around.
  </figcaption>
</figure>

<style>
  .hessian-figure {
    max-width: 600px;
    margin: 1.5rem auto 0.5rem auto;
    padding: 0;
  }

  svg {
    display: block;
    overflow: visible;
  }

  .grid {
    stroke: var(--squidink);
    opacity: 0.08;
  }

  .axis {
    stroke: var(--squidink);
    opacity: 0.5;
    stroke-width: 1.5;
  }

  .flat {
    stroke: var(--squidink);
    stroke-width: 2;
    stroke-dasharray: 6 4;
    opacity: 0.75;
  }

  .tick {
    font-size: 0.78rem;
    fill: var(--squidink);
    opacity: 0.7;
    font-family: var(--font-main);
  }

  .axis-title {
    font-size: 0.8rem;
    fill: var(--squidink);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: var(--font-main);
  }

  .series-label {
    paint-order: stroke;
    stroke: #f1f3f3;
    stroke-width: 4px;
    stroke-linejoin: round;
    font-size: 0.8rem;
    font-family: var(--font-main);
    font-weight: 600;
  }

  .mark {
    stroke: #f1f3f3;
    stroke-width: 2;
  }

  .mark-label {
    paint-order: stroke;
    stroke: #f1f3f3;
    stroke-width: 4px;
    stroke-linejoin: round;
    font-size: 0.78rem;
    font-family: var(--font-mono, monospace);
    fill: var(--squidink);
    font-weight: 700;
  }

  .mark-note {
    font-size: 0.72rem;
    font-family: var(--font-main);
    fill: var(--squidink);
    opacity: 0.65;
  }

  figcaption {
    max-width: 600px;
    margin: 0.6rem auto 0 auto;
    font-size: 0.88rem;
    line-height: 1.5;
    font-family: var(--font-main);
    color: var(--squidink);
    opacity: 0.8;
  }

  @media screen and (max-width: 950px) {
    .hessian-figure,
    figcaption {
      max-width: 88%;
    }
  }
</style>
