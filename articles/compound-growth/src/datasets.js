/*
  Growth rates for the article. Everything is annual.
*/
export const RICH = 0.02; // the slow economy in the build-up
export const FAST = 0.03; // one point faster
export const YEARS = 100;

// The question: steady 3% against alternating boom and bust averaging 3%.
export const STEADY = 0.03;
export const BOOM = 0.08;
export const BUST = -0.02;
export const Q_YEARS = 50;

// The lab: an arithmetic mean growth of 2% with log growth ~ N(mu, sigma^2),
// mu chosen so that E[1 + g] = 1.02 whatever sigma is.
export const MEAN_GROWTH = 0.02;
export const LAB_YEARS = 50;
export const LAB_PATHS = 400;
export const SIGMA_DEFAULT = 0.15;
export const SIGMA_MIN = 0.01;
export const SIGMA_MAX = 0.3;
export const SEED = 20260918;

// Reference volatilities quoted in the prose (standard deviation of annual log growth).
export const SIGMA_GDP = 0.02;
export const SIGMA_EQUITY = 0.2;
