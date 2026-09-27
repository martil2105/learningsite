// Every number the page states, derived twice. Route A is src/horizon.js.
// Route B integrates the normal density numerically, or simulates with its own
// generator, and shares no code with route A.
import { chanceBehind, shortfallWhenBehind, expectedShortfall, ratioQuantile, worstYear, shortfallPeak, ratioPaths, medianGap, annualised, PREMIUM, SIGMA, PATHS, TAILS } from "../src/horizon.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x, d = 0) => round(100 * x, d);

// ---- route B: integrate over log R ~ N(mu, s^2) with Simpson's rule
const dens = (x, mu, s) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
function simpson(f, a, b, k = 20000) { const h = (b - a) / k; let s = f(a) + f(b); for (let i = 1; i < k; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
function B(T, prem = PREMIUM, sig = SIGMA) {
  const mu = (prem - sig * sig / 2) * T, s = sig * Math.sqrt(T), lo = mu - 12 * s;
  const P = simpson((x) => dens(x, mu, s), lo, 0);
  const below = simpson((x) => Math.exp(x) * dens(x, mu, s), lo, 0);
  return { P, depth: 1 - below / P, es: P - below };
}
// a quantile by bisection on the numerical CDF
function Bq(T, q, prem = PREMIUM, sig = SIGMA) {
  const mu = (prem - sig * sig / 2) * T, s = sig * Math.sqrt(T);
  let a = mu - 10 * s, b = mu;
  for (let i = 0; i < 80; i++) { const c = (a + b) / 2; (simpson((x) => dens(x, mu, s), mu - 12 * s, c, 4000) < q ? (a = c) : (b = c)); }
  return Math.exp((a + b) / 2);
}

console.log("-- the setup");
eq("the median growth gap is 6% minus half of 20% squared, 4%", medianGap(PREMIUM, SIGMA), 0.04, 1e-12);

console.log("-- chance behind (route A vs route B)");
for (const T of [1, 10, 30]) eq(`chance behind at ${T} years`, chanceBehind(T), B(T).P, 1e-7);
truth("42% at one year", pc(chanceBehind(1)) === 42);
truth("26% at ten years", pc(chanceBehind(10)) === 26);
truth("about 14% at thirty years", pc(chanceBehind(30)) === 14);
truth("falls the whole way, 0.25 to 60 years", (() => { for (let t = 0.25; t < 60; t += 0.25) if (chanceBehind(t + 0.25) >= chanceBehind(t)) return false; return true; })());

console.log("-- the average shortfall when behind");
for (const T of [1, 10, 30]) eq(`shortfall when behind at ${T} years`, shortfallWhenBehind(T), B(T).depth, 1e-6);
truth("13% at one year", pc(shortfallWhenBehind(1)) === 13);
truth("29% at ten years", pc(shortfallWhenBehind(10)) === 29);
truth("37% at thirty years", pc(shortfallWhenBehind(30)) === 37);
truth("the pink line never turns down (to 60 years, at each volatility)", [0.15, 0.2, 0.25].every((s) => { for (let t = 0.25; t < 60; t += 0.25) if (shortfallWhenBehind(t + 0.25, PREMIUM, s) <= shortfallWhenBehind(t, PREMIUM, s)) return false; return true; }));
truth("calmer market: about 4% behind after thirty years", pc(chanceBehind(30, PREMIUM, 0.15)) === 4, pc(chanceBehind(30, PREMIUM, 0.15), 2) + "%");
truth("rougher market: still about 26% after thirty years", pc(chanceBehind(30, PREMIUM, 0.25)) === 26);
const d25 = shortfallWhenBehind(30, PREMIUM, 0.25);
truth("rougher market: the shortfall when behind is nearly half", d25 > 0.45 && d25 < 0.5, pc(d25, 1) + "%");

console.log("-- the average shortfall over all outcomes, and its peak");
for (const T of [1, 7, 30]) eq(`over all outcomes at ${T} years`, expectedShortfall(T), B(T).es, 1e-6);
eq("it is the chance times the depth", expectedShortfall(13), chanceBehind(13) * shortfallWhenBehind(13), 1e-12);
truth("about 5.5% at one year", pc(expectedShortfall(1), 1) === 5.5);
const pk = shortfallPeak();
truth("peaks at about 7.8%", pc(pk.value, 1) === 7.8, pc(pk.value, 3) + "%");
truth("around seven years", round(pk.T) === 7, pk.T.toFixed(2));
truth("the peak is a peak: lower half a year either side", expectedShortfall(pk.T - 0.5) < pk.value && expectedShortfall(pk.T + 0.5) < pk.value);
truth("about 5.1% at thirty years", pc(expectedShortfall(30), 1) === 5.1);
truth("so thirty years is a bit better than one by this measure", expectedShortfall(30) < expectedShortfall(1));

console.log("-- the lab");
eq("the median at thirty years", Math.exp(0.04 * 30), ratioQuantile(30, 0.5), 1e-9);
truth("about 3.3 times the bonds", round(Math.exp(1.2), 1) === 3.3);
for (const [T, q] of [[1, 20], [30, 20], [1, 100], [30, 100]]) eq(`1-in-${q} ratio at ${T} years (A vs B)`, ratioQuantile(T, 1 / q), Bq(T, 1 / q), 1e-5);
truth("1 in 20 after one year: 25% less than the bonds", pc(1 - ratioQuantile(1, 1 / 20)) === 25);
truth("1 in 20 after thirty years: 45% less", pc(1 - ratioQuantile(30, 1 / 20)) === 45);
const a1 = annualised(ratioQuantile(1, 1 / 20), 1), a30 = annualised(ratioQuantile(30, 1 / 20), 30);
truth("on the yearly ruler, about 29 points behind after one year", pc(-a1) === 29, pc(a1, 2) + "%");
truth("and only about 2 points a year behind after thirty", pc(-a30) === 2, pc(a30, 2) + "%");
eq("the yearly ruler's spread is sigma over root T", (Math.log(ratioQuantile(30, 0.8413447460685429)) - 1.2) / 30, SIGMA / Math.sqrt(30), 1e-6);
eq("z is about -1.64 for one in twenty", Math.log(ratioQuantile(1, 1 / 20)) - 0.04, -0.2 * 1.6448536269514722, 1e-9);
const P = ratioPaths();
truth("the lab draws 200 paths", P.length === PATHS && P.every((p) => p.length === 41));
const behind30 = P.filter((p) => p[30] < 1).length;
truth("28 of the 200 end behind at thirty years", behind30 === 28, String(behind30));
truth("the same paths are behind on both rulers", P.every((p) => (p[30] < 1) === (annualised(p[30], 30) < 0)));
// route B for the paths: an independent simulation with its own generator
let seed = 12345; const lcg = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
const gauss = () => { let u = 0; while (u === 0) u = lcg(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * lcg()); };
let cnt = 0; const N = 200000;
for (let i = 0; i < N; i++) { let l = 0; for (let t = 0; t < 30; t++) l += 0.04 + 0.2 * gauss(); if (l < 0) cnt++; }
eq("a separate simulation agrees on 14% (sampling tolerance)", cnt / N, chanceBehind(30), 0.004);

console.log("-- the worst case keeps getting worse");
for (const q of TAILS) {
  const w = worstYear(1 / q);
  // route B: scan the numerical quantile for its lowest point
  let best = Infinity, bestT = 0;
  for (let T = 0.5; T <= 80; T += 0.5) { const v = Bq(T, 1 / q); if (v < best) { best = v; bestT = T; } }
  truth(`1 in ${q}: the lowest point found by scanning sits within half a year of T*`, Math.abs(bestT - w.T) <= 0.5, `${bestT} vs ${w.T.toFixed(2)}`);
  eq(`1 in ${q}: depth at T* matches the quantile there`, w.ratio, ratioQuantile(w.T, 1 / q), 1e-9);
}
truth("1 in 20 keeps getting worse for 17 years", round(worstYear(1 / 20).T) === 17);
truth("and bottoms out 49% behind", pc(1 - worstYear(1 / 20).ratio) === 49);
truth("1 in 100 keeps sinking for 34 years", round(worstYear(1 / 100).T) === 34);
truth("down to 74% behind", pc(1 - worstYear(1 / 100).ratio) === 74);
truth("at a 4% premium, the median growth gap halves to 2%", Math.abs(medianGap(0.04, SIGMA) - 0.02) < 1e-12);
truth("and 1 in 20 keeps getting worse for about 68 years", round(worstYear(1 / 20, 0.04).T) === 68);
eq("halving the gap quadruples the wait", worstYear(1 / 20, 0.04).T / worstYear(1 / 20, 0.06).T, 4, 1e-9);
truth("at 8% it turns around after about 8 years", round(worstYear(1 / 20, 0.08).T) === 8, worstYear(1 / 20, 0.08).T.toFixed(2));
truth("at 6%, the 1-in-20 and 1-in-100 bottoms fall inside forty years, 1 in 1000 beyond", worstYear(1 / 20).T < 40 && worstYear(1 / 100).T < 40 && worstYear(1 / 1000).T > 40);

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
