<script>
  /*
    The payoff matrix, as an HTML table rather than an SVG. A matrix IS tabular,
    and an <svg><text> does not wrap — a cell label longer than a phone would be
    clipped with no error and no overflow.

    Three optional layers on top of the numbers: best-response marks (the dots
    and circles), click-to-inspect, and a highlighted cell.
  */
  import { LABELS } from "../game.js";
  import { SERIES } from "../palette.js";

  let {
    A,
    B,
    marks = false,
    selected = $bindable(null),
    clickable = false,
    dim = false,
  } = $props();

  // Row player's best response in each column, column player's in each row.
  let rowBest = $derived([0, 1].map((c) => (A[0][c] >= A[1][c] ? 0 : 1)));
  let colBest = $derived([0, 1].map((r) => (B[r][0] >= B[r][1] ? 0 : 1)));

  const key = (r, c) => `${r}-${c}`;
  // Player names in the headers, in normal case rather than CSS capitals.
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  const isSel = (r, c) => selected && selected[0] === r && selected[1] === c;

  function pick(r, c) {
    if (!clickable) return;
    selected = isSel(r, c) ? null : [r, c];
  }
  function keyed(e, r, c) {
    if (e.key === "Enter" || e.key === " ") {
      pick(r, c);
      e.preventDefault();
    }
  }
</script>

<div class="matrix-wrap" class:dim>
  <table class="matrix">
    <thead>
      <tr>
        <td class="corner"></td>
        <th colspan="2" class="col-head">{cap(LABELS.col)}</th>
      </tr>
      <tr>
        <th class="row-head-label">{cap(LABELS.row)}</th>
        {#each LABELS.cols as label}
          <th class="col-label">{label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each LABELS.rows as rowLabel, r}
        <tr>
          <th class="row-label">{rowLabel}</th>
          {#each LABELS.cols as _, c}
            <td class="cell" class:sel={isSel(r, c)} class:clickable>
              {#if clickable}
                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <div
                  class="cell-inner"
                  role="button"
                  tabindex="0"
                  aria-label={`${rowLabel} and ${LABELS.cols[c]}`}
                  onclick={() => pick(r, c)}
                  onkeydown={(e) => keyed(e, r, c)}
                >
                  <span class="pay row-pay" class:best={marks && rowBest[c] === r}>{A[r][c]}</span>
                  <span class="comma">,</span>
                  <span class="pay col-pay" class:best={marks && colBest[r] === c}>{B[r][c]}</span>
                </div>
              {:else}
                <div class="cell-inner">
                  <span class="pay row-pay" class:best={marks && rowBest[c] === r}>{A[r][c]}</span>
                  <span class="comma">,</span>
                  <span class="pay col-pay" class:best={marks && colBest[r] === c}>{B[r][c]}</span>
                </div>
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  {#if marks}
    <p class="legend">
      <span class="swatch" style:background={SERIES[0]}></span> the trader's best
      reply in that column
      <span class="swatch second" style:background={SERIES[1]}></span> the risk desk's
      best reply in that row
    </p>
  {/if}
</div>

<style>
  .matrix-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .matrix-wrap.dim {
    opacity: 0.45;
  }

  .matrix {
    border-collapse: collapse;
    font-family: var(--font-mono);
    margin: 0 auto;
  }

  .corner {
    border: none;
  }

  .col-head,
  .row-head-label {
    font-family: var(--font-main);
    font-weight: 400;
    font-size: 0.8rem;
    color: #8a94a2;
    padding: 0 0 4px 0;
    border: none;
  }

  .row-head-label {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    padding: 0 4px 0 0;
    text-align: center;
  }

  .col-label,
  .row-label {
    font-family: var(--font-main);
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--squid-ink);
    padding: 4px 10px;
    border: none;
  }

  .row-label {
    text-align: right;
  }

  .cell {
    border: 1px solid #c9d1d8;
    padding: 0;
    min-width: 104px;
  }

  .cell-inner {
    padding: 14px 10px;
    text-align: center;
    font-size: 1.05rem;
    white-space: nowrap;
  }

  .cell.clickable .cell-inner {
    cursor: pointer;
  }

  .cell.clickable .cell-inner:focus-visible {
    outline: 2px solid var(--violet);
    outline-offset: -2px;
  }

  .cell.sel {
    background: #eef1fb;
    box-shadow: inset 0 0 0 2px var(--violet);
  }

  .pay {
    color: var(--squid-ink);
  }

  .comma {
    color: #8a94a2;
    padding: 0 2px;
  }

  .row-pay.best {
    color: #2074d5;
    font-weight: 700;
  }

  .col-pay.best {
    color: #df2a5d;
    font-weight: 700;
  }

  .legend {
    font-family: var(--font-main);
    font-size: 0.82rem;
    color: #61707d;
    margin: 0.7rem 0 0 0;
    max-width: 420px;
    text-align: center;
    line-height: 1.5;
  }

  .swatch {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 2px;
    margin-right: 2px;
  }

  .swatch.second {
    margin-left: 10px;
  }

  @media screen and (max-width: 420px) {
    .cell {
      min-width: 78px;
    }
    .cell-inner {
      padding: 11px 6px;
      font-size: 0.95rem;
    }
  }
</style>
