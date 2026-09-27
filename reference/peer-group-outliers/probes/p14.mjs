// Part IV: distances, scores, calibration.
import * as E from "./ext.mjs"; const L = E.L;
const prof = L.makeProfiles(5000, 11);
const m1 = L.drawMonth(prof, 101), R1 = m1.map((c) => c.x);
const X = E.pipeline({ transform: "log1p", scaler: "z" }, R1), N = X.length;
const cnt = (A) => `ring ${E.caught(m1, A, "mule")} struct ${E.caught(m1, A, "struct")} sales ${E.caught(m1, A, "extreme")}`;
console.log("== X1 same clustering, different distances");
for (const k of [3, 5, 8]) {
  const f = L.kmeans(X, k, 7, 10), sets = {};
  for (const kind of ["euclid", "manhattan", "chebyshev", "cosine", "mahalGlobal", "mahalCluster"]) {
    const s = E.distScores(X, f, kind, R1); sets[kind] = E.top(s);
    console.log(`  k${k} ${kind.padEnd(12)} ${cnt(sets[kind])}${s.some(Number.isNaN) ? " (singular cluster covariance)" : ""}`);
  }
  const ks = Object.keys(sets); console.log("    overlap (J) vs euclid: " + ks.map((a) => `${a} ${L.jaccard(sets.euclid, sets[a]).toFixed(2)}`).join(", "));
}
{ // cosine is blind to volume: a customer scaled by lambda has cosine distance 0 to himself
  const x = R1[0].map(Math.log1p), y = R1[0].map((v) => v * 10), ly = y.map(Math.log1p);
  const cos = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0) / Math.sqrt(a.reduce((s, v) => s + v * v, 0) * b.reduce((s, v) => s + v * v, 0));
  console.log(`  cosine(x, 10x) in raw units = ${cos(R1[0], y).toFixed(15)}; in log1p units = ${cos(x, ly).toFixed(4)}`);
}
{ // where Mahalanobis looks: the inflow-outflow direction has variance 0.012
  const f = L.kmeans(X, 5, 7, 10), s = E.distScores(X, f, "mahalGlobal"), A = E.top(s);
  const ratio = R1.map((r) => r[1] / r[0]); const ratAll = E.mean(ratio.map((v) => Math.abs(v - 0.93)));
  const ratA = E.mean([...A].map((i) => Math.abs(ratio[i] - 0.93)));
  console.log(`  global Mahalanobis alerts: mean |pass-through - 0.93| ${ratA.toFixed(3)} vs population ${ratAll.toFixed(3)}`);
  // singular cluster covariance: raw z, k=3 has a cluster of 5 house sales
  const Z = E.pipeline({ transform: "none", scaler: "z" }, R1), g = L.kmeans(Z, 3, 7, 5), sz = [0, 1, 2].map((c) => g.lab.filter((l) => l === c).length);
  const sc = E.distScores(Z, g, "mahalCluster"); console.log(`  raw z k=3 cluster sizes ${sz.join(",")}; per-cluster Mahalanobis undefined for ${sc.filter(Number.isNaN).length} customers (a cluster of 5 in 6 dimensions)`);
}
console.log("== X3 chi-square calibration: share of customers with d² / (cluster variance per dim) above chi2_6(0.99)=16.812");
for (const k of [1, 3, 5, 8]) {
  const f = L.kmeans(X, k, 7, 10), sc = L.scores(X, f), p = 6;
  // per-cluster isotropic variance sigma² = rms²/p ; statistic = d²/sigma²
  const stat = sc.dist.map((d, i) => (d * d) / (sc.rms[f.lab[i]] ** 2 / p));
  const ex = stat.filter((v) => v > 16.812).length / N;
  const mStat = sc.dist.map((d, i) => d); const mh = E.distScores(X, f, "mahalCluster").map((v) => v * v);
  const ex2 = mh.filter((v) => v > 16.812).length / N;
  console.log(`  k=${k}: isotropic ${(ex * 100).toFixed(2)}% ; full per-cluster covariance ${(ex2 * 100).toFixed(2)}% (nominal 1%)`);
}
console.log("== S0 score rules (recap with k=3,5,8, log z)");
for (const k of [3, 5, 8]) {
  const { f, sc } = E.fitScore(X, k);
  const g = E.top(sc.dist), pc = L.perCluster(sc.dist, f.lab, 0.01), nm = E.top(sc.norm);
  const small = new Set(f.lab.map((l, i) => (sc.n[l] < 0.01 * N ? i : -1)).filter((i) => i >= 0));
  const comb = new Set([...E.top(sc.dist, 0.008), ...small]);
  console.log(`  k${k}: global ${cnt(g)} | per-cluster ${cnt(pc)} (${pc.size} alerts) | normalised ${cnt(nm)} | small-cluster ${cnt(small)} (${small.size})`);
}
