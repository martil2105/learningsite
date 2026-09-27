<script>
  /*
    The steered simulation. Three banks' balance sheets, stepped through one
    loan: Anchor lends €100 to a bakery, the bakery spends it, Birch and Cedar
    lend in step, and their borrowers spend. Every number is read off the
    sheets that banks.applySteps() produces; nothing is tracked separately.
    check-browser.mjs asserts that each sheet balances at every step and that
    the system totals are what the prose says.
  */
  import { caseSteps, applySteps, totalOf } from "../banks.js";
  import { BANKS, OPENING, LOAN } from "../datasets.js";
  import { SERIES } from "../palette.js";

  const steps = caseSteps(LOAN);
  const states = steps.reduce((acc, _, i) => [...acc, applySteps(OPENING, steps.slice(0, i + 1))], [applySteps(OPENING, [])]);
  const NOTES = [
    "Three banks before anything happens. Each keeps a tenth of its deposits as reserves at the central bank, shown by the bar under its balance sheet.",
    `Anchor lends €${LOAN} to a bakery by typing it into the bakery's account. Notice that its loans and its deposits both rise, and nobody else's deposit falls.`,
    "The bakery pays its suppliers, who bank all over the island. Watch Anchor's reserve bar as half the money leaves.",
    "Birch and Cedar do what Anchor did, in proportion to their size.",
    "Their borrowers spend too, and the payments flow back. Watch the reserve bars and the totals underneath.",
  ];

  let step = $state(0);
  let sheets = $derived(states[step]);
  let prev = $derived(states[Math.max(0, step - 1)]);
  const ITEMS = {
    assets: [["reserves", "reserves"], ["loans", "loans"], ["bonds", "bonds"]],
    liabilities: [["deposits", "deposits"], ["equity", "equity"]],
  };
  const eur = (v) => `€${(Math.round(v * 100) / 100).toLocaleString("en-GB")}`;
  const delta = (v) => (Math.abs(v) < 1e-9 ? "" : v > 0 ? `+${Math.round(v * 100) / 100}` : `−${Math.round(-v * 100) / 100}`);
  let totals = $derived({
    money: totalOf(sheets, "deposits"),
    reserves: totalOf(sheets, "reserves"),
    loans: totalOf(sheets, "loans"),
  });
  const RMAX = 60;
</script>

<div class="fig" id="balance-sheets">
  <div class="card">
    <div class="controls">
      <button class="pill" disabled={step === 0} onclick={() => (step = Math.max(0, step - 1))} aria-label="previous step">◀</button>
      {#each ["start", ...steps.map((s) => s.label)] as label, i}
        <button class="pill step-pill" class:active={step === i} data-step={i} onclick={() => (step = i)}>{i}. {label}</button>
      {/each}
      <button class="pill next" disabled={step === steps.length} onclick={() => (step = Math.min(steps.length, step + 1))}>next ▶</button>
    </div>
    <p class="note">{NOTES[step]}</p>
    <div class="banks">
      {#each BANKS as b, i}
        {@const s = sheets[b.id]}
        {@const p = prev[b.id]}
        <div class="bank" data-bank={b.id}>
          <p class="b-name">{b.name} <span class="share">{Math.round(b.share * 100)}% of deposits</span></p>
          <div class="t">
            <div class="side">
              <p class="side-h">Assets</p>
              {#each ITEMS.assets as [k, label]}
                <p class="row" data-item={k}><span>{label}</span><b>{eur(s[k])}</b><i class="d">{step ? delta(s[k] - p[k]) : ""}</i></p>
              {/each}
              <p class="row total" data-total="assets"><span>total</span><b>{eur(s.reserves + s.loans + s.bonds)}</b></p>
            </div>
            <div class="side">
              <p class="side-h">Liabilities</p>
              {#each ITEMS.liabilities as [k, label]}
                <p class="row" data-item={k}><span>{label}</span><b>{eur(s[k])}</b><i class="d">{step ? delta(s[k] - p[k]) : ""}</i></p>
              {/each}
              <p class="row filler"><span>&nbsp;</span></p>
              <p class="row total" data-total="liabilities"><span>total</span><b>{eur(s.deposits + s.equity)}</b></p>
            </div>
          </div>
          <svg class="res-bar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-label={`${b.name}'s reserves: ${eur(s.reserves)}`}>
            <rect x="0" y="0" width="100" height="10" fill="#eef1f3" />
            <rect class="res" x="0" y="0" width={Math.max(0, (100 * s.reserves) / RMAX)} height="10" fill={SERIES[i]} />
          </svg>
          <p class="res-label">reserves {eur(s.reserves)}</p>
        </div>
      {/each}
    </div>
    <div class="system">
      <div><span>money (deposits)</span><b class="t-money">{eur(totals.money)}</b></div>
      <div><span>loans</span><b class="t-loans">{eur(totals.loans)}</b></div>
      <div><span>reserves</span><b class="t-reserves">{eur(totals.reserves)}</b></div>
    </div>
  </div>
</div>

<style>
  .fig {
    max-width: 900px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .card {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.9rem 16px;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  .pill {
    font-family: var(--font-main);
    font-size: 0.78rem;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid #c9d1d8;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }

  .pill:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .pill.active {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }

  .note {
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.55;
    margin: 0.7rem 0 0.8rem 0;
    min-height: 4.7em;
  }

  .banks {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  @media screen and (max-width: 720px) {
    .banks {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .bank {
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.55rem 0.7rem;
    min-width: 0;
  }

  .b-name {
    font-family: var(--font-main);
    font-weight: 700;
    font-size: 0.95rem;
    margin: 0 0 0.35rem 0;
  }

  .share {
    font-weight: 400;
    font-size: 0.76rem;
    color: #8a94a2;
    margin-left: 0.3rem;
  }

  .t {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .side-h {
    font-family: var(--font-main);
    font-size: 0.68rem;
    color: #8a94a2;
    margin: 0 0 0.15rem 0;
    border-bottom: 1px solid #e3e7ea;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    font-family: var(--font-main);
    font-size: 0.8rem;
    margin: 0.12rem 0;
    position: relative;
  }

  .row b {
    font-family: var(--font-mono);
    font-weight: 500;
  }

  .row .d {
    grid-column: 2;
    font-family: var(--font-mono);
    font-style: normal;
    font-size: 0.7rem;
    color: #7c5aed;
    text-align: right;
    min-height: 0.9em;
    line-height: 1;
  }

  .row.total {
    border-top: 1px solid #e3e7ea;
    padding-top: 0.1rem;
    font-weight: 600;
  }

  .res-bar {
    display: block;
    width: 100%;
    height: 8px;
    margin-top: 0.45rem;
  }

  .res-label {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: #61707d;
    margin: 0.15rem 0 0 0;
  }

  .system {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.6rem;
    justify-content: center;
    margin-top: 0.9rem;
    padding-top: 0.7rem;
    border-top: 1px solid #eef1f3;
  }

  .system div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .system span {
    font-family: var(--font-main);
    font-size: 0.72rem;
    color: #8a94a2;
  }

  .system b {
    font-family: var(--font-mono);
    font-size: 1rem;
  }
</style>
