/*
  The data.

  A model that scores each pump in a fleet with the probability it fails in the
  next 48 hours. One domain for the whole article, and two costs that an
  engineer can actually name: an inspection is cheap and annoying, an unplanned
  shutdown is not.

  The scores are CALIBRATED BY CONSTRUCTION, and that is the load-bearing
  choice in this file. Each unit is given a true risk, and whether it fails is
  a coin weighted by that risk — so the number the model reports really is the
  probability, and a threshold on it has an exact decision-theoretic reading:

      predict failure when  risk > t   is the rule that minimises expected cost
      when                  cost(missed failure) / cost(false alarm) = (1-t)/t

  Without calibration that identity is only approximate, and the whole argument
  of this article — what tradeoff a threshold is quietly asserting — would rest
  on an approximation. It rests on an identity instead.

  Prevalence is changed by changing the MIX, never the components: some fraction
  of the fleet is degrading and the rest is healthy, and the two risk
  distributions stay exactly where they are. So when the article slides
  prevalence, the model's function is untouched. That is the point of that
  figure.
*/
import { mulberry32, gaussian } from "./rng.js";

/* Marsaglia-Tsang. Boosting a<1 by sampling at a+1 and scaling keeps the one
   branch that would otherwise reject forever near zero. */
function gammaSample(a, rand) {
  if (a < 1) return gammaSample(a + 1, rand) * Math.pow(rand(), 1 / a);
  const d = a - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do {
      x = gaussian(rand);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

export function betaSample(a, b, rand) {
  const x = gammaSample(a, rand);
  const y = gammaSample(b, rand);
  return x / (x + y);
}

/*
  Two populations, both fixed forever.

  HEALTHY is almost all of the fleet and almost never fails. DEGRADING is the
  minority the model is for: risks spread across the whole range, which is what
  gives the PR curve something to be shaped like.
*/
export const HEALTHY = { a: 1.1, b: 90 };   // mean risk ~1.2%
export const DEGRADING = { a: 2.6, b: 4.2 }; // mean risk ~38%

export const DEFAULT_DEGRADED = 0.055;
export const DEFAULT_N = 6000;

/*
  One validation set. `degraded` is the share of the fleet in the degrading
  population — the only thing that moves when the article talks about drift.
*/
export function sample(n = DEFAULT_N, degraded = DEFAULT_DEGRADED, seed = 20260908) {
  const rand = mulberry32(seed);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const bad = rand() < degraded;
    const p = bad ? betaSample(DEGRADING.a, DEGRADING.b, rand) : betaSample(HEALTHY.a, HEALTHY.b, rand);
    // The label is a coin weighted by the score. This is what makes the score
    // a probability rather than merely a ranking.
    rows.push({ score: p, y: rand() < p ? 1 : 0 });
  }
  return rows;
}

/* The analytic mixture density of the score, for the cross-check and for the
   drift figure's exact curves. */
function betaPdf(x, a, b) {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp(
    (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b)
  );
}
function logGamma(z) {
  // Lanczos, g=7, n=9. Plenty for the shapes used here.
  const g = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = g[0];
  for (let i = 1; i < 9; i++) x += g[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
const logBeta = (a, b) => logGamma(a) + logGamma(b) - logGamma(a + b);

export const scorePdf = (x, degraded = DEFAULT_DEGRADED) =>
  degraded * betaPdf(x, DEGRADING.a, DEGRADING.b) +
  (1 - degraded) * betaPdf(x, HEALTHY.a, HEALTHY.b);

/* Prevalence is the mean score, because the score is the probability. */
export const truePrevalence = (degraded = DEFAULT_DEGRADED) =>
  degraded * (DEGRADING.a / (DEGRADING.a + DEGRADING.b)) +
  (1 - degraded) * (HEALTHY.a / (HEALTHY.a + HEALTHY.b));

export const pct = (x, d = 1) => (100 * x).toFixed(d) + "%";
