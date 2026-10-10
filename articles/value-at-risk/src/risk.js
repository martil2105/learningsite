/*
  Value at risk and expected shortfall for a portfolio of n bonds.

  $100 is split equally over n bonds. Each defaults within the year with
  probability p, independently, and loses LGD of its value when it does, so
  the loss is (100·LGD/n)·K with K ~ Binomial(n, p). Losses are positive
  numbers; a gain would be a negative loss.

  VaR at level α is the smallest loss l with P(L ≤ l) ≥ α: the α-quantile.
  Expected shortfall is the average of the quantile function over (α, 1],
  ES = (1/(1−α)) ∫_α^1 q(u) du, which for a loss with atoms is
  (E[L; L > VaR] + VaR·(P(L ≤ VaR) − α)) / (1 − α).
*/
import { Phi, PhiInv } from "./stats.js";

export const P = 0.04, LGD = 0.6, STAKE = 100;

const lg = (() => { const c = [0]; for (let i = 1; i <= 2000; i++) c[i] = c[i - 1] + Math.log(i); return c; })();
export function pmf(n, p = P) {
  const out = new Float64Array(n + 1);
  for (let k = 0; k <= n; k++) out[k] = Math.exp(lg[n] - lg[k] - lg[n - k] + k * Math.log(p) + (n - k) * Math.log1p(-p));
  return out;
}
// the loss distribution as a list of [loss, probability], losses rising
export function losses(n, p = P, lgd = LGD) {
  const w = pmf(n, p), per = (STAKE * lgd) / n;
  return Array.from(w, (q, k) => [per * k, q]);
}
export function varOf(dist, alpha) {
  let c = 0;
  for (const [l, q] of dist) { c += q; if (c >= alpha - 1e-12) return l; }
  return dist[dist.length - 1][0];
}
export function esOf(dist, alpha) {
  const v = varOf(dist, alpha);
  let tail = 0, le = 0;
  for (const [l, q] of dist) { if (l > v + 1e-12) tail += l * q; else le += q; }
  return (tail + v * (le - alpha)) / (1 - alpha);
}
// the quantile function as steps: [from u, to u, loss]
export function quantileSteps(dist) {
  const out = []; let c = 0;
  for (const [l, q] of dist) { if (q <= 0) continue; out.push([c, c + q, l]); c += q; }
  return out;
}
// the same ES by integrating the steps over (α, 1], for the checks and the area figure
export function esByArea(dist, alpha) {
  let a = 0;
  for (const [u0, u1, l] of quantileSteps(dist)) { const lo = Math.max(u0, alpha), hi = Math.min(u1, 1); if (hi > lo) a += (hi - lo) * l; }
  return a / (1 - alpha);
}
export const bonds = (n, alpha, p = P, lgd = LGD) => { const d = losses(n, p, lgd); return { var: varOf(d, alpha), es: esOf(d, alpha), anyDefault: 1 - Math.pow(1 - p, n), expected: STAKE * lgd * p }; };

// two positions whose losses are normal with standard deviations sA, sB and correlation ρ, mean zero
export const zOf = (alpha) => PhiInv(alpha);
export const normalVar = (s, alpha) => s * PhiInv(alpha);
export const normalEs = (s, alpha) => (s * Math.exp(-0.5 * PhiInv(alpha) ** 2)) / Math.sqrt(2 * Math.PI) / (1 - alpha);
export const sdSum = (sA, sB, rho) => Math.sqrt(Math.max(0, sA * sA + sB * sB + 2 * rho * sA * sB));

// Two whole positions of $100, A and B, and the two of them held together.
// Bonds: each loses $60 with probability 4%, independently. Normal: each loss
// is normal with mean zero and a standard deviation of $20, correlation ρ.
export const NORMAL_SD = 20;
export function pair(kind, alpha, rho = 0) {
  if (kind === "bonds") {
    const one = [[0, 1 - P], [STAKE * LGD, P]];
    const both = [[0, (1 - P) ** 2], [STAKE * LGD, 2 * P * (1 - P)], [2 * STAKE * LGD, P * P]];
    return { varA: varOf(one, alpha), varB: varOf(one, alpha), varAB: varOf(both, alpha), esA: esOf(one, alpha), esB: esOf(one, alpha), esAB: esOf(both, alpha) };
  }
  const s = NORMAL_SD, sab = sdSum(s, s, rho);
  return { varA: normalVar(s, alpha), varB: normalVar(s, alpha), varAB: normalVar(sab, alpha), esA: normalEs(s, alpha), esB: normalEs(s, alpha), esAB: normalEs(sab, alpha) };
}
