// Part V: stability and cluster similarity.
import * as E from "./ext.mjs"; const L = E.L;
const prof = L.makeProfiles(5000, 11);
const months = [101, 202, 303].map((s) => L.drawMonth(prof, s));
const m1 = months[0], R1 = m1.map((c) => c.x), LOG = { transform: "log1p", scaler: "z" };
const X = E.pipeline(LOG, R1), N = X.length;
console.log("== S1 how similar are the peer groups under different preprocessing? (k=5, ARI / NMI)");
{ const cfgs = { rawZ: { transform: "none", scaler: "z" }, winsor: { transform: "none", scaler: "z", capQ: 0.99 }, logZ: LOG, rank: { transform: "none", scaler: "rank" }, logRobust: { transform: "log1p", scaler: "robust" } };
  const labs = Object.fromEntries(Object.entries(cfgs).map(([n, c]) => [n, L.kmeans(E.pipeline(c, R1), 5, 7, 10).lab]));
  const ns = Object.keys(labs);
  ns.forEach((a) => console.log("  " + a.padEnd(10) + ns.map((b) => `${L.ari(labs[a], labs[b]).toFixed(2)}/${E.nmi(labs[a], labs[b]).toFixed(2)}`.padStart(11)).join("")));
  // ARI is invariant to relabelling
  const perm = labs.logZ.map((l) => (l + 2) % 5); console.log(`  ARI(labels, permuted labels) = ${L.ari(labs.logZ, perm)}`);
}
console.log("== S2 Hennig clusterwise bootstrap Jaccard (30 bootstraps)");
for (const k of [3, 5, 8]) { const r = E.clusterwiseJaccard(X, k, 30, 7);
  console.log(`  k=${k}: ` + r.jac.map((j, c) => `n=${r.sizes[c]} J=${j.toFixed(2)}`).join(" | ")); }
console.log("== S3 label switching and centroid drift, month 1 -> 2 (refit)");
for (const k of [3, 5, 8]) {
  const X2 = E.pipeline(LOG, months[1].map((c) => c.x));
  const f1 = L.kmeans(X, k, 7, 10), f2 = L.kmeans(X2, k, 7, 10);
  const same = f1.lab.filter((l, i) => l === f2.lab[i]).length / N;
  const rel = E.matchLabels(f1.lab, f2.lab, k), sameM = f1.lab.filter((l, i) => l === rel[i]).length / N;
  const idChanged = [...Array(k).keys()].filter((c) => { const b = f2.lab.findIndex((_, i) => rel[i] === c && f2.lab[i] !== c); return b >= 0; }).length;
  console.log(`  k=${k}: raw label agreement ${(same * 100).toFixed(1)}%, after Hungarian matching ${(sameM * 100).toFixed(1)}%; cluster IDs renumbered ${idChanged} of ${k}; ARI ${L.ari(f1.lab, f2.lab).toFixed(3)}`);
}
console.log("== S4 who switches peer group? assignment margin deciles (k=5, frozen scaling, refit month 2)");
{ const k = 5, f1 = L.kmeans(X, k, 7, 10), X2 = E.pipeline(LOG, R1, months[1].map((c) => c.x)), lab2 = L.assignTo(X2, f1.C);
  const mg = E.margins(X, f1.C), order = mg.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const dec = []; for (let d = 0; d < 10; d++) { const ids = order.slice(Math.floor(d * N / 10), Math.floor((d + 1) * N / 10)).map((t) => t[1]); dec.push(ids.filter((i) => lab2[i] !== f1.lab[i]).length / ids.length); }
  const tot = f1.lab.filter((l, i) => l !== lab2[i]).length / N;
  console.log(`  switch rate by margin decile (lowest first): ${dec.map((v) => (v * 100).toFixed(1) + "%").join(", ")}; overall ${(tot * 100).toFixed(1)}%`);
}
console.log("== S5 whole-population rank stability vs the top 1%");
for (const k of [3, 5, 8]) {
  const f1 = L.kmeans(X, k, 7, 10), X2 = E.pipeline(LOG, R1, months[1].map((c) => c.x)), lab2 = L.assignTo(X2, f1.C);
  const s1 = L.scores(X, f1).dist, s2 = L.scores(X2, { C: f1.C, lab: lab2 }).dist;
  console.log(`  k=${k}: Spearman of scores month 1 vs 2 = ${E.spearman(s1, s2).toFixed(3)}; top-1% overlap J = ${L.jaccard(E.top(s1), E.top(s2)).toFixed(2)}; top-5% J = ${L.jaccard(E.top(s1, 0.05), E.top(s2, 0.05)).toFixed(2)}`);
}
console.log("== S6 persistence: alerted in >= 2 of 3 months (frozen model)");
for (const k of [3, 5, 8]) {
  const f1 = L.kmeans(X, k, 7, 10);
  const al = months.map((m) => { const Xm = E.pipeline(LOG, R1, m.map((c) => c.x)); return E.top(L.scores(Xm, { C: f1.C, lab: L.assignTo(Xm, f1.C) }).dist); });
  const hits = new Map(); al.forEach((A) => A.forEach((i) => hits.set(i, (hits.get(i) || 0) + 1)));
  const once = [...hits].filter(([, v]) => v === 1).map(([i]) => i), pers = [...hits].filter(([, v]) => v >= 2).map(([i]) => i);
  const kinds = (ids) => { const c = {}; ids.forEach((i) => (c[m1[i].kind] = (c[m1[i].kind] || 0) + 1)); return JSON.stringify(c); };
  console.log(`  k=${k}: distinct customers alerted in 3 months ${hits.size}; once only ${once.length} ${kinds(once)}; 2+ months ${pers.length} ${kinds(pers)}`);
}
