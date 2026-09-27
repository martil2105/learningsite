/*
  Preprocessing: imputation, capping, a transform and a scaler, in that order.
  Everything is fitted on one set of rows (`fit`) and applied to another
  (`apply`), so a model can be frozen on the reference month and reused on the
  next one.

  cfg = {
    impute: "median" | "mean" | "zero" | "indicator",  missing: { j, maskFit, maskApply },
    extraCols: [{ fit, apply }],  noTransformCols: [j...],  dup: [j...],  drop: [j...],
    capQ: null | 0.99 ...,  capOrder: "before" | "after"  (relative to the transform),
    transform: "none" | "log1p" | "logc",  c: the offset for logc,
    scaler: "z" | "robust" | "minmax" | "rank" | "none",
  }
*/
export const col = (M, j) => M.map((r) => r[j]);
export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
export const sdev = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };

// Linear interpolation between order statistics (numpy's default).
export function quantile(a, q) {
  const s = [...a].sort((x, y) => x - y);
  const h = (s.length - 1) * q, lo = Math.floor(h);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (h - lo);
}

// Acklam's inverse normal CDF, for the rank-to-Gaussian scaler.
export function invPhi(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628274631];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  const q = p - 0.5, rr = q * q;
  return (((((a[0]*rr+a[1])*rr+a[2])*rr+a[3])*rr+a[4])*rr+a[5])*q / (((((b[0]*rr+b[1])*rr+b[2])*rr+b[3])*rr+b[4])*rr+1);
}

export function pipeline(cfg, fit, apply = fit) {
  let F = fit.map((r) => r.slice()), A = apply.map((r) => r.slice());
  if (cfg.missing) {
    const { j, maskFit, maskApply } = cfg.missing;
    const obs = F.filter((_, i) => !maskFit[i]).map((r) => r[j]);
    const fillv = cfg.impute === "mean" ? mean(obs) : cfg.impute === "zero" ? 0 : quantile(obs, 0.5);
    const fill = (M, mask) => M.forEach((r, i) => { if (mask[i]) r[j] = fillv; });
    fill(F, maskFit); fill(A, maskApply);
    if (cfg.impute === "indicator") {
      F.forEach((r, i) => r.push(maskFit[i] ? 1 : 0));
      A.forEach((r, i) => r.push(maskApply[i] ? 1 : 0));
    }
  }
  if (cfg.extraCols) cfg.extraCols.forEach((c) => { F.forEach((r, i) => r.push(c.fit[i])); A.forEach((r, i) => r.push(c.apply[i])); });
  if (cfg.dup) cfg.dup.forEach((j) => { F.forEach((r) => r.push(r[j])); A.forEach((r) => r.push(r[j])); });
  if (cfg.drop) { const keep = (r) => r.filter((_, j) => !cfg.drop.includes(j)); F = F.map(keep); A = A.map(keep); }
  const p = F[0].length;
  const skip = cfg.noTransformCols || [];
  const tf = (v, j) => (skip.includes(j) ? v : cfg.transform === "log1p" ? Math.log1p(v) : cfg.transform === "logc" ? Math.log(v + cfg.c) : v);
  const cap = (M, caps) => M.map((r) => r.map((v, j) => (caps[j] === undefined ? v : Math.min(v, caps[j]))));
  if (cfg.capQ && cfg.capOrder !== "after") {
    const caps = Array.from({ length: p }, (_, j) => quantile(col(F, j), cfg.capQ));
    F = cap(F, caps); A = cap(A, caps);
  }
  F = F.map((r) => r.map(tf)); A = A.map((r) => r.map(tf));
  if (cfg.capQ && cfg.capOrder === "after") {
    const caps = Array.from({ length: p }, (_, j) => quantile(col(F, j), cfg.capQ));
    F = cap(F, caps); A = cap(A, caps);
  }
  return scale(cfg.scaler || "z", F, A).X;
}

/* Returns { X, loc, sc } so the scale factors can be inspected. */
export function scale(kind, F, A = F) {
  const p = F[0].length;
  if (kind === "none") return { X: A, loc: null, sc: null };
  if (kind === "rank") {
    const sorted = Array.from({ length: p }, (_, j) => col(F, j).sort((a, b) => a - b)), n = F.length;
    const X = A.map((r) => r.map((v, j) => {
      const s = sorted[j];
      let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] < v) lo = m + 1; else hi = m; }
      let lo2 = lo, hi2 = n; while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (s[m] <= v) lo2 = m + 1; else hi2 = m; }
      return invPhi(Math.min(1 - 0.5 / n, Math.max(0.5 / n, ((lo + lo2) / 2 + 0.5) / (n + 1))));
    }));
    return { X, loc: null, sc: null };
  }
  const loc = [], sc = [];
  for (let j = 0; j < p; j++) {
    const c = col(F, j);
    if (kind === "z") { loc.push(mean(c)); sc.push(sdev(c) || 1); }
    else if (kind === "minmax") { const mn = Math.min(...c), mx = Math.max(...c); loc.push(mn); sc.push(mx - mn || 1); }
    else if (kind === "robust") {
      // scikit-learn's RobustScaler replaces a zero interquartile range by 1.
      const iqr = quantile(c, 0.75) - quantile(c, 0.25);
      loc.push(quantile(c, 0.5)); sc.push(iqr === 0 ? 1 : iqr);
    } else throw new Error(`unknown scaler ${kind}`);
  }
  return { X: A.map((r) => r.map((v, j) => (v - loc[j]) / sc[j])), loc, sc };
}

export const LOG_Z = { transform: "log1p", scaler: "z" };
export const RAW_Z = { transform: "none", scaler: "z" };
