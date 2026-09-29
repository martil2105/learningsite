/*
  A margin account with one stock, long or short.

  Long: we buy Q shares at P0, putting up a share m of the cost ourselves and
  borrowing the rest. At price P the shares are worth Q P, we owe the loan
  (1 - m) Q P0, and our equity is the difference.

  Short: we borrow Q shares and sell them at P0. The proceeds stay in the
  account, and we add a deposit of m Q P0, so the account holds (1 + m) Q P0 in
  cash. At price P we owe Q shares worth Q P, and our equity is the cash less
  that.

  Either way the margin ratio is equity over the value of the shares, and the
  broker calls when it drops below the maintenance margin k.
*/
export const P0 = 100, Q = 100;
export const RULES = { m: 0.5, kLong: 0.25, kShort: 0.3 }; // Reg T initial margin, FINRA 4210 maintenance

export function account(side, P, m = RULES.m, k = side === "long" ? RULES.kLong : RULES.kShort) {
  const shares = Q * P;
  let owed, equity, cash = 0, loan = 0;
  if (side === "long") {
    loan = (1 - m) * Q * P0;
    equity = shares - loan;
    owed = loan;
  } else {
    cash = (1 + m) * Q * P0;
    equity = cash - shares;
    owed = shares;
  }
  const stake = m * Q * P0;
  const ratio = equity / shares;
  const status = equity <= 0 ? "wiped" : ratio < k - 1e-12 ? "call" : "fine";
  // what it takes to get back to the maintenance margin: cash, or a trade
  const shortfall = Math.max(0, k * shares - equity);
  return {
    side, P, m, k, shares, cash, loan, owed, equity, stake, ratio, status,
    leverage: equity > 0 ? shares / equity : Infinity,
    lost: 1 - equity / stake,
    shortfall,
    trade: equity > 0 ? shortfall / k : NaN, // shares sold (long) or bought back (short), in dollars
  };
}

// the price at which the call comes, and the move that gets it there
export const callPrice = (side, m = RULES.m, k = side === "long" ? RULES.kLong : RULES.kShort) =>
  side === "long" ? (P0 * (1 - m)) / (1 - k) : (P0 * (1 + m)) / (1 + k);
export const callMove = (side, m = RULES.m, k = side === "long" ? RULES.kLong : RULES.kShort) =>
  side === "long" ? (m - k) / (1 - k) : (m - k) / (1 + k);
export const wipePrice = (side, m = RULES.m) => (side === "long" ? P0 * (1 - m) : P0 * (1 + m));
// the distance to the call in log price
export const logDistance = (side, m, k) => Math.abs(Math.log(callPrice(side, m, k) / P0));

// ------------------------------------------------------------ the chance of a call
export function Phi(x) {
  // Abramowitz and Stegun 7.1.26 is too coarse for the checks; use erfc by continued fraction
  return 0.5 * erfc(-x / Math.SQRT2);
}
function erfc(x) {
  // Numerical Recipes erfcc, fractional error below 1.2e-7
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
// A price whose log has no drift (as likely to end the year up as down) and
// volatility sigma touches a level b away in log terms within T years with
// chance 2 Phi(-b / (sigma sqrt T)), by the reflection principle. With a drift
// nu in the log price the chance of touching a level b above is
// Phi((-b + nu T)/s) + exp(2 nu b / sigma^2) Phi((-b - nu T)/s), s = sigma sqrt T.
export function callChance(side, sigma, T = 1, m = RULES.m, k, nu = 0) {
  const kk = k ?? (side === "long" ? RULES.kLong : RULES.kShort);
  const b = logDistance(side, m, kk), s = sigma * Math.sqrt(T);
  const n = side === "long" ? -nu : nu; // drift towards the level
  return Phi((-b + n * T) / s) + Math.exp((2 * n * b) / (sigma * sigma)) * Phi((-b - n * T) / s);
}

// ------------------------------------------------------------ a year of prices
import { normals } from "./random.js";
export const DAYS = 252;
// n paths of daily prices with no drift in the log, from one seed; the same
// shocks are rescaled when sigma changes, so the paths keep their shape
export function paths(n, sigma, seed = 17) {
  const z = normals(seed), out = [];
  const dt = 1 / DAYS;
  for (let i = 0; i < n; i++) {
    const p = new Float64Array(DAYS + 1); p[0] = P0;
    let lp = 0;
    for (let d = 1; d <= DAYS; d++) { lp += sigma * Math.sqrt(dt) * z(); p[d] = P0 * Math.exp(lp); }
    out.push(p);
  }
  return out;
}
// the first day a path touches a level (from above for a long's call, from below for a short's)
export function firstTouch(path, level, side) {
  for (let d = 0; d < path.length; d++) if (side === "long" ? path[d] <= level : path[d] >= level) return d;
  return -1;
}
