/*
  verify/check-numbers.mjs for elasticity
  Re-derives all numbers, formulas, limits, and identities from src/demand.js
*/
import {
  P0,
  Q0,
  families,
  pointElasticity,
  rulerSegments,
  midpointFormula,
  logDifferenceFormula,
  revenue,
  peakPrice,
} from "../src/demand.js";
import { mulberry32 } from "../src/rng.js";

let pass = 0;
const fails = [];

function ok(claim, cond, detail = "") {
  if (cond) {
    pass++;
    console.log("  ok   " + claim + (detail ? "  [" + detail + "]" : ""));
  } else {
    fails.push(claim + (detail ? " — " + detail : ""));
    console.log("  FAIL " + claim + (detail ? "  [" + detail + "]" : ""));
  }
}

console.log("=== elasticity: number verification ===");

// 1. The Pin: all five families return q(25) = 45 to < 1e-12, and each returns stated |ε| at pin
{
  let worstQ = 0;
  let worstEps = 0;
  for (const [id, fam] of Object.entries(families)) {
    const q = fam.q(P0);
    const eps = pointElasticity(fam, P0);
    worstQ = Math.max(worstQ, Math.abs(q - Q0));
    worstEps = Math.max(worstEps, Math.abs(eps - fam.pinEps));
  }
  ok(
    "the pin: all 5 families pass through (25, 45) with their stated |ε| to < 1e-12",
    worstQ < 1e-12 && worstEps < 1e-12,
    `worstQ ${worstQ.toExponential(2)}, worstEps ${worstEps.toExponential(2)}`
  );
}

// 2. Straight-line closed forms: |ε| === p/(P_max - p) and === (q_max - q)/q over fine grid
{
  const fam = families.lin;
  let worstRel1 = 0, worstRel2 = 0;
  for (let p = 0.5; p <= fam.pmax - 0.5; p += 0.05) {
    const eps = pointElasticity(fam, p);
    const formula1 = p / (fam.pmax - p);
    const q = fam.q(p);
    const formula2 = (fam.qmax - q) / q;
    worstRel1 = Math.max(worstRel1, Math.abs(eps - formula1) / formula1);
    worstRel2 = Math.max(worstRel2, Math.abs(eps - formula2) / formula2);
  }
  const midEps = pointElasticity(fam, fam.pmax / 2);
  ok(
    "straight-line closed form |ε| === p/(P_max - p) and (q_max - q)/q to < 1e-12",
    worstRel1 < 1e-12 && worstRel2 < 1e-12 && Math.abs(midEps - 1.0) < 1e-12,
    `worstRel1 ${worstRel1.toExponential(2)}, midEps ${midEps.toFixed(6)}`
  );
}

// 3. The six quoted elasticities along the line at printed precision
{
  const fam = families.lin;
  const quotes = [
    { p: 5, expected: "0.087", calc: (5 / 57.5).toFixed(3) },
    { p: 12.5, expected: "0.25", calc: (12.5 / 50).toFixed(2) },
    { p: 25, expected: "0.667", calc: (25 / 37.5).toFixed(3) },
    { p: 31.25, expected: "1.0", calc: (31.25 / 31.25).toFixed(1) },
    { p: 50, expected: "4.0", calc: (50 / 12.5).toFixed(1) },
    { p: 60, expected: "24.0", calc: (60 / 2.5).toFixed(1) },
  ];
  let allMatch = true;
  for (const q of quotes) {
    const eps = pointElasticity(fam, q.p);
    const formatted = eps.toFixed(q.expected.includes(".") ? q.expected.split(".")[1].length : 0);
    if (formatted !== q.expected) allMatch = false;
  }
  ok(
    "six quoted elasticities along the line match printed values (0.087 to 24.0)",
    allMatch
  );
}

// 4. The segment identity per family, >= 3,000 points each, worst relative < 1e-12
for (const [id, fam] of Object.entries(families)) {
  let worstRel = 0;
  const pLow = 1;
  const pHigh = fam.pmax ? fam.pmax * 0.95 : 70;
  const nPoints = 3000;
  const step = (pHigh - pLow) / nPoints;

  for (let i = 0; i < nPoints; i++) {
    const p = pLow + i * step;
    const seg = rulerSegments(fam, p);
    const eps = pointElasticity(fam, p);
    const rel = Math.abs(seg.ratio - eps) / eps;
    if (rel > worstRel) worstRel = rel;
  }

  ok(
    `segment ratio equals |ε| identically on ${id} (>= 3,000 points)`,
    worstRel < 1e-12,
    `family ${id}: worstRel ${worstRel.toExponential(2)}`
  );
}

// 5. Segment identity computed a second way: from the two intercepts rather than lengths
{
  let worstRel2nd = 0;
  for (const [id, fam] of Object.entries(families)) {
    for (let p = 5; p <= (fam.pmax ? fam.pmax * 0.9 : 60); p += 1) {
      const q = fam.q(p);
      const d = fam.dq(p);
      const eps = pointElasticity(fam, p);

      // Horizontal projections
      const deltaP_upper = p;
      const deltaP_lower = -q / d;
      const ratioP = deltaP_upper / deltaP_lower;

      // Vertical projections
      const deltaQ_upper = -p * d;
      const deltaQ_lower = q;
      const ratioQ = deltaQ_upper / deltaQ_lower;

      worstRel2nd = Math.max(worstRel2nd, Math.abs(ratioP - eps) / eps, Math.abs(ratioQ - eps) / eps);
    }
  }
  ok(
    "segment identity from horizontal and vertical projections matches to < 1e-12",
    worstRel2nd < 1e-12,
    `worstRel2nd ${worstRel2nd.toExponential(2)}`
  );
}

// 6. d ln R / d ln p === 1 - |ε| by central difference, per family, q >= 0.01 * q(25)
{
  for (const [id, fam] of Object.entries(families)) {
    let worstGap = 0;
    const h = 1e-5;
    const pMin = 5;
    const pMax = fam.pmax ? fam.pmax * 0.9 : 55;

    for (let p = pMin; p <= pMax; p += 0.5) {
      if (fam.q(p) < 0.01 * Q0) continue;
      const rPlus = revenue(fam, p + h);
      const rMinus = revenue(fam, p - h);
      const dlnR_dlnP = (Math.log(rPlus) - Math.log(rMinus)) / (Math.log(p + h) - Math.log(p - h));
      const closed = 1 - pointElasticity(fam, p);
      const gap = Math.abs(dlnR_dlnP - closed);
      if (gap > worstGap) worstGap = gap;
    }

    ok(
      `d ln R / d ln p === 1 - |ε| by central difference on ${id} (q >= 1% pin)`,
      worstGap < 1e-4,
      `family ${id}: worstGap ${worstGap.toExponential(2)}`
    );
  }
}

// 7. Revenue peak by golden section with |ε| = 1 to < 1e-6 (flat-maximum floor)
{
  let allPeaksUnit = true;
  for (const [id, fam] of Object.entries(families)) {
    if (id === "ces") {
      const pPeak = peakPrice(fam);
      ok("CES family has no interior revenue peak", pPeak === null);
      continue;
    }
    const pPeak = peakPrice(fam);
    const epsAtPeak = pointElasticity(fam, pPeak);
    const gap = Math.abs(epsAtPeak - 1.0);
    if (gap > 1e-6) allPeaksUnit = false;
  }
  ok(
    "revenue peak occurs where |ε| = 1 to < 1e-6 across all bounded families",
    allPeaksUnit
  );
}

// 8. Midpoint formula against point elasticity at midpoint price on the line
{
  const fam = families.lin;
  const rng = mulberry32(20260917);
  let worstRelMid = 0;
  for (let i = 0; i < 5000; i++) {
    const p1 = 2 + rng() * 55;
    const p2 = 2 + rng() * 55;
    if (Math.abs(p2 - p1) < 0.01) continue;
    const q1 = fam.q(p1);
    const q2 = fam.q(p2);
    const midCalc = midpointFormula(p1, q1, p2, q2);
    const pAvg = (p1 + p2) / 2;
    const epsAtAvg = pointElasticity(fam, pAvg);
    const rel = Math.abs(midCalc - epsAtAvg) / epsAtAvg;
    if (rel > worstRelMid) worstRelMid = rel;
  }
  ok(
    "midpoint formula on straight line === point elasticity at midpoint price to < 1e-10",
    worstRelMid < 1e-10,
    `worstRelMid ${worstRelMid.toExponential(2)}`
  );
}

// 9. The reason: mean quantity equals quantity at mean price on line; CES gaps (0.52%, 14.2%, 77.7%)
{
  const famLin = families.lin;
  const famCes = families.ces;
  const rng = mulberry32(20260917);
  let worstLinDiff = 0;
  for (let i = 0; i < 5000; i++) {
    const p1 = 2 + rng() * 55;
    const p2 = 2 + rng() * 55;
    const avgQ = (famLin.q(p1) + famLin.q(p2)) / 2;
    const qAtAvgP = famLin.q((p1 + p2) / 2);
    worstLinDiff = Math.max(worstLinDiff, Math.abs(avgQ - qAtAvgP));
  }
  ok(
    "on straight line, mean(q1, q2) === q(mean(p1, p2)) to < 1e-12",
    worstLinDiff < 1e-12,
    `worstLinDiff ${worstLinDiff.toExponential(2)}`
  );

  // CES gaps at 10%, 50%, 100% price gaps centered around p = 25
  const gapsCes = [
    { pct: 0.1, expected: "0.52" },
    { pct: 0.5, expected: "14.2" },
    { pct: 1.0, expected: "77.7" },
  ];
  let allCesMatch = true;
  for (const g of gapsCes) {
    const p1 = 25 * (1 - g.pct / 2);
    const p2 = 25 * (1 + g.pct / 2);
    const avgQ = (famCes.q(p1) + famCes.q(p2)) / 2;
    const qAtAvgP = famCes.q((p1 + p2) / 2);
    const relGap = ((avgQ - qAtAvgP) / qAtAvgP) * 100;
    const formatted = relGap.toFixed(g.expected.includes(".") ? g.expected.split(".")[1].length : 0);
    if (formatted !== g.expected) allCesMatch = false;
  }
  ok(
    "CES mean quantity gaps match printed precision (0.52%, 14.2%, 77.7%)",
    allCesMatch
  );
}

// 10. Log-difference formula against ε on constant-elasticity family
{
  const fam = families.ces;
  const rng = mulberry32(20260917);
  let worstRelLog = 0;
  for (let i = 0; i < 5000; i++) {
    const p1 = 5 + rng() * 50;
    const p2 = 5 + rng() * 50;
    if (Math.abs(p2 - p1) < 0.05) continue;
    const q1 = fam.q(p1);
    const q2 = fam.q(p2);
    const logCalc = logDifferenceFormula(p1, q1, p2, q2);
    const rel = Math.abs(logCalc - fam.pinEps) / fam.pinEps;
    if (rel > worstRelLog) worstRelLog = rel;
  }
  ok(
    "log-difference formula is exact on constant-elasticity family to < 1e-10",
    worstRelLog < 1e-10,
    `worstRelLog ${worstRelLog.toExponential(2)}`
  );
}

// 11. Drift table: both rows at the 5 gaps at printed precision
{
  const driftExpected = [
    { gap: 0.01, mid: "-0.0013", log: "-0.0005" },
    { gap: 0.10, mid: "-0.1299", log: "-0.0464" },
    { gap: 0.25, mid: "-0.8072", log: "-0.2918" },
    { gap: 0.50, mid: "-3.1663", log: "-1.1975" },
    { gap: 1.00, mid: "-11.7672", log: "-5.3605" },
  ];
  let tableMatch = true;
  for (const d of driftExpected) {
    const p1 = 25 * (1 - d.gap / 2);
    const p2 = 25 * (1 + d.gap / 2);

    // Midpoint on CES (truth 1.6)
    const midVal = midpointFormula(p1, families.ces.q(p1), p2, families.ces.q(p2));
    const midErr = ((midVal - 1.6) / 1.6) * 100;

    // Log on linear line (truth = point eps at midpoint)
    const pMid = (p1 + p2) / 2;
    const trueLinEps = pointElasticity(families.lin, pMid);
    const logVal = logDifferenceFormula(p1, families.lin.q(p1), p2, families.lin.q(p2));
    const logErr = ((logVal - trueLinEps) / trueLinEps) * 100;

    if (midErr.toFixed(4) !== d.mid || logErr.toFixed(4) !== d.log) {
      tableMatch = false;
    }
  }
  ok(
    "drift table matches all 10 entries to 4 decimal places",
    tableMatch
  );
}

// 12. Four two-point answers and exact equalities
{
  const p1 = 20, q1 = 57;
  const p2 = 30, q2 = 33;
  const slope = (q2 - q1) / (p2 - p1); // -2.4

  const ans1 = Math.abs((slope * p1) / q1); // 48/57 = 0.84210526...
  const ans2 = Math.abs((slope * p2) / q2); // 72/33 = 24/11 = 2.18181818...
  const ansMid = midpointFormula(p1, q1, p2, q2); // 4/3 = 1.33333333...
  const ansLog = logDifferenceFormula(p1, q1, p2, q2); // 1.347942635...

  const frac1Match = Math.abs(ans1 - 48 / 57) < 1e-12;
  const frac2Match = Math.abs(ans2 - 24 / 11) < 1e-12;
  const fracMidMatch = Math.abs(ansMid - 4 / 3) < 1e-12;
  const logMatch = Math.abs(ansLog - 1.347942635) < 1e-8;

  // Midpoint answer === line at p = 25
  const lineAt25 = Math.abs((slope * 25) / (57 + slope * (25 - 20)));
  const midEqLine = Math.abs(ansMid - lineAt25) < 1e-12;

  // Log answer === CES exponent
  const cesExponent = (Math.log(q1) - Math.log(q2)) / (Math.log(p2) - Math.log(p1));
  const logEqCes = Math.abs(ansLog - cesExponent) < 1e-12;

  ok(
    "two-point answers: 48/57 (0.842), 24/11 (2.182), 4/3 (1.333), and log (1.348) match exact values",
    frac1Match && frac2Match && fracMidMatch && logMatch && midEqLine && logEqCes
  );
}

// 13. Scale invariance: elasticity under unit rescaling is bit-for-bit identical (===), slope is not
{
  const fam = families.lin;
  const p = 25;
  const epsOriginal = pointElasticity(fam, p);
  const slopeOriginal = fam.dq(p);

  // Rescale: price in cents (p * 100), quantity in grams (q * 10)
  // q_new(p_cents) = 10 * q(p_cents / 100)
  // dq_new / dp_cents = (10 / 100) * dq / dp = 0.1 * slopeOriginal
  const pCents = p * 100;
  const qGrams = fam.q(p) * 10;
  const slopeRescaled = slopeOriginal * 0.1;
  const epsRescaled = Math.abs((slopeRescaled * pCents) / qGrams);

  ok(
    "rescaling units changes slope by 10x while elasticity is bit-for-bit identical (===)",
    epsOriginal === epsRescaled && slopeOriginal !== slopeRescaled,
    `epsOriginal === epsRescaled: ${epsOriginal === epsRescaled}`
  );
}

console.log(`\nResults: ${pass} passed, ${fails.length} failed`);
if (fails.length > 0) {
  process.exit(1);
}
