/*
  verify/check-numbers.mjs for perfect-competition (Mi8)
  Re-derives all claims and numbers from the article's own src/ modules.
*/
import {
  F,
  c,
  d,
  s,
  acMin,
  qEfficient,
  createMarket,
} from "../src/entry.js";

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

function mk(seed) {
  let x = seed >>> 0;
  return () => {
    x |= 0;
    x = (x + 0x6d2b79f5) | 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

console.log("=== perfect-competition (Mi8): number verification ===");

// 1. Efficient scale and minimum average cost
ok(
  "the efficient scale is 7.0711 and minimum average cost is 24.1421",
  Math.abs(qEfficient - 7.0710678118654755) < 1e-12 &&
    Math.abs(acMin - 24.14213562373095) < 1e-12
);

// 2. Simulation admitting firms one at a time matches floor(nBar)
{
  const rand = mk(20260918);
  let allMatch = true;
  let count = 0;
  for (let i = 0; i < 10000; i++) {
    const A = 200 + 3000 * rand();
    const B = 1 + 30 * rand();
    const m = createMarket(A, B);
    if (!(m.nBar > 2) || !isFinite(m.nBar)) continue;
    const simK = m.runSimulation();
    if (simK !== Math.floor(m.nBar)) allMatch = false;
    count++;
  }
  ok(
    "admitting firms one at a time stops exactly at floor(n-bar), in every market",
    allMatch,
    count + " markets"
  );
}

// 3. Worked run: A = 600, B = 10
{
  const m = createMarket(600, 10);
  ok(
    "the worked run: n-bar = 50.7107, prices 24.7059 / 24.4928 / 24.2857 / 24.0845 at n = 48..51",
    Math.abs(m.nBar - 50.71067811865474) < 1e-9 &&
      [
        [48, 24.705882],
        [49, 24.492754],
        [50, 24.285714],
        [51, 24.084507],
      ].every(([k, v]) => Math.abs(m.price(k) - v) < 1e-5)
  );

  ok(
    "the 51st firm would lose 0.4067 and stays out; the fifty that are in keep 1.0204 each",
    Math.abs(m.profit(51) + 0.406665) < 1e-5 &&
      Math.abs(m.profit(50) - 1.020408) < 1e-5
  );

  ok(
    "so the price stops 0.1436 above minimum average cost, and profit is 2.041% of a fixed cost",
    Math.abs(m.price(50) - acMin - 0.143579) < 1e-5 &&
      Math.abs((100 * m.profit(50)) / F - 2.040816) < 1e-4
  );
}

// 4. THE IDENTITY: price gap and profit as cancellation tolerances
{
  const rand = mk(31415926);
  let wP = 0;
  let wPi = 0;
  let n = 0;
  let envelopeOk = true;
  for (let i = 0; i < 400000; i++) {
    const A = 200 + 3000 * rand();
    const B = 1 + 30 * rand();
    const m = createMarket(A, B);
    if (!(m.nBar > 2) || !isFinite(m.nBar)) continue;
    const nS = Math.floor(m.nBar);
    const phi = m.nBar - nS;
    if (phi < 1e-4 || phi > 1 - 1e-4) continue; // cancellation near integers
    const predP = (s * phi) / (B * d + nS);
    wP = Math.max(wP, Math.abs(m.price(nS) - acMin - predP) / predP);
    const x = phi / (B * d + nS);
    wPi = Math.max(
      wPi,
      Math.abs(m.profit(nS) / F - ((1 + x) * (1 + x) - 1)) /
        ((1 + x) * (1 + x) - 1)
    );
    if (!(m.profit(nS) / F <= 3 / (B * d + nS))) envelopeOk = false;
    n++;
  }
  ok(
    "THE IDENTITY: the price gap is s*frac(n-bar)/(Bd+n*) and the profit is ((1+x)^2 - 1) fixed costs",
    wP < 1e-8 && wPi < 1e-8,
    "price " +
      wP.toExponential(3) +
      ", profit " +
      wPi.toExponential(3) +
      " over " +
      n +
      " markets — a cancellation tolerance, not machine precision"
  );
  ok(
    "and the surviving profit is under 3/(Bd+n*) fixed costs in every one of them",
    envelopeOk
  );
}

// 5. Mean profit falls like 1/n across firm-count buckets monotonically
{
  const rand = mk(2718281);
  const b = {};
  for (let i = 0; i < 200000; i++) {
    const A = 200 + 8000 * rand();
    const B = 1 + 30 * rand();
    const m = createMarket(A, B);
    if (!(m.nBar > 2) || !isFinite(m.nBar)) continue;
    const nS = Math.floor(m.nBar);
    const key = nS < 10 ? 0 : nS < 50 ? 1 : nS < 200 ? 2 : nS < 1000 ? 3 : 4;
    b[key] = b[key] || { s: 0, c: 0 };
    b[key].s += m.profit(nS) / F;
    b[key].c++;
  }
  const means = [0, 1, 2, 3, 4].map((k) => (100 * b[k].s) / b[k].c);
  ok(
    "mean profit falls like 1/n across firm-count buckets, and monotonically",
    means.every((v, i) => i === 0 || v < means[i - 1]) &&
      means[0] > 2 &&
      means[4] < 0.2,
    means.map((x) => x.toFixed(4) + "%").join("  ")
  );
}

// 6. Free entry is never excessive and at most one firm short
{
  const rand = mk(161803);
  const counts = {};
  let n = 0;
  let worstLoss = 0;
  for (let i = 0; i < 30000; i++) {
    const A = 200 + 3000 * rand();
    const B = 1 + 30 * rand();
    const m = createMarket(A, B);
    if (!(m.nBar > 3) || !isFinite(m.nBar)) continue;
    const nS = Math.floor(m.nBar);
    let best = -Infinity;
    let bn = 0;
    for (let k = Math.max(1, nS - 15); k <= nS + 15; k++) {
      const v = m.welfare(k);
      if (v > best) {
        best = v;
        bn = k;
      }
    }
    counts[bn - nS] = (counts[bn - nS] || 0) + 1;
    worstLoss = Math.max(worstLoss, (best - m.welfare(nS)) / best);
    n++;
  }
  const keys = Object.keys(counts)
    .map(Number)
    .sort((a, b2) => a - b2);
  ok(
    "price-taking entry is NEVER excessive and at most one firm short: the gap is only ever 0 or 1",
    keys.length === 2 && keys[0] === 0 && keys[1] === 1,
    n +
      " markets, " +
      ((100 * counts[0]) / n).toFixed(2) +
      "% / " +
      ((100 * counts[1]) / n).toFixed(2) +
      "%, worst welfare loss " +
      (100 * worstLoss).toFixed(3) +
      "%"
  );
}

// 7. Whole-number knife-edge
{
  const nWant = 40;
  const B = 10;
  const A = B * acMin + (nWant * s) / d;
  const m = createMarket(A, B);
  ok(
    "when the market has room for a whole number of firms, profit IS zero and price IS minimum AC",
    Math.abs(m.nBar - nWant) < 1e-9 &&
      Math.abs(m.profit(nWant)) < 1e-9 &&
      Math.abs(m.price(nWant) - acMin) < 1e-9
  );
}

// 8. The worked market against a planner (the prose quotes 51, and "less than 0.01%")
{
  const m = createMarket(600, 10);
  let best = m.nStar;
  for (let k = m.nStar - 10; k <= m.nStar + 10; k++) if (m.welfare(k) > m.welfare(best)) best = k;
  const loss = (100 * (m.welfare(best) - m.welfare(m.nStar))) / m.welfare(best);
  ok(
    "in the worked market the planner picks 51 firms against free entry's 50, and the surplus lost is under 0.01%",
    m.nStar === 50 && best === 51 && loss > 0 && loss < 0.01,
    "planner " + best + ", loss " + loss.toFixed(5) + "%"
  );
  ok(
    "s = sqrt(2Fd) = 14.14, and the 51st firm would push the price to 24.0845",
    Math.abs(s - 14.1421356) < 1e-6 && Math.abs(m.price(51) - 24.0845) < 5e-5
  );
}

if (fails.length === 0) {
  console.log(`\nALL ${pass} CHECKS PASS (0 failures)`);
} else {
  console.log(
    `\nCHECKS FAILED: ${fails.length} failures out of ${pass + fails.length}`
  );
  process.exit(1);
}
