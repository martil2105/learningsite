// Every number the page states, derived here. Route A is src/merton.js (the
// closed forms). Route B works the certainty equivalent out from expected
// utility of terminal wealth by numerical integration, finds the best share by
// search rather than by the formula, and simulates plug-in investors with a
// generator of its own.
import * as M from "../src/merton.js";
import { mulberry32 } from "../src/random.js";
import { normCdf } from "../src/stats.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x, d = 0) => round(100 * x, d);
const E = 0.05, S = 0.18, r = 0.02;

// Route B: CE per year from E[u(W_T)], u = W^(1-g)/(1-g) (log at g = 1), with
// continuous rebalancing, so log W_T ~ N((r + pi e - pi^2 s^2 / 2) T, pi^2 s^2 T).
const dens = (x, mu, s) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
function simpson(f, a, b, k = 4000) { const h = (b - a) / k; let s = f(a) + f(b); for (let i = 1; i < k; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
function ceFromUtility(pi, g, T, e = E, s = S) {
  const mu = (r + pi * e - (pi * pi * s * s) / 2) * T, sd = Math.abs(pi) * s * Math.sqrt(T);
  if (sd === 0) return mu / T - r;
  if (g === 1) return simpson((x) => x * dens(x, mu, sd), mu - 12 * sd, mu + 12 * sd) / T - r;
  const Eu = simpson((x) => Math.exp((1 - g) * x) * dens(x, mu, sd), mu - 14 * sd, mu + 14 * sd);
  return Math.log(Eu) / (1 - g) / T - r;
}
console.log("-- what a share is worth, from expected utility");
for (const [pi, g, T] of [[0.5, 2, 1], [0.77, 2, 30], [1, 2, 10], [1.5, 1, 20], [2, 4, 5], [0.3, 8, 40]])
  eq(`CE at share ${pi}, gamma ${g}, ${T} years, against the formula`, ceFromUtility(pi, g, T), M.gain(pi, E, S, g), 1e-7);
{
  // the best share by golden-section search on the utility route, at two horizons
  const argmax = (g, T) => { let a = -1, b = 4; const k = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 90; i++) { const c = b - k * (b - a), d = a + k * (b - a); if (ceFromUtility(c, g, T) > ceFromUtility(d, g, T)) b = d; else a = c; } return (a + b) / 2; };
  for (const g of [1, 2, 4]) for (const T of [1, 30]) eq(`the best share at gamma ${g}, ${T} years, found by search`, argmax(g, T), M.mertonShare(E, S, g), 1e-5);
}
truth("about 77% at gamma 2", pc(M.mertonShare()) === 77);
truth("worth about 1.93 points a year there", pc(M.bestGain(), 2) === 1.93);
truth("about 154% at gamma 1", pc(M.mertonShare(E, S, 1)) === 154);
truth("about 39% at gamma 4, and it halves again at 8", pc(M.mertonShare(E, S, 4)) === 39 && Math.abs(M.mertonShare(E, S, 8) - M.mertonShare(E, S, 4) / 2) < 1e-15);
eq("at gamma 2 a unit of variance costs a unit of return", M.gain(1, 0, 1, 2), -0.5 * 2 * 1, 1e-15);

console.log("-- the flat top");
truth("all in stocks is worth about 1.76 points", pc(M.gain(1), 2) === 1.76);
truth("which keeps about 91% of the best", pc(M.gain(1) / M.bestGain()) === 91);
for (const [e, s, g, x] of [[0.05, 0.18, 2, 0.5], [0.03, 0.25, 4, 1.7], [0.07, 0.15, 1, 2.4]]) {
  const p = x * M.mertonShare(e, s, g);
  eq(`x times the share keeps 2x - x^2 of the best (x = ${x}, other inputs)`, M.gain(p, e, s, g) / M.bestGain(e, s, g), M.keptAt(x), 1e-12);
}
eq("half the share keeps three quarters", M.keptAt(0.5), 0.75, 1e-15);
eq("and so does one and a half times", M.keptAt(1.5), 0.75, 1e-15);
eq("twice the share keeps nothing", M.keptAt(2), 0, 1e-15);
truth("beyond twice it's worse than no stocks", M.keptAt(2.01) < 0 && M.gain(2.01 * M.mertonShare()) < 0);
eq("a third away costs a ninth", 1 - M.keptAt(2 / 3), 1 / 9, 1e-12);
eq("at gamma 1 twice Kelly grows no faster than the safe rate (median growth, utility route)", ceFromUtility(2 * M.kellyShare(), 1, 25), 0, 1e-7);
{
  // the median growth rate of a Kelly bettor, by simulation of yearly compounding with continuous rebalancing
  const g = mulberry32(31), gauss = () => { let a = 0; while (a === 0) a = g(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * g()); };
  const growth = (pi) => { const T = 200, v = []; for (let i = 0; i < 4001; i++) { let l = 0; for (let t = 0; t < T; t++) l += pi * E - (pi * pi * S * S) / 2 + pi * S * gauss(); v.push(l / T); } v.sort((a, b) => a - b); return v[2000]; };
  const k = M.kellyShare();
  truth("Kelly grows faster than 0.75 and 1.25 times Kelly (simulated medians)", growth(k) > growth(0.75 * k) && growth(k) > growth(1.25 * k));
}

console.log("-- which premium");
truth("the log premium is about 3.4%", pc(M.logPremium(), 1) === 3.4, pc(M.logPremium(), 3) + "%");
truth("typed in at 3.4% the share is about 52%", pc(0.034 / (2 * S * S)) === 52);
truth("a third less stock", round(1 - 0.034 / (2 * S * S) / M.mertonShare(), 1) === 0.3 || Math.abs(1 - 0.034 / (2 * S * S) / M.mertonShare() - 1 / 3) < 0.04);
eq("the log-premium formula gives back the share", M.shareFromLog(M.logPremium()), M.mertonShare(), 1e-12);

console.log("-- the premium we have to estimate");
truth("a century, gamma 2: the share's standard error is about 28 points", pc(M.shareError(100)) === 28);
truth("so 77% could come out as 49% or 105% (one standard error either way)", pc(M.mertonShare() - M.shareError(100)) === 49 && pc(M.mertonShare() + M.shareError(100)) === 105);
truth("the Sharpe ratio is about 0.28", round(M.sharpe(), 2) === 0.28);
truth("a century keeps about 87%", pc(M.keptAfterEstimating(100)) === 87);
truth("30 years keeps about 57%", pc(M.keptAfterEstimating(30)) === 57);
truth("about 13 years uses up the whole gain", round(M.breakEvenYears()) === 13, M.breakEvenYears().toFixed(3));
eq("and there the average gain is zero", M.keptAfterEstimating(M.breakEvenYears()), 0, 1e-12);
{
  // Route B: many plug-in investors with an independent generator, at several gammas and horizons
  const g = mulberry32(4242), gauss = () => { let a = 0; while (a === 0) a = g(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * g()); };
  for (const [N, gam] of [[100, 2], [30, 4], [13, 1]]) {
    let acc = 0; const R = 60000;
    for (let i = 0; i < R; i++) { const eh = E + (S / Math.sqrt(N)) * gauss(); acc += M.gain(eh / (gam * S * S), E, S, gam); }
    eq(`simulated plug-in investors keep 1 - 1/(N SR^2) (N ${N}, gamma ${gam}, sampling tolerance)`, acc / R / M.bestGain(E, S, gam), M.keptAfterEstimating(N), 0.02);
  }
}
{
  const worse = (N) => M.pluginShares(11, N, 200).filter((p) => p < 0 || p > 2 * M.mertonShare()).length;
  truth("13 years: about a third of the drawn investors are pink", Math.abs(worse(13) / 200 - 1 / 3) < 0.05, `${worse(13)} of 200`);
  eq("which is what 2 Phi(-sqrt(N) SR) says (sampling tolerance)", worse(13) / 200, 2 * normCdf(-Math.sqrt(13) * M.sharpe()), 0.05);
  truth("a century: almost none", worse(100) <= 3, `${worse(100)} of 200`);
  const kept13 = M.pluginShares(11, 13, 200).reduce((s, p) => s + M.gain(p), 0) / 200 / M.bestGain();
  truth("and at 13 years the drawn investors keep about nothing on average", Math.abs(kept13) < 0.15, kept13.toFixed(3));
  const all = [13, 30, 100, 200].flatMap((N) => M.pluginShares(11, N, 200));
  truth("every drawn share fits the panel (-150% to 350%)", all.every((p) => p > -1.5 && p < 3.5));
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
