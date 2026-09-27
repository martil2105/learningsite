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

/* ------------------------------------------------------------------------
 * What the page quotes. Everything below is a closed form or a solve on top of
 * the functions above, so the prose, the figures and verify/check-numbers.mjs
 * all read the same values.
 * --------------------------------------------------------------------- */

/** Bisection on a sign change of f between lo and hi. */
export function bisect(f, lo, hi, n = 200) {
  const sLo = Math.sign(f(lo));
  let a = lo;
  let b = hi;
  for (let i = 0; i < n; i++) {
    const m = (a + b) / 2;
    if (Math.sign(f(m)) === sLo) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/* The two societies: a share p earns a, the rest earn b. Q's top income is
   solved so that both have the same Gini. */
export const SOC_P = { p: 0.3, a: 4, b: 10 };
export const qTop = bisect((y) => gTwo(0.85, 8, y) - gTwo(SOC_P.p, SOC_P.a, SOC_P.b), 8.0001, 200);
export const SOC_Q = { p: 0.85, a: 8, b: qTop };
export const giniPQ = gTwo(SOC_P.p, SOC_P.a, SOC_P.b);

/** Lorenz curve of a two-point society at population share q. */
export function lorenzTwo(q, { p, a, b }) {
  const mu = p * a + (1 - p) * b;
  return q <= p ? (q * a) / mu : (p * a + (q - p) * b) / mu;
}

/** Where the two Lorenz curves cross: between P's kink and Q's kink. */
export const lorenzCross = bisect((q) => lorenzTwo(q, SOC_P) - lorenzTwo(q, SOC_Q), SOC_P.p, SOC_Q.p);

/** Atkinson index of a two-point society, in closed form. */
export function atkinsonTwo(eps, { p, a, b }) {
  const mu = p * a + (1 - p) * b;
  if (Math.abs(eps - 1) < 1e-12) return 1 - Math.exp(p * Math.log(a) + (1 - p) * Math.log(b)) / mu;
  return 1 - Math.pow(p * Math.pow(a, 1 - eps) + (1 - p) * Math.pow(b, 1 - eps), 1 / (1 - eps)) / mu;
}

/** The inequality aversion at which P and Q tie. */
export const epsTie = bisect((e) => atkinsonTwo(e, SOC_P) - atkinsonTwo(e, SOC_Q), 0.01, 1);

/* Pareto and lognormal with the same Gini. A Pareto with shape alpha has Gini
   1/(2 alpha - 1); a lognormal has 2 Phi(sigma/sqrt 2) - 1. */
export const TOP_G = 0.4;
export const paretoAlpha = (G) => (1 / G + 1) / 2;
export const lognormalSigma = (G) => bisect((s) => 2 * Phi(s / Math.SQRT2) - 1 - G, 0.01, 5);

/** Top-p income share of a lognormal, in closed form: Phi(sigma - z), z the (1 - p) quantile. */
export function topLognormalExact(p, sig) {
  return Phi(sig - invPhi(1 - p));
}

/* Two scorecards on one book of applicants. A share pi of applicants default.
   Scorecard A shifts every defaulter's score up by d standard deviations;
   scorecard B separates a share lam of defaulters perfectly and cannot tell
   the rest from good borrowers. B's Gini is lam, so setting lam to A's Gini
   gives two scorecards with the same Gini. These are the population values of
   the simulated scorecards in verify/check-numbers.mjs. */
export const BOOK = { pi: 0.25, d: 1 };

/** Gini (2 AUC - 1) of a scorecard whose defaulters are shifted by d s.d. */
export const binormalGini = (d) => 2 * Phi(d / Math.SQRT2) - 1;
export const lamB = binormalGini(BOOK.d);

/** Share of applicants flagged, and of defaulters caught, above cut-off t (scorecard A). */
export function capShiftAt(t, d = BOOK.d, pi = BOOK.pi) {
  return { flagged: (1 - pi) * (1 - Phi(t)) + pi * (1 - Phi(t - d)), caught: 1 - Phi(t - d) };
}

/** Scorecard A: share of defaulters caught when we decline the riskiest share f. */
export function captureShift(f, d = BOOK.d, pi = BOOK.pi) {
  const t = bisect((s) => capShiftAt(s, d, pi).flagged - f, -12, 12);
  return capShiftAt(t, d, pi).caught;
}

/** Scorecard B: the same, for a scorecard that separates a share lam perfectly. */
export function captureSlice(f, lam = lamB, pi = BOOK.pi) {
  return f <= lam * pi ? f / pi : lam + ((f - lam * pi) / (1 - lam * pi)) * (1 - lam);
}
