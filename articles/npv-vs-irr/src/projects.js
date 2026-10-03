/*
  Projects as lists of yearly cash flows, cf[0] today (an outlay is negative).

  The identity the article is built on (Hazen, 2003): for any internal rate of
  return k, run the project as an account that earns k. Its balance starts at
  the outlay, C0 = -cf[0], grows at k each year and pays out each year's cash
  flow, Ct = C(t-1) (1 + k) - cf[t], and ends at zero because k is an IRR. Then
  at any cost of capital r,

      NPV(r) = (k - r) * sum_{t=0}^{T-1} Ct / (1 + r)^(t+1),

  the margin of the IRR over r times the money the project keeps tied up, in
  dollar-years at today's value. Plain numbers in, plain numbers out.
*/

export const npv = (cf, r) => cf.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);

// Every root of NPV in (lo, hi), by a fine scan and bisection. Projects here
// have at most two, so a scan can't step over a pair.
export function irrs(cf, lo = -0.9, hi = 6, steps = 6000) {
  const out = [];
  let x0 = lo, v0 = npv(cf, lo);
  for (let i = 1; i <= steps; i++) {
    const x1 = lo + ((hi - lo) * i) / steps, v1 = npv(cf, x1);
    if (v0 === 0) out.push(x0);
    else if (v0 * v1 < 0) {
      let a = x0, b = x1, fa = v0;
      for (let k = 0; k < 200; k++) {
        const m = (a + b) / 2, fm = npv(cf, m);
        if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      }
      out.push((a + b) / 2);
    }
    x0 = x1; v0 = v1;
  }
  return out;
}
export const irr = (cf) => irrs(cf)[0];

// The account that earns k: balances C0 .. CT (CT is zero when k is an IRR).
export function balances(cf, k) {
  const C = [-cf[0]];
  for (let t = 1; t < cf.length; t++) C.push(C[t - 1] * (1 + k) - cf[t]);
  return C;
}

// The money tied up, in dollar-years at today's value: each year's opening
// balance, discounted to today at r from the end of that year.
export function capital(cf, k, r) {
  const C = balances(cf, k);
  let s = 0;
  for (let t = 0; t < cf.length - 1; t++) s += C[t] / Math.pow(1 + r, t + 1);
  return s;
}

// The rectangle: width = capital tied up, height = margin, area = NPV.
export function rectangle(cf, r, k = irr(cf)) {
  const width = capital(cf, k, r), height = k - r;
  return { k, width, height, area: width * height, npv: npv(cf, r) };
}

// The pairs of projects in the lab, and the mine with two IRRs.
export const PAIRS = {
  timing: {
    label: "Quick and slow",
    A: { name: "Quick", cf: [-100, 150] },
    B: { name: "Slow", cf: [-100, 0, 0, 0, 0, 300] },
  },
  scale: {
    label: "Small and large",
    A: { name: "Small", cf: [-100, 150] },
    B: { name: "Large", cf: [-1000, 1300] },
  },
};
export const MINE = [-100, 520, -480];

// Where two projects' NPV profiles cross: the IRR of their difference.
export const difference = (a, b) => {
  const n = Math.max(a.length, b.length);
  return Array.from({ length: n }, (_, t) => (b[t] || 0) - (a[t] || 0));
};
export const crossover = (a, b) => irrs(difference(a, b), 0, 6)[0];

// Reinvesting the quick project's payout until the slow one pays: what it's
// worth in year T at a reinvestment rate R.
export const reinvested = (amount, years, R) => amount * Math.pow(1 + R, years);

// A fund that calls its money now, or a year later with a loan in between.
export function fund(lineYears = 0, lineRate = 0.03, call = 100, back = 200, T = 5) {
  const cf = Array(T + 1).fill(0);
  cf[lineYears] -= call * Math.pow(1 + lineRate, lineYears);
  cf[T] += back;
  return { cf, irr: irr(cf), multiple: back / (call * Math.pow(1 + lineRate, lineYears)) };
}
