<script>
  /*
    The question, as a number line. The reader drags a guess, then reveals
    the true answers for four households who differ only in how readily they
    switch away from energy (sigma). Every value is computed by indices.shock().
  */
  import { shock } from "../indices.js";
  import { W_ENERGY, R_DEFAULT, SIGMAS } from "../datasets.js";
  import { linear, clampW } from "../chart.js";
  import { INK } from "../palette.js";

  const RAMP = ["#311072", "#5b4ba1", "#8c82d2", "#a79eea"]; // violet, dark to light
  const answers = SIGMAS.map((s, i) => ({ s, rise: shock(R_DEFAULT, s, W_ENERGY).C - 1, colour: RAMP[i] }));

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 156;
  const M = { left: 16, right: 16 };
  let x = $derived(linear(0, 0.25, M.left, W - M.right));

  let guess = $state(0.2);
  let revealed = $state(false);
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  const ticks = [0, 0.05, 0.1, 0.15, 0.2, 0.25];

  let verdict = $derived.by(() => {
    if (!revealed) return `Your guess: ${pct(guess)} more income.`;
    const nearest = answers.reduce((a, b) => (Math.abs(b.rise - guess) < Math.abs(a.rise - guess) ? b : a));
    return `Your guess of ${pct(guess)} is closest to the household with σ = ${nearest.s}. Four households, one price change, four right answers.`;
  });
</script>

<div class="fig" id="guess">
  <div class="card">
    <div class="measure" bind:clientWidth={boxWidth}></div>
    <label class="slider">
      <span class="s-name">how much more income you'd need <b>{pct(guess)}</b></span>
      <input type="range" min="0" max="25" step="0.5" value={guess * 100} oninput={(e) => (guess = +e.currentTarget.value / 100)} />
    </label>
    <button class="pill" class:active={revealed} onclick={() => (revealed = !revealed)}>{revealed ? "hide the answers" : "show the answers"}</button>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line class="axis" x1={x(0)} x2={x(0.25)} y1="70" y2="70" />
      {#each ticks as t}
        <line class="tick" x1={x(t)} x2={x(t)} y1="66" y2="74" />
        <text class="tick-label" x={x(t)} y="90" text-anchor="middle">{t * 100}%</text>
      {/each}
      <path class="guess-mark" d={`M ${x(guess)} 64 l -6 -10 l 12 0 z`} fill={INK} />
      <text class="guess-label" x={Math.min(W - 40, Math.max(40, x(guess)))} y="44" text-anchor="middle">your guess</text>
      {#if revealed}
        {#each answers as a, i}
          <circle class="answer" data-sigma={a.s} data-rise={a.rise} cx={x(a.rise)} cy="70" r="6" fill={a.colour} />
          <text class="answer-label" x={x(a.rise)} y={104 + i * 14} text-anchor="middle" fill={a.colour}>σ = {a.s}: {pct(a.rise)}</text>
        {/each}
      {/if}
    </svg>
    <p class="verdict">{verdict}</p>
  </div>
</div>

<style>
  .fig {
    max-width: 620px;
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

  .slider {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-bottom: 0.5rem;
  }

  .s-name {
    font-family: var(--font-main);
    font-size: 0.88rem;
  }

  .s-name b {
    font-family: var(--font-mono);
    float: right;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.8rem;
    padding: 4px 11px;
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

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .axis,
  .tick {
    stroke: #8a94a2;
  }

  .tick-label {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .guess-label {
    font-family: var(--font-main);
    font-size: 11px;
    fill: var(--squid-ink);
  }

  .answer {
    stroke: #fff;
    stroke-width: 1.5;
  }

  .answer-label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    stroke: #fff;
    stroke-width: 3px;
    paint-order: stroke;
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0.2rem 0 0 0;
    min-height: 3em;
  }
</style>
