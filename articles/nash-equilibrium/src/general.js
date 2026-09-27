/*
  The same claim at games bigger than 2x2, and a solver that is ALLOWED to be
  wrong about it.

  The point being tested is "your own mix does not depend on your own payoffs".
  A probe that computes your mix from the opponent's matrix and then reports
  that it did not move when your matrix changed has measured nothing — it is
  true by construction. So the solver here takes BOTH matrices, and every
  answer it returns is checked by exploitability, which also reads both.
*/

export function transpose(M) {
  const T = [];
  for (let j = 0; j < M[0].length; j++) {
    T.push([]);
    for (let i = 0; i < M.length; i++) T[j].push(M[i][j]);
  }
  return T;
}

/*
  The mixing vector that makes the owner of M indifferent across all its rows:
  n-1 difference equations plus the simplex constraint, by Gaussian elimination
  with partial pivoting. Returns null if the system is singular.
*/
export function indifferenceMix(M) {
  const n = M.length;
  const S = [];
  for (let i = 0; i < n - 1; i++) S.push([...M[i].map((v, j) => v - M[i + 1][j]), 0]);
  S.push([...new Array(n).fill(1), 1]);

  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(S[r][c]) > Math.abs(S[piv][c])) piv = r;
    if (Math.abs(S[piv][c]) < 1e-12) return null;
    [S[c], S[piv]] = [S[piv], S[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = S[r][c] / S[c][c];
      for (let k = c; k <= n; k++) S[r][k] -= f * S[c][k];
    }
  }
  return S.map((_, i) => S[i][n] / S[i][i]);
}

/* Full-support equilibrium of an n x n game, from both matrices. */
export function solve(A, B) {
  const p = indifferenceMix(transpose(B)); // row player's mix
  const q = indifferenceMix(A);            // column player's mix
  return p && q ? { p, q } : null;
}

export function exploitability(A, B, p, q) {
  const rowEV = A.map((row) => row.reduce((s, v, j) => s + v * q[j], 0));
  const colEV = transpose(B).map((col) => col.reduce((s, v, i) => s + v * p[i], 0));
  const rowVal = rowEV.reduce((s, v, i) => s + v * p[i], 0);
  const colVal = colEV.reduce((s, v, j) => s + v * q[j], 0);
  return Math.max(Math.max(...rowEV) - rowVal, Math.max(...colEV) - colVal);
}

const interior = (v) => v.every((x) => x > 1e-4 && x < 1);

/*
  Replace EVERY payoff of the row player with fresh random values, on a scale
  100x the original, and measure how far the row player's own equilibrium mix
  moved. Returns the worst displacement over `want` interior games.
*/
export function ownMixDisplacement(n, rand, want = 400, attempts = 40000) {
  let tested = 0;
  let worst = 0;
  let worstExploit = 0;

  for (let t = 0; t < attempts && tested < want; t++) {
    const A = [];
    const B = [];
    for (let i = 0; i < n; i++) {
      A.push([]);
      B.push([]);
      for (let j = 0; j < n; j++) {
        A[i].push(rand() * 10);
        B[i].push(rand() * 10);
      }
    }
    const first = solve(A, B);
    if (!first || !interior(first.p) || !interior(first.q)) continue;

    const A2 = A.map((row) => row.map(() => rand() * 1000 - 500));
    const second = solve(A2, B);
    if (!second || !second.p.every(Number.isFinite)) continue;

    tested++;
    worstExploit = Math.max(worstExploit, Math.abs(exploitability(A, B, first.p, first.q)));
    worst = Math.max(worst, Math.max(...first.p.map((v, i) => Math.abs(v - second.p[i]))));
  }
  return { n, tested, worst, worstExploit };
}
