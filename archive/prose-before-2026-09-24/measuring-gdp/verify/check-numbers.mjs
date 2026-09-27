/*
  Re-derives every number measuring-gdp's prose states, from the modules the
  page imports. The three approaches are read from one ledger by three readers
  in accounts.js that share no code; this file adds a fourth route, the
  domestic content of each final use, written here from scratch.
*/
import {
  economy, production, expenditure, income, totalSales, displacement, chain, stockpile,
} from "../src/accounts.js";
import { BIKES, UNSOLD, STOCKPILE, BREAD } from "../src/datasets.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

/* A fourth route: GDP as the domestic content of final uses, from the ledger
   alone. A final purchase from a domestic firm counts its price minus any
   imported inputs inside it (flour bought from abroad by the seller, per euro
   of what the seller made); a final purchase from abroad counts nothing. */
function domesticContent({ tx }) {
  const made = {}, importedIn = {};
  for (const t of tx) {
    if (t.seller !== "abroad" && t.seller !== "households") made[t.seller] = (made[t.seller] || 0) + t.value;
    if (t.seller === "abroad" && t.use === "input") importedIn[t.buyer] = (importedIn[t.buyer] || 0) + t.value;
  }
  let y = 0;
  for (const t of tx) {
    if (t.use === "input") continue;
    if (t.seller === "abroad") continue;
    const foreignShare = (importedIn[t.seller] || 0) / made[t.seller];
    y += t.value * (1 - foreignShare);
  }
  return y;
}

// --- the base year ----------------------------------------------------------
{
  const e = economy({});
  const p = production(e), x = expenditure(e), inc = income(e);
  ok("the base ledger is wheat €30, flour €50 and bread €100",
     e.tx.map((t) => `${t.what}:${t.value}`).join(",") === "wheat:30,flour:50,bread:100",
     e.tx.map((t) => `${t.what}:${t.value}`).join(","));
  ok("value added is €30 on the farm, €20 at the mill and €50 at the bakery",
     p.byFirm.farm === 30 && p.byFirm.mill === 20 && p.byFirm.bakery === 50, JSON.stringify(p.byFirm));
  ok("households spend €100, and GDP is €100 three ways",
     x.C === 100 && p.total === 100 && x.total === 100 && close(inc.total, 100));
  ok("the income side is €67 of wages and €33 of profits",
     close(inc.wages, 67) && close(inc.profits, 33), `${inc.wages} + ${inc.profits}`);
  ok("all sales add up to €180", totalSales(e) === 180, `${totalSales(e)}`);
  ok("each euro of value added is counted once per sale it passes through: 30·3 + 20·2 + 50·1 = 180",
     30 * 3 + 20 * 2 + 50 * 1 === totalSales(e));
  ok("the domestic-content route gives the same €100", domesticContent(e) === 100);
}

// --- the three approaches agree in all sixteen combinations ------------------
{
  let worstInc = 0, prodExp = 0, dom = 0;
  for (let m = 0; m < 16; m++) {
    const o = { bikes: !!(m & 1), importedFlour: !!(m & 2), merged: !!(m & 4), unsold: !!(m & 8) };
    const e = economy(o);
    const p = production(e).total, x = expenditure(e).total, inc = income(e).total;
    if (p !== x) prodExp++;
    if (!close(domesticContent(e), p)) dom++;
    worstInc = Math.max(worstInc, Math.abs(inc - p));
  }
  ok("production and expenditure agree with === in all 16 combinations of the four events", prodExp === 0, `${prodExp} disagree`);
  ok("income agrees to machine precision in all 16 (profit is a residual after float wage bills)", worstInc < 1e-12, worstInc.toExponential(2));
  ok("the domestic-content route agrees in all 16", dom === 0);
}

// --- the four events ----------------------------------------------------------
{
  const g = (o) => production(economy(o)).total;
  const bikes = expenditure(economy({ bikes: true }));
  ok("imported bikes: spending €140, imports €40, GDP unchanged",
     bikes.C === 140 && bikes.M === BIKES && bikes.total === 100 && g({ bikes: true }) === 100);
  ok("imported flour: GDP falls by exactly €50, the mill's €20 plus the farm's €30", g({ importedFlour: true }) === 50);
  ok("the merger: sales fall to €130 and GDP stays at €100",
     totalSales(economy({ merged: true })) === 130 && g({ merged: true }) === 100);
  const uns = expenditure(economy({ unsold: true }));
  ok("unsold bread: households spend €80, stock investment is €20, GDP stays at €100",
     uns.C === BREAD - UNSOLD && uns.I === UNSOLD && uns.total === 100);
  const lowers = ["bikes", "importedFlour", "merged", "unsold"].filter((k) => g({ [k]: true }) < 100);
  ok("exactly one of the four events lowers GDP, and it is the imported flour",
     lowers.length === 1 && lowers[0] === "importedFlour", lowers.join(","));
}

// --- the chain ----------------------------------------------------------------
{
  let worst = 0;
  for (let k = 1; k <= 8; k++) worst = Math.max(worst, Math.abs(chain(k).total - (100 * (k + 1)) / 2));
  ok("a chain of k equal firms sells (k + 1)/2 times GDP, k = 1…8", worst < 1e-12, worst.toExponential(2));
  ok("…and the bread at the end is always €100", [1, 2, 3, 8].every((k) => chain(k).gdp === 100));
}

// --- the lab ------------------------------------------------------------------
{
  let nxFlat = 0, gdpLine = 0, adj = 0, nxImp = 0, gdpImp = 0, prodRoute = 0;
  for (let i = 0; i <= 20; i++) {
    const d = (5 * i) / 100; // the slider's grid
    const a = displacement(d, false), b = displacement(d, true);
    if (a.netExports !== -BIKES) nxFlat++;
    gdpLine = Math.max(gdpLine, Math.abs(a.dGDP + BIKES * d));
    gdpImp = Math.max(gdpImp, Math.abs(b.dGDP + BIKES * d * 0.5));
    nxImp = Math.max(nxImp, Math.abs(b.netExports - (-BIKES + BIKES * d * 0.5)));
    adj = Math.max(adj, Math.abs(a.adjustedC - a.dGDP), Math.abs(b.adjustedC - b.dGDP));
    prodRoute = Math.max(prodRoute, Math.abs(a.production - a.dGDP), Math.abs(b.production - b.dGDP));
  }
  ok("with home-made flour the net-exports line reads −€40 at every slider position (===)", nxFlat === 0, `${nxFlat} positions differ`);
  ok("…while GDP changes by exactly −€40·d", gdpLine < 1e-12, gdpLine.toExponential(2));
  ok("with imported flour GDP changes by −€20·d: the line is half as steep", gdpImp < 1e-12, gdpImp.toExponential(2));
  ok("…and the net-exports line slopes: −€40 + €20·d", nxImp < 1e-12, nxImp.toExponential(2));
  ok("consumption net of its own imports equals the change in GDP exactly, both settings", adj < 1e-12, adj.toExponential(2));
  ok("…and the trade line net of import content reads zero at every position",
     [0, 0.35, 0.6, 1].every((d) => displacement(d, false).adjustedNX === 0 && Math.abs(displacement(d, true).adjustedNX) < 1e-12));
  ok("the production route agrees with the spending route at every position", prodRoute < 1e-12, prodRoute.toExponential(2));
  const at6 = displacement(0.6, false), at6i = displacement(0.6, true);
  ok("at 60%: consumption +€16, net exports −€40, GDP −€24",
     close(at6.dC, 16) && at6.netExports === -40 && close(at6.dGDP, -24),
     `${at6.dC}, ${at6.netExports}, ${at6.dGDP}`);
  ok("at 60% with imported flour, the island loses €12 of production", close(at6i.dGDP, -12), `${at6i.dGDP}`);
  ok("GDP's change runs from €0 to −€40 across the slider",
     displacement(0, false).dGDP === 0 && displacement(1, false).dGDP === -40);
}

// --- the stockpiling quarter ------------------------------------------------------
{
  const q = stockpile(STOCKPILE);
  ok("a stockpiling quarter is published as net exports −€40 and inventories +€40",
     q.conventional.netExports === -40 && q.conventional.inventories === 40);
  ok("…and nets to zero on both lines when each use is counted net of its own imports, GDP unchanged",
     q.adjusted.netExports === 0 && q.adjusted.inventories === 0 && q.dGDP === 0 && q.production === 0);
  ok("…and the stockpile ledger still agrees three ways",
     production(economy({ stockpile: STOCKPILE })).total === 100 && expenditure(economy({ stockpile: STOCKPILE })).total === 100
     && close(income(economy({ stockpile: STOCKPILE })).total, 100) && domesticContent(economy({ stockpile: STOCKPILE })) === 100);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
