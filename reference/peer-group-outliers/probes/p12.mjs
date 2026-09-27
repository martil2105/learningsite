// Part II: preprocessing.
import * as E from "./ext.mjs"; const L = E.L;
const prof = L.makeProfiles(5000, 11);
const m1 = L.drawMonth(prof, 101), R1 = m1.map((c) => c.x);
const cnt = (A) => `ring ${E.caught(m1, A, "mule")} struct ${E.caught(m1, A, "struct")} sales ${E.caught(m1, A, "extreme")}`;
const alerts = (cfg, k, R = R1) => { const X = E.pipeline(cfg, R); return E.top(E.fitScore(X, k).sc.dist); };
console.log("== P1 capping sweep (k=3 | k=5)");
for (const tr of ["none", "log1p"]) for (const q of [null, 0.999, 0.995, 0.99, 0.975, 0.95]) {
  const cfg = { transform: tr, scaler: "z", capQ: q };
  const ties = q ? E.colOf(R1, 3).filter((v) => v >= L.quantile(E.colOf(R1, 3), q)).length : "-";
  console.log(`  ${tr.padEnd(5)} cap ${String(q).padEnd(5)} cash customers at cap ${String(ties).padEnd(4)} | k3 ${cnt(alerts(cfg, 3))} | k5 ${cnt(alerts(cfg, 5))}`);
}
{ // sd-based cap is set by the outliers themselves
  const x = E.colOf(R1, 0), mu = E.mean(x), sd = E.sdev(x), med = L.quantile(x, 0.5);
  const x2 = x.filter((_, i) => m1[i].kind !== "extreme"), mu2 = E.mean(x2), sd2 = E.sdev(x2);
  console.log(`  mean+3sd cap on inflow: ${(mu + 3 * sd).toFixed(0)} with the five sales, ${(mu2 + 3 * sd2).toFixed(0)} without; customers above: ${x.filter((v) => v > mu + 3 * sd).length} vs ${x.filter((v) => v > mu2 + 3 * sd2).length}`);
}
console.log("== P2 log offset log(x + c)");
for (const c of [1, 100, 1000, 10000, 100000]) {
  const cfg = { transform: "logc", c, scaler: "z" };
  console.log(`  c=${String(c).padEnd(6)} gap 0->3,000 = ln(1+3000/c) = ${Math.log(1 + 3000 / c).toFixed(3)}, 3,000->38,000 = ${(Math.log(38000 + c) - Math.log(3000 + c)).toFixed(3)} | k3 ${cnt(alerts(cfg, 3))} | k5 ${cnt(alerts(cfg, 5))}`);
}
console.log("== P3 scalers");
for (const tr of ["none", "log1p"]) for (const s of ["z", "robust", "minmax", "rank"]) {
  if (tr === "log1p" && s === "rank") continue;
  const cfg = { transform: tr, scaler: s };
  const X = E.pipeline(cfg, R1); const sc = E.scale.last;
  const info = sc ? `scales ${sc.sc.map((v) => v.toPrecision(3)).join(",")}` : "";
  console.log(`  ${tr.padEnd(5)} ${s.padEnd(7)} k3 ${cnt(alerts(cfg, 3))} | k5 ${cnt(alerts(cfg, 5))} | ${s === "rank" ? "" : info}`);
}
{ // minmax on raw: where do ordinary customers sit?
  const x = E.colOf(R1, 0), mn = Math.min(...x), mx = Math.max(...x);
  const p99 = L.quantile(x, 0.99);
  console.log(`  raw min-max inflow: 99% of customers inside [0, ${((p99 - mn) / (mx - mn)).toFixed(3)}] of the axis`);
  const iq = (j) => L.quantile(E.colOf(R1, j), 0.75) - L.quantile(E.colOf(R1, j), 0.25);
  console.log(`  IQR cash ${iq(3)}, IQR intl ${iq(4)} (zero because 89.1% and 84.7% are zero)`);
}
console.log("== P4 correlation");
{ const X = E.pipeline({ transform: "log1p", scaler: "z" }, R1), p = 6, n = X.length;
  const C = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => X.reduce((s, r) => s + r[a] * r[b], 0) / n));
  console.log("  corr (log z):"); C.forEach((r, a) => console.log("   ", L.FEATURES[a].padEnd(8), r.map((v) => v.toFixed(2).padStart(6)).join("")));
  const ev = jacobi(C); const pr = ev.reduce((s, v) => s + v, 0) ** 2 / ev.reduce((s, v) => s + v * v, 0);
  console.log(`  eigenvalues ${ev.map((v) => v.toFixed(3)).join(", ")}; effective number of features (participation ratio) ${pr.toFixed(2)} of 6`);
  const colSS = [0, 1, 2, 3, 4, 5].map((j) => X.reduce((s, r) => s + r[j] ** 2, 0));
  console.log(`  each z column's sum of squares = N: ${colSS.map((v) => v.toFixed(6)).join(", ")} (N=${n})`);
  const base3 = alerts({ transform: "log1p", scaler: "z" }, 3), base5 = alerts({ transform: "log1p", scaler: "z" }, 5);
  for (const dup of [[0], [5], [5, 5]]) {
    const cfg = { transform: "log1p", scaler: "z", dup };
    const a3 = alerts(cfg, 3), a5 = alerts(cfg, 5);
    console.log(`  duplicate ${dup.map((j) => L.FEATURES[j]).join("+")}: k3 ${cnt(a3)} J vs base ${L.jaccard(a3, base3).toFixed(2)} | k5 ${cnt(a5)} J ${L.jaccard(a5, base5).toFixed(2)}`);
  }
}
console.log("== P5 PCA");
{ const X = E.pipeline({ transform: "log1p", scaler: "z" }, R1), p = 6, n = X.length;
  const C = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => X.reduce((s, r) => s + r[a] * r[b], 0) / n));
  const { vals, vecs } = jacobiFull(C);
  const order = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  const tot = vals.reduce((s, v) => s + v, 0); let cum = 0;
  const cumv = order.map(([v]) => (cum += v / tot));
  console.log(`  cumulative variance ${cumv.map((v) => v.toFixed(3)).join(", ")}`);
  const proj = (m) => X.map((x) => order.slice(0, m).map(([, i]) => x.reduce((s, v, q) => s + v * vecs[q][i], 0)));
  const ringIdx = E.idxOf(m1, "mule");
  for (const m of [2, 3, 4, 5, 6]) {
    const Z = proj(m); const row = [3, 5, 8].map((k) => { const A = E.top(E.fitScore(Z, k).sc.dist); return `k${k} ${cnt(A)}`; });
    console.log(`  keep ${m} PCs (${(cumv[m - 1] * 100).toFixed(1)}%): ${row.join(" | ")}`);
  }
  // where does the ring differ from the population mean? share of its squared offset in each PC
  const muR = X[0].map((_, j) => ringIdx.reduce((s, i) => s + X[i][j], 0) / ringIdx.length);
  const pcs = order.map(([, i]) => muR.reduce((s, v, q) => s + v * vecs[q][i], 0) ** 2), ts = pcs.reduce((s, v) => s + v, 0);
  console.log(`  ring mean offset: share in PC1..6 ${pcs.map((v) => (v / ts * 100).toFixed(1) + "%").join(", ")}`);
  const sIdx = E.idxOf(m1, "struct"), muS = X[0].map((_, j) => sIdx.reduce((s, i) => s + X[i][j], 0) / sIdx.length);
  const pcsS = order.map(([, i]) => muS.reduce((s, v, q) => s + v * vecs[q][i], 0) ** 2), tsS = pcsS.reduce((s, v) => s + v, 0);
  console.log(`  structurers offset: share in PC1..6 ${pcsS.map((v) => (v / tsS * 100).toFixed(1) + "%").join(", ")}`);
}
console.log("== P7 irrelevant features");
{ const r = L.mulberry32(51);
  for (const q of [0, 2, 5, 10, 20]) {
    const noise = Array.from({ length: q }, () => m1.map(() => L.gaussian(r)));
    const X0 = E.pipeline({ transform: "log1p", scaler: "z" }, R1);
    const X = X0.map((x, i) => [...x, ...noise.map((c) => c[i])]);
    const row = [3, 5].map((k) => { const { sc } = E.fitScore(X, k); const A = E.top(sc.dist);
      const d = [...sc.dist].sort((a, b) => a - b); return `k${k} ${cnt(A)} contrast p99/p50 ${(d[Math.floor(0.99 * d.length)] / d[Math.floor(0.5 * d.length)]).toFixed(2)}`; });
    console.log(`  +${String(q).padEnd(2)} noise features: ${row.join(" | ")}`);
  }
}
console.log("== P8 a ratio feature: share of inflow sent abroad");
{ const ratio = R1.map((r) => r[4] / r[0]), ringIdx = E.idxOf(m1, "mule");
  const ringMin = Math.min(...ringIdx.map((i) => ratio[i])), above = ratio.filter((v, i) => v >= ringMin && m1[i].kind !== "mule").length;
  console.log(`  ring ratio ${ringMin.toFixed(3)}+; ordinary customers at or above it: ${above}; max ordinary ${Math.max(...ratio.filter((_, i) => m1[i].kind !== "mule")).toFixed(2)}`);
  for (const k of [3, 5, 8]) {
    const cfg = { transform: "log1p", scaler: "z", extraCols: [{ fit: ratio, apply: ratio }] };
    console.log(`  +ratio k${k}: ${cnt(alerts(cfg, k))} (without: ${cnt(alerts({ transform: "log1p", scaler: "z" }, k))})`);
  }
}
console.log("== P9 order of operations");
{ const a = E.pipeline({ transform: "log1p", scaler: "z", capQ: 0.99, capOrder: "before" }, R1);
  const b = E.pipeline({ transform: "log1p", scaler: "z", capQ: 0.99, capOrder: "after" }, R1);
  let mx = 0; a.forEach((r, i) => r.forEach((v, j) => (mx = Math.max(mx, Math.abs(v - b[i][j])))));
  console.log(`  percentile cap before vs after log: max difference ${mx.toExponential(2)}`);
  // z then cap at +3 vs cap at mean+3sd then z
  const X = E.pipeline({ transform: "none", scaler: "z" }, R1).map((r) => r.map((v) => Math.min(v, 3)));
  const capped = R1.map((r) => r.map((v, j) => { const c = E.colOf(R1, j); return Math.min(v, E.mean(c) + 3 * E.sdev(c)); }));
  const Y = E.pipeline({ transform: "none", scaler: "z" }, capped);
  let mx2 = 0; X.forEach((r, i) => r.forEach((v, j) => (mx2 = Math.max(mx2, Math.abs(v - Y[i][j])))));
  console.log(`  z-then-clip-at-3 vs clip-at-3sd-then-z: max difference ${mx2.toFixed(3)} (not the same thing)`);
}

function jacobi(A) { return jacobiFull(A).vals.slice().sort((a, b) => b - a); }
function jacobiFull(A0) {
  const n = A0.length, A = A0.map((r) => r.slice()), V = A.map((_, i) => A.map((_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2; if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  return { vals: A.map((r, i) => r[i]), vecs: V };
}
