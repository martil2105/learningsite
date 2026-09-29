// Every number the page states. Route A is src/etf.js (the recursion for a NAV
// built from many bonds, and the simulated fund). Route B marks bonds one by one
// with their own random numbers, measures how old the NAV's prices are, and runs
// the fund for far longer than the page does.
import * as E from "../src/etf.js";
import { mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r1 = (x) => Math.round(x * 1000) / 10; // a share as a percentage, one decimal

console.log("-- the arbitrage band");
{
  eq("0.8% over the bonds with a cost of 0.3%: a creation makes 50 cents per $100", 100 * E.createProfit(0.008, 0.003), 0.5, 1e-12);
  eq("and the price is pushed back to the edge of the band, +0.3%", E.afterArbitrage(0.008, 0.003), 0.003, 1e-12);
  truth("inside the band both trades lose money, so nobody acts", [-0.0029, -0.001, 0, 0.001, 0.0029].every((x) => E.createProfit(x, 0.003) < 0 && E.redeemProfit(x, 0.003) < 0));
  truth("outside it exactly one of them pays", [-0.012, -0.004, 0.004, 0.012].every((x) => (E.createProfit(x, 0.003) > 0) !== (E.redeemProfit(x, 0.003) > 0)));
  const days = E.ordinaryDays({ p: 0.2 });
  truth("on ordinary days the price never leaves the band around what the bonds are worth", days.every((d) => Math.abs(d.P / d.V - 1) <= 0.003 + 1e-12));
  truth("but the reported premium over the NAV often does", days.filter((d) => Math.abs(d.P / d.nav - 1) > 0.003).length > days.length / 2);
}

console.log("-- a NAV built from last trades");
{
  // route B: the age of each bond's price, measured in a long simulation
  const u = mulberry32(8), B = 2000, T = 400, p = 0.2;
  const last = new Int32Array(B); let ages = 0, cnt = 0;
  for (let t = 1; t <= T; t++) { for (let i = 0; i < B; i++) if (u() < p) last[i] = t; if (t > 100) { for (let i = 0; i < B; i++) ages += t - last[i]; cnt += B; } }
  truth("on average the prices in the NAV are (1 - p)/p days old: four at a fifth a day", Math.abs(ages / cnt - (1 - p) / p) < 0.05, (ages / cnt).toFixed(3));
  // the recursion against a NAV built bond by bond
  const exact = E.sellOff({ p: 0.2 });
  const many = E.sellOffBonds({ p: 0.2, bonds: 40000, seed: 5 });
  let worst = 0; for (let t = 0; t <= 20; t++) worst = Math.max(worst, Math.abs(many[t].nav - exact[t].nav));
  truth("with many bonds, a NAV built bond by bond follows the recursion (within 5 cents on $100)", worst < 0.05, worst.toFixed(4));
  const two = E.sellOffBonds({ p: 0.2, bonds: 200, seed: 3 });
  let w2 = 0; for (let t = 0; t <= 20; t++) w2 = Math.max(w2, Math.abs(two[t].nav - exact[t].nav));
  truth("and with 200 bonds it stays within 70 cents of it", w2 < 0.7, w2.toFixed(3));
}

console.log("-- the sell-off");
{
  const s = E.sellOff({ fall: 0.1, p: 0.2 });
  eq("the bonds fall 10% over five days", s[5].V, 90, 1e-9);
  eq("by the fifth day the fund reports a discount of 5.6%", r1(s[5].prem), -5.6, 0);
  truth("which is the deepest", s.every((o) => o.prem >= s[5].prem));
  eq("five days later it's 1.9%", r1(s[10].prem), -1.9, 0);
  let wf = 0; for (let t = 6; t <= 20; t++) wf = Math.max(wf, Math.abs((s[t].V - s[t].nav) - 0.8 * (s[t - 1].V - s[t - 1].nav)));
  truth("once the fall stops, the NAV closes a fifth of what's left of its gap every day", wf < 1e-12, wf.toExponential(1));
  truth("the ETF's price is what the bonds are worth all the way through", s.every((o) => o.P === o.V));
  const all = E.sellOff({ fall: 0.1, p: 1 });
  truth("if every bond trades every day there's no discount at all", all.every((o) => Math.abs(o.prem) < 1e-12));
  const big = E.sellOff({ fall: 0.2, p: 0.2 });
  const ratio = big[5].prem / s[5].prem;
  truth("a fall of 20% gives a discount roughly twice as deep", ratio > 1.8 && ratio < 2.3, ratio.toFixed(3));
  // the lab's window: the deepest discount it can show fits in the lower chart
  let deepest = 0; for (let f = 0; f <= 0.2 + 1e-9; f += 0.01) for (let p = 0.1; p <= 1 + 1e-9; p += 0.05) for (const o of E.sellOff({ fall: f, p })) deepest = Math.min(deepest, o.prem);
  truth("every discount the lab can show fits in its window (−17%)", deepest > -0.17, (100 * deepest).toFixed(2));
  truth("and every price and NAV in its upper window ($78 to $102)", (() => { for (let f = 0; f <= 0.2 + 1e-9; f += 0.01) for (const o of E.sellOff({ fall: f, p: 0.1 })) if (o.V < 78 || o.nav > 102) return false; return true; })());
  eq("the lab's average age of prices at a fifth a day is 4.0 days", (1 - 0.2) / 0.2, 4, 1e-12);
}

console.log("-- who closes the gap");
{
  const days = E.ordinaryDays({ days: 1000, p: 0.2 });
  let worst = 0; for (const d of days) worst = Math.max(worst, Math.abs(Math.log(d.P / d.nav) - (Math.log(d.P / d.V) + Math.log(d.V / d.nav))));
  truth("the log premium splits into the price's gap and the NAV's gap", worst < 1e-14, worst.toExponential(1));
  const pts = E.nextDay(days);
  const sN = E.slope(pts, "dNav").slope, sP = E.slope(pts, "dP").slope;
  eq("the page's thousand days: the NAV's slope is 0.19", Math.round(100 * sN) / 100, 0.19, 0);
  truth("and the price's is close to zero", Math.abs(sP) < 0.05, sP.toFixed(3));
  eq("so after a 5% discount the NAV tends to fall about 1% the next day", Math.round(5 * sN), 1, 0);
  // route B: far longer runs, and other shares of bonds trading
  for (const p of [0.1, 0.2, 0.3]) {
    const q = E.nextDay(E.ordinaryDays({ days: 40000, p, seed: 99 }));
    const a = E.slope(q, "dNav").slope, b = E.slope(q, "dP").slope;
    truth(`over 40,000 days at ${100 * p}%: the NAV's slope is within 0.03 of p and the price's within 0.05 of zero`, Math.abs(a - p) < 0.03 && Math.abs(b) < 0.05, `${a.toFixed(3)} ${b.toFixed(3)}`);
  }
  const at = (p) => { const q = E.nextDay(E.ordinaryDays({ days: 1000, p })); return [E.slope(q, "dNav").slope, E.slope(q, "dP").slope]; };
  const [n5, p5] = at(0.5), [n2, p2] = at(0.2);
  truth("dragging the share up, the NAV's slope follows it and the price's turns more negative", n5 > n2 + 0.15 && p5 < p2 - 0.03, `${n2.toFixed(3)} → ${n5.toFixed(3)}, ${p2.toFixed(3)} → ${p5.toFixed(3)}`);
  const small = (p) => { const q = E.nextDay(E.ordinaryDays({ days: 1000, p })); return Math.sqrt(q.reduce((a, x) => a + x.prem * x.prem, 0) / q.length); };
  truth("and the premium is smaller then", small(0.5) < 0.6 * small(0.2), `${(100 * small(0.2)).toFixed(2)}% → ${(100 * small(0.5)).toFixed(2)}%`);
  // most of the premium at a fifth a day is the NAV's gap
  const share = days.reduce((a, d) => a + Math.log(d.V / d.nav) ** 2, 0) / days.reduce((a, d) => a + Math.log(d.P / d.nav) ** 2, 0);
  truth("most of the premium at a fifth a day is the NAV's gap", share > 0.9, share.toFixed(3));
}

console.log(fails ? `\n${fails} CHECKS FAILED of ${n}` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
