/*
  The firm's problem: a wage buys effort. Effort is

      e(w) = 1 − (w_r / w)^a,

  rising in the wage, with w_r the reservation wage and a the curvature
  control (a ≥ 1). The firm pays w per worker and gets e(w) per worker, so
  the cost per unit of effort is w/e(w), and the optimal wage minimises it.

  Two routes share no code:
    - closed form: d/dw [w/e] = 0 gives w* = w_r·(1+a)^(1/a) and
      e* = a/(1+a), so the elasticity of effort with respect to the wage is
      EXACTLY 1 at the optimum — the Solow condition, and geometrically the
      tangency of a ray from the origin;
    - golden-section minimisation of w/e(w), which never sees the forms.

  The monitoring version (the Shapiro–Stiglitz reading): a worker shirks
  unless the premium R = w − w_r satisfies R·p·F ≥ g, so with the shirk
  gain g = w_r the no-shirking wage is w_r·(1 + 1/(pF)) — the premium
  fraction is exactly 1/(pF): monitoring and penalty are perfect
  substitutes on a hyperbola.

  The invariance: total wage cost for L workers is L·w/e(w), so the argmin
  is a property of the effort curve alone. The solver takes L as an
  argument — it reads it — and the checks assert the wage it returns does
  not move.
*/
export const WR = 10; // reservation wage

export const effort = (w, wr = WR, a = 1) => 1 - Math.pow(wr / w, a);

export const unitCost = (w, wr = WR, a = 1) => w / effort(w, wr, a);

function goldenMin(f, lo, hi) {
  const g = (Math.sqrt(5) - 1) / 2;
  let a = lo;
  let b = hi;
  for (let i = 0; i < 400; i++) {
    const x = b - g * (b - a);
    const y = a + g * (b - a);
    if (f(x) < f(y)) b = y;
    else a = x;
  }
  return (a + b) / 2;
}

/* The optimal wage by search, with the workforce as an argument (the oracle
   rule: the solver reads L, and the claim is that the answer ignores it). */
export const optimalWage = (wr = WR, a = 1, L = 1) =>
  goldenMin((w) => (L * w) / effort(w, wr, a), wr * (1 + 1e-9), wr * 100);

export const closedWage = (wr = WR, a = 1) => wr * Math.pow(1 + a, 1 / a);
export const closedEffort = (a = 1) => a / (1 + a);
export const closedUnitCost = (wr = WR, a = 1) =>
  (wr * Math.pow(1 + a, 1 / a)) / (a / (1 + a));

/* The elasticity of effort with respect to the wage, by central difference. */
export const elasticityAt = (w, wr = WR, a = 1) => {
  const h = w * 1e-6;
  const ep = (effort(w + h, wr, a) - effort(w - h, wr, a)) / (2 * h);
  return (ep * w) / effort(w, wr, a);
};

/* The no-shirking wage: premium fraction exactly 1/(pF). */
export const noShirkingWage = (p, F = 1, wr = WR, g = WR) => wr * (1 + 1 / (p * F));
export const premiumPct = (p, F = 1) => (100 / (p * F));