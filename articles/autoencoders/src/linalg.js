/*
  Just enough linear algebra, written out rather than imported, because every
  claim in this article is a claim about these operations and the checking
  script has to be able to re-derive them independently.

  Matrices are arrays of row arrays. Small and dense - d <= 8 here - so nothing
  is optimised and everything is legible.
*/

export const zeros = (r, c) => Array.from({ length: r }, () => new Float64Array(c));
export const eye = (n) => Array.from({ length: n }, (_, i) => Float64Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
export const shape = (M) => [M.length, M[0].length];

export function matMul(A, B) {
  const [n, m] = shape(A);
  const p = B[0].length;
  const C = zeros(n, p);
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < m; t++) {
      const a = A[i][t];
      if (a === 0) continue;
      for (let j = 0; j < p; j++) C[i][j] += a * B[t][j];
    }
  }
  return C;
}

export function transpose(A) {
  const [n, m] = shape(A);
  const T = zeros(m, n);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) T[j][i] = A[i][j];
  return T;
}

export const matVec = (A, v) => A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const norm = (v) => Math.sqrt(dot(v, v));
export const scale = (v, s) => v.map((x) => x * s);
export const sub = (a, b) => a.map((x, i) => x - b[i]);
export const add = (a, b) => a.map((x, i) => x + b[i]);
export const frobenius = (A) => Math.sqrt(A.reduce((s, row) => s + row.reduce((t, x) => t + x * x, 0), 0));

/*
  Symmetric eigendecomposition by the cyclic Jacobi method: repeatedly zero the
  largest off-diagonal entry with a rotation, until the off-diagonal mass is
  negligible. Slow for large matrices and exact enough for anything here, and -
  the reason it is used instead of something cleverer - it is short enough to
  read and check. Returns eigenvalues in DESCENDING order with the matching
  eigenvectors as rows.
*/
export function jacobiEigen(Ain, { tol = 1e-26, maxSweeps = 100 } = {}) {
  // `tol` is on the SUM OF SQUARES of the off-diagonal entries, so it is the
  // square of the accuracy you actually get. At 1e-12 the off-diagonals sit
  // around 1e-6 and the residual of A v = lambda v comes out near 1e-10, which
  // the checking script quite rightly rejected. Jacobi converges quadratically,
  // so asking for far more costs a sweep or two and nothing else.
  const n = Ain.length;
  const A = Ain.map((row) => Float64Array.from(row));
  let V = eye(n);

  const offDiag = () => {
    let s = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) s += A[i][j] * A[i][j];
    return s;
  };

  for (let sweep = 0; sweep < maxSweeps && offDiag() > tol; sweep++) {
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let i = 0; i < n; i++) {
          const aip = A[i][p];
          const aiq = A[i][q];
          A[i][p] = c * aip - s * aiq;
          A[i][q] = s * aip + c * aiq;
        }
        for (let j = 0; j < n; j++) {
          const apj = A[p][j];
          const aqj = A[q][j];
          A[p][j] = c * apj - s * aqj;
          A[q][j] = s * apj + c * aqj;
        }
        for (let i = 0; i < n; i++) {
          const vip = V[i][p];
          const viq = V[i][q];
          V[i][p] = c * vip - s * viq;
          V[i][q] = s * vip + c * viq;
        }
      }
    }
  }

  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  return {
    values: order.map((i) => A[i][i]),
    // Rows are eigenvectors, sign-fixed so that the largest-magnitude component
    // is positive. The sign is arbitrary in the maths and a nuisance in a chart.
    vectors: order.map((i) => {
      const v = Array.from({ length: n }, (_, r) => V[r][i]);
      let big = 0;
      for (let r = 1; r < n; r++) if (Math.abs(v[r]) > Math.abs(v[big])) big = r;
      return v[big] < 0 ? v.map((x) => -x) : v;
    }),
  };
}

// Solve a small symmetric positive-definite system by Gaussian elimination.
export function solve(Ain, Bin) {
  const n = Ain.length;
  const m = Bin[0].length;
  const A = Ain.map((row, i) => Float64Array.from([...row, ...Bin[i]]));
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    const d = A[col][col];
    if (Math.abs(d) < 1e-14) continue; // singular: leave the row, caller decides
    for (let j = col; j < n + m; j++) A[col][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col];
      if (f === 0) continue;
      for (let j = col; j < n + m; j++) A[r][j] -= f * A[col][j];
    }
  }
  return Array.from({ length: n }, (_, i) => Float64Array.from(A[i].slice(n)));
}

/*
  The orthogonal projector onto the column space of B (d x k). This is the
  object the whole article turns on: two autoencoders with completely different
  weights have the SAME projector, and that is what it means to say they found
  the same subspace.
*/
export function projector(B) {
  const Bt = transpose(B);
  const G = matMul(Bt, B); // k x k
  const inv = solve(G, eye(G.length));
  return matMul(matMul(B, inv), Bt); // d x d
}

/*
  How far apart two subspaces are, as the Frobenius norm of the difference of
  their projectors, normalised so that identical subspaces score 0 and fully
  orthogonal ones score 1. Basis-free by construction, which is exactly why it
  is the right measurement here.
*/
export function subspaceDistance(B1, B2) {
  const P1 = projector(B1);
  const P2 = projector(B2);
  const D = P1.map((row, i) => row.map((x, j) => x - P2[i][j]));
  return frobenius(D) / Math.sqrt(2 * Math.min(B1[0].length, B2[0].length));
}

export const angleBetween = (a, b) => {
  const c = dot(a, b) / (norm(a) * norm(b));
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
};
