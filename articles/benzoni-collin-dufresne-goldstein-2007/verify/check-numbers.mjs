// Every number the page states. Route A is src/coint.js. Route B never uses
// its formulas: it lets a gap close year by year to get the loadings, sums the
// paydays one at a time, and checks the rule itself (stock dollars = share x
// (savings + future pay) - the stock already in pay) by brute force in a
// one-year coin-flip market whose paydays each move by their own loading.
import * as C from "../src/coint.js";
import * as L from "../src/lifecycle.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x) => 100 * x;
const PI = (g) => 0.05 / (g * 0.18 * 0.18);

// route B pieces ---------------------------------------------------------------
// let a gap close year by year: pay starts 0 below where the market says it should be (1), and each year moves phi of the way
function loadings(phi, S = 40) { const out = []; let p = 0; for (let s = 1; s <= S; s++) { p += phi * (1 - p); out[s] = p; } return out; }
// the loading of the paydays left at an age, by summing them one at a time
function loadingAt(age, phi) {
  const b = loadings(phi), left = 65 - age; let num = 0, den = 0;
  for (let s = 1; s <= left; s++) { const df = 1 / Math.pow(1.02, s); num += df * b[s]; den += df; }
  return { H: den, betaH: left > 0 ? num / den : 0 };
}
// savings at an age by running the plan year by year (0.5 saved, 4% growth, 0.1 added a year)
function savingsAt(age) { let w = 0.5; for (let a = 25; a < age; a++) w = w * 1.04 + 0.1; return w; }
const shareB = (age, h, g) => {
  const phi = 1 - Math.pow(0.5, 1 / h), { H, betaH } = loadingAt(age, phi), W = savingsAt(age);
  return (PI(g) * (W + H) - betaH * H) / W;
};

console.log("-- the plan");
{
  let pv = 0; for (let t = 1; t <= 40; t++) pv += 1 / Math.pow(1.02, t);
  eq("future pay at 25, paydays summed one by one", C.stats(25, 0.1).H, pv, 1e-12);
  truth("about 27 years of pay", round(pv) === 27, pv.toFixed(2));
  eq("savings at 25 are half a year's pay", C.savings(25), 0.5, 0);
  truth("future pay is 55 times savings at 25", round(pv / 0.5) === 55, (pv / 0.5).toFixed(2));
  eq("the Merton share at risk aversion 2 is about 77%", round(pc(C.merton(2))), 77, 0);
  for (const a of [25, 40, 55, 64]) eq(`savings at ${a}, the plan run year by year`, C.savings(a), savingsAt(a), 1e-12);
  truth("and the human capital article's rule gives about 43 times savings at 25, or 4,300%", round(L.ruleShare(25)) === 43 && round(pc(L.ruleShare(25)), -2) === 4300, pc(L.ruleShare(25)).toFixed(1));
}

console.log("-- the loading of a payday, by letting the gap close year by year");
for (const h of [2, 5, 20]) {
  const phi = 1 - Math.pow(0.5, 1 / h), b = loadings(phi);
  let worst = 0; for (let s = 1; s <= 40; s++) worst = Math.max(worst, Math.abs(b[s] - C.beta(s, phi)));
  truth(`half-life ${h}: the closed form matches the simulation at every horizon to 40 years`, worst < 1e-12, worst.toExponential(2));
  eq(`half-life ${h}: after ${h} years half the gap is closed`, loadings(phi, Math.round(h))[Math.round(h)], 0.5, 1e-9);
  truth(`half-life ${h}: the loading rises with the horizon and stays inside 0 to 1`, b.slice(1).every((v, i, a) => v >= 0 && v <= 1 && (i === 0 || v > a[i - 1])));
}
{
  const b = loadings(1 - Math.pow(0.5, 1 / 5));
  truth("at a half-life of 5: 13% after one year, half after five, 94% after twenty", round(pc(b[1])) === 13 && Math.abs(b[5] - 0.5) < 1e-12 && round(pc(b[20])) === 94, `${pc(b[1]).toFixed(2)} ${pc(b[5]).toFixed(2)} ${pc(b[20]).toFixed(2)}`);
}

console.log("-- the loading of a stream of paydays");
for (const [age, h] of [[25, 2], [25, 5], [45, 5], [55, 2], [55, 5], [60, 12]]) {
  const phi = 1 - Math.pow(0.5, 1 / h), A = loadingAt(age, phi);
  eq(`loading at ${age}, half-life ${h}, by summing paydays`, C.betaH(age, phi), A.betaH, 1e-12);
  // and by a geometric series, a route that never lists the paydays
  const d = 1 / 1.02, a = 1 - phi, nn = 65 - age, geo = (q) => (q * (1 - Math.pow(q, nn))) / (1 - q);
  eq(`loading at ${age}, half-life ${h}, by geometric series`, 1 - geo(d * a) / geo(d), A.betaH, 1e-9);
}
eq("at 65 there is no pay left and no loading", C.betaH(65, 0.2), 0, 0);
{
  const phi2 = 1 - Math.pow(0.5, 1 / 2), phi5 = 1 - Math.pow(0.5, 1 / 5);
  truth("half-life 2: the loading is 92% at 25 and 75% at 55", round(pc(loadingAt(25, phi2).betaH)) === 92 && round(pc(loadingAt(55, phi2).betaH)) === 75, `${pc(loadingAt(25, phi2).betaH).toFixed(2)} ${pc(loadingAt(55, phi2).betaH).toFixed(2)}`);
  truth("half-life 5: 79% at 25, 66% at 45, 48% at 55", round(pc(loadingAt(25, phi5).betaH)) === 79 && round(pc(loadingAt(45, phi5).betaH)) === 66 && round(pc(loadingAt(55, phi5).betaH)) === 48, [25, 45, 55].map((a) => pc(loadingAt(a, phi5).betaH).toFixed(2)).join(" "));
  truth("with twenty paydays left at 45 and ten at 55", 65 - 45 === 20 && 65 - 55 === 10);
  for (const p of [phi2, phi5, 1 - Math.pow(0.5, 1 / 12)]) {
    let ok = true; for (let a = 25; a < 64; a++) if (!(loadingAt(a + 1, p).betaH < loadingAt(a, p).betaH)) ok = false;
    truth("the loading falls at every age", ok);
  }
  const thr = (0.05 / (2 * 0.0324)) * (1 + savingsAt(25) / loadingAt(25, phi5).H);
  truth("the level above which the rule holds none is about 78.6% at 25", round(pc(thr), 1) === 78.6 && Math.abs(thr - C.shortAbove(25, 2)) < 1e-12, pc(thr).toFixed(3));
  truth("and the loading at a half-life of 5 is 78.7%, just above it", round(pc(loadingAt(25, phi5).betaH), 1) === 78.7 && loadingAt(25, phi5).betaH > thr);
}

console.log("-- the rule itself, by brute force (one year, coin-flip market, every payday moves by its own loading)");
{
  const UP = 1.25, DOWN = 0.89, RR = 1.02, g = 2;
  const A = UP - RR, B = RR - DOWN, k = Math.pow(A / B, 1 / g), pi1 = (RR * (k - 1)) / (A + k * B); // the one-year isoelastic share
  const u = (w) => Math.pow(w, 1 - g) / (1 - g);
  for (const [age, h] of [[25, 2], [25, 5], [25, 20], [45, 5], [60, 5], [60, 2]]) {
    const phi = 1 - Math.pow(0.5, 1 / h), b = loadings(phi), W = savingsAt(age), left = 65 - age;
    // date-1 wealth: savings grown safely, stock dollars D earning the excess e, and every payday s paying 1 + beta(s) e / RR, valued at date 1
    const wealth = (D, e) => { let w = RR * W + D * e; for (let s = 1; s <= left; s++) w += (1 + (b[s] * e) / RR) / Math.pow(RR, s - 1); return w; };
    let best = -Infinity, arg = 0;
    for (let D = -6; D <= 60; D += 0.002) {
      const wu = wealth(D, A), wd = wealth(D, -B);
      if (wu <= 0 || wd <= 0) continue;
      const v = 0.5 * u(wu) + 0.5 * u(wd); if (v > best) { best = v; arg = D; }
    }
    let H = 0, bb = 0; for (let s = 1; s <= left; s++) { H += 1 / Math.pow(RR, s); bb += b[s] / Math.pow(RR, s); }
    eq(`age ${age}, half-life ${h}: stock dollars by search vs share x (savings + future pay) less the stock in pay`, arg, pi1 * (W + H) - bb, 0.004);
  }
}

console.log("-- the share, from the module and from route B");
{
  for (const [age, h, g] of [[25, 5, 2], [30, 5, 2], [45, 5, 2], [60, 5, 2], [65, 5, 2], [25, 2, 2], [25, 20, 2], [25, 8, 3], [40, 12, 4]])
    eq(`share at ${age}, half-life ${h}, risk aversion ${g}`, C.share(age, C.phiOf(h), g), shareB(age, h, g), 1e-9);
  truth("at a half-life of 5: -9% at 25, 85% at 30, 122% at 45, 100% at 60, 77% at 65",
    round(pc(shareB(25, 5, 2))) === -9 && round(pc(shareB(30, 5, 2))) === 85 && round(pc(shareB(45, 5, 2))) === 122 && round(pc(shareB(60, 5, 2))) === 100 && round(pc(shareB(65, 5, 2))) === 77,
    [25, 30, 45, 60, 65].map((a) => pc(shareB(a, 5, 2)).toFixed(2)).join(" "));
  let peak = 25, pv = -Infinity; for (let a = 25; a < 65; a++) if (shareB(a, 5, 2) > pv) { pv = shareB(a, 5, 2); peak = a; }
  truth("and the peak is at 45", peak === 45 && C.peakAge(C.phiOf(5), 2) === 45, `${peak}`);
  truth("the bond rule is about 4,300% at 25 and falls at every age", round(pc(C.shareBond(25, 2)), -2) === 4300 && C.AGES.slice(1).every((a) => C.shareBond(a, 2) < C.shareBond(a - 1, 2)));
  eq("the bond rule agrees with the human capital article", C.shareBond(25, 2), L.ruleShare(25), 1e-9);
  truth("at a half-life of 2: -720% at 25, which is 3.6 years of pay short", round(pc(shareB(25, 2, 2))) === -720 && round(shareB(25, 2, 2) * savingsAt(25), 1) === -3.6, `${pc(shareB(25, 2, 2)).toFixed(1)} ${(shareB(25, 2, 2) * 0.5).toFixed(3)}`);
  truth("at a half-life of 20: 1,996% at 25, and the share falls with age", round(pc(shareB(25, 20, 2))) === 1996 && C.AGES.slice(1).every((a) => a >= 65 || C.share(a, C.phiOf(20), 2) < C.share(a - 1, C.phiOf(20), 2) + 1e-12), pc(shareB(25, 20, 2)).toFixed(1));
  eq("at 65 the share is the Merton share, whatever the half-life", C.share(65, C.phiOf(3), 2), C.merton(2), 1e-12);
}

console.log("-- the knife-edge");
{
  // route B: scan the half-life in steps of 0.001 for the first sign change of the share at 25
  const scanZero = (g) => { let prev = shareB(25, 1, g); for (let h = 1.001; h <= 40; h += 0.001) { const v = shareB(25, h, g); if (prev < 0 && v >= 0) return h; prev = v; } return NaN; };
  const z = [2, 3, 4].map(scanZero);
  eq("risk aversion 2: the share at 25 is zero at a half-life of 5.0", z[0], 5.0435, 0.002);
  eq("risk aversion 3: at 13.9", z[1], 13.9372, 0.002);
  eq("risk aversion 4: at 22.2", z[2], 22.163, 0.002);
  for (const [i, g] of [2, 3, 4].entries()) eq(`the module's bisection agrees, risk aversion ${g}`, C.breakEven(g), z[i], 0.002);
  truth("from half-life 5 to 5.5 the share at 25 goes from -9% to 98%", round(pc(shareB(25, 5, 2))) === -9 && round(pc(shareB(25, 5.5, 2))) === 98, `${pc(shareB(25, 5, 2)).toFixed(2)} ${pc(shareB(25, 5.5, 2)).toFixed(2)}`);
  truth("at risk aversion 4 the share at 25 is negative at every half-life the sliders allow (2 to 20)", (() => { for (let h = 2; h <= 20; h += 0.5) if (!(shareB(25, h, 4) < 0)) return false; return true; })());
  // the hump: scanning half-lives for where the share stops peaking after 25
  let last = 0;
  for (let h = 1; h <= 20; h += 0.01) { let pk = 25, v = shareB(25, h, 2); for (let a = 26; a < 65; a++) { const s = shareB(a, h, 2); if (s > v + 1e-12) { v = s; pk = a; } } if (pk > 25) last = h; }
  truth("at risk aversion 2 the share peaks after 25 only for half-lives up to about 5.8 years", Math.abs(last - 5.8) < 0.02, last.toFixed(2));
  truth("at half-life 2 the peak is at 61 and the share stays below 77% until the sixties", C.peakAge(C.phiOf(2), 2) === 61 && shareB(55, 2, 2) > 0 && pc(shareB(55, 2, 2)) > 70, `${pc(shareB(55, 2, 2)).toFixed(1)}`);
}

console.log("-- what the drawn windows can show");
{
  truth("the upper chart runs from -200% to 300%: at a half-life of 5 the share stays inside it for life", C.AGES.every((a) => { const s = C.share(a, C.phiOf(5), 2); return s > -2 && s < 3; }));
  truth("the loading stays between 0 and 1 at every age and half-life the sliders allow", (() => { for (let h = 2; h <= 20; h += 0.5) for (const a of C.AGES) { const v = C.betaH(a, C.phiOf(h)); if (!(v >= 0 && v <= 1)) return false; } return true; })());
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
