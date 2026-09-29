// Every number the page states. Route A is src/gm.js. Route B never uses its
// belief lattice: it enumerates who arrives and weighs the two values directly
// (Bayes by counting), simulates many days with its own random numbers, and adds
// up spreads over long horizons instead of solving the lattice system.
import * as G from "../src/gm.js";
import { mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r2 = (x) => Math.round(x * 100) / 100;
const D = G.D;

// route B: the value given a history of trades, by weighing the two values directly
function bayes(history, mu) {
  // chance of the history if the stock is worth VH, and if it's worth VL
  let pH = 0.5, pL = 0.5;
  for (const buy of history) {
    pH *= buy ? mu + (1 - mu) / 2 : (1 - mu) / 2;
    pL *= buy ? (1 - mu) / 2 : mu + (1 - mu) / 2;
  }
  return pH / (pH + pL);
}

console.log("-- the first quotes");
{
  eq("at 10% informed a buy means $101 with a chance of 55%", G.highGivenBuy(0.1), 0.55, 1e-12);
  eq("27.5% of all orders are buys when the stock is worth $101", 0.5 * (G.cells(0.1).high.informedBuy + G.cells(0.1).high.randomBuy), 0.275, 1e-12);
  eq("22.5% are buys when it's worth $99", 0.5 * (G.cells(0.1).low.informedBuy + G.cells(0.1).low.randomBuy), 0.225, 1e-12);
  eq("the ask is $100.10", G.ask(0, 0.1), 10010, 1e-12);
  eq("the bid is $99.90", G.bid(0, 0.1), 9990, 1e-12);
  eq("the spread is 20 cents", G.spread(0, 0.1), 20, 1e-12);
  let worst = 0;
  for (let mu = 0; mu <= 0.99; mu += 0.01) {
    worst = Math.max(worst, Math.abs(G.spread(0, mu) - mu * D), Math.abs(G.ask(0, mu) - (G.MID + mu * D / 2)), Math.abs(G.bid(0, mu) - (G.MID - mu * D / 2)));
    worst = Math.max(worst, Math.abs(G.highGivenBuy(mu) - (1 + mu) / 2), Math.abs(G.belief(1, mu) - bayes([true], mu)));
  }
  truth("at even odds the spread is mu times D, the ask mid + mu D/2 and the chance (1 + mu)/2, for every mu", worst < 1e-9, worst.toExponential(1));
  eq("with nobody informed the spread closes", G.spread(0, 0), 0, 1e-12);
  eq("at 50% it's a whole dollar", G.spread(0, 0.5), 100, 1e-12);
  truth("the figure's cells (as shares of all traders) sum to one", Math.abs(0.5 * Object.values(G.cells(0.3).high).reduce((a, b) => a + b, 0) + 0.5 * Object.values(G.cells(0.3).low).reduce((a, b) => a + b, 0) - 1) < 1e-12);
}

console.log("-- quotes after a history, against Bayes by counting");
{
  const u = mulberry32(2024);
  let worst = 0;
  for (let trial = 0; trial < 400; trial++) {
    const mu = 0.02 + 0.5 * u(), len = Math.floor(40 * u());
    const hist = Array.from({ length: len }, () => u() < 0.5);
    const k = hist.reduce((a, b) => a + (b ? 1 : -1), 0);
    const ask = G.VL + D * bayes([...hist, true], mu), bid = G.VL + D * bayes([...hist, false], mu);
    worst = Math.max(worst, Math.abs(ask - G.ask(k, mu)) / D, Math.abs(bid - G.bid(k, mu)) / D);
  }
  truth("the lattice quotes equal the value given the history plus a buy or a sell", worst < 1e-12, worst.toExponential(1));
  // only net buys matter
  truth("two histories with the same net buys give the same quotes", Math.abs(bayes([true, false, true], 0.2) - bayes([true, true, false], 0.2)) < 1e-15 && Math.abs(bayes([true, false, true], 0.2) - G.belief(1, 0.2)) < 1e-12);
  eq("each buy multiplies the odds by 11/9 at 10%", (G.belief(1, 0.1) / (1 - G.belief(1, 0.1))) / (G.belief(0, 0.1) / (1 - G.belief(0, 0.1))), 11 / 9, 1e-12);
  let wf = 0;
  for (const mu of [0.05, 0.1, 0.3, 0.6]) for (let k = -20; k <= 20; k++) wf = Math.max(wf, Math.abs(G.spread(k, mu) - G.spreadAt(G.belief(k, mu), mu)) / D);
  truth("the spread written as a function of the belief x matches the quotes", wf < 1e-12, wf.toExponential(1));
  truth("the spread is widest at even odds and closes as we become sure either way", [0.1, 0.3].every((mu) => { for (let x = 0.01; x < 0.5; x += 0.01) if (!(G.spreadAt(x, mu) < G.spreadAt(x + 0.01, mu) + 1e-12)) return false; return Math.abs(G.spreadAt(0.3, mu) - G.spreadAt(0.7, mu)) < 1e-12 && G.spreadAt(0.001, mu) < 0.01 * G.spreadAt(0.5, mu) * 10; }));
}

console.log("-- who pays: the ledger");
{
  const mu = 0.1, s = G.spread(0, mu);
  eq("a trader who knows nothing loses half the spread on average, 10 cents", s / 2, 10, 1e-12);
  eq("a trader who knows takes 90 cents", G.VH - G.ask(0, mu), 90, 1e-12);
  eq("both sides of the ledger come to 9 cents a trade", (1 - mu) * s / 2, 9, 1e-12);
  eq("and mu (D - s)/2 is the same 9 cents", mu * (D - s) / 2, 9, 1e-12);
  // the market maker breaks even on every trade, at every belief, averaged over the two values
  let worst = 0, unf = 0;
  for (const m of [0.03, 0.1, 0.25, 0.5]) for (let k = -15; k <= 15; k++) {
    const x = G.belief(k, m), a = G.ask(k, m), b = G.bid(k, m);
    let pnl = 0;
    for (const [V, px] of [[G.VH, x], [G.VL, 1 - x]]) {
      const pb = V === G.VH ? m + (1 - m) / 2 : (1 - m) / 2;
      pnl += px * (pb * (a - V) + (1 - pb) * (V - b));
    }
    worst = Math.max(worst, Math.abs(pnl));
    // an uninformed trader loses half the spread on average whichever value is true
    for (const V of [G.VH, G.VL]) unf = Math.max(unf, Math.abs(0.5 * (a - V) + 0.5 * (V - b) - (a - b) / 2));
  }
  truth("the market maker's average profit on a trade is zero at every belief", worst < 1e-9, worst.toExponential(1));
  truth("an uninformed trader loses half the spread on average, whatever the stock is worth", unf < 1e-9);
}

console.log("-- the lab's days");
{
  const d1 = G.day(G.seedOf(1), 0.1, true, 300), e1 = d1.trades[299];
  eq("day 1: the traders who didn't know end $10.06 down", r2(e1.unf / 100), -10.06, 0);
  eq("day 1: the ones who knew end $11.44 up", r2(e1.inf / 100), 11.44, 0);
  eq("day 1: we end $1.39 down", r2(e1.mm / 100), -1.39, 0);
  truth("day 1: buys outnumber sells and the quotes end near $101", d1.kEnd > 20 && d1.trades[299].bid > 10090, `net buys ${d1.kEnd}`);
  truth("day 1: the spread has closed a lot by trade 300", G.spread(d1.kEnd, 0.1) < 0.1 * 20);
  const d2 = G.day(G.seedOf(2), 0.1, true, 300), e2 = d2.trades[299];
  eq("day 2: the traders who didn't know have lost $70.83", r2(e2.unf / 100), -70.83, 0);
  eq("day 2: we're $23.58 ahead", r2(e2.mm / 100), 23.58, 0);
  const low = d2.trades.filter((t) => G.value(t.k, 0.1) < G.MID).length;
  const minBid = Math.min(...d2.trades.map((t) => t.bid));
  truth("day 2: our quotes sit below $100 for most of the day and get close to $99", low >= 250 && minBid < 9910, `${low} of 300 trades below $100, lowest bid ${(minBid / 100).toFixed(2)}`);
  truth("day 2: after a good start the quotes fall towards $99 before trade 60", d2.trades.slice(0, 40).some((t) => G.value(t.k, 0.1) > 10030) && d2.trades.slice(0, 60).some((t) => t.ask < 9920));
  // the scores always add up to zero, on every day, at every trade
  let worst = 0;
  for (let dn = 1; dn <= 12; dn++) for (const hi of [true, false]) for (const m of [0.05, 0.1, 0.3]) {
    const d = G.day(G.seedOf(dn), m, hi, 300);
    for (const t of d.trades) worst = Math.max(worst, Math.abs(t.mm + t.inf + t.unf));
  }
  truth("the three scores add up to zero at every trade", worst < 1e-9, worst.toExponential(1));
  // moving mu replays the same arrivals
  const a = G.day(G.seedOf(1), 0.1, true, 300), b = G.day(G.seedOf(1), 0.2, true, 300);
  truth("moving the informed share replays the same random traders", a.trades.every((t, i) => t.informed || b.trades[i].informed || t.buy === b.trades[i].buy));
  truth("the informed only ever buy when the stock is worth $101", a.trades.filter((t) => t.informed).every((t) => t.buy));
}

console.log("-- how fast the price learns");
{
  eq("20%: the average spread halves after 22 trades", G.tradesTo(0.2, 0.5), 22, 0);
  eq("10%: after 85", G.tradesTo(0.1, 0.5), 85, 0);
  eq("5%: after 341", G.tradesTo(0.05, 0.5), 341, 0);
  eq("to a tenth: 83 at 20%", G.tradesTo(0.2, 0.1), 83, 0);
  eq("to a tenth: 336 at 10%", G.tradesTo(0.1, 0.1), 336, 0);
  eq("to a tenth: 1,344 at 5%", G.tradesTo(0.05, 0.1), 1344, 0);
  const r = [341 / 85, 85 / 22, 1344 / 336, 336 / 83];
  truth("each halving takes about four times as many trades", r.every((v) => v > 3.8 && v < 4.1), r.map((v) => v.toFixed(2)).join(" "));
  eq("the drift of the log odds is mu ln((1+mu)/(1-mu)), about 2 mu^2: 0.0201 at 10%", 0.1 * G.ell(0.1), 0.02, 0.01);
  truth("and the approximation is within 1% at 10% and 5%", Math.abs(0.1 * G.ell(0.1) / 0.02 - 1) < 0.01 && Math.abs(0.05 * G.ell(0.05) / (2 * 0.05 * 0.05) - 1) < 0.01);
  // route B: simulate many days and average the spread after n trades
  const u = mulberry32(99), DAYS = 20000, mu = 0.1, marks = [0, 20, 85, 200];
  const sums = marks.map(() => 0), sq = marks.map(() => 0);
  for (let d = 0; d < DAYS; d++) {
    let k = 0;
    for (let t = 0; t <= 200; t++) {
      const j = marks.indexOf(t);
      if (j >= 0) { const s = G.spread(k, mu); sums[j] += s; sq[j] += s * s; }
      const informed = u() < mu, buy = informed ? true : u() < 0.5;
      k += buy ? 1 : -1;
    }
  }
  const exact = G.expectedSpreads(mu, 201);
  const zs = marks.map((t, j) => { const m = sums[j] / DAYS, sd = Math.sqrt(sq[j] / DAYS - m * m) / Math.sqrt(DAYS); return sd > 0 ? Math.abs(m - exact[t]) / sd : Math.abs(m - exact[t]); });
  truth("simulated days agree with the exact average spread within four standard errors", zs.every((z) => z < 4), zs.map((z) => z.toFixed(2)).join(" "));
}

console.log("-- the bill for a piece of news");
{
  eq("never announced, 10% informed: $12.48", r2(G.billNever(0.1) / 100), 12.48, 0);
  eq("5%: $26.34", r2(G.billNever(0.05) / 100), 26.34, 0);
  truth("halving the share roughly doubles the bill", G.billNever(0.05) / G.billNever(0.1) > 2 && G.billNever(0.05) / G.billNever(0.1) < 2.2, (G.billNever(0.05) / G.billNever(0.1)).toFixed(3));
  truth("the ln 2 limit is within 0.1% at 5% and 10%, and exact as the share shrinks", [0.05, 0.1].every((m) => Math.abs(G.billNever(m) / G.billLimit(m) - 1) < 1e-3) && Math.abs(G.billNever(0.001) / G.billLimit(0.001) - 1) < 1e-5, [0.001, 0.05, 0.1].map((m) => (G.billNever(m) / G.billLimit(m)).toFixed(6)).join(" "));
  // route B: add up the exact average spreads over a long horizon instead of solving the lattice
  eq("adding up spreads over 6,000 trades gives the same bill at 10%", G.billBefore(0.1, 6000), G.billNever(0.1), 1e-6);
  eq("and over 20,000 at 5%", G.billBefore(0.05, 20000), G.billNever(0.05), 1e-6);
  // route C: what simulated uninformed traders actually lose over long days
  const u = mulberry32(7), mu = 0.1, DAYS = 6000, T = 2500;
  let tot = 0, tot2 = 0, totInf = 0;
  for (let d = 0; d < DAYS; d++) {
    const high = u() < 0.5, V = high ? G.VH : G.VL;
    let k = 0, lost = 0, won = 0;
    for (let t = 0; t < T; t++) {
      const informed = u() < mu, buy = informed ? high : u() < 0.5;
      const price = buy ? G.ask(k, mu) : G.bid(k, mu), g = buy ? V - price : price - V;
      if (informed) won += g; else lost -= g;
      k += buy ? 1 : -1;
      if (Math.abs(k) > 60) break;
    }
    tot += lost; tot2 += lost * lost; totInf += won;
  }
  const m = tot / DAYS, se = Math.sqrt(tot2 / DAYS - m * m) / Math.sqrt(DAYS);
  truth("simulated uninformed traders lose the bill on average, within four standard errors", Math.abs(m - G.billNever(0.1)) < 4 * se, `${(m / 100).toFixed(2)} ± ${(se / 100).toFixed(2)}`);
  truth("and the informed win about the same", Math.abs(totInf / DAYS - m) < 6 * se, `${(totInf / DAYS / 100).toFixed(2)}`);
  // with an announcement
  const cur = G.billCurve(100), i100 = cur.indexOf(Math.max(...cur));
  eq("news after 100 trades: the bill peaks at 12% informed", G.MUS[i100], 0.12, 1e-9);
  eq("at $6.22", r2(cur[i100] / 100), 6.22, 0);
  const c1000 = G.billCurve(1000), i1000 = c1000.indexOf(Math.max(...c1000));
  eq("news after 1,000 trades: the peak moves to 4%", G.MUS[i1000], 0.04, 1e-9);
  const c250 = G.billCurve(250), i250 = c250.indexOf(Math.max(...c250));
  eq("news after 250 trades: 8%", G.MUS[i250], 0.08, 1e-9);
  const ks = [100, 250, 1000].map((N) => G.peak(N).mu * Math.sqrt(N));
  truth("the peak sits near 1.2 over the square root of the number of trades", ks.every((v) => v > 1.15 && v < 1.3), ks.map((v) => v.toFixed(3)).join(" "));
  truth("the bill is small when hardly anyone knows and when many do", cur[0] < 0.4 * cur[i100] && cur[49] < 0.4 * cur[i100]);
  truth("the dashed curve (never announced) lies above every announced curve", [100, 250, 1000].every((N) => G.billCurve(N).every((v, i) => v <= G.billCurve(Infinity)[i] + 1e-6)));
  truth("the chart's window ($30) holds every announced curve, and the never curve leaves it on the left", [100, 250, 1000].every((N) => Math.max(...G.billCurve(N)) < 3000) && G.billCurve(Infinity)[0] > 3000 && G.billCurve(Infinity)[9] < 3000);
}

console.log(fails ? `\n${fails} CHECKS FAILED of ${n}` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
