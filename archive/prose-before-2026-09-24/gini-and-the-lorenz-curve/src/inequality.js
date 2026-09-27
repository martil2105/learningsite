/*
 * inequality.js - Core models for Gini, Lorenz curves, Atkinson index, and Scorecards (Mi13)
 */

export function mean(x) {
  return x.reduce((a, b) => a + b, 0) / x.length;
}

/**
 * Route 1: Pairwise difference formulation of Gini.
 * The average difference between any two random people, divided by twice the mean.
 */
export function giniPairs(x) {
  const n = x.length;
  const mu = mean(x);
  let s = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      s += Math.abs(x[i] - x[j]);
    }
  }
  return s / (2 * n * n * mu);
}

/**
 * Route 2: Covariance / rank-order formulation.
 * Equivalent to 2*Cov(x, rank(x)) / (n * mean).
 */
export function giniCov(x) {
  const n = x.length;
  const y = [...x].sort((a, b) => a - b);
  const mu = mean(y);
  let s = 0;
  for (let i = 0; i < n; i++) {
    s += (2 * (i + 1) - n - 1) * y[i];
  }
  return s / (n * n * mu);
}

/**
 * Route 3: Geometric Lorenz curve area formulation.
 * G = 1 - 2 * Area under Lorenz curve.
 */
export function giniLorenz(x) {
  const n = x.length;
  const y = [...x].sort((a, b) => a - b);
  const tot = y.reduce((a, b) => a + b, 0);
  let cum = 0;
  let area = 0;
  let prev = 0;
  for (let i = 0; i < n; i++) {
    cum += y[i];
    const cur = cum / tot;
    area += ((prev + cur) / 2) * (1 / n);
    prev = cur;
  }
  return 1 - 2 * area;
}

/**
 * Standard normal CDF approximation (Abramowitz & Stegun 26.2.17).
 */
export function Phi(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

/**
 * Inverse normal CDF via binary search.
 */
export function invPhi(u) {
  let a = -10;
  let b = 10;
  for (let k = 0; k < 60; k++) {
    const m = (a + b) / 2;
    if (Phi(m) < u) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/**
 * Closed-form Gini for a 2-point population (fraction p at a, 1-p at b).
 */
export function gTwo(p, a, b) {
  const mu = p * a + (1 - p) * b;
  return (p * (1 - p) * (b - a)) / mu;
}

export function twoPointPop(p, a, b, N = 20000) {
  const k = Math.round(p * N);
  return [...Array(k).fill(a), ...Array(N - k).fill(b)];
}

/**
 * Share of total income held by bottom or top frac of population.
 */
export function share(x, frac, top = false) {
  const y = [...x].sort((a, b) => a - b);
  const n = y.length;
  const tot = y.reduce((s, v) => s + v, 0);
  const k = Math.round(frac * n);
  if (top) {
    return y.slice(n - k).reduce((s, v) => s + v, 0) / tot;
  }
  return y.slice(0, k).reduce((s, v) => s + v, 0) / tot;
}

/**
 * Atkinson inequality index with inequality aversion parameter eps.
 */
export function atkinson(x, eps) {
  const n = x.length;
  const mu = mean(x);
  if (Math.abs(eps - 1) < 1e-12) {
    let s = 0;
    for (const v of x) s += Math.log(v);
    return 1 - Math.exp(s / n) / mu;
  }
  let s = 0;
  for (const v of x) s += Math.pow(v, 1 - eps);
  return 1 - Math.pow(s / n, 1 / (1 - eps)) / mu;
}

/**
 * Top share under Pareto distribution with shape alpha: p^((alpha - 1)/alpha).
 */
export function topPareto(p, alpha) {
  return Math.pow(p, (alpha - 1) / alpha);
}

/**
 * Top share under Lognormal distribution with parameter sigma.
 */
export function topLognormal(p, sig, N = 400000) {
  let tot = 0;
  let top = 0;
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const x = Math.exp(sig * invPhi(u));
    tot += x;
    if (u > 1 - p) top += x;
  }
  return top / tot;
}

/**
 * Credit Scorecard AUC via rank sum (Mann-Whitney U).
 */
export function auc(bad, good) {
  const all = [
    ...bad.map((s) => [s, 1]),
    ...good.map((s) => [s, 0]),
  ].sort((a, b) => a[0] - b[0]);

  let i = 0;
  let sum = 0;
  while (i < all.length) {
    let j = i;
    while (j < all.length && all[j][0] === all[i][0]) j++;
    const avg = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      if (all[k][1] === 1) sum += avg;
    }
    i = j;
  }
  return (sum - (bad.length * (bad.length + 1)) / 2) / (bad.length * good.length);
}

export function aucPairs(bad, good) {
  let w = 0;
  for (const x of bad) {
    for (const y of good) {
      w += x > y ? 1 : x === y ? 0.5 : 0;
    }
  }
  return w / (bad.length * good.length);
}

/**
 * Accuracy Ratio (AR) from the Cumulative Accuracy Profile (CAP) curve.
 * AR = (Area - 0.5) / (MaxArea - 0.5) = 2*AUC - 1.
 */
export function accuracyRatio(bad, good) {
  const all = [
    ...bad.map((s) => [s, 1]),
    ...good.map((s) => [s, 0]),
  ].sort((a, b) => b[0] - a[0]);

  const N = all.length;
  const B = bad.length;
  const pi = B / N;
  let cum = 0;
  let area = 0;
  for (let i = 0; i < N; i++) {
    const prev = cum / B;
    cum += all[i][1];
    area += ((prev + cum / B) / 2) * (1 / N);
  }
  return (area - 0.5) / (1 - pi / 2 - 0.5);
}

/**
 * Capture rate: fraction of bads captured in top frac of highest risk scores.
 */
export function capture(bad, good, frac) {
  const all = [
    ...bad.map((s) => [s, 1]),
    ...good.map((s) => [s, 0]),
  ].sort((a, b) => b[0] - a[0]);

  const k = Math.round(frac * all.length);
  let count = 0;
  for (let i = 0; i < k; i++) count += all[i][1];
  return count / bad.length;
}
