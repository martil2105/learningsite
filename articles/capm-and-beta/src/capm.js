/*
  The CAPM, tested two ways.

  1. A world where the CAPM holds. True betas are normal around 1 with sd S;
     each stock's estimated beta adds noise with sd e. Sorted into deciles on
     the estimate, a decile's average estimate is 1 + sqrt(S^2 + e^2) m_k, where
     m_k is the mean of a standard normal inside the k-th tenth, and its average
     true beta is 1 + rel (estimate - 1), rel = S^2 / (S^2 + e^2). Expected
     excess returns are true beta x the premium, so a line through the sorting
     betas has slope premium x rel.

  2. US stocks: Kenneth French's ten value-weighted portfolios sorted each June
     on 60-month betas, July 1963 to August 2026 (src/data.js). Post-ranking
     betas, average excess returns and alphas are regressions on the market.

  Returns are in percent; anything yearly is the monthly figure times 12.
*/
import DATA from "./data.js";

export const S_TRUE = 0.45;     // spread of true betas in the CAPM world

// ---------------------------------------------------------------- normal
export const phi = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
export function Phi(x) {
  // Simpson on the density from -12; plenty for the decile cut points
  const lo = -12, n = 4000, h = (x - lo) / n;
  let s = phi(lo) + phi(x);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * phi(lo + i * h);
  return (s * h) / 3;
}
export function PhiInv(p) {
  let a = -10, b = 10;
  for (let i = 0; i < 100; i++) { const m = (a + b) / 2; if (Phi(m) < p) a = m; else b = m; }
  return (a + b) / 2;
}
// mean of a standard normal inside each tenth
export const TENTH_MEANS = (() => {
  const cuts = [-Infinity, ...Array.from({ length: 9 }, (_, k) => PhiInv((k + 1) / 10)), Infinity];
  return cuts.slice(0, 10).map((c, k) => (phi(c === -Infinity ? -40 : c) - phi(cuts[k + 1] === Infinity ? 40 : cuts[k + 1])) * 10);
})();

export function world({ s = S_TRUE, e = NOISE_US, premium = usPremium() } = {}) {
  const sdHat = Math.sqrt(s * s + e * e), rel = (s * s) / (s * s + e * e);
  const deciles = TENTH_MEANS.map((m) => {
    const sorted = 1 + sdHat * m, had = 1 + rel * (sorted - 1);
    return { sorted, had, mean: premium * had };
  });
  return { rel, deciles, premium, slopeSorted: premium * rel, slopeHad: premium };
}

// ---------------------------------------------------------------- regressions
export function ols(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
  const b = sxy / sxx, a = my - b * mx;
  let rss = 0;
  for (let i = 0; i < n; i++) rss += (y[i] - a - b * x[i]) ** 2;
  const s2 = rss / (n - 2);
  return { a, b, seA: Math.sqrt(s2 * (1 / n + (mx * mx) / sxx)), seB: Math.sqrt(s2 / sxx), mx, my };
}
export const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
export const sd = (v) => { const m = mean(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };

// ---------------------------------------------------------------- US data
export const LABELS = DATA.labels;
export const VINTAGE = DATA.vintage;
export const FIRST = DATA.dates[0], LAST = DATA.dates[DATA.dates.length - 1];
export const MONTHS = DATA.dates.length;
export const MKT = DATA.mkt;
export const excessOf = (k) => DATA.deciles[k].map((r, t) => r - DATA.rf[t]);
export const usPremium = () => 12 * mean(DATA.mkt);

export function usDeciles(from = FIRST, to = LAST) {
  const idx = DATA.dates.map((d, t) => [d, t]).filter(([d]) => d >= from && d <= to).map(([, t]) => t);
  const m = idx.map((t) => DATA.mkt[t]);
  return LABELS.map((label, k) => {
    const y = idx.map((t) => DATA.deciles[k][t] - DATA.rf[t]);
    const o = ols(m, y);
    const sortedBeta = mean(DATA.priorBeta[k]);
    return { label, had: o.b, sorted: sortedBeta, mean: 12 * mean(y), alpha: 12 * o.a, alphaSE: 12 * o.seA };
  });
}

// A straight line through ten points (ordinary least squares).
export function lineThrough(xs, ys) {
  const o = ols(xs, ys);
  return { slope: o.b, intercept: o.a };
}

// Fama and MacBeth: each month, regress the ten excess returns on the
// full-sample betas; average the slopes and intercepts over months.
export function famaMacBeth(from = FIRST, to = LAST) {
  const betas = usDeciles(from, to).map((d) => d.had);
  const slopes = [], ints = [], gap = [];
  DATA.dates.forEach((d, t) => {
    if (d < from || d > to) return;
    const y = LABELS.map((_, k) => DATA.deciles[k][t] - DATA.rf[t]);
    const o = lineThrough(betas, y);
    slopes.push(o.slope); ints.push(o.intercept); gap.push(o.slope - DATA.mkt[t]);
  });
  const n = slopes.length;
  return {
    slope: 12 * mean(slopes), slopeSE: (12 * sd(slopes)) / Math.sqrt(n),
    intercept: 12 * mean(ints), interceptSE: (12 * sd(ints)) / Math.sqrt(n),
    tGap: mean(gap) / (sd(gap) / Math.sqrt(n)),
  };
}

// The lowest-beta decile minus the highest, regressed on the market.
export function lowMinusHigh() {
  const y = excessOf(0).map((v, t) => v - excessOf(9)[t]);
  const o = ols(DATA.mkt, y);
  return { mean: 12 * o.my, beta: o.b, alpha: 12 * o.a, t: o.a / o.seA };
}

// The US spread ratio (post-ranking spread over sorting spread, top decile
// minus bottom) is the reliability the US betas behave as if they had; the
// noise that gives the CAPM world the same reliability:
export function usSpreadRatio() {
  const d = usDeciles();
  return (d[9].had - d[0].had) / (d[9].sorted - d[0].sorted);
}
export const NOISE_US = S_TRUE * Math.sqrt(1 / usSpreadRatio() - 1);

export const monthsBetween = (from, to) => DATA.dates.filter((d) => d >= from && d <= to).length;
