/*
  Explaining an alert: the per-feature split of d², its Shapley values, the
  counterfactual that would clear it, and a surrogate tree for the peer groups.
*/
import { d2, assignTo } from "./cluster.js";

/* The squared distance to the centroid, one term per feature. They add up to d². */
export const terms = (x, c) => x.map((v, j) => (v - c[j]) ** 2);

/*
  Exact Shapley values of d² for one customer, over all 2^p coalitions. A
  feature outside the coalition takes its centroid value. With `reassign`, the
  value function first re-assigns the partial customer to the nearest centroid,
  which is what a model that re-scores would do.
*/
export function shapley(x, C, own, reassign = false) {
  const P = x.length, c0 = C[own], phi = new Array(P).fill(0);
  const fact = [1]; for (let i = 1; i <= P; i++) fact.push(fact[i - 1] * i);
  const v = (S) => {
    const z = x.map((xv, j) => (S & (1 << j) ? xv : c0[j]));
    const c = reassign ? C[assignTo([z], C)[0]] : c0;
    return d2(z, c);
  };
  const pop = (n) => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };
  for (let j = 0; j < P; j++) for (let S = 0; S < 1 << P; S++) {
    if (S & (1 << j)) continue; const s = pop(S);
    phi[j] += (fact[s] * fact[P - s - 1] / fact[P]) * (v(S | (1 << j)) - v(S));
  }
  return phi;
}

/*
  One feature j alone can clear the alert exactly when its term is at least
  d² − t², where t is the threshold distance. Returns the value the feature
  would need (in the transformed units), or null.
*/
export function singleFeatureFix(x, c, t) {
  const tt = terms(x, c), dd = tt.reduce((s, v) => s + v, 0), need = dd - t * t;
  return tt.map((v, j) => (v >= need ? c[j] + Math.sign(x[j] - c[j]) * Math.sqrt(Math.max(0, v - need)) : null));
}

// A small CART (Gini) predicting cluster labels from features in original units.
export function tree(X, y, depth, minLeaf = 20) {
  const k = Math.max(...y) + 1;
  const counts = (ids) => { const c = new Array(k).fill(0); ids.forEach((i) => c[y[i]]++); return c; };
  const gini = (ids) => 1 - counts(ids).reduce((s, v) => s + (v / ids.length) ** 2, 0);
  const major = (ids) => { const c = counts(ids); return c.indexOf(Math.max(...c)); };
  const grow = (ids, d) => {
    if (d === 0 || ids.length < 2 * minLeaf) return { leaf: major(ids), n: ids.length };
    let best = null; const p = X[0].length;
    for (let q = 0; q < p; q++) {
      const vals = [...new Set(ids.map((i) => X[i][q]))].sort((a, b) => a - b);
      const cands = vals.length > 64 ? Array.from({ length: 63 }, (_, t) => vals[Math.floor(((t + 1) * vals.length) / 64)]) : vals.slice(1);
      for (const s of cands) {
        const Lf = ids.filter((i) => X[i][q] < s), R = ids.filter((i) => X[i][q] >= s);
        if (Lf.length < minLeaf || R.length < minLeaf) continue;
        const g = (Lf.length * gini(Lf) + R.length * gini(R)) / ids.length;
        if (!best || g < best.g) best = { g, q, s, Lf, R };
      }
    }
    if (!best) return { leaf: major(ids), n: ids.length };
    return { q: best.q, s: best.s, l: grow(best.Lf, d - 1), r: grow(best.R, d - 1) };
  };
  const root = grow(X.map((_, i) => i), depth);
  const predict = (x, t = root) => (t.leaf !== undefined ? t.leaf : predict(x, x[t.q] < t.s ? t.l : t.r));
  return { root, predict };
}

/* Leaf rules of a tree as [{ conds: [[q, "<"|"≥", s]], leaf }]. */
export function rules(node, path = []) {
  if (node.leaf !== undefined) return [{ conds: path, leaf: node.leaf, n: node.n }];
  return [...rules(node.l, [...path, [node.q, "<", node.s]]), ...rules(node.r, [...path, [node.q, "≥", node.s]])];
}
