/*
  Price indices for a CES household, and the true cost-of-living index they try
  to measure.

  Base prices are all 1 and base spending shares are `a`, so with elasticity of
  substitution s the cost of reaching the base-year standard of living at prices
  p is

      e(p) = ( sum_i a_i p_i^(1-s) )^(1/(1-s)),     e(p) = prod_i p_i^a_i when s = 1,

  and the true index is e(p1)/e(p0) = e(p1). The formulas below never see s:
  they are computed from prices and the baskets actually bought, which is all a
  statistician has. Only `trueIndex` and `hicksian` know s, because they stand in
  for the household.
*/

const S1 = 1e-9;

/* The cost of the base-year standard of living at prices p (base prices are 1). */
export function trueIndex(p, a, s) {
  if (Math.abs(s - 1) < S1) return Math.exp(a.reduce((x, ai, i) => x + ai * Math.log(p[i]), 0));
  if (s < S1) return a.reduce((x, ai, i) => x + ai * p[i], 0); // Leontief: the basket never changes
  return Math.pow(a.reduce((x, ai, i) => x + ai * Math.pow(p[i], 1 - s), 0), 1 / (1 - s));
}

/* The cheapest basket that reaches the base-year standard of living at prices p. */
export function hicksian(p, a, s) {
  const P = trueIndex(p, a, s);
  return a.map((ai, i) => ai * Math.pow(p[i] / P, -s));
}

/* Spending shares when prices are p (they do not depend on income: CES is homothetic). */
export function shares(p, a, s) {
  const x = hicksian(p, a, s);
  const spend = x.map((xi, i) => xi * p[i]);
  const tot = spend.reduce((u, v) => u + v, 0);
  return spend.map((v) => v / tot);
}

const cost = (p, q) => p.reduce((x, pi, i) => x + pi * q[i], 0);

/* Laspeyres: what the OLD basket costs now, over what it cost then. */
export const laspeyres = (p0, p1, q0) => cost(p1, q0) / cost(p0, q0);
/* Paasche: what the NEW basket costs now, over what it would have cost then. */
export const paasche = (p0, p1, q1) => cost(p1, q1) / cost(p0, q1);
/* Fisher: the geometric mean of the two. */
export const fisher = (p0, p1, q0, q1) => Math.sqrt(laspeyres(p0, p1, q0) * paasche(p0, p1, q1));
/* Törnqvist: price relatives weighted by the average of the two years' shares. */
export function tornqvist(p0, p1, q0, q1) {
  const s0 = p0.map((pi, i) => pi * q0[i]);
  const s1 = p1.map((pi, i) => pi * q1[i]);
  const t0 = s0.reduce((u, v) => u + v, 0), t1 = s1.reduce((u, v) => u + v, 0);
  return Math.exp(p0.reduce((x, pi, i) => x + 0.5 * (s0[i] / t0 + s1[i] / t1) * Math.log(p1[i] / pi), 0));
}

/*
  The two-good case the article is built on: energy's price is multiplied by R,
  everything else stays put. Returns every index, and the baskets the diagram
  draws. The household's new basket is its Hicksian basket B (any other income
  gives a scaled copy of it, and scaling a basket changes no index).
*/
export function shock(R, s, w = 0.2) {
  const a = [w, 1 - w];
  const p0 = [1, 1], p1 = [R, 1];
  const A = hicksian(p0, a, s); // equals a
  const B = hicksian(p1, a, s);
  const L = laspeyres(p0, p1, A);
  const P = paasche(p0, p1, B);
  return {
    A, B, L, P,
    F: Math.sqrt(L * P),
    T: tornqvist(p0, p1, A, B),
    C: trueIndex(p1, a, s),
    // The square-law approximation to the Laspeyres gap, in logs.
    squareLaw: 0.5 * s * w * (1 - w) * Math.log(R) ** 2,
  };
}

/* Points on the base-year indifference curve, traced by its Hicksian baskets. */
export function indifferenceCurve(s, w = 0.2, n = 161, span = 7) {
  const a = [w, 1 - w];
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = Math.exp(-span + (2 * span * k) / (n - 1)); // relative price of energy
    pts.push(hicksian([t, 1], a, s));
  }
  return pts;
}

/*
  Chain an index month by month along a path of prices, updating the basket
  every month to what the household actually buys. Returns the chained
  Laspeyres, Paasche and Fisher, and the true index at the end of the path.
*/
export function chained(path, a, s) {
  let L = 1, P = 1, F = 1;
  const series = [{ L, P, F, C: 1 }];
  for (let t = 1; t < path.length; t++) {
    const p0 = path[t - 1], p1 = path[t];
    const q0 = hicksian(p0, a, s), q1 = hicksian(p1, a, s);
    const l = laspeyres(p0, p1, q0), pp = paasche(p0, p1, q1);
    L *= l; P *= pp; F *= Math.sqrt(l * pp);
    series.push({ L, P, F, C: trueIndex(p1, a, s) / trueIndex(path[0], a, s) });
  }
  return series;
}

export const smoothPath = (R, months) =>
  Array.from({ length: months + 1 }, (_, k) => [Math.pow(R, k / months), 1]);

export const salePath = (salePrice, months) =>
  Array.from({ length: months + 1 }, (_, k) => [k % 2 ? salePrice : 1, 1]);
