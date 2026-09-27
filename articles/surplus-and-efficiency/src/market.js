/*
  src/market.js for surplus-and-efficiency
  The base market: A = 120, B = 3, C = 20, S = 2 -> p* = 20, q* = 60, TS* = 1500.
  Crucial: compute k as (B + S) / (B * S) to prevent floating-point double trap.
*/
export const A = 120;
export const B = 3;
export const C = 20;
export const S = 2;
export const p0 = 20;
export const q0 = 60;
export const TS0 = 1500;

// Exact double computation: (3 + 2) / (3 * 2) = 5 / 6
export const k = (B + S) / (B * S);

export const baseMarket = { A, B, C, S, p0, q0, k, TS0 };

// Inverse demand: marginal valuation of q-th unit
export const pDemand = (q, mkt = baseMarket) => (mkt.A - q) / mkt.B;

// Inverse supply: marginal cost of q-th unit
export const pSupply = (q, mkt = baseMarket) => (q - mkt.C) / mkt.S;

// Marginal surplus gap
export const surplusGap = (q, mkt = baseMarket) => pDemand(q, mkt) - pSupply(q, mkt);

// Closed-form total surplus under efficient allocation of q units
export function totalSurplus(q, mkt = baseMarket) {
  const kVal = (mkt.B + mkt.S) / (mkt.B * mkt.S);
  return (mkt.A / mkt.B + mkt.C / mkt.S) * q - 0.5 * kVal * q * q;
}

// Deadweight loss triangle: 0.5 * k * (q* - q)^2
export function triangleLoss(q, mkt = baseMarket) {
  const kVal = (mkt.B + mkt.S) / (mkt.B * mkt.S);
  const diff = mkt.q0 - q;
  return 0.5 * kVal * diff * diff;
}

// Ceiling price corresponding to quantity supplied q
export const ceilingPrice = (q, mkt = baseMarket) => (q - mkt.C) / mkt.S;

// Willing buyers at price pBar
export const willingBuyers = (pBar, mkt = baseMarket) => mkt.A - mkt.B * pBar;

// Misallocation loss: (1 - theta) * q * (N - q) / (2B)
export function misallocationLoss(q, pBar, theta = 0, mkt = baseMarket) {
  const N = willingBuyers(pBar, mkt);
  if (N <= q) return 0;
  return ((1 - theta) * q * (N - q)) / (2 * mkt.B);
}

// Total loss from quantity cut and rationing
export function combinedLoss(q, pBar, theta = 0, mkt = baseMarket) {
  return triangleLoss(q, mkt) + misallocationLoss(q, pBar, theta, mkt);
}

// Numerical trapezoid integration of total surplus up to quantity q
export function trapezoidSurplus(q, steps = 1000, mkt = baseMarket) {
  const h = q / steps;
  let sum = 0.5 * (surplusGap(0, mkt) + surplusGap(q, mkt));
  for (let i = 1; i < steps; i++) {
    sum += surplusGap(i * h, mkt);
  }
  return sum * h;
}

// Golden section search for competitive quantity that maximises total surplus
export function goldenSectionMaxSurplus(mkt = baseMarket) {
  const lo = 0;
  const hi = mkt.A;
  const g = (Math.sqrt(5) - 1) / 2;
  let a = lo, z = hi;
  for (let i = 0; i < 200; i++) {
    const x1 = z - g * (z - a);
    const x2 = a + g * (z - a);
    if (totalSurplus(x1, mkt) < totalSurplus(x2, mkt)) {
      a = x1;
    } else {
      z = x2;
    }
  }
  return (a + z) / 2;
}

// Explicit shuffle simulation of random rationing across N buyers
// Values are uniformly distributed in [pBar, A/B]
export function simulateRandomRationing(q, pBar, replications = 4000, rng, mkt = baseMarket) {
  const N = Math.round(willingBuyers(pBar, mkt));
  const vMax = mkt.A / mkt.B; // 40
  const vMin = pBar;

  // Generate population of N buyer valuations: v_i = vMin + (vMax - vMin) * (i + 0.5) / N
  const valuations = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    valuations[i] = vMin + ((vMax - vMin) * (i + 0.5)) / N;
  }

  // Efficient allocation: top q valuations
  let effVal = 0;
  for (let i = N - q; i < N; i++) {
    effVal += valuations[i];
  }

  let simLossSum = 0;
  const indices = new Int32Array(N);

  for (let rep = 0; rep < replications; rep++) {
    for (let i = 0; i < N; i++) indices[i] = i;
    // Fisher-Yates shuffle first q elements
    for (let i = 0; i < q; i++) {
      const j = i + Math.floor(rng() * (N - i));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    let randVal = 0;
    for (let i = 0; i < q; i++) {
      randVal += valuations[indices[i]];
    }
    simLossSum += (effVal - randVal);
  }

  return simLossSum / replications;
}

// Calculation for constant elasticity demand curve (Claim 9)
export function constantElasticityMarket(eps = 1.6, cutFraction = 0.05) {
  const kCes = q0 * Math.pow(p0, eps);
  const qTarget = q0 * (1 - cutFraction); // e.g. 57
  const pBar = (qTarget - C) / S; // 18.5
  const N = kCes * Math.pow(pBar, -eps);

  const gamma = 1 - 1 / eps;
  const coeff = Math.pow(kCes, 1 / eps) / gamma;

  // Average valuations
  const intEff = coeff * Math.pow(qTarget, gamma);
  const avgEff = intEff / qTarget;

  const intAll = coeff * Math.pow(N, gamma);
  const avgRand = intAll / N;

  const misallocation = qTarget * (avgEff - avgRand);

  // Triangle DWL
  const intPs = (q0 * q0 - qTarget * qTarget) / (2 * S) - (C * (q0 - qTarget)) / S;
  const intPd = coeff * (Math.pow(q0, gamma) - Math.pow(qTarget, gamma));
  const triangle = intPd - intPs;

  const totalLoss = triangle + misallocation;

  // Competitive total surplus: integral of Pd(u) - Ps(u) from 0 to q0
  const intPs0 = (q0 * q0 - C * C) / (2 * S) - (C * (q0 - C)) / S;
  const intPd0 = coeff * Math.pow(q0, gamma);
  const tsBase = intPd0 - intPs0;

  const lossShare = totalLoss / tsBase;
  const ratio = misallocation / triangle;

  return {
    qTarget,
    pBar,
    N,
    triangle,
    misallocation,
    totalLoss,
    tsBase,
    lossShare,
    ratio,
    cutFraction,
  };
}
