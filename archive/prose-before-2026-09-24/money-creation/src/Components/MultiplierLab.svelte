<script>
  /*
    The multiplier, both ways round. The first panel is the textbook process:
    the central bank adds €100 of reserves, and banks lend out every euro above
    the required tenth, round after round, while the public keeps a tenth of
    its money in cash. The second is quantitative easing with reserves already
    plentiful: the central bank buys €500 of bonds from a pension fund, and no
    bank lends anything.

    The table reads money M and the base B off each state and computes the
    ratio two ways: measured, and from the identity (1 + c)/(c + R/D) with c
    and R/D also read off the state. The two columns agree in every row; that
    is the identity, and check-browser.mjs asserts it from the DOM.
  */
  import { multiplierRounds, multiplier, measured, identity, qe } from "../banks.js";
  import { AGG, CURRENCY_RATIO, RESERVE_RATIO, INJECTION, QE_PURCHASE } from "../datasets.js";
  import { SERIES, INK } from "../palette.js";
  import { linear, clampW, pathOf } from "../chart.js";

  const c = CURRENCY_RATIO, r = RESERVE_RATIO;
  const m = multiplier(c, r);
  const run = multiplierRounds(INJECTION, c, r);
  const cum = run.rounds.reduce((acc, v) => [...acc, acc[acc.length - 1] + v], [0]);
  const textbook = { C: AGG.C + run.C, D: AGG.D + run.D, R: AGG.R + run.R };
  const eased = qe(AGG, QE_PURCHASE);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth - 2));
  let inner = $derived(W - 32);
  let twoUp = $derived(inner >= 620);
  let panelW = $derived(twoUp ? Math.floor((inner - 24 - 2) / 2) : inner);
  const H = 220;
  const M = { top: 14, right: 14, bottom: 40, left: 46 };
  const KMAX = 30;

  let k = $state(5);
  let x = $derived(linear(0, KMAX, M.left, panelW - M.right));
  let y = $derived(linear(0, 600, H - M.bottom, M.top));
  let curve = $derived(pathOf(cum.slice(0, KMAX + 1).map((v, i) => [x(i), y(v)])));

  // Second panel: before/after bars for M and B.
  let by = $derived(linear(0, 1800, H - M.bottom, M.top));
  let barW = $derived((panelW - M.left - M.right) / 5);
  const QE_BARS = [
    { k: "M0", label: "money, before", v: AGG.C + AGG.D, colour: SERIES[0], o: 0.45 },
    { k: "M1", label: "money, after", v: eased.C + eased.D, colour: SERIES[0], o: 0.9 },
    { k: "B0", label: "base, before", v: AGG.C + AGG.R, colour: SERIES[1], o: 0.45 },
    { k: "B1", label: "base, after", v: eased.C + eased.R, colour: SERIES[1], o: 0.9 },
  ];

  const eur = (v) => `€${Math.round(v).toLocaleString("en-GB")}`;
  let rows = $derived([
    { k: "open", label: "before anything", s: AGG },
    { k: "textbook", label: "textbook, €100 of reserves lent out", s: textbook },
    { k: "qe", label: "QE, €500 of bonds from a pension fund", s: eased },
  ]);
  let roundText = $derived(
    k === 0
      ? `Round 0: the €${INJECTION} of new reserves sit in the banks, and no money has been created yet.`
      : `After ${k} ${k === 1 ? "round" : "rounds"} of lending, money has grown by ${eur(cum[k])}, on its way to ${eur(m * INJECTION)}.`
  );
</script>

<div class="fig" id="multiplier-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <div class="lab">
    <div class="pair" class:two-up={twoUp}>
      <div class="cell">
        <p class="panel-title">Textbook: banks lend out every spare reserve</p>
        <p class="panel-note">{roundText}</p>
        <svg class="rounds" width={panelW} height={H} viewBox={`0 0 ${panelW} ${H}`}>
          {#each [0, 200, 400, 600] as t}
            <line class="grid" x1={M.left} x2={panelW - M.right} y1={y(t)} y2={y(t)} />
            <text class="tick" x={M.left - 6} y={y(t) + 4} text-anchor="end">€{t}</text>
          {/each}
          {#each [0, 10, 20, 30] as t}
            <text class="tick" x={x(t)} y={H - M.bottom + 15} text-anchor="middle">{t}</text>
          {/each}
          <text class="axis-title" x={(M.left + panelW - M.right) / 2} y={H - 4} text-anchor="middle">rounds of lending</text>
          <line class="limit" x1={M.left} x2={panelW - M.right} y1={y(m * INJECTION)} y2={y(m * INJECTION)} />
          <path class="cum" d={curve} stroke={SERIES[0]} />
          <circle class="round-mk" cx={x(k)} cy={y(cum[k])} r="5" fill={SERIES[0]} />
        </svg>
        <label class="slider">
          <span class="s-name">round <b>{k}</b></span>
          <input type="range" min="0" max={KMAX} step="1" value={k} oninput={(e) => (k = +e.currentTarget.value)} />
        </label>
      </div>
      <div class="cell">
        <p class="panel-title">Plentiful reserves: €{QE_PURCHASE} of QE</p>
        <p class="panel-note">The pension fund's bank credits its account and receives the reserves. No loan changes hands.</p>
        <svg class="qe" width={panelW} height={H} viewBox={`0 0 ${panelW} ${H}`}>
          {#each [0, 600, 1200, 1800] as t}
            <line class="grid" x1={M.left} x2={panelW - M.right} y1={by(t)} y2={by(t)} />
            <text class="tick" x={M.left - 6} y={by(t) + 4} text-anchor="end">{eur(t)}</text>
          {/each}
          {#each QE_BARS as b, i}
            <rect class={`qe-bar ${b.k}`} data-value={b.v} x={M.left + barW * (i + 0.5 * Math.floor(i / 2)) + 4} y={by(b.v)} width={barW - 8}
              height={by(0) - by(b.v)} fill={b.colour} opacity={b.o} />
            <text class="bar-v" x={M.left + barW * (i + 0.5 * Math.floor(i / 2)) + barW / 2} y={by(b.v) - 4} text-anchor="middle">{eur(b.v)}</text>
          {/each}
          <text class="axis-title" x={M.left + barW} y={H - M.bottom + 16} text-anchor="middle">money</text>
          <text class="axis-title" x={M.left + barW * 3.5} y={H - M.bottom + 16} text-anchor="middle">base</text>
          <text class="axis-title" x={(M.left + panelW - M.right) / 2} y={H - 4} text-anchor="middle">before and after</text>
        </svg>
      </div>
    </div>

    <table class="ratio">
      <thead>
        <tr><th></th><th class="num">M</th><th class="num">B</th><th class="num">M ÷ B</th><th class="num">formula</th></tr>
      </thead>
      <tbody>
        {#each rows as row}
          <tr data-row={row.k}>
            <td>{row.label}</td>
            <td class="num">{eur(row.s.C + row.s.D)}</td>
            <td class="num">{eur(row.s.C + row.s.R)}</td>
            <td class="num measured">{measured(row.s).toFixed(2)}</td>
            <td class="num ident">{identity(row.s).toFixed(2)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="caption">
      M is money (cash plus deposits) and B is the base (cash plus reserves). The last column
      computes (1 + c) ÷ (c + R/D) from the same state, with c the cash held per euro of
      deposits and R/D the reserves held per euro of deposits.
    </p>
  </div>
</div>

<style>
  .fig {
    max-width: 860px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .lab {
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 1rem 16px;
  }

  .pair {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .pair.two-up {
    flex-direction: row;
    gap: 24px;
  }

  .cell {
    min-width: 0;
  }

  .panel-title {
    font-family: var(--font-main);
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.2rem 0;
  }

  .panel-note {
    font-family: var(--font-main);
    font-size: 0.84rem;
    line-height: 1.5;
    color: #3d4a57;
    margin: 0 0 0.4rem 0;
    min-height: 3em;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .grid {
    stroke: #eef1f3;
  }

  .tick {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .limit {
    stroke: #232f3e;
    stroke-dasharray: 5 4;
    stroke-width: 1.2;
  }

  .cum {
    fill: none;
    stroke-width: 2.5;
  }

  .round-mk {
    stroke: #fff;
    stroke-width: 1.5;
  }

  .bar-v {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: var(--squid-ink);
  }

  .slider {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 0.3rem;
  }

  .s-name {
    font-family: var(--font-main);
    font-size: 0.85rem;
  }

  .s-name b {
    font-family: var(--font-mono);
    float: right;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--violet);
  }

  .ratio {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.84rem;
    margin-top: 1rem;
  }

  .ratio th {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8a94a2;
    font-weight: 600;
    text-align: left;
    padding: 4px 6px;
    border-bottom: 1px solid #e3e7ea;
  }

  .ratio td {
    padding: 4px 6px;
    border-bottom: 1px solid #f0f2f4;
  }

  .ratio .num {
    text-align: right;
    font-family: var(--font-mono);
  }

  .caption {
    font-family: var(--font-main);
    font-size: 0.8rem;
    line-height: 1.5;
    color: #61707d;
    margin: 0.5rem 0 0 0;
  }

  @media screen and (max-width: 560px) {
    .ratio {
      font-size: 0.74rem;
    }

    .ratio th,
    .ratio td {
      padding: 3px 3px;
    }
  }
</style>
