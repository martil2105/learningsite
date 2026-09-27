// Part III: fitting, inertia and choosing k.
import * as E from "./ext.mjs"; const L = E.L;
const prof = L.makeProfiles(5000, 11);
const m1 = L.drawMonth(prof, 101), R1 = m1.map((c) => c.x);
const X = E.pipeline({ transform: "log1p", scaler: "z" }, R1), N = X.length;
const cnt = (A) => `ring ${E.caught(m1, A, "mule")} struct ${E.caught(m1, A, "struct")} sales ${E.caught(m1, A, "extreme")}`;
console.log("== F1 inertia decomposition (k=5)");
{ const f = L.kmeans(X, 5, 7, 10), d = E.decomposition(X, f);
  const T = d.tot.reduce((s, v) => s + v, 0), W = d.within.reduce((s, v) => s + v, 0), B = d.between.reduce((s, v) => s + v, 0);
  console.log(`  total ${T.toFixed(6)} = within ${W.toFixed(6)} + between ${B.toFixed(6)}; residual ${(T - W - B).toExponential(2)}; inertia reported ${f.inertia.toFixed(6)}`);
  console.log(`  per-feature R² (between/total): ${d.r2.map((v, j) => L.FEATURES[j] + " " + v.toFixed(3)).join(", ")}`);
}
console.log("== F2 k selection: inertia, elbow, CH, DB, silhouette, gap; detection");
{ const r = L.mulberry32(5), sample = Array.from({ length: 800 }, () => Math.floor(r() * N));
  const rows = [];
  for (let k = 1; k <= 12; k++) {
    const f = L.kmeans(X, k, 7, 10), A = E.top(L.scores(X, f).dist);
    rows.push({ k, inertia: f.inertia, ch: k > 1 ? E.chIndex(X, f) : NaN, db: k > 1 ? E.dbIndex(X, f) : NaN, sil: k > 1 ? L.silhouette(X, f.lab, sample) : NaN, det: cnt(A), ring: E.caught(m1, A, "mule") });
  }
  rows.forEach((w, i) => { const d2 = i > 0 && i < rows.length - 1 ? rows[i - 1].inertia - 2 * w.inertia + rows[i + 1].inertia : NaN;
    console.log(`  k=${String(w.k).padEnd(2)} inertia ${w.inertia.toFixed(0).padStart(6)} 2nd diff ${isNaN(d2) ? "   -  " : d2.toFixed(0).padStart(6)} CH ${isNaN(w.ch) ? "  -  " : w.ch.toFixed(0)} DB ${isNaN(w.db) ? " - " : w.db.toFixed(3)} sil ${isNaN(w.sil) ? " - " : w.sil.toFixed(3)} | ${w.det}`); });
  const best = (key, dir) => rows.filter((w) => !isNaN(w[key])).sort((a, b) => dir * (a[key] - b[key]))[0].k;
  console.log(`  picks: CH k=${best("ch", -1)}, DB k=${best("db", 1)}, silhouette k=${best("sil", -1)}`);
  const g = E.gapStat(X, [1, 2, 3, 4, 5, 6, 7, 8], 5, 3);
  let gk = null; for (let i = 0; i < g.length - 1; i++) if (g[i].gap >= g[i + 1].gap - g[i + 1].s) { gk = g[i].k; break; }
  console.log(`  gap: ${g.map((v) => `k${v.k} ${v.gap.toFixed(3)}±${v.s.toFixed(3)}`).join(", ")} -> Tibshirani rule picks k=${gk}`);
}
console.log("== F3 who owns the inertia");
for (const [nm, cfg] of [["raw z", { transform: "none", scaler: "z" }], ["log z", { transform: "log1p", scaler: "z" }]]) {
  const Z = E.pipeline(cfg, R1), tot = Z.reduce((s, x) => s + x.reduce((a, v) => a + v * v, 0), 0);
  const sales = E.idxOf(m1, "extreme").reduce((s, i) => s + Z[i].reduce((a, v) => a + v * v, 0), 0);
  const per = Z.map((x) => x.reduce((a, v) => a + v * v, 0)).sort((a, b) => b - a), top50 = per.slice(0, 50).reduce((s, v) => s + v, 0);
  console.log(`  ${nm}: five house sales hold ${(sales / tot * 100).toFixed(1)}% of total inertia at k=1; top 50 customers ${(top50 / tot * 100).toFixed(1)}%`);
}
console.log("== F4 seeds and restarts (k=5, 8, 10; 40 seeds each)");
for (const k of [5, 8, 10]) for (const nInit of [1, 10]) {
  const fits = Array.from({ length: 40 }, (_, s) => L.kmeans(X, k, 500 + s, nInit));
  const iner = fits.map((f) => f.inertia), best = Math.min(...iner);
  const distinct = new Set(iner.map((v) => v.toFixed(3))).size;
  const al = fits.map((f) => E.top(L.scores(X, f).dist)), ring = al.map((A) => E.caught(m1, A, "mule"));
  let js = []; for (let a = 0; a < 40; a++) for (let b = a + 1; b < 40; b++) js.push(L.jaccard(al[a], al[b]));
  let ar = []; for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++) ar.push(L.ari(fits[a].lab, fits[b].lab));
  console.log(`  k=${k} nInit=${String(nInit).padEnd(2)} distinct optima ${String(distinct).padEnd(2)} worst/best inertia ${(Math.max(...iner) / best).toFixed(3)} ring caught min ${Math.min(...ring)} max ${Math.max(...ring)} mean ${E.mean(ring).toFixed(1)} | alert J mean ${E.mean(js).toFixed(2)} min ${Math.min(...js).toFixed(2)} | ARI mean ${E.mean(ar).toFixed(3)}`);
}
console.log("== F5 back-transformed centroids are geometric means (k=5)");
{ const f = L.kmeans(X, 5, 7, 10), x = E.colOf(R1, 0), lx = x.map(Math.log1p), mu = E.mean(lx), sd = E.sdev(lx);
  for (let c = 0; c < 5; c++) { const ids = f.lab.map((l, i) => (l === c ? i : -1)).filter((i) => i >= 0);
    const back = Math.expm1(f.C[c][0] * sd + mu), arith = E.mean(ids.map((i) => x[i])), med = L.quantile(ids.map((i) => x[i]), 0.5);
    console.log(`  cluster ${c} (n=${ids.length}): centroid back-transformed ${back.toFixed(0)}, arithmetic mean ${arith.toFixed(0)} (x${(arith / back).toFixed(2)}), median ${med.toFixed(0)}`); }
}
console.log("== F6 the ratio feature made the ring cheap (cluster sizes)");
{ const ratio = R1.map((r) => r[4] / r[0]);
  for (const k of [3, 5, 8]) { const Z = E.pipeline({ transform: "log1p", scaler: "z", extraCols: [{ fit: ratio, apply: ratio }] }, R1);
    const f = L.kmeans(Z, k, 7, 10), ring = E.idxOf(m1, "mule"); const c = {}; ring.forEach((i) => (c[f.lab[i]] = (c[f.lab[i]] || 0) + 1));
    const [cl, n] = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; const size = f.lab.filter((l) => l === +cl).length;
    console.log(`  k=${k}: ${n} of the ring share a cluster of ${size}`); }
}
