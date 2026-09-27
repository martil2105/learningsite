<script>
  /*
    The question. Economy A grows 3% every year; economy B alternates +8% and
    −2%, which also averages 3%. After fifty years, which is richer? The
    answer and the two paths appear once the reader has picked.
  */
  import { compoundRate, arithmeticMean } from "../growth.js";
  import { STEADY, BOOM, BUST, Q_YEARS } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import { linear, log, clampW, pathOf } from "../chart.js";

  const ratesA = Array.from({ length: Q_YEARS }, () => STEADY);
  const ratesB = Array.from({ length: Q_YEARS }, (_, t) => (t % 2 ? BUST : BOOM));
  const levels = (rates) => rates.reduce((acc, g) => [...acc, acc[acc.length - 1] * (1 + g)], [1]);
  const LA = levels(ratesA), LB = levels(ratesB);
  const endA = LA[Q_YEARS], endB = LB[Q_YEARS];
  const meanB = arithmeticMean(ratesB), cagrB = compoundRate(ratesB);

  let pick = $state(null);
  const OPTIONS = [
    { id: "A", label: "A, the steady one" },
    { id: "B", label: "B, the swinging one" },
    { id: "same", label: "they're equal" },
  ];

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 220;
  const M = { top: 12, right: 16, bottom: 36, left: 40 };
  let x = $derived(linear(0, Q_YEARS, M.left, W - M.right));
  let y = $derived(log(1, 5, H - M.bottom, M.top));
  let dA = $derived(pathOf(LA.map((v, t) => [x(t), y(v)])));
  let dB = $derived(pathOf(LB.map((v, t) => [x(t), y(v)])));
  const pct = (v, d = 2) => `${(v * 100).toFixed(d)}%`;
  let verdict = $derived(
    pick === null
      ? ""
      : `${pick === "A" ? "Right." : "Not quite."} After ${Q_YEARS} years A is ${endA.toFixed(2)} times as rich as at the start and B only ${endB.toFixed(2)} times, so A is ${pct(endA / endB - 1, 1)} richer. B's growth rates average ${pct(meanB, 1)}, but it grew at ${pct(cagrB)} a year.`
  );
</script>

<div class="fig" id="swing-quiz">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <p class="q">Economy A grows 3% every year. Economy B grows 8% one year and shrinks 2% the next, over and over, which also averages 3% a year. After {Q_YEARS} years, which is richer?</p>
    <div class="choices">
      {#each OPTIONS as o}
        <button class="pill" class:active={pick === o.id} data-choice={o.id} onclick={() => (pick = o.id)}>{o.label}</button>
      {/each}
    </div>
    {#if pick !== null}
      <p class="verdict" class:correct={pick === "A"}>{verdict}</p>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g class="axis">
          {#each [1, 2, 3, 4, 5] as t}
            <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
            <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t}×</text>
          {/each}
          {#each [0, 10, 20, 30, 40, 50] as t}
            <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
          {/each}
          <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">years (logarithmic vertical axis)</text>
        </g>
        <path class="path-a" d={dA} stroke={SERIES[0]} />
        <path class="path-b" d={dB} stroke={SERIES[1]} />
        <circle class="end-a" cx={x(Q_YEARS)} cy={y(endA)} r="4.5" fill={SERIES[0]} />
        <circle class="end-b" cx={x(Q_YEARS)} cy={y(endB)} r="4.5" fill={SERIES[1]} />
      </svg>
      <p class="legend">
        <span class="key"><span class="swatch" style={`background:${SERIES[0]}`}></span>A: 3% every year</span>
        <span class="key"><span class="swatch" style={`background:${SERIES[1]}`}></span>B: +8%, −2%, +8%, −2%…</span>
      </p>
    {/if}
  </div>
</div>

<style>
  .fig {
    max-width: 640px;
    margin: 1.8rem auto;
    padding: 0 1rem;
  }

  .card {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.9rem 16px;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .q {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.5;
    font-weight: 600;
    margin: 0 0 0.6rem 0;
  }

  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.82rem;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0.7rem 0 0.4rem 0;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .axis text {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .axis .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .grid {
    stroke: #eef1f3;
  }

  path {
    fill: none;
    stroke-width: 2;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #61707d;
    margin: 0.3rem 0 0 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .swatch {
    display: inline-block;
    width: 14px;
    height: 4px;
  }
</style>
