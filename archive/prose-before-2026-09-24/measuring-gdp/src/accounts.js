/*
  National accounts for the island, computed three ways from one ledger.

  economy(options) writes down the year's transactions, the way a bookkeeper
  would: who sold what to whom, for how much, and what each firm paid its
  workers. Nothing in the ledger says what GDP is. The three approaches then
  read the same ledger in three different ways, and share no code:

    production  — each domestic firm's sales minus what it bought from other firms
                  or from abroad, summed over firms (value added);
    expenditure — every purchase by a final user (households, investment,
                  government, abroad), minus everything bought from abroad;
    income      — every firm's wage bill plus its profit.

  That the three agree is an identity of double-entry bookkeeping, and
  check-numbers.mjs asserts it with === over every combination of events.
*/
import { BREAD, FLOUR_PER_BREAD, WHEAT_PER_FLOUR, WAGE_SHARE, BIKES, UNSOLD } from "./datasets.js";

const DOMESTIC_FIRMS = ["farm", "mill", "bakery", "millbakery"];
export const isFirm = (who) => DOMESTIC_FIRMS.includes(who);

/*
  options:
    bikes            households also buy BIKES euros of imported bicycles
    importedFlour    the bakery buys its flour from abroad
    merged           the mill and the bakery are one firm
    unsold           UNSOLD euros of bread end the year in the bakery's storeroom
    bread            households' spending on bread (default BREAD)
*/
export function economy({ bikes = false, importedFlour = false, merged = false, unsold = false, bread = BREAD, bikeSpend = BIKES, stockpile = 0 } = {}) {
  const toHouseholds = unsold ? bread - UNSOLD : bread;
  const stored = unsold ? UNSOLD : 0;
  const baked = toHouseholds + stored;
  const flour = FLOUR_PER_BREAD * baked;
  const wheat = importedFlour ? 0 : WHEAT_PER_FLOUR * flour;

  const bakery = merged && !importedFlour ? "millbakery" : "bakery";
  const tx = [];
  const add = (seller, buyer, what, value, use) => {
    if (value > 0) tx.push({ seller, buyer, what, value, use });
  };

  if (!importedFlour) {
    add("farm", merged ? "millbakery" : "mill", "wheat", wheat, "input");
    if (!merged) add("mill", "bakery", "flour", flour, "input");
  } else {
    add("abroad", "bakery", "flour", flour, "input");
  }
  add(bakery, "households", "bread", toHouseholds, "consumption");
  add(bakery, bakery, "bread into the storeroom", stored, "inventory");
  if (bikes) add("abroad", "households", "bicycles", bikeSpend, "consumption");
  // Goods imported ahead of a tariff and kept in the bakery's stock.
  add("abroad", bakery, "goods for stock", stockpile, "inventory");

  // Wage bills are a share of each firm's own output, whether it was sold or stored.
  const wages = {};
  if (!importedFlour) wages.farm = WAGE_SHARE.farm * wheat;
  if (merged && !importedFlour) {
    wages.millbakery = WAGE_SHARE.mill * flour + WAGE_SHARE.bakery * baked;
  } else {
    if (!importedFlour) wages.mill = WAGE_SHARE.mill * flour;
    wages.bakery = WAGE_SHARE.bakery * baked;
  }
  return { tx, wages };
}

/* Production: sum over domestic firms of output minus inputs bought. */
export function production({ tx }) {
  const firms = {};
  for (const t of tx) {
    if (isFirm(t.seller)) {
      firms[t.seller] = firms[t.seller] || { output: 0, inputs: 0 };
      firms[t.seller].output += t.value;
    }
    if (isFirm(t.buyer) && t.use === "input") {
      firms[t.buyer] = firms[t.buyer] || { output: 0, inputs: 0 };
      firms[t.buyer].inputs += t.value;
    }
  }
  const byFirm = {};
  let total = 0;
  for (const [f, b] of Object.entries(firms)) {
    byFirm[f] = b.output - b.inputs;
    total += byFirm[f];
  }
  return { total, byFirm };
}

/* Expenditure: C + I + G + X − M, from the uses of every transaction. */
export function expenditure({ tx }) {
  let C = 0, I = 0, G = 0, X = 0, M = 0;
  for (const t of tx) {
    if (t.use === "consumption") C += t.value;
    else if (t.use === "inventory" || t.use === "investment") I += t.value;
    else if (t.use === "government") G += t.value;
    else if (t.use === "export") X += t.value;
    if (t.seller === "abroad") M += t.value;
  }
  return { C, I, G, X, M, total: C + I + G + X - M };
}

/* Income: wages plus profits, where profit is each firm's revenue minus inputs used and wages. */
export function income({ tx, wages }) {
  const cash = {};
  for (const t of tx) {
    if (t.seller === t.buyer) {
      // Stored output is valued at its price and counted in the firm's profit.
      cash[t.seller] = (cash[t.seller] || 0) + t.value;
      continue;
    }
    if (isFirm(t.seller)) cash[t.seller] = (cash[t.seller] || 0) + t.value;
    // Inputs are a cost of this year's production; goods bought to keep in
    // stock are an asset the firm still owns, so they don't reduce profit.
    if (isFirm(t.buyer) && t.use === "input") cash[t.buyer] = (cash[t.buyer] || 0) - t.value;
  }
  let W = 0, P = 0;
  const profits = {};
  for (const f of Object.keys({ ...cash, ...wages })) {
    const w = wages[f] || 0;
    profits[f] = (cash[f] || 0) - w;
    W += w;
    P += profits[f];
  }
  return { wages: W, profits: P, byFirm: profits, total: W + P };
}

/* Everything that was sold, by anyone to anyone, counted once per sale. */
export function totalSales({ tx }) {
  return tx.filter((t) => t.seller !== t.buyer).reduce((a, t) => a + t.value, 0);
}

/*
  Import content of each final use: purchases made straight from abroad, plus
  the imported inputs inside what domestic firms sold to that use (in
  proportion to the firm's output).
*/
export function importContentByUse({ tx }) {
  const made = {}, importedIn = {};
  for (const t of tx) {
    if (isFirm(t.seller)) made[t.seller] = (made[t.seller] || 0) + t.value;
    if (t.seller === "abroad" && t.use === "input") importedIn[t.buyer] = (importedIn[t.buyer] || 0) + t.value;
  }
  const content = { consumption: 0, inventory: 0, export: 0 };
  for (const t of tx) {
    if (t.use === "input" || !(t.use in content)) continue;
    if (t.seller === "abroad") content[t.use] += t.value;
    else content[t.use] += (t.value * (importedIn[t.seller] || 0)) / made[t.seller];
  }
  return content;
}

/*
  The lines of a GDP release between two ledgers: as published (each use at
  what buyers paid, imports as their own line), and with each use net of its
  own import content.
*/
export function contributions(before, after) {
  const e0 = expenditure(before), e1 = expenditure(after);
  const m0 = importContentByUse(before), m1 = importContentByUse(after);
  return {
    conventional: {
      consumption: e1.C - e0.C,
      inventories: e1.I - e0.I,
      netExports: (e1.X - e1.M) - (e0.X - e0.M),
    },
    adjusted: {
      consumption: (e1.C - m1.consumption) - (e0.C - m0.consumption),
      inventories: (e1.I - m1.inventory) - (e0.I - m0.inventory),
      netExports: (e1.X - m1.export) - (e0.X - m0.export),
    },
    dGDP: e1.total - e0.total,
    production: production(after).total - production(before).total,
  };
}

/*
  The lab. Households spend `bikeSpend` on imported bicycles, and a share d of
  that money comes out of what they would otherwise have spent on bread.
*/
export function displacement(d, importedFlour, bikeSpend = BIKES) {
  const before = economy({ importedFlour, bikeSpend });
  const after = economy({ importedFlour, bikes: true, bread: BREAD - d * bikeSpend, bikeSpend });
  const c = contributions(before, after);
  return {
    dGDP: c.dGDP,
    dC: c.conventional.consumption,
    netExports: c.conventional.netExports,
    adjustedC: c.adjusted.consumption,
    adjustedNX: c.adjusted.netExports,
    production: c.production,
  };
}

/* A stockpiling quarter: firms import `amount` of goods ahead of a tariff and keep them. */
export function stockpile(amount) {
  return contributions(economy({}), economy({ stockpile: amount }));
}

/* A chain of k firms, each adding the same value, ending in a final sale of `final`. */
export function chain(k, final = BREAD) {
  const v = final / k;
  const sales = Array.from({ length: k }, (_, j) => v * (j + 1));
  return { sales, total: sales.reduce((a, b) => a + b, 0), gdp: final, perStage: v };
}
