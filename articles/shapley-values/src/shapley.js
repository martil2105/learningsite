/*
  Exact and sampled Shapley values.

  A cooperative game here is a *value function* v: a payoff for every subset of
  the players. Subsets are bitmasks - player i is in S when (S >> i) & 1 - so a
  game over n players is just an array of length 2^n.

  Nothing in this file knows what the players are. The consulting team in
  game.js and the three apartment features in model.js are the same object, and
  that equivalence is the whole point of the article.
*/

// All n! orderings of [0 .. n-1], generated in a stable order so the table on
// the page never reshuffles under the reader.
export function permutations(n) {
  if (n === 0) return [[]];
  const out = [];
  const build = (prefix, rest) => {
    if (rest.length === 0) {
      out.push(prefix);
      return;
    }
    for (let i = 0; i < rest.length; i++) {
      build([...prefix, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
    }
  };
  build(
    [],
    Array.from({ length: n }, (_, i) => i)
  );
  return out;
}

export function factorial(n) {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

export const inCoalition = (mask, i) => ((mask >> i) & 1) === 1;
export const withPlayer = (mask, i) => mask | (1 << i);
export const maskOf = (players) => players.reduce((m, i) => m | (1 << i), 0);
export const membersOf = (mask, n) =>
  Array.from({ length: n }, (_, i) => i).filter((i) => inCoalition(mask, i));

/*
  Exact Shapley values, computed the long way round: walk every ordering, hand
  each player what they add on arrival, average each column.

  This is deliberately not the weighted-subset formula. It is O(n * n!) rather
  than O(2^n), which for the n <= 4 games here costs nothing, and it produces
  the per-ordering table the article draws. The two agree - `shapleyByWeights`
  below is the closed form, and the test in verify/ checks they match.
*/
export function shapleyExact(n, v) {
  const orders = permutations(n);
  const rows = orders.map((order) => {
    let mask = 0;
    let running = v(0);
    const marginals = new Array(n).fill(0);
    const coalitions = [];
    for (const i of order) {
      const next = withPlayer(mask, i);
      const value = v(next);
      marginals[i] = value - running;
      coalitions.push({ player: i, before: mask, after: next, value });
      mask = next;
      running = value;
    }
    return { order, marginals, coalitions };
  });

  const phi = new Array(n).fill(0);
  for (const row of rows) {
    for (let i = 0; i < n; i++) phi[i] += row.marginals[i];
  }
  const denom = orders.length;
  return { phi: phi.map((s) => s / denom), rows, orders };
}

// The closed form, weighting each coalition by how many orderings produce it.
// Kept as an independent check on shapleyExact rather than for speed.
export function shapleyByWeights(n, v) {
  const nFact = factorial(n);
  const phi = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let S = 0; S < 1 << n; S++) {
      if (inCoalition(S, i)) continue;
      const s = membersOf(S, n).length;
      const weight = (factorial(s) * factorial(n - s - 1)) / nFact;
      phi[i] += weight * (v(withPlayer(S, i)) - v(S));
    }
  }
  return phi;
}

/*
  Monte Carlo over orderings: draw permutations uniformly and average the same
  marginal contributions. Returns the running estimate after each draw so the
  page can show the error shrinking rather than just its final value.
*/
export function shapleySampled(n, v, nPerm, rng) {
  const idx = Array.from({ length: n }, (_, i) => i);
  const total = new Array(n).fill(0);
  const history = [];
  for (let t = 1; t <= nPerm; t++) {
    // Fisher-Yates on a copy
    const order = idx.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    let mask = 0;
    let running = v(0);
    for (const i of order) {
      const next = withPlayer(mask, i);
      const value = v(next);
      total[i] += value - running;
      mask = next;
      running = value;
    }
    history.push(total.map((s) => s / t));
  }
  return { phi: total.map((s) => s / nPerm), history };
}

// Efficiency check: the values must exhaust the grand coalition, v(N) - v(empty).
export function efficiencyGap(phi, n, v) {
  const total = phi.reduce((a, b) => a + b, 0);
  return total - (v((1 << n) - 1) - v(0));
}
