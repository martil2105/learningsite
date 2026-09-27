// Plan-time assertions for the peer-group-outliers pass-1 spec.
// Every number the spec quotes is re-derived here. Run: node plan-probes.mjs [--slow]
// Single-draw numbers are marked SINGLE in the spec and must be averaged over
// seeds in the article's own pass 1 before any of them reaches prose.
import * as L from "./lib.mjs";
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

const prof = L.makeProfiles(5000, 11);
const m1 = L.drawMonth(prof, 101), m2 = L.drawMonth(prof, 202);
const R1 = m1.map((c) => c.x), R2 = m2.map((c) => c.x);
const N = R1.length, budget = Math.round(0.01 * N);
ok(N === 5035 && budget === 50, `population 5,035, budget 50 (got ${N}, ${budget})`);

console.log("\n1. Identities");
const X = L.TRANSFORMS.logZ(R1, R1);
{ // Ward split gain: n m/(n+m) |muA - muB|^2, exact
  const f = L.kmeans(X, 5, 7, 10);
  const mules = m1.map((c, i) => (c.kind === "mule" ? i : -1)).filter((i) => i >= 0);
  const host = f.lab[mules[0]];
  const members = f.lab.map((l, i) => (l === host ? i : -1)).filter((i) => i >= 0);
  const A = members.filter((i) => m1[i].kind === "mule"), B = members.filter((i) => m1[i].kind !== "mule");
  const mu = (ids) => X[0].map((_, j) => ids.reduce((s, i) => s + X[i][j], 0) / ids.length);
  const ss = (ids, c) => ids.reduce((s, i) => s + L.d2(X[i], c), 0);
  const gain = ss(members, mu(members)) - ss(A, mu(A)) - ss(B, mu(B));
  const formula = (A.length * B.length) / (A.length + B.length) * L.d2(mu(A), mu(B));
  ok(Math.abs(gain - formula) / formula < 1e-10, `split gain equals n·m/(n+m)·D² (rel err ${(Math.abs(gain - formula) / formula).toExponential(1)})`);
  // normalised score: mean norm^2 = 1 in every cluster
  const sc = L.scores(X, f), mn = new Array(5).fill(0);
  f.lab.forEach((l, i) => (mn[l] += sc.norm[i] ** 2 / sc.n[l]));
  ok(mn.every((v) => near(v, 1, 1e-12)), `mean normalised score² = 1 in every cluster (max dev ${Math.max(...mn.map((v) => Math.abs(v - 1))).toExponential(1)})`);
  // per-cluster quota is ceil(p n_j) whatever the cluster holds
  const P = L.perCluster(sc.dist, f.lab, 0.01), q = new Array(5).fill(0);
  for (const i of P) q[f.lab[i]]++;
  ok(q.every((v, j) => v === Math.ceil(0.01 * sc.n[j])), `per-cluster alerts = ceil(0.01·n_j): ${q.join(",")}`);
  // per-feature contributions to d² add up exactly
  const i0 = mules[0], c0 = f.C[f.lab[i0]];
  const parts = X[i0].map((v, j) => (v - c0[j]) ** 2);
  ok(near(parts.reduce((s, v) => s + v, 0), L.d2(X[i0], c0), 1e-12), "per-feature terms sum to d² exactly");
}
{ // log1p gaps
  const g1 = Math.log1p(3000), g2 = Math.log1p(38000) - Math.log1p(3000);
  ok(near(g1, 8.007, 5e-4) && near(g2, 2.539, 5e-4), `log gap 0→3,000 = ${g1.toFixed(3)}, 3,000→38,000 = ${g2.toFixed(3)}`);
  const lc = R1.map((r) => Math.log1p(r[3])), mu = lc.reduce((s, v) => s + v, 0) / N;
  const sd = Math.sqrt(lc.reduce((s, v) => s + (v - mu) ** 2, 0) / N), z = (v) => (Math.log1p(v) - mu) / sd;
  ok(near(z(0), -0.35, 0.005) && near(z(3000), 2.74, 0.005) && near(z(38000), 3.72, 0.005), `z(0)=${z(0).toFixed(2)}, z(3,000)=${z(3000).toFixed(2)}, z(38,000)=${z(38000).toFixed(2)}`);
  const share = R1.filter((r) => r[3] > 0).length / N;
  ok(near(share, 0.109, 0.0005), `share with any cash in = ${share.toFixed(3)}`);
}
{ // winsorising at the 99th percentile
  const cap = L.quantile(R1.map((r) => r[3]), 0.99);
  const s = m1.filter((c) => c.kind === "struct" && c.x[3] >= cap).length, at = R1.filter((r) => r[3] >= cap).length;
  ok(s === 10 && at === 51, `all ${s} structurers at the cap, alongside ${at - s} others (cap ${cap.toFixed(0)})`);
}
{ // correlated features
  const c = (j) => X.map((r) => r[j]);
  const a = c(0), b = c(1), ma = a.reduce((s, v) => s + v, 0) / N, mb = b.reduce((s, v) => s + v, 0) / N;
  let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < N; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; }
  const r = sab / Math.sqrt(saa * sbb);
  ok(near(r, 0.9883, 5e-5), `corr(log inflow, log outflow) = ${r.toFixed(4)}`);
}
{ // rule of three
  const n = Math.ceil(Math.log(0.05) / Math.log(1 - 0.001));
  ok(n === 2995, `zero findings in ${n} below-the-line cases bounds a 0.1% miss rate at 95%`);
}

console.log("\n2. Transforms decide the typology (SINGLE draw, k=3 and k=5, global distance)");
const kinds = (T, k) => { const Z = L.TRANSFORMS[T](R1, R1), f = L.kmeans(Z, k, 7, 5), sc = L.scores(Z, f);
  return { hit: L.kindsOf(m1, L.topK(sc.dist, budget)), sizes: [...sc.n].sort((a, b) => a - b), set: L.topK(sc.dist, budget) }; };
const rz3 = kinds("rawZ", 3), lz3 = kinds("logZ", 3), wz3 = kinds("winsorZ", 3);
ok(rz3.hit.struct === 9 && rz3.hit.mule === 14 && rz3.hit.extreme === 1, `raw z, k=3: ${JSON.stringify(rz3.hit)}; smallest cluster ${rz3.sizes[0]}`);
ok([3, 5, 8, 12].every((k) => { const f = kinds("rawZ", k); return f.sizes[0] === 5; }), "raw z: the five house sales own a cluster of exactly 5 at k = 3, 5, 8, 12");
ok(lz3.hit.mule === 20 && lz3.hit.extreme === 5 && lz3.hit.struct === 0, `log z, k=3: ${JSON.stringify(lz3.hit)}`);
ok(wz3.hit.struct === 0, `winsorised z, k=3: ${JSON.stringify(wz3.hit)}`);
const sets5 = ["rawZ", "winsorZ", "logZ", "rank"].map((T) => kinds(T, 5).set);
let jmin = 1, jmax = 0;
for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) { const j = L.jaccard(sets5[a], sets5[b]); jmin = Math.min(jmin, j); jmax = Math.max(jmax, j); }
ok(near(jmin, 0.15, 0.005) && near(jmax, 0.37, 0.005), `alert-list overlap between transforms at k=5: Jaccard ${jmin.toFixed(2)}–${jmax.toFixed(2)}`);

console.log("\n3. k, silhouette, stability, who gets the alerts (SINGLE draw, log z)");
{
  const r = L.mulberry32(5), sample = Array.from({ length: 800 }, () => Math.floor(r() * N));
  const X2 = L.TRANSFORMS.logZ(R2, R2), X2f = L.TRANSFORMS.logZ(R1, R2);
  const row = {};
  for (const k of [2, 3, 4, 5, 6, 8, 10, 12]) {
    const f1 = L.kmeans(X, k, 7, 10), f2 = L.kmeans(X2, k, 7, 10);
    const A1 = L.topK(L.scores(X, f1).dist, budget), A2 = L.topK(L.scores(X2, f2).dist, budget);
    const lf = L.assignTo(X2f, f1.C), A2f = L.topK(L.scores(X2f, { C: f1.C, lab: lf }).dist, budget);
    row[k] = { sil: L.silhouette(X, f1.lab, sample), ari: L.ari(f1.lab, f2.lab), jr: L.jaccard(A1, A2), jf: L.jaccard(A1, A2f), mule: L.kindsOf(m1, A1).mule };
  }
  const best = Object.entries(row).sort((a, b) => b[1].sil - a[1].sil)[0];
  ok(best[0] === "4" && near(best[1].sil, 0.317, 0.0005) && best[1].mule === 12, `silhouette peaks at k=${best[0]} (${best[1].sil.toFixed(3)}), catching ${best[1].mule}/20 of the ring; k=3 catches ${row[3].mule}`);
  ok(row[3].mule === 20, "k=3 catches all 20");
  const js = Object.values(row).map((v) => v.jr);
  ok(near(Math.min(...js), 0.47, 0.005) && near(Math.max(...js), 0.67, 0.005), `month-to-month alert overlap (refit) ${Math.min(...js).toFixed(2)}–${Math.max(...js).toFixed(2)}`);
  ok(Object.values(row).every((v) => Math.abs(v.jr - v.jf) <= 0.06), "frozen model churns within 0.06 of a refit, at every k");
  ok(near(row[3].ari, 0.825, 0.0005) && near(row[12].ari, 0.507, 0.0005), `peer-group ARI month 1 vs 2: ${row[3].ari.toFixed(3)} at k=3, ${row[12].ari.toFixed(3)} at k=12`);
}
{
  const f = L.kmeans(X, 5, 7, 10), A = L.topK(L.scores(X, f).dist, budget);
  const share = (seg) => [m1.filter((c) => c.seg === seg).length / N, [...A].filter((i) => m1[i].seg === seg).length / budget];
  const [se, sa] = share("selfemp"), [he, ha] = share("high"), [sl, sla] = share("salaried");
  ok(near(se, 0.051, 0.0005) && sa === 0.36 && near(he, 0.100, 0.0005) && ha === 0.26 && sla === 0,
    `alerts vs population: self-employed ${(se * 100).toFixed(1)}%→${sa * 100}%, high earners ${(he * 100).toFixed(1)}%→${ha * 100}%, salaried ${(sl * 100).toFixed(1)}%→${sla * 100}%`);
}

if (process.argv.includes("--slow")) {
  console.log("\n4. Ring size × k (12 seeds each, log z, 6 features)");
  const recall = (mules, k) => { let s = 0; for (let t = 0; t < 12; t++) {
    const m = L.drawMonth(L.makeProfiles(5000, 1000 + t, { mules, struct: 0, extreme: 0 }), 2000 + t);
    const Z = L.TRANSFORMS.logZ(m.map((c) => c.x), m.map((c) => c.x)), f = L.kmeans(Z, k, 3000 + t, 10);
    const A = L.topK(L.scores(Z, f).dist, Math.round(0.01 * Z.length));
    s += m.filter((c, i) => c.kind === "mule" && A.has(i)).length / mules; } return s / 12; };
  const r1 = recall(1, 8), r20 = recall(20, 8), r40 = recall(40, 8);
  ok(r1 === 1 && near(r20, 0.76, 0.005) && near(r40, 0.23, 0.005), `k=8: lone mule ${r1.toFixed(2)}, ring of 20 ${r20.toFixed(2)}, ring of 40 ${r40.toFixed(2)}`);
  const own = (mules, k) => { let s = 0; for (let t = 0; t < 12; t++) {
    const m = L.drawMonth(L.makeProfiles(5000, 1000 + t, { mules, struct: 0, extreme: 0 }), 2000 + t);
    const Z = L.TRANSFORMS.logZ(m.map((c) => c.x), m.map((c) => c.x)), f = L.kmeans(Z, k, 3000 + t, 10), sc = L.scores(Z, f);
    const idx = m.map((c, i) => (c.kind === "mule" ? i : -1)).filter((i) => i >= 0), cnt = {};
    idx.forEach((i) => (cnt[f.lab[i]] = (cnt[f.lab[i]] || 0) + 1));
    const [cl, c] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; s += c / sc.n[cl] >= 0.5; } return s / 12; };
  const r20k12 = recall(20, 12), o80k8 = own(80, 8), o40k12 = own(40, 12);
  ok(near(r20k12, 0.10, 0.005) && near(o80k8, 0.67, 0.005) && near(o40k12, 0.58, 0.005), `k=12 ring of 20 recall ${r20k12.toFixed(2)}; ring owns a centroid: m=80,k=8 ${o80k8.toFixed(2)}, m=40,k=12 ${o40k12.toFixed(2)}`);
  // 2-D lab view
  const rec2 = (mules, k) => { let s = 0; for (let t = 0; t < 12; t++) {
    const m = L.drawMonth(L.makeProfiles(5000, 1000 + t, { mules, struct: 0, extreme: 0 }), 2000 + t);
    const R = m.map((c) => [Math.log1p(c.x[0]), Math.log1p(c.x[5])]);
    const mu = [0, 1].map((j) => R.reduce((a, r) => a + r[j], 0) / R.length);
    const sd = [0, 1].map((j) => Math.sqrt(R.reduce((a, r) => a + (r[j] - mu[j]) ** 2, 0) / R.length));
    const Z = R.map((r) => r.map((v, j) => (v - mu[j]) / sd[j])), f = L.kmeans(Z, k, 3000 + t, 10);
    const A = L.topK(L.scores(Z, f).dist, Math.round(0.01 * Z.length));
    s += m.filter((c, i) => c.kind === "mule" && A.has(i)).length / mules; } return s / 12; };
  const two = [5, 8, 12].map((k) => rec2(40, k));
  ok(near(Math.min(...two), 0.16, 0.005) && near(Math.max(...two), 0.22, 0.005), `2-D view, ring of 40, k=5/8/12: ${two.map((v) => v.toFixed(2)).join(", ")}`);
  // price of a centroid: m* = dI n / (n D2 - dI)
  const pm = L.drawMonth(L.makeProfiles(5000, 1000, { mules: 0, struct: 0, extreme: 0 }), 2000).map((c) => c.x);
  const ring = L.drawMonth(L.makeProfiles(0, 77, { mules: 40, struct: 0, extreme: 0 }), 78).map((c) => c.x);
  const Zall = L.TRANSFORMS.logZ(pm, [...pm, ...ring]), Z = Zall.slice(0, pm.length), Rg = Zall.slice(pm.length);
  const muR = Rg[0].map((_, j) => Rg.reduce((s, x) => s + x[j], 0) / Rg.length);
  const mstar = (k) => { const a = L.kmeans(Z, k - 1, 5, 10), b = L.kmeans(Z, k, 5, 10), dI = a.inertia - b.inertia;
    let bj = 0, bd = Infinity; b.C.forEach((c, j) => { const d = L.d2(muR, c); if (d < bd) { bd = d; bj = j; } });
    const n = b.lab.filter((l) => l === bj).length; return (dI * n) / (n * bd - dI); };
  const s8 = mstar(8), s12 = mstar(12);
  const spread = Rg.reduce((s, x) => s + L.d2(x, muR), 0) / Rg.length;
  ok(near(s8, 49, 1) && near(s12, 23, 1) && near(spread, 0.49, 0.01), `m* ≈ ${s8.toFixed(1)} at k=8, ${s12.toFixed(1)} at k=12; ring spread ${spread.toFixed(3)}`);
}
{ // feature-set variants (SINGLE)
  const Rb = R1.map((r) => [r[0], r[1] / r[0], r[2], r[3], r[4], r[5]]), Xb = L.TRANSFORMS.logZ(Rb, Rb);
  const mul = (Z, k) => L.kindsOf(m1, L.topK(L.scores(Z, L.kmeans(Z, k, 7, 10)).dist, budget)).mule;
  const p = X[0].length, S = Array.from({ length: p }, () => new Array(p).fill(0));
  for (const r of X) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] += r[a] * r[b] / N;
  const C = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < p; i++) for (let j = 0; j <= i; j++) { let s = S[i][j]; for (let q = 0; q < j; q++) s -= C[i][q] * C[j][q]; C[i][j] = i === j ? Math.sqrt(s) : s / C[j][j]; }
  const Xw = X.map((r) => { const y = new Array(p); for (let i = 0; i < p; i++) { let s = r[i]; for (let q = 0; q < i; q++) s -= C[i][q] * y[q]; y[i] = s / C[i][i]; } return y; });
  const a3 = mul(X, 3), a8 = mul(X, 8), b3 = mul(Xb, 3), b8 = mul(Xb, 8), w8 = mul(Xw, 8);
  ok(a3 === 20 && b3 === 12 && a8 === 12 && b8 === 20 && w8 === 3, `ring caught, outflow → ratio: k=3 ${a3}→${b3}, k=8 ${a8}→${b8}; whitened k=8 ${w8}`);
}

console.log(fails ? `\n${fails} FAILED` : "\nall green");
process.exit(fails ? 1 : 0);
