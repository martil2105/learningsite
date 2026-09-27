/*
  PCA, from the covariance matrix, so that the article can put it beside the
  autoencoder and say precisely what is the same and what is not.
*/
import { jacobiEigen, matVec, transpose, dot } from "./linalg.js";

export const columnMeans = (X) => {
  const d = X[0].length;
  const m = new Array(d).fill(0);
  for (const row of X) for (let j = 0; j < d; j++) m[j] += row[j];
  return m.map((v) => v / X.length);
};

export const centre = (X, mean = columnMeans(X)) => X.map((r) => r.map((v, j) => v - mean[j]));

export function covariance(Xc) {
  const n = Xc.length;
  const d = Xc[0].length;
  const C = Array.from({ length: d }, () => new Array(d).fill(0));
  for (const row of Xc) {
    for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) C[i][j] += row[i] * row[j];
  }
  // Divided by n, not n-1: the autoencoder minimises a sum of squares, and
  // matching the denominators is what lets the two be compared directly.
  return C.map((row) => row.map((v) => v / n));
}

export function pca(X) {
  const mean = columnMeans(X);
  const Xc = centre(X, mean);
  const { values, vectors } = jacobiEigen(covariance(Xc));
  const total = values.reduce((a, b) => a + b, 0);
  return {
    mean,
    Xc,
    eigenvalues: values,
    components: vectors, // rows, descending by eigenvalue
    explained: values.map((v) => v / total),
    cumulative: values.map((_, i) => values.slice(0, i + 1).reduce((a, b) => a + b, 0) / total),
  };
}

// Coordinates of the centred rows in the first k principal directions.
export const encode = (Xc, components, k) => Xc.map((r) => components.slice(0, k).map((c) => dot(r, c)));

export const decode = (Z, components, k) =>
  Z.map((z) => {
    const out = new Array(components[0].length).fill(0);
    for (let i = 0; i < k; i++) for (let j = 0; j < out.length; j++) out[j] += z[i] * components[i][j];
    return out;
  });

/*
  Mean squared reconstruction error per row. Eckart-Young says the best rank-k
  reconstruction scores exactly the sum of the discarded eigenvalues, and
  verify/check-numbers.mjs holds this file to that.
*/
export const reconstructionError = (Xc, Xhat) => {
  let s = 0;
  for (let i = 0; i < Xc.length; i++) for (let j = 0; j < Xc[i].length; j++) s += (Xc[i][j] - Xhat[i][j]) ** 2;
  return s / Xc.length;
};

export const tailSum = (eigenvalues, k) => eigenvalues.slice(k).reduce((a, b) => a + b, 0);
