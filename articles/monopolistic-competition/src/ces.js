/*
 * ces.js - Core model for Monopolistic Competition (Mi10)
 *
 * Implements the Dixit-Stiglitz CES monopolistic competition model with
 * the exact finite-n elasticity correction and scale-variety identities.
 */

export const C_DEFAULT = 1;

/**
 * Free-entry variety/firm count under CES preferences with total expenditure E,
 * fixed overhead f, and substitution elasticity sigma (s).
 *
 * Solves (p - c) * q(n) = f, where q(n) = E / (n * p).
 */
export function nOf(E, f, s) {
  return (E / f + s - 1) / s;
}

/**
 * Own-price demand elasticity faced by a single variety in an n-firm CES market.
 *
 * In textbook treatments this is often approximated by sigma, but the exact
 * elasticity is sigma - (sigma - 1) * share = sigma - (sigma - 1)/n.
 */
export function epsOf(n, s) {
  return s - (s - 1) / n;
}

/**
 * Monopoly pricing rule under own-price elasticity eps:
 * p = c * eps / (eps - 1).
 */
export function pOf(n, s, c = C_DEFAULT) {
  const eps = epsOf(n, s);
  return (c * eps) / (eps - 1);
}

/**
 * Price markup over marginal cost: p / c.
 */
export function markup(n, s) {
  const eps = epsOf(n, s);
  return eps / (eps - 1);
}

/**
 * Large-group (textbook Dixit-Stiglitz) markup: s / (s - 1).
 */
export function markupDS(s) {
  return s / (s - 1);
}

/**
 * Output per firm in symmetric equilibrium: x = E / (n * p).
 */
export function scaleOf(n, E, s, c = C_DEFAULT) {
  const p = pOf(n, s, c);
  return E / (n * p);
}

/**
 * Large-group asymptotic scale: x_DS = f * (s - 1) / c.
 */
export function scaleDS(f, s, c = C_DEFAULT) {
  return (f * (s - 1)) / c;
}

/**
 * Identity a: Firm scale shortfall compared to large-group scale.
 * 1 - x / x_DS = 1 / n.
 */
export function scaleShortfall(n) {
  return 1 / n;
}

/**
 * Identity b: Markup excess above large-group markup.
 * (m / m_DS) - 1 = 1 / (s * (n - 1)).
 */
export function markupExcess(n, s) {
  return 1 / (s * (n - 1));
}

/**
 * Variety count chosen by a constrained social planner:
 * Maximize U(n, x) subject to n * (c*x + f) = E  ==>  n_planner = E / (f * s).
 */
export function plannerCount(E, f, s) {
  return E / (f * s);
}

/**
 * Identity c: Excess varieties produced by the free market over the planner.
 * n_market - n_planner = (s - 1) / s.
 * Always strictly less than 1 variety!
 */
export function varietyExcess(s) {
  return (s - 1) / s;
}

/**
 * Single-firm economic profit: pi = (p - c) * q - f.
 */
export function profit(n, E, f, s, c = C_DEFAULT) {
  const p = pOf(n, s, c);
  const q = E / (n * p);
  return (p - c) * q - f;
}

/**
 * General CES demand for variety i given price vector ps, elasticity s, and expenditure E.
 */
export function demandCES(ps, i, s, E) {
  let den = 0;
  for (const p of ps) {
    den += Math.pow(p, 1 - s);
  }
  return (E * Math.pow(ps[i], -s)) / den;
}
