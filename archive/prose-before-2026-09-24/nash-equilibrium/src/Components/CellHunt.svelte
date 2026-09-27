<script>
  /*
    The opening question. The reader runs the procedure they were taught —
    check a cell, ask whether either player would rather be somewhere else —
    and does it correctly on all four cells, and finds nothing.

    Being stuck is the transition into the rest of the article, so the component
    tracks which cells have been tried and only says so once all four are.
  */
  import { BASE, matrices, deviations, pureNE, LABELS } from "../game.js";
  import PayoffMatrix from "./PayoffMatrix.svelte";

  const { A, B } = matrices(BASE);
  const survivors = pureNE(A, B);

  let selected = $state(null);
  let tried = $state([]);
  let marks = $state(false);

  $effect(() => {
    if (!selected) return;
    const k = `${selected[0]}-${selected[1]}`;
    if (!tried.includes(k)) tried = [...tried, k];
  });

  let all = $derived(tried.length === 4);

  // Build any sentence containing a figure in the script block: {#if} strips
  // the leading whitespace of its body, so "{n}{#if n} cells{/if}" renders
  // "4cells".
  let verdict = $derived.by(() => {
    if (!selected) return "Pick a cell. The question is whether either player, knowing what the other just did, would rather have done something else.";
    const [r, c] = selected;
    const d = deviations(A, B, r, c);
    const where = `${LABELS.rows[r]} and ${LABELS.cols[c]}`;
    if (d.length === 0) return `${where} survives — neither player would move.`;
    const parts = d.map((x) =>
      x.who === "row"
        ? `the ${LABELS.row} would switch to ${LABELS.rows[x.to]}, gaining ${x.gain}`
        : `the ${LABELS.col} would switch to ${LABELS.cols[x.to]}, gaining ${x.gain}`
    );
    return `${where}: ${parts.join(", and ")}. Not an equilibrium.`;
  });

  let progress = $derived(
    all
      ? `All four cells checked, none survives. This game has ${survivors.length} equilibria you can find this way.`
      : `${tried.length} of 4 cells checked.`
  );
</script>

<div class="fig">
  <div class="measure"></div>
  <p class="fig-title">{progress}</p>

  <PayoffMatrix {A} {B} {marks} bind:selected clickable={true} />

  <p class="verdict" class:stuck={all && !selected}>{verdict}</p>

  <div class="controls">
    <button class="pill" class:active={marks} onclick={() => (marks = !marks)}>
      {marks ? "Hide best replies" : "Show best replies"}
    </button>
    <button class="pill ghost" onclick={() => { tried = []; selected = null; }}>
      Start over
    </button>
  </div>

  {#if marks}
    <p class="note">
      A cell survives only where both marks land together, and here they never
      do. The trader's best replies sit on one diagonal and the risk desk's sit
      on the other, so the marks chase each other round the cells, and there's no
      cell to stop at.
    </p>
  {/if}
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
    margin: 0 0 0.8rem 0;
    color: var(--squid-ink);
    text-align: center;
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.95rem;
    line-height: 1.55;
    color: #3c4b57;
    min-height: 3.2em;
    max-width: 480px;
    margin: 1rem auto 0 auto;
    text-align: center;
  }

  .verdict.stuck {
    color: var(--squid-ink);
    font-weight: 500;
  }

  .controls {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 0.6rem;
    flex-wrap: wrap;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.85rem;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill:hover {
    border-color: var(--violet);
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .pill.ghost {
    color: #8a94a2;
  }

  .note {
    font-family: var(--font-main);
    font-size: 0.88rem;
    line-height: 1.6;
    color: #61707d;
    max-width: 520px;
    margin: 1rem auto 0 auto;
    text-align: center;
  }
</style>
