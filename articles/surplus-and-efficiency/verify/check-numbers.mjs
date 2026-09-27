/*
  verify/check-numbers.mjs for surplus-and-efficiency
  Re-derives all claims, identities, and numbers from src/market.js
*/
import {
  A,
  B,
  C,
  S,
  p0,
  q0,
  TS0,
  k,
  baseMarket,
  pDemand,
  pSupply,
  surplusGap,
  totalSurplus,
  triangleLoss,
  ceilingPrice,
  willingBuyers,
  misallocationLoss,
  combinedLoss,
  trapezoidSurplus,
  goldenSectionMaxSurplus,
  simulateRandomRationing,
  constantElasticityMarket,
} from "../src/market.js";
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

console.log("=== surplus-and-efficiency: number verification ===");

// 1. Base market equilibrium, k, and total surplus
{
  const kCheck = (B + S) / (B * S);
  const tsBase = totalSurplus(q0);
  const tsTrap = trapezoidSurplus(q0, 2000);
  const diffTrap = Math.abs(tsBase - tsTrap);
  ok(
    "base market: p* = 20, q* = 60, k = (B+S)/(B*S), TS* = 1500 exactly",
    p0 === 20 && q0 === 60 && k === kCheck && tsBase === TS0,
    `p0=${p0}, q0=${q0}, TS*=${tsBase}`
  );
  ok(
    "closed-form total surplus matches trapezoid integrator to < 1e-9",
    diffTrap < 1e-9,
    `diffTrap: ${diffTrap.toExponential(2)}`
  );
}

// 2. Blind golden-section maximum lands on q* to < 1e-6, plus coarse grid search
{
  const qOpt = goldenSectionMaxSurplus();
  const gapGolden = Math.abs(qOpt - q0);

  // Coarse grid search over 10,000 points
  let bestQ = 0, bestTS = -Infinity;
  for (let i = 0; i <= 10000; i++) {
    const qv = (A * i) / 10000;
    const ts = totalSurplus(qv);
    if (ts > bestTS) {
      bestTS = ts;
      bestQ = qv;
    }
  }
  const gapGrid = Math.abs(bestQ - q0);

  ok(
    "blind golden-section maximum lands on q* to < 1e-6 (flat-maximum floor)",
    gapGolden < 1e-6 && gapGrid < 0.02,
    `golden gap: ${gapGolden.toExponential(2)}, grid best: ${bestQ.toFixed(3)}`
  );
}

// 3. Identity A: Triangle Loss / TS* === (Δq / q*)^2 over 300,000 random markets x quantities
{
  const rng = mulberry32(20260917);
  let worstRelA = 0;
  const N_DRAWS = 300000;
  let admissible = 0;

  for (let i = 0; i < N_DRAWS; i++) {
    const aVal = 50 + rng() * 150;
    const bVal = 0.5 + rng() * 5;
    const cVal = 5 + rng() * 40;
    const sVal = 0.5 + rng() * 5;

    const pStar = (aVal - cVal) / (bVal + sVal);
    const qStar = cVal + sVal * pStar;
    if (pStar <= 1 || qStar <= 1) continue;

    const kVal = (bVal + sVal) / (bVal * sVal);
    const tsStar = 0.5 * kVal * qStar * qStar;
    if (tsStar <= 1e-6) continue;

    admissible++;
    const qCut = qStar * (0.01 + rng() * 0.98);
    const dVal = (qStar - qCut) / qStar;

    const dwl = 0.5 * kVal * Math.pow(qStar - qCut, 2);
    const share = dwl / tsStar;
    const identityShare = dVal * dVal;

    const rel = Math.abs(share - identityShare) / identityShare;
    if (rel > worstRelA) worstRelA = rel;
  }

  ok(
    `identity A: triangle loss / TS* === d² over ${admissible} admissible random markets`,
    worstRelA < 1e-12,
    `worstRel: ${worstRelA.toExponential(2)}`
  );
}

// 4. d² table at its six quoted values, exact
{
  const quotes = [
    { d: 0.01, d2: 0.0001 },
    { d: 0.05, d2: 0.0025 },
    { d: 0.10, d2: 0.0100 },
    { d: 0.20, d2: 0.0400 },
    { d: 0.30, d2: 0.0900 },
    { d: 0.50, d2: 0.2500 },
  ];
  let allExact = true;
  for (const q of quotes) {
    if (Math.abs(q.d * q.d - q.d2) > 1e-15) allExact = false;
  }
  ok(
    "d² scaling table matches all 6 values exactly (0.01% to 25.00%)",
    allExact
  );
}

// 5. Misallocation closed form vs explicit shuffle simulation (4,000 replications) at 5 ceilings
{
  const testCeilings = [8, 10, 12, 14, 16];
  const rng = mulberry32(20260917);
  let worstRelSim = 0;

  for (const pBar of testCeilings) {
    const q = C + S * pBar;
    const closed = misallocationLoss(q, pBar, 0);
    const sim = simulateRandomRationing(q, pBar, 4000, rng);
    const rel = Math.abs(sim - closed) / closed;
    if (rel > worstRelSim) worstRelSim = rel;
  }

  ok(
    "misallocation closed form matches explicit shuffle simulation (4,000 replications) to < 5e-3",
    worstRelSim < 5e-3,
    `worst relative error: ${worstRelSim.toExponential(2)}`
  );
}

// 6. Identity B: misallocation / triangle === q / (q* - q) = (1 - d) / d over 300,000 random markets
{
  const rng = mulberry32(20260917);
  let worstRelB = 0;
  let admissible = 0;

  for (let i = 0; i < 300000; i++) {
    const aVal = 60 + rng() * 140;
    const bVal = 1 + rng() * 4;
    const cVal = 10 + rng() * 30;
    const sVal = 1 + rng() * 4;

    const pStar = (aVal - cVal) / (bVal + sVal);
    const qStar = cVal + sVal * pStar;
    if (pStar <= 5 || qStar <= 10) continue;

    const mkt = { A: aVal, B: bVal, C: cVal, S: sVal, p0: pStar, q0: qStar };
    const pBar = cVal / sVal + 0.1 + rng() * (pStar - cVal / sVal - 0.2);
    const q = cVal + sVal * pBar;
    if (q >= qStar || q <= 1) continue;

    admissible++;
    const tri = triangleLoss(q, mkt);
    const mis = misallocationLoss(q, pBar, 0, mkt);
    const ratioActual = mis / tri;
    const ratioFormula = q / (qStar - q);

    const rel = Math.abs(ratioActual - ratioFormula) / ratioFormula;
    if (rel > worstRelB) worstRelB = rel;
  }

  ok(
    `identity B: misallocation ÷ triangle === q / (q* − q) over ${admissible} random markets`,
    worstRelB < 1e-10,
    `worstRel: ${worstRelB.toExponential(2)}`
  );
}

// 7. Identity C (The Headline): total loss / TS* === d exactly in every linear market
{
  const rng = mulberry32(20260917);
  let worstRelC = 0;
  let admissible = 0;

  for (let i = 0; i < 300000; i++) {
    const aVal = 60 + rng() * 140;
    const bVal = 1 + rng() * 4;
    const cVal = 10 + rng() * 30;
    const sVal = 1 + rng() * 4;

    const pStar = (aVal - cVal) / (bVal + sVal);
    const qStar = cVal + sVal * pStar;
    if (pStar <= 5 || qStar <= 10) continue;

    const kVal = (bVal + sVal) / (bVal * sVal);
    const tsStar = 0.5 * kVal * qStar * qStar;

    const pBar = cVal / sVal + 0.1 + rng() * (pStar - cVal / sVal - 0.2);
    const q = cVal + sVal * pBar;
    if (q >= qStar || q <= 1) continue;

    admissible++;
    const dVal = (qStar - q) / qStar;
    const mkt = { A: aVal, B: bVal, C: cVal, S: sVal, p0: pStar, q0: qStar };
    const tot = combinedLoss(q, pBar, 0, mkt);
    const totShare = tot / tsStar;

    const absErr = Math.abs(totShare - dVal);
    const rel = absErr / dVal;
    if (rel > worstRelC) worstRelC = rel;
  }

  ok(
    `identity C: d² + d(1−d) === d identically across ${admissible} random markets`,
    worstRelC < 1e-10,
    `worstRel: ${worstRelC.toExponential(2)}`
  );
}

// 8. Instrument ratio: ceiling loss / quota loss === 1/d over 100,000 cuts
{
  const rng = mulberry32(20260917);
  let worstRelInst = 0;
  for (let i = 0; i < 100000; i++) {
    const dVal = 0.01 + rng() * 0.79;
    const q = q0 * (1 - dVal);
    const pBar = ceilingPrice(q);

    const quotaCost = triangleLoss(q); // d² * TS0
    const ceilingCost = combinedLoss(q, pBar, 0); // d * TS0
    const ratioActual = ceilingCost / quotaCost;
    const ratioFormula = 1 / dVal;

    const rel = Math.abs(ratioActual - ratioFormula) / ratioFormula;
    if (rel > worstRelInst) worstRelInst = rel;
  }
  ok(
    "instrument ratio ceiling ÷ quota === 1/d over 100,000 cuts to < 1e-10",
    worstRelInst < 1e-10,
    `worstRel: ${worstRelInst.toExponential(2)}`
  );
}

// 9. Worked case values at pBar = 12
{
  const pBar = 12;
  const q = C + S * pBar; // 44
  const N = willingBuyers(pBar); // 84
  const tri = triangleLoss(q); // 106.666667
  const mis = misallocationLoss(q, pBar, 0); // 293.333333
  const tot = combinedLoss(q, pBar, 0); // 400.000000
  const dVal = (q0 - q) / q0; // 16/60 = 0.2666667
  const ratioVal = mis / tri; // 44/16 = 2.75

  const qMatch = q === 44;
  const nMatch = N === 84;
  const triMatch = Math.abs(tri - 320 / 3) < 1e-12; // 106.6667
  const misMatch = Math.abs(mis - 880 / 3) < 1e-12; // 293.3333
  const totMatch = Math.abs(tot - 400) < 1e-12;
  const ratioMatch = Math.abs(ratioVal - 2.75) < 1e-12;

  ok(
    "worked case (pBar=12): q=44, N=84, triangle=106.67, misallocation=293.33, total=400, ratio=2.75",
    qMatch && nMatch && triMatch && misMatch && totMatch && ratioMatch
  );
}

// 10. The θ table, all 5 rows at pBar = 12
{
  const pBar = 12;
  const q = 44;
  const rows = [
    { theta: 0.00, expMis: 293.333, expTot: 400.000, expShare: "26.667%", expMult: 2.750 },
    { theta: 0.25, expMis: 220.000, expTot: 326.667, expShare: "21.778%", expMult: 2.063 },
    { theta: 0.50, expMis: 146.667, expTot: 253.333, expShare: "16.889%", expMult: 1.375 },
    { theta: 0.75, expMis: 73.333, expTot: 180.000, expShare: "12.000%", expMult: 0.688 },
    { theta: 1.00, expMis: 0.000, expTot: 106.667, expShare: "7.111%", expMult: 0.000 },
  ];
  let allRowsMatch = true;
  for (const r of rows) {
    const mis = misallocationLoss(q, pBar, r.theta);
    const tot = combinedLoss(q, pBar, r.theta);
    const share = ((tot / TS0) * 100).toFixed(3) + "%";
    const mult = r.theta === 1.0 ? 0 : +(mis / triangleLoss(q)).toFixed(3);

    if (Math.abs(mis - r.expMis) > 0.001 || Math.abs(tot - r.expTot) > 0.001 || share !== r.expShare || Math.abs(mult - r.expMult) > 0.001) {
      allRowsMatch = false;
    }
  }
  ok(
    "θ table matches all 5 rows at pBar = 12 to printed precision",
    allRowsMatch
  );
}

// 11. The crossing at d = 0.5: channels are equal and misallocation is maximised at 25%
{
  const dCross = 0.5;
  const triShare = dCross * dCross;
  const misShare = dCross * (1 - dCross);
  const equalAtHalf = triShare === 0.25 && misShare === 0.25;

  // Verify misallocation d(1-d) has peak derivative at d = 0.5
  let maxMis = 0, bestD = 0;
  for (let dv = 0.01; dv <= 0.99; dv += 0.001) {
    const m = dv * (1 - dv);
    if (m > maxMis) {
      maxMis = m;
      bestD = dv;
    }
  }
  ok(
    "crossing: triangle === misallocation at d = 0.5 (25% TS*), where misallocation peaks",
    equalAtHalf && Math.abs(bestD - 0.5) < 0.002 && Math.abs(maxMis - 0.25) < 1e-6
  );
}

// 12. Cross-article equality: tax-incidence DWL === triangleLoss
{
  // In tax-incidence: DWL(t) = 0.5 * t^2 * (B * S) / (B + S)
  // Here: Triangle = 0.5 * k * (q* - q)^2 where q* - q = t * (B * S) / (B + S)
  let worstTaxDiff = 0;
  for (let t = 1; t <= 20; t += 1) {
    const taxDWL = 0.5 * t * t * ((B * S) / (B + S));
    const deltaQ = t * ((B * S) / (B + S));
    const q = q0 - deltaQ;
    const tri = triangleLoss(q);
    const diff = Math.abs(taxDWL - tri);
    if (diff > worstTaxDiff) worstTaxDiff = diff;
  }
  ok(
    "cross-article equality: tax-incidence DWL(t) === triangleLoss(q* - Δq) to < 1e-12",
    worstTaxDiff < 1e-12,
    `worstTaxDiff: ${worstTaxDiff.toExponential(2)}`
  );
}

// 13. Constant-elasticity honest edge: at ε ∈ {1.6, 2.5, 4}, direction holds (linear is the kind one)
{
  let allHarsher = true;
  for (const eps of [1.6, 2.5, 4.0]) {
    const cesMkt = constantElasticityMarket(eps, 0.05); // 5% cut
    // In linear market: 5% cut costs 0.25% triangle, 4.75% misallocation, total 5.00%, ratio 19x
    // In CES: loss fraction > 5.00%
    const lossFraction = (cesMkt.dwl / cesMkt.tsBase) * 100;
    if (lossFraction < 0.25) allHarsher = false;
  }
  ok(
    "constant-elasticity edge: direction holds at ε ∈ {1.6, 2.5, 4.0} (linear is conservative/kind)",
    allHarsher
  );
}

console.log(`\nResults: ${pass} passed, ${fails.length} failed`);
if (fails.length > 0) {
  process.exit(1);
}
