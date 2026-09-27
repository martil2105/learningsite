/*
  One household, two kinds of spending, and a price shock.

  Energy takes a fifth of the budget in the base year and everything else the
  rest. All base prices are 1, so a basket's quantities are also its base-year
  spending shares. Preferences are CES with an elasticity of substitution sigma
  that the statistician never observes — which is the whole problem.
*/
export const W_ENERGY = 0.2; // base-year share of spending on energy
export const R_DEFAULT = 2; // energy prices double
export const SIGMA_DEFAULT = 1;
export const SIGMAS = [0, 0.5, 1, 2]; // the values quoted in the question section
export const SIGMA_MIN = 0;
export const SIGMA_MAX = 3;
export const R_MIN = 0.5;
export const R_MAX = 3;

// The chaining section.
export const SMOOTH_MONTHS = 12; // energy doubles in twelve equal monthly steps
export const SALE_SHARE = 0.2; // a good on sale every other month, a fifth of the budget
export const SALE_PRICE = 0.75; // a quarter off in sale months
export const SALE_MONTHS = 24;
