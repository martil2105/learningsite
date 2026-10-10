/*
  Pricing an option on a tree.

  One period: a share at $100 will be $120 or $90 next year, and money in the
  bank grows by 5% (simple). A call struck at $100 pays $20 or $0. Holding
  delta shares and borrowing B copies it exactly, so it costs what the copy
  costs, whatever the real chance p of the up move.

  Many periods: Cox, Ross and Rubinstein's tree, u = e^(sigma sqrt(dt)),
  d = 1/u, with money growing at e^(r dt) a step, priced backwards.

  Three branches: the share can also end at $105. Two assets can't copy three
  outcomes, so no-arbitrage only bounds the price; an investor with constant
  relative risk aversion who prices both the share and the bank picks one
  price inside the bounds, and it depends on the real chances.
*/
export const S0 = 100, UP = 120, DOWN = 90, MID = 105, K = 100, GROWTH = 1.05;

// ---------------------------------------------------------- one period
export function onePeriod({ s = S0, up = UP, down = DOWN, k = K, g = GROWTH } = {}) {
  const cu = Math.max(up - k, 0), cd = Math.max(down - k, 0);
  const delta = (cu - cd) / (up - down);
  const bond = (cu - delta * up) / g;      // money in the bank today (negative: borrowed)
  const price = delta * s + bond;
  const q = (s * g - down) / (up - down);  // the risk-neutral chance of the up move
  return { cu, cd, delta, bond, price, q, omega: (delta * s) / price };
}
// Expected returns over the period when the up move has real chance p.
export function returns(p, o = onePeriod(), { s = S0, up = UP, down = DOWN } = {}) {
  const share = (p * up + (1 - p) * down) / s - 1;
  const call = (p * o.cu + (1 - p) * o.cd) / o.price - 1;
  return { share, call };
}

// ---------------------------------------------------------- many periods
export const SIGMA = 0.2, RATE = 0.05, YEARS = 1;
// The tree's share prices: S[i][j] at step i after j up moves.
export function tree(n, { s = S0, sigma = SIGMA, r = RATE, t = YEARS, k = K } = {}) {
  const dt = t / n, u = Math.exp(sigma * Math.sqrt(dt)), d = 1 / u, g = Math.exp(r * dt);
  const q = (g - d) / (u - d);
  const S = [], V = [], D = [];
  for (let i = 0; i <= n; i++) S.push(Array.from({ length: i + 1 }, (_, j) => s * Math.pow(u, j) * Math.pow(d, i - j)));
  V[n] = S[n].map((x) => Math.max(x - k, 0));
  for (let i = n - 1; i >= 0; i--) {
    V[i] = S[i].map((_, j) => (q * V[i + 1][j + 1] + (1 - q) * V[i + 1][j]) / g);
    D[i] = S[i].map((_, j) => (V[i + 1][j + 1] - V[i + 1][j]) / (S[i + 1][j + 1] - S[i + 1][j]));
  }
  return { n, u, d, g, q, S, V, D, price: V[0][0] };
}
// The price alone, in O(n) memory, for convergence plots.
export function crr(n, opts = {}) {
  const { s = S0, sigma = SIGMA, r = RATE, t = YEARS, k = K } = opts;
  const dt = t / n, u = Math.exp(sigma * Math.sqrt(dt)), d = 1 / u, g = Math.exp(r * dt), q = (g - d) / (u - d);
  let v = Array.from({ length: n + 1 }, (_, j) => Math.max(s * Math.pow(u, j) * Math.pow(d, n - j) - k, 0));
  for (let i = n - 1; i >= 0; i--) { const w = new Array(i + 1); for (let j = 0; j <= i; j++) w[j] = (q * v[j + 1] + (1 - q) * v[j]) / g; v = w; }
  return v[0];
}

// The normal distribution function to about 1e-15, for Black and Scholes.
export function Phi(x) {
  return 0.5 * erfc(-x / Math.SQRT2);
}
function erfc(x) {
  const z = Math.abs(x);
  let r;
  if (z < 0.5) {
    let sum = z, term = z, n = 0;
    while (Math.abs(term) > 1e-17 * Math.abs(sum)) { n++; term *= (-z * z) / n; sum += term / (2 * n + 1); }
    r = 1 - (2 / Math.sqrt(Math.PI)) * sum;
  } else {
    const tiny = 1e-300;
    let f = z, C = z, D = 0;
    for (let i = 1; i < 300; i++) {
      const a = i / 2;
      D = z + a * D; D = Math.abs(D) < tiny ? tiny : D; D = 1 / D;
      C = z + a / C; C = Math.abs(C) < tiny ? tiny : C;
      const delta = C * D; f *= delta;
      if (Math.abs(delta - 1) < 1e-16) break;
    }
    r = Math.exp(-z * z) / Math.sqrt(Math.PI) / f;
  }
  return x >= 0 ? r : 2 - r;
}
export function blackScholes({ s = S0, sigma = SIGMA, r = RATE, t = YEARS, k = K } = {}) {
  const sq = sigma * Math.sqrt(t), d1 = (Math.log(s / k) + (r + (sigma * sigma) / 2) * t) / sq, d2 = d1 - sq;
  return s * Phi(d1) - k * Math.exp(-r * t) * Phi(d2);
}

// ---------------------------------------------------------- three branches
const STATES = [UP, MID, DOWN];
const pays = STATES.map((x) => Math.max(x - K, 0));
// No-arbitrage: every set of positive state prices that prices the share and
// the bank. Here q_up = q_down = a and q_mid = 1 - 2a, a in (0, 1/2).
export const bounds = () => ({ lo: pays[1] / GROWTH, hi: (0.5 * pays[0] + 0.5 * pays[2]) / GROWTH });
// The price an investor with constant relative risk aversion would pay, given
// real chances (pu, pm, pd): her marginal utility (S/S0)^(-gamma), scaled to
// price the bank, must also price the share, which fixes gamma.
export function investorPrice(pu, pm, pd) {
  const P = [pu, pm, pd];
  const tilt = (gm) => { const w = STATES.map((x, i) => P[i] * Math.pow(x / S0, -gm)); const W = w[0] + w[1] + w[2]; return w.map((v) => v / W); };
  const meanQ = (gm) => tilt(gm).reduce((a, v, i) => a + v * STATES[i], 0);
  let lo = -60, hi = 60;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (meanQ(m) > S0 * GROWTH) lo = m; else hi = m; }
  const gamma = (lo + hi) / 2, q = tilt(gamma);
  return { gamma, q, price: q.reduce((a, v, i) => a + v * pays[i], 0) / GROWTH };
}
// The closest a share-and-bank portfolio gets to the call when it matches
// the up and down payoffs (the binomial copy) and misses at $105.
export function copyMiss() {
  const o = onePeriod();
  return { at105: o.delta * MID + o.bond * GROWTH, call: pays[1] };
}
