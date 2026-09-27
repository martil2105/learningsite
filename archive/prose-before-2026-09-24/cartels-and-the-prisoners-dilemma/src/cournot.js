/*
 * cournot.js - Analytical models for Cournot competition, Cartels, and Mergers (Mi11)
 */

export const A_DEFAULT = 100;
export const C_DEFAULT = 10;

/**
 * Individual firm profit in symmetric n-firm Cournot equilibrium with demand P = a - Q.
 * pi = (a - c)^2 / (n + 1)^2.
 */
export function piN(n, a = A_DEFAULT, c = C_DEFAULT) {
  return Math.pow(a - c, 2) / Math.pow(n + 1, 2);
}

/**
 * Per-firm profit for a member of a k-firm cartel in an n-firm market.
 * The market consolidates into (n - k + 1) Cournot rivals (1 cartel + n-k outsiders).
 * Cartel total profit is (a - c)^2 / (n - k + 2)^2, shared equally among k members.
 */
export function member(n, k, a = A_DEFAULT, c = C_DEFAULT) {
  return Math.pow(a - c, 2) / (k * Math.pow(n - k + 2, 2));
}

/**
 * Profit earned by a single outsider who stays out of the k-firm cartel.
 * The outsider produces as an independent entity: (a - c)^2 / (n - k + 2)^2.
 * Exactly equal to k * member(n, k)!
 */
export function outsider(n, k, a = A_DEFAULT, c = C_DEFAULT) {
  return Math.pow(a - c, 2) / Math.pow(n - k + 2, 2);
}

/**
 * A merger/cartel of size k is profitable if and only if:
 * member(n, k) > piN(n)  <==>  k * (n - k + 2)^2 < (n + 1)^2.
 */
export function isProfitable(n, k) {
  return k * Math.pow(n - k + 2, 2) < Math.pow(n + 1, 2);
}

/**
 * Minimum cartel size required for members to strictly gain over uncoordinated Cournot.
 */
export function kMin(n) {
  for (let k = 2; k <= n; k++) {
    if (isProfitable(n, k)) return k;
  }
  return null;
}

/**
 * Maximum number of firms m = n - k that can stay out (free ride) while keeping the cartel profitable.
 */
export function maxOutsiders(n) {
  let mMax = -1;
  for (let m = 0; m < n - 1; m++) {
    if ((n - m) * Math.pow(m + 2, 2) < Math.pow(n + 1, 2)) {
      mMax = m;
    } else {
      break;
    }
  }
  return mMax;
}

/**
 * Market price under a k-firm cartel in an n-firm market.
 * P = (a + (n - k + 1) * c) / (n - k + 2).
 */
export function price(n, k, a = A_DEFAULT, c = C_DEFAULT) {
  const m = n - k + 1; // effective competitors
  return (a + m * c) / (m + 1);
}

/**
 * Consumer surplus under Cournot / cartel.
 */
export function consumerSurplus(n, k, a = A_DEFAULT, c = C_DEFAULT) {
  const p = price(n, k, a, c);
  const Q = a - p;
  return (Q * Q) / 2;
}

/**
 * Total social surplus (CS + industry profit).
 */
export function totalSurplus(n, k, a = A_DEFAULT, c = C_DEFAULT) {
  const cs = consumerSurplus(n, k, a, c);
  const indProfit = k * member(n, k, a, c) + (n - k) * outsider(n, k, a, c);
  return cs + indProfit;
}
