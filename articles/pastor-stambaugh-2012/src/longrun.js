// Long-run variance two ways, after Pástor & Stambaugh (2012).
//
// The world: stocks' yearly log return r_{t+1} = mu_t + u_{t+1}, where the
// expected return mu_t drifts around a long-run mean E:
//   mu_{t+1} - E = beta (mu_t - E) + w_{t+1},  corr(u, w) = rho.
// A negative rho is what makes returns revert: a bad surprise today comes with
// a rise in expected returns tomorrow. Parameters are pinned by three numbers:
// the one-year volatility SIGMA, the share R2 of one-year variance that comes
// from moving expected returns, and the persistence beta.
//
// The investor sees N years of returns and nothing else. She doesn't know E,
// she doesn't know today's mu_T, and (in the last figure) she isn't sure about
// beta. Her variance of the next k years' total return splits into the paper's
// five pieces (eq. 12 of the paper): i.i.d. surprises, mean reversion, future
// expected returns, today's expected return, and estimation risk.
import { normals } from "./random.js";
import { normCdf } from "./stats.js";

export const SIGMA = 0.2;
export const R2 = 0.05;
export const BETA = 0.83;
export const N_DATA = 206; // the paper's sample, 1802-2007
export const HORIZON = 50;

export const REVERSION = { strong: -0.9, moderate: -0.7, weak: -0.5 };
export const DOUBT = { known: [0.83, 0.83], fair: [0.75, 0.91], unsure: [0.66, 1.0] };

export function params(beta, sigma = SIGMA, r2 = R2) {
  const V = sigma * sigma, smu2 = r2 * V, su2 = (1 - r2) * V, sw2 = smu2 * (1 - beta * beta);
  return { V, smu2, su2, sw2, su: Math.sqrt(su2), sw: Math.sqrt(sw2) };
}

// how much of a shock to expected returns reaches the next k years' total
export const reach = (k, beta) => (1 - Math.pow(beta, k)) / (1 - beta);

// ---------------------------------------------------------------- one: the mean
// i.i.d. returns with a mean estimated from N years: the k-year total's
// forecast error is the k surprises plus k times the error in the mean.
export const meanOnlyRatio = (k, N) => 1 + k / N;

// Share of a nominal two-sided band (z) that still holds the outcome.
export const bandHolds = (k, N, z = 1.6448536269514722) => 2 * normCdf(z / Math.sqrt(1 + k / N)) - 1;

// One history of N yearly log returns (stocks over bonds), and its average.
export const GROWTH = 0.04; // 6% premium minus sigma^2/2, as in time diversification
export function history(seed, N, m = GROWTH, sigma = SIGMA) {
  const z = normals(seed);
  let s = 0;
  for (let t = 0; t < N; t++) s += m + sigma * z();
  return s / N;
}

// Future paths from the truth, one value of log(stocks/bonds) per year.
export function futures(seed, n, years = HORIZON, m = GROWTH, sigma = SIGMA) {
  const z = normals(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = [0];
    let l = 0;
    for (let t = 1; t <= years; t++) { l += m + sigma * z(); p.push(l); }
    out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- two: the pieces
// Variance of the next k years' total if the investor knew E, mu_T and every
// parameter: the first three pieces.
export function knownPieces(k, beta, rho, sigma = SIGMA, r2 = R2) {
  const p = params(beta, sigma, r2);
  let s1 = 0, s2 = 0;
  for (let j = 1; j < k; j++) { const aj = reach(j, beta); s1 += aj; s2 += aj * aj; }
  return { iid: k * p.su2, reversion: 2 * rho * p.su * p.sw * s1, future: p.sw2 * s2 };
}

// What N years of returns leave unknown about (E, x_T), x_T = mu_T - E: a
// Kalman filter over the two, flat on E, with x_0 drawn from its long-run
// spread. Only the covariance is needed, so no data goes in.
export function posterior(N, beta, rho, sigma = SIGMA, r2 = R2) {
  const p = params(beta, sigma, r2);
  let P00 = 1e6, P01 = 0, P11 = p.smu2;
  for (let t = 0; t < N; t++) {
    const vy = P00 + 2 * P01 + P11 + p.su2;
    const cE = P00 + P01, cX = beta * (P01 + P11) + rho * p.su * p.sw;
    const nE = P00, nEX = beta * P01, nX = beta * beta * P11 + p.sw2;
    P00 = nE - (cE * cE) / vy;
    P01 = nEX - (cE * cX) / vy;
    P11 = nX - (cX * cX) / vy;
  }
  return { P00, P01, P11 };
}

// All five pieces of the investor's variance of the k-year total. The total
// return loads k on E and reach(k) on x_T, so what the data leave unknown adds
// [k, reach] P [k, reach]'. Split as the paper does: today's expected return is
// the part left if E were known, and estimation risk is the rest.
export function investorPieces(k, beta, rho, N = N_DATA, sigma = SIGMA, r2 = R2) {
  const kn = knownPieces(k, beta, rho, sigma, r2);
  const P = posterior(N, beta, rho, sigma, r2), a = reach(k, beta);
  const today = a * a * (P.P11 - (P.P01 * P.P01) / P.P00);
  const both = k * k * P.P00 + 2 * k * a * P.P01 + a * a * P.P11;
  return { ...kn, today, estimation: both - today, total: kn.iid + kn.reversion + kn.future + both };
}

// The world's variance of a k-year total with nothing conditioned on: what a
// long enough record measures, and what the variance ratios in the data are.
export function worldVariance(k, beta, rho, sigma = SIGMA, r2 = R2) {
  const kn = knownPieces(k, beta, rho, sigma, r2), p = params(beta, sigma, r2);
  return kn.iid + kn.reversion + kn.future + reach(k, beta) ** 2 * p.smu2;
}

// Doubt about persistence: beta spread evenly over [lo, hi], averaged on a
// grid of midpoints. We start on a day when our best guess of today's expected
// return equals our best guess of the long-run mean, so the forecast itself is
// the same whatever beta is and only the variances average.
export function betaGrid([lo, hi], n = 200) {
  if (lo === hi) return [lo];
  return Array.from({ length: n }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / n);
}
export function doubtedPieces(k, doubt, rho, N = N_DATA) {
  const bs = betaGrid(doubt);
  const acc = { iid: 0, reversion: 0, future: 0, today: 0, estimation: 0, total: 0 };
  for (const b of bs) {
    const p = investorPieces(k, b, rho, N);
    for (const key in acc) acc[key] += p[key] / bs.length;
  }
  return acc;
}

// The same average for every horizon 1..K at once (the figures draw all of
// them): the filter runs once per beta, and the sums grow one term a year.
export function doubtedSeries(doubt, rho, K = HORIZON, N = N_DATA) {
  const bs = betaGrid(doubt), w = 1 / bs.length;
  const out = Array.from({ length: K + 1 }, () => ({ iid: 0, reversion: 0, future: 0, today: 0, estimation: 0, total: 0 }));
  for (const b of bs) {
    const p = params(b), P = posterior(N, b, rho);
    const qE = P.P11 - (P.P01 * P.P01) / P.P00;
    let s1 = 0, s2 = 0;
    for (let k = 1; k <= K; k++) {
      const a = reach(k, b);
      const iid = k * p.su2, rev = 2 * rho * p.su * p.sw * s1, fut = p.sw2 * s2;
      const today = a * a * qE, both = k * k * P.P00 + 2 * k * a * P.P01 + a * a * P.P11;
      const o = out[k];
      o.iid += w * iid; o.reversion += w * rev; o.future += w * fut;
      o.today += w * today; o.estimation += w * (both - today); o.total += w * (iid + rev + fut + both);
      s1 += a; s2 += a * a;
    }
  }
  return out;
}

// Per-year variance in units of a one-year variance at SIGMA.
export const perYear = (v, k, sigma = SIGMA) => v / k / (sigma * sigma);

// The very long run with everything known: per-year variance tends to
// su2 (1 + 2 rho d + d^2), d = sw / (su (1 - beta)). Lowest at d = -rho
// (1 - rho^2 of su2); back above su2 once d > -2 rho.
export function longRunFactor(beta, rho, r2 = R2) {
  const d = Math.sqrt((r2 / (1 - r2)) * ((1 + beta) / (1 - beta)));
  return 1 + 2 * rho * d + d * d;
}
export const deepestBeta = (rho, r2 = R2) => { const c = r2 / (1 - r2); return (rho * rho - c) / (rho * rho + c); };
export const flipBeta = (rho, r2 = R2) => { const c = r2 / (1 - r2); return (4 * rho * rho - c) / (4 * rho * rho + c); };
