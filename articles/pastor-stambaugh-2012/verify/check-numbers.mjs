// Every number the page states, derived here. Route A is src/longrun.js (the
// Kalman filter and the closed-form sums). Route B shares none of that code:
// a Monte Carlo of histories and futures for the unknown mean, a Monte Carlo
// of the predictive system for the known-model pieces, and a direct
// best-linear-predictor calculation on the full covariance matrix of 206
// returns (universal kriging, the mean left free) for the investor's total.
import * as L from "../src/longrun.js";
import { normals, mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const V = L.SIGMA * L.SIGMA;

// ------------------------------------------------------------- the unknown mean
console.log("-- one: the mean we have to estimate");
eq("a century of data, thirty years ahead: 30% more variance per year", L.meanOnlyRatio(30, 100), 1.3, 1e-15);
truth("the paper's example, fifty years with 206 years of data: about 24% more", round(100 * (L.meanOnlyRatio(50, 206) - 1)) === 24, L.meanOnlyRatio(50, 206).toFixed(4));
truth("a nominal 90% band holds about 85% at thirty years with a century", round(100 * L.bandHolds(30, 100)) === 85, L.bandHolds(30, 100).toFixed(4));
eq("at k = N the mean's part equals the surprises' part", 30 * 30 / 30 * V, 30 * V, 1e-15);
{
  // Route B: histories and futures by brute force, with a generator of its own
  const g = mulberry32(2024), gauss = () => { let a = 0; while (a === 0) a = g(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * g()); };
  const reps = 60000, N = 100, k = 30, m = 0.04, s = 0.2, z = 1.6448536269514722;
  let ss = 0, holdN = 0, holdF = 0;
  for (let i = 0; i < reps; i++) {
    let h = 0; for (let t = 0; t < N; t++) h += m + s * gauss(); h /= N;
    let f = 0; for (let t = 0; t < k; t++) f += m + s * gauss();
    const e = f - k * h; ss += e * e;
    if (Math.abs(e) <= z * s * Math.sqrt(k)) holdN++;
    if (Math.abs(e) <= z * s * Math.sqrt(k + (k * k) / N)) holdF++;
  }
  eq("simulated forecast variance per year matches 1 + k/N (sampling tolerance)", ss / reps / k / (s * s), 1.3, 0.015);
  eq("simulated blue band holds 85% (sampling tolerance)", holdN / reps, L.bandHolds(30, 100), 0.006);
  eq("simulated pink band holds 90% (sampling tolerance)", holdF / reps, 0.9, 0.006);
}
{
  // the lab's own history() is an unbiased estimate with variance sigma^2/N
  let s1 = 0, s2 = 0; const R = 4000;
  for (let i = 1; i <= R; i++) { const e = L.history(1000 + i, 100); s1 += e; s2 += e * e; }
  const mean = s1 / R, v = s2 / R - mean * mean;
  eq("the lab's histories average the true 4% (sampling tolerance)", mean, 0.04, 0.02);
  eq("and their spread is sigma^2/N (sampling tolerance)", v / (V / 100), 1, 0.06);
}
{
  const paths = L.futures(7, 100), k = 30, h = (e, n) => paths.filter((p) => Math.abs(p[k] - e * k) > 1.6448536269514722 * 0.2 * Math.sqrt(k + (n ? (k * k) / n : 0))).length;
  truth("the first history's blue band misses about as many futures as it should (within binomial noise of 10)", h(L.history(4, 100)) <= 16, `${h(L.history(4, 100))} of 100`);
  const next = [5, 6, 7, 8].map((s) => L.history(s, 100));
  truth("the next few wander above and below the truth", next.some((e) => e > 0.05) && next.some((e) => e < 0.035), next.map((e) => (100 * e).toFixed(1)).join(", "));
  truth("and their blue bands miss a lot more", next.every((e) => h(e) >= 16), next.map((e) => h(e)).join(", "));
}
truth("the lab opens on a history close to the truth (seed 4)", Math.abs(L.history(4, 100) - 0.04) < 0.005, (100 * L.history(4, 100)).toFixed(2) + "%");

// ---------------------------------------------------------- two: the pieces
console.log("-- two: the world's variance and the investor's");
const rhoM = L.REVERSION.moderate;
// Route B for the world's variance: sum the covariance matrix of k future returns
function covR(i, j, beta, rho) { // returns r_i, r_j (1-based years), i <= j
  const p = L.params(beta);
  if (i === j) return p.smu2 + p.su2;
  return Math.pow(beta, j - i) * p.smu2 + Math.pow(beta, j - 1 - i) * rho * p.su * p.sw;
}
const cv = (i, j, b, r) => (i <= j ? covR(i, j, b, r) : covR(j, i, b, r));
function worldB(k, beta, rho) { let s = 0; for (let i = 1; i <= k; i++) for (let j = 1; j <= k; j++) s += cv(i, j, beta, rho); return s; }
for (const k of [1, 10, 30, 50]) eq(`world's ${k}-year variance, closed form against the covariance sum`, L.worldVariance(k, L.BETA, rhoM), worldB(k, L.BETA, rhoM), 1e-12);
// Route B for the investor's total: best linear predictor of the future total from N past returns, mean free
function solve(A, b) { // Cholesky
  const n = b.length, Lm = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j]; for (let q = 0; q < j; q++) s -= Lm[i][q] * Lm[j][q];
    Lm[i][j] = i === j ? Math.sqrt(s) : s / Lm[j][j];
  }
  const y = new Float64Array(n); for (let i = 0; i < n; i++) { let s = b[i]; for (let q = 0; q < i; q++) s -= Lm[i][q] * y[q]; y[i] = s / Lm[i][i]; }
  const x = new Float64Array(n); for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let q = i + 1; q < n; q++) s -= Lm[q][i] * x[q]; x[i] = s / Lm[i][i]; }
  return x;
}
function krige(k, N, beta, rho) {
  const S = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => cv(i + 1, j + 1, beta, rho)));
  const c = Array.from({ length: N }, (_, i) => { let s = 0; for (let j = N + 1; j <= N + k; j++) s += cv(i + 1, j, beta, rho); return s; });
  const one = new Array(N).fill(1);
  const Sc = solve(S, c), S1 = solve(S, one);
  const cSc = c.reduce((s, v, i) => s + v * Sc[i], 0), oSc = Sc.reduce((s, v) => s + v, 0), oS1 = S1.reduce((s, v) => s + v, 0);
  return worldB(k, beta, rho) - cSc + ((k - oSc) ** 2) / oS1;
}
for (const [k, b] of [[1, 0.83], [30, 0.83], [50, 0.83], [30, 0.95], [30, 0.6]]) {
  eq(`investor's ${k}-year variance at persistence ${b}: filter against kriging`, L.investorPieces(k, b, rhoM).total, krige(k, 206, b, rhoM), 1e-6);
}
{
  // Route B for the three known-model pieces: simulate the system from a known start
  const b = L.BETA, p = L.params(b), k = 30, reps = 40000, z = normals(99);
  let s = 0, s2 = 0;
  for (let i = 0; i < reps; i++) {
    let x = 0, tot = 0;
    for (let t = 0; t < k; t++) {
      const e1 = z(), e2 = z();
      const u = p.su * e1, w = p.sw * (rhoM * e1 + Math.sqrt(1 - rhoM * rhoM) * e2);
      tot += x + u; x = b * x + w;
    }
    s += tot; s2 += tot * tot;
  }
  const kn = L.knownPieces(k, b, rhoM), vKn = kn.iid + kn.reversion + kn.future;
  eq("the three known-model pieces match a simulation of the system (sampling tolerance)", (s2 / reps - (s / reps) ** 2) / vKn, 1, 0.03);
}
eq("the series and the per-horizon average agree (30 years, unsure)", L.doubtedSeries(L.DOUBT.unsure, rhoM)[30].total, L.doubtedPieces(30, L.DOUBT.unsure, rhoM).total, 1e-12);
eq("with no moving expected returns the investor's variance is 1 + k/N", L.investorPieces(30, 0.5, 0, 100, 0.2, 1e-12).total / 30 / V, 1.3, 1e-8);
eq("the world's one-year variance is the one-year variance", L.perYear(L.worldVariance(1, L.BETA, rhoM), 1), 1, 1e-12);

const W = (k) => L.perYear(L.worldVariance(k, L.BETA, rhoM), k);
const I = (k, d = "known", r = rhoM) => L.perYear(L.doubtedPieces(k, L.DOUBT[d], r).total, k);
truth("world at thirty years: about 59% of one year", round(100 * W(30)) === 59, W(30).toFixed(4));
truth("investor, persistence known: about 66%", round(100 * I(30)) === 66, I(30).toFixed(4));
truth("and she still says calmer in the long run (below one at every horizon)", Array.from({ length: 50 }, (_, i) => I(i + 1)).every((v) => v < 1));
{
  const c = L.doubtedPieces(30, L.DOUBT.known, rhoM), f = (v) => L.perYear(v, 30);
  truth("mean reversion takes away about 0.81", round(f(c.reversion), 2) === -0.81, f(c.reversion).toFixed(4));
  const back = f(c.future) + f(c.today) + f(c.estimation), share = back / -f(c.reversion);
  truth("future, today and estimation put back nearly two thirds of it", share > 0.6 && share < 2 / 3, share.toFixed(4));
  truth("the pieces that come from ignorance grow with the horizon", (() => { let prev = -1; for (let k = 1; k <= 50; k++) { const p = L.doubtedPieces(k, L.DOUBT.known, rhoM); const v = p.today + p.estimation; if (v <= prev) return false; prev = v; } return true; })());
}
truth("unsure (0.66 to 1): about 0.81 at thirty", round(I(30, "unsure"), 2) === 0.81, I(30, "unsure").toFixed(4));
truth("and about 0.87 at fifty", round(I(50, "unsure"), 2) === 0.87, I(50, "unsure").toFixed(4));
const wk = L.REVERSION.weak;
truth("weak and unsure: about 1.06 at thirty", round(I(30, "unsure", wk), 2) === 1.06, I(30, "unsure", wk).toFixed(4));
truth("and about 1.18 at fifty", round(I(50, "unsure", wk), 2) === 1.18, I(50, "unsure", wk).toFixed(4));
truth("the two middle ranges are both centred on 0.83", Math.abs((L.DOUBT.fair[0] + L.DOUBT.fair[1]) / 2 - 0.83) < 1e-12 && Math.abs((L.DOUBT.unsure[0] + L.DOUBT.unsure[1]) / 2 - 0.83) < 1e-12);

// --------------------------------------------------------- three: persistence
console.log("-- three: why doubt about persistence matters");
const curve = (b) => L.perYear(L.investorPieces(30, b, rhoM).total, 30);
{
  const bs = Array.from({ length: 250 }, (_, i) => 0.5 + (0.5 * (i + 0.5)) / 250);
  const vals = bs.map(curve);
  const flatPart = vals.filter((v, i) => bs[i] <= 0.9);
  truth("low and fairly flat up to 0.9 (within 0.2 of each other)", Math.max(...flatPart) - Math.min(...flatPart) < 0.2, `${Math.min(...flatPart).toFixed(3)}..${Math.max(...flatPart).toFixed(3)}`);
  truth("then climbs steeply: more than doubles between 0.9 and 0.98", curve(0.98) > 1.8 * curve(0.9), `${curve(0.9).toFixed(3)} -> ${curve(0.98).toFixed(3)}`);
  const iMax = vals.indexOf(Math.max(...vals));
  truth("and comes back down just short of 1", bs[iMax] > 0.97 && bs[iMax] < 0.999 && vals[vals.length - 1] < vals[iMax], `peak at ${bs[iMax].toFixed(3)}`);
}
eq("the pink line is the average of the curve over the band", L.perYear(L.doubtedPieces(30, L.DOUBT.unsure, rhoM).total, 30), L.betaGrid(L.DOUBT.unsure).reduce((s, b) => s + curve(b), 0) / 200, 1e-12);
truth("the narrower range sits only just above the dot (within 0.05)", I(30, "fair") > curve(0.83) && I(30, "fair") - curve(0.83) < 0.05, `${I(30, "fair").toFixed(3)} vs ${curve(0.83).toFixed(3)}`);
truth("the average sits well above the value at 0.83", I(30, "unsure") > curve(0.83) + 0.1, `${I(30, "unsure").toFixed(3)} vs ${curve(0.83).toFixed(3)}`);
{
  // the very long run: the closed form against the known pieces at a huge horizon
  for (const [b, r] of [[0.83, -0.7], [0.95, -0.7], [0.83, -0.9], [0.6, -0.5]]) {
    const K = 20000, kn = L.knownPieces(K, b, r), p = L.params(b);
    eq(`long-run factor at persistence ${b}, correlation ${r}`, (kn.iid + kn.reversion + kn.future) / K / p.su2, L.longRunFactor(b, r), 2e-3);
  }
  let best = Infinity, bestB = 0;
  for (let b = 0.3; b < 0.999; b += 1e-5) { const f = L.longRunFactor(b, rhoM); if (f < best) { best = f; bestB = b; } }
  eq("the deepest point is 1 - rho^2", best, 1 - rhoM * rhoM, 1e-8);
  eq("and it's where d = -rho", bestB, L.deepestBeta(rhoM), 1e-4);
  truth("with rho = -0.7 mean reversion removes at most about half", round(1 - rhoM * rhoM, 1) === 0.5, (1 - rhoM * rhoM).toFixed(2));
  eq("at the flip the long run equals the short run", L.longRunFactor(L.flipBeta(rhoM), rhoM), 1, 1e-12);
  truth("which happens at a persistence of about 0.95", round(L.flipBeta(rhoM), 2) === 0.95, L.flipBeta(rhoM).toFixed(4));
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
