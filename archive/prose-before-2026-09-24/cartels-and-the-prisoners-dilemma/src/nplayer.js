/*
 * nplayer.js - Sequential (Gauss-Seidel) N-player best-response solver
 *
 * NOTE: Simultaneous best-response iteration has an eigenvalue of -(n-1)/2,
 * which diverges whenever n >= 5. Sequential iteration stably converges for all n.
 */

export function solveCournot(m, a = 100, c = 10, maxSweeps = 4000) {
  const q = new Array(m).fill(5);
  let tot = q.reduce((s, x) => s + x, 0);

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let maxDiff = 0;
    for (let i = 0; i < m; i++) {
      const rest = tot - q[i];
      const next = Math.max(0, (a - c - rest) / 2);
      const diff = Math.abs(next - q[i]);
      if (diff > maxDiff) maxDiff = diff;
      tot += next - q[i];
      q[i] = next;
    }
    if (maxDiff < 1e-15) break;
  }
  return q;
}
