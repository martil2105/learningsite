/*
  verify/check-numbers.mjs for cost-curves (Mi7)
  Re-derives all claims and numbers from the article's own src/ modules.
*/
import {
  f,
  r,
  w,
  C,
  SRAC,
  SRMC,
  kStar,
  LRAC,
  LRMC,
  qMin,
  minLRAC,
  qTangency,
  qCheapest,
  tangencyRatio,
  plantPenalty,
  CFlat,
  ACFlat,
  gmin,
} from "../src/cost.js";

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

console.log("=== cost-curves (Mi7): number verification ===");

// 1. Lower envelope via blind minimisation over plant size
{
  let worst = 0;
  for (let i = 1; i <= 600; i++) {
    const q = 0.2 * i;
    const kn = gmin((k) => C(q, k), 1e-6, 1e7);
    worst = Math.max(worst, Math.abs(SRAC(q, kn) - LRAC(q)) / LRAC(q));
  }
  ok(
    "the long-run curve is the lower envelope: blind minimisation over plant size reproduces it",
    worst < 1e-12,
    worst.toExponential(3) + " over 600 outputs"
  );
}

// 2. Minimum scale and equality of average and marginal cost
ok(
  "at the long-run minimum (q = 21.5443) average and marginal cost are equal, at 13.9248",
  Math.abs(qMin - 21.544346900318846) < 1e-9 &&
    Math.abs(LRAC(qMin) - LRMC(qMin)) < 1e-12 &&
    Math.abs(LRAC(qMin) - 13.924766500838334) < 1e-9
);

// 3. Plant at long-run minimum equals fixed cost exactly
ok(
  "and the plant that serves it costs exactly the fixed cost: k*(q_min) === f",
  Math.abs(kStar(qMin) - f) < 1e-9,
  kStar(qMin).toFixed(12)
);

// 4. THE IDENTITY: tangency output over cheapest scale
{
  let wB = 0;
  let wC = 0;
  for (let i = 1; i <= 400; i++) {
    const k = 2 + i * 8;
    const closed = tangencyRatio(k);
    const qMblind = gmin((q) => SRAC(q, k), 1e-6, 1e6);
    wB = Math.max(wB, Math.abs(qTangency(k) / qMblind - closed) / closed);
    wC = Math.max(wC, Math.abs(qTangency(k) / qCheapest(k) - closed) / closed);
  }
  ok(
    "THE IDENTITY: tangency output over the plant's own cheapest output = (2k/(f+k))^(1/3)",
    wB < 1e-6,
    "blind minimisation " + wB.toExponential(3) + " — the flat-maximum floor"
  );
  ok(
    "the same identity from the closed-form SRAC minimum, sharing no search",
    wC < 1e-12,
    wC.toExponential(3)
  );
}

// 5. Quoted ratios at key plant sizes
{
  const testK = [25, 50, 100, 200, 400, 1600];
  const expected = [0.736806, 0.87358, 1.0, 1.100642, 1.169607, 1.234716];
  const computed = testK.map((k) => qTangency(k) / qCheapest(k));
  ok(
    "the quoted ratios 0.7368, 0.8736, 1.0000, 1.1006, 1.1696, 1.2347",
    expected.every((v, i) => Math.abs(computed[i] - v) < 5e-6)
  );
  ok(
    "the ratio is exactly 1 when the plant costs the fixed cost, and only then",
    Math.abs(qTangency(f) / qCheapest(f) - 1) < 1e-12 &&
      qTangency(50) / qCheapest(50) < 1 &&
      qTangency(200) / qCheapest(200) > 1
  );
}

// 6. Envelope theorem: marginal curves cross at tangency
{
  let worst = 0;
  for (let i = 1; i <= 400; i++) {
    const q = 0.5 + i * 0.5;
    const k = kStar(q);
    worst = Math.max(worst, Math.abs(SRMC(q, k) - LRMC(q)) / LRMC(q));
  }
  ok(
    "at the tangency the MARGINAL curves cross, minimum or no minimum (the envelope theorem)",
    worst < 1e-12,
    worst.toExponential(3)
  );
}

// 7. Output q = 50: chosen plant's cheapest scale is 43.12
{
  const k50 = kStar(50);
  const qCheap50 = qCheapest(k50);
  ok(
    "at q = 50 the chosen plant's own cheapest output is 43.12, and it is still the right plant",
    Math.abs(qCheap50 - 43.1206) < 1e-3,
    "cheapest: " + qCheap50.toFixed(4)
  );
}

// 8. Cost elasticity: MC / AC is d ln C / d ln q
{
  let worst = 0;
  const lc = (q) => f + 2 * Math.sqrt(w * r) * Math.pow(q, 1.5);
  for (let i = 1; i <= 500; i++) {
    const q = 0.3 + i * 0.3;
    const h = q * 1e-6;
    const el =
      (Math.log(lc(q + h)) - Math.log(lc(q - h))) /
      (Math.log(q + h) - Math.log(q - h));
    const ratio = LRMC(q) / (lc(q) / q);
    worst = Math.max(worst, Math.abs(el - ratio) / ratio);
  }
  ok(
    "marginal over average cost IS the elasticity of cost with respect to output",
    worst < 1e-7,
    worst.toExponential(3) + " by central difference"
  );
}

// 9. Second-order plant penalties
{
  const expectedPen = [
    [0.01, 0.0000434],
    [0.05, 0.001043],
    [0.1, 0.0039823],
    [0.2, 0.0146017],
    [0.5, 0.0730084],
  ];
  ok(
    "the quoted penalties 0.0043%, 0.1043%, 0.3982%, 1.4602%, 7.3008%",
    expectedPen.every(([e, v]) => Math.abs(plantPenalty(e) - v) < 1e-6)
  );

  const dbl = [0.0005, 0.001, 0.002, 0.005].map(
    (e) => plantPenalty(2 * e) / plantPenalty(e)
  );
  ok(
    "and the penalty is second order: halving the plant error quarters the penalty",
    dbl.every((r) => Math.abs(r - 4) < 0.02),
    dbl.map((r) => r.toFixed(4)).join(", ")
  );
}

// 10. Constant MC gives no minimum average cost
{
  let dec = true;
  for (let q = 1; q < 10000; q += 1) {
    if (!(ACFlat(q + 1) < ACFlat(q))) dec = false;
  }
  ok(
    "a fixed cost with constant marginal cost gives no minimum at any scale — the U needs both",
    dec
  );
}

if (fails.length === 0) {
  console.log(`\nALL ${pass} CHECKS PASS (0 failures)`);
} else {
  console.log(`\nCHECKS FAILED: ${fails.length} failures out of ${pass + fails.length}`);
  process.exit(1);
}
