// Part VI: explainability.
import * as E from "./ext.mjs"; const L = E.L;
const prof = L.makeProfiles(5000, 11);
const m1 = L.drawMonth(prof, 101), R1 = m1.map((c) => c.x), LOG = { transform: "log1p", scaler: "z" };
const X = E.pipeline(LOG, R1), N = X.length, k = 5, P = 6;
const f = L.kmeans(X, k, 7, 10), sc = L.scores(X, f), A = [...E.top(sc.dist)];
const t = [...sc.dist].sort((a, b) => b - a)[49]; // threshold = 50th largest distance
console.log(`threshold distance t = ${t.toFixed(4)}`);
console.log("== E1 per-feature decomposition of d² among the 50 alerts");
const terms = (i) => X[i].map((v, j) => (v - f.C[f.lab[i]][j]) ** 2);
const dom = A.map((i) => { const tt = terms(i), s = tt.reduce((a, b) => a + b, 0); const j = tt.indexOf(Math.max(...tt)); return [j, tt[j] / s]; });
const byF = new Array(P).fill(0); dom.forEach(([j]) => byF[j]++);
console.log(`  top feature per alert: ${byF.map((v, j) => L.FEATURES[j] + " " + v).join(", ")}; alerts where one feature is >50% of d²: ${dom.filter(([, s]) => s > 0.5).length}/50, >80%: ${dom.filter(([, s]) => s > 0.8).length}/50`);
const ex = A.find((i) => m1[i].kind === "mule"); console.log(`  one ring member: terms ${terms(ex).map((v) => v.toFixed(2)).join(", ")} sum ${terms(ex).reduce((a, b) => a + b, 0).toFixed(4)} = d² ${(sc.dist[ex] ** 2).toFixed(4)}`);
console.log("== E2 Shapley values of d² with the centroid as baseline");
function shap(i, reassign) {
  const x = X[i], c0 = f.C[f.lab[i]], phi = new Array(P).fill(0);
  const v = (S) => { const z = x.map((xv, j) => (S & (1 << j) ? xv : c0[j])); const c = reassign ? f.C[L.assignTo([z], f.C)[0]] : c0; return L.d2(z, c); };
  const fact = [1, 1, 2, 6, 24, 120, 720];
  for (let j = 0; j < P; j++) for (let S = 0; S < 64; S++) { if (S & (1 << j)) continue; const s = popcount(S);
    phi[j] += (fact[s] * fact[P - s - 1] / fact[P]) * (v(S | (1 << j)) - v(S)); }
  return phi;
}
function popcount(n) { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; }
{ let mx = 0, changed = 0, rankFlip = 0;
  for (const i of A) { const phi = shap(i, false), tt = terms(i); phi.forEach((p, j) => (mx = Math.max(mx, Math.abs(p - tt[j]))));
    const phr = shap(i, true); if (phr.some((p, j) => Math.abs(p - tt[j]) > 1e-9)) changed++;
    const topA = tt.indexOf(Math.max(...tt)), topB = phr.indexOf(Math.max(...phr)); if (topA !== topB) rankFlip++; }
  console.log(`  fixed assignment: max |Shapley - term| over 50 alerts = ${mx.toExponential(2)}`);
  console.log(`  re-assigning to the nearest centroid inside the value function: Shapley differs from the terms for ${changed}/50 alerts; top reason changes for ${rankFlip}/50`);
}
console.log("== E4 counterfactuals");
{ const ones = A.filter((i) => { const tt = terms(i), d2 = sc.dist[i] ** 2; return tt.some((v) => v >= d2 - t * t); });
  const shr = A.map((i) => t / sc.dist[i]);
  console.log(`  moving straight toward the centroid, alerts must shrink their distance to between ${(Math.min(...shr) * 100).toFixed(1)}% and ${(Math.max(...shr) * 100).toFixed(1)}% of today's; alerts one feature alone could clear: ${ones.length}/50`);
  const i = ex, tt = terms(i), d2 = sc.dist[i] ** 2, j = tt.indexOf(Math.max(...tt));
  const need = d2 - t * t; const newGap = Math.sqrt(Math.max(0, tt[j] - need)); // |x_j - c_j| must fall to this
  const zNow = X[i][j], c = f.C[f.lab[i]][j], zNew = c + Math.sign(zNow - c) * newGap;
  const back = (z) => Math.expm1(z * E.sdev(E.colOf(R1, j).map(Math.log1p)) + E.mean(E.colOf(R1, j).map(Math.log1p)));
  console.log(`  ring member's single-feature counterfactual on ${L.FEATURES[j]}: from ${R1[i][j].toFixed(0)} to ${back(zNew).toFixed(1)} (peer centroid ${back(c).toFixed(1)})`);
}
console.log("== E5 four global importance measures disagree");
{ const d = E.decomposition(X, f);
  const share = new Array(P).fill(0); A.forEach((i) => { const tt = terms(i), s = tt.reduce((a, b) => a + b, 0); tt.forEach((v, j) => (share[j] += v / s / 50)); });
  const r = L.mulberry32(77), perm = [], drop = [];
  const base = new Set(A);
  for (let j = 0; j < P; j++) {
    const idx = Array.from({ length: N }, (_, i) => i); for (let a = N - 1; a > 0; a--) { const b = Math.floor(r() * (a + 1)); [idx[a], idx[b]] = [idx[b], idx[a]]; }
    const Xp = X.map((x, i) => x.map((v, q) => (q === j ? X[idx[i]][j] : v)));
    const lab = L.assignTo(Xp, f.C); const Ap = E.top(L.scores(Xp, { C: f.C, lab }).dist); perm.push(1 - L.jaccard(base, Ap));
    const Xd = X.map((x) => x.filter((_, q) => q !== j)); const Ad = E.top(E.fitScore(Xd, k).sc.dist); drop.push(1 - L.jaccard(base, Ad));
  }
  const fmt = (a) => a.map((v, j) => `${L.FEATURES[j]} ${v.toFixed(2)}`).join(", ");
  const rank = (a) => a.map((v, j) => [v, j]).sort((x, y) => y[0] - x[0]).map(([, j]) => L.FEATURES[j]).join(" > ");
  console.log(`  segmentation R²:        ${fmt(d.r2)}\n     order ${rank(d.r2)}`);
  console.log(`  mean share of alert d²: ${fmt(share)}\n     order ${rank(share)}`);
  console.log(`  permutation (1-J):      ${fmt(perm)}\n     order ${rank(perm)}`);
  console.log(`  drop-column refit (1-J):${fmt(drop)}\n     order ${rank(drop)}`);
}
console.log("== E6 surrogate tree for peer groups (original units)");
{ for (const depth of [1, 2, 3, 4, 5]) { const T = E.tree(R1, f.lab, depth); const acc = R1.filter((x, i) => T.predict(x) === f.lab[i]).length / N;
    console.log(`  depth ${depth}: fidelity ${(acc * 100).toFixed(1)}%`); }
  const T = E.tree(R1, f.lab, 2); const pr = (n, ind) => n.leaf !== undefined ? console.log(`${ind}-> cluster ${n.leaf}`) : (console.log(`${ind}${L.FEATURES[n.q]} < ${n.s.toFixed(0)}`), pr(n.l, ind + "  "), console.log(`${ind}else`), pr(n.r, ind + "  "));
  pr(T.root, "   ");
}
