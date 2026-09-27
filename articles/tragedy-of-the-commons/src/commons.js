/*
 * commons.js - Core analytical model for Tragedy of the Commons (Mi12)
 */

export const A_DEFAULT = 100;
export const W_DEFAULT = 1;
export const THETA_DEFAULT = 0.5;

/**
 * Efficient total effort under a sole owner / social planner.
 * E* = (theta * A / w)^(1 / (1 - theta)).
 */
export function effEffort(theta = THETA_DEFAULT, A = A_DEFAULT, w = W_DEFAULT) {
  return Math.pow((theta * A) / w, 1 / (1 - theta));
}

/**
 * Resource output: F(E) = A * E^theta.
 */
export function output(E, theta = THETA_DEFAULT, A = A_DEFAULT) {
  return E <= 0 ? 0 : A * Math.pow(E, theta);
}

/**
 * Total resource rent: R(E) = F(E) - w * E.
 */
export function rent(E, theta = THETA_DEFAULT, A = A_DEFAULT, w = W_DEFAULT) {
  return output(E, theta, A) - w * E;
}

/**
 * Maximum sustainable rent achievable at efficient effort E*.
 */
export function effRent(theta = THETA_DEFAULT, A = A_DEFAULT, w = W_DEFAULT) {
  const Es = effEffort(theta, A, w);
  return rent(Es, theta, A, w);
}

/**
 * Average product of effort: AP(E) = F(E) / E = A * E^(theta - 1).
 */
export function ap(E, theta = THETA_DEFAULT, A = A_DEFAULT) {
  return E <= 0 ? 0 : A * Math.pow(E, theta - 1);
}

/**
 * Marginal product of effort: MP(E) = dF/dE = theta * A * E^(theta - 1).
 */
export function mp(E, theta = THETA_DEFAULT, A = A_DEFAULT) {
  return E <= 0 ? 0 : theta * A * Math.pow(E, theta - 1);
}

/**
 * Closed-form total effort under non-cooperative open access with n symmetric users.
 * E(n) = (A / (w * n / (n - 1 + theta)))^(1 / (1 - theta)).
 */
export function closedEffort(n, theta = THETA_DEFAULT, A = A_DEFAULT, w = W_DEFAULT) {
  const denom = (w * n) / (n - 1 + theta);
  return Math.pow(A / denom, 1 / (1 - theta));
}

/**
 * Fraction of economic rent dissipated: D(n) = 1 - R(E(n)) / R*.
 * For theta = 0.5, D(n) = ((n - 1) / n)^2.
 */
export function dissipatedRent(n, theta = THETA_DEFAULT, A = A_DEFAULT, w = W_DEFAULT) {
  const E = closedEffort(n, theta, A, w);
  const Rs = effRent(theta, A, w);
  return 1 - rent(E, theta, A, w) / Rs;
}

/**
 * Ratio of common-access effort to efficient effort: E(n) / E*.
 * For theta = 0.5, this is exactly ((2n - 1) / n)^2.
 */
export function effortRatio(n, theta = THETA_DEFAULT) {
  if (theta === 0.5) {
    return Math.pow((2 * n - 1) / n, 2);
  }
  return closedEffort(n, theta) / effEffort(theta);
}

/**
 * Pigouvian corrective tax per unit of effort to restore the social optimum:
 * t* = AP(E*) - MP(E*).
 */
export function pigouvianTax(theta = THETA_DEFAULT, A = A_DEFAULT, w = W_DEFAULT) {
  const Es = effEffort(theta, A, w);
  return ap(Es, theta, A) - mp(Es, theta, A);
}
