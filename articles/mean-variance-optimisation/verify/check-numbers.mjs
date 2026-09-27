// Every number the page states, derived twice. Route A is src/mvo.js; route B
// uses closed forms for the equicorrelated universe, Gaussian quadrature for
// E[cos], and a direct Monte Carlo of the optimiser.
import { universeSpec, optimal, sharpe, estimate, scaleToVol, meanSE, drawsFor, expectedCos, approxCos, yearsToReach, approxYears } from "../src/mvo.js";
import { normals } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!ok) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }

const spec = universeSpec();
console.log("-- the ten-asset world");
truth("means run from 2.4% to 7.4%", (100 * spec.mu[0]).toFixed(1) === "2.4" && (100 * spec.mu[9]).toFixed(1) === "7.4");
// Route B: closed forms for an equicorrelated covariance
const s2 = 0.04, rho = 0.3, N = 10;
const sum = spec.mu.reduce((a, b) => a + b, 0), sumsq = spec.mu.reduce((a, b) => a + b * b, 0);
const srBestB = Math.sqrt((sumsq - (rho * sum * sum) / (1 + (N - 1) * rho)) / (s2 * (1 - rho)));
eq("best Sharpe 0.50 (A)", sharpe(optimal(spec.mu, spec.S), spec.mu, spec.S), 0.5);
eq("best Sharpe 0.50 (B)", srBestB, 0.5);
eq("equal weights 0.40 (A)", sharpe(new Array(10).fill(0.1), spec.mu, spec.S), 0.4);
eq("equal weights 0.40 (B)", sum / N / Math.sqrt(s2 * (rho + (1 - rho) / N)), 0.4);
eq("four fifths of the best", 0.4 / 0.5, 0.8);
const best = scaleToVol(optimal(spec.mu, spec.S), spec.S);
truth("best weights short the lowest three", best[0] < 0 && best[1] < 0 && best[2] < 0 && best[3] > 0);
truth("neighbouring means about half a point apart", Math.abs(100 * (spec.mu[1] - spec.mu[0]) - 0.55) < 0.01);

console.log("-- the lab");
const e19 = estimate(19, 30, spec);
truth("seed 19, 30 years: optimiser's Sharpe 0.33", sharpe(optimal(e19.muHat, e19.Shat), spec.mu, spec.S).toFixed(2) === "0.33");
function labStats(years, seeds = 1000) {
  let both = 0, means = 0, beatBoth = 0, beatMeans = 0;
  for (let sd = 1; sd <= seeds; sd++) {
    const e = estimate(sd, years, spec);
    const b = sharpe(optimal(e.muHat, e.Shat), spec.mu, spec.S), m = sharpe(optimal(e.muHat, spec.S), spec.mu, spec.S);
    both += b; means += m; if (b > 0.4) beatBoth++; if (m > 0.4) beatMeans++;
  }
  return { both: both / seeds, means: means / seeds, beatBoth: beatBoth / seeds, beatMeans: beatMeans / seeds };
}
const l30 = labStats(30), l100 = labStats(100);
truth("30 years: equal weights win about four times in five", Math.abs(1 - l30.beatBoth - 0.8) < 0.03, (1 - l30.beatBoth).toFixed(3));
truth("100 years: optimiser still loses more than one time in five", 1 - l100.beatBoth > 0.2 && 1 - l100.beatBoth < 0.25, (1 - l100.beatBoth).toFixed(3));
truth("30 years: both estimated 0.326, means only 0.330", l30.means.toFixed(3) === "0.330" && l30.both.toFixed(3) === "0.326", `${l30.means.toFixed(4)} ${l30.both.toFixed(4)}`);

console.log("-- the mean blur");
eq("16% over 50 years: ±2.3 points", +(100 * meanSE(0.16, 50)).toFixed(1), 2.3);
eq("±1 point needs 256 years", (0.16 / 0.01) ** 2, 256);
eq("20% over 30 years blurs each mean by 3.7 points", +(100 * meanSE(0.2, 30)).toFixed(1), 3.7);
// Merton: the estimate uses only the endpoints, so its spread doesn't depend on frequency
function blurSim(freq, years, seeds = 4000) {
  const z = normals(99 + freq);
  const dt = 1 / freq; let s = 0, s2 = 0;
  for (let k = 0; k < seeds; k++) { let tot = 0; for (let i = 0; i < freq * years; i++) tot += 0.05 * dt + 0.16 * Math.sqrt(dt) * z(); const m = tot / years; s += m; s2 += m * m; }
  return Math.sqrt(s2 / seeds - (s / seeds) ** 2);
}
const b1 = blurSim(1, 50), b12 = blurSim(12, 50);
truth("yearly and monthly observations give the same blur", Math.abs(b1 - 0.0226) < 0.001 && Math.abs(b12 - 0.0226) < 0.001, `${b1.toFixed(4)} ${b12.toFixed(4)}`);

console.log("-- the angle");
// Route B: E[cos] by quadrature over g1 (normal) and X (chi-square, N-1 dof)
function lgamma(x) { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const cc of c) s += cc / ++y; return -t + Math.log((2.5066282746310005 * s) / x); }
function EcosQuad(a, N) {
  const k = N - 1, G = 400, Xn = 1500;
  const xmax = k + 14 * Math.sqrt(2 * k) + 30;
  let tot = 0;
  for (let i = 0; i <= G; i++) {
    const g = -8 + (16 * i) / G, wg = (i === 0 || i === G ? 0.5 : 1) * (16 / G) * Math.exp(-g * g / 2) / Math.sqrt(2 * Math.PI);
    let inner = 0;
    for (let j = 1; j <= Xn; j++) {
      const X = (xmax * (j - 0.5)) / Xn;
      const dens = Math.exp((k / 2 - 1) * Math.log(X) - X / 2 - (k / 2) * Math.log(2) - lgamma(k / 2));
      const u = a + g; inner += (u / Math.sqrt(u * u + X)) * dens * (xmax / Xn);
    }
    tot += wg * inner;
  }
  return tot;
}
for (const [NN, T] of [[10, 30], [25, 50], [10, 100]]) {
  const a = 0.5 * Math.sqrt(T);
  eq(`E[cos], N=${NN}, ${T} years: common draws (A) vs quadrature (B)`, expectedCos(a, drawsFor(NN)), EcosQuad(a, NN), 0.005);
}
const aLab = 0.5 * Math.sqrt(30);
truth("signal a = 2.7 at 30 years", aLab.toFixed(1) === "2.7");
eq("other nine directions typically 3", Math.sqrt(9), 3);
truth("theory for the lab: about 0.33 with means only", Math.abs(0.5 * EcosQuad(aLab, 10) - 0.33) < 0.005, (0.5 * EcosQuad(aLab, 10)).toFixed(4));
const cd = drawsFor(10, 300, 777); let cs = 0; for (let k = 0; k < 300; k++) { const u = aLab + cd.g1[k]; cs += u / Math.sqrt(u * u + cd.X[k]); }
truth("cloud of 300 lands near 0.33", (0.5 * cs / 300).toFixed(2) === "0.33", (0.5 * cs / 300).toFixed(4));
truth("approximation within 0.03 of quadrature at N=25, 50 years", Math.abs(approxCos(0.5 * Math.sqrt(50), 25) - EcosQuad(0.5 * Math.sqrt(50), 25)) < 0.03);

console.log("-- years needed (k = 0.8, SR = 0.5)");
const yrs = {};
for (const NN of [10, 25, 50]) yrs[NN] = yearsToReach(0.8, 0.5, drawsFor(NN));
truth("ten assets: about 68 years", Math.round(yrs[10]) === 68, yrs[10].toFixed(2));
truth("twenty-five: about 174", Math.round(yrs[25]) === 174, yrs[25].toFixed(2));
truth("fifty: about 353", Math.round(yrs[50]) === 353, yrs[50].toFixed(2));
// Route B for the root: bisection on the quadrature
function yearsQuad(k, NN) { let lo = 0, hi = 30; for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if (EcosQuad(mid, NN) < k) lo = mid; else hi = mid; } return ((lo + hi) / 2 / 0.5) ** 2; }
eq("ten assets by quadrature (B)", yearsQuad(0.8, 10), yrs[10], 0.02);
truth("approximation formula near: 71 and 178", Math.round(approxYears(0.8, 0.5, 10)) === 71 && Math.round(approxYears(0.8, 0.5, 25)) === 178);
truth("twenty-five assets is about 2,100 months", Math.abs(12 * yrs[25] - 2100) < 50, (12 * yrs[25]).toFixed(0));
const y90 = yearsToReach(0.9, 0.5, drawsFor(10)), y60 = yearsToReach(0.6, 0.5, drawsFor(10));
truth("90% more than doubles the years", y90 / yrs[10] > 2, (y90 / yrs[10]).toFixed(2));
truth("60% cuts them to about a third", Math.abs(y60 / yrs[10] - 1 / 3) < 0.03, (y60 / yrs[10]).toFixed(3));

console.log(fails ? `\n${fails} of ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
if (fails) process.exit(1);
