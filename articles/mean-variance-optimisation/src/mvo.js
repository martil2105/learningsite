// Mean-variance optimisation with estimated inputs.
import { normals } from "./random.js";

// ---------- small dense linear algebra ----------
export function cholesky(A) {
  const n = A.length, L = A.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    L[i][j] = i === j ? Math.sqrt(s) : s / L[j][j];
  }
  return L;
}
// Solve A x = b for symmetric positive definite A.
export function solve(A, b) {
  const L = cholesky(A), n = b.length, y = new Array(n), x = new Array(n);
  for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
  for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
  return x;
}
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const matvec = (A, v) => A.map((row) => dot(row, v));

// Sharpe ratio of weights w under true means mu and covariance S.
export function sharpe(w, mu, S) {
  return dot(w, mu) / Math.sqrt(dot(w, matvec(S, w)));
}
export function volOf(w, S) { return Math.sqrt(dot(w, matvec(S, w))); }

// ---------- the ten-asset universe ----------
// Equal volatility 20%, pairwise correlation 0.3, expected excess returns
// evenly spaced so that the best Sharpe ratio is 0.5 and 1/N gets 0.4.
export const N_ASSETS = 10, VOL = 0.2, CORR = 0.3;
export function universeSpec() {
  const N = N_ASSETS, s2 = VOL * VOL;
  const S = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? s2 : CORR * s2)));
  const sdP = VOL * Math.sqrt(CORR + (1 - CORR) / N);
  const mean = 0.4 * sdP;                                   // 1/N Sharpe 0.4
  const disp = Math.sqrt((0.25 - 0.16) * s2 * (1 - CORR));  // sqrt of sum of squared deviations
  const h = disp / Math.sqrt((N * (N * N - 1)) / 12);       // spacing of evenly spaced means
  const mu = Array.from({ length: N }, (_, i) => mean + h * (i - (N - 1) / 2));
  return { N, S, mu };
}

// Weights scaled so the portfolio has 10% volatility under covariance S.
export function scaleToVol(w, S, target = 0.1) {
  const v = volOf(w, S);
  return w.map((x) => (x * target) / v);
}
export function optimal(mu, S) { return solve(S, mu); }

// Draw `years` of monthly returns and estimate annual means and covariance.
export function estimate(seed, years, spec = universeSpec()) {
  const { N, S, mu } = spec;
  const z = normals(seed);
  const L = cholesky(S.map((r) => r.map((v) => v / 12)));
  const T = 12 * years;
  const sum = new Array(N).fill(0), X = [];
  for (let t = 0; t < T; t++) {
    const e = Array.from({ length: N }, () => z());
    const r = mu.map((m, i) => m / 12 + L[i].reduce((s, l, k) => s + l * e[k], 0));
    X.push(r);
    for (let i = 0; i < N; i++) sum[i] += r[i];
  }
  const m = sum.map((v) => v / T);
  const C = Array.from({ length: N }, () => new Array(N).fill(0));
  for (const r of X) for (let i = 0; i < N; i++) for (let j = 0; j <= i; j++) C[i][j] += (r[i] - m[i]) * (r[j] - m[j]);
  for (let i = 0; i < N; i++) for (let j = 0; j <= i; j++) { C[i][j] = (12 * C[i][j]) / (T - 1); C[j][i] = C[i][j]; }
  return { muHat: m.map((v) => 12 * v), Shat: C };
}

// ---------- the one-number result ----------
// Standard error of an estimated mean return.
export function meanSE(sigma, years) { return sigma / Math.sqrt(years); }

// With the covariance known, the optimiser's out-of-sample Sharpe is the best
// Sharpe times cos(angle), where the estimate in whitened coordinates is
// (a + g1, chi_{N-1}) and a = SR* sqrt(T). Common random draws make E[cos]
// a smooth function of a.
export function drawsFor(N, M = 20000, seed = 12345) {
  const z = normals(seed);
  const g1 = new Float64Array(M), X = new Float64Array(M);
  for (let k = 0; k < M; k++) { g1[k] = z(); let x = 0; for (let j = 0; j < N - 1; j++) { const e = z(); x += e * e; } X[k] = x; }
  return { g1, X, M };
}
export function expectedCos(a, draws) {
  let s = 0;
  for (let k = 0; k < draws.M; k++) { const u = a + draws.g1[k]; s += u / Math.sqrt(u * u + draws.X[k]); }
  return s / draws.M;
}
export function approxCos(a, N) { return Math.sqrt((a * a) / (a * a + N)); }
// Years of data before the optimiser's expected Sharpe reaches k times the best.
export function yearsToReach(k, SR, draws) {
  let lo = 0, hi = 200;
  for (let it = 0; it < 80; it++) { const mid = (lo + hi) / 2; if (expectedCos(mid, draws) < k) lo = mid; else hi = mid; }
  return ((lo + hi) / 2 / SR) ** 2;
}
export function approxYears(k, SR, N) { return (N * k * k) / ((1 - k * k) * SR * SR); }
