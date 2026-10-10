/*
  GARCH(1,1) on the US market's daily returns.

  Each day's variance forecast is built from yesterday's surprise and
  yesterday's forecast: h_t = ω + α e²_{t−1} + β h_{t−1}, with e_t = r_t − mean
  the demeaned simple return. The parameters maximise the normal likelihood
  −½ Σ (ln h_t + e²_t / h_t), found by Nelder–Mead in log/logit coordinates,
  starting from h_0 = the sample variance.
*/
import { RET, N } from "./market.js";
import { normals } from "./random.js";

export const MEAN = RET.reduce((s, x) => s + x, 0) / N;
export const E = RET.map((r) => r - MEAN);
export const VAR0 = E.reduce((s, x) => s + x * x, 0) / N;

export function filter(w, a, b, e = E, h0 = VAR0) {
  const h = new Float64Array(e.length);
  let v = h0;
  for (let t = 0; t < e.length; t++) { h[t] = v; v = w + a * e[t] * e[t] + b * v; }
  return h;
}
export function negLogLik(w, a, b, e = E) {
  if (!(w > 0 && a >= 0 && b >= 0 && a + b < 1)) return Infinity;
  const h = filter(w, a, b, e);
  let s = 0; for (let t = 0; t < e.length; t++) s += Math.log(h[t]) + (e[t] * e[t]) / h[t];
  return 0.5 * s;
}

// Nelder–Mead on (log ω, logit persistence, logit share of α in it)
function nelderMead(f, x0, step, iters = 4000) {
  const n = x0.length; let S = [x0.slice()]; for (let i = 0; i < n; i++) { const x = x0.slice(); x[i] += step[i]; S.push(x); }
  let F = S.map(f);
  for (let k = 0; k < iters; k++) {
    const o = F.map((_, i) => i).sort((p, q) => F[p] - F[q]); S = o.map((i) => S[i]); F = o.map((i) => F[i]);
    const c = new Array(n).fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += S[i][j] / n;
    const at = (t) => c.map((v, j) => v + t * (S[n][j] - v));
    const xr = at(-1), fr = f(xr);
    if (fr < F[0]) { const xe = at(-2), fe = f(xe); if (fe < fr) { S[n] = xe; F[n] = fe; } else { S[n] = xr; F[n] = fr; } }
    else if (fr < F[n - 1]) { S[n] = xr; F[n] = fr; }
    else { const xc = at(0.5), fc = f(xc); if (fc < F[n]) { S[n] = xc; F[n] = fc; } else { for (let i = 1; i <= n; i++) { S[i] = S[i].map((v, j) => S[0][j] + 0.5 * (v - S[0][j])); F[i] = f(S[i]); } } }
  }
  return S[0];
}
const sig = (x) => 1 / (1 + Math.exp(-x));
export const unpack = ([lw, lp, ls]) => { const p = sig(lp), s = sig(ls); return { w: Math.exp(lw), a: p * s, b: p * (1 - s) }; };
export function fit(e = E) {
  const x = nelderMead((x) => { const q = unpack(x); return negLogLik(q.w, q.a, q.b, e); }, [Math.log(1e-6), 4, -2], [0.5, 0.5, 0.5]);
  return unpack(x);
}

// what the fitted model says
export const persistence = (p) => p.a + p.b;
export const halfLife = (p) => Math.log(0.5) / Math.log(p.a + p.b);
export const longRunVar = (p) => p.w / (1 - p.a - p.b);
// the forecast of the variance h days ahead, from today's forecast h0
export const forecastVar = (p, h0, h) => longRunVar(p) + Math.pow(p.a + p.b, h) * (h0 - longRunVar(p));
// with normal shocks: the lag-k autocorrelation of squared returns, and the kurtosis
export const rho2 = (p, k) => { const { a, b } = p; return ((a * (1 - a * b - b * b)) / (1 - 2 * a * b - b * b)) * Math.pow(a + b, k - 1); };
export const garchKurtosis = (p) => { const s = p.a + p.b; return (3 * (1 - s * s)) / (1 - s * s - 2 * p.a * p.a); };

// a simulated century from the fitted model, with normal shocks
export function simulate(p, days, seed) {
  const g = normals(seed), out = new Float64Array(days);
  let h = longRunVar(p);
  for (let t = 0; t < days; t++) { out[t] = Math.sqrt(h) * g(); h = p.w + p.a * out[t] * out[t] + p.b * h; }
  return out;
}

// ------------------------------------------------- the fitted model on the data
import FIT from "./precomputed.js";
export { FIT };
export const H = filter(FIT.w, FIT.a, FIT.b);
export const SD_T = Array.from(H, Math.sqrt);
// each day measured against its own forecast, and against the century's spread
export const Z_GARCH = E.map((e, t) => e / SD_T[t]);
export const SD_ALL = Math.sqrt(E.reduce((s, x) => s + x * x, 0) / (N - 1));
export const Z_RAW = E.map((e) => e / SD_ALL);
export function kurtosis(a) {
  const m = a.reduce((s, x) => s + x, 0) / a.length;
  let v = 0, f = 0; for (const x of a) { const d = (x - m) ** 2; v += d; f += d * d; }
  v /= a.length; f /= a.length; return f / (v * v);
}
export const beyond = (z, k) => z.filter((x) => Math.abs(x) >= k).length;
export function ranked(z, count = 10) {
  return z.map((_, i) => i).sort((p, q) => Math.abs(z[q]) - Math.abs(z[p])).slice(0, count);
}

// the autocorrelation of returns and of their sizes at a log grid of lags
import { acf } from "./vr.js";
export const LAGS = [...new Set([...Array.from({ length: 41 }, (_, j) => Math.round(Math.pow(500, j / 40))), 21, 63, 252])].sort((a, b) => a - b);
export const ABS = E.map(Math.abs);
// the standard error of a return autocorrelation for days with no memory but a
// changing spread: √(Σ e²_t e²_{t−k}) / Σ e²_t (about twice the 1/√N of a constant spread)
const SS = E.reduce((s, x) => s + x * x, 0);
export const robustSE = (k) => { let d = 0; for (let t = k; t < N; t++) d += E[t] * E[t] * E[t - k] * E[t - k]; return Math.sqrt(d) / SS; };
export const ACF = LAGS.map((k) => ({ k, r: acf(RET, k), abs: acf(ABS, k), se: robustSE(k) }));

// windows of the lab, as [first year, last year]
export const PERIODS = {
  calm: [1963, 1965],
  y1955: [1954, 1956],
  y1987: [1986, 1988],
  y2008: [2007, 2009],
  y2020: [2019, 2021],
};
