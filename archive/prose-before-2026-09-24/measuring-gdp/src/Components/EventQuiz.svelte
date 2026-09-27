<script>
  /*
    The question. Four things that could happen on the island this year; the
    reader says, for each, whether it lowers GDP, and the ledger beside the
    cards redraws with that event applied. The verdicts are computed from the
    ledger, not typed: an event "lowers GDP" iff production(event) < production(base).
  */
  import { economy, production, expenditure, totalSales } from "../accounts.js";
  import { BIKES, UNSOLD } from "../datasets.js";
  import LedgerFigure from "./LedgerFigure.svelte";

  const EVENTS = [
    {
      id: "bikes",
      title: "Households buy imported bicycles",
      text: `On top of their bread, households spend €${BIKES} on bicycles made abroad.`,
      options: { bikes: true },
    },
    {
      id: "importedFlour",
      title: "The bakery switches to imported flour",
      text: "The bakery buys the same flour for the same €50, but from a mill abroad.",
      options: { importedFlour: true },
    },
    {
      id: "merged",
      title: "The mill buys the bakery",
      text: "The two firms become one, so flour no longer changes hands on its way into bread.",
      options: { merged: true },
    },
    {
      id: "unsold",
      title: "Some bread goes unsold",
      text: `The bakery bakes as usual, but €${UNSOLD} of bread is still in its storeroom when the year ends.`,
      options: { unsold: true },
    },
  ];

  const base = economy({});
  const gdp0 = production(base).total;
  const verdicts = Object.fromEntries(
    EVENTS.map((e) => {
      const eco = economy(e.options);
      const d = production(eco).total - gdp0;
      const x = expenditure(eco);
      return [e.id, { d, lowers: d < 0, C: x.C, I: x.I, M: x.M, sales: totalSales(eco) }];
    })
  );

  const why = {
    bikes: (v) => `Spending rises by €${v.C - 100}, and imports rise by the same €${v.M}, so the minus sign takes back exactly what the bikes added. Nothing the island makes has changed.`,
    importedFlour: (v) => `GDP falls by €${-v.d}. That's the €20 the mill added and the €30 the farm added, which are no longer made here. The €50 import is only the route by which we notice.`,
    merged: (v) => `All sales fall from €180 to €${v.sales}, because flour is no longer sold on its way into bread, but nothing is made differently and GDP stays at €100.`,
    unsold: (v) => `Households spend €${v.C} instead of €100, and the €${v.I} of bread in the storeroom counts as investment in stock, so GDP stays at €100. GDP counts what was made, not what was sold.`,
  };

  let answers = $state({});
  let active = $state(null);
  let answered = $derived(Object.keys(answers).length);
  let right = $derived(EVENTS.filter((e) => e.id in answers && answers[e.id] === verdicts[e.id].lowers).length);

  function answer(id, lowers) {
    answers = { ...answers, [id]: lowers };
    active = id;
  }

  let activeOptions = $derived(active ? EVENTS.find((e) => e.id === active).options : {});
  let caption = $derived(
    active ? `The year with “${EVENTS.find((e) => e.id === active).title.toLowerCase()}”` : "The base year"
  );
  let score = $derived(
    answered === EVENTS.length
      ? `You got ${right} of ${EVENTS.length}. Only one of the four lowers GDP.`
      : `${answered} of ${EVENTS.length} answered.`
  );
</script>

<div class="fig" id="event-quiz">
  <div class="quiz">
    <div class="cards">
      {#each EVENTS as e}
        {@const v = verdicts[e.id]}
        <div class="card" class:active={active === e.id} data-event={e.id}>
          <p class="c-title">{e.title}</p>
          <p class="c-text">{e.text}</p>
          <div class="choices">
            <button class="pill" class:chosen={answers[e.id] === true} onclick={() => answer(e.id, true)}>Lowers GDP</button>
            <button class="pill" class:chosen={answers[e.id] === false} onclick={() => answer(e.id, false)}>Leaves it alone</button>
            {#if e.id in answers}
              <button class="show" onclick={() => (active = e.id)}>show</button>
            {/if}
          </div>
          {#if e.id in answers}
            <p class="verdict" class:correct={answers[e.id] === v.lowers}>
              <b>{answers[e.id] === v.lowers ? "Right." : "Not quite."}</b>
              {why[e.id](v)}
            </p>
          {/if}
        </div>
      {/each}
      <p class="score">{score}</p>
      <button class="reset" onclick={() => (active = null)}>show the base year</button>
    </div>
    <div class="panel">
      <LedgerFigure options={activeOptions} {caption} />
    </div>
  </div>
</div>

<style>
  .fig {
    max-width: 980px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .quiz {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 1rem 16px;
  }

  .cards {
    flex: 1 1 0;
    min-width: 0;
  }

  .panel {
    flex: 1 1 0;
    min-width: 0;
    position: sticky;
    top: 1rem;
  }

  .card {
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.7rem 0.8rem;
    margin-bottom: 0.7rem;
    background: #fafbfc;
  }

  .card.active {
    border-color: var(--violet);
    background: #fff;
  }

  .c-title {
    font-family: var(--font-main);
    font-weight: 600;
    font-size: 0.95rem;
    margin: 0 0 0.25rem 0;
  }

  .c-text {
    font-family: var(--font-main);
    font-size: 0.88rem;
    line-height: 1.5;
    margin: 0 0 0.5rem 0;
    color: #3d4a57;
  }

  .choices {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
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

  .pill:hover {
    border-color: var(--violet);
  }

  .pill.chosen {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .show,
  .reset {
    font-family: var(--font-main);
    font-size: 0.78rem;
    background: none;
    border: none;
    color: var(--violet);
    cursor: pointer;
    text-decoration: underline;
    padding: 2px 4px;
  }

  .verdict {
    font-family: var(--font-main);
    font-size: 0.86rem;
    line-height: 1.5;
    margin: 0.55rem 0 0 0;
    color: #3d4a57;
  }

  .verdict b {
    color: #b3204a;
  }

  .verdict.correct b {
    color: #2f7d32;
  }

  .score {
    font-family: var(--font-main);
    font-size: 0.88rem;
    font-weight: 600;
    margin: 0.3rem 0 0.2rem 0;
  }

  @media screen and (max-width: 820px) {
    .quiz {
      flex-direction: column;
    }

    .panel {
      position: static;
      width: 100%;
    }
  }
</style>
