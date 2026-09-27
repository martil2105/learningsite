/*
  How often the dots-and-circles procedure comes up empty.

  For counting pure equilibria, only the ORDER of a player's payoffs matters —
  "would I switch?" is a comparison. So a generic 2x2 game is one of 24 x 24 =
  576 equally likely ordinal games, and the answer is a set of exact rationals
  rather than a simulation with error bars.
*/

function permutations(items) {
  if (items.length <= 1) return [items];
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([items[i], ...p]);
  }
  return out;
}

const RANKINGS = permutations([0, 1, 2, 3]);

const asMatrix = (r) => [[r[0], r[1]], [r[2], r[3]]];

function countPure(A, B) {
  let k = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (A[r][c] > A[1 - r][c] && B[r][c] > B[r][1 - c]) k++;
    }
  }
  return k;
}

function isParetoDominated(A, B, r, c) {
  for (let r2 = 0; r2 < 2; r2++) {
    for (let c2 = 0; c2 < 2; c2++) {
      if (r2 === r && c2 === c) continue;
      const noWorse = A[r2][c2] >= A[r][c] && B[r2][c2] >= B[r][c];
      const better = A[r2][c2] > A[r][c] || B[r2][c2] > B[r][c];
      if (noWorse && better) return true;
    }
  }
  return false;
}

/*
  Every 2x2 game there is, up to the orderings that decide the answer.
  Returns exact integer counts out of 576 — nothing here is sampled.
*/
export function enumerateAll() {
  const counts = [0, 0, 0, 0, 0];
  let games = 0;
  let equilibria = 0;
  let dominated = 0;

  for (const ra of RANKINGS) {
    for (const rb of RANKINGS) {
      const A = asMatrix(ra);
      const B = asMatrix(rb);
      let k = 0;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          if (A[r][c] > A[1 - r][c] && B[r][c] > B[r][1 - c]) {
            k++;
            equilibria++;
            if (isParetoDominated(A, B, r, c)) dominated++;
          }
        }
      }
      counts[k]++;
      games++;
    }
  }
  return { games, counts, equilibria, dominated };
}

/*
  The same question at larger games, where exhaustive enumeration is not
  available. A cell is an equilibrium iff the row player's payoff is the
  largest in its column AND the column player's is the largest in its row —
  each has chance 1/n, and there are n^2 cells, so the EXPECTED number is
  n^2 * (1/n) * (1/n) = 1 at every size. The distribution around that mean is
  what the simulation is for.
*/
export function countPureRandom(n, rand) {
  const A = [];
  const B = [];
  for (let r = 0; r < n; r++) {
    A.push([]);
    B.push([]);
    for (let c = 0; c < n; c++) {
      A[r].push(rand());
      B[r].push(rand());
    }
  }
  let k = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let best = true;
      for (let r2 = 0; r2 < n && best; r2++) if (A[r2][c] > A[r][c]) best = false;
      if (!best) continue;
      for (let c2 = 0; c2 < n && best; c2++) if (B[r][c2] > B[r][c]) best = false;
      if (best) k++;
    }
  }
  return k;
}

/* Poisson(1): e^-1 / k!. The limit the counts converge to, with nothing fitted. */
export function poissonOne(k) {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return Math.exp(-1) / f;
}

export { countPure, isParetoDominated };
