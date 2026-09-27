// Part I continued: missing values, categorical attributes, seasonality, scope scaling.
import * as E from "./ext.mjs"; const L = E.L;
const prof = L.makeProfiles(5000, 11);
const m1 = L.drawMonth(prof, 101), R1 = m1.map((c) => c.x);
const LOG = { transform: "log1p", scaler: "z" };
console.log("== D1b: why dormant accounts move everything: sd of log inflow");
{ const md = E.addDormant(m1, 400, 9); const a = E.colOf(R1, 0).map(Math.log1p), b = E.colOf(md.map((c) => c.x), 0).map(Math.log1p);
  console.log(` sd log inflow ${E.sdev(a).toFixed(3)} -> ${E.sdev(b).toFixed(3)} (x${(E.sdev(b) / E.sdev(a)).toFixed(2)}); mean ${E.mean(a).toFixed(2)} -> ${E.mean(b).toFixed(2)}`); }

console.log("== D4 missing 'senders' (col 5)");
for (const mech of ["mcar", "ring"]) {
  const mask = E.missingMask(m1, 0.15, 21, mech);
  const q = mask.filter(Boolean).length / mask.length, ringMissing = E.idxOf(m1, "mule").filter((i) => mask[i]).length;
  console.log(` mechanism ${mech}: ${(q * 100).toFixed(1)}% missing; ring members missing ${ringMissing}/20`);
  for (const imp of ["median", "mean", "zero", "indicator", "drop"]) {
    const row = [];
    for (const k of [3, 5, 8]) {
      let A, X;
      if (imp === "drop") {
        const keep = m1.map((_, i) => i).filter((i) => !mask[i]);
        X = E.pipeline(LOG, keep.map((i) => R1[i]));
        const { sc } = E.fitScore(X, k); const At = E.top(sc.dist, 50 / X.length);
        A = new Set([...At].map((t) => keep[t]));
      } else {
        X = E.pipeline({ ...LOG, impute: imp, missing: { j: 5, maskFit: mask, maskApply: mask } }, R1);
        const { sc } = E.fitScore(X, k); A = E.top(sc.dist);
      }
      const ringAll = E.caught(m1, A, "mule");
      const ringMiss = E.idxOf(m1, "mule").filter((i) => mask[i] && A.has(i)).length;
      const imputedAlerts = [...A].filter((i) => mask[i]).length;
      row.push(`k${k} ring ${ringAll}/20 (missing ones ${ringMiss}/${ringMissing}) alerts on imputed ${imputedAlerts}`);
    }
    console.log(`   ${imp.padEnd(9)} ${row.join(" | ")}`);
  }
}
{ // exact: mean imputation shrinks sd by sqrt(1-q)
  const mask = E.missingMask(m1, 0.15, 21, "mcar"), x = E.colOf(R1, 5).map(Math.log1p);
  const obs = x.filter((_, i) => !mask[i]), mu = E.mean(obs), filled = x.map((v, i) => (mask[i] ? mu : v));
  const q = mask.filter(Boolean).length / mask.length;
  console.log(` mean-imputed sd / observed sd = ${(E.sdev(filled) / E.sdev(obs)).toFixed(6)} ; sqrt(1-q) = ${Math.sqrt(1 - q).toFixed(6)}`);
}
console.log("== D7 categorical attributes");
{ const fa = E.binaryColumn(m1, 0.03, 31), p = fa.filter(Boolean).length / fa.length;
  console.log(` foreign address prevalence ${(p * 100).toFixed(2)}%: z-scored dummy = ${Math.sqrt((1 - p) / p).toFixed(3)} for holders, ${(-Math.sqrt(p / (1 - p))).toFixed(3)} otherwise`);
  for (const k of [3, 5, 8]) {
    const X = E.pipeline({ ...LOG, extraCols: [{ fit: fa, apply: fa }], noTransformCols: [6] }, R1);
    const { sc, f } = E.fitScore(X, k), A = E.top(sc.dist);
    const nfa = [...A].filter((i) => fa[i]).length;
    const base = E.top(E.fitScore(E.pipeline(LOG, R1), k).sc.dist);
    console.log(`  k${k}: alerts to foreign-address holders ${nfa}/50 (they are ${(p * 100).toFixed(1)}%); ring ${E.caught(m1, A, "mule")}/20 (without the column ${E.caught(m1, base, "mule")}); overlap with no-column list J ${L.jaccard(A, base).toFixed(2)}; does a cluster split on it? sizes ${[...sc.n].sort((a, b) => a - b).join(",")}`);
  }
  // multi-category product code, one-hot z-scored
  const r = L.mulberry32(41), shares = [0.6, 0.3, 0.08, 0.02];
  const cat = m1.map(() => { let u = r(); for (let c = 0; c < 4; c++) { if (u < shares[c]) return c; u -= shares[c]; } return 3; });
  const oh = [0, 1, 2, 3].map((c) => cat.map((v) => (v === c ? 1 : 0)));
  const ps = oh.map((col) => col.filter(Boolean).length / col.length);
  const d2 = (a, b) => 1 / (ps[a] * (1 - ps[a])) + 1 / (ps[b] * (1 - ps[b]));
  console.log(`  product one-hot, prevalences ${ps.map((v) => (v * 100).toFixed(1) + "%").join(", ")}: raw one-hot distance² between any two different products = 2; z-scored: A-B ${d2(0, 1).toFixed(2)}, A-D ${d2(0, 3).toFixed(2)}, C-D ${d2(2, 3).toFixed(2)}`);
  for (const k of [5]) {
    const X = E.pipeline({ ...LOG, extraCols: oh.map((c) => ({ fit: c, apply: c })), noTransformCols: [6, 7, 8, 9] }, R1);
    const { sc } = E.fitScore(X, k), A = E.top(sc.dist);
    const byCat = [0, 1, 2, 3].map((c) => [...A].filter((i) => cat[i] === c).length);
    console.log(`  k${k}: alerts by product ${byCat.join(",")} ; ring ${E.caught(m1, A, "mule")}/20`);
  }
}
console.log("== D8 seasonality: December, everyone's flows x1.3");
{ const m2 = L.drawMonth(prof, 202), dec = m2.map((c) => ({ ...c, x: c.x.map((v, j) => (j <= 1 ? v * 1.3 : v)) }));
  for (const k of [3, 5]) {
    const X1 = E.pipeline(LOG, R1); const { f } = E.fitScore(X1, k);
    const frozen = (m) => { const X = E.pipeline(LOG, R1, m.map((c) => c.x)); const lab = L.assignTo(X, f.C); return E.top(L.scores(X, { C: f.C, lab }).dist); };
    const refit = (m) => { const X = E.pipeline(LOG, m.map((c) => c.x)); return E.top(E.fitScore(X, k).sc.dist); };
    const fN = frozen(m2), fD = frozen(dec), rN = refit(m2), rD = refit(dec);
    const segs = (S) => { const c = {}; for (const i of S) c[m1[i].seg] = (c[m1[i].seg] || 0) + 1; return JSON.stringify(c); };
    console.log(`  k${k}: frozen model normal month vs December J ${L.jaccard(fN, fD).toFixed(2)}; refit J ${L.jaccard(rN, rD).toFixed(2)}`);
    console.log(`     frozen Dec alerts ${segs(fD)}\n     frozen normal     ${segs(fN)}`);
  }
}
