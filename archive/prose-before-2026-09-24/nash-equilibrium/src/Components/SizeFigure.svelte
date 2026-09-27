<script>
  /*
    The same claim at bigger games, run live in the browser.

    The solver here is handed BOTH matrices and is free to be wrong: it computes
    the row player's mix, then every one of the row player's payoffs is replaced
    with a fresh random value on a hundred times the scale, and the mix is
    computed again. The displacement column is what the claim rests on.
  */
  import { mulberry32 } from "../rng.js";
  import { ownMixDisplacement } from "../general.js";

  const SIZES = [2, 3, 4, 5];
  let rows = $state([]);
  let running = $state(false);

  function run() {
    running = true;
    rows = SIZES.map((n) => ownMixDisplacement(n, mulberry32(900 + n), 150, 120000));
    running = false;
  }

  run();
</script>

<div class="fig">
  <div class="measure"></div>

  <p class="fig-title">
    We replace every payoff the row player has and solve the game again. This
    runs in your browser when the page loads.
  </p>

  <table class="results">
    <thead>
      <tr>
        <th>game</th>
        <th>games solved</th>
        <th>largest move in the row player's own mix</th>
        <th>largest exploitability</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td class="mono">{r.n}&times;{r.n}</td>
          <td class="mono">{r.tested}</td>
          <td class="mono zero">{r.worst === 0 ? "0" : r.worst.toExponential(2)}</td>
          <td class="mono faint">{r.worstExploit.toExponential(1)}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <p class="note">
    The last column shows how much either player could gain by walking away from
    the mix the solver returned, and at 10<sup>&minus;15</sup>, these are
    equilibria rather than near-misses. The column before it is zero. Not small,
    but exactly zero.
  </p>
</div>

<style>
  .fig {
    max-width: 680px;
    margin: 1.8rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0 0 0.7rem 0;
    color: var(--squid-ink);
  }

  .results {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  .results th {
    font-family: var(--font-main);
    font-weight: 500;
    font-size: 0.78rem;
    color: #61707d;
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid #c9d1d8;
    line-height: 1.35;
  }

  .results td {
    padding: 8px;
    border-bottom: 1px solid #eef1f3;
  }

  .mono {
    font-family: var(--font-mono);
  }

  .zero {
    color: #df2a5d;
    font-weight: 700;
  }

  .faint {
    color: #8a94a2;
  }

  .note {
    font-family: var(--font-main);
    font-size: 0.88rem;
    line-height: 1.6;
    color: #61707d;
    margin: 0.8rem 0 0 0;
  }

  @media screen and (max-width: 480px) {
    .results th,
    .results td {
      padding: 6px 4px;
      font-size: 0.8rem;
    }
  }
</style>
