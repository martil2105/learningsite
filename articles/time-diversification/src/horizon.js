// Stocks against bonds over a horizon of T years.
//
// Bonds grow at a safe rate r. Stocks' log growth each year is normal with
// mean r + premium - sigma^2/2 and standard deviation sigma, independently from
// year to year. So the log of the ratio R = stocks / bonds after T years is
// normal with mean m T and standard deviation sigma sqrt(T), where
// m = premium - sigma^2 / 2 is the median growth gap. Every closed form on the
// page comes from that one line.
import { normCdf, normInv } from "./stats.js";
import { normals } from "./random.js";

export const PREMIUM = 0.06; // stocks' expected yearly return minus the bond's
export const SIGMA = 0.2; // yearly volatility of stocks
export const YEARS = 40;
export const PATHS = 200;
export const SEED = 11;

export const medianGap = (premium, sigma) => premium - (sigma * sigma) / 2;

// log R_T ~ N(mu, s^2)
export function logRatio(T, premium = PREMIUM, sigma = SIGMA) {
  return { mu: medianGap(premium, sigma) * T, s: sigma * Math.sqrt(T) };
}

// P(stocks end behind bonds after T years)
export function chanceBehind(T, premium = PREMIUM, sigma = SIGMA) {
  if (T <= 0) return NaN;
  const { mu, s } = logRatio(T, premium, sigma);
  return normCdf(-mu / s);
}

// The ratio that stocks fall below with probability q ("one year in 1/q").
export function ratioQuantile(T, q, premium = PREMIUM, sigma = SIGMA) {
  const { mu, s } = logRatio(T, premium, sigma);
  return Math.exp(mu + normInv(q) * s);
}

// E[R ; R < 1], by completing the square in the lognormal integral.
function partialMeanBelowOne(T, premium, sigma) {
  const { mu, s } = logRatio(T, premium, sigma);
  return Math.exp(mu + (s * s) / 2) * normCdf((-mu - s * s) / s);
}

// The average shortfall when stocks do end behind: E[1 - R | R < 1].
export function shortfallWhenBehind(T, premium = PREMIUM, sigma = SIGMA) {
  const p = chanceBehind(T, premium, sigma);
  return 1 - partialMeanBelowOne(T, premium, sigma) / p;
}

// The expected shortfall over all outcomes: E[(1 - R)^+] = P - E[R ; R < 1].
export function expectedShortfall(T, premium = PREMIUM, sigma = SIGMA) {
  return chanceBehind(T, premium, sigma) - partialMeanBelowOne(T, premium, sigma);
}

// The q-quantile of log R is m T + z sigma sqrt(T) with z = normInv(q) < 0.
// As a function of sqrt(T) it's a parabola, lowest at sqrt(T*) = -z sigma / (2m),
// where the ratio is exp(-z^2 sigma^2 / (4m)).
export function worstYear(q, premium = PREMIUM, sigma = SIGMA) {
  const z = normInv(q), m = medianGap(premium, sigma);
  return { T: Math.pow((-z * sigma) / (2 * m), 2), ratio: Math.exp(-(z * z * sigma * sigma) / (4 * m)) };
}

// Annualised excess growth over T years: (log R_T) / T, whose spread is
// sigma / sqrt(T). Same event, different ruler: it's below 0 exactly when
// R_T is below 1.
export const annualised = (ratio, T) => Math.log(ratio) / T;

// Seeded paths of the ratio, one value per year from 0 to YEARS.
export function ratioPaths(premium = PREMIUM, sigma = SIGMA, n = PATHS, years = YEARS, seed = SEED) {
  const z = normals(seed);
  const m = medianGap(premium, sigma);
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = [1];
    let l = 0;
    for (let t = 1; t <= years; t++) {
      l += m + sigma * z();
      p.push(Math.exp(l));
    }
    out.push(p);
  }
  return out;
}

// The tails the page offers, as "one outcome in N".
export const TAILS = [10, 20, 100, 1000];

// Where the average shortfall over all outcomes is largest, by golden-section
// search on [0.1, 60] years (it rises, then falls, for these parameters).
export function shortfallPeak(premium = PREMIUM, sigma = SIGMA) {
  let a = 0.1, b = 60;
  const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a);
  for (let i = 0; i < 200; i++) {
    if (expectedShortfall(c, premium, sigma) > expectedShortfall(d, premium, sigma)) b = d;
    else a = c;
    c = b - g * (b - a);
    d = a + g * (b - a);
  }
  const T = (a + b) / 2;
  return { T, value: expectedShortfall(T, premium, sigma) };
}
