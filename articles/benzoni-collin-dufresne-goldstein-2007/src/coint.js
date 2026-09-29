// Pay that follows dividends with a lag, on the plan of the human capital article.
//
// Pay is 1 a year from 25 to 65 and is valued like a bond, at the safe rate R.
// Suppose the stock market moves by a surprise. Pay does not move at once, but
// each year it closes a fraction phi of the gap between itself and where the
// market says it should be. A payday s years away has then moved by
//
//   beta(s) = 1 - (1 - phi)^s
//
// of the surprise, so far-off paydays behave like stock and near ones like bond.
// The loading of the whole stream of future pay is the average of beta(s) over
// the paydays left, weighted by their present values:
//
//   beta_H = sum_s DF_s beta(s) / sum_s DF_s,   DF_s = (1 + R)^-s
//
// and the rule of the human capital article, with beta replaced by beta_H, says
// savings should hold  pi* + (pi* - beta_H) H / W  of themselves in stocks.
import { savings, futurePay, END, R as RSAFE, START, PREMIUM, SIGMA } from "./lifecycle.js";

export { START, END, savings, futurePay, PREMIUM, SIGMA };
export const R = RSAFE;
export const merton = (g) => PREMIUM / (g * SIGMA * SIGMA);
// the gap closes by this fraction each year when its half-life is h years
export const phiOf = (h) => 1 - Math.pow(0.5, 1 / h);
export const halfLifeOf = (phi) => Math.log(2) / -Math.log(1 - phi);
export const beta = (s, phi) => 1 - Math.pow(1 - phi, s);

// present value of all paydays left, and the loading of that stream on stocks
export function stats(age, phi) {
  const n = Math.max(0, END - Math.floor(age));
  let H = 0, HB = 0;
  for (let k = 1; k <= n; k++) {
    const df = Math.pow(1 + R, -k);
    H += df; HB += df * beta(k, phi);
  }
  return { H, betaH: n > 0 ? HB / H : 0 };
}
export const betaH = (age, phi) => stats(age, phi).betaH;
// stock dollars, in years of pay, and the share of savings
export function dollars(age, phi, g = 2) {
  const { H, betaH: b } = stats(age, phi);
  return merton(g) * (savings(age) + H) - b * H;
}
export const share = (age, phi, g = 2) => dollars(age, phi, g) / savings(age);
// the loading above which a saver of that age should be short: pi* (1 + W/H)
export const shortAbove = (age, g = 2) => merton(g) * (1 + savings(age) / stats(age, 0.5).H);

// the same rule when pay is as safe as a bond (the human capital article's starting point)
export const shareBond = (age, g = 2) => merton(g) * (1 + stats(age, 0.5).H / savings(age));
// the half-life at which the young saver's share is zero, by bisection on the share at 25
export function breakEven(g = 2, age = 25) {
  let lo = 0.005, hi = 0.95; // phi; a larger phi is a shorter half-life and a lower share
  for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (share(age, mid, g) > 0) lo = mid; else hi = mid; }
  return halfLifeOf((lo + hi) / 2);
}
// the age at which the share is highest, from 25 to 64
export function peakAge(phi, g = 2) {
  let best = START, bv = -Infinity;
  for (let a = START; a < END; a++) { const s = share(a, phi, g); if (s > bv) { bv = s; best = a; } }
  return best;
}
export const AGES = Array.from({ length: END - START + 1 }, (_, i) => START + i);
