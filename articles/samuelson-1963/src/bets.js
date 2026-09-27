// Samuelson's bet: a fair coin, win $200 or lose $100, repeated n times.
export const WIN = 200;
export const LOSE = 100;
export const N_MAX = 100;

// log C(n, k)
function lchoose(n, k) {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}

// Every possible total after n bets: k wins pay 300k - 100n, with binomial odds.
export function outcomes(n) {
  const out = [];
  for (let k = 0; k <= n; k++) out.push({ k, total: WIN * k - LOSE * (n - k), prob: Math.exp(lchoose(n, k) - n * Math.LN2) });
  return out;
}

export const expectedGain = (n) => (n * (WIN - LOSE)) / 2;
export const spread = (n) => ((WIN + LOSE) / 2) * Math.sqrt(n); // standard deviation of the total
export const worstCase = (n) => -LOSE * n;
export const chanceLoss = (n) => outcomes(n).filter((o) => o.total < 0).reduce((a, o) => a + o.prob, 0);
export const chanceGain = (n) => outcomes(n).filter((o) => o.total > 0).reduce((a, o) => a + o.prob, 0);

// ---- constant absolute risk aversion, u(w) = -exp(-a w)
// The certainty equivalent of one bet, and of n. Because independent bets'
// exponential moments multiply, the n-bet certainty equivalent is n times the
// one-bet value: the sign can't change as n grows.
export function ce1(a) {
  if (a === 0) return expectedGain(1);
  return -Math.log(0.5 * Math.exp(-a * WIN) + 0.5 * Math.exp(a * LOSE)) / a;
}
export const ceN = (a, n) => n * ce1(a);

// Where one bet is exactly worth nothing: 0.5 x^-2 + 0.5 x = 1 with x = e^{100a},
// so x^3 - 2x^2 + 1 = 0, whose root above 1 is the golden ratio.
export const PHI = (1 + Math.sqrt(5)) / 2;
export const A_STAR = Math.log(PHI) / LOSE;

// A constant-risk-aversion person turns down a 50-50 bet that risks L for any
// prize once 0.5 e^{aL} >= 1, so the largest loss they'll ever risk is ln 2 / a.
export const lossCap = (a) => (a > 0 ? Math.LN2 / a : Infinity);

// ---- a kink at the wealth we walk in with: gains count once, losses lambda times
export function kinkedValue(n, lambda) {
  let up = 0, down = 0;
  for (const o of outcomes(n)) {
    if (o.total > 0) up += o.prob * o.total;
    else down += o.prob * -o.total;
  }
  return up - lambda * down;
}
export const oneAtATime = (n, lambda) => n * kinkedValue(1, lambda);
export function kinkThreshold(n) {
  let up = 0, down = 0;
  for (const o of outcomes(n)) {
    if (o.total > 0) up += o.prob * o.total;
    else down += o.prob * -o.total;
  }
  return up / down;
}
export const LAMBDA_TK = 2.25;
