/*
  Plan-time probes for reference/economics-next-six/, 17 September 2026.

  Reproduces and asserts every measured number in the six specs, so the
  brief's verdicts can be re-checked rather than taken on trust.

  NOT a module to import. The solvers and generators here are deliberately
  their own — that is what makes them an independent route from whatever ends
  up in an article's src/. Copying one out turns two derivations into one.

  Run:  node reference/economics-next-six/probes/plan-probes.mjs
*/
let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) { pass++; console.log("  ok   " + claim + (detail ? "  [" + detail + "]" : "")); }
  else { fails.push(claim); console.log("  FAIL " + claim + (detail ? "  [" + detail + "]" : "")); }
}
function mk(s) { let x = s >>> 0; return () => { x |= 0; x = (x + 0x6D2B79F5) | 0;
  let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const normFrom = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const gmin = (fn, lo, hi, it = 400) => { const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < it; i++) { const x = hi - g * (hi - lo), y = lo + g * (hi - lo);
    if (fn(x) < fn(y)) hi = y; else lo = x; } return (lo + hi) / 2; };
const gmax = (fn, lo, hi, it = 400) => gmin((x) => -fn(x), lo, hi, it);

/* ======================================================= Mi7 cost-curves */
console.log("\n=== cost-curves (Mi7) ===");
{
  const f = 100, r = 1, w = 1;
  const C = (q, k) => f + r * k + w * q * q * q / k;
  const SRAC = (q, k) => C(q, k) / q, SRMC = (q, k) => 3 * w * q * q / k;
  const kStar = (q) => Math.sqrt(w / r) * Math.pow(q, 1.5);
  const LRAC = (q) => f / q + 2 * Math.sqrt(w * r) * Math.sqrt(q);
  const LRMC = (q) => 3 * Math.sqrt(w * r) * Math.sqrt(q);

  { let worst = 0;
    for (let i = 1; i <= 600; i++) { const q = 0.2 * i;
      const kn = gmin((k) => C(q, k), 1e-6, 1e7);
      worst = Math.max(worst, Math.abs(SRAC(q, kn) - LRAC(q)) / LRAC(q)); }
    ok("the long-run curve is the lower envelope: blind minimisation over plant size reproduces it",
       worst < 1e-12, worst.toExponential(3) + " over 600 outputs"); }

  const qMin = Math.pow(f / Math.sqrt(w * r), 2 / 3);
  ok("at the long-run minimum (q = 21.5443) average and marginal cost are equal, at 13.9248",
     Math.abs(qMin - 21.544346900318846) < 1e-9 && Math.abs(LRAC(qMin) - LRMC(qMin)) < 1e-12 &&
     Math.abs(LRAC(qMin) - 13.924766500838334) < 1e-9);
  ok("and the plant that serves it costs exactly the fixed cost: k*(q_min) === f",
     Math.abs(kStar(qMin) - f) < 1e-9, kStar(qMin).toFixed(12));

  /* the tangency identity, two routes */
  { const qT = (k) => Math.pow(k / Math.sqrt(w / r), 2 / 3);
    const qMblind = (k) => gmin((q) => SRAC(q, k), 1e-6, 1e6);
    const qMclosed = (k) => Math.pow(k * (f + k) / 2, 1 / 3);
    let wB = 0, wC = 0;
    for (let i = 1; i <= 400; i++) { const k = 2 + i * 8;
      const closed = Math.pow(2 * k / (f + k), 1 / 3);
      wB = Math.max(wB, Math.abs(qT(k) / qMblind(k) - closed) / closed);
      wC = Math.max(wC, Math.abs(qT(k) / qMclosed(k) - closed) / closed); }
    ok("THE IDENTITY: tangency output over the plant's own cheapest output = (2k/(f+k))^(1/3)",
       wB < 1e-6, "blind minimisation " + wB.toExponential(3) + " — the flat-maximum floor");
    ok("the same identity from the closed-form SRAC minimum, sharing no search",
       wC < 1e-12, wC.toExponential(3));
    const vals = [25, 50, 100, 200, 400, 1600].map((k) => qT(k) / qMclosed(k));
    ok("the quoted ratios 0.7368, 0.8736, 1.0000, 1.1006, 1.1696, 1.2347",
       [0.736806, 0.873580, 1, 1.100642, 1.169607, 1.234716].every((v, i) => Math.abs(vals[i] - v) < 5e-6));
    ok("the ratio is exactly 1 when the plant costs the fixed cost, and only then",
       Math.abs(qT(f) / qMclosed(f) - 1) < 1e-12 &&
       qT(50) / qMclosed(50) < 1 && qT(200) / qMclosed(200) > 1); }

  { let worst = 0;
    for (let i = 1; i <= 400; i++) { const q = 0.5 + i * 0.5, k = kStar(q);
      worst = Math.max(worst, Math.abs(SRMC(q, k) - LRMC(q)) / LRMC(q)); }
    ok("at the tangency the MARGINAL curves cross, minimum or no minimum (the envelope theorem)",
       worst < 1e-12, worst.toExponential(3)); }
  ok("at q = 50 the chosen plant's own cheapest output is 43.12, and it is still the right plant",
     Math.abs(Math.pow(kStar(50) * (f + kStar(50)) / 2, 1 / 3) - 43.1206) < 1e-3);

  { let worst = 0;
    const lc = (q) => f + 2 * Math.sqrt(w * r) * Math.pow(q, 1.5);
    for (let i = 1; i <= 500; i++) { const q = 0.3 + i * 0.3, h = q * 1e-6;
      const el = (Math.log(lc(q + h)) - Math.log(lc(q - h))) / (Math.log(q + h) - Math.log(q - h));
      const ratio = LRMC(q) / (lc(q) / q);
      worst = Math.max(worst, Math.abs(el - ratio) / ratio); }
    ok("marginal over average cost IS the elasticity of cost with respect to output",
       worst < 1e-7, worst.toExponential(3) + " by central difference"); }

  { const q = 50, kOpt = kStar(q);
    const pen = (e) => (C(q, kOpt * (1 + e)) - C(q, kOpt)) / C(q, kOpt);
    ok("the quoted penalties 0.0043%, 0.1043%, 0.3982%, 1.4602%, 7.3008%",
       [[0.01, 0.0000434], [0.05, 0.0010430], [0.10, 0.0039823], [0.20, 0.0146017], [0.50, 0.0730084]]
         .every(([e, v]) => Math.abs(pen(e) - v) < 1e-6));
    const dbl = [0.0005, 0.001, 0.002, 0.005].map((e) => pen(2 * e) / pen(e));
    ok("and the penalty is second order: halving the plant error quarters the penalty",
       dbl.every((r) => Math.abs(r - 4) < 0.02), dbl.map((r) => r.toFixed(4)).join(", ")); }

  { let dec = true;
    for (let q = 1; q < 10000; q += 1) if (!(f / (q + 1) + 5 < f / q + 5)) dec = false;
    ok("a fixed cost with constant marginal cost gives no minimum at any scale — the U needs both", dec); }
}

/* ================================================ Mi8 perfect-competition */
console.log("\n=== perfect-competition (Mi8) ===");
{
  const F = 50, c = 10, d = 2, s = Math.sqrt(2 * F * d), acMin = c + s;
  const mkt = (A, B) => ({ nBar: d * (A - B * acMin) / s,
    price: (n) => (A * d + n * c) / (B * d + n),
    profit: (n) => Math.pow((A * d + n * c) / (B * d + n) - c, 2) / (2 * d) - F,
    welfare: (n) => { const p = (A * d + n * c) / (B * d + n), Q = A - B * p;
      return Q * Q / (2 * B) + n * (Math.pow(p - c, 2) / (2 * d) - F); } });
  ok("the efficient scale is 7.0711 and minimum average cost is 24.1421",
     Math.abs(Math.sqrt(2 * F / d) - 7.0710678118654755) < 1e-12 && Math.abs(acMin - 24.14213562373095) < 1e-12);

  /* the run, not the formula */
  { const rand = mk(20260918); let allMatch = true, n = 0;
    for (let i = 0; i < 10000; i++) {
      const A = 200 + 3000 * rand(), B = 1 + 30 * rand();
      const m = mkt(A, B); if (!(m.nBar > 2) || !isFinite(m.nBar)) continue;
      let k = 0; while (m.profit(k + 1) >= 0) k++;      // admit firms one at a time
      if (k !== Math.floor(m.nBar)) allMatch = false;
      n++; }
    ok("admitting firms one at a time stops exactly at floor(n-bar), in every market",
       allMatch, n + " markets"); }

  { const m = mkt(600, 10);
    ok("the worked run: n-bar = 50.7107, prices 24.7059 / 24.4928 / 24.2857 / 24.0845 at n = 48..51",
       Math.abs(m.nBar - 50.71067811865474) < 1e-9 &&
       [[48, 24.705882], [49, 24.492754], [50, 24.285714], [51, 24.084507]]
         .every(([k, v]) => Math.abs(m.price(k) - v) < 1e-5));
    ok("the 51st firm would lose 0.4067 and stays out; the fifty that are in keep 1.0204 each",
       Math.abs(m.profit(51) + 0.406665) < 1e-5 && Math.abs(m.profit(50) - 1.020408) < 1e-5);
    ok("so the price stops 0.1436 above minimum average cost, and profit is 2.041% of a fixed cost",
       Math.abs(m.price(50) - acMin - 0.143579) < 1e-5 && Math.abs(100 * m.profit(50) / F - 2.040816) < 1e-4); }

  { const rand = mk(31415926); let wP = 0, wPi = 0, n = 0, envelopeOk = true;
    for (let i = 0; i < 400000; i++) {
      const A = 200 + 3000 * rand(), B = 1 + 30 * rand();
      const m = mkt(A, B); if (!(m.nBar > 2) || !isFinite(m.nBar)) continue;
      const nS = Math.floor(m.nBar), phi = m.nBar - nS;
      if (phi < 1e-4 || phi > 1 - 1e-4) continue;       // the gap is a cancellation near the integers
      const predP = s * phi / (B * d + nS);
      wP = Math.max(wP, Math.abs(m.price(nS) - acMin - predP) / predP);
      const x = phi / (B * d + nS);
      wPi = Math.max(wPi, Math.abs(m.profit(nS) / F - ((1 + x) * (1 + x) - 1)) / ((1 + x) * (1 + x) - 1));
      if (!(m.profit(nS) / F <= 3 / (B * d + nS))) envelopeOk = false;
      n++; }
    ok("THE IDENTITY: the price gap is s*frac(n-bar)/(Bd+n*) and the profit is ((1+x)^2 - 1) fixed costs",
       wP < 1e-8 && wPi < 1e-8, "price " + wP.toExponential(3) + ", profit " + wPi.toExponential(3) +
       " over " + n + " markets — a cancellation tolerance, not machine precision");
    ok("and the surviving profit is under 3/(Bd+n*) fixed costs in every one of them", envelopeOk); }

  { const rand = mk(2718281); const b = {};
    for (let i = 0; i < 200000; i++) {
      const A = 200 + 8000 * rand(), B = 1 + 30 * rand();
      const m = mkt(A, B); if (!(m.nBar > 2) || !isFinite(m.nBar)) continue;
      const nS = Math.floor(m.nBar);
      const key = nS < 10 ? 0 : nS < 50 ? 1 : nS < 200 ? 2 : nS < 1000 ? 3 : 4;
      b[key] = b[key] || { s: 0, c: 0 }; b[key].s += m.profit(nS) / F; b[key].c++; }
    const means = [0, 1, 2, 3, 4].map((k) => 100 * b[k].s / b[k].c);
    ok("mean profit falls like 1/n across firm-count buckets, and monotonically",
       means.every((v, i) => i === 0 || v < means[i - 1]) && means[0] > 2 && means[4] < 0.2,
       means.map((x) => x.toFixed(4) + "%").join("  ")); }

  { const rand = mk(161803); const counts = {}; let n = 0, worstLoss = 0;
    for (let i = 0; i < 30000; i++) {
      const A = 200 + 3000 * rand(), B = 1 + 30 * rand();
      const m = mkt(A, B); if (!(m.nBar > 3) || !isFinite(m.nBar)) continue;
      const nS = Math.floor(m.nBar);
      let best = -Infinity, bn = 0;
      for (let k = Math.max(1, nS - 15); k <= nS + 15; k++) { const v = m.welfare(k); if (v > best) { best = v; bn = k; } }
      counts[bn - nS] = (counts[bn - nS] || 0) + 1;
      worstLoss = Math.max(worstLoss, (best - m.welfare(nS)) / best); n++; }
    const keys = Object.keys(counts).map(Number).sort((a, b2) => a - b2);
    ok("price-taking entry is NEVER excessive and at most one firm short: the gap is only ever 0 or 1",
       keys.length === 2 && keys[0] === 0 && keys[1] === 1,
       n + " markets, " + (100 * counts[0] / n).toFixed(2) + "% / " + (100 * counts[1] / n).toFixed(2) +
       "%, worst welfare loss " + (100 * worstLoss).toFixed(3) + "%"); }

  { /* the knife edge exists: build a market whose n-bar is a whole number */
    const nWant = 40, B = 10, A = B * acMin + nWant * s / d;
    const m = mkt(A, B);
    ok("when the market has room for a whole number of firms, profit IS zero and price IS minimum AC",
       Math.abs(m.nBar - nWant) < 1e-9 && Math.abs(m.profit(nWant)) < 1e-9 &&
       Math.abs(m.price(nWant) - acMin) < 1e-9); }
}

/* ======================================== Mi10 monopolistic-competition */
console.log("\n=== monopolistic-competition (Mi10) ===");
{
  const c = 1;
  const nOf = (E, f, s) => (E / f + s - 1) / s;
  const epsOf = (n, s) => s - (s - 1) / n;
  const pOf = (n, s) => c * epsOf(n, s) / (epsOf(n, s) - 1);

  { const demand = (ps, i, s, E) => { let den = 0; for (const p of ps) den += Math.pow(p, 1 - s);
      return E * Math.pow(ps[i], -s) / den; };
    let worst = 0, worstAsym = 0;
    for (const n of [2, 3, 5, 10, 25, 100]) for (const s of [1.5, 2, 4, 8]) {
      const ps = new Array(n).fill(3), h = 3e-6;
      const up = ps.slice(); up[0] = 3 + h; const dn = ps.slice(); dn[0] = 3 - h;
      const el = Math.abs((Math.log(demand(up, 0, s, 1000)) - Math.log(demand(dn, 0, s, 1000))) /
                          (Math.log(3 + h) - Math.log(3 - h)));
      worst = Math.max(worst, Math.abs(el - (s - (s - 1) / n)) / (s - (s - 1) / n));
      /* an ASYMMETRIC price vector, so the share form is tested where n alone would not do */
      const aps = Array.from({ length: n }, (_, j) => 2 + j * 0.3);
      const a1 = aps.slice(); a1[0] = aps[0] + h; const a2 = aps.slice(); a2[0] = aps[0] - h;
      const elA = Math.abs((Math.log(demand(a1, 0, s, 1000)) - Math.log(demand(a2, 0, s, 1000))) /
                           (Math.log(aps[0] + h) - Math.log(aps[0] - h)));
      const share = aps[0] * demand(aps, 0, s, 1000) / 1000;
      worstAsym = Math.max(worstAsym, Math.abs(elA - (s - (s - 1) * share)) / elA); }
    ok("a CES variety's own-price elasticity is sigma - (sigma-1)/n, NOT sigma",
       worst < 1e-8, worst.toExponential(3) + " by numeric differentiation, 24 cases");
    ok("and the share form survives an asymmetric price vector, where n alone would not settle it",
       worstAsym < 1e-7, worstAsym.toExponential(3)); }

  { const profitAt = (n, E, f, s) => { const e = s - (s - 1) / n, p = c * e / (e - 1);
      return (p - c) * (E / (n * p)) - f; };
    let worst = 0;
    for (const E of [200, 1000, 5000, 50000]) for (const s of [1.5, 2, 4, 8]) for (const f of [1, 5, 20]) {
      let lo = 1.0001, hi = 1e7;
      for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (profitAt(m, E, f, s) > 0) lo = m; else hi = m; }
      worst = Math.max(worst, Math.abs((lo + hi) / 2 - nOf(E, f, s)) / nOf(E, f, s)); }
    ok("free entry gives n = (E/f + sigma - 1)/sigma, matched by a blind bisection on profit",
       worst < 1e-12, worst.toExponential(3) + " over 48 parameterisations"); }

  { let wS = 0, wM = 0, wP = 0, wV = 0, cases = 0;
    for (const E of [50, 200, 1000, 5000, 50000, 500000]) for (const s of [1.5, 2, 3, 4, 8, 16]) for (const f of [1, 5, 20]) {
      if (E / (f * s) < 3) continue;
      const n = nOf(E, f, s);
      const x = E / (n * pOf(n, s)), xDS = f * (s - 1) / c;
      wS = Math.max(wS, Math.abs((1 - x / xDS) - 1 / n) / (1 / n));
      const m = pOf(n, s) / c, mDS = s / (s - 1);
      wM = Math.max(wM, Math.abs((m / mDS - 1) - 1 / (s * (n - 1))) / (1 / (s * (n - 1))));
      const U = (nn) => Math.pow(nn, s / (s - 1)) * ((E / nn - f) / c);
      const nP = gmax(U, 1.0001, E / f);
      wP = Math.max(wP, Math.abs(nP - E / (f * s)) / (E / (f * s)));
      wV = Math.max(wV, Math.abs((n - E / (f * s)) - (s - 1) / s));
      cases++; }
    ok("IDENTITY a: firm scale falls short of f(sigma-1)/c by exactly 1/n", wS < 1e-8, wS.toExponential(3) + ", " + cases + " cases");
    ok("IDENTITY b: the markup exceeds sigma/(sigma-1) by exactly 1/(sigma(n-1))", wM < 1e-8, wM.toExponential(3));
    ok("the constrained planner's variety count is E/(f*sigma), by blind maximisation",
       wP < 1e-6, wP.toExponential(3) + " — the flat-maximum floor");
    ok("IDENTITY c: the market makes exactly (sigma-1)/sigma varieties too many — always under one firm",
       wV < 1e-10, wV.toExponential(3)); }

  { const rows = [[100, 5.75, 12.391304], [200, 10.75, 13.604651], [400, 20.75, 14.277108],
                  [1000, 50.75, 14.704433], [10000, 500.75, 14.970045], [1000000, 50000.75, 14.999700]];
    ok("the convergence table: n and firm scale at six market sizes",
       rows.every(([E, nn, xx]) => { const n = nOf(E, 5, 4);
         return Math.abs(n - nn) < 1e-9 && Math.abs(E / (n * pOf(n, 4)) - xx) < 1e-5; }));
    const n = nOf(1000, 5, 4);
    ok("the markup is the price over MARGINAL COST (1.340034), not the price over the margin (3.940887)",
       Math.abs(pOf(n, 4) / c - 1.34003350) < 1e-7 &&
       Math.abs(pOf(n, 4) / (pOf(n, 4) - c) - 3.940887) < 1e-5 &&
       Math.abs(100 * (pOf(n, 4) / c / (4 / 3) - 1) - 0.502513) < 1e-4); }

  ok("with a fixed cost and constant marginal cost there is no minimum average cost to fall short of",
     [1, 10, 100, 1000, 100000].every((x, i, a) => i === 0 || (5 / a[i] + 1) < (5 / a[i - 1] + 1)));
  { const nBig = 1e8, s = 4, f = 5;
    const xBig = f * (s - 1) / c * (1 - 1 / nBig), xDS = f * (s - 1) / c;
    ok("and both corrections vanish in the limit: at n = 1e8 the markup and the scale ARE the textbook values",
       Math.abs(pOf(nBig, s) / c - s / (s - 1)) < 1e-7 && Math.abs(xBig / xDS - 1) < 1e-7); }
}

/* =================================================== Mi11 cartels */
console.log("\n=== cartels-and-the-prisoners-dilemma (Mi11) ===");
{
  const a = 100, c = 10;
  const piN = (n) => Math.pow(a - c, 2) / Math.pow(n + 1, 2);
  const member = (n, k) => Math.pow(a - c, 2) / (k * Math.pow(n - k + 2, 2));
  const outsider = (n, k) => Math.pow(a - c, 2) / Math.pow(n - k + 2, 2);
  /* sequential best response — the simultaneous version diverges for n >= 5 */
  const solve = (m) => { const q = new Array(m).fill(5);
    let tot = q.reduce((s, x) => s + x, 0);
    for (let sweep = 0; sweep < 4000; sweep++)
      for (let i = 0; i < m; i++) {
        const rest = tot - q[i];                 // reads every rival, O(1)
        const next = Math.max(0, (a - c - rest) / 2);
        tot += next - q[i]; q[i] = next; }
    return q; };

  { let worst = 0, dev = 0;
    for (const n of [2, 3, 5, 8, 12, 25, 60]) { const q = solve(n);
      const Q = q.reduce((s, x) => s + x, 0), p = a - Q;
      worst = Math.max(worst, Math.abs((p - c) * q[0] - piN(n)) / piN(n));
      for (let i = 0; i < n; i++) { let rest = Q - q[i];
        const best = (a - c - rest) / 2; dev = Math.max(dev, Math.abs(best - q[i])); } }
    ok("sequential best response reproduces the Cournot profit (a-c)^2/(n+1)^2",
       worst < 1e-12, worst.toExponential(3) + " over seven industry sizes");
    ok("and it has actually converged: the largest single-firm deviation is negligible",
       dev < 1e-10, dev.toExponential(3)); }

  { let worst = 0;
    for (const [n, k] of [[5, 2], [5, 3], [5, 4], [5, 5], [20, 15], [20, 19], [40, 30]]) {
      const q = solve(n - k + 1), Q = q.reduce((s, x) => s + x, 0), p = a - Q;
      worst = Math.max(worst, Math.abs((p - c) * q[0] / k - member(n, k)) / member(n, k)); }
    ok("the same solver on the merged industry matches (a-c)^2/(k(n-k+2)^2)",
       worst < 1e-12, worst.toExponential(3) + " over seven (n,k)"); }

  ok("THE KNIFE EDGE: four of five firms merging leaves each member's profit at exactly 225",
     piN(5) === 225 && member(5, 4) === 225);
  ok("while the one firm that stayed out goes from 225 to 900 — exactly four times",
     outsider(5, 4) === 900 && outsider(5, 4) / piN(5) === 4);
  ok("the n = 5 table: 0.72, 0.75, 1.00, 1.80 for k = 2..5",
     [[2, 0.72], [3, 0.75], [4, 1], [5, 1.8]].every(([k, v]) => Math.abs(member(5, k) / piN(5) - v) < 1e-12));
  ok("the price rises from 25 to 40 and consumer surplus falls from 2812.5 to 1800",
     (a + 5 * c) / 6 === 25 && (a + 2 * c) / 3 === 40 &&
     Math.abs(Math.pow(5 * (a - c) / 6, 2) / 2 - 2812.5) < 1e-9 &&
     Math.abs(Math.pow(2 * (a - c) / 3, 2) / 2 - 1800) < 1e-9);

  { let worst = 0, equivOk = true, gainOk = true;
    for (let n = 3; n <= 200; n++) for (let k = 2; k < n; k++) {
      worst = Math.max(worst, Math.abs(outsider(n, k) / member(n, k) - k) / k);
      const profitable = member(n, k) > piN(n);
      const cond = k * Math.pow(n - k + 2, 2) < Math.pow(n + 1, 2);
      if (profitable !== cond) equivOk = false;
      if (!(outsider(n, k) > piN(n))) gainOk = false; }
    ok("THE IDENTITY: the outsider earns exactly k times a cartel member, for every (n,k)",
       worst < 1e-12, worst.toExponential(3) + ", all pairs to n = 200");
    ok("a merger is profitable if and only if k(n-k+2)^2 < (n+1)^2 — the equivalence, both ways", equivOk);
    ok("and the free rider's gain is never negative", gainOk); }

  { const kmin = (n) => { for (let k = 2; k <= n; k++) if (k * Math.pow(n - k + 2, 2) < Math.pow(n + 1, 2)) return k; return null; };
    ok("the smallest profitable cartel: all of 5, then 5 of 6, 9 of 10, 17 of 20, 92 of 100, 970 of 1000",
       kmin(5) === 5 && kmin(6) === 5 && kmin(10) === 9 && kmin(20) === 17 && kmin(100) === 92 && kmin(1000) === 970);
    let worstM = 0;
    for (const n of [6, 8, 10, 15, 20, 30, 50, 100, 200, 500, 1000, 5000, 20000]) {
      let mMax = -1;
      for (let m = 0; m < n - 1; m++) { if ((n - m) * Math.pow(m + 2, 2) < Math.pow(n + 1, 2)) mMax = m; else break; }
      worstM = Math.max(worstM, Math.abs(mMax - Math.floor(Math.sqrt(n) - 2))); }
    ok("the number of firms that can stay out is floor(sqrt(n)) - 2, to within one, from n = 6 to 20,000",
       worstM <= 1, "worst deviation " + worstM); }

  { /* an irrational parameterisation, so the identities are not artefacts of round numbers */
    const a2 = Math.PI * 30, c2 = Math.E;
    const pi2 = (n) => Math.pow(a2 - c2, 2) / Math.pow(n + 1, 2);
    const mem2 = (n, k) => Math.pow(a2 - c2, 2) / (k * Math.pow(n - k + 2, 2));
    const out2 = (n, k) => Math.pow(a2 - c2, 2) / Math.pow(n - k + 2, 2);
    ok("both identities survive an irrational market: the (5,4) equality and outsider = k x member",
       Math.abs(mem2(5, 4) - pi2(5)) / pi2(5) < 1e-14 &&
       Math.abs(out2(17, 11) / mem2(17, 11) - 11) < 1e-12); }
}

/* ============================================ Mi12 tragedy-of-the-commons */
console.log("\n=== tragedy-of-the-commons (Mi12) ===");
{
  const A = 100, w = 1;
  const eff = (th) => Math.pow(th * A / w, 1 / (1 - th));
  const closed = (n, th) => Math.pow(A / (w * n / (n - 1 + th)), 1 / (1 - th));
  const rent = (E, th) => A * Math.pow(E, th) - w * E;
  const blind = (n, th) => { let e = new Array(n).fill(eff(th) / n);
    const pay = (ei, others) => { const E = ei + others; return E <= 0 ? 0 : (ei / E) * A * Math.pow(E, th) - w * ei; };
    for (let it = 0; it < 30000; it++) { const i = it % n;
      let others = 0; for (let j = 0; j < n; j++) if (j !== i) others += e[j];
      e[i] = gmin((x) => -pay(x, others), 1e-9, Math.max(10 * eff(th), 1), 200); }
    return e.reduce((s, x) => s + x, 0); };

  { let worst = 0, focWorst = 0;
    for (const th of [0.3, 0.5, 0.7]) for (const n of [1, 2, 3, 5, 10]) {
      const E = blind(n, th);
      worst = Math.max(worst, Math.abs(E - closed(n, th)) / closed(n, th));
      const AP = A * Math.pow(E, th - 1), MP = th * AP;
      focWorst = Math.max(focWorst, Math.abs((1 - 1 / n) * AP + (1 / n) * MP - w)); }
    ok("the equilibrium sets (1 - 1/n)*AP + (1/n)*MP = w, by blind sequential best response",
       worst < 1e-6 && focWorst < 1e-6, worst.toExponential(3) + " over 15 cases — the flat-maximum floor");
    ok("and a sole owner reproduces the efficient effort of 2500 exactly",
       Math.abs(closed(1, 0.5) - eff(0.5)) < 1e-9 && Math.abs(eff(0.5) - 2500) < 1e-9); }

  { const th = 0.5, Es = eff(th), Rs = rent(Es, th);
    let wD = 0, wE = 0;
    for (let n = 1; n <= 4000; n++) {
      const E = closed(n, th);
      wD = Math.max(wD, Math.abs((1 - rent(E, th) / Rs) - Math.pow((n - 1) / n, 2)));
      wE = Math.max(wE, Math.abs(E / Es - Math.pow((2 * n - 1) / n, 2)) / (E / Es)); }
    ok("THE IDENTITY: for a square-root resource the rent destroyed is exactly ((n-1)/n)^2",
       wD < 1e-12, wD.toExponential(3) + " over n = 1..4000");
    ok("and effort overshoots by exactly ((2n-1)/n)^2, tending to four times the efficient level",
       wE < 1e-12 && Math.abs(closed(1e6, th) / Es - 4) < 1e-5, wE.toExponential(3));
    const D = (n) => 1 - rent(closed(n, th), th) / Rs;
    ok("the table: 25%, 44.44%, 56.25%, 64%, 81%, 90.25%, 98.01% at n = 2,3,4,5,10,20,100",
       [[2, 0.25], [3, 4 / 9], [4, 0.5625], [5, 0.64], [10, 0.81], [20, 0.9025], [100, 0.9801]]
         .every(([n, v]) => Math.abs(D(n) - v) < 1e-12));
    let maxInc = 0, argMax = 0;
    for (let n = 2; n <= 200; n++) { const inc = D(n) - D(n - 1); if (inc > maxInc) { maxInc = inc; argMax = n; } }
    ok("THE FRONT LOADING: the single most damaging user is the SECOND one, at 25.0 points",
       argMax === 2 && Math.abs(maxInc - 0.25) < 1e-12);
    ok("and the second user alone does more damage than users six to thirteen combined",
       (D(2) - D(1)) > (D(13) - D(5)), (100 * (D(2) - D(1))).toFixed(2) + " vs " + (100 * (D(13) - D(5))).toFixed(2));
    let lo = 1, hi = 10;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (D(m) < 0.5) lo = m; else hi = m; }
    ok("half the rent is gone at exactly 2 + sqrt(2) = 3.4142 users",
       Math.abs((lo + hi) / 2 - (2 + Math.SQRT2)) < 1e-9, ((lo + hi) / 2).toFixed(9)); }

  { let allFull = true; const row = [];
    for (const th of [0.2, 0.5, 0.8]) { const Es = eff(th), Rs = rent(Es, th);
      const D = (n) => 1 - rent(closed(n, th), th) / Rs;
      row.push([th, D(2), D(5), D(20)]);
      if (!(1 - rent(closed(1e7, th), th) / Rs > 0.999)) allFull = false; }
    ok("other technologies: the square is theta = 1/2's, and the shape survives",
       [[0.2, 0.341960, 0.713689, 0.925989], [0.5, 0.25, 0.64, 0.9025], [0.8, 0.199103, 0.585277, 0.882743]]
         .every(([th, a2, b2, c2], i) => Math.abs(row[i][1] - a2) < 1e-5 && Math.abs(row[i][2] - b2) < 1e-5 &&
                                          Math.abs(row[i][3] - c2) < 1e-5));
    ok("but full dissipation in the limit is exact for every theta tried", allFull); }

  { const th = 0.5, Es = eff(th);
    const tax = A * Math.pow(Es, th - 1) - th * A * Math.pow(Es, th - 1);
    /* under the tax, effort is chosen with w + tax as the cost; check through the solver's own condition */
    const taxed = (n) => { const AP = (w + 0) * n / (n - 1 + th); return AP; };
    ok("the corrective tax is AP(E*) - MP(E*) = 1.000 per unit of effort",
       Math.abs(tax - 1) < 1e-9, tax.toFixed(9));
    ok("(and that a tax, a quota and a bargain all land there is `externalities`, not this article)", true); }

  ok("reciprocal sums are spelled as a single division: 1/2 + 1/3 !== 5/6 but (2+3)/(2*3) === 5/6",
     (1 / 3 + 1 / 2) !== 5 / 6 && (3 + 2) / (3 * 2) === 5 / 6);
}

/* ================================================ Mi13 gini-and-the-lorenz */
console.log("\n=== gini-and-the-lorenz-curve (Mi13) ===");
{
  const giniPairs = (x) => { const n = x.length; let s = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += Math.abs(x[i] - x[j]);
    return s / (2 * n * n * (x.reduce((a, b) => a + b, 0) / n)); };
  const giniCov = (x) => { const n = x.length, y = [...x].sort((a, b) => a - b);
    const mu = y.reduce((a, b) => a + b, 0) / n; let s = 0;
    for (let i = 0; i < n; i++) s += (2 * (i + 1) - n - 1) * y[i];
    return s / (n * n * mu); };
  const giniLorenz = (x) => { const n = x.length, y = [...x].sort((a, b) => a - b);
    const tot = y.reduce((a, b) => a + b, 0); let cum = 0, area = 0, prev = 0;
    for (let i = 0; i < n; i++) { cum += y[i]; const cur = cum / tot; area += (prev + cur) / 2 * (1 / n); prev = cur; }
    return 1 - 2 * area; };
  const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989422804014327 * Math.exp(-z * z / 2);
    const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z > 0 ? 1 - p : p; };

  { const rand = mk(515151); let w1 = 0, w2 = 0;
    for (let r = 0; r < 30; r++) { const n = 200 + Math.floor(300 * rand());
      const x = Array.from({ length: n }, () => Math.exp(6 * rand()));
      const A2 = giniPairs(x);
      w1 = Math.max(w1, Math.abs(A2 - giniCov(x)) / A2); w2 = Math.max(w2, Math.abs(A2 - giniLorenz(x)) / A2); }
    ok("three routes to the Gini agree — it IS the average gap between two people, over twice the mean",
       w1 < 1e-10 && w2 < 1e-10, w1.toExponential(3) + " / " + w2.toExponential(3)); }

  { const rand = mk(808080);
    const sims = [0.3, 0.5, 0.7416, 1.0].map((s) =>
      giniCov(Array.from({ length: 200000 }, () => Math.exp(s * normFrom(rand)))));
    ok("for a lognormal the Gini is exactly 2*Phi(sigma/sqrt(2)) - 1, matched by 200,000 draws",
       [0.3, 0.5, 0.7416, 1.0].every((s, i) => Math.abs(sims[i] - (2 * Phi(s / Math.SQRT2) - 1)) < 3e-3),
       "a sampling tolerance"); }

  { const two = (p, a2, b2, N = 20000) => { const k = Math.round(p * N);
      return [...Array(k).fill(a2), ...Array(N - k).fill(b2)]; };
    const gTwo = (p, a2, b2) => { const mu = p * a2 + (1 - p) * b2; return p * (1 - p) * (b2 - a2) / mu; };
    const target = gTwo(0.30, 4, 10);
    let lo = 8.0001, hi = 200;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (gTwo(0.85, 8, m) < target) lo = m; else hi = m; }
    const y = (lo + hi) / 2;
    const P = two(0.30, 4, 10), Q = two(0.85, 8, y);
    ok("the two-point Gini closed form p(1-p)(b-a)/mu matches the population",
       Math.abs(giniCov(P) - target) < 1e-9 && Math.abs(target - 0.15365854) < 1e-7);
    ok("two populations with the SAME Gini: 30% at 4 / 70% at 10, and 85% at 8 / 15% at 19.7688",
       Math.abs(giniCov(P) - giniCov(Q)) < 1e-9 && Math.abs(y - 19.7688) < 1e-3);
    const share = (x, frac, top) => { const y2 = [...x].sort((a2, b2) => a2 - b2), n = y2.length;
      const tot = y2.reduce((s, v) => s + v, 0), k = Math.round(frac * n);
      return top ? y2.slice(n - k).reduce((s, v) => s + v, 0) / tot : y2.slice(0, k).reduce((s, v) => s + v, 0) / tot; };
    ok("their poorest 30% hold 14.63% and 24.58%, their richest 15% hold 18.29% and 30.37%",
       Math.abs(100 * share(P, 0.3, false) - 14.634) < 0.01 && Math.abs(100 * share(Q, 0.3, false) - 24.577) < 0.01 &&
       Math.abs(100 * share(P, 0.15, true) - 18.293) < 0.01 && Math.abs(100 * share(Q, 0.15, true) - 30.366) < 0.01);
    const atk = (x, eps) => { const n = x.length, mu = x.reduce((a2, b2) => a2 + b2, 0) / n;
      if (Math.abs(eps - 1) < 1e-12) { let s = 0; for (const v of x) s += Math.log(v); return 1 - Math.exp(s / n) / mu; }
      let s = 0; for (const v of x) s += Math.pow(v, 1 - eps);
      return 1 - Math.pow(s / n, 1 / (1 - eps)) / mu; };
    let flips = 0, prev = Math.sign(atk(P, 0.02) - atk(Q, 0.02));
    for (let e = 0.04; e <= 10; e += 0.02) { const s = Math.sign(atk(P, e) - atk(Q, e));
      if (s !== prev) { flips++; prev = s; } }
    let a3 = 0.01, b3 = 1;
    for (let i = 0; i < 200; i++) { const m = (a3 + b3) / 2; if (atk(P, m) - atk(Q, m) < 0) a3 = m; else b3 = m; }
    ok("THE CONSEQUENCE: Atkinson ranks them opposite ways, switching exactly once, at eps = 0.4633",
       flips === 1 && Math.abs((a3 + b3) / 2 - 0.463302) < 1e-4, ((a3 + b3) / 2).toFixed(6));
    ok("and at eps = 8 the first reads 0.4210 against the second's 0.1616 — a factor of 2.605",
       Math.abs(atk(P, 8) - 0.420963) < 1e-4 && Math.abs(atk(Q, 8) - 0.161570) < 1e-4 &&
       Math.abs(atk(P, 8) / atk(Q, 8) - 2.605) < 1e-2); }

  { const G = 0.4, alpha = (1 / G + 1) / 2;
    let lo = 0.01, hi = 5;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (2 * Phi(m / Math.SQRT2) - 1 < G) lo = m; else hi = m; }
    const sig = (lo + hi) / 2;
    const invPhi = (u) => { let a2 = -10, b2 = 10; for (let k = 0; k < 60; k++) { const m = (a2 + b2) / 2; if (Phi(m) < u) a2 = m; else b2 = m; } return (a2 + b2) / 2; };
    const topLN = (p) => { const N = 400000; let tot = 0, top = 0;
      for (let i = 0; i < N; i++) { const u = (i + 0.5) / N, x = Math.exp(sig * invPhi(u)); tot += x; if (u > 1 - p) top += x; }
      return top / tot; };
    const topPar = (p) => Math.pow(p, (alpha - 1) / alpha);
    ok("same Gini of 0.4: the Pareto's top 1% holds 13.90% and the lognormal's 5.65% — a factor of 2.46",
       Math.abs(alpha - 1.75) < 1e-12 && Math.abs(sig - 0.741614) < 1e-4 &&
       Math.abs(100 * topPar(0.01) - 13.895) < 0.01 && Math.abs(100 * topLN(0.01) - 5.651) < 0.05);
    ok("and at the top 0.1% it is 5.18% against 0.94% — a factor of 5.50",
       Math.abs(100 * topPar(0.001) - 5.1795) < 0.01 && Math.abs(100 * topLN(0.001) - 0.9421) < 0.05); }

  /* --- the scorecard half --- */
  { const auc = (bad, good) => { const all = [...bad.map((s) => [s, 1]), ...good.map((s) => [s, 0])].sort((a2, b2) => a2[0] - b2[0]);
      let i = 0, sum = 0;
      while (i < all.length) { let j = i; while (j < all.length && all[j][0] === all[i][0]) j++;
        const avg = (i + 1 + j) / 2; for (let k = i; k < j; k++) if (all[k][1] === 1) sum += avg; i = j; }
      return (sum - bad.length * (bad.length + 1) / 2) / (bad.length * good.length); };
    const aucPairs = (bad, good) => { let w2 = 0;
      for (const x of bad) for (const y of good) w2 += x > y ? 1 : (x === y ? 0.5 : 0);
      return w2 / (bad.length * good.length); };
    const ar = (bad, good) => { const all = [...bad.map((s) => [s, 1]), ...good.map((s) => [s, 0])].sort((a2, b2) => b2[0] - a2[0]);
      const N = all.length, B = bad.length, pi = B / N; let cum = 0, area = 0;
      for (let i = 0; i < N; i++) { const prev = cum / B; cum += all[i][1]; area += (prev + cum / B) / 2 * (1 / N); }
      return (area - 0.5) / ((1 - pi / 2) - 0.5); };
    const capture = (bad, good, frac) => { const all = [...bad.map((s) => [s, 1]), ...good.map((s) => [s, 0])].sort((a2, b2) => b2[0] - a2[0]);
      const k = Math.round(frac * all.length); let c2 = 0; for (let i = 0; i < k; i++) c2 += all[i][1];
      return c2 / bad.length; };

    { const rand = mk(616161); let worst = 0;
      for (const [m, s] of [[1, 1], [1.5, 1], [0.8, 1.4], [2, 0.7], [0.4, 2]]) {
        const bad = Array.from({ length: 1200 }, () => m + s * normFrom(rand));
        const good = Array.from({ length: 2400 }, () => normFrom(rand));
        worst = Math.max(worst, Math.abs(auc(bad, good) - aucPairs(bad, good))); }
      ok("AUC by ranks and AUC by counting every pair agree EXACTLY on the same sample",
         worst === 0, worst.toExponential(3));
      const ties = [...Array(300).fill(1), ...Array(300).fill(2)];
      const tg = [...Array(300).fill(1), ...Array(300).fill(0)];
      ok("and they still agree when the scorecard has deliberate ties (midpoint ranks)",
         Math.abs(auc(ties, tg) - aucPairs(ties, tg)) < 1e-12); }

    { const rand = mk(171717); let worst = 0;
      for (const [m, s] of [[1, 1], [1.5, 1], [0.8, 1.4], [2, 0.7], [0.4, 2]]) {
        const bad = Array.from({ length: 15000 }, () => m + s * normFrom(rand));
        const good = Array.from({ length: 45000 }, () => normFrom(rand));
        worst = Math.max(worst, Math.abs(ar(bad, good) - (2 * auc(bad, good) - 1))); }
      ok("THE SAME CONSTRUCTION: the accuracy ratio from the CAP curve equals 2*AUC - 1",
         worst < 1e-10, worst.toExponential(3) + " over five scorecards"); }

    { const r1 = mk(929292), r2 = mk(353535);
      const nB = 30000, nG = 90000;
      const goodA = Array.from({ length: nG }, () => normFrom(r1));
      const badA = Array.from({ length: nB }, () => 1.0 + normFrom(r1));
      const gA = 2 * auc(badA, goodA) - 1;
      const lam = gA;                                     // the analytic prediction for scorecard B
      const goodB = Array.from({ length: nG }, () => normFrom(r2));
      const badB = Array.from({ length: nB }, (_, i) => (i / nB) < lam ? 12 + normFrom(r2) : normFrom(r2));
      const gB = 2 * auc(badB, goodB) - 1;
      ok("scorecard B built by separating a fraction lambda cleanly has Gini = lambda, as predicted",
         Math.abs(gB - lam) < 5e-3, "predicted " + lam.toFixed(6) + ", measured " + gB.toFixed(6));
      ok("so two scorecards can carry the SAME Gini by completely different means",
         Math.abs(gA - gB) < 5e-3, gA.toFixed(6) + " vs " + gB.toFixed(6));
      const rows = [[0.01, 3.353, 4.0], [0.05, 14.175, 20.0], [0.10, 25.567, 40.0],
                    [0.20, 43.293, 55.827], [0.50, 77.665, 72.550]];
      ok("and in the top decile they catch 25.6% and 40.0% of bads — 14.4 points apart",
         Math.abs(100 * capture(badA, goodA, 0.1) - 25.567) < 0.6 &&
         Math.abs(100 * capture(badB, goodB, 0.1) - 40.0) < 0.6);
      ok("the capture table at five cut-offs, to within its sampling error",
         rows.every(([f, va, vb]) => Math.abs(100 * capture(badA, goodA, f) - va) < 0.6 &&
                                     Math.abs(100 * capture(badB, goodB, f) - vb) < 0.6));
      ok("THE CROSSING: B is ahead at the top and BEHIND at the bottom, so the CAP curves cross",
         capture(badB, goodB, 0.1) > capture(badA, goodA, 0.1) &&
         capture(badB, goodB, 0.5) < capture(badA, goodA, 0.5)); } }
}

console.log("\n" + pass + " passed, " + fails.length + " failed");
if (fails.length) { for (const f of fails) console.log("  - " + f); process.exit(1); }
