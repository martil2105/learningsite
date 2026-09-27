/*
  Re-derives every number the prose quotes, from the same modules the page
  imports, and asserts the sentences around them.

  1. Freshness: scripts/precompute.mjs run() must reproduce src/precomputed.js.
     (Set SKIP_FRESHNESS=1 to skip this one step while iterating on prose; the
     full run takes a few minutes.)
  2. Identities, at machine precision, computed here from the modules.
  3. The sentences, one ok() each, against the precomputed results.
  4. Directional claims that the prose says held in six other months.
*/
import P from "../src/precomputed.js";
import { run } from "../scripts/precompute.mjs";
import * as B from "../src/bank.js";
import * as Pr from "../src/prep.js";
import * as K from "../src/cluster.js";
import * as D from "../src/detect.js";
import * as E from "../src/explain.js";

let pass = 0;
const fails = [];
const ok = (claim, cond, detail = "") => { if (cond) pass++; else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const rel = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b));
const C = (c, ring, struct, sales) => c.ring === ring && c.struct === struct && c.sales === sales;

// ------------------------------------------------------------------ 1. freshness
if (process.env.SKIP_FRESHNESS !== "1") {
  const fresh = JSON.parse(JSON.stringify(run()));
  const stored = JSON.parse(JSON.stringify(P));
  const diffs = [];
  (function walk(a, b, path) {
    if (typeof a !== typeof b) { diffs.push(path); return; }
    if (a && typeof a === "object") { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b?.[k], `${path}.${k}`); return; }
    if (typeof a === "number" ? !(a === b || rel(a, b) < 1e-9) : a !== b) diffs.push(path);
  })(fresh, stored, "P");
  ok("src/precomputed.js is what scripts/precompute.mjs produces today", diffs.length === 0, diffs.slice(0, 8).join(", "));
} else {
  console.log("  (freshness skipped)");
}

// ------------------------------------------------------------------ 2. identities
const M = B.ourMonth(), R = B.rowsOf(M), N = R.length;
const X = Pr.pipeline(Pr.LOG_Z, R);
const f5 = K.kmeans(X, 5, K.FIT_SEED, 10), sc5 = K.scores(X, f5);
{
  ok("our bank has 5,035 customers and a budget of 50 alerts", N === 5035 && B.budgetFor(N) === 50 && P.meta.budget === 50);
  // Ward split gain, exact
  const ring = B.idxOf(M, "mule"), host = f5.lab[ring[0]];
  const members = f5.lab.map((l, i) => (l === host ? i : -1)).filter((i) => i >= 0);
  const A = members.filter((i) => M[i].kind === "mule"), Bn = members.filter((i) => M[i].kind !== "mule");
  const mu = (ids) => X[0].map((_, j) => ids.reduce((s, i) => s + X[i][j], 0) / ids.length);
  const ss = (ids, c) => ids.reduce((s, i) => s + K.d2(X[i], c), 0);
  const gain = ss(members, mu(members)) - ss(A, mu(A)) - ss(Bn, mu(Bn));
  const formula = ((A.length * Bn.length) / (A.length + Bn.length)) * K.d2(mu(A), mu(Bn));
  ok("giving the ring its own centroid lowers inertia by exactly n·m/(n+m)·D²", rel(gain, formula) < 1e-12, `${gain} vs ${formula}`);
  // Huygens: total = within + between, and within is the inertia k-means reports
  const d = K.decomposition(X, f5), T = d.tot.reduce((s, v) => s + v, 0), W = d.within.reduce((s, v) => s + v, 0), Bt = d.between.reduce((s, v) => s + v, 0);
  ok("total spread = within + between, to machine precision", Math.abs(T - W - Bt) / T < 1e-13);
  ok("the within part is the inertia k-means reports", rel(W, f5.inertia) < 1e-12);
  ok("after z-scores the total is exactly N·p = 30,210", rel(T, 30210) < 1e-12 && P.III1.total === 30210 && P.II3.Np === 30210);
  // quota and normalised score
  const pc = K.perCluster(sc5.dist, f5.lab, 0.01), q = new Array(5).fill(0); for (const i of pc) q[f5.lab[i]]++;
  ok("the per-cluster rule gives cluster j exactly ceil(0.01·n_j) alerts", q.every((v, j) => v === Math.ceil(0.01 * sc5.n[j])));
  const ms = new Array(5).fill(0); f5.lab.forEach((l, i) => (ms[l] += sc5.norm[i] ** 2 / sc5.n[l]));
  ok("the normalised score has mean square exactly 1 in every cluster", ms.every((v) => Math.abs(v - 1) < 1e-12));
  ok("…and the precomputed check agrees at k = 3, 5, 8", [3, 5, 8].every((k) => P.IV2.rules[k].quotaOk && P.IV2.rules[k].meanSqDev < 1e-12));
  // per-feature terms and Shapley
  const i0 = ring[0], c0 = f5.C[f5.lab[i0]], tt = E.terms(X[i0], c0);
  ok("the per-feature terms add up to d²", rel(tt.reduce((s, v) => s + v, 0), K.d2(X[i0], c0)) < 1e-12);
  const phi = E.shapley(X[i0], f5.C, f5.lab[i0], false);
  ok("Shapley values of d² with a centroid baseline are the terms (one customer here)", phi.every((v, j) => Math.abs(v - tt[j]) < 1e-12));
  ok("…and over all 50 alerts", P.VI.shapGap < 1e-12);
  // counterfactual: the single-feature fix lands exactly on the threshold
  const t = [...sc5.dist].sort((a, b) => b - a)[49];
  const A50 = [...K.top(sc5.dist)];
  let worst = 0, nFix = 0;
  for (const i of A50) {
    const fx = E.singleFeatureFix(X[i], f5.C[f5.lab[i]], t);
    fx.forEach((v, j) => { if (v === null) return; nFix++; const z = X[i].slice(); z[j] = v; worst = Math.max(worst, Math.abs(Math.sqrt(K.d2(z, f5.C[f5.lab[i]])) - t)); });
  }
  ok("setting one feature to its counterfactual value puts the customer exactly on the threshold", nFix > 0 && worst < 1e-9, `worst ${worst}`);
  ok("moving straight to the centroid clears an alert at t/d of its distance", A50.every((i) => { const s = t / sc5.dist[i]; const z = X[i].map((v, j) => f5.C[f5.lab[i]][j] + s * (v - f5.C[f5.lab[i]][j])); return Math.abs(Math.sqrt(K.d2(z, f5.C[f5.lab[i]])) - t) < 1e-9; }));
  // mean imputation shrinks the sd by sqrt(1 - q), exactly
  ok("mean imputation shrinks the sd by exactly √(1 − q)", Math.abs(P.I4.sdRatio - P.I4.sqrt1q) < 1e-4);
  {
    const mask = B.missingMask(M, 0.15, 21, "mcar"), x = Pr.col(R, 5).map(Math.log1p), obs = x.filter((_, i) => !mask[i]);
    const mu0 = Pr.mean(obs), filled = x.map((v, i) => (mask[i] ? mu0 : v)), qq = mask.filter(Boolean).length / N;
    ok("…to machine precision when computed directly", rel(Pr.sdev(filled), Math.sqrt(1 - qq) * Pr.sdev(obs)) < 1e-12);
  }
  // a z-scored dummy, and the distance between categories
  {
    const fa = B.binaryColumn(M, 0.03, 31), z = Pr.scale("z", fa.map((v) => [v])).X.map((r) => r[0]), p = fa.filter(Boolean).length / N;
    ok("a z-scored flag of prevalence p takes √((1−p)/p) for holders", Math.abs(z[fa.indexOf(1)] - Math.sqrt((1 - p) / p)) < 1e-12 && Math.abs(z[fa.indexOf(0)] + Math.sqrt(p / (1 - p))) < 1e-12);
    ok("the flag's values are 5.98 and −0.17", P.I5.dummyHi === 5.98 && P.I5.dummyLo === -0.17 && P.I5.holders === 137 && near(P.I5.prevalence, 0.0272, 1e-4));
    // two categories a and b: d² between one-hot z-scored customers equals the formula
    const cat = M.map((_, i) => i % 4), oh = [0, 1, 2, 3].map((c) => cat.map((v) => (v === c ? 1 : 0)));
    const Z = Pr.scale("z", cat.map((_, i) => oh.map((col) => col[i]))).X, ps = oh.map((col) => col.filter(Boolean).length / N);
    const ia = cat.indexOf(0), ib = cat.indexOf(3);
    ok("d² between two categories is 1/(p_a(1−p_a)) + 1/(p_b(1−p_b))", rel(K.d2(Z[ia], Z[ib]), 1 / (ps[0] * (1 - ps[0])) + 1 / (ps[3] * (1 - ps[3]))) < 1e-12);
    ok("with product shares 60/31/7/2% the pairs cost 8.86, 54.55 and 65.00", P.I5.product.AB === 8.86 && P.I5.product.AD === 54.55 && P.I5.product.CD === 65);
  }
  // log offset
  ok("the step up from zero under log(x + c) is ln(1 + x/c)", [1, 100, 1000, 10000].every((c) => rel(Math.log(3000 + c) - Math.log(c), Math.log(1 + 3000 / c)) < 1e-12));
  ok("log gaps 8.007 and 2.539; with c = 10,000 the first is 0.262", P.II1.logGap[0] === 8.007 && P.II1.logGap[1] === 2.539 && P.II1.offsets[10000].gap0 === 0.262);
  // cosine and ARI invariances
  const cos = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0) / Math.sqrt(a.reduce((s, v) => s + v * v, 0) * b.reduce((s, v) => s + v * v, 0));
  ok("cosine similarity between a customer and ten times that customer is 1", Math.abs(cos(R[0], R[0].map((v) => 10 * v)) - 1) < 1e-15);
  ok("relabelling clusters leaves the ARI at exactly 1", P.V3.permARI === 1 && K.ari(f5.lab, f5.lab.map((l) => (l + 3) % 5)) === 1);
  // rule of three
  ok("zero findings in 2,995 cases bounds a 0.1% miss rate at 95%", Math.ceil(Math.log(0.05) / Math.log(1 - 0.001)) === 2995 && Math.pow(0.999, 2995) <= 0.05 && Math.pow(0.999, 2994) > 0.05);
  ok("a sample of 100 only rules out about 3%", near(1 - Math.pow(0.05, 1 / 100), 0.03, 0.001));
  // percentile caps commute with the log (up to interpolation between order statistics)
  ok("capping at a percentile before or after the log differs only by interpolation", P.II2.commute < 1e-4);
  ok("z-then-clip and clip-at-3-sd-then-z differ by up to 4.78 sd", P.II2.zclip === 4.78);
}

// ------------------------------------------------------------------ 3. the sentences
// intro and our bank
{
  const s = P.meta.segShare;
  ok("segments are 13.8/51.1/19.3/10.0/5.1%", s.student === 0.1376 && s.salaried === 0.5108 && s.pensioner === 0.1934 && s.high === 0.1001 && s.selfemp === 0.051);
  const ring = B.idxOf(M, "mule"), snd = ring.map((i) => M[i].x[5]), mean = snd.reduce((a, b) => a + b, 0) / snd.length;
  ok("mules have about 26 senders a month", near(mean, 26, 1), mean);
  const cash = B.idxOf(M, "struct").map((i) => M[i].x[3]).sort((a, b) => a - b), med = (cash[4] + cash[5]) / 2;
  ok("structurers pay in about 38,000 a month", near(med, 38000, 1500), med);
  const sales = B.idxOf(M, "extreme").map((i) => M[i].x[0]);
  ok("house sales receive a few million kroner", sales.every((v) => v > 2e6 && v < 5e6));
  ok("mules send 60% abroad", ring.every((i) => near(M[i].x[4] / (M[i].x[0] - M[i].x[3]), 0.6, 1e-12)));
  ok("our starting model catches 13 of the ring, no structurers and all 5 house sales", C(P.II1.byCfg.logZ[5], 13, 0, 5));
}
// I.1 scope
ok("dormant accounts are 7.4% of the table", P.I1.dormantShare === 0.074);
ok("the 400 dormant accounts are a cluster of exactly 400 at every k", [3, 5, 8].every((k) => P.I1.byK[k].dormantCluster === 400));
ok("none of the dormant accounts is flagged", [3, 5, 8].every((k) => P.I1.byK[k].with.dormant === 0));
ok("the spread of log inflow grows from 0.689 to 2.389, ×3.47", P.I1.sdLog[0] === 0.689 && P.I1.sdLog[1] === 2.389 && P.I1.sdRatio === 3.47);
ok("with dormant accounts, no house sale is flagged at k = 3 and 5", P.I1.byK[3].with.sales === 0 && P.I1.byK[5].with.sales === 0 && P.I1.byK[3].without.sales === 5);
ok("a dormant account sits about ten log units below the rest", near(P.I2.feats[0].median && Math.log1p(P.I2.feats[0].median), 10.5, 0.6));
// I.2 shape
{
  const fi = P.I2.feats[0];
  ok("money in: mean 51,437, median 38,346", fi.mean === 51437 && fi.median === 38346);
  ok("the five house sales hold 84.9% of the sum of squares", P.I2.top5ss === 0.849);
  ok("the median customer's raw z-score is −0.125", P.I2.medianZ === -0.125);
  ok("skew drops from 25.72 to 0.29", fi.skew === 25.72 && fi.logSkew === 0.29);
  ok("10.9% pay in cash, 15.3% send money abroad", P.II1.cashShare === 0.109 && near(1 - P.I2.feats[4].zeros, 0.153, 0.0005));
  ok("senders takes 30 distinct values", P.I2.feats[5].distinct === 30);
}
// I.3 window
{
  const b = P.I3.byK;
  ok("one-month overlap is about half, 0.39 at k = 8", b[3].J1 >= 0.45 && b[3].J1 <= 0.6 && b[5].J1 >= 0.45 && b[5].J1 <= 0.6 && b[8].J1 === 0.39);
  ok("three-month overlap is about 0.6 at every k", [3, 5, 8].every((k) => near(b[k].J3, 0.6, 0.05)));
  ok("the ring rises from 13 to 18 at k = 5 with three months", b[5].one.ring === 13 && b[5].three.ring === 18);
  ok("rolling windows overlap 0.67–0.69", Math.min(...[3, 5, 8].map((k) => b[k].Jroll)) === 0.67 && Math.max(...[3, 5, 8].map((k) => b[k].Jroll)) === 0.69);
}
// I.4 missing
{
  ok("about 15% missing (15.1% and 15.2%)", P.I4.mcar.share === 0.151 && P.I4.ring.share === 0.152);
  ok("3 ring members missing at random, 10 on the legacy system", P.I4.mcar.ringMissing === 3 && P.I4.ring.ringMissing === 10);
  ok("no mule with a missing sender count is ever flagged, whatever the fix, at any k", ["mcar", "ring"].every((m) => Object.values(P.I4[m].rows).every((r) => [3, 5, 8].every((k) => r[k].ringMissingCaught === 0))));
  ok("the factor is 0.922 at 15.1% missing, so observed z-scores grow by about 8.5%", near(P.I4.sdRatio, 0.922, 0.0005) && near(1 / P.I4.sdRatio, 1.085, 0.001));
}
// I.5 categories
ok("the flag holders are a cluster of their own at every k", [3, 5, 8].every((k) => P.I5.byK[k].ownCluster));
ok("they take 4, 9 and 12 alerts at k = 3, 5, 8", P.I5.byK[3].holderAlerts === 4 && P.I5.byK[5].holderAlerts === 9 && P.I5.byK[8].holderAlerts === 12);
ok("about 45% of the alert list changes", [3, 5, 8].every((k) => P.I5.byK[k].J >= 0.53 && P.I5.byK[k].J <= 0.57));
ok("product shares are about 60/31/7/2%", near(P.I5.product.shares[0], 0.6, 0.005) && near(P.I5.product.shares[1], 0.31, 0.005) && near(P.I5.product.shares[2], 0.07, 0.005) && near(P.I5.product.shares[3], 0.02, 0.001));
// I.6 quality
ok("own-account movers are 5.4% and take 2 to 4 alerts", P.I6.internalShare === 0.054 && Math.min(...[3, 5, 8].map((k) => P.I6.internal[k].internalAlerts)) === 2 && Math.max(...[3, 5, 8].map((k) => P.I6.internal[k].internalAlerts)) === 4);
ok("December: a frozen model overlaps 0.69 at k = 3; high earners 13 → 19", P.I6.season[3].Jfrozen === 0.69 && P.I6.season[3].frozenNormal.high === 13 && P.I6.season[3].frozenDec.high === 19);
ok("December: a refit leaves the list unchanged", P.I6.season[3].Jrefit === 1 && P.I6.season[5].Jrefit === 1);
// II.1 transforms
{
  const b = P.II1.byCfg;
  ok("k = 3: raw catches 9 structurers and 1 sale", b.rawZ[3].struct === 9 && b.rawZ[3].sales === 1);
  ok("k = 3: log catches all sales and the whole ring but no structurers", C(b.logZ[3], 20, 0, 5));
  ok("k = 3: capping catches the ring and nothing else", C(b.winsorZ[3], 20, 0, 0));
  const J = P.II1.J5.J.flat().filter((v) => v < 1);
  ok("alert lists overlap 0.15–0.37 across transforms at k = 5", Math.min(...J) === 0.15 && Math.max(...J) === 0.37);
  ok("z-scores of cash: −0.35, 2.74, 3.72", P.II1.zCash[0] === -0.35 && P.II1.zCash[1] === 2.74 && P.II1.zCash[2] === 3.72);
  ok("with c = 10,000 all 10 structurers are caught at k = 3", P.II1.offsets[10000][3].struct === 10);
}
// II.2 caps
{
  const n = P.II2.sweep.none, l = P.II2.sweep.log1p;
  ok("a 99.9% cap on raw values catches all five sales at k = 3", n[1].q === 0.999 && n[1].k3.sales === 5);
  ok("at 99.5% the structurers are gone; at 95% the ring falls to 3", n[2].k3.struct === 0 && n[5].k3.ring === 3);
  ok("at k = 5 a 99% cap takes the ring from 13 to 0", n[0].k5.ring === 13 && n[3].k5.ring === 0);
  ok("51 customers tied at the 99th percentile of cash", n[3].ties === 51);
  ok("mean + 3 sd cap: 365,168 with 10 above; 169,894 with 113 above", P.II2.sdCap[0] === 365168 && P.II2.sdCap[1] === 169894 && P.II2.sdCapAbove[0] === 10 && P.II2.sdCapAbove[1] === 113);
  ok("on the logs a tight cap loses the ring as well", l[5].k3.ring === 0);
}
// II.3 scalers
{
  const rows = P.II3.rows, rr = rows.find((r) => r.tr === "none" && r.s === "robust");
  ok("the IQR of cash and money sent abroad is zero", P.II3.iqrCash === 0 && P.II3.iqrIntl === 0 && rr.sc[3] === 1 && rr.sc[4] === 1);
  ok("raw robust scaling: 10 structurers, 0 of the ring at k = 3", rr.k3.struct === 10 && rr.k3.ring === 0);
  ok("the robust scaler divides money in by thousands", rr.sc[0] > 1000);
  ok("raw min–max: 99% of customers in the first 5.9% of the axis", P.II3.minmax99 === 0.059);
  ok("every z column has sum of squares N", P.II3.colSSdev < 1e-8);
}
// II.4 correlation
ok("money in and out correlate at 0.9883", P.II4.corr[0][1] === 0.9883);
ok("participation ratio 4.04", P.II4.participation === 4.04);
{
  const Js = Object.values(P.II4.dups).flatMap((d) => [d[3].J, d[5].J]);
  ok("counting one feature twice changes 28–48% of the list", Math.min(...[P.II4.dups.inflow[3].J, P.II4.dups.inflow[5].J, P.II4.dups.senders[3].J, P.II4.dups.senders[5].J]) === 0.52 && Math.max(...Js) === 0.72);
  ok("senders three times catches the whole ring at k = 5", P.II4.dups["senders ×3"][5].ring === 20);
}
// II.5 PCA
ok("four components keep 89.5% and the ring drops 13 → 6 at k = 5", P.II5.cumVar[3] === 0.895 && P.II5.keep[4][5].ring === 6 && P.II5.keep[6][5].ring === 13);
ok("18.9% of the ring's offset is in PC5", P.II5.ringOffset[4] === 0.189);
ok("the smallest component has variance 0.012 and is money in minus money out", P.II4.eig[5] === 0.012 && Math.abs(P.II4.smallestVec[0] + P.II4.smallestVec[1]) < 0.01 && Math.abs(Math.abs(P.II4.smallestVec[0]) - Math.SQRT1_2) < 0.01);
ok("whitening stretches it by about nine", near(1 / Math.sqrt(P.II4.eig[5]), 9, 0.3));
ok("Mahalanobis alerts: 0.159 vs 0.074 from the typical 0.93", P.IV3.passThrough[0] === 0.159 && P.IV3.passThrough[1] === 0.074);
// II.6 noise
{
  const r = P.II6.rows;
  ok("contrast at k = 3 falls from 2.90 to 1.41", r[0][3].contrast === 2.9 && r[4][3].contrast === 1.41);
  ok("contrast falls with every step of noise", r.every((x, i) => i === 0 || x[3].contrast < r[i - 1][3].contrast));
  ok("at k = 5 the ring falls from 13 to 4", r[0][5].ring === 13 && r[4][5].ring === 4);
}
// II.7 ratio
ok("only 28 ordinary customers send at least 60% abroad", P.II7.othersAbove === 28 && P.II7.ringMin === 0.6);
ok("the ratio takes the ring 13 → 3 at k = 5 and 12 → 3 at k = 8", P.II7.byK[5].without.ring === 13 && P.II7.byK[5].with.ring === 3 && P.II7.byK[8].without.ring === 12 && P.II7.byK[8].with.ring === 3);
ok("all 20 mules share one cluster of 168 at k = 5", P.II7.byK[5].ringTogether === 20 && P.II7.byK[5].sharedCluster === 168);
// III
ok("30,210 = 13,149.45 + 17,060.55", P.III1.within === 13149.45 && P.III1.between === 17060.55);
ok("R²: cash 95.8%, abroad 81.6%, senders 15.4%", P.III1.r2[3] === 0.958 && P.III1.r2[4] === 0.816 && P.III1.r2[5] === 0.154);
ok("raw: sales own 20.3% and the top 50 41.3%; log: 1.1% and 5.6%", P.III2.raw.sales === 0.203 && P.III2.raw.top50 === 0.413 && P.III2.log.sales === 0.011 && P.III2.log.top50 === 0.056);
{
  const s1 = P.III3["8-1"], s10 = P.III3["8-10"], a = P.III3["5-10"], t = P.III3["10-10"];
  ok("one start at k = 8: 37 answers from 40 seeds, ring 0 to 20, overlap 0.18 at worst", s1.distinct === 37 && Math.min(...s1.ring) === 0 && Math.max(...s1.ring) === 20 && s1.Jmin === 0.18);
  ok("ten starts fix k = 5", new Set(a.ring).size === 1 && a.Jmin === 1);
  ok("ten starts almost fix k = 8", s10.Jmean >= 0.95 && s10.ring.filter((v) => v === 12).length >= 38);
  ok("at k = 10 most seeds catch 17 and some catch none", t.ring.filter((v) => v === 17).length > 30 && t.ring.includes(0));
}
{
  const pk = P.III4.picks, rows = P.III4.rows;
  ok("elbow 2, CH 4, silhouette 4, DB 7, gap 1", pk.elbow === 2 && pk.ch === 4 && pk.sil === 4 && pk.db === 7 && pk.gap === 1);
  ok("ring: 20 at k = 3, 12 at k = 4, at most 1 from k = 10", rows[2].c.ring === 20 && rows[3].c.ring === 12 && rows.slice(9).every((r) => r.c.ring <= 1));
}
// IV.1
{
  const g = P.IV1.grid;
  ok("k = 8: lone mule 100%, ring of 20 76%, ring of 40 23%", g["1-8"].rec === 1 && g["20-8"].rec === 0.76 && g["40-8"].rec === 0.23);
  ok("k = 12: ring of 20 10%", g["20-12"].rec === 0.1);
  ok("every line falls as the ring grows (from 10 mules on)", [3, 5, 8, 12].every((k) => g[`10-${k}`].rec >= g[`20-${k}`].rec && g[`20-${k}`].rec >= g[`40-${k}`].rec));
  ok("larger k falls first", g["20-12"].rec <= g["20-8"].rec && g["20-8"].rec <= g["20-5"].rec && g["20-5"].rec <= g["20-3"].rec);
  ok("saving 903 at k = 8 and 370 at k = 12; about 49 and about 23 mules", P.IV1.mstar[8].dI === 903 && P.IV1.mstar[12].dI === 370 && Math.round(P.IV1.mstar[8].m) === 49 && Math.round(P.IV1.mstar[12].m) === 23);
  ok("raw z: the sales are a cluster of exactly 5 at every k tried", [3, 5, 8, 12].every((k) => P.IV1.salesCluster[k] === 5));
  ok("the two-feature view shows the same collapse for a ring of 40", Object.values(P.IV1.two).every((v) => v <= 0.25));
}
// IV.2
ok("k = 5: per-cluster and normalised catch 3 of the ring; global 13", P.IV2.rules[5].perCluster.ring === 3 && P.IV2.rules[5].normalised.ring === 3 && P.IV2.rules[5].global.ring === 13);
ok("the small-cluster rule catches nobody", [3, 5, 8].every((k) => P.IV2.rules[k].small.size === 0));
ok("salaried get no alerts; self-employed 5.1% → 36%", !P.IV2.segAlerts.salaried && P.IV2.segAlerts.selfemp === 18 && P.meta.segShare.selfemp === 0.051);
// IV.3
{
  const d = P.IV3.dist, js = [3, 5, 8].flatMap((k) => ["manhattan", "chebyshev", "mahalGlobal"].map((n) => d[k][n].J));
  ok("overlap with Euclidean 0.41–0.64 for Manhattan, Chebyshev, global Mahalanobis", Math.min(...js) === 0.41 && Math.max(...js) === 0.64);
  ok("Chebyshev catches the whole ring at k = 5", d[5].chebyshev.ring === 20);
  ok("cosine catches nothing we planted", [3, 5, 8].every((k) => C(d[k].cosine, 0, 0, 0)));
  ok("per-cluster Mahalanobis undefined for 48% at k = 3 and 65% at k = 5", d[3].mahalCluster.undefinedShare === 0.48 && near(d[5].mahalCluster.undefinedShare, 0.65, 0.005));
  ok("…because clusters have a constant cash column", P.IV3.constant[3].some((c) => c.feats.includes("cashIn")) && P.IV3.constant[5].some((c) => c.feats.includes("cashIn")));
}
// IV.4
{
  const iso = Object.values(P.IV4.chi).map((c) => c.iso), full = Object.values(P.IV4.chi).map((c) => c.full);
  ok("chi-square cut flags 4.8%–5.8%", near(Math.min(...iso), 0.048, 0.0005) && near(Math.max(...iso), 0.058, 0.0005));
  ok("full covariance, where defined, about 3% to 4%", Math.min(...full) >= 0.029 && Math.max(...full) <= 0.04);
}
// V.1 dose
{
  const s = P.V1.struct;
  ok("raw starts catching at about 20,000 (5 of 10)", s[10000].rawZ === 0 && s[20000].rawZ === 5);
  ok("log(x + 10,000) catches 8 at 20,000", s[20000].log10k === 8);
  ok("log(1 + x) catches no structurer at any amount", Object.values(s).every((r) => r.logZ === 0));
  const d = P.V1.senders;
  ok("k = 3: about 15 senders is mostly caught (11); k = 8 needs about 30 (14)", d[15][3] === 11 && d[22][8] < 10 && d[30][8] === 14);
}
// V.2 benchmarks
{
  const by = Object.fromEntries(P.V2.dets.map((d) => [d.name, d]));
  const tot = (d) => d.ring + d.struct + d.sales;
  ok("one-feature rules: 20 ring, 9 structurers, 5 sales", C(by.maxz, 20, 9, 5));
  ok("…more than any k-means setting", ["kmeans1", "kmeans3", "kmeans5", "kmeans8"].every((n) => tot(by[n]) < tot(by.maxz)));
  ok("5th neighbour catches none of the ring", by.knn5.ring === 0);
  ok("structurer AUC 0.951 at k = 1, 0.617 at k = 3", by.kmeans1.aucStruct === 0.951 && by.kmeans3.aucStruct === 0.617);
  ok("ring AUC ≥ 0.99 for almost every detector, with 12 to 20 caught", P.V2.dets.filter((d) => d.aucRing >= 0.99).length >= 7 && by.kmeans1.aucRing >= 0.99 && by.kmeans1.ring === 12);
}
// V.3–V.6
{
  const a = P.V3.ari, off = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (!(i === 2 && j === 4)) off.push(a[i][j]);
  ok("log pair ARI 0.69, others 0.11–0.47", a[2][4] === 0.69 && Math.min(...off) === 0.11 && Math.max(...off) === 0.47);
  const h = P.V4.hen;
  ok("Hennig: k = 3 and 5 all between 0.87 and 0.99", [...h[3].jac, ...h[5].jac].every((v) => v >= 0.87 && v <= 0.99));
  ok("Hennig: k = 8 all but one above 0.75", h[8].jac.filter((v) => v < 0.75).length === 1);
  const sw = P.V5.sw;
  ok("raw label agreement 38.2%, 3.0%, 9.3%", sw[3].raw === 0.382 && sw[5].raw === 0.03 && sw[8].raw === 0.093);
  ok("matched 94.9%, 88.9%, 79.2%; ARI 0.824, 0.732, 0.577", sw[3].matched === 0.949 && sw[5].matched === 0.889 && sw[8].matched === 0.792 && sw[3].ari === 0.824 && sw[5].ari === 0.732 && sw[8].ari === 0.577);
  ok("45.1% of the closest tenth switch, 0.4% of the clearest", P.V5.deciles[0] === 0.451 && P.V5.deciles[9] === 0.004);
  ok("switching falls with the margin", P.V5.deciles.every((v, i) => i === 0 || v <= P.V5.deciles[i - 1]));
  const rk = P.V5.rank, sp = [3, 5, 8].map((k) => rk[k].spearman), j1 = [3, 5, 8].map((k) => rk[k].J1);
  ok("rank correlation 0.69–0.79, top-1% overlap 0.43–0.54", near(Math.min(...sp), 0.69, 0.005) && near(Math.max(...sp), 0.79, 0.005) && Math.min(...j1) === 0.43 && Math.max(...j1) === 0.54);
  ok("refit vs frozen moves the overlap by only a few hundredths", [3, 5, 8].every((k) => Math.abs(rk[k].J1 - rk[k].Jrefit) <= 0.05));
  const p3 = P.V6.pers[3];
  ok("k = 3: 75 customers; 32 once including all 5 sales; 43 twice or more including the whole ring", p3.distinct === 75 && p3.once.sales + p3.once.other + p3.once.ring === 32 && p3.once.sales === 5 && p3.twoPlus.ring === 20 && p3.twoPlus.ring + p3.twoPlus.other === 43);
  ok("persistence can't recover the structurers", [3, 5, 8].every((k) => P.V6.pers[k].twoPlus.struct === 0));
}
// V.7
ok("k-means--: ring of 20 at k = 12 65% vs 10%; ring of 40 at k = 8 66% vs 23%; ring of 40 at k = 12 17%", P.V7["20-12"].minus === 0.65 && P.V7["20-12"].standard === 0.1 && P.V7["40-8"].minus === 0.66 && P.V7["40-8"].standard === 0.23 && P.V7["40-12"].minus === 0.17);
ok("trimming and refitting helps less than k-means-- where masking is strong", P.V7["20-12"].trim < P.V7["20-12"].minus && P.V7["40-8"].trim < P.V7["40-8"].minus);
ok("…and about as well where it is mild (k = 5)", Math.abs(P.V7["20-5"].trim - P.V7["20-5"].minus) <= 0.05 && Math.abs(P.V7["40-5"].trim - P.V7["40-5"].minus) <= 0.05);
ok("percentile cap before or after the log: same; clip at 3 sd depends on order", P.II2.commute < 1e-4 && P.II2.zclip > 1);
// VI
{
  const v = P.VI;
  ok("senders is the top term for 26 alerts, money in 8, cash 7", v.topCount[5] === 26 && v.topCount[0] === 8 && v.topCount[3] === 7);
  ok("30 alerts have one feature above half, 15 above 80%", v.over50 === 30 && v.over80 === 15);
  ok("re-assigning: Shapley differs for 12, top reason changes for 2", v.reassignDiff === 12 && v.topChange === 2);
  const cash = v.examples.find((e) => e.tag === "cash");
  ok("the cash user is one whose top reason changes", cash && cash.terms.indexOf(Math.max(...cash.terms)) !== cash.shapReassign.indexOf(Math.max(...cash.shapReassign)));
  ok("ordinary average of money in is 1.05–1.26× the centroid", Math.min(...v.geo.map((g) => g.ratio)) === 1.05 && Math.max(...v.geo.map((g) => g.ratio)) === 1.26);
  const ab = v.examples.find((e) => e.tag === "abroad");
  ok("the big sender abroad's peer centroid for money sent abroad is 2 kroner", ab && ab.peer[4] === 2);
  ok("44 of 50 alerts can be cleared by one feature", v.oneFix === 44);
  const ring = v.examples.find((e) => e.tag === "ring");
  ok("the ring member would need 22.8 senders instead of 41, peers about 2", ring.raw[5] === 41 && ring.fix[5] === 22.8 && ring.peer[5] === 2);
  ok("tree fidelity 72.3% at depth 2 (one group never predicted) and 82.4% at depth 3", v.fidelity[1] === 0.723 && v.fidelity[2] === 0.824 && new Set(v.trees[2].map((r) => r.leaf)).size === 4);
  const I = v.importance, order = (a) => a.map((x, i) => [x, i]).sort((p, q) => q[0] - p[0]).map(([, i]) => i);
  ok("R² puts cash and abroad first", order(I.r2).slice(0, 2).sort().join() === "3,4");
  ok("alert share puts senders first", order(I.share)[0] === 5);
  ok("permutation puts senders first and cash second", order(I.perm)[0] === 5 && order(I.perm)[1] === 3);
  ok("drop-and-refit puts abroad level with senders at the top", I.drop[4] === I.drop[5] && I.drop[4] === Math.max(...I.drop));
}
// ------------------------------------------------------------------ 4. six other months
{
  const rows = P.robust;
  ok("six other months were tried", rows.length === 6);
  ok("log z catches no structurer at k = 3, 5, 8 in all six", rows.every((r) => r.logStruct.every((v) => v === 0)));
  ok("the foreign-address flag gets its own cluster in all six", rows.every((r) => r.faOwn));
  ok("mules with a missing sender count are never flagged in all six", rows.every((r) => r.ringMissingCaught === 0 && r.ringMissing > 0));
  ok("per-cluster Mahalanobis is undefined for over 60% at k = 5 in all six", rows.every((r) => r.mahalUndefined > 0.6));
  ok("one-feature rules catch more planted customers than the best k-means in all six", rows.every((r) => r.maxz.ring + r.maxz.struct + r.maxz.sales > r.kmBest));
}

console.log(fails.length ? fails.map((f) => `  FAIL ${f}`).join("\n") : "");
if (fails.length) { console.log(`\n${fails.length} CHECKS FAILED, ${pass} passed`); process.exit(1); }
console.log(`ALL ${pass} CHECKS PASS`);
