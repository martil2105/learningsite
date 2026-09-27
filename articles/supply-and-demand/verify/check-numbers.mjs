/*
  verify/check-numbers.mjs for supply-and-demand
  Re-derives all claims and numbers from the article's own src/ modules.
*/
import {
  A,
  B,
  C,
  S,
  p0,
  q0,
  clearMarket,
  closedEquilibrium,
  populationMoments,
  flatShare,
  demandBracket,
  solveAdmissibleMarket,
  sampleMoments,
} from "../src/market.js";
import { mulberry32, gaussian } from "../src/rng.js";

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

console.log("=== supply-and-demand: number verification ===");

// 1. Base market
ok("the base market equilibrium is p0 = 20, q0 = 60 exactly", p0 === 20 && q0 === 60);

// 2. Clearing solver vs closed-form equilibrium
{
  let worstP = 0, worstQ = 0;
  for (let u = -30; u <= 30; u += 5) {
    for (let v = -30; v <= 30; v += 5) {
      const num = clearMarket(u, v);
      const exact = closedEquilibrium(u, v);
      worstP = Math.max(worstP, Math.abs(num.p - exact.p));
      worstQ = Math.max(worstQ, Math.abs(num.q - exact.q));
    }
  }
  ok(
    "clearing solver by excess-demand bisection matches closed form to < 1e-12",
    worstP < 1e-12 && worstQ < 1e-12,
    `worstP ${worstP.toExponential(2)}, worstQ ${worstQ.toExponential(2)}`
  );
}

// 3. Claims 1 & 2: Supply-only shocks trace demand, demand-only shocks trace supply
{
  const rand = mulberry32(20260917);
  // Case A: supply-only shocks (td = 0, ts = 10) -> points lie on demand curve
  let nearD = 0, farS = 0;
  for (let i = 0; i < 10000; i++) {
    const u = 0;
    const v = 10 * gaussian(rand);
    const { p, q } = clearMarket(u, v);
    const distDemand = Math.abs(q - (A - B * p));
    const distSupply = Math.abs(q - (C + S * p));
    nearD = Math.max(nearD, distDemand);
    farS = Math.max(farS, distSupply);
  }
  ok(
    "claim 1: supply-only shocks put every point on demand (< 1e-12) and far from supply (> 10)",
    nearD < 1e-12 && farS > 10,
    `on demand: ${nearD.toExponential(2)}, off supply: ${farS.toFixed(1)}`
  );

  // Case B: demand-only shocks (td = 10, ts = 0) -> points lie on supply curve
  let nearS = 0, farD = 0;
  for (let i = 0; i < 10000; i++) {
    const u = 10 * gaussian(rand);
    const v = 0;
    const { p, q } = clearMarket(u, v);
    const distDemand = Math.abs(q - (A - B * p));
    const distSupply = Math.abs(q - (C + S * p));
    nearS = Math.max(nearS, distSupply);
    farD = Math.max(farD, distDemand);
  }
  ok(
    "claim 2: demand-only shocks put every point on supply (< 1e-12) and far from demand (> 10)",
    nearS < 1e-12 && farD > 10,
    `on supply: ${nearS.toExponential(2)}, off demand: ${farD.toFixed(1)}`
  );
}

// 4. Slope identity: covariance algebra vs convex combination
{
  const rand = mulberry32(424242);
  let worst = 0, worstRatio = 0, worstBias = 0;
  const nDraws = 200000;
  for (let i = 0; i < nDraws; i++) {
    const b = 0.2 + 5 * rand();
    const s = 0.2 + 5 * rand();
    const td2 = 0.02 + 4 * rand();
    const ts2 = 0.02 + 4 * rand();
    const D = b + s;
    const cov = (s * td2 - b * ts2) / (D * D);
    const vp = (td2 + ts2) / (D * D);
    const slopeCov = cov / vp;
    const w = td2 / (td2 + ts2);
    const slopeComb = w * s - (1 - w) * b;

    worst = Math.max(worst, Math.abs(slopeCov - slopeComb));
    worstRatio = Math.max(
      worstRatio,
      Math.abs(td2 / ts2 - (slopeComb + b) / (s - slopeComb)) / (td2 / ts2)
    );
    worstBias = Math.max(worstBias, Math.abs(slopeComb + b - w * (b + s)));
  }
  ok(
    `claim 3: fitted slope is w·S − (1−w)·B over ${nDraws} random markets (< 1e-12)`,
    worst < 1e-12,
    worst.toExponential(3)
  );
  ok(
    "the fitted line divides [−B, S] in the exact ratio of shock variances τd²/τs² (< 1e-12)",
    worstRatio < 1e-12,
    worstRatio.toExponential(3)
  );
  ok(
    "the bias for the demand slope is exactly w·(B+S) (< 1e-12)",
    worstBias < 1e-12,
    worstBias.toExponential(3)
  );
}

// 5. Flat cloud at w* = B / (B + S) = 0.6
{
  const wStar = flatShare();
  const popFlat = populationMoments(wStar * 100, (1 - wStar) * 100);
  ok(
    "claim 4: cloud is flat at w* = B/(B+S) = 0.60 exactly with slope 0 (< 1e-12)",
    wStar === 0.6 && Math.abs(popFlat.slope) < 1e-12,
    `wStar ${wStar}, slope ${popFlat.slope.toExponential(2)}`
  );
}

// 6. R² at the ends is 1 with ===, and 0 at w* to < 1e-12
{
  const popEnd0 = populationMoments(0, 100);
  const popEnd1 = populationMoments(100, 0);
  const popMid = populationMoments(flatShare() * 100, (1 - flatShare()) * 100);
  ok(
    "claim 5: R² is exactly 1 at w=0 and w=1, and 0 at w* (< 1e-12)",
    popEnd0.r2 === 1 && popEnd1.r2 === 1 && Math.abs(popMid.r2) < 1e-12
  );
}

// 7. Headline Identity: bracket ratio B_hi / B_lo = 1 / R² exactly
{
  const rand = mulberry32(77001);
  let worstRel = 0, inside = 0, count = 0, minSlack = Infinity;
  const totalMarkets = 200000;
  for (let i = 0; i < totalMarkets; i++) {
    const b = 0.2 + 5 * rand();
    const s = 0.2 + 5 * rand();
    const td2 = 0.02 + 4 * rand();
    const ts2 = 0.02 + 4 * rand();
    const D = b + s;
    const vp = (td2 + ts2) / (D * D);
    const vq = (s * s * td2 + b * b * ts2) / (D * D);
    const cov = (s * td2 - b * ts2) / (D * D);
    if (cov >= -1e-12) continue; // downward-sloping only

    const br = demandBracket(vp, vq, cov);
    worstRel = Math.max(worstRel, Math.abs(br.ratio - br.invR2) / br.invR2);
    if (b >= br.Blo - 1e-9 && b <= br.Bhi + 1e-9) inside++;
    minSlack = Math.min(minSlack, Math.min(b - br.Blo, br.Bhi - b) / b);
    count++;
  }
  ok(
    `claim 6: bracket ratio B_hi/B_lo equals 1/R² over ${count} downward-sloping markets (< 1e-12)`,
    worstRel < 1e-12,
    worstRel.toExponential(3)
  );
  ok(
    `the true demand slope lies inside the bracket in all ${count}/${count} markets`,
    inside === count,
    `slack: ${minSlack.toExponential(2)}`
  );
}

// 8. Worked case moments and admissible family
{
  const popWorked = populationMoments(35, 65);
  ok(
    "worked case: Var(p)=4, Var(q)=29, Cov=−5, slope=−1.25, R²=0.215517...",
    popWorked.vp === 4 &&
      popWorked.vq === 29 &&
      popWorked.cov === -5 &&
      Math.abs(popWorked.slope - (-1.25)) < 1e-12 &&
      Math.abs(popWorked.r2 - 25 / 116) < 1e-12
  );

  const brWorked = demandBracket(popWorked.vp, popWorked.vq, popWorked.cov);
  ok(
    "worked case bracket: Blo = 1.25, Bhi = 5.80, ratio = 4.64, 1/R² = 4.64",
    brWorked.Blo === 1.25 &&
      brWorked.Bhi === 5.8 &&
      Math.abs(brWorked.ratio - 4.64) < 1e-12 &&
      Math.abs(brWorked.invR2 - 4.64) < 1e-12
  );

  let worstRep = 0;
  for (const testB of [1.5, 2.0, 2.5, 3.0, 4.0]) {
    const adm = solveAdmissibleMarket(testB, popWorked);
    const m = populationMoments(adm.td2, adm.ts2, { A, B: adm.b, C, S: adm.s });
    worstRep = Math.max(
      worstRep,
      Math.abs(m.vp - popWorked.vp),
      Math.abs(m.vq - popWorked.vq),
      Math.abs(m.cov - popWorked.cov)
    );
  }
  ok(
    "five different markets reproduce all three moments of the worked case to < 1e-12",
    worstRep < 1e-12,
    worstRep.toExponential(3)
  );
}

// 9. Supply shifter recovers demand slope while naive OLS has wrong sign
{
  const g = 4;
  // Noise-free two-point route across two states of supply shifter z in {0, 1}
  const pA = (A - C - g * 0) / (B + S);
  const pB = (A - C - g * 1) / (B + S);
  const qA = A - B * pA;
  const qB = A - B * pB;
  const twoPointSlope = (qB - qA) / (pB - pA);
  ok(
    "claim 7: noise-free supply shifter recovers true demand slope −3.0 (< 1e-12)",
    Math.abs(twoPointSlope - (-B)) < 1e-12,
    `slope: ${twoPointSlope}`
  );

  // Naive OLS on simulated shifter market matching plan-probes (td=10, ts=4, g=4)
  const rand = mulberry32(5150);
  const pts = [];
  for (let i = 0; i < 50000; i++) {
    const z = gaussian(rand);
    const u = 10 * gaussian(rand);
    const v = 4 * gaussian(rand);
    const { p, q } = clearMarket(u, g * z + v);
    pts.push({ p, q });
  }
  const naive = sampleMoments(pts);
  ok(
    "while naive OLS on the same market returns a POSITIVE slope (wrong sign)",
    naive.slope > 0,
    `OLS slope: +${naive.slope.toFixed(4)}`
  );
}

console.log(`\nALL ${pass} CHECKS PASS (${fails.length} failures)`);
if (fails.length > 0) {
  process.exit(1);
}
