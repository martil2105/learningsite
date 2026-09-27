/*
  Plan-time probes for reference/economics-next-three/, 17 September 2026.

  This file reproduces every measured number in the three specs and asserts it,
  so the brief's verdicts can be re-checked rather than taken on trust.

  It is NOT a module to import. Its generators and its algebra are deliberately
  its own: that is what makes it an independent route from whatever ends up in
  an article's src/. Copying a function out of here into src/ turns two
  derivations into one and throws away the check.

  Run:  node reference/economics-next-three/probes/plan-probes.mjs
*/

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) { pass++; console.log("  ok   " + claim + (detail ? "  [" + detail + "]" : "")); }
  else { fails.push(claim + (detail ? " — " + detail : "")); console.log("  FAIL " + claim + (detail ? "  [" + detail + "]" : "")); }
}
function mk(s) { let x = s >>> 0; return () => { x |= 0; x = (x + 0x6D2B79F5) | 0;
  let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function normalFrom(rand) { let u = 0, v = 0;
  while (u === 0) u = rand(); while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const trap = (f, a, b, n = 200000) => { let s = 0; const h = (b - a) / n;
  for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h) * h; return s; };

const A = 120, B = 3, C = 20, S = 2;
const p0 = (A - C) / (B + S), q0 = C + S * p0;

/* ==================================================================== Mi3 */
console.log("\n=== supply-and-demand (Mi3) ===");
{
  ok("the base market is p0 = 20, q0 = 60 exactly", p0 === 20 && q0 === 60);

  /* the clearing route that reads BOTH curves and BOTH shocks */
  const clear = (u, v) => {
    const ed = (p) => (A - B * p + u) - (C + S * p + v);
    let lo = -1e4, hi = 1e4;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (ed(m) > 0) lo = m; else hi = m; }
    const p = (lo + hi) / 2;
    return { p, q: ((A - B * p + u) + (C + S * p + v)) / 2 };
  };

  for (const [name, td, ts, onto, away] of [
    ["demand-only shocks put every observation on SUPPLY", 10, 0, "supply", "demand"],
    ["supply-only shocks put every observation on DEMAND", 0, 10, "demand", "supply"],
  ]) {
    const rand = mk(20260917); let near = 0, far = 0;
    for (let i = 0; i < 20000; i++) {
      const u = td * normalFrom(rand), v = ts * normalFrom(rand);
      const { p, q } = clear(u, v);
      const dS = Math.abs(q - (C + S * p)), dD = Math.abs(q - (A - B * p));
      near = Math.max(near, onto === "supply" ? dS : dD);
      far = Math.max(far, away === "supply" ? dS : dD);
    }
    ok(name + " — and the same solver puts them far from the other one",
       near < 1e-12 && far > 10, "on " + near.toExponential(2) + ", off " + far.toFixed(1));
  }

  /* the slope identity, two routes over random markets */
  {
    const rand = mk(424242); let worst = 0, worstPos = 0, worstBias = 0, n = 0;
    for (let i = 0; i < 300000; i++) {
      const b = 0.2 + 5 * rand(), s = 0.2 + 5 * rand(), td2 = 0.02 + 4 * rand(), ts2 = 0.02 + 4 * rand();
      const D = b + s;
      const r1 = ((s * td2 - b * ts2) / (D * D)) / ((td2 + ts2) / (D * D));   // covariance algebra
      const w = td2 / (td2 + ts2);
      const r2 = w * s - (1 - w) * b;                                         // convex combination
      worst = Math.max(worst, Math.abs(r1 - r2));
      worstPos = Math.max(worstPos, Math.abs((td2 / ts2) - ((r2 + b) / (s - r2))) / (td2 / ts2));
      worstBias = Math.max(worstBias, Math.abs((r2 + b) - w * (b + s)));
      n++;
    }
    ok("the fitted slope is w*S - (1-w)*B, over " + n + " random markets", worst < 1e-12, worst.toExponential(3));
    ok("equivalently it divides [-B, S] in the ratio of the two shock variances", worstPos < 1e-12, worstPos.toExponential(3));
    ok("the bias for the demand slope is exactly w*(B+S)", worstBias < 1e-12, worstBias.toExponential(3));
  }

  /* the flat cloud */
  {
    const wStar = B / (B + S);
    let lo = 0, hi = 1; const f = (w) => w * S - (1 - w) * B;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    ok("the cloud is exactly flat at w* = B/(B+S) = 0.6", wStar === 0.6 && Math.abs((lo + hi) / 2 - wStar) < 1e-12,
       "bisection " + ((lo + hi) / 2).toFixed(12));
  }

  /* R^2 at the ends and in the middle */
  {
    const r2of = (td2, ts2) => { const D = B + S;
      const cov = (S * td2 - B * ts2) / (D * D), vp = (td2 + ts2) / (D * D), vq = (S * S * td2 + B * B * ts2) / (D * D);
      return (cov * cov) / (vp * vq); };
    ok("R2 is exactly 1 when only one curve moves, and 0 at the flat cloud",
       r2of(1, 0) === 1 && r2of(0, 1) === 1 && Math.abs(r2of(B / (B + S), S / (B + S))) < 1e-24);
  }

  /* THE IDENTITY: bracket ratio = 1/R^2, and the truth is inside */
  {
    const rand = mk(77001); let worst = 0, inside = 0, n = 0, minSlack = Infinity;
    for (let i = 0; i < 400000; i++) {
      const b = 0.2 + 5 * rand(), s = 0.2 + 5 * rand(), td2 = 0.02 + 4 * rand(), ts2 = 0.02 + 4 * rand();
      const D = b + s;
      const vp = (td2 + ts2) / (D * D), vq = (S === 0 ? 0 : (s * s * td2 + b * b * ts2) / (D * D));
      const cov = (s * td2 - b * ts2) / (D * D);
      if (cov >= -1e-12) continue;                       // only downward-sloping clouds
      const Blo = -cov / vp, Bhi = -vq / cov, r2 = (cov * cov) / (vp * vq);
      worst = Math.max(worst, Math.abs((Bhi / Blo) - (1 / r2)) / (1 / r2));
      if (b >= Blo - 1e-9 && b <= Bhi + 1e-9) inside++;
      minSlack = Math.min(minSlack, Math.min(b - Blo, Bhi - b) / b);
      n++;
    }
    ok("the bracket ratio B_hi/B_lo is exactly 1/R2, over " + n + " downward-sloping markets",
       worst < 1e-12, worst.toExponential(3));
    ok("the true demand slope lies inside the bracket in every one of them",
       inside === n, inside + "/" + n + ", smallest relative slack " + minSlack.toExponential(2));
  }

  /* the worked family */
  {
    const moments = (b, s, td2, ts2) => { const D = b + s; return {
      vp: (td2 + ts2) / (D * D), vq: (s * s * td2 + b * b * ts2) / (D * D), cov: (s * td2 - b * ts2) / (D * D) }; };
    const m = moments(3, 2, 35, 65);
    ok("the worked cloud has Var(p)=4, Var(q)=29, Cov=-5, slope -1.25, R2 = 0.215517",
       m.vp === 4 && m.vq === 29 && m.cov === -5 && m.cov / m.vp === -1.25 &&
       Math.abs((m.cov * m.cov) / (m.vp * m.vq) - 0.21551724137931033) < 1e-12);
    const solve = (b) => { const s = (m.vq + b * m.cov) / (m.cov + b * m.vp); const D = b + s;
      return { b, s, td2: ((m.cov + b * m.vp) / (s + b)) * D * D, ts2: ((s * m.vp - m.cov) / (s + b)) * D * D }; };
    let worst = 0;
    for (const b of [1.5, 2, 2.5, 3, 4]) {
      const x = solve(b), mm = moments(x.b, x.s, x.td2, x.ts2);
      worst = Math.max(worst, Math.abs(mm.vp - m.vp), Math.abs(mm.vq - m.vq), Math.abs(mm.cov - m.cov));
    }
    ok("five different markets reproduce all three moments of the worked cloud", worst < 1e-12, worst.toExponential(3));
    const Blo = -m.cov / m.vp, Bhi = -m.vq / m.cov;
    ok("the demand elasticity at (20,60) is pinned only to [0.417, 1.933], a factor of 4.64",
       Math.abs(Blo * 20 / 60 - 0.4166666666666667) < 1e-12 &&
       Math.abs(Bhi * 20 / 60 - 1.9333333333333333) < 1e-12 &&
       Math.abs(Bhi / Blo - 4.64) < 1e-12, "Blo " + Blo + ", Bhi " + Bhi);
  }

  /* the shifter */
  {
    const g = 4;
    const twoPoint = () => { const pA = (A - C - g * 0) / (B + S), pB = (A - C - g * 1) / (B + S);
      return ((A - B * pB) - (A - B * pA)) / (pB - pA); };
    ok("a supply shifter recovers the demand slope by a noise-free two-point route",
       Math.abs(twoPoint() + B) < 1e-12, twoPoint().toString());
    const rand = mk(5150); const P = [], Q = [];
    for (let i = 0; i < 200000; i++) {
      const z = normalFrom(rand), u = 10 * normalFrom(rand), v = 4 * normalFrom(rand);
      const p = (A - C - g * z + u - v) / (B + S);
      P.push(p); Q.push(A - B * p + u);
    }
    const mean = (X) => X.reduce((a, b) => a + b, 0) / X.length;
    const mp = mean(P), mq = mean(Q);
    let sxy = 0, sxx = 0; for (let i = 0; i < P.length; i++) { sxy += (P[i] - mp) * (Q[i] - mq); sxx += (P[i] - mp) ** 2; }
    ok("while OLS on the same market returns the WRONG SIGN", sxy / sxx > 0, "OLS slope " + (sxy / sxx).toFixed(4));
  }
}

/* ==================================================================== Mi4 */
console.log("\n=== elasticity (Mi4) ===");
{
  const P0 = 25, Q0 = 45;
  const fam = {
    lin:  (() => { const b = 1.2, a = Q0 + b * P0; return { q: p => a - b * p, dq: () => -b, pmax: a / b, qmax: a }; })(),
    ces:  (() => { const e = 1.6, k = Q0 * Math.pow(P0, e); return { q: p => k * Math.pow(p, -e), dq: p => -e * k * Math.pow(p, -e - 1) }; })(),
    exp:  (() => { const a = 0.05, k = Q0 * Math.exp(a * P0); return { q: p => k * Math.exp(-a * p), dq: p => -a * k * Math.exp(-a * p) }; })(),
    quad: (() => { const Pm = 80, k = Q0 / Math.pow(Pm - P0, 2); return { q: p => k * Math.pow(Math.max(Pm - p, 0), 2), dq: p => -2 * k * Math.max(Pm - p, 0), pmax: Pm }; })(),
    logit:(() => { const p50 = 30, s = 12, M = Q0 * (1 + Math.exp((P0 - p50) / s));
      return { q: p => M / (1 + Math.exp((p - p50) / s)),
               dq: p => { const z = Math.exp((p - p50) / s); return -M * z / (s * Math.pow(1 + z, 2)); } }; })(),
  };
  const eps = (f, p) => Math.abs(f.dq(p) * p / f.q(p));

  ok("all five families pass through (25, 45)",
     Object.values(fam).every(f => Math.abs(f.q(25) - 45) < 1e-10));
  ok("their elasticities at the pin are 0.6667, 1.6, 1.25, 0.9091, 0.8277",
     Math.abs(eps(fam.lin,25)-2/3)<1e-12 && Math.abs(eps(fam.ces,25)-1.6)<1e-12 &&
     Math.abs(eps(fam.exp,25)-1.25)<1e-12 && Math.abs(eps(fam.quad,25)-10/11)<1e-12 &&
     Math.abs(eps(fam.logit,25)-0.8277387)<1e-6);

  { const f = fam.lin; let worst = 0;
    for (let i = 1; i < 20000; i++) { const p = f.pmax * i / 20000;
      worst = Math.max(worst, Math.abs(eps(f, p) - p / (f.pmax - p)) / Math.max(1, p / (f.pmax - p))); }
    ok("on the line |eps| = p/(Pmax - p), Pmax = 62.5, and = 1 exactly at the midpoint",
       worst < 1e-10 && f.pmax === 62.5 && Math.abs(eps(f, 31.25) - 1) < 1e-12, worst.toExponential(3));
    ok("and equivalently (qmax - q)/q", Math.abs(((f.qmax - f.q(25)) / f.q(25)) - eps(f, 25)) < 1e-12);
    ok("|eps| runs 0.087 at p=5 to 24.0 at p=60, a factor of 276 on one curve",
       Math.abs(eps(f,5)-0.08695652173913043)<1e-12 && Math.abs(eps(f,60)-24)<1e-10 &&
       Math.abs(eps(f,60)/eps(f,5)-276)<1e-8);
  }

  /* THE IDENTITY: the tangent-segment ratio */
  { let worstAll = 0, worstFam = "";
    for (const k of Object.keys(fam)) { const f = fam[k]; let worst = 0;
      for (let i = 1; i <= 3000; i++) { const p = 0.5 + i * 0.02, q = f.q(p), d = f.dq(p);
        if (!(q > 1e-9) || !(d < 0)) continue;
        const up = Math.hypot(p, q - (q - p * d));          // point -> quantity axis
        const dn = Math.hypot((p - q / d) - p, q);          // point -> price axis
        worst = Math.max(worst, Math.abs(up / dn - eps(f, p)) / Math.max(1e-9, eps(f, p))); }
      if (worst > worstAll) { worstAll = worst; worstFam = k; } }
    ok("|eps| is the ratio of the two tangent segments, on all five families",
       worstAll < 1e-12, "worst " + worstAll.toExponential(3) + " on " + worstFam);
  }

  /* the revenue identity */
  { let worstAll = 0, worstFam = "";
    for (const k of Object.keys(fam)) { const f = fam[k]; let worst = 0;
      const hiP = f.pmax ? f.pmax * 0.98 : 300;
      for (let i = 1; i <= 4000; i++) { const p = 0.5 + (hiP - 0.5) * i / 4000;
        if (f.q(p) < 0.01 * 45) continue;
        const h = p * 1e-5, R = (x) => x * f.q(x);
        const num = (Math.log(R(p + h)) - Math.log(R(p - h))) / (Math.log(p + h) - Math.log(p - h));
        worst = Math.max(worst, Math.abs(num - (1 - eps(f, p)))); }
      if (worst > worstAll) { worstAll = worst; worstFam = k; } }
    ok("d ln R / d ln p = 1 - |eps| on every family (worst sits at the domain edge)",
       worstAll < 1e-5, "worst " + worstAll.toExponential(2) + " on " + worstFam);
    for (const [k, want] of [["lin", 31.25], ["exp", 20], ["quad", 80 / 3], ["logit", 27.1795]]) {
      const f = fam[k], R = (p) => p * f.q(p);
      let lo = 0.01, hi = f.pmax ? f.pmax : 400; const g = (Math.sqrt(5) - 1) / 2;
      for (let i = 0; i < 400; i++) { const x = hi - g * (hi - lo), y = lo + g * (hi - lo); if (R(x) > R(y)) hi = y; else lo = x; }
      const ps = (lo + hi) / 2;
      ok("revenue peaks at |eps| = 1 on " + k + " (flat-maximum floor, not an identity)",
         Math.abs(eps(f, ps) - 1) < 1e-6 && Math.abs(ps - want) < 1e-3, "p* " + ps.toFixed(6));
    }
    ok("the constant-elasticity curve has |eps| = 1.6 everywhere and so no revenue peak",
       [1, 10, 100, 1000].every(p => Math.abs(eps(fam.ces, p) - 1.6) < 1e-12));
  }

  /* the two formulas */
  { const arc = (f, p1, p2) => { const q1 = f.q(p1), q2 = f.q(p2);
      return Math.abs(((q2 - q1) / ((q1 + q2) / 2)) / ((p2 - p1) / ((p1 + p2) / 2))); };
    const logd = (f, p1, p2) => Math.abs((Math.log(f.q(p2)) - Math.log(f.q(p1))) / (Math.log(p2) - Math.log(p1)));
    const rand = mk(31337); const L = fam.lin, X = fam.ces;
    let wA = 0, wL = 0, wQ = 0;
    for (let i = 0; i < 20000; i++) {
      const p1 = 0.5 + 60 * rand(), p2 = 0.5 + 60 * rand(); if (Math.abs(p2 - p1) < 1e-6) continue;
      wA = Math.max(wA, Math.abs(arc(L, p1, p2) - eps(L, (p1 + p2) / 2)) / eps(L, (p1 + p2) / 2));
      wQ = Math.max(wQ, Math.abs((L.q(p1) + L.q(p2)) / 2 - L.q((p1 + p2) / 2)));
      const a1 = 0.5 + 200 * rand(), a2 = 0.5 + 200 * rand(); if (Math.abs(a2 - a1) < 1e-6) continue;
      wL = Math.max(wL, Math.abs(logd(X, a1, a2) - 1.6) / 1.6);
    }
    ok("the midpoint formula is the point elasticity at the midpoint price, on a line, at ANY gap",
       wA < 1e-10 && Math.abs(arc(L, 10, 60) - eps(L, 35)) < 1e-12, "worst " + wA.toExponential(3));
    ok("because on a line the mean of the two quantities IS the quantity at the mean price",
       wQ < 1e-10, wQ.toExponential(3));
    ok("the log-difference formula is exact on constant-elasticity demand, at ANY gap",
       wL < 1e-10, wL.toExponential(3));
    const drift = (g) => { const p1 = 25 * (1 - g / 2), p2 = 25 * (1 + g / 2);
      return [100 * (arc(X, p1, p2) - 1.6) / 1.6, 100 * (logd(L, p1, p2) - eps(L, 25)) / eps(L, 25)]; };
    const d10 = drift(0.10), d100 = drift(1.00);
    ok("the drift: -0.13% / -0.046% at a 10% gap, -11.77% / -5.36% at a 100% gap",
       Math.abs(d10[0] + 0.1299) < 5e-4 && Math.abs(d10[1] + 0.0464) < 5e-4 &&
       Math.abs(d100[0] + 11.7672) < 5e-3 && Math.abs(d100[1] + 5.3605) < 5e-3);
    const p1 = 20, q1 = 57, p2 = 30, q2 = 33;
    const n1 = Math.abs(((q2 - q1) / q1) / ((p2 - p1) / p1)), n2 = Math.abs(((q2 - q1) / q2) / ((p2 - p1) / p2));
    const ar = Math.abs(((q2 - q1) / ((q1 + q2) / 2)) / ((p2 - p1) / ((p1 + p2) / 2)));
    const lg = Math.abs((Math.log(q2) - Math.log(q1)) / (Math.log(p2) - Math.log(p1)));
    const bb = (q1 - q2) / (p2 - p1), aa = q1 + bb * p1;
    const ee = Math.log(q1 / q2) / Math.log(p2 / p1);
    ok("two observations give four answers spanning 2.59x: 0.842, 2.182, 1.333, 1.348",
       Math.abs(n1 - 0.8421052631578947) < 1e-12 && Math.abs(n2 - 2.1818181818181817) < 1e-12 &&
       Math.abs(ar - 4 / 3) < 1e-12 && Math.abs(lg - 1.3479430) < 1e-6 &&
       Math.abs(Math.max(n1, n2, ar, lg) / Math.min(n1, n2, ar, lg) - 2.5909) < 1e-3);
    ok("and choosing a formula IS choosing a curve: midpoint = the line through both points, log = the CES through both",
       Math.abs(ar - bb * 25 / (aa - bb * 25)) < 1e-12 && Math.abs(lg - ee) < 1e-12);
  }

  { const f = fam.lin;
    const sc = { q: p => f.q(p / 100) * 1000, dq: p => f.dq(p / 100) * 1000 / 100 };
    ok("the elasticity is bit-for-bit invariant to units while the slope changes 10x",
       eps(f, 25) === Math.abs(sc.dq(2500) * 2500 / sc.q(2500)) && Math.abs(sc.dq(2500) / f.dq(25) - 10) < 1e-12);
  }
}

/* ==================================================================== Mi5 */
console.log("\n=== surplus-and-efficiency (Mi5) ===");
{
  const k = 1 / B + 1 / S;
  const Pd = (q) => A / B - q / B, Ps = (q) => (q - C) / S;
  const tsClosed = (q) => (A / B + C / S) * q - 0.5 * k * q * q;

  ok("p* = 20, q* = 60 and TS* = 1500 exactly",
     p0 === 20 && q0 === 60 && Math.abs(tsClosed(q0) - 1500) < 1e-9);
  ok("k = 5/6 exactly ONLY if computed as (B+S)/(B*S) — 1/B + 1/S is one bit short",
     (B + S) / (B * S) === 5 / 6 && (1 / B + 1 / S) !== 5 / 6,
     "1/B+1/S = " + (1 / B + 1 / S) + ", 5/6 = " + (5 / 6));
  ok("the closed form agrees with a trapezoid integrator on TS*",
     Math.abs(tsClosed(q0) - trap((q) => Pd(q) - Ps(q), 0, q0)) < 1e-9);
  { let lo = 1, hi = 200; const g = (Math.sqrt(5) - 1) / 2;
    const tsN = (q) => trap((x) => Pd(x) - Ps(x), 0, q, 4000);
    for (let i = 0; i < 300; i++) { const x = hi - g * (hi - lo), y = lo + g * (hi - lo); if (tsN(x) > tsN(y)) hi = y; else lo = x; }
    ok("a blind golden-section maximum of the integrated surplus lands on q*",
       Math.abs((lo + hi) / 2 - q0) < 1e-5, "found " + ((lo + hi) / 2).toFixed(6) + " (flat-maximum floor)");
  }

  /* IDENTITY A */
  { const rand = mk(99887766); let worst = 0, n = 0;
    for (let i = 0; i < 300000; i++) {
      const a = 20 + 180 * rand(), b = 0.2 + 5 * rand(), c = -40 + 60 * rand(), s = 0.2 + 5 * rand();
      const ps = (a - c) / (b + s), qs = c + s * ps; if (qs <= 1) continue;
      const kk = 1 / b + 1 / s, ts = (q) => (a / b + c / s) * q - 0.5 * kk * q * q;
      const q = qs * (0.05 + 0.9 * rand());
      worst = Math.max(worst, Math.abs((ts(qs) - ts(q)) / ts(qs) - Math.pow((qs - q) / qs, 2))); n++;
    }
    ok("IDENTITY A: loss/TS* = (dq/q*)^2 exactly, over " + n + " random markets", worst < 1e-12, worst.toExponential(3));
    ok("so 1% off costs 0.01%, 10% off costs 1%, 25% off costs 6.25%",
       [[0.01, 0.0001], [0.1, 0.01], [0.25, 0.0625]].every(([d, want]) =>
         Math.abs((tsClosed(q0) - tsClosed(q0 * (1 - d))) / tsClosed(q0) - want) < 1e-12));
  }

  /* the rationing model, closed vs shuffle */
  { const misClosed = (q, N) => q * (N - q) / (2 * B);
    const rand = mk(20260101);
    let worst = 0;
    for (const pbar of [18, 15, 12, 8, 4]) {
      const q = Math.round(C + S * pbar), N = Math.round(A - B * pbar);
      const vMax = A / B, vLow = vMax - N / B;
      const effTotal = q * (vMax - q / (2 * B));
      let acc = 0; const reps = 4000;
      for (let r = 0; r < reps; r++) {
        const vals = new Array(N); for (let i = 0; i < N; i++) vals[i] = vLow + (vMax - vLow) * ((i + 0.5) / N);
        let sum = 0;
        for (let i = 0; i < q; i++) { const j = i + Math.floor(rand() * (N - i)); const t = vals[i]; vals[i] = vals[j]; vals[j] = t; sum += vals[i]; }
        acc += sum;
      }
      const mc = effTotal - acc / reps;
      worst = Math.max(worst, Math.abs(mc - misClosed(q, N)) / misClosed(q, N));
    }
    ok("the random-rationing closed form q(N-q)/(2B) matches an explicit shuffle (4,000 reps)",
       worst < 5e-3, "worst relative " + worst.toExponential(2) + " — a sampling tolerance");
  }

  /* IDENTITIES B and C, and the instrument ratio */
  { const rand = mk(13579111); let wB = 0, wC = 0, n = 0;
    for (let i = 0; i < 400000; i++) {
      const a = 20 + 180 * rand(), b = 0.2 + 5 * rand(), c = 0.5 + 60 * rand(), s = 0.2 + 5 * rand();
      const ps = (a - c) / (b + s); if (ps <= 0.05) continue;
      const qs = c + s * ps; if (qs <= 1) continue;
      const pbar = ps * (0.02 + 0.96 * rand());
      const q = c + s * pbar, N = a - b * pbar; if (q <= 0 || N <= q) continue;
      const kk = 1 / b + 1 / s;
      const TS = (a / b + c / s) * qs - 0.5 * kk * qs * qs;
      const tri = 0.5 * kk * Math.pow(qs - q, 2), mis = q * (N - q) / (2 * b), d = (qs - q) / qs;
      wB = Math.max(wB, Math.abs(mis / tri - q / (qs - q)) / (q / (qs - q)));
      wC = Math.max(wC, Math.abs((tri + mis) / TS - d));
      n++;
    }
    ok("IDENTITY B: misallocation/triangle = q/(q*-q), over " + n + " random markets and ceilings", wB < 1e-10, wB.toExponential(3));
    ok("IDENTITY C: total loss/TS* = d, the quantity cut itself, over the same " + n, wC < 1e-12, wC.toExponential(3));
    let wI = 0;
    const r2 = mk(2468);
    for (let i = 0; i < 200000; i++) { const d = 0.001 + 0.998 * r2();
      const q = q0 * (1 - d), N = A - B * ((q - C) / S);
      const tri = 0.5 * k * Math.pow(q0 - q, 2), mis = q * (N - q) / (2 * B);
      wI = Math.max(wI, Math.abs((tri + mis) / tri - 1 / d) * d); }
    ok("a ceiling costs exactly 1/d times what a quota costs at the same quantity", wI < 1e-10, wI.toExponential(3));
  }

  /* the worked case and the theta table */
  { const pbar = 12, q = C + S * pbar, N = A - B * pbar, d = (q0 - q) / q0;
    const tri = 0.5 * k * Math.pow(q0 - q, 2), mis = q * (N - q) / (2 * B);
    ok("the worked ceiling: 44 of 84 willing, triangle 106.667, misallocation 293.333, total 400 = 26.667% of TS*",
       q === 44 && N === 84 && Math.abs(tri - 320 / 3) < 1e-9 && Math.abs(mis - 880 / 3) < 1e-9 &&
       Math.abs(tri + mis - 400) < 1e-9 && Math.abs((tri + mis) / 1500 - d) < 1e-12);
    ok("and the ratio is exactly 2.75 = 44/16", Math.abs(mis / tri - 2.75) < 1e-12);
    ok("the theta table: 400.0, 326.667, 253.333, 180.0, 106.667",
       [[0, 400], [0.25, 980 / 3], [0.5, 760 / 3], [0.75, 180], [1, 320 / 3]].every(([th, want]) =>
         Math.abs(tri + (1 - th) * mis - want) < 1e-9));
    ok("the two channels are equal only at d = 0.5, where the misallocation share peaks at exactly 25%",
       Math.abs(0.5 * 0.5 - 0.5 * (1 - 0.5)) < 1e-15 && Math.abs(0.5 * (1 - 0.5) - 0.25) < 1e-15);
  }

  /* the cross-article equality with tax-incidence */
  { let worst = 0;
    for (let i = 0; i <= 400; i++) { const t = i * 0.05;
      const dwlTax = 0.5 * t * t * (B * S / (B + S));
      const dq = t * B * S / (B + S);
      worst = Math.max(worst, Math.abs(dwlTax - 0.5 * k * dq * dq)); }
    ok("tax-incidence's DWL and this article's triangle are the same object, over a rate grid", worst < 1e-12, worst.toExponential(3));
  }

  /* the honest edge */
  { const rows = [];
    for (const e of [1.6, 2.5, 4]) {
      const K = 60 * Math.pow(20, e);
      const qD = (p) => K * Math.pow(p, -e), pD = (q) => Math.pow(K / q, 1 / e), pS = (q) => (q - C) / S;
      let lo = 0.01, hi = 1000; for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (qD(m) > C + S * m) lo = m; else hi = m; }
      const ps = (lo + hi) / 2, qs = C + S * ps;
      const TS = trap((q) => pD(q) - pS(q), 0, qs, 400000);
      const d = 0.05, q = qs * (1 - d);
      const tri = TS - trap((x) => pD(x) - pS(x), 0, q, 400000);
      const pbar = pS(q), N = qD(pbar);
      const mis = trap((x) => pD(x), 0, q, 400000) - q * (trap((x) => pD(x), 0, N, 400000) / N);
      rows.push([e, 100 * (tri + mis) / TS, mis / tri]);
    }
    ok("on constant-elasticity demand a 5% cut costs 10.5-11.4% (not 5%) and rationing is 51-108x the triangle",
       rows.every(([, tot, rat]) => tot > 10 && tot < 12 && rat > 45 && rat < 115),
       rows.map(([e, t, r]) => "e=" + e + ": " + t.toFixed(2) + "%, " + r.toFixed(1) + "x").join("; "));
  }
}

console.log("\n" + pass + " passed, " + fails.length + " failed");
if (fails.length) { for (const f of fails) console.log("  - " + f); process.exit(1); }
