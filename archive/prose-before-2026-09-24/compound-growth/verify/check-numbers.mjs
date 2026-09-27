/*
  Re-derives every number compound-growth's prose states, from src/growth.js,
  and checks the lognormal results against a separate simulation of 20,000
  paths that uses its own generator and shares no code with the module.
*/
import {
  doublingTime, gapDoublingTime, ruleExactAt, compoundRate, arithmeticMean, alternating, zeroGrowthSwing,
  expectedLevel, medianLevel, shareAboveMean, typicalRate, muFor, normals, paths, Phi,
} from "../src/growth.js";
import { RICH, FAST, YEARS, STEADY, BOOM, BUST, Q_YEARS, MEAN_GROWTH, LAB_YEARS, LAB_PATHS, SEED } from "../src/datasets.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const close = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// --- the build-up ---------------------------------------------------------------------
ok("after 100 years: 7.2× at 2%, 19.2× at 3%, more than two and a half times apart",
   (1.02 ** YEARS).toFixed(1) === "7.2" && (1.03 ** YEARS).toFixed(1) === "19.2" && (1.03 / 1.02) ** YEARS > 2.5 && (1.03 / 1.02) ** YEARS < 2.7);
ok("the ratio grows at about one point a year", Math.abs((1.03 / 1.02 - 1) * 100 - 1) < 0.03);
ok("the rule of 70 is exact at 1.98%", (ruleExactAt(70) * 100).toFixed(2) === "1.98");
ok("the rule of 72 is exact at 7.85%", (ruleExactAt(72) * 100).toFixed(2) === "7.85");
ok("at 2% the exact doubling time is 35.0 years", doublingTime(RICH).toFixed(1) === "35.0");
ok("a one-point gap (3% vs 2%) doubles in 71.0 years", gapDoublingTime(FAST, RICH).toFixed(1) === "71.0");
ok("the small-rate numerator is ln 2 × 100 = 69.3, a little above 69", (Math.log(2) * 100).toFixed(1) === "69.3");
{
  // on a log axis a constant-growth path is a straight line: equal steps in log level per year
  const steps = Array.from({ length: YEARS }, (_, t) => Math.log(1.02 ** (t + 1)) - Math.log(1.02 ** t));
  ok("constant growth is a straight line in logs", steps.every((d) => Math.abs(d - Math.log(1.02)) < 1e-12));
}

// --- the question ---------------------------------------------------------------------
{
  const A = Array.from({ length: Q_YEARS }, () => STEADY);
  const B = Array.from({ length: Q_YEARS }, (_, t) => (t % 2 ? BUST : BOOM));
  const lev = (r) => r.reduce((a, g) => a * (1 + g), 1);
  ok("B's growth rates average 3%", close(arithmeticMean(B), 0.03));
  ok("…but it grew at 2.88% a year", (compoundRate(B) * 100).toFixed(2) === "2.88");
  ok("A ends 4.38× and B 4.13×, so A is 6.1% richer",
     lev(A).toFixed(2) === "4.38" && lev(B).toFixed(2) === "4.13" && ((lev(A) / lev(B) - 1) * 100).toFixed(1) === "6.1");
  ok("two years of B multiply by 1.0584", close(1.08 * 0.98, 1.0584));
  ok("a 10% fall and a 10% rise leave you 1% worse off", close(0.9 * 1.1, 0.99));
  ok("the alternating formula matches the sequence exactly", close(alternating(0.03, 0.05), compoundRate(B)));
}

// --- the drag ---------------------------------------------------------------------------
ok("swings of ±24.7 points around 3% compound to exactly zero", (zeroGrowthSwing(STEADY) * 100).toFixed(1) === "24.7" && Math.abs(alternating(STEADY, zeroGrowthSwing(STEADY))) < 1e-15);
ok("the approximation a − s²/2(1+a) is indistinguishable for moderate swings (within 0.002 points at ±10)",
   Math.abs(alternating(0.03, 0.1) - (0.03 - 0.01 / 2.06)) * 100 < 0.002);
ok("a rich country's drag, σ = 2%, is about two hundredths of a point", Math.abs(0.02 ** 2 / 2 * 100 - 0.02) < 1e-12);
{
  let mono = true, prev = Infinity;
  for (let i = 0; i <= 120; i++) { const g = alternating(0.03, (0.3 * i) / 120); if (g > prev) mono = false; prev = g; }
  ok("bigger swings always cost more", mono);
}

// --- the lab ------------------------------------------------------------------------------
ok("the expected level after 50 years is 2.69× at every volatility", [0.01, 0.02, 0.15, 0.2, 0.3].every(() => expectedLevel(MEAN_GROWTH, LAB_YEARS).toFixed(2) === "2.69"));
ok("medians: 2.66× at σ = 2%, 1.53× at 15%, 0.99× at 20%",
   medianLevel(MEAN_GROWTH, 0.02, LAB_YEARS).toFixed(2) === "2.66" && medianLevel(MEAN_GROWTH, 0.15, LAB_YEARS).toFixed(2) === "1.53" && medianLevel(MEAN_GROWTH, 0.2, LAB_YEARS).toFixed(2) === "0.99");
ok("shares above the expected level: 47.2%, 29.8%, 24.0%",
   [0.02, 0.15, 0.2].map((s) => (shareAboveMean(s, LAB_YEARS) * 100).toFixed(1)).join(",") === "47.2,29.8,24.0",
   [0.02, 0.15, 0.2].map((s) => (shareAboveMean(s, LAB_YEARS) * 100).toFixed(1)).join(","));
ok("the share above falls as time passes", [10, 50, 100, 400].map((t) => shareAboveMean(0.2, t)).every((v, i, a) => i === 0 || v < a[i - 1]));
ok("…and the median path at σ = 20% loses about 0.02% a year", (typicalRate(MEAN_GROWTH, 0.2) * 100).toFixed(2) === "-0.02");
ok("ln(1+A) − ln(1+G) = σ²/2 exactly", [0.02, 0.15, 0.3].every((s) => close(Math.log(1 + MEAN_GROWTH) - muFor(MEAN_GROWTH, s), (s * s) / 2)));
ok("Φ is accurate: Φ(0) = 0.5 and Φ(−1.96) = 0.025 to 1e-4", Math.abs(Phi(0) - 0.5) < 1e-7 && Math.abs(Phi(-1.96) - 0.025) < 1e-4);
{
  // The lab's own 400 paths: the simulated share and the sample mean.
  const Z = normals(LAB_PATHS, LAB_YEARS, SEED);
  for (const s of [0.02, 0.15, 0.2]) {
    const P = paths(Z, MEAN_GROWTH, s);
    const E = expectedLevel(MEAN_GROWTH, LAB_YEARS);
    const share = P.filter((p) => p[LAB_YEARS] > E).length / LAB_PATHS;
    // binomial standard error at n = 400 is at most 2.5 points; allow 3 standard errors
    ok(`the lab's 400 paths at σ = ${s * 100}% land within sampling error of the exact share (±7.5 points)`, Math.abs(share - shareAboveMean(s, LAB_YEARS)) < 0.075, `${share} vs ${shareAboveMean(s, LAB_YEARS).toFixed(3)}`);
  }
}
{
  // A separate simulation: its own xorshift generator and Marsaglia polar normals.
  let st = 88172645463325252n;
  const next = () => { st ^= st << 13n; st &= (1n << 64n) - 1n; st ^= st >> 7n; st ^= st << 17n; st &= (1n << 64n) - 1n; return Number(st >> 11n) / 2 ** 53; };
  const norm = () => { for (;;) { const u = 2 * next() - 1, v = 2 * next() - 1, q = u * u + v * v; if (q > 0 && q < 1) return u * Math.sqrt((-2 * Math.log(q)) / q); } };
  const N = 20000, s = 0.2, m = 0.02, T = 50;
  const mu = Math.log(1 + m) - (s * s) / 2;
  let above = 0, sumLevel = 0;
  const E = (1 + m) ** T;
  for (let i = 0; i < N; i++) { let l = 0; for (let t = 0; t < T; t++) l += mu + s * norm(); const Y = Math.exp(l); sumLevel += Y; if (Y > E) above++; }
  ok("20,000 independently simulated paths at σ = 20%: share above the mean matches Φ(−σ√t/2) (±1 point)", Math.abs(above / N - shareAboveMean(s, T)) < 0.01, `${(above / N).toFixed(4)}`);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
