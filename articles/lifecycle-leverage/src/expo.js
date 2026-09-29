// Exposure across the years of a saving life.
//
// A saver puts 1 into the account at the start of each of N years and holds a
// multiple e of her wealth in stocks for the year (e above 1 means she has
// borrowed at the safe rate). Stocks return 1 + R + x, where x has mean PREM and
// standard deviation SIGMA. Arrays are indexed by year - 1.
//
// The deposit made at the start of year j grows by G_j = prod_{s>=j} (1 + R + e_s PREM)
// in expectation, so E[W_T] = sum_j G_j, and the share of final wealth that is in
// the account, on average, during year s is
//
//   omega_s = sum_{j<=s} G_j / sum_j G_j.
//
// The dollars riding on the market in year s, as a share of final wealth, are
// E_s = e_s omega_s, and to first order
//
//   Var[ln W_T] = SIGMA^2 sum_s E_s^2.
//
// Effective years N_eff = (sum E)^2 / sum E^2, which is N when every year carries
// the same exposure and less when it is lumpy.
import { normals } from "./random.js";

export const N = 40, R = 0.02, MU = 0.07, SIGMA = 0.18, PREM = MU - R;

export function exposure(e) {
  const n = e.length, G = new Array(n);
  let g = 1;
  for (let i = n - 1; i >= 0; i--) { g *= 1 + R + e[i] * PREM; G[i] = g; }
  const tot = G.reduce((a, b) => a + b, 0);
  const om = new Array(n), E = new Array(n);
  let c = 0, sumE = 0, sumE2 = 0;
  for (let i = 0; i < n; i++) { c += G[i] / tot; om[i] = c; E[i] = e[i] * c; sumE += E[i]; sumE2 += E[i] * E[i]; }
  return { tot, om, E, sumE, sumE2, neff: (sumE * sumE) / sumE2, sd: SIGMA * Math.sqrt(sumE2) };
}
// the share of the total (exposure, or variance) that falls in the last k years
export function lastShare(E, k, power = 1) {
  const a = E.map((x) => Math.pow(x, power)), tot = a.reduce((s, x) => s + x, 0);
  return a.slice(a.length - k).reduce((s, x) => s + x, 0) / tot;
}

export const allStocks = () => new Array(N).fill(1);
// a target-date style glide path: 90% in stocks at the start, 40% at the end
export const glide = () => Array.from({ length: N }, (_, i) => 0.9 - (0.5 * i) / (N - 1));

// Leverage up to a cap early in life and let it fall so that the dollars in
// the market stay level, e_s = min(cap, c / omega_s), with c chosen so that
// the total exposure equals that of a saver at 100% stocks. The premium the
// saver expects to earn is then the same, and only its timing differs.
export function flatCap(cap, target = exposure(allStocks()).sumE) {
  if (cap <= 1) return allStocks();
  const build = (c) => {
    let e = allStocks();
    for (let pass = 0; pass < 200; pass++) {
      const { om } = exposure(e);
      const next = om.map((w) => Math.min(cap, c / Math.max(w, 1e-9)));
      let d = 0; for (let i = 0; i < N; i++) d = Math.max(d, Math.abs(next[i] - e[i]));
      e = next;
      if (d < 1e-12) break;
    }
    return e;
  };
  let lo = 0, hi = 2;
  for (let it = 0; it < 60; it++) { const c = (lo + hi) / 2; if (exposure(build(c)).sumE < target) lo = c; else hi = c; }
  const c = (lo + hi) / 2;
  return build(c);
}
export const levelOf = (e) => { const { om } = exposure(e); let c = 0; for (let i = 0; i < e.length; i++) c = Math.max(c, e[i] * om[i]); return c; };

// Seeded simulation of final wealth. A wealth wiped out by a year is set to nearly zero and the saver carries on.
export function simulate(e, paths = 100000, seed = 11) {
  const z = normals(seed), m = Math.log(1 + MU) - (SIGMA * SIGMA) / 2;
  const lw = new Float64Array(paths); let sumW = 0;
  for (let p = 0; p < paths; p++) {
    let W = 0;
    for (let i = 0; i < e.length; i++) {
      const Rr = Math.exp(m + SIGMA * z());
      W = (W + 1) * (1 + R + e[i] * (Rr - 1 - R));
      if (W <= 0) W = 1e-9;
    }
    lw[p] = Math.log(W); sumW += W;
  }
  let mean = 0; for (let p = 0; p < paths; p++) mean += lw[p]; mean /= paths;
  let v = 0; for (let p = 0; p < paths; p++) v += (lw[p] - mean) ** 2; v /= paths;
  const sorted = Float64Array.from(lw).sort();
  return { sd: Math.sqrt(v), median: Math.exp(sorted[paths >> 1]), p5: Math.exp(sorted[Math.floor(paths * 0.05)]), mean: sumW / paths };
}
