// Every number on the page, from src/forwards.js, in page order and rounded
// as the page rounds. The arbitrage is run as a trade on every seeded path,
// the tailed futures position is settled day by day against the forward's
// payoff, and the oil numbers are checked against the reported changes.
import * as F from "../src/forwards.js";
import { normals } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r2 = (x) => +x.toFixed(2), r3 = (x) => +x.toFixed(3);

console.log("-- 20 April 2020 (quoted)");
{
  eq("May oil: −$37.63", F.WTI.mon.may, -37.63, 1e-12);
  eq("June oil: $20.43", F.WTI.mon.june, 20.43, 1e-12);
  eq("the Friday before, May: $18.27 (−37.63 + 55.90)", r2(F.WTI.mon.may - F.WTI.change.may), F.WTI.fri.may, 1e-12);
  eq("and June: $25.03 (20.43 + 4.60)", r2(F.WTI.mon.june - F.WTI.change.june), F.WTI.fri.june, 1e-12);
  eq("June cost $6.76 more on Friday", r2(F.WTI.fri.june - F.WTI.fri.may), 6.76, 0);
  eq("and $58.06 more on Monday", r2(F.WTI.mon.june - F.WTI.mon.may), 58.06, 0);
}

console.log("-- the cost of carry");
{
  eq("index at $100, dividends 1.5%, safe rate 4%", F.S0 + F.Q + F.R, 100.055, 1e-12);
  eq("F = 100 e^(0.04 − 0.015) = 102.53", r2(F.forward()), 102.53, 0);
  const a = F.arbitrage(104);
  eq("at $104: borrow $98.51", r2(a.borrowed), 98.51, 0);
  eq("buy 0.985 of a unit", r3(a.shares), 0.985, 0);
  eq("which grows to exactly one with dividends reinvested", a.shares * Math.exp(F.Q * F.T), 1, 1e-12);
  eq("repay $102.53", r2(a.owed), 102.53, 0);
  eq("keep $1.47", r2(a.locked), 1.47, 0);
  // the trade on each of the lab's forty seeded paths, with dividends reinvested daily
  const P = F.paths(normals(4), 40, 50, 0.08);
  let worst = 0;
  for (const p of P) {
    // hold e^(-qT) units, reinvest the dividend yield continuously: units at T = 1 exactly
    const units = a.shares * Math.exp(F.Q * F.T);
    const money = units * p[50] - a.owed + (104 - p[50]);
    worst = Math.max(worst, Math.abs(money - 1.468487947557108));
  }
  eq("every one of the forty years ends at $1.47", worst, 0, 1e-9);
  truth("the forty paths stay inside $60 to $160", P.every((p) => p.every((v) => v > 60 && v < 160)));
  const b = F.arbitrage(100);
  truth("below $102.53 the trade turns around", b.side === "reverse" && r2(b.locked) === 2.53);
  truth("at $102.53 there's nothing to do", F.arbitrage(F.forward()).side === "none");
  const pc = F.pieces(130, 104);
  eq("the share and the forward pay in opposite directions and add to a flat line", pc.share + pc.forward, pc.total, 1e-12);
  truth("the quoted-price slider holds $104", Math.abs((104 - 96) / 0.05 - Math.round((104 - 96) / 0.05)) < 1e-9);
}

console.log("-- a price, not a forecast");
{
  eq("guess card: both should accept $102.53", r2(F.forward()), 102.53, 0);
  eq("at 8% expected they expect $106.72", r2(F.expected(0.08)), 106.72, 0);
  eq("and buying forward expects to make $4.18", r2(F.expected(0.08) - F.forward()), 4.18, 0);
  eq("at 4%, the safe rate, the lines meet", F.expected(0.04), F.forward(), 1e-12);
  // the expected path is what seeded paths average to
  const P = F.paths(normals(9), 40000, 4, 0.08);
  const m = P.reduce((s, p) => s + p[4], 0) / P.length, sd = Math.sqrt(P.reduce((s, p) => s + (p[4] - m) ** 2, 0) / P.length / P.length);
  truth("simulated years average the expected price", Math.abs(m - F.expected(0.08)) < 4 * sd, `${m.toFixed(2)} ± ${sd.toFixed(2)}`);
  const [lo, hi] = F.band(0.08, 1);
  const inside = P.filter((p) => p[4] > lo && p[4] < hi).length / P.length;
  truth("the band holds about 90% of them", Math.abs(inside - 0.9) < 0.006, (100 * inside).toFixed(2));
  truth("the band stays inside $60 to $160 at every expected return", [-0.05, 0.15].every((mu) => { const [l, h] = F.band(mu, 1); return l > 60 && h < 160; }));
}

console.log("-- oil");
{
  eq("oil at $60, storage $0.50 a month", F.OIL.spot + F.OIL.storage, 60.5, 1e-12);
  eq("buying, storing a year and paying interest costs $68.56", r2(F.ceiling(12)), 68.56, 0);
  eq("at $64 the gap is $4.56", r2(F.ceiling(12) - 64), 4.56, 0);
  // the ceiling by a cash account: borrow 60, pay storage monthly from more borrowing
  let debt = 60; for (let k = 1; k <= 12; k++) debt = debt * Math.exp(F.R / 12) + 0.5;
  eq("the ceiling is the debt after a year of borrowing for oil and storage", debt, F.ceiling(12), 1e-12);
  truth("the oil slider holds $64", Math.abs((64 - 50) / 0.05 - Math.round((64 - 50) / 0.05)) < 1e-9);
}

console.log("-- daily settlement");
{
  const runs = { up: 29, down: 3, back: 10 };
  const R = Object.fromEntries(Object.entries(runs).map(([k, s]) => { const p = F.paths(normals(s), 1, 250, 0.08)[0]; return [k, { p, s: F.settle(p) }]; }));
  eq("the futures price starts at the forward price", R.up.s.fut[0], F.forward(), 1e-12);
  eq("and meets the index on the last day", R.up.s.fut[250], R.up.p[250], 1e-12);
  eq("the year that rises: the forward pays $21.39", r2(R.up.s.forward), 21.39, 0);
  eq("one contract all year pays $21.83", r2(R.up.s.cashU[250]), 21.83, 0);
  eq("rises then falls back: the forward loses $9.27", r2(R.back.s.forward), -9.27, 0);
  eq("one contract loses $8.94", r2(R.back.s.cashU[250]), -8.94, 0);
  eq("the year that falls: the forward loses $27.24", r2(R.down.s.forward), -27.24, 0);
  eq("one contract loses $27.88", r2(R.down.s.cashU[250]), -27.88, 0);
  truth("the curated years do what their labels say", R.up.p[250] > 120 && Math.min(...R.up.p) > 99 && R.down.p[250] < 80 && Math.max(...R.down.p) < 106 && Math.max(...R.back.p) > 125 && R.back.p[250] < 100);
  // tailed equals the forward on every path, settled day by day with the account's own interest
  let worst = 0;
  for (let seed = 100; seed < 300; seed++) {
    const p = F.paths(normals(seed), 1, 250, 0.08)[0], s = F.settle(p);
    worst = Math.max(worst, Math.abs(s.cash[250] - s.forward));
  }
  eq("a tailed position lands on the forward's payoff on 200 more paths", worst, 0, 1e-9);
  eq("and on the three in the chart", Math.max(...Object.values(R).map((x) => Math.abs(x.s.cash[250] - x.s.forward))), 0, 1e-9);
  truth("the margin chart's −$30 to $30 holds every tailed account", Object.values(R).every((x) => x.s.cash.every((v) => v > -30 && v < 30)));
  truth("and the third chart's ±$1 holds every gap between the two positions", Object.values(R).every((x) => x.s.cashU.every((v, i) => Math.abs(v - x.s.cash[i]) < 1)));
  eq("the year that rises ends $0.44 apart", r2(R.up.s.cashU[250] - R.up.s.cash[250]), 0.44, 0);
  truth("the price chart's $70 to $150 holds every path", Object.values(R).every((x) => x.p.concat(x.s.fut).every((v) => v > 70 && v < 150)));
}

console.log(`\n${fails ? fails + " FAILED of " + n : "ALL " + n + " CHECKS PASS"}`);
process.exit(fails ? 1 : 0);
