// Merton's rule when borrowing costs more than the safe rate.
//
// Stocks earn E over the safe rate with volatility SIGMA, and a saver with risk
// aversion g who can lend and borrow at the safe rate holds e / (g sigma^2) of
// her wealth in stocks. If she has to pay a spread s over the safe rate on
// what she borrows, the premium on borrowed money is e - s, and her share is
//
//   e / (g sigma^2)        if that is at most 1        (she lends)
//   (e - s) / (g sigma^2)  if that is at least 1       (she borrows)
//   1                      otherwise                   (she does neither)
//
// so the shares in between sit at exactly 100%, for g from (e - s) / sigma^2
// to e / sigma^2.
import { futurePay, savings, START, END, R } from "./lifecycle.js";

export const E = 0.05, SIGMA = 0.18, V = SIGMA * SIGMA, RSAFE = R;
export { START, END };

export const lenderShare = (g) => E / (g * V);
export const borrowerShare = (g, s) => Math.max(0, (E - s) / (g * V));
export function share(g, s) {
  const a = lenderShare(g);
  if (a <= 1) return a;
  const b = borrowerShare(g, s);
  return b >= 1 ? b : 1;
}
export function regime(g, s) {
  if (lenderShare(g) <= 1) return "lend";
  return borrowerShare(g, s) > 1 ? "lever" : "pinned";
}
// the risk aversions held at exactly 100%
export const bandLo = (s) => Math.max(0, (E - s) / V);
export const bandHi = () => E / V;

// The certain return of holding a share p of wealth in stocks: the safe rate,
// plus the premium on p, less the spread on whatever is borrowed, less half
// g sigma^2 p^2 for the risk.
export const certain = (g, s, p) => RSAFE + E * p - s * Math.max(p - 1, 0) - 0.5 * g * V * p * p;
export const best = (g, s) => certain(g, s, share(g, s));
// what a spread costs a saver of risk aversion g, in return a year
export const given = (g, s) => best(g, 0) - best(g, s);
// the Sharpe ratio of stocks against what the money costs
export const sharpe = (s) => (E - s) / SIGMA;
export const kept = (s) => Math.pow(1 - s / E, 2);

// ---- a working life (pay of 1 a year from 25 to 65; see lifecycle.js) ----
// Applying the rule to total wealth W + H. While she borrows, future pay is
// worth its present value at the rate she pays, and the share of savings is
// pi_b (W + H_b) / W; while she lends it is pi_l (W + H) / W; in between, 100%.
export function life(age, g, s) {
  const W = savings(age), H = futurePay(age, RSAFE), Hb = futurePay(age, RSAFE + s);
  const a = (lenderShare(g) * (1 + H / W));
  if (a <= 1) return { share: a, regime: "lend" };
  const b = borrowerShare(g, s) * (1 + Hb / W);
  if (b > 1) return { share: b, regime: "lever" };
  return { share: 1, regime: "pinned" };
}
// the age at which a regime test first fails, by bisection (each test holds early and stops holding)
function firstFail(test) {
  if (!test(START)) return START;
  if (test(END)) return END;
  let a = START, b = END;
  for (let i = 0; i < 60; i++) { const c = (a + b) / 2; if (test(c)) a = c; else b = c; }
  return (a + b) / 2;
}
// she borrows until this age
export const leverUntil = (g, s) => firstFail((age) => life(age, g, s).regime === "lever");
// she lends from this age on
export const lendFrom = (g, s) => firstFail((age) => life(age, g, s).regime !== "lend");

// Points to draw: the share against risk aversion, with the kinks put in exactly
export function shareCurve(s, lo = 0.5, hi = 4, step = 0.02) {
  const g = []; for (let x = lo; x <= hi + 1e-9; x += step) g.push(+x.toFixed(6));
  for (const k of [bandLo(s), bandHi()]) if (k > lo && k < hi) g.push(k);
  g.sort((a, b) => a - b);
  return g.map((x) => [x, share(x, s)]);
}
export function lifeCurve(g, s, step = 0.25) {
  const a = []; for (let x = START; x <= END + 1e-9; x += step) a.push(x);
  for (const k of [leverUntil(g, s), lendFrom(g, s)]) if (k > START && k < END) a.push(k);
  a.sort((p, q) => p - q);
  return a.map((x) => [x, life(x, g, s).share]);
}
export function givenCurve(s, lo = 0.5, hi = 4, step = 0.02) {
  const g = []; for (let x = lo; x <= hi + 1e-9; x += step) g.push(+x.toFixed(6));
  for (const k of [bandLo(s), bandHi()]) if (k > lo && k < hi) g.push(k);
  g.sort((a, b) => a - b);
  return g.map((x) => [x, given(x, s)]);
}
