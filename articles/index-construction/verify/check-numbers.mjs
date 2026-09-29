// Every number the page states. Route A is src/index.js. Route B never uses its
// weights or its identity: it keeps dollar holdings and share counts, trades them
// the way a fund would, and reads the gap off the two funds' values.
import * as I from "../src/index.js";
import { mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

// route B: two funds of real holdings. The cap-weighted fund buys every company's
// shares once and holds them; the equal-weighted fund rebalances its dollars.
function funds(R, every = 1) {
  const k = R[0].length;
  const price = new Float64Array(k).fill(1); // every company starts worth the same
  const shares = new Float64Array(k).fill(1 / k); // cap-weighted: a fixed number of shares
  let dollars = new Float64Array(k).fill(1 / k); // equal-weighted: dollars in each stock
  let traded = 0;
  for (let t = 0; t < R.length; t++) {
    for (let i = 0; i < k; i++) { price[i] *= R[t][i]; dollars[i] *= R[t][i]; }
    if ((t + 1) % every === 0) {
      const tot = dollars.reduce((a, b) => a + b, 0);
      let moved = 0; for (let i = 0; i < k; i++) moved += Math.abs(tot / k - dollars[i]);
      traded += moved / 2 / tot;
      dollars = new Float64Array(k).fill(tot / k);
    }
  }
  const CW = shares.reduce((a, s, i) => a + s * price[i], 0);
  const EW = dollars.reduce((a, b) => a + b, 0);
  const capWeights = Array.from(price, (p, i) => (shares[i] * p) / CW);
  return { CW, EW, capWeights, traded };
}

console.log("-- the index that never trades");
{
  const o = I.oneMonth(0.2);
  eq("A to 40%", o.drifted[0], 0.4, 1e-12);
  eq("B stays at 33.3%", r(100 * o.drifted[1], 1), 33.3, 0);
  eq("C to 26.7%", r(100 * o.drifted[2], 1), 26.7, 0);
  eq("the equal-weighted index sells 6.7% of the fund in A", r(-100 * o.trades[0], 1), 6.7, 0);
  eq("and buys the same in C", o.trades[2], -o.trades[0], 1e-12);
  eq("and trades 6.7% of the fund in all", r(100 * o.turnover, 1), 6.7, 0);
  eq("with no moves nothing trades", I.oneMonth(0).turnover, 0, 0);
  truth("the further apart the stocks move, the more it trades", [0.05, 0.1, 0.2, 0.3, 0.4].every((d, i, a) => i === 0 || I.oneMonth(d).turnover > I.oneMonth(a[i - 1]).turnover));
  // the cap-weighted index's weights are the companies' shares of the market at every date, with no trades
  const R = I.market(30, 3);
  const A = I.run(R), B = funds(R);
  let worst = 0; for (let i = 0; i < 30; i++) worst = Math.max(worst, Math.abs(A.weights[i] - B.capWeights[i]));
  truth("after 30 years, the index's weights are the market-value shares of a fund that never traded", worst < 1e-12, worst.toExponential(1));
}

console.log("-- the identity, exactly, against two funds of real holdings");
{
  let worst = 0, worstB = 0;
  for (const [nn, seed, kappa] of [[10, 1, 0], [30, 2, 0], [100, 15, 0], [100, 15, 0.05], [500, 4, 0], [100, 9, 0.1]]) {
    const R = I.market(nn, seed, kappa), A = I.run(R), B = funds(R);
    const e = A.end;
    worst = Math.max(worst, Math.abs(e.lnEW - e.lnCW - (e.gain + e.conc)));
    worstB = Math.max(worstB, Math.abs(Math.log(B.EW / B.CW) - (e.gain + e.conc)), Math.abs(Math.log(B.EW) - e.lnEW), Math.abs(Math.log(B.CW) - e.lnCW));
  }
  truth("ln(EW/CW) = gain + change in concentration, to machine precision", worst < 1e-12, worst.toExponential(1));
  truth("and the two funds' values agree with it", worstB < 1e-10, worstB.toExponential(1));
  // any returns at all: uniform, fat-tailed, with crashes, rebalanced every three periods
  const u = mulberry32(77);
  let wa = 0;
  for (let trial = 0; trial < 50; trial++) {
    const k = 5 + Math.floor(40 * u()), T = 10 + Math.floor(50 * u());
    const R = Array.from({ length: T }, () => Float64Array.from({ length: k }, () => (u() < 0.03 ? 0.3 + 0.2 * u() : 0.7 + 0.7 * u())));
    const every = 3, B = funds(R, every);
    // gain over three-period blocks, concentration from the held fund's weights
    let gain = 0; const acc = new Float64Array(k).fill(1);
    for (let t = 0; t < T; t++) { for (let i = 0; i < k; i++) acc[i] *= R[t][i]; if ((t + 1) % every === 0 || t === T - 1) { let am = 0, lg = 0; for (let i = 0; i < k; i++) { am += acc[i]; lg += Math.log(acc[i]); } gain += Math.log(am / k) - lg / k; acc.fill(1); } }
    // the last block may be short, and the fund only rebalances at full blocks, which changes nothing at the end
    const geo = Math.exp(B.capWeights.reduce((a, w) => a + Math.log(w), 0) / k);
    wa = Math.max(wa, Math.abs(Math.log(B.EW / B.CW) - (gain + Math.log(geo * k))));
  }
  truth("the identity holds for arbitrary returns and three-period rebalancing too", wa < 1e-10, wa.toExponential(1));
  truth("every term of the gain is at least zero (arithmetic mean over geometric)", (() => { const R = I.market(50, 8); for (const row of R) { let am = 0, lg = 0; for (const v of row) { am += v; lg += Math.log(v); } if (Math.log(am / 50) - lg / 50 < -1e-15) return false; } return true; })());
  truth("the concentration term is never above zero when both start equal", (() => { const A = I.run(I.market(100, 12)); return A.path.every((p) => p.conc <= 1e-12); })());
}

console.log("-- how much it trades, and what it gains");
{
  eq("12% a year rebalancing yearly", Math.round(100 * I.turnoverRate(0.3, 1)), 12, 0);
  eq("24% quarterly", Math.round(100 * I.turnoverRate(0.3, 4)), 24, 0);
  eq("41% monthly", Math.round(100 * I.turnoverRate(0.3, 12)), 41, 0);
  eq("189% daily", Math.round(100 * I.turnoverRate(0.3, 252)), 189, 0);
  eq("the gain is 4.5% a year", r(100 * I.gainRate(0.3), 1), 4.5, 0);
  eq("daily trades about eight times as much as quarterly", Math.round(I.turnoverRate(0.3, 252) / I.turnoverRate(0.3, 4)), 8, 0);
  const sim = I.byFrequency(0.3);
  truth("simulated turnover is within 3% of the formula at every frequency", sim.every((f) => Math.abs(f.turn / I.turnoverRate(0.3, f.perYear) - 1) < 0.03), sim.map((f) => (100 * f.turn).toFixed(1)).join(" "));
  truth("the simulated gain is within 0.25 points of 4.5% at every frequency", sim.every((f) => Math.abs(f.gain - I.gainRate(0.3)) < 0.0025), sim.map((f) => (100 * f.gain).toFixed(2)).join(" "));
  // route B for the simulated turnover: the funds' own trading, monthly, over 30 years of the article's market
  const R = I.market(100, 15), B = funds(R);
  truth("the article's market trades about 41% a year monthly, in a fund of real holdings", Math.abs(B.traded / 30 / I.turnoverRate(0.3, 12) - 1) < 0.03, (100 * B.traded / 30).toFixed(1));
  eq("the fund's trading equals the module's", B.traded, I.run(R).turn, 1e-9);
  truth("trading grows in step with volatility and the gain with its square", Math.abs(I.turnoverRate(0.4, 12) / I.turnoverRate(0.2, 12) - 2) < 1e-12 && Math.abs(I.gainRate(0.4) / I.gainRate(0.2) - 4) < 1e-12);
  truth("the slider's range stays inside the charts (350% and 14%)", I.turnoverRate(0.5, 252) < 3.5 && I.gainRate(0.5) < 0.14 && I.byFrequency(0.5).every((f) => f.turn < 3.5 && f.gain < 0.14));
}

console.log("-- the first market");
{
  const e = I.run(I.market(100, 15)).end;
  eq("a dollar grows to $9.92 equal-weighted", r(Math.exp(e.lnEW)), 9.92, 0);
  eq("and $9.30 cap-weighted", r(Math.exp(e.lnCW)), 9.3, 0);
  eq("the gain adds 1.33", r(e.gain), 1.33, 0);
  eq("concentration takes away 1.27", r(e.conc), -1.27, 0);
  eq("leaving 0.06", r(e.lnEW - e.lnCW), 0.06, 0);
  eq("about 7% ahead", Math.round(100 * (Math.exp(e.lnEW - e.lnCW) - 1)), 7, 0);
  eq("effective stocks fall to about 19", Math.round(e.neff), 19, 0);
  eq("which starts at 100", I.run(I.market(100, 15)).path[0].neff, 100, 0);
}

console.log("-- many markets like it");
{
  const S = 1000; let g = 0, g2 = 0, gains = [], cs = 0;
  for (let s = 1; s <= S; s++) { const e = I.run(I.market(100, 5000 + s)).end; const gap = e.lnEW - e.lnCW; g += gap; g2 += gap * gap; gains.push(e.gain); cs += e.conc; }
  const m = g / S, sd = Math.sqrt(g2 / S - m * m), mg = gains.reduce((a, b) => a + b, 0) / S;
  truth("the gap is centred near zero (its average within 0.08 of it)", Math.abs(m) < 0.08, `mean ${m.toFixed(3)}, standard error ${(sd / Math.sqrt(S)).toFixed(3)}`);
  truth("and moves about a quarter either way", sd > 0.2 && sd < 0.3, sd.toFixed(3));
  truth("while the gain is always about 1.3", gains.every((v) => v > 1.2 && v < 1.45), `${Math.min(...gains).toFixed(3)} to ${Math.max(...gains).toFixed(3)}`);
  eq("the concentration takes back about 97% of the gain on average", Math.round(-100 * cs / S / mg), 97, 0);
  eq("the gain is about half the variance a year for 30 years (1.34)", r(mg), r(30 * I.gainRate(0.3)), 0.01);
  // why they cancel: the concentration term is about minus half the variance of log sizes
  const A = I.run(I.market(500, 31));
  const w = A.weights, ln = w.map(Math.log), mean = ln.reduce((a, b) => a + b, 0) / 500, v = ln.reduce((a, b) => a + (b - mean) ** 2, 0) / 500;
  truth("with 500 stocks the concentration term is close to minus half the variance of the log weights", Math.abs(A.end.conc / (-v / 2) - 1) < 0.15, `${A.end.conc.toFixed(3)} vs ${(-v / 2).toFixed(3)}`);
  truth("and that variance is close to sigma^2 times 30 years", Math.abs(v / (0.09 * 30) - 1) < 0.15, v.toFixed(3));
}

console.log("-- when big firms slow down");
{
  const A = I.run(I.market(100, 15, 0.05)), e = A.end;
  eq("the equal-weighted index ends 0.89 ahead", r(e.lnEW - e.lnCW), 0.89, 0);
  eq("2.4 times as rich", r(Math.exp(e.lnEW - e.lnCW), 1), 2.4, 0);
  eq("it grows to $9.93", r(Math.exp(e.lnEW)), 9.93, 0);
  eq("and the cap-weighted index to $4.07", r(Math.exp(e.lnCW)), 4.07, 0);
  eq("which settles at about 49 effective stocks", Math.round(e.neff), 49, 0);
  const at = (yr) => A.path[12 * yr].conc;
  truth("the concentration line flattens: its last ten years move less than a third of its first ten", Math.abs(at(30) - at(20)) < Math.abs(at(10) - at(0)) / 3, `${(at(10) - at(0)).toFixed(3)} then ${(at(30) - at(20)).toFixed(3)}`);
  truth("the gain is the same size as in the first world", Math.abs(e.gain - I.run(I.market(100, 15)).end.gain) < 0.01);
  truth("the equal-weighted index keeps most of its gain", (e.lnEW - e.lnCW) / e.gain > 0.6);
}

console.log("-- the lab's window");
{
  const MARKETS = [15, 34, 7, 52, 3, 21, 44, 60];
  let ok1 = true;
  for (let mk = 0; mk < 16; mk++) for (const nn of [30, 100, 500]) for (const kappa of [0, 0.05]) {
    const P = I.run(I.market(nn, MARKETS[mk % 8] + 100 * Math.floor(mk / 8), kappa)).path;
    if (!P.every((p) => Number.isFinite(p.gain) && Number.isFinite(p.conc) && p.neff >= 1)) ok1 = false;
  }
  truth("every market the lab can show is finite, with at least one effective stock", ok1);
}

console.log(fails ? `\n${fails} CHECKS FAILED of ${n}` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
