import * as E from "./ext.mjs"; const L = E.L;
const m1 = L.drawMonth(L.makeProfiles(5000, 11), 101), R1 = m1.map((c) => c.x);
const X = E.pipeline({ transform: "log1p", scaler: "z" }, R1), N = X.length;
for (const k of [3, 5, 8]) {
  const f = L.kmeans(X, k, 7, 10), s = E.distScores(X, f, "mahalCluster");
  const nan = s.filter(Number.isNaN).length;
  const consts = [];
  for (let c = 0; c < k; c++) { const ids = f.lab.map((l, i) => (l === c ? i : -1)).filter((i) => i >= 0);
    const cf = [0,1,2,3,4,5].filter((j) => new Set(ids.map((i) => X[i][j])).size === 1).map((j) => L.FEATURES[j]); if (cf.length) consts.push(`cluster of ${ids.length}: constant ${cf.join("+")}`); }
  // fixed ranking: NaN customers excluded
  const ok = s.map((v) => (Number.isNaN(v) ? -Infinity : v)), A = E.top(ok);
  console.log(`k${k}: per-cluster Mahalanobis undefined for ${nan} of ${N} (${(nan / N * 100).toFixed(1)}%); ${consts.join("; ")}; among the rest: ring ${E.caught(m1, A, "mule")} sales ${E.caught(m1, A, "extreme")}`);
  const mh = s.filter((v) => !Number.isNaN(v)).map((v) => v * v); console.log(`   chi2 exceedance among defined: ${(mh.filter((v) => v > 16.812).length / mh.length * 100).toFixed(2)}%`);
}
