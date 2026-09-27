<script>
  /*
    The two answers everyone reaches for first, drawn against the fee they are
    supposed to divide. Both numbers are read straight out of the same payoff
    table the hook uses, so this figure cannot drift away from the game.
  */
  import { scaleLinear } from "d3-scale";
  import { PRESETS, PLAYERS } from "../game.js";
  import { PLAYER_COLORS } from "../palette.js";

  const payoffs = PRESETS[0].payoffs;
  const total = payoffs[7];

  // What each could bill alone.
  const solo = [payoffs[1], payoffs[2], payoffs[4]];
  // What the team would lose by dropping them: v(N) - v(N without i).
  const loo = [total - payoffs[6], total - payoffs[5], total - payoffs[3]];

  const sum = (a) => a.reduce((x, y) => x + y, 0);

  const SCHEMES = [
    {
      name: "Pay what you could bill alone",
      values: solo,
      verdict: sum(solo) + " of " + total + " — nobody has claimed the other " + (total - sum(solo)),
    },
    {
      name: "Pay what the team would lose without you",
      values: loo,
      verdict: sum(loo) + " of " + total + " — a payroll " + (sum(loo) - total) + " larger than the fee",
    },
  ];

  let width = 320;
  $: narrow = width < 460;
  $: labelW = narrow ? 0 : 0;
  $: axisMax = 190;
  $: x = scaleLinear().domain([0, axisMax]).range([0, Math.max(120, width - 8)]);
  const BAR_H = 26;
</script>

<figure class="fig">
  <div class="measure" bind:clientWidth={width} />
  {#each SCHEMES as scheme}
    <div class="scheme">
      <div class="scheme-name">{scheme.name}</div>
      <svg
        viewBox="0 0 {Math.max(120, width - 8)} {BAR_H + 22}"
        width={Math.max(120, width - 8)}
        height={BAR_H + 22}
      >
        <!-- the fee that actually exists -->
        <line class="target" x1={x(total)} x2={x(total)} y1="0" y2={BAR_H + 4} />
        <text class="target-label" x={x(total)} y={BAR_H + 18} text-anchor="middle">
          the {total} fee
        </text>

        {#each scheme.values as value, i}
          {@const start = scheme.values.slice(0, i).reduce((a, b) => a + b, 0)}
          {#if value > 0}
            <!-- 2px surface gap between stacked segments -->
            <rect
              x={x(start) + (i === 0 ? 0 : 1)}
              y="0"
              width={Math.max(1, x(value) - (i === 0 ? 0 : 1) - 1)}
              height={BAR_H}
              rx="3"
              fill={PLAYER_COLORS[i]}
            />
            {#if x(value) > 34}
              <text class="seg" x={x(start) + x(value) / 2} y={BAR_H / 2 + 4} text-anchor="middle">
                {PLAYERS[i].name} {value}
              </text>
            {/if}
          {/if}
        {/each}
      </svg>
      <div class="verdict">{scheme.verdict}</div>
    </div>
  {/each}
</figure>

<style>
  .fig {
    max-width: 600px;
    margin: 1.6rem auto;
    padding: 0;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .scheme + .scheme {
    margin-top: 1.15rem;
  }

  .scheme-name {
    font-family: var(--font-main);
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--squidink);
    margin-bottom: 0.35rem;
  }

  svg {
    max-width: 100%;
    display: block;
    overflow: visible;
  }

  .target {
    stroke: #4a5568;
    stroke-width: 1.5;
    stroke-dasharray: 3 3;
  }

  .target-label {
    font-family: var(--font-main);
    font-size: 10.5px;
    fill: #718096;
  }

  .seg {
    font-family: var(--font-main);
    font-size: 11.5px;
    font-weight: 600;
    fill: #ffffff;
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #718096;
    margin-top: 0.2rem;
  }

  @media screen and (max-width: 950px) {
    .fig {
      padding: 0 0.5rem;
    }
  }
</style>
