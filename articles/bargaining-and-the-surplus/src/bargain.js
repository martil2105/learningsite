/*
  Alternating-offer bargaining over a surplus of 1, and the axiomatic route
  to the same answer.

  Two parties, A and B. A opens, B responds, they alternate. A rejecter can
  wait (discounting by delta) or opt out for a fallback s_i. Everything here
  is written in shares of the surplus, so money reappears only at the last
  step, and the closed forms are exact wherever the discount factors are.

  verify/check-numbers.mjs checks every function here against the literal
  backward induction and against an independent golden-section maximiser,
  which share no code with the closed forms.
*/

/* The infinite-horizon share of the first proposer. */
export const rubinstein = (dA, dB) => (1 - dB) / (1 - dA * dB);

/* A rate r per unit time, offers every dt, becomes a discount factor. */
export const discount = (r, dt) => Math.exp(-r * dt);

/* The continuous-time limit: your share's numerator is the other side's
   impatience. */
export const limitShare = (rA, rB) => rB / (rA + rB);

/*
  Literal backward induction over T rounds. One round left and proposing, you
  take everything; one round left and responding, you take nothing. Working
  back: the proposer offers the responder their discounted continuation, so

      a_k = 1 − d_B·(1 − b_{k−1}),   b_k = d_A·a_{k−1},

  with a_1 = 1 and b_1 = 0. Returns A's share when A opens a T-round game.
  Exact wherever the discount factors are dyadic rationals.
*/
export function backwardInduction(T, dA, dB) {
  let a = 1;
  let b = 0;
  for (let k = 2; k <= T; k++) {
    const aNew = 1 - dB * (1 - b);
    const bNew = dA * a;
    a = aNew;
    b = bNew;
  }
  return a;
}

/* The same sequence, closed: (1 − (−d)^T)/(1 + d) for equal patience. */
export const closedFinite = (T, d) => (1 - Math.pow(-d, T)) / (1 + d);

/*
  Best-response fixed point with outside options. Each side's offer must hold
  the other: the value of waiting is max(d·their share, their fallback).
  Contraction factor is the product of the discount factors, so convergence
  slows as both approach 1 — the tolerance is the iteration's, and the checks
  say so.
*/
export function fixedPoint(dA, dB, sA = 0, sB = 0, iters = 400000) {
  let x = 0.5;
  let y = 0.5;
  for (let i = 0; i < iters; i++) {
    const nx = 1 - Math.max(dB * y, sB);
    const ny = 1 - Math.max(dA * x, sA);
    x = nx;
    y = ny;
  }
  return x;
}

/*
  The axiomatic route, computed rather than quoted: maximise the asymmetric
  Nash product x^{wA}(1−x)^{wB} by golden section, with weights ∝ 1/r.
  Shares no code with rubinstein, which is the point — Rubinstein (1982)'s
  theorem says they agree, and the check makes them.
*/
export function nashShare(rA, rB) {
  const wA = 1 / rA;
  const wB = 1 / rB;
  const f = (x) => Math.pow(x, wA) * Math.pow(1 - x, wB);
  const g = (Math.sqrt(5) - 1) / 2;
  let lo = 1e-9;
  let hi = 1 - 1e-9;
  for (let i = 0; i < 300; i++) {
    const c = hi - g * (hi - lo);
    const d = lo + g * (hi - lo);
    if (f(c) > f(d)) hi = d;
    else lo = c;
  }
  return (lo + hi) / 2;
}