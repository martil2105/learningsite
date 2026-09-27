<script>
  /*
    The year's ledger and the three ways of adding it up.

    The transactions come from accounts.economy(options); the three stacked
    columns are production, expenditure and income, each computed by its own
    reader in accounts.js. The claim check-browser.mjs defends in rendered
    pixels: the tops of the three net stacks sit on the same GDP line, and the
    all-sales column does not (unless there is only one sale).
  */
  import { economy, production, expenditure, income, totalSales } from "../accounts.js";
  import { NAMES } from "../datasets.js";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";
  import { linear, ticks, clampW } from "../chart.js";

  let { options = {}, caption = "" } = $props();

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  const H = 300;
  const M = { top: 22, right: 8, bottom: 40, left: 40 };

  let eco = $derived(economy(options));
  let prod = $derived(production(eco));
  let exp = $derived(expenditure(eco));
  let inc = $derived(income(eco));
  let sales = $derived(totalSales(eco));

  const euro = (v) => `€${Math.round(v)}`;

  let yMax = $derived(Math.max(200, Math.ceil(Math.max(sales, exp.C + exp.I) / 20) * 20));
  let y = $derived(linear(0, yMax, H - M.bottom, M.top));
  let yTicks = $derived(ticks(0, yMax, 5));

  const COLS = ["production", "spending", "income", "sales"];
  const LABELS = { production: "Value added", spending: "Spending", income: "Income", sales: "All sales" };
  let band = $derived((W - M.left - M.right) / COLS.length);
  function colX(i) {
    return M.left + band * i + band * 0.14;
  }
  let colW = $derived(band * 0.72);

  // Stacks: [{label, value}] from the bottom up.
  let stacks = $derived.by(() => {
    const firmOrder = ["farm", "mill", "bakery", "millbakery"];
    const p = firmOrder
      .filter((f) => prod.byFirm[f] !== undefined && prod.byFirm[f] !== 0)
      .map((f) => ({ label: NAMES[f], value: prod.byFirm[f] }));
    const s = [];
    for (const t of eco.tx) {
      if (t.use === "consumption") s.push({ label: t.what === "bread" ? "Bread" : "Bikes", value: t.value });
    }
    if (exp.I) s.push({ label: "Stock", value: exp.I });
    const i = [
      { label: "Wages", value: inc.wages },
      { label: "Profits", value: inc.profits },
    ];
    return { production: p, spending: s, income: i };
  });

  function segs(list) {
    let acc = 0;
    return list.map((d) => {
      const lo = acc;
      acc += d.value;
      return { ...d, lo, hi: acc };
    });
  }

  let gdp = $derived(prod.total);

  let rows = $derived(
    eco.tx.map((t) => ({
      from: NAMES[t.seller],
      to: t.seller === t.buyer ? "its storeroom" : NAMES[t.buyer],
      what: t.what === "bread into the storeroom" ? "bread" : t.what,
      value: euro(t.value),
      tag: t.seller === "abroad" ? "import" : t.use === "input" ? "input" : t.use === "inventory" ? "stock" : "final",
    }))
  );

  let summary = $derived(
    `Value added ${euro(prod.total)}, ` +
      (exp.M > 0
        ? `spending ${euro(exp.C + exp.I)} minus imports ${euro(exp.M)} = ${euro(exp.total)}, `
        : `spending ${euro(exp.total)}, `) +
      `income ${euro(inc.total)}, and all sales ${euro(sales)}.`
  );
</script>

<div class="ledger">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  {#if caption}<p class="fig-title">{caption}</p>{/if}

  <table class="tx">
    <thead>
      <tr><th>Seller → buyer</th><th>What</th><th class="num">Value</th></tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr class={r.tag}>
          <td>{r.from} → {r.to}</td>
          <td>{r.what}<span class="tag">{r.tag}</span></td>
          <td class="num">{r.value}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <svg class="three-ways" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label={summary}>
    <defs>
      <pattern id="hatch-imports" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#fff" />
        <line x1="0" y1="0" x2="0" y2="6" stroke={SERIES[1]} stroke-width="2" />
      </pattern>
    </defs>

    <g class="axis">
      {#each yTicks as t}
        <line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
        <text x={M.left - 6} y={y(t) + 4} text-anchor="end">{t}</text>
      {/each}
      <text class="axis-title" x={M.left - 6} y={M.top - 8} text-anchor="end">€</text>
    </g>

    {#each COLS as c, i}
      <g class={`col col-${c}`}>
        {#if c === "sales"}
          <rect class="seg sales" x={colX(i)} y={y(sales)} width={colW} height={y(0) - y(sales)} fill={BACKGROUND_CLASS} opacity="0.55" />
          <text class="seg-label" x={colX(i) + colW / 2} y={y(sales) + 14} text-anchor="middle">{euro(sales)}</text>
        {:else}
          {#each segs(stacks[c]) as s, k}
            <rect
              class="seg"
              x={colX(i)}
              y={y(s.hi)}
              width={colW}
              height={Math.max(0, y(s.lo) - y(s.hi))}
              fill={SERIES[i]}
              opacity={0.35 + 0.22 * (k % 3)}
            />
            {#if y(s.lo) - y(s.hi) >= 16}
              <text class="seg-label" x={colX(i) + colW / 2} y={(y(s.lo) + y(s.hi)) / 2 + 4} text-anchor="middle">
                {s.label} {Math.round(s.value)}
              </text>
            {/if}
          {/each}
          {#if c === "spending" && exp.M > 0}
            <rect
              class="imports"
              x={colX(i)}
              y={y(exp.C + exp.I)}
              width={colW}
              height={y(exp.C + exp.I - exp.M) - y(exp.C + exp.I)}
              fill="url(#hatch-imports)"
              stroke={SERIES[1]}
              stroke-width="1.5"
            />
            <text class="seg-label minus" x={colX(i) + colW / 2} y={(y(exp.C + exp.I) + y(exp.C + exp.I - exp.M)) / 2 + 4} text-anchor="middle">−M {Math.round(exp.M)}</text>
          {/if}
          <rect class="net-top" data-col={c} x={colX(i)} y={y(c === "production" ? prod.total : c === "spending" ? exp.total : inc.total)} width={colW} height="0" />
        {/if}
        <text class="col-label" x={colX(i) + colW / 2} y={H - M.bottom + 16} text-anchor="middle">{LABELS[c]}</text>
      </g>
    {/each}

    <line class="gdp-line" x1={M.left} x2={colX(2) + colW + 4} y1={y(gdp)} y2={y(gdp)} />
    <text class="gdp-label" x={colX(2) + colW + 4} y={y(gdp) - 5} text-anchor="end">GDP {euro(gdp)}</text>
  </svg>
  <p class="summary">{summary}</p>
</div>

<style>
  .ledger {
    min-width: 0;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--squid-ink);
  }

  .tx {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.84rem;
    margin-bottom: 0.8rem;
  }

  .tx th {
    text-align: left;
    font-weight: 600;
    font-size: 0.8rem;
    color: #8a94a2;
    border-bottom: 1px solid #e3e7ea;
    padding: 4px 6px;
  }

  .tx td {
    padding: 4px 6px;
    border-bottom: 1px solid #f0f2f4;
    color: var(--squid-ink);
  }

  .tx .num {
    text-align: right;
    font-family: var(--font-mono);
  }

  .tx tr.import td {
    color: #b3204a;
  }

  .tag {
    font-family: var(--font-main);
    font-size: 0.74rem;
    color: #8a94a2;
    margin-left: 0.45rem;
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

  .grid {
    stroke: #eef1f3;
  }

  .seg-label {
    font-family: var(--font-main);
    font-size: 10.5px;
    fill: var(--squid-ink);
    stroke: #fff;
    stroke-width: 3px;
    paint-order: stroke;
  }

  .col-label {
    font-family: var(--font-main);
    font-size: 11px;
    font-weight: 600;
    fill: var(--squid-ink);
  }

  .gdp-line {
    stroke: var(--squid-ink);
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }

  .gdp-label {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    fill: var(--squid-ink);
    stroke: #fff;
    stroke-width: 3px;
    paint-order: stroke;
  }

  .summary {
    font-family: var(--font-main);
    font-size: 0.85rem;
    line-height: 1.5;
    color: #61707d;
    margin: 0.5rem 0 0 0;
  }
</style>
