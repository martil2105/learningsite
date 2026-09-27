// Every number the page states, derived twice. Route A is src/bets.js. Route B
// enumerates coin sequences, bisects, or sums outcomes directly, and shares no
// code with route A.
import { outcomes, expectedGain, spread, worstCase, chanceLoss, chanceGain, ce1, ceN, A_STAR, PHI, lossCap, kinkedValue, oneAtATime, kinkThreshold, LAMBDA_TK } from "../src/bets.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

// Route B: every sequence of n tosses, written out (n up to 16)
function enumerate(n) {
  const totals = [];
  for (let s = 0; s < 1 << n; s++) { let t = 0; for (let i = 0; i < n; i++) t += (s >> i) & 1 ? 200 : -100; totals.push(t); }
  return totals;
}
console.log("-- the distribution, by enumeration");
for (const k of [1, 2, 3, 5, 10, 16]) {
  const T = enumerate(k), N = T.length;
  eq(`n=${k}: chance of losing money`, chanceLoss(k), T.filter((t) => t < 0).length / N, 1e-12);
  eq(`n=${k}: average`, expectedGain(k), T.reduce((a, t) => a + t, 0) / N, 1e-12);
  eq(`n=${k}: spread`, spread(k), Math.sqrt(T.reduce((a, t) => a + (t - expectedGain(k)) ** 2, 0) / N), 1e-12);
}
eq("the binomial probabilities for a hundred bets add to one", outcomes(100).reduce((a, o) => a + o.prob, 0), 1, 1e-12);
console.log("-- one bet, then a hundred");
eq("one bet is worth $50 on average", expectedGain(1), 50);
eq("a hundred win $5,000 on average", expectedGain(100), 5000);
const pl = chanceLoss(100);
truth("the chance of losing anything is about 1 in 2,300", round(1 / pl, -2) === 2300, `1 in ${(1 / pl).toFixed(1)}`);
truth("the lab prints it as 1 in 2,289", Math.round(1 / pl) === 2289);
truth("losing needs 67 or more losing tosses: 33 wins lose, 34 wins gain", outcomes(100)[33].total < 0 && outcomes(100)[34].total > 0);
eq("worst case grows from $100 to $10,000", worstCase(100), -10000);
eq("typical swing from $150", spread(1), 150);
eq("to $1,500", spread(100), 1500);
truth("more than 99.9% of the time a hundred bets come out ahead", chanceGain(100) > 0.999, chanceGain(100).toFixed(5));
console.log("-- shared equally among a hundred people");
eq("each person still makes $50 on average", expectedGain(100) / 100, 50);
eq("worst case is losing $100", worstCase(100) / 100, -100);
eq("typical swing is only $15", spread(100) / 100, 15);

console.log("-- constant absolute risk aversion");
// Route B: the certainty equivalent summed over every outcome (and over every sequence for small n)
const ceLong = (a, k) => -Math.log(outcomes(k).reduce((s, o) => s + o.prob * Math.exp(-a * o.total), 0)) / a;
const ceSeq = (a, k) => { const T = enumerate(k); return -Math.log(T.reduce((s, t) => s + Math.exp(-a * t), 0) / T.length) / a; };
for (const a of [0.001, 0.003, A_STAR, 0.006, 0.01]) {
  for (const k of [2, 10, 50, 100]) eq(`a=${a.toFixed(5)}, n=${k}: n times one bet equals the sum over outcomes`, ceN(a, k), ceLong(a, k), 1e-9);
  eq(`a=${a.toFixed(5)}: n=12 by every sequence`, ceN(a, 12), ceSeq(a, 12), 1e-9);
}
truth("so the sign never changes with n (checked for every n to 100, both sides of the fence)", [0.003, 0.006].every((a) => { const s = Math.sign(ce1(a)); for (let k = 1; k <= 100; k++) if (Math.sign(ceLong(a, k)) !== s) return false; return true; }));
truth("cautious preset: one bet worth about -$10", round(ce1(0.006)) === -10, ce1(0.006).toFixed(3));
truth("and a hundred about -$1,000", round(ceN(0.006, 100), -2) === -1000, ceN(0.006, 100).toFixed(1));
truth("keen preset: one bet worth about $17", round(ce1(0.003)) === 17, ce1(0.003).toFixed(3));
truth("and a hundred about $1,700", round(ceN(0.003, 100), -2) === 1700, ceN(0.003, 100).toFixed(1));
// the fence: bisect the expected-utility condition directly
let lo = 1e-6, hi = 0.02;
for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; (0.5 * Math.exp(-200 * mid) + 0.5 * Math.exp(100 * mid) < 1 ? (lo = mid) : (hi = mid)); }
eq("the fence found by bisection is ln(golden ratio)/100", (lo + hi) / 2, A_STAR, 1e-10);
eq("the golden ratio solves x^3 - 2x^2 + 1 = 0", PHI ** 3 - 2 * PHI ** 2 + 1, 0, 1e-12);
eq("and x^2 - x - 1 = 0", PHI * PHI - PHI - 1, 0, 1e-12);
truth("about 4.81 per $1,000", round(A_STAR * 1000, 2) === 4.81);
truth("one bet is worth nothing on the fence", Math.abs(ce1(A_STAR)) < 1e-9, String(ce1(A_STAR)));

console.log("-- Samuelson's theorem for a utility that isn't constant-risk-aversion");
// u = -e^{-aw} - e^{-bw} with a, b above the fence refuses one bet at every wealth; the theorem says it refuses n.
const uMix = (w) => -Math.exp(-0.005 * w) - 0.3 * Math.exp(-0.009 * w);
const EU = (u, w, k) => outcomes(k).reduce((s, o) => s + o.prob * u(w + o.total), 0);
truth("it refuses one bet at every wealth from -$10,000 to $20,000", (() => { for (let w = -10000; w <= 20000; w += 50) if (EU(uMix, w, 1) >= uMix(w)) return false; return true; })());
truth("and so refuses every run of 1 to 100 bets, at every starting wealth tried", (() => { for (const w of [-5000, 0, 1000, 10000]) for (let k = 1; k <= 100; k++) if (EU(uMix, w, k) >= uMix(w)) return false; return true; })());
truth("each extra bet makes it worse, as the proof peels them off", (() => { for (let k = 1; k <= 100; k++) if (EU(uMix, 0, k) >= EU(uMix, 0, k - 1 || 0) && k > 1) return false; return true; })());

console.log("-- Rabin in miniature");
// Route B: bisect the largest loss L that a person on the fence takes for a huge prize
let L0 = 1, L1 = 1000; const G = 1e6;
for (let i = 0; i < 200; i++) { const L = (L0 + L1) / 2; (0.5 * Math.exp(A_STAR * L) + 0.5 * Math.exp(-A_STAR * G) < 1 ? (L0 = L) : (L1 = L)); }
eq("the largest 50-50 loss risked for a $1m prize", (L0 + L1) / 2, lossCap(A_STAR), 1e-9);
truth("about $144", round(lossCap(A_STAR)) === 144, lossCap(A_STAR).toFixed(3));
truth("the cautious preset's cap is $116", round(lossCap(0.006)) === 116);

console.log("-- losses counted more than gains");
eq("one bet at 2.25 is worth -$12.50", kinkedValue(1, LAMBDA_TK), 100 - 50 * 2.25, 1e-12);
eq("a hundred, one at a time: -$1,250", oneAtATime(100, LAMBDA_TK), -1250, 1e-12);
truth("a hundred as a package: about $5,000", round(kinkedValue(100, LAMBDA_TK), -2) === 5000, kinkedValue(100, LAMBDA_TK).toFixed(2));
eq("one bet flips at a weight of exactly 2", kinkThreshold(1), 2, 1e-12);
truth("the package would need a weight of about 32,900", round(kinkThreshold(100), -2) === 32900, kinkThreshold(100).toFixed(1));
// route B for the package value: enumerate 16 tosses and compare the per-sequence value
const T16 = enumerate(16);
eq("package value by enumeration (16 bets)", kinkedValue(16, 2.25), T16.reduce((a, t) => a + (t > 0 ? t : 2.25 * t), 0) / T16.length, 1e-12);
// the premise fails for the kinked utility: after one win the next bet is taken
const uKink = (w) => (w >= 0 ? w : 2.25 * w);
truth("the kinked utility refuses the first bet at the wealth it started with", EU(uKink, 0, 1) < uKink(0));
truth("but takes the next bet after a single win", EU(uKink, 200, 1) > uKink(200));

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
