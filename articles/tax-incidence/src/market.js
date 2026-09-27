/*
  The market, the wedge, and two independent routes to the same equilibrium.

  Linear demand and supply, tax t per unit:
      demand:  q = A − B·pc      (pc = what the buyer pays)
      supply:  q = C + S·pp      (pp = what the seller keeps; pc − pp = t)

  Two routes, sharing no algebra:
    - solveSeller: the tax is levied on sellers, so supply shifts up by t;
    - solveBuyer:  the tax is levied on buyers, so demand shifts down by t.
  The article's claim is that these return the same prices and quantity
  bit for bit — statutory invariance — and the check sweeps both routes
  over the whole rate grid.

  Closed forms, exact for the straight-line market at every rate:
      consumer share of the burden = S/(B+S)   (independent of t)
      DWL = t²/2 · BS/(B+S)
      revenue peak t* = q0·(B+S)/(2BS), where q/q0 = 1/2 and DWL/revenue = 1/2.

  The iso-elastic market is where the textbook elasticity share stops being
  exact: it is a first-order rule, and the true share drifts as the rate
  grows. The drift is computed by bisecting the wedge, sharing no code with
  the linear algebra.
*/
export const A = 120, B = 3, C = 20, S = 2;

export const p0 = (A - C) / (B + S);
export const q0 = C + S * p0;

/* Route 1: levied on the seller. */
export function solveSeller(t, mkt = { A, B, C, S }) {
  const { A: a, B: b, C: c, S: s } = mkt;
  const pc = (a - c + s * t) / (b + s);
  return { pc, pp: pc - t, q: a - b * pc };
}

/* Route 2: levied on the buyer. */
export function solveBuyer(t, mkt = { A, B, C, S }) {
  const { A: a, B: b, C: c, S: s } = mkt;
  const pp = (a - c - b * t) / (b + s);
  return { pp, pc: pp + t, q: c + s * pp };
}

/* The consumer's share of the burden, exact for the linear market. */
export const consumerShare = (mkt = { A, B, C, S }) => mkt.S / (mkt.B + mkt.S);

/* Deadweight loss and revenue, exact. */
export const dwl = (t, mkt = { A, B, C, S }) =>
  0.5 * t * t * ((mkt.B * mkt.S) / (mkt.B + mkt.S));
export const revenue = (t, mkt = { A, B, C, S }) => t * solveSeller(t, mkt).q;

/* The revenue peak, and the two halves the article puts on screen. */
export function peak(mkt = { A, B, C, S }) {
  const { A: a, B: b, C: c, S: s } = mkt;
  const p_0 = (a - c) / (b + s);
  const q_0 = c + s * p_0;
  const tStar = (q_0 * (b + s)) / (2 * b * s);
  const at = solveSeller(tStar, mkt);
  return {
    tStar,
    revenue: tStar * at.q,
    dwl: dwl(tStar, mkt),
    qRatio: at.q / q_0,
    lossRatio: dwl(tStar, mkt) / (tStar * at.q),
  };
}

/* The prohibitive tax: the wedge that drives quantity to zero. */
export const tMax = (mkt = { A, B, C, S }) => (mkt.A - mkt.C) / mkt.B;

/*
  Iso-elastic market: demand q = D·pc^(−ed), supply q = X·pp^(es). The
  equilibrium before tax is where they cross; with a tax t the buyer's price
  solves B·(pp+t)^(es) = D·pp^(−ed), found by bisection. Returns the true
  consumer share of the burden, which the textbook formula approximates.
*/
export function isoShare(t, ed, es, rate0 = 1) {
  const D = rate0, X = rate0; // units chosen so the pre-tax price is 1
  const pp0 = 1;
  // find pp:  X·pp^es = D·(pp+t)^(−ed)
  const f = (pp) => X * Math.pow(pp, es) - D * Math.pow(pp + t, -ed);
  let lo = 1e-9, hi = Math.max(2, 2 * t + 2);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  const pp = (lo + hi) / 2;
  const pc = pp + t;
  return { pp, pc, share: (pc - pp0) / t };
}

/*
  Random linear markets for the peak identity: nothing about the two halves
  depends on the elasticities. Seeded, so the check re-derives the page.
*/
export function randomMarket(rand) {
  const A = 20 + 180 * rand();
  const B = 0.2 + 5 * rand();
  const C = -40 + 60 * rand();
  const S = 0.2 + 5 * rand();
  return { A, B, C, S };
}