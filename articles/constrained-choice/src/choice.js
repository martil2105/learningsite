/*
  The worker's problem.

  A day holds T hours. You choose free time f, work the rest, and consume what
  the wage buys: c = w(T - f). Preferences are CES over consumption and free
  time,

      U(c, f) = [ a*c^rho + (1-a)*f^rho ]^(1/rho),     rho = 1 - 1/sigma

  where sigma is the elasticity of substitution between the two. sigma = 1 is
  the Cobb-Douglas case every course draws, and it is the one the article is
  about.

  Nothing here closes over reactive state: every function takes its parameters
  as arguments and returns a value, so a component can call it from a $derived
  and dirty tracking works.
*/

export const rhoOf = (sigma) => 1 - 1 / sigma;

export function utility(c, f, { a, sigma }) {
  if (c <= 0 || f <= 0) return 0;
  if (sigma === 1) return Math.pow(c, a) * Math.pow(f, 1 - a);
  const rho = rhoOf(sigma);
  return Math.pow(a * Math.pow(c, rho) + (1 - a) * Math.pow(f, rho), 1 / rho);
}

/* Marginal rate of substitution: how much consumption an hour of free time is
   worth to you, at this bundle. The tangency condition is MRS = w. */
export function mrs(c, f, { a, sigma }) {
  if (sigma === 1) return ((1 - a) / a) * (c / f);
  return ((1 - a) / a) * Math.pow(f / c, rhoOf(sigma) - 1);
}

/* Consumption on the indifference curve through utility level U, at free time
   f. Returns null where the curve has an asymptote and no finite c exists,
   which happens for every sigma < 1. */
export function indifferenceC(f, U, { a, sigma }) {
  if (f <= 0) return null;
  if (sigma === 1) return Math.pow(U / Math.pow(f, 1 - a), 1 / a);
  const rho = rhoOf(sigma);
  const g = (Math.pow(U, rho) - (1 - a) * Math.pow(f, rho)) / a;
  if (!(g > 0)) return null;
  const c = Math.pow(g, 1 / rho);
  return Number.isFinite(c) ? c : null;
}

/* The optimum, in closed form. Full income is w*T; free time costs w and
   consumption costs 1. */
export function optimum(w, { a, sigma, T }) {
  const A = Math.pow(a, sigma);
  const B = Math.pow(1 - a, sigma) * Math.pow(w, 1 - sigma);
  const f = (B * T) / (A + B);
  return { f, h: T - f, c: w * (T - f) };
}

/* The same optimum, recovered independently: bisect the first-order condition
   MRS = w. Shares no algebra with optimum(), which is the point. */
export function optimumByFOC(w, { a, sigma, T }) {
  const g = (f) => mrs(w * (T - f), f, { a, sigma }) - w;
  let lo = 1e-12, hi = T - 1e-12;
  if (!(g(lo) > 0) || !(g(hi) < 0)) throw new Error("FOC not bracketed");
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    if (g(mid) > 0) lo = mid; else hi = mid;
  }
  const f = 0.5 * (lo + hi);
  return { f, h: T - f, c: w * (T - f) };
}

/* And a third way: golden-section search on U itself. It agrees to about 2e-8
   and no better, because a maximum is flat. That is why the condition is
   solved rather than the maximum searched. */
export function optimumByMax(w, { a, sigma, T }) {
  const phi = (Math.sqrt(5) - 1) / 2;
  let lo = 1e-9, hi = T - 1e-9;
  let x1 = hi - phi * (hi - lo), x2 = lo + phi * (hi - lo);
  const U = (f) => utility(w * (T - f), f, { a, sigma });
  for (let i = 0; i < 400; i++) {
    if (U(x1) > U(x2)) { hi = x2; x2 = x1; x1 = hi - phi * (hi - lo); }
    else { lo = x1; x1 = x2; x2 = lo + phi * (hi - lo); }
  }
  const f = 0.5 * (lo + hi);
  return { f, h: T - f, c: w * (T - f) };
}

/* Demands at an arbitrary income M, prices (1, w). Needed to compensate. */
export function demandAtIncome(w, M, { a, sigma }) {
  const A = Math.pow(a, sigma);
  const B = Math.pow(1 - a, sigma) * Math.pow(w, -sigma);
  const D = A + B * w;
  return { c: (A * M) / D, f: (B * M) / D };
}

/* Hicks decomposition of a wage change. The substitution effect is the move
   along the original indifference curve; the income effect is what is left. */
export function hicks(w0, w1, p) {
  const b0 = optimum(w0, p);
  const b1 = optimum(w1, p);
  const U0 = utility(b0.c, b0.f, p);
  let lo = 1e-9, hi = 1e12;
  for (let i = 0; i < 300; i++) {
    const M = 0.5 * (lo + hi);
    const d = demandAtIncome(w1, M, p);
    if (utility(d.c, d.f, p) < U0) lo = M; else hi = M;
  }
  const Mh = 0.5 * (lo + hi);
  const bh = demandAtIncome(w1, Mh, p);
  return {
    f0: b0.f, f1: b1.f, fh: bh.f, U0,
    substitution: bh.f - b0.f,
    income: b1.f - bh.f,
    total: b1.f - b0.f,
  };
}

/* log(h/f) is exactly linear in log w, with slope sigma - 1. */
export const logOdds = (w, p) => Math.log(optimum(w, p).h / optimum(w, p).f);
export const logOddsLine = (w, { a, sigma }) =>
  sigma * Math.log(a / (1 - a)) + (sigma - 1) * Math.log(w);

/* Uncompensated elasticity of hours worked with respect to the wage. */
export const hoursElasticity = (w, p) => (p.sigma - 1) * (optimum(w, p).f / p.T);

/* Stone-Geary: Cobb-Douglas over (c - cbar) and f, with cbar a subsistence
   floor that has to be paid before anything is a choice. */
export const stoneGearyHours = (w, { a, T, cbar }) => a * T + (1 - a) * cbar / w;

export function stoneGearyByFOC(w, { a, T, cbar }) {
  const g = (f) => ((1 - a) / a) * ((w * (T - f) - cbar) / f) - w;
  let lo = 1e-12, hi = T - cbar / w - 1e-12;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    if (g(mid) > 0) lo = mid; else hi = mid;
  }
  return T - 0.5 * (lo + hi);
}
