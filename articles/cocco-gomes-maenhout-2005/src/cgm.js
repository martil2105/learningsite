// A small life-cycle problem in the spirit of Cocco, Gomes and Maenhout (2005),
// solved backwards by dynamic programming. Not their calibration.
//
// A worker lives from 25 to 89 (65 years) and retires at 65. Pay is a permanent
// income P that grows by a hump-shaped rate and takes a permanent shock each
// year; in retirement she gets REPL x P and it is safe. Stocks return a gross
// (1 + r + premium) on average with volatility SIGMA_S; the safe asset is
// gross RF. She can't borrow, and can't hold more than CAP x her savings in
// stocks (CAP = 1 is "no borrowing"; 2 is a 2:1 limit).
//
// State: cash on hand x = (savings + pay) / P, which removes the trend in pay.
// The value function is F(x) = expected discounted sum of c^(1-g), where c is
// consumption over P, and the policy is found by minimising
//   c^(1-g) + beta E[ (P'/P)^(1-g) F'(x') ]   (g > 1, so minimise)
// over saving s = x - c and stock dollars d in [0, CAP s], by golden-section
// search, with F' interpolated in Q = F^(1/(1-g)) on a geometric grid of x.
import { normals } from "./random.js";

export const DEFAULTS = {
  gamma: 5, beta: 0.96, rf: 1.02, prem: 0.04, sigS: 0.157, sigN: 0.1, rho: 0,
  repl: 0.7, T: 65, retireAt: 40, cap: 1,
};
export const START_AGE = 25;
// growth of permanent income by year of work: a hump
export const growth = (t) => (t < 10 ? 1.03 : t < 30 ? 1.01 : 1.0);
// Gauss-Hermite nodes and weights (probabilists', weights sum to 1)
const GH5 = [[-2.85697, 0.011257], [-1.355626, 0.222076], [0, 0.533333], [1.355626, 0.222076], [2.85697, 0.011257]];
const GH3 = [[-1.732051, 1 / 6], [0, 2 / 3], [1.732051, 1 / 6]];
const PHI = (Math.sqrt(5) - 1) / 2;

export function solve(cfg = {}) {
  const p = { ...DEFAULTS, ...cfg };
  const g = p.gamma, XN = p.XN ?? 90, x0 = 0.25, x1 = 60;
  const xs = Array.from({ length: XN }, (_, i) => x0 * Math.pow(x1 / x0, i / (XN - 1)));
  const lx = xs.map(Math.log), hh = lx[1] - lx[0];
  const mS = Math.log(p.rf + p.prem) - (p.sigS * p.sigS) / 2; // log of the stock's gross mean, less the Ito term
  const Fcur = new Float64Array(XN), Qn = new Float64Array(XN), Mn = new Float64Array(XN);
  const pol = [];
  let F0 = null;
  // Q is interpolated by a cubic Hermite curve in log x, with slopes from central differences. A straight
  // line between grid points gets Q right to about h^2 but its slope wrong by about h, and the share in
  // stocks depends on the slope.
  const interpQ = (x) => {
    const l = Math.log(x);
    let q;
    if (l <= lx[0]) q = Qn[0] + Mn[0] * (l - lx[0]);
    else if (l >= lx[XN - 1]) q = Qn[XN - 1] + Mn[XN - 1] * (l - lx[XN - 1]);
    else {
      let j = Math.floor((l - lx[0]) / hh);
      if (j > XN - 2) j = XN - 2;
      const t = (l - lx[j]) / hh, t2 = t * t, t3 = t2 * t;
      q = (2 * t3 - 3 * t2 + 1) * Qn[j] + (t3 - 2 * t2 + t) * hh * Mn[j] + (-2 * t3 + 3 * t2) * Qn[j + 1] + (t3 - t2) * hh * Mn[j + 1];
    }
    return Math.pow(Math.max(q, 1e-12), 1 - g);
  };
  const golden = (f, a, b, its) => {
    let c1 = b - PHI * (b - a), d1 = a + PHI * (b - a), f1 = f(c1), f2 = f(d1);
    for (let it = 0; it < its; it++) {
      if (f1 < f2) { b = d1; d1 = c1; f2 = f1; c1 = b - PHI * (b - a); f1 = f(c1); }
      else { a = c1; c1 = d1; f1 = f2; d1 = a + PHI * (b - a); f2 = f(d1); }
    }
    return [a, b];
  };
  for (let t = p.T - 1; t >= 0; t--) {
    const working = t < p.retireAt, G = working ? growth(t) : 1;
    const nextRetired = t + 1 >= p.retireAt;
    const income = working && p.sigN > 0;
    const shocks = income ? GH3 : [[0, 1]];
    const Pol = { c: new Float64Array(XN), d: new Float64Array(XN) };
    for (let i = 0; i < XN; i++) {
      const x = xs[i];
      if (t === p.T - 1) { Fcur[i] = Math.pow(x, 1 - g); Pol.c[i] = x; Pol.d[i] = 0; continue; }
      const cont = (s, d) => {
        let acc = 0;
        for (const [zn, wn] of shocks) for (const [zs, ws] of GH5) {
          const R = Math.exp(mS + p.sigS * zs);
          const Rp = s * p.rf + d * (R - p.rf);
          const nn = working ? G * (income ? Math.exp(p.sigN * (p.rho * zs + Math.sqrt(1 - p.rho * p.rho) * zn) - (p.sigN * p.sigN) / 2) : 1) : 1;
          const Un = working ? (nextRetired ? p.repl : 1) : p.repl;
          acc += wn * ws * Math.pow(nn, 1 - g) * interpQ(Rp / nn + Un);
        }
        return acc;
      };
      const inner = (s) => {
        const hi = p.cap * s;
        if (hi <= 1e-12) return { v: Math.pow(x - s, 1 - g) + p.beta * cont(s, 0), d: 0 };
        const [a, b] = golden((d) => cont(s, d), 0, hi, 18);
        let best = Infinity, bd = 0;
        for (const d of [0, hi, (a + b) / 2]) { const v = cont(s, d); if (v < best) { best = v; bd = d; } }
        return { v: Math.pow(x - s, 1 - g) + p.beta * best, d: bd };
      };
      const [a, b] = golden((s) => inner(s).v, 1e-9 * x, x * (1 - 1e-9), 22);
      const sBest = (a + b) / 2, r = inner(sBest);
      Fcur[i] = r.v; Pol.c[i] = x - sBest; Pol.d[i] = sBest > 0 ? r.d / sBest : 0;
    }
    for (let i = 0; i < XN; i++) Qn[i] = Math.pow(Fcur[i], 1 / (1 - g));
    for (let i = 0; i < XN; i++) Mn[i] = (Qn[Math.min(i + 1, XN - 1)] - Qn[Math.max(i - 1, 0)]) / (lx[Math.min(i + 1, XN - 1)] - lx[Math.max(i - 1, 0)]);
    if (t === 0) F0 = Float64Array.from(Fcur);
    pol[t] = Pol;
  }
  return { pol, xs, lx, hh, p, F0 };
}

const lerp = (arr, sol, x) => {
  const l = Math.log(Math.min(Math.max(x, sol.xs[0]), sol.xs[sol.xs.length - 1]));
  let j = Math.floor((l - sol.lx[0]) / sol.hh);
  if (j < 0) j = 0; if (j > sol.xs.length - 2) j = sol.xs.length - 2;
  const t = (l - sol.lx[j]) / sol.hh;
  return arr[j] + t * (arr[j + 1] - arr[j]);
};
// value at 25 of starting with cash on hand x (in units of c^(1-g))
export const valueAt = (sol, x) => lerp(sol.F0, sol, x);

// Simulate n workers from the policy. Returns, for each age, the share in stocks
// (median and 10th / 90th percentiles), the fraction at the cap and the median
// savings in years of permanent income.
export function simulate(sol, n = 4000, seed = 5, x0 = 1.5) {
  const p = sol.p, z = normals(seed);
  const mS = Math.log(p.rf + p.prem) - (p.sigS * p.sigS) / 2;
  const by = Array.from({ length: p.T }, () => ({ sh: [], cap: 0, w: [] }));
  for (let k = 0; k < n; k++) {
    let x = x0;
    for (let t = 0; t < p.T; t++) {
      const sh = lerp(sol.pol[t].d, sol, x), c = lerp(sol.pol[t].c, sol, x);
      by[t].sh.push(sh); if (sh >= p.cap - 1e-6) by[t].cap++; by[t].w.push(x - c);
      const zs = z(), zn = z();
      const R = Math.exp(mS + p.sigS * zs), s = x - c, Rp = p.rf + sh * (R - p.rf);
      const working = t < p.retireAt, G = working ? growth(t) : 1;
      let N = 1, U = p.repl;
      if (working) { N = p.sigN > 0 ? Math.exp(p.sigN * (p.rho * zs + Math.sqrt(1 - p.rho * p.rho) * zn) - (p.sigN * p.sigN) / 2) : 1; U = t + 1 >= p.retireAt ? p.repl : 1; }
      const nn = working ? G * N : 1;
      x = (s * Rp) / nn + U;
    }
  }
  const q = (a, f) => a[Math.min(a.length - 1, Math.floor(f * a.length))];
  return by.map((b, t) => {
    const s = b.sh.slice().sort((u, v) => u - v), w = b.w.slice().sort((u, v) => u - v);
    return { age: START_AGE + t, median: q(s, 0.5), p10: q(s, 0.1), p90: q(s, 0.9), atCap: b.cap / n, wealth: q(w, 0.5) };
  });
}

// The proportional rise in consumption, every year, that a worker under the
// tight solution would need to be as well off as under the looser one, from
// the same starting cash on hand.
export function ceGain(tight, loose, x0 = 1.5) {
  const g = tight.p.gamma;
  return Math.pow(valueAt(tight, x0) / valueAt(loose, x0), 1 / (g - 1)) - 1;
}
