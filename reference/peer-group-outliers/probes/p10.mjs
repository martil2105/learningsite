// Part I: the input data.
import * as E from "./ext.mjs"; const L = E.L;
const prof = L.makeProfiles(5000, 11);
const m1 = L.drawMonth(prof, 101);
const R = (m) => m.map((c) => c.x);
const LOG = { transform: "log1p", scaler: "z" };
const kinds = (m, S) => JSON.stringify(L.kindsOf(m, S)) ;
function run(m, cfg, ks = [3, 5, 8]) {
  const X = E.pipeline(cfg, R(m));
  return ks.map((k) => { const { f, sc } = E.fitScore(X, k); const A = E.top(sc.dist); 
    const c = {}; for (const i of A) c[m[i].kind] = (c[m[i].kind] || 0) + 1; return `k${k} ${JSON.stringify(c)} sizes ${[...sc.n].sort((a,b)=>a-b).join(",")}`; });
}
console.log("== D1 dormant accounts (400 added)");
const md = E.addDormant(m1, 400, 9);
console.log(" without:", run(m1, LOG).join(" | "));
console.log(" with   :", run(md, LOG).join(" | "));
console.log(" with rawZ:", run(md, { transform: "none", scaler: "z" }).join(" | "));

console.log("== D3 own-account transfers (5% of ordinary customers)");
const mi = E.addInternal(m1, 0.05, 13);
const nInt = mi.filter((c) => c.internal).length;
for (const k of [3, 5, 8]) { const X = E.pipeline(LOG, R(mi)); const { sc } = E.fitScore(X, k); const A = E.top(sc.dist);
  const ints = [...A].filter((i) => mi[i].internal).length; console.log(` k${k}: internal-transfer customers ${nInt} (${(nInt / mi.length * 100).toFixed(1)}%), alerts to them ${ints}/50, ring ${E.caught(mi, A, "mule")}/20`); }

console.log("== D5 heavy tails (raw inflow)");
{ const x = E.colOf(R(m1), 0), n = x.length, mu = E.mean(x), sd = E.sdev(x);
  const sk = x.reduce((s, v) => s + ((v - mu) / sd) ** 3, 0) / n, ku = x.reduce((s, v) => s + ((v - mu) / sd) ** 4, 0) / n;
  const ss = x.map((v) => (v - mu) ** 2).sort((a, b) => b - a), tot = ss.reduce((s, v) => s + v, 0);
  const top5 = ss.slice(0, 5).reduce((s, v) => s + v, 0) / tot, top50 = ss.slice(0, 50).reduce((s, v) => s + v, 0) / tot;
  const med = L.quantile(x, 0.5);
  console.log(` skew ${sk.toFixed(1)}, kurtosis ${ku.toFixed(0)}, mean ${mu.toFixed(0)}, median ${med.toFixed(0)}, sd ${sd.toFixed(0)}; top 5 hold ${(top5 * 100).toFixed(1)}% of the sum of squares, top 50 ${(top50 * 100).toFixed(1)}%; median customer raw z ${((med - mu) / sd).toFixed(3)}`);
  const lx = x.map(Math.log1p), lmu = E.mean(lx), lsd = E.sdev(lx), lsk = lx.reduce((s, v) => s + ((v - lmu) / lsd) ** 3, 0) / n;
  console.log(` log1p inflow skew ${lsk.toFixed(2)}`);
  for (let j = 0; j < 6; j++) { const c = E.colOf(R(m1), j); console.log(`   ${L.FEATURES[j].padEnd(8)} zeros ${(c.filter((v) => v === 0).length / n * 100).toFixed(1)}%, distinct ${new Set(c).size}, p50 ${L.quantile(c, .5).toFixed(0)}, p99 ${L.quantile(c, .99).toFixed(0)}, max ${Math.max(...c).toFixed(0)}`); }
}
console.log("== D2 aggregation window");
{ const months = [101, 202, 303, 404, 505, 606].map((s) => L.drawMonth(prof, s));
  const avg = (ms) => ms[0].map((c, i) => ({ ...c, x: c.x.map((_, j) => E.mean(ms.map((m) => m[i].x[j]))) }));
  for (const k of [3, 5, 8]) {
    const alerts = (m) => { const X = E.pipeline(LOG, R(m)); const { sc } = E.fitScore(X, k); return E.top(sc.dist); };
    const a1 = alerts(months[0]), a2 = alerts(months[1]);
    const w1 = alerts(avg(months.slice(0, 3))), w2 = alerts(avg(months.slice(3, 6))), wr = alerts(avg(months.slice(1, 4)));
    console.log(` k${k}: 1-month consecutive J ${L.jaccard(a1, a2).toFixed(2)}; 3-month non-overlapping J ${L.jaccard(w1, w2).toFixed(2)}; 3-month rolling (shift 1) J ${L.jaccard(w1, wr).toFixed(2)}; ring 1m ${E.caught(months[0], a1, "mule")} 3m ${E.caught(months[0], w1, "mule")}; struct 1m ${E.caught(months[0], a1, "struct")}`);
  }
}
