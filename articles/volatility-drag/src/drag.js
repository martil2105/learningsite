// Leveraged funds that reset their leverage every day, and the index they track.
import { normals } from "./random.js";

export const DAYS = 252;

// One year of daily simple returns from a lognormal model with annual drift mu
// (of the log price, plus sigma^2/2) and annual volatility sigma.
export function simulate(seed, mu, sigma, days = DAYS) {
  const z = normals(seed);
  const dt = 1 / days;
  const r = new Array(days);
  for (let t = 0; t < days; t++) r[t] = Math.exp((mu - (sigma * sigma) / 2) * dt + sigma * Math.sqrt(dt) * z()) - 1;
  return r;
}

// The same shocks, rescaled so the index ends the year at exactly 1 + target.
export function pinEnd(r, target) {
  const logs = r.map((x) => Math.log1p(x));
  const shift = (Math.log1p(target) - logs.reduce((a, b) => a + b, 0)) / logs.length;
  return logs.map((l) => Math.expm1(l + shift));
}

// Cumulative value paths starting at 1. A daily loss of 100% or more wipes
// the fund out and it stays at zero.
export function indexPath(r) {
  const out = [1];
  for (const x of r) out.push(out[out.length - 1] * (1 + x));
  return out;
}
export function fundPath(r, L) {
  const out = [1];
  for (const x of r) {
    const v = out[out.length - 1] * Math.max(0, 1 + L * x);
    out.push(v);
  }
  return out;
}

// Realised variance: the sum of squared daily log returns.
export function realisedVariance(r) {
  return r.reduce((a, x) => a + Math.log1p(x) ** 2, 0);
}

// The two-number rule: fund = index^L * exp(-(L^2 - L)/2 * realised variance).
export function dragCoefficient(L) {
  return (L * L - L) / 2;
}
export function predictFund(indexEnd, rv, L) {
  return Math.pow(indexEnd, L) * Math.exp(-dragCoefficient(L) * rv);
}

// A zigzag: the index alternates +x and -x.
export function zigzag(x, days) {
  return Array.from({ length: days }, (_, i) => (i % 2 === 0 ? x : -x));
}

// Does the fund beat L times the index's return over the period?
// g > 0 means it beats. V is realised variance, S the index's end value.
export function beatMargin(S, V, L) {
  return predictFund(S, V, L) - (1 + L * (S - 1));
}
