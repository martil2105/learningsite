// Two workers with the same savings, the same age, the same hours and the same
// spending today. One can change her hours whenever she likes (flexible), the
// other is stuck with today's hours for good (fixed).
//
// Utility per year is (C^a * L^(1-a))^(1-g) / (1-g): consumption C and leisure
// L, with weight a on consumption. Time is 1 a year, the wage w is 1 a year of
// full-time work and safe, and each year's pay is discounted at the safe rate.
// A is the value of one full-time year of pay for each year left (an annuity
// factor). Savings W are in years of full-time pay.
//
//   flexible worker  owns W + A (savings plus all her time, leisure included)
//                    and is a Merton investor on that, with risk aversion g
//   fixed worker     owns W + h*A (savings plus the pay from her hours h)
//                    and is a Merton investor with risk aversion gC = 1 - a(1-g)
//
// Both plan to spend what they own evenly over the years left, which fixes
// today's hours at h = a - (1-a) W / A.
export const PREMIUM = 0.05, SIGMA = 0.18, R = 0.02;

export const merton = (g, premium = PREMIUM, sigma = SIGMA) => premium / (g * sigma * sigma);
export const annuity = (n, r = R) => (n <= 0 ? 0 : (1 - Math.pow(1 + r, -n)) / r);
// risk aversion over consumption alone when hours can't change
export const gammaC = (a, g) => 1 - a * (1 - g);
// the gap between the two workers' stock dollars
export const factor = (a, g) => 1 + (1 - a) / (a * g);

export function today({ a, g, W, n }) {
  const A = annuity(n);
  const total = W + A;
  const hours = a - ((1 - a) * W) / A;
  const retired = hours <= 0;
  const flex = merton(g) * total;
  const fixed = merton(gammaC(a, g)) * (W + Math.max(0, hours) * A);
  return { A, total, hours, retired, consumption: (a * total) / A, flex, fixed, ratio: fixed > 0 ? flex / fixed : NaN };
}

// The years' return on stocks against the safe rate, as a fraction (-0.2 is a bad year).
// Consumption and hours next year against the plan.
export function response(p, ret) {
  const t = today(p);
  const dFlex = t.flex * ret, dFixed = t.fixed * ret;
  return {
    ...t,
    consFlex: dFlex / t.total, // change in consumption, as a share of consumption
    consFixed: dFixed / (p.a * t.total),
    hoursFlex: t.hours - ((1 - p.a) * dFlex) / t.A,
    hoursFixed: t.hours,
  };
}

// The savings at which a worker who spends evenly stops working altogether
export const retireAt = (a, n) => (a * annuity(n)) / (1 - a);

// The condition under which flexibility raises stock holdings when the plan is to
// spend a multiple s of the even rate (s = 1 is the plan above). The gap is
//   gammaC / (g (1 - (1-a) s)),   above one exactly when s > 1 - 1/g.
export const factorAt = (a, g, s) => gammaC(a, g) / (g * (1 - (1 - a) * s));
