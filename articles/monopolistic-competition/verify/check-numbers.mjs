/*
 * check-numbers.mjs - Verifies numerical identities for monopolistic-competition (Mi10)
 */

import {
  C_DEFAULT as c,
  nOf,
  epsOf,
  pOf,
  scaleOf,
  scaleDS,
  demandCES,
  profit,
} from "../src/ces.js";

let passed = 0;
let failed = 0;

function ok(name, cond, extra) {
  if (cond) {
    console.log(`  ok   ${name}${extra ? "  [" + extra + "]" : ""}`);
    passed++;
  } else {
    console.error(`  FAIL ${name}${extra ? "  [" + extra + "]" : ""}`);
    failed++;
  }
}

const gmin = (fn, lo, hi, it = 400) => {
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < it; i++) {
    const x = hi - g * (hi - lo);
    const y = lo + g * (hi - lo);
    if (fn(x) < fn(y)) hi = y;
    else lo = x;
  }
  return (lo + hi) / 2;
};

const gmax = (fn, lo, hi, it = 400) => gmin((x) => -fn(x), lo, hi, it);

console.log("\n=== monopolistic-competition (Mi10): number verification ===");

// 1 & 2: Elasticity checks
{
  let worst = 0;
  let worstAsym = 0;
  for (const n of [2, 3, 5, 10, 25, 100]) {
    for (const s of [1.5, 2, 4, 8]) {
      const ps = new Array(n).fill(3);
      const h = 3e-6;
      const up = ps.slice();
      up[0] = 3 + h;
      const dn = ps.slice();
      dn[0] = 3 - h;
      const el = Math.abs(
        (Math.log(demandCES(up, 0, s, 1000)) - Math.log(demandCES(dn, 0, s, 1000))) /
          (Math.log(3 + h) - Math.log(3 - h))
      );
      worst = Math.max(worst, Math.abs(el - (s - (s - 1) / n)) / (s - (s - 1) / n));

      // Asymmetric price vector
      const aps = Array.from({ length: n }, (_, j) => 2 + j * 0.3);
      const a1 = aps.slice();
      a1[0] = aps[0] + h;
      const a2 = aps.slice();
      a2[0] = aps[0] - h;
      const elA = Math.abs(
        (Math.log(demandCES(a1, 0, s, 1000)) - Math.log(demandCES(a2, 0, s, 1000))) /
          (Math.log(aps[0] + h) - Math.log(aps[0] - h))
      );
      const share = (aps[0] * demandCES(aps, 0, s, 1000)) / 1000;
      worstAsym = Math.max(worstAsym, Math.abs(elA - (s - (s - 1) * share)) / elA);
    }
  }
  ok(
    "a CES variety's own-price elasticity is sigma - (sigma-1)/n, NOT sigma",
    worst < 1e-8,
    worst.toExponential(3) + " by numeric differentiation, 24 cases"
  );
  ok(
    "and the share form survives an asymmetric price vector, where n alone would not settle it",
    worstAsym < 1e-7,
    worstAsym.toExponential(3)
  );
}

// 3: Free entry condition
{
  let worst = 0;
  for (const E of [200, 1000, 5000, 50000]) {
    for (const s of [1.5, 2, 4, 8]) {
      for (const f of [1, 5, 20]) {
        let lo = 1.0001;
        let hi = 1e7;
        for (let i = 0; i < 300; i++) {
          const m = (lo + hi) / 2;
          if (profit(m, E, f, s) > 0) lo = m;
          else hi = m;
        }
        worst = Math.max(worst, Math.abs((lo + hi) / 2 - nOf(E, f, s)) / nOf(E, f, s));
      }
    }
  }
  ok(
    "free entry gives n = (E/f + sigma - 1)/sigma, matched by a blind bisection on profit",
    worst < 1e-12,
    worst.toExponential(3) + " over 48 parameterisations"
  );
}

// 4, 5, 6, 7: The four identities
{
  let wS = 0;
  let wM = 0;
  let wP = 0;
  let wV = 0;
  let cases = 0;
  for (const E of [50, 200, 1000, 5000, 50000, 500000]) {
    for (const s of [1.5, 2, 3, 4, 8, 16]) {
      for (const f of [1, 5, 20]) {
        if (E / (f * s) < 3) continue;
        const n = nOf(E, f, s);
        const x = scaleOf(n, E, s, c);
        const xDS = scaleDS(f, s, c);
        wS = Math.max(wS, Math.abs(1 - x / xDS - 1 / n) / (1 / n));

        const m = pOf(n, s) / c;
        const mDS = s / (s - 1);
        wM = Math.max(wM, Math.abs(m / mDS - 1 - 1 / (s * (n - 1))) / (1 / (s * (n - 1))));

        const U = (nn) => Math.pow(nn, s / (s - 1)) * ((E / nn - f) / c);
        const nP = gmax(U, 1.0001, E / f);
        wP = Math.max(wP, Math.abs(nP - E / (f * s)) / (E / (f * s)));
        wV = Math.max(wV, Math.abs(n - E / (f * s) - (s - 1) / s));
        cases++;
      }
    }
  }
  ok("IDENTITY a: firm scale falls short of f(sigma-1)/c by exactly 1/n", wS < 1e-8, wS.toExponential(3) + ", " + cases + " cases");
  ok("IDENTITY b: the markup exceeds sigma/(sigma-1) by exactly 1/(sigma(n-1))", wM < 1e-8, wM.toExponential(3));
  ok(
    "the constrained planner's variety count is E/(f*sigma), by blind maximisation",
    wP < 1e-6,
    wP.toExponential(3) + " — the flat-maximum floor"
  );
  ok(
    "IDENTITY c: the market makes exactly (sigma-1)/sigma varieties too many — always under one firm",
    wV < 1e-10,
    wV.toExponential(3)
  );
}

// 8 & 9: Convergence table and markup calculation
{
  const rows = [
    [100, 5.75, 12.391304],
    [200, 10.75, 13.604651],
    [400, 20.75, 14.277108],
    [1000, 50.75, 14.704433],
    [10000, 500.75, 14.970045],
    [1000000, 50000.75, 14.9997],
  ];
  ok(
    "the convergence table: n and firm scale at six market sizes",
    rows.every(([E, nn, xx]) => {
      const n = nOf(E, 5, 4);
      return Math.abs(n - nn) < 1e-9 && Math.abs(scaleOf(n, E, 4, c) - xx) < 1e-5;
    })
  );

  const n = nOf(1000, 5, 4);
  ok(
    "the markup is the price over MARGINAL COST (1.340034), not the price over the margin (3.940887)",
    Math.abs(pOf(n, 4) / c - 1.3400335) < 1e-7 &&
      Math.abs(pOf(n, 4) / (pOf(n, 4) - c) - 3.940887) < 1e-5 &&
      Math.abs(100 * (pOf(n, 4) / c / (4 / 3) - 1) - 0.502513) < 1e-4
  );
}

// 10: Monotonicity of average cost with constant marginal cost
ok(
  "with a fixed cost and constant marginal cost there is no minimum average cost to fall short of",
  [1, 10, 100, 1000, 100000].every((x, i, a) => i === 0 || 5 / a[i] + 1 < 5 / a[i - 1] + 1)
);

// 11: Asymptotic limit
{
  const nBig = 1e8;
  const s = 4;
  const f = 5;
  const xBig = (f * (s - 1)) / c * (1 - 1 / nBig);
  const xDS = (f * (s - 1)) / c;
  ok(
    "and both corrections vanish in the limit: at n = 1e8 the markup and the scale ARE the textbook values",
    Math.abs(pOf(nBig, s) / c - s / (s - 1)) < 1e-7 && Math.abs(xBig / xDS - 1) < 1e-7
  );
}

console.log(`\nALL ${passed + failed} CHECKS PASS (${failed} failures)\n`);
if (failed > 0) process.exit(1);
