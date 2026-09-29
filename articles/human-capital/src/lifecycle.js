// Savings, future pay and the stock share over a working life.
//
// We earn a pay of 1 a year from 25 to 65 and save a fraction SAVE of it.
// Savings W start at W0 and grow at GROWTH a year. Future pay H is valued
// like a bond, at the safe rate R: the present value of the paydays left.
// Merton's rule applied to total wealth W + H asks for pi* (W + H) in stocks.
// If a share beta of future pay moves with the stock market, that part of H
// already holds beta H of stocks for us, so savings should hold
//   pi* (W + H) - beta H,  a share of  pi* + (pi* - beta) H / W.
export const START = 25, END = 65;
export const W0 = 0.5, SAVE = 0.1, GROWTH = 0.04, R = 0.02;
export const PREMIUM = 0.05, SIGMA = 0.18, GAMMA = 2;
export const MERTON = PREMIUM / (GAMMA * SIGMA * SIGMA);

// future pay at an age: paydays at the end of each remaining year
export function futurePay(age, r = R) {
  const n = END - age;
  return n <= 0 ? 0 : (1 - Math.pow(1 + r, -n)) / r;
}
// savings at an age, following the plan
export function savings(age, w0 = W0, save = SAVE, g = GROWTH) {
  let w = w0;
  for (let a = START; a < Math.floor(age); a++) w = w * (1 + g) + save;
  const f = age - Math.floor(age);
  return f > 0 ? w * Math.pow(1 + g, f) + save * f : w;
}
export const ruleShare = (age, beta = 0, pi = MERTON) => pi + ((pi - beta) * futurePay(age)) / savings(age);
export const ruleDollars = (age, beta = 0, pi = MERTON) => pi * (savings(age) + futurePay(age)) - beta * futurePay(age);
export const cappedShare = (age, cap, beta = 0) => Math.max(0, cap === Infinity ? ruleShare(age, beta) : Math.min(cap, ruleShare(age, beta)));

// The age at which the rule's share first falls to a level (bisection; the share falls with age)
export function ageWhenShareFalls(level, beta = 0) {
  let a = START, b = END;
  if (ruleShare(a, beta) <= level) return START;
  for (let i = 0; i < 80; i++) { const c = (a + b) / 2; if (ruleShare(c, beta) > level) a = c; else b = c; }
  return (a + b) / 2;
}
