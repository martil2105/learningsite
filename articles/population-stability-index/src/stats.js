/*
  The numerical machinery this article leans on.

  Everything here is either an identity the prose asserts or an input to one, so
  accuracy is not a stylistic matter: the whole argument is that PSI's null
  distribution is chi-square with a known scale, and a sloppy chi-square CDF
  would let a wrong claim pass its own check. Each routine below names the
  accuracy it delivers.
*/

/* ------------------------------------------------------------------ normal */

/*
  Cumulative normal, Hart's algorithm in the form given by West (2005).
  Double precision across the whole range, including the far tail, which
  matters here because the decile edges of a mixture are found by inverting
  this and the outer bins run to infinity.
*/
export function normCdf(z) {
  const x = Math.abs(z);
  let c;
  if (x > 37) {
    c = 0;
  } else {
    const e = Math.exp(-x * x / 2);
    if (x < 7.07106781186547) {
      let b = 3.52624965998911e-2 * x + 0.700383064443688;
      b = b * x + 6.37396220353165;
      b = b * x + 33.912866078383;
      b = b * x + 112.079291497871;
      b = b * x + 221.213596169931;
      b = b * x + 220.206867912376;
      let d = 8.83883476483184e-2 * x + 1.75566716318264;
      d = d * x + 16.064177579207;
      d = d * x + 86.7807322029461;
      d = d * x + 296.564248779674;
      d = d * x + 637.333633378831;
      d = d * x + 793.826512519948;
      d = d * x + 440.413735824752;
      c = e * b / d;
    } else {
      let b = x + 0.65;
      b = x + 4 / b;
      b = x + 3 / b;
      b = x + 2 / b;
      b = x + 1 / b;
      c = e / (b * 2.506628274631);
    }
  }
  return z > 0 ? 1 - c : c;
}

export function normPdf(z) {
  return Math.exp(-0.5 * z * z) / 2.5066282746310002;
}

/*
  Inverse normal CDF: Acklam's rational approximation (relative error < 1.15e-9)
  followed by one Halley step against normCdf, which takes it to machine
  precision. The refinement is not decoration - the decile edges of the
  baseline are computed by inverting a mixture CDF that calls this, and an
  error of 1e-9 in an edge is an error of 1e-9 in a bin probability, which is
  the same order as the quantities the bias correction is subtracting.
*/
export function normInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
  const pl = 0.02425, ph = 1 - pl;
  let x;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= ph) {
    const q = p - 0.5, r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
         ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const e = normCdf(x) - p;
  const u = e * 2.5066282746310002 * Math.exp(x * x / 2);
  return x - u / (1 + x * u / 2);
}

/* ------------------------------------------------------- gamma, chi-square */

const LNG_C = [76.18009172947146, -86.50532032941677, 24.01409824083091,
               -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];

export function lnGamma(x) {
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += LNG_C[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

/* Regularised lower incomplete gamma P(a,x). Series below the crossover,
   Lentz continued fraction above; both iterated to 1e-14 relative. */
export function gammaP(a, x) {
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 500; n++) {
      ap++;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-15) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }
  const FPMIN = 1e-300;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i <= 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;  if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}

export const chi2Cdf = (x, k) => (x <= 0 ? 0 : gammaP(k / 2, x / 2));
export const chi2Sf = (x, k) => 1 - chi2Cdf(x, k);

/* Quantile by bisection on the CDF. 200 halvings of a bracket that starts at
   [0, k + 20 sqrt(2k) + 40] is well past double precision. */
export function chi2Inv(p, k) {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  let lo = 0, hi = k + 20 * Math.sqrt(2 * k) + 40;
  while (chi2Cdf(hi, k) < p) hi *= 2;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (chi2Cdf(mid, k) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/* --------------------------------------------------------------- sampling */

/*
  Marsaglia-Tsang (2000) gamma sampler. Squeeze-accelerated rejection, no
  rejection loop longer than a handful of iterations in practice. Shapes below
  1 are boosted and scaled back, which is the authors' own recommendation.
*/
export function gammaSample(shape, rand) {
  if (shape < 1) {
    const u = rand();
    return gammaSample(shape + 1, rand) * Math.pow(u === 0 ? 1e-300 : u, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do {
      x = gaussianFrom(rand);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function gaussianFrom(rand) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

export function betaSample(a, b, rand) {
  const x = gammaSample(a, rand);
  const y = gammaSample(b, rand);
  return x / (x + y);
}

/*
  Exact binomial sampling at any n.

  The article's central claim is a statement about the sampling distribution of
  PSI, so the simulation that draws that distribution cannot itself use a
  normal approximation to the multinomial - it would be assuming the answer.
  Small n goes through inversion; large n uses Devroye's beta recursion, which
  is exact at every step:

      V ~ Beta(a, n+1-a);  V > p  =>  Bin(n,p) =d Bin(a-1, p/V)
                           V <= p =>  Bin(n,p) =d a + Bin(n-a, (p-V)/(1-V))

  Depth is log2(n/40), so a million trials costs about fifteen beta draws.
*/
export function binomialSample(n, p, rand) {
  if (n <= 0) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return n;
  if (n < 40) {
    let k = 0;
    for (let i = 0; i < n; i++) if (rand() < p) k++;
    return k;
  }
  const a = 1 + Math.floor(n / 2);
  const v = betaSample(a, n + 1 - a, rand);
  if (v > p) return binomialSample(a - 1, p / v, rand);
  return a + binomialSample(n - a, (p - v) / (1 - v), rand);
}

/* Multinomial by conditional binomials. Exact. */
export function multinomialSample(n, probs, rand) {
  const k = probs.length;
  const out = new Array(k).fill(0);
  let rem = n, left = 1;
  for (let i = 0; i < k - 1; i++) {
    if (rem <= 0 || left <= 0) break;
    const q = Math.min(1, Math.max(0, probs[i] / left));
    const c = binomialSample(rem, q, rand);
    out[i] = c;
    rem -= c;
    left -= probs[i];
  }
  out[k - 1] = Math.max(0, rem);
  return out;
}

/* Dirichlet(alpha), for the baseline bin probabilities induced by random
   quantile edges. See nulllaw.js for why that is the right law. */
export function dirichletSample(alpha, rand) {
  const g = alpha.map((a) => gammaSample(a, rand));
  const s = g.reduce((x, y) => x + y, 0);
  return g.map((x) => x / s);
}

/* ---------------------------------------------------------------- helpers */

export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs) => sum(xs) / xs.length;

export function quantileOfSorted(sorted, q) {
  if (q <= 0) return sorted[0];
  if (q >= 1) return sorted[sorted.length - 1];
  const h = (sorted.length - 1) * q;
  const lo = Math.floor(h);
  const hi = Math.min(sorted.length - 1, lo + 1);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

/* Trapezoid on a uniform grid. Used for the exact integrals: portfolio bad
   rate, approval rate, AUC. Sampling those would put Monte Carlo noise into
   numbers the prose quotes to three decimals. */
export function trapz(ys, dx) {
  let s = 0;
  for (let i = 1; i < ys.length; i++) s += (ys[i - 1] + ys[i]) / 2;
  return s * dx;
}
