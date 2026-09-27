<script>
  /*
    The opening question. Six technologies, one job, and the test every first
    course teaches: a technology is beaten when another needs no more of
    either input and less of at least one. The reader clicks a technology, the
    rectangle of everything that could beat it lights up, and the verdict is
    built in the script block (any sentence with a figure in it is — the
    {#if} whitespace rule).

    BALANCED is deliberately absent: the trap arrives in its own section.
  */
  import { STARTERS } from "../datasets.js";
  import { dominates } from "../technology.js";
  import { linear, clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const H = 280;
  const M = { top: 18, right: 18, bottom: 40, left: 46 };

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let selected = $state(STARTERS[4]); // LEGACY — the test finds a beater at once

  let x = $derived(linear(0, 20, M.left, W - M.right));
  let y = $derived(linear(0, 44, H - M.bottom, M.top));

  let beaters = $derived(STARTERS.filter((t) => t !== selected && dominates(t, selected)));
  let beaten = $derived(beaters.some((t) => dominates(selected, t)));

  // The verdict is a whole sentence, built here so the template never has to
  // glue numbers to conditionals.
  let verdict = $derived.by(() => {
    if (beaters.length === 0) {
      return `${selected.name} needs ${selected.N} engineer-days and ${selected.R} machine-days, and nothing on this list needs less of both. The rectangle test has nothing to say about it.`;
    }
    const names = beaters.map((t) => t.name);
    const joined = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
    return `${selected.name} needs ${selected.N} engineer-days and ${selected.R} machine-days, and ${joined} need${beaters.length === 1 ? "s" : ""} less of both, so the rectangle test removes ${selected.name.toLowerCase()}.`;
  });

  const role = (t) =>
    t === selected ? "selected" : beaters.includes(t) ? "beater" : "plain";
</script>

<div class="fig" id="rectangle-test">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{verdict}</p>

  <div class="pickers" role="group" aria-label="Choose a technology to test">
    {#each STARTERS as t}
      <button class="pick" class:active={t === selected} onclick={() => (selected = t)}>
        {t.name}
      </button>
    {/each}
  </div>

  <div class="plot">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="The six technologies in input space, with the rectangle that could beat the selected one">
      <g class="axis">
        {#each [0, 5, 10, 15, 20] as t}
          <line class="grid" x1={x(t)} y1={M.top} x2={x(t)} y2={H - M.bottom} />
          <text x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
        {/each}
        {#each [0, 10, 20, 30, 40] as t}
          <line class="grid" x1={M.left} y1={y(t)} x2={W - M.right} y2={y(t)} />
          <text x={M.left - 7} y={y(t) + 4} text-anchor="end">{t}</text>
        {/each}
        <line class="rule" x1={M.left} y1={H - M.bottom} x2={W - M.right} y2={H - M.bottom} />
        <line class="rule" x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} />
        <text class="axis-title" x={(M.left + W - M.right) / 2} y={H - 4} text-anchor="middle">engineer-days (N)</text>
        <text class="axis-title" x={12} y={(M.top + H - M.bottom) / 2} text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">machine-days (R)</text>
      </g>
      {#if beaters.length === 0}
        <rect class="rect open" x={x(selected.N)} y={M.top}
          width={Math.max(0, W - M.right - x(selected.N))}
          height={Math.max(0, y(selected.R) - M.top)} />
      {:else}
        <rect class="rect" x={M.left} y={y(selected.R)}
          width={Math.max(0, x(selected.N) - M.left)}
          height={Math.max(0, H - M.bottom - y(selected.R))} />
      {/if}

      {#each STARTERS as t}
        <circle
          class="dot {role(t)}"
          cx={x(t.N)}
          cy={y(t.R)}
          r={t === selected ? 7 : 5.5}
          fill={t === selected ? SERIES[0] : beaters.includes(t) ? SERIES[1] : "#b9c0c9"}
        />
        <text class="lab {role(t)}" x={x(t.N) + 10} y={y(t.R) + 4}>{t.name}</text>
      {/each}
    </svg>

    <p class="note">
      {#if beaten}
        This technology beats something itself, so the test cuts both ways here.
      {:else if beaters.length === 0}
        Nothing beats it, and nothing it beats: every trade-off on this list is
        real, and the test ends in a draw between all four survivors.
      {/if}
    </p>
  </div>
</div>

<style>
  .rect {
    fill: var(--primary);
    opacity: 0.08;
  }

  .rect.open {
    fill: none;
    stroke: var(--primary);
    stroke-dasharray: 4 4;
    opacity: 0.5;
  }

  .dot {
    stroke: white;
    stroke-width: 1.5;
  }

  .lab {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: #8a94a2;
  }

  .lab.selected,
  .lab.beater {
    fill: var(--squidink);
    font-weight: 600;
  }

  .note {
    font-family: var(--font-main);
    font-size: 0.9rem;
    color: #5a6672;
    margin: 0.6rem 0 0 0;
  }
  </style>