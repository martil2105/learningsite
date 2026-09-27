/*
  Choosing a technology, and what the choice is worth.

  A technology is a fixed-proportions recipe for one job: N units of the first
  input and R units of the second. At input prices w and p it costs

      c(N, R) = w*N + p*R

  so every technology is a POINT in input space, and every budget is a line of
  slope -w/p. The whole subject is one number, the relative price

      r = w / p,

  because scaling both prices scales every cost by the same factor and cannot
  change which technology is cheapest. Everything below is written in units of
  p, so a cost is r*N + R and money only reappears at the last step.

  The dual reading is the one the article is about. Fix the technology and let r
  move, and each technology becomes a LINE in (r, cost) space with slope N and
  intercept R. The cheapest available cost is then the lower envelope of those
  lines, and a technology is ever chosen exactly when its line touches it.

  Nothing here closes over reactive state: every function takes its parameters
  as arguments and returns a value, so a component can call it from a $derived
  and dirty tracking works.
*/

/* ---- the two tests -------------------------------------------------------- */

/* a dominates b: no more of either input, and less of at least one. The test a
   reader can run with a rectangle, and the only one the textbook account
   offers. */
export const dominates = (a, b) =>
  a.N <= b.N && a.R <= b.R && (a.N < b.N || a.R < b.R);

export const isDominated = (t, set) => set.some((o) => o !== t && dominates(o, t));

export const undominated = (set) => set.filter((t) => !isDominated(t, set));

/* The interval of relative prices on which t is the UNIQUE cheapest technology
   in the set, as an exact algebraic fact rather than a search.

   t is at least as cheap as o when  r*N_t + R_t <= r*N_o + R_o, i.e.
   r*(N_t - N_o) <= R_o - R_t. Each rival therefore contributes one bound, an
   upper one if t uses more of the first input and a lower one if it uses less.
   Returns null when the bounds cross, which is what "never chosen" means. */
export function winInterval(t, set) {
  let lo = 0;
  let hi = Infinity;
  for (const o of set) {
    if (o === t) continue;
    const a = t.N - o.N;
    const b = o.R - t.R;
    if (a > 0) hi = Math.min(hi, b / a);
    else if (a < 0) lo = Math.max(lo, b / a);
    else if (b <= 0) return null; // same first input, no more of the second
  }
  return lo < hi ? { lo, hi } : null;
}

export const isEverChosen = (t, set) => winInterval(t, set) !== null;

/* The same set of technologies, found geometrically instead: the vertices of
   the lower-left convex hull of the points, left to right. Shares no algebra
   with winInterval, which is the point — the article's claim is that these two
   constructions return the same technologies, and the check asserts it. */
export function lowerHull(set) {
  const pts = undominated(set)
    .slice()
    .sort((a, b) => a.N - b.N || a.R - b.R);

  // after removing dominated points, N is strictly increasing and R strictly
  // decreasing, so a single monotone chain is the whole hull.
  const hull = [];
  const turnsUp = (o, a, b) =>
    (a.N - o.N) * (b.R - o.R) - (a.R - o.R) * (b.N - o.N) <= 0;
  for (const p of pts) {
    while (hull.length >= 2 && turnsUp(hull[hull.length - 2], hull[hull.length - 1], p))
      hull.pop();
    hull.push(p);
  }
  return hull;
}

/* ---- costs --------------------------------------------------------------- */

export const cost = (t, w, p) => w * t.N + p * t.R;

/* Cost in units of p, which is the only thing the choice depends on. */
export const costAt = (t, r) => r * t.N + t.R;

/* The cheapest technology at relative price r. Ties go to the one using less of
   the first input, so the value is defined everywhere including at a switch. */
export function cheapest(set, r) {
  let best = null;
  for (const t of set) {
    if (
      best === null ||
      costAt(t, r) < costAt(best, r) ||
      (costAt(t, r) === costAt(best, r) && t.N < best.N)
    )
      best = t;
  }
  return best;
}

/* The lower envelope: the cheapest cost available at r, in units of p. */
export const envelope = (set, r) => Math.min(...set.map((t) => costAt(t, r)));

/* How much of the first input the industry uses at r. The envelope's slope,
   which is the identity the article puts on screen. */
export const inputDemand = (set, r) => cheapest(set, r).N;

/* The relative prices at which the choice changes, in increasing order: the
   slopes of the hull's edges, negated. Between two consecutive prices the
   chosen technology does not move. */
export function switchPrices(set) {
  const hull = lowerHull(set);
  const out = [];
  for (let i = 0; i + 1 < hull.length; i++) {
    const a = hull[i];
    const b = hull[i + 1];
    out.push((a.R - b.R) / (b.N - a.N));
  }
  return out.sort((x, y) => x - y);
}

/* ---- rent ---------------------------------------------------------------- */

/* What a firm holding technology t gives up by holding it: the vertical gap
   between its own line and the envelope, in units of p. Zero exactly when t is
   the cheapest thing available, which is the whole of "competition destroys
   the rent". */
export const gap = (t, set, r) => costAt(t, r) - envelope(set, r);

/* The rent to switching from `from` to `to`, in money, at prices (w, p): the
   cost you stop paying. Positive is a reason to switch. */
export const rent = (from, to, w, p) => cost(from, w, p) - cost(to, w, p);

/* The same rent's rate of change in the relative price: exactly the amount of
   the first input the switch sheds. */
export const rentSlope = (from, to) => from.N - to.N;
