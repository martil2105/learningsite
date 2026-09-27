/*
  The statistic itself, and the three facts about it that this article turns on.

    PSI = sum_i (a_i - e_i) * ln(a_i / e_i)

  where e is the baseline (development, "expected") proportion in bin i and a
  is the current (monitoring, "actual") one.

  Three things are worth writing down here rather than in the prose, because
  every component and every check imports them from this file.

  1. PSI IS THE KULLBACK-LEIBLER DIVERGENCE J. Expand the product:

       sum (a-e) ln(a/e) = sum a ln(a/e) + sum e ln(e/a) = KL(A||E) + KL(E||A)

     which is exactly the quantity Kullback and Leibler (1951) call the
     divergence J(1,2), as opposed to the directed information I(1:2). PSI is
     not an index someone invented for credit scorecards; it is the sample
     version of a 1951 definition. `jeffreys()` below checks the identity at
     machine precision and `verify/check-numbers.mjs` asserts it.

  2. EVERY TERM IS NON-NEGATIVE. (a-e) and ln(a/e) always share a sign, so no
     bin can offset another and PSI is a sum of non-negative contributions,
     zero only where a_i = e_i. That is why refining the bins can only push PSI
     up, and it is why PSI has a noise floor rather than averaging out.

  3. THE TERM IS ASYMMETRIC IN THE RATIO. Writing r = a/e, one bin contributes
     e*(r-1)*ln(r). At r = 2 that is 0.693e; at r = 1/2 it is 0.347e. Mass
     arriving in a bin is charged about twice what the same relative amount of
     mass leaving it is charged - and as r -> 0 the term still diverges, just
     logarithmically rather than like r ln r. This is what makes an empty bin a
     problem and the epsilon that patches it a free parameter.
*/

/*
  Interior bin edges at the quantiles of a sorted baseline sample.

  Taking the (k*M/B)-th order statistic and half-open bins [lo, hi) puts
  EXACTLY M/B baseline observations in every bin whenever B divides M - which
  covers the ten the article uses throughout - so the expected proportions are
  exactly 1/B and no rounding creeps into the reference side. For a B that does
  not divide M the counts differ by at most one observation in fifty thousand,
  and every figure that uses such a B is comparative rather than quoted to the
  fourth decimal.

  Note what quantile bins buy: the outer bins run to -infinity and +infinity,
  so no observation can ever land outside the scheme. Fixed-width bins have to
  decide what to do with a value below the lowest edge; this does not.
*/
export function quantileEdges(sortedBaseline, B) {
  const M = sortedBaseline.length;
  const edges = [];
  for (let k = 1; k < B; k++) edges.push(sortedBaseline[Math.round((k * M) / B)]);
  return edges;
}

/* Index of the bin a value falls in, given B-1 interior edges. Binary search,
   half-open on the left edge: bin i is [edges[i-1], edges[i]). */
export function binOf(x, edges) {
  let lo = 0, hi = edges.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (x < edges[mid]) hi = mid; else lo = mid + 1;
  }
  return lo;
}

export function countsIn(values, edges) {
  const c = new Array(edges.length + 1).fill(0);
  for (let i = 0; i < values.length; i++) c[binOf(values[i], edges)]++;
  return c;
}

export function props(counts) {
  const n = counts.reduce((a, b) => a + b, 0);
  return n === 0 ? counts.map(() => 0) : counts.map((c) => c / n);
}

/*
  Per-bin contributions.

  `eps` is the floor substituted for a zero proportion. It is a parameter and
  not a detail: the article's Bins section shows the same monitoring window
  scoring differently at 1e-3 and 1e-6, because the term diverges as a -> 0.
  The default here is the one most implementations use. Passing eps = 0 leaves
  an empty bin as Infinity, which is the honest answer and what the checks use
  when they want to see the divergence.
*/
export function terms(a, e, eps = 1e-4) {
  const out = new Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] > 0 ? a[i] : eps;
    const ei = e[i] > 0 ? e[i] : eps;
    out[i] = (ai - ei) * Math.log(ai / ei);
  }
  return out;
}

export function psi(a, e, eps = 1e-4) {
  const t = terms(a, e, eps);
  let s = 0;
  for (let i = 0; i < t.length; i++) s += t[i];
  return s;
}

/* KL(A||E) and KL(E||A) separately, so the identity in (1) can be checked
   rather than asserted. */
export function klParts(a, e, eps = 1e-4) {
  let ae = 0, ea = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] > 0 ? a[i] : eps;
    const ei = e[i] > 0 ? e[i] : eps;
    ae += ai * Math.log(ai / ei);
    ea += ei * Math.log(ei / ai);
  }
  return { forward: ae, reverse: ea, jeffreys: ae + ea };
}

/*
  THE NOISE FLOOR.

  Under the null - both samples from the same population - the scaled statistic
  (1/N + 1/M)^-1 * PSI is approximately chi-square with B-1 degrees of freedom
  (Yurdakul & Naranjo 2020, Theorem 3.3; the expansion is in the article). A
  chi-square with B-1 degrees of freedom has mean B-1, so

      E[PSI | no drift]  ~  (B-1) * (1/N + 1/M)
      sd[PSI | no drift]  ~  sqrt(2(B-1)) * (1/N + 1/M)

  This is the whole article in one function. It is a BIAS, not a variance:
  PSI reads high by this amount whether or not anything moved, because every
  term is non-negative and sampling noise can only add.
*/
export const floorOf = (B, N, M) => (B - 1) * (1 / N + 1 / M);
export const sdOf = (B, N, M) => Math.sqrt(2 * (B - 1)) * (1 / N + 1 / M);

/* The bias-corrected reading. An estimate of the population divergence rather
   than of the population divergence plus your sample size. It can come out
   negative, which is what an unbiased estimate of a non-negative quantity does
   when the quantity is near zero, and is not a bug. */
export const adjusted = (value, B, N, M) => value - floorOf(B, N, M);

export const effectiveN = (N, M) => (N * M) / (N + M);
