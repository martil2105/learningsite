/*
  Alphas against factor models, by ordinary least squares on monthly returns.

  An asset's excess return is regressed on the market and a chosen set of
  other factors; the intercept is its alpha. The identity the article is built
  on (Frisch and Waugh): for a short model S and a longer one L = S plus some
  factors K,

      alpha_S - alpha_L = sum over k in K of  b_k,L * alpha_k|S,

  where b_k,L is the asset's loading on factor k in the long model and
  alpha_k|S is factor k's own alpha against the short model. It holds exactly
  in any sample. From the CAPM, then, alpha in any model is the CAPM alpha minus
  each added factor's loading times that factor's own CAPM alpha.

  Returns are in percent a month; alphas are reported a year (times 12).
*/
import DATA from "./data.js";

export const FACTORS = ["smb", "hml", "rmw", "cma", "mom"];
export const NAMES = { mkt: "Market", smb: "Size", hml: "Value", rmw: "Profitability", cma: "Investment", mom: "Momentum" };
export const SHORT = { mkt: "Mkt", smb: "SMB", hml: "HML", rmw: "RMW", cma: "CMA", mom: "Mom" };
export const ASSETS = {
  hml: { label: "Value (HML)", series: () => DATA.hml, own: "hml" },
  mom: { label: "Momentum", series: () => DATA.mom, own: "mom" },
  low: { label: "Lowest-beta tenth", series: () => DATA.lowBeta.map((r, t) => r - DATA.rf[t]), own: null },
};
export const VINTAGE = DATA.vintage;
export const MONTHS = DATA.dates.length;
export const FIRST = DATA.dates[0], LAST = DATA.dates[MONTHS - 1];
export const series = (name) => (name in ASSETS ? ASSETS[name].series() : DATA[name]);

// OLS of y on a constant and the columns in xs, by the normal equations.
export function ols(y, xs) {
  const n = y.length, k = xs.length + 1;
  const row = (t) => [1, ...xs.map((x) => x[t])];
  const A = Array.from({ length: k }, () => new Array(k + 1).fill(0));
  for (let t = 0; t < n; t++) {
    const r = row(t);
    for (let i = 0; i < k; i++) { for (let j = 0; j < k; j++) A[i][j] += r[i] * r[j]; A[i][k] += r[i] * y[t]; }
  }
  const XtX = A.map((r) => r.slice(0, k));
  const b = solve(A);
  let rss = 0;
  for (let t = 0; t < n; t++) { const r = row(t); let f = 0; for (let i = 0; i < k; i++) f += r[i] * b[i]; rss += (y[t] - f) ** 2; }
  const s2 = rss / (n - k);
  const inv = invert(XtX);
  return { b, se: b.map((_, i) => Math.sqrt(s2 * inv[i][i])) };
}
function solve(Aug) {
  const A = Aug.map((r) => r.slice()), k = A.length;
  for (let i = 0; i < k; i++) {
    let p = i; for (let r = i + 1; r < k; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]];
    for (let r = 0; r < k; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c <= k; c++) A[r][c] -= f * A[i][c]; }
  }
  return A.map((r, i) => r[k] / r[i]);
}
function invert(M) {
  const k = M.length;
  return Array.from({ length: k }, (_, j) => solve(M.map((r, i) => [...r, i === j ? 1 : 0]))).reduce((cols, col, j) => { col.forEach((v, i) => { (cols[i] ||= [])[j] = v; }); return cols; }, []);
}

// The asset's alpha (a year), its t-statistic and its loadings in a model.
export function fit(asset, factors) {
  const y = series(asset);
  const names = ["mkt", ...factors];
  const o = ols(y, names.map((f) => DATA[f]));
  const loads = Object.fromEntries(names.map((f, i) => [f, o.b[i + 1]]));
  return { alpha: 12 * o.b[0], se: 12 * o.se[0], t: o.b[0] / o.se[0], loads };
}

// A factor's own CAPM alpha (a year): the price a loading on it is charged.
export const ownCapmAlpha = (f) => fit(f, []).alpha;

// The waterfall from the CAPM alpha to the model's alpha.
export function waterfall(asset, factors) {
  const capm = fit(asset, []).alpha;
  const model = fit(asset, factors);
  const steps = factors.map((f) => ({ f, loading: model.loads[f], price: ownCapmAlpha(f), move: -model.loads[f] * ownCapmAlpha(f) }));
  return { capm, steps, alpha: model.alpha, se: model.se, t: model.t, loads: model.loads };
}

export const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
export const yearlyMean = (name) => 12 * mean(series(name));
