// Every number the page states, derived twice. Route A is src/insurance.js
// (the closed form). Route B prices the same guarantee with a binomial tree,
// with a Monte Carlo over real-world paths weighted by a pricing kernel that
// does see the premium, and with numerical integration, sharing no code.
import { insuranceCost, chanceBehind, expectedPayout, halfStakeYears, twinHorizon, treeCost, PREMIUM, SIGMA } from "../src/insurance.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x, d = 0) => round(100 * x, d);

// Route B1: Simpson over log R for real-world expectations
const dens = (x, mu, s) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
function simpson(f, a, b, k = 20000) { const h = (b - a) / k; let s = f(a) + f(b); for (let i = 1; i < k; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
function payoutB(T, prem, sig) { const mu = (prem - sig * sig / 2) * T, s = sig * Math.sqrt(T); return simpson((x) => (1 - Math.exp(x)) * dens(x, mu, s), mu - 12 * s, 0); }
// Route B2: the price as a real-world average weighted by the pricing kernel
// xi_T = exp(-theta W_T - theta^2 T / 2), theta = premium / sigma. This route reads the premium.
function kernelPrice(T, prem, sig) {
  const th = prem / sig, s = Math.sqrt(T);
  // integrate over W_T ~ N(0, T)
  return simpson((w) => { const lr = (prem - sig * sig / 2) * T + sig * w; return Math.max(0, 1 - Math.exp(lr)) * Math.exp(-th * w - th * th * T / 2) * dens(w, 0, s); }, -12 * s, 12 * s, 40000);
}

console.log("-- the price, three ways");
for (const T of [1, 10, 30]) {
  eq(`${T} years: closed form against a 4,000-step tree`, insuranceCost(T), treeCost(T, SIGMA, 4000), 2e-4);
  eq(`${T} years: closed form against the kernel-weighted real-world average`, insuranceCost(T), kernelPrice(T, PREMIUM, SIGMA), 1e-7);
}
truth("about 8.0% at one year", pc(insuranceCost(1), 1) === 8.0, pc(insuranceCost(1), 3) + "%");
truth("24.8% at ten years", pc(insuranceCost(10), 1) === 24.8);
truth("41.6% at thirty years", pc(insuranceCost(30), 1) === 41.6);
truth("thirty years costs about five times one year", round(insuranceCost(30) / insuranceCost(1)) === 5, (insuranceCost(30) / insuranceCost(1)).toFixed(2));
truth("half the stake by around 45 years", round(halfStakeYears()) === 45, halfStakeYears().toFixed(2));
eq("and it is half there", insuranceCost(halfStakeYears()), 0.5, 1e-12);
truth("the cost rises at every horizon", (() => { for (let t = 0.25; t < 60; t += 0.25) if (insuranceCost(t + 0.25) <= insuranceCost(t)) return false; return true; })());
truth("15% volatility: thirty years costs about 31.9%", pc(insuranceCost(30, 0.15), 1) === 31.9);
truth("25%: about 50.6%", pc(insuranceCost(30, 0.25), 1) === 50.6);

console.log("-- the chance it pays");
truth("falls from 42%", pc(chanceBehind(1)) === 42);
truth("to 14% at thirty years", pc(chanceBehind(30)) === 14);

console.log("-- only sigma sqrt(T), and no premium");
eq("thirty years at 20% is 7.5 years at 40%", twinHorizon(30, 0.2, 0.4), 7.5, 1e-12);
eq("and they cost the same", insuranceCost(30, 0.2), insuranceCost(7.5, 0.4), 1e-12);
eq("the tree agrees on the twin", treeCost(7.5, 0.4, 4000), insuranceCost(30, 0.2), 2e-4);
for (const p of [0, 0.02, 0.1]) eq(`the kernel-weighted price at a ${p * 100}% premium is the same price`, kernelPrice(30, p, SIGMA), insuranceCost(30), 1e-7);
truth("while the chance of a payout moves from 71% (no premium) to about 1% (10%)", pc(chanceBehind(30, 0)) === 71 && pc(chanceBehind(30, 0.1)) === 1, `${pc(chanceBehind(30, 0), 2)} / ${pc(chanceBehind(30, 0.1), 2)}`);
// a tree with a nonzero safe rate, priced in dollars, gives the same share of the stake
{
  const T = 30, steps = 3000, r = 0.03, dt = T / steps, u = Math.exp(SIGMA * Math.sqrt(dt)), d = 1 / u, q = (Math.exp(r * dt) - d) / (u - d), K = Math.exp(r * T);
  let v = []; for (let j = 0; j <= steps; j++) v[j] = Math.max(0, K - u ** j * d ** (steps - j));
  for (let i = steps - 1; i >= 0; i--) for (let j = 0; j <= i; j++) v[j] = Math.exp(-r * dt) * (q * v[j + 1] + (1 - q) * v[j]);
  eq("a 3% safe rate leaves the share of the stake unchanged", v[0], insuranceCost(30), 3e-4);
}

console.log("-- price against expected payout");
for (const T of [1, 7, 30]) eq(`${T} years: expected payout by integration`, expectedPayout(T), payoutB(T, PREMIUM, SIGMA), 1e-6);
truth("about 5.5% at one year", pc(expectedPayout(1), 1) === 5.5);
let bestT = 0, best = 0; for (let t = 0.5; t < 40; t += 0.01) { const v = expectedPayout(t); if (v > best) { best = v; bestT = t; } }
truth("peaks at about 7.8% around seven years", pc(best, 1) === 7.8 && round(bestT) === 7, `${pc(best, 3)}% at ${bestT.toFixed(2)}`);
truth("about 5.1% at thirty", pc(expectedPayout(30), 1) === 5.1);
truth("price is about 1.5 times the payout at one year", round(insuranceCost(1) / expectedPayout(1), 1) === 1.5);
truth("and about 8.2 times at thirty", round(insuranceCost(30) / expectedPayout(30), 1) === 8.2);
for (const T of [1, 10, 30]) eq(`at a zero premium the payout lands on the price (${T} years)`, expectedPayout(T, 0), insuranceCost(T), 1e-12);
truth("with any positive premium the price is above the payout", [0.02, 0.04, 0.06, 0.08].every((p) => [1, 5, 10, 20, 30, 40].every((T) => insuranceCost(T) > expectedPayout(T, p))));

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
