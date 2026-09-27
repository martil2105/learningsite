// Part V: detector tests - benchmarks, dose-response, remedies.
import * as E from "./ext.mjs"; const L = E.L;
const prof = L.makeProfiles(5000, 11);
const m1 = L.drawMonth(prof, 101), R1 = m1.map((c) => c.x), LOG = { transform: "log1p", scaler: "z" };
const X = E.pipeline(LOG, R1), N = X.length;
const cnt = (A) => `ring ${E.caught(m1, A, "mule")} struct ${E.caught(m1, A, "struct")} sales ${E.caught(m1, A, "extreme")}`;
const auc = (s, kind) => { const pos = E.idxOf(m1, kind), neg = m1.map((c, i) => (c.kind === "normal" ? i : -1)).filter((i) => i >= 0);
  const r = s.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]), rk = new Array(N); r.forEach(([, i], t) => (rk[i] = t + 1));
  const ps = new Set(pos); let sum = 0; pos.forEach((i) => (sum += rk[i])); // rank-sum among pos+neg only
  const sub = [...pos, ...neg].map((i) => [s[i], i]).sort((a, b) => a[0] - b[0]); const rr = new Map(); sub.forEach(([, i], t) => rr.set(i, t + 1));
  let S = 0; pos.forEach((i) => (S += rr.get(i))); return (S - pos.length * (pos.length + 1) / 2) / (pos.length * neg.length); };
console.log("== T1 benchmarks (log z features, top 50)");
const dets = {};
for (const k of [1, 3, 5, 8]) dets[`k-means k=${k}`] = L.scores(X, L.kmeans(X, k, 7, 10)).dist;
dets["global Mahalanobis"] = E.distScores(X, { C: [X[0].map(() => 0)], lab: X.map(() => 0) }, "mahalGlobal");
dets["max |z| (univariate rules)"] = E.maxAbsZ(X);
dets["kNN distance k=5"] = E.knnScore(X, 5);
dets["kNN distance k=30"] = E.knnScore(X, 30);
dets["isolation forest"] = E.iforest(X, 1);
for (const [n, s] of Object.entries(dets)) console.log(`  ${n.padEnd(27)} ${cnt(E.top(s))} | AUC ring ${auc(s, "mule").toFixed(3)} struct ${auc(s, "struct").toFixed(3)} sales ${auc(s, "extreme").toFixed(3)}`);
console.log("== T2 dose-response: structurer monthly cash (k=3)");
for (const amt of [5000, 10000, 20000, 40000, 80000, 160000]) {
  const m = m1.map((c) => (c.kind === "struct" ? { ...c, x: c.x.map((v, j) => (j === 3 ? amt * (v / 38000 > 0 ? v / 38000 : 1) : j === 0 ? v - c.x[3] + amt * (c.x[3] / 38000) : v)) } : c));
  const R = m.map((c) => c.x);
  const row = [["raw z", { transform: "none", scaler: "z" }], ["log z", LOG], ["log(x+10k) z", { transform: "logc", c: 10000, scaler: "z" }], ["rank", { transform: "none", scaler: "rank" }]].map(([nm, cfg]) => {
    const Z = E.pipeline(cfg, R); const A = E.top(L.scores(Z, L.kmeans(Z, 3, 7, 10)).dist); return `${nm} ${E.caught(m, A, "struct")}`; });
  console.log(`  ~${String(amt).padEnd(6)} per month: ${row.join(" | ")}`);
}
console.log("== T2b dose-response: mule senders per month, ring of 20 (log z, k=5)");
for (const s of [3, 6, 10, 15, 22, 30, 40]) {
  const r = L.mulberry32(s); const m = m1.map((c) => (c.kind === "mule" ? { ...c, x: c.x.map((v, j) => (j === 5 ? Math.max(1, L.poisson(r, s)) : v)) } : c));
  const Z = E.pipeline(LOG, m.map((c) => c.x));
  const row = [3, 5, 8].map((k) => `k${k} ${E.caught(m, E.top(L.scores(Z, L.kmeans(Z, k, 7, 10)).dist), "mule")}`);
  console.log(`  senders ~${String(s).padEnd(3)} ${row.join(" | ")}`);
}
console.log("== T3 remedies for masking: k-means-- and trim-and-refit (12 seeds, log z)");
for (const mules of [20, 40]) for (const k of [5, 8, 12]) {
  let a = 0, b = 0, c = 0;
  for (let t = 0; t < 12; t++) {
    const m = L.drawMonth(L.makeProfiles(5000, 1000 + t, { mules, struct: 0, extreme: 0 }), 2000 + t);
    const Z = E.pipeline(LOG, m.map((c) => c.x)), budget = Math.round(0.01 * Z.length);
    const ring = E.idxOf(m, "mule");
    const f = L.kmeans(Z, k, 3000 + t, 10), s0 = L.scores(Z, f).dist; const A0 = L.topK(s0, budget);
    a += ring.filter((i) => A0.has(i)).length / mules;
    const g = E.kmeansMinus(Z, k, budget, 3000 + t, 5); const s1 = Z.map((x, i) => Math.sqrt(L.d2(x, g.C[g.lab[i]]))); const A1 = L.topK(s1, budget);
    b += ring.filter((i) => A1.has(i)).length / mules;
    // trim-and-refit: drop the top 2% of the first pass, refit, score everyone
    const keep = new Set(L.topK(s0, Math.round(0.02 * Z.length))); const Zt = Z.filter((_, i) => !keep.has(i));
    const h = L.kmeans(Zt, k, 3000 + t, 10); const lab = L.assignTo(Z, h.C); const s2 = Z.map((x, i) => Math.sqrt(L.d2(x, h.C[lab[i]]))); const A2 = L.topK(s2, budget);
    c += ring.filter((i) => A2.has(i)).length / mules;
  }
  console.log(`  ring ${mules}, k=${k}: standard ${(a / 12).toFixed(2)}, k-means-- ${(b / 12).toFixed(2)}, trim-and-refit ${(c / 12).toFixed(2)}`);
}
