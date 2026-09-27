/*
  One family of demand curves, every member pinned through the same point
  with the same local elasticity — so the Lerner rule reads the same number
  off all of them, and pass-through alone tells them apart.

  A member is q(p) = (a + b·p)^n, with b negative when n is positive and
  positive when n is negative, so demand always falls in price. The pin:
  q(P0) = Q0 and |elasticity| = EPS0 at P0, which fixes
      u = a + b·P0 = Q0^(1/n),  b = -sign(n)·EPS0·u/(|n|·P0),  a = u − b·P0.
  Two familiar members: n = 1 is the straight line 120 − 3p, and n = −5/3
  is the constant-elasticity curve 45·(p/25)^(−5/3).

  The monopoly optimum has a closed form for the whole family. The
  first-order condition (p−c)·q' + q = 0 reduces, for a power of an affine,
  to n·b·p − n·b·c + a + b·p = 0, so
      p*(c) = (n·c − a/b)/(n + 1),
  and differentiating in c gives the pass-through
      rho = n/(n + 1) — exact, for every member, at every cost.
*/
export const P0 = 25;
export const Q0 = 45;
export const EPS0 = 5 / 3;
export const C0 = 10;

export function family(n) {
  const u = Math.pow(Q0, 1 / n);
  const b = (-(Math.sign(n) * EPS0) * u) / (Math.abs(n) * P0);
  const a = u - b * P0;
  return { n, a, b };
}

/* Quantity demanded; guard the domain where a + b·p > 0. */
export function q(d, p) {
  const v = d.a + d.b * p;
  return v > 0 ? Math.pow(v, d.n) : 0;
}

/* |elasticity| at p, where the domain holds. */
export function elasticity(d, p) {
  const v = d.a + d.b * p;
  return v > 0 ? (Math.abs(d.n * d.b) * p) / v : Infinity;
}

/* The monopoly price at marginal cost c, closed form. */
export function optimalPrice(d, c) {
  return (d.n * c - d.a / d.b) / (d.n + 1);
}

/* The same optimum by golden section — the independent route the checks
   compare against. No closed form in sight. */
export function numericOptimal(d, c) {
  const profit = (p) => (p - c) * q(d, p);
  const hi = d.b < 0 ? -d.a / d.b : 1e6;
  const lo = c * (1 + 1e-9);
  const g = (Math.sqrt(5) - 1) / 2;
  let a = lo;
  let z = hi;
  for (let i = 0; i < 300; i++) {
    const x = z - g * (z - a);
    const y = a + g * (z - a);
    if (profit(x) > profit(y)) z = y;
    else a = x;
  }
  return (a + z) / 2;
}

/* Pass-through, closed and numeric (a central difference of the optimum). */
export const passThrough = (n) => n / (1 + n);

export function numericPassThrough(d, c, h = 1e-4) {
  return (
    (numericOptimal(d, c + h) - numericOptimal(d, c - h)) / (2 * h)
  );
}

/* Profit at a price. */
export const profit = (d, p, c) => (p - c) * q(d, p);