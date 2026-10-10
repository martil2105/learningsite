/*
  Autocorrelations and the variance ratio of a return series.

  The variance ratio VR(q) is the variance of q-day returns over q times the
  variance of one-day returns. For a stationary series it equals
  1 + 2 Σ_{k<q} (1 − k/q) ρ_k, which is how the autocorrelations add up over a
  longer horizon. Under a random walk with independent days its estimate has
  a standard error of √(2(2q − 1)(q − 1)/(3qT)) (Lo and MacKinlay 1988,
  overlapping q-day sums, T days).
*/
export const mean = (a, i0 = 0, i1 = a.length) => { let s = 0; for (let i = i0; i < i1; i++) s += a[i]; return s / (i1 - i0); };

export function acf(a, k, i0 = 0, i1 = a.length) {
  const m = mean(a, i0, i1);
  let num = 0, den = 0;
  for (let i = i0; i < i1; i++) { const d = a[i] - m; den += d * d; if (i - k >= i0) num += d * (a[i - k] - m); }
  return num / den;
}

// the sample variance ratio from overlapping q-day sums
export function vr(a, q, i0 = 0, i1 = a.length) {
  const m = mean(a, i0, i1), T = i1 - i0;
  let v1 = 0; for (let i = i0; i < i1; i++) v1 += (a[i] - m) ** 2; v1 /= T;
  let s = 0, run = 0, c = 0;
  for (let i = i0; i < i1; i++) {
    run += a[i] - m;
    if (i - q >= i0) run -= a[i - q] - m;
    if (i - i0 >= q - 1) { s += run * run; c++; }
  }
  return s / c / (q * v1);
}

// the same ratio built from autocorrelations: 1 + 2 Σ (1 − k/q) ρ_k
export const vrFromRho = (rho, q) => { let v = 1; for (let k = 1; k < q; k++) v += 2 * (1 - k / q) * rho(k); return v; };
export const seVR = (q, T) => Math.sqrt((2 * (2 * q - 1) * (q - 1)) / (3 * q * T));
