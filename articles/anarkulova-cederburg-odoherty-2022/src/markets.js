// Many markets, one survivor, after Anarkulova, Cederburg and O'Doherty (2022).
//
// Each market's real log return each year is normal with mean m_c and
// volatility SIGMA, independently from year to year and across markets. In the
// lab every market has the same mean GROWTH: they are identical by
// construction, and any difference in their records is luck. The second figure
// lets the true means differ too, with m_c ~ N(GROWTH, tau^2).
//
// A record implies a chance of losing to inflation over T years of
// Phi(-m sqrt(T) / s), with m and s its average and volatility. The market we
// end up studying is the one that did best, and the best of n records is
// ahead of the truth by about E[max of n normals] standard errors.
import { normCdf, normPdf } from "./stats.js";
import { normals } from "./random.js";

export const MARKETS = 39;
export const YEARS = 130;
export const GROWTH = 0.04;
export const SIGMA = 0.2;
export const HORIZON = 50;

// The chance a record with average m and volatility s implies of a real loss over T years.
export const lossChance = (m, s, T) => normCdf((-m * Math.sqrt(T)) / s);

// A market picked at random and followed for T years, when true means differ by tau:
// log wealth is N(m T, s^2 T + tau^2 T^2).
export const lossChanceMixed = (m, s, tau, T) => normCdf((-m * Math.sqrt(T)) / Math.sqrt(s * s + tau * tau * T));
// ... which never falls below the share of markets whose true mean is negative.
export const lossFloor = (m, tau) => (tau > 0 ? normCdf(-m / tau) : 0);

// E[max of n independent standard normals] = integral of x n phi(x) Phi(x)^(n-1).
export function expectedMax(n) {
  if (n === 1) return 0;
  const a = -9, b = 9, K = 6000, h = (b - a) / K;
  let s = 0;
  for (let i = 0; i <= K; i++) {
    const x = a + i * h, w = i === 0 || i === K ? 1 : i % 2 ? 4 : 2;
    s += w * x * n * normPdf(x) * Math.pow(normCdf(x), n - 1);
  }
  return (s * h) / 3;
}

// How far the best of n records is ahead of the truth, per year: E[max] times
// the spread of a record's average, sqrt(tau^2 + s^2 / Y).
export const luckPremium = (n, Y, s = SIGMA, tau = 0) => expectedMax(n) * Math.sqrt(tau * tau + (s * s) / Y);
// In the loss-chance formula that becomes a shift in the z-score of
// E[max] sqrt(T / Y) when the markets are identical: no m, no s.
export const zShift = (n, T, Y) => expectedMax(n) * Math.sqrt(T / Y);

// A simulated world: n markets, Y years each. Returns every market's yearly
// log returns, its cumulative log wealth, and its average and volatility.
export function simulateWorld(seed, n = MARKETS, Y = YEARS, m = GROWTH, s = SIGMA, tau = 0) {
  const z = normals(seed);
  const markets = [];
  for (let c = 0; c < n; c++) {
    const mc = m + tau * z();
    const r = [], w = [0];
    let sum = 0;
    for (let t = 0; t < Y; t++) { const x = mc + s * z(); r.push(x); sum += x; w.push(sum); }
    const avg = sum / Y;
    let ss = 0; for (const x of r) ss += (x - avg) * (x - avg);
    markets.push({ trueMean: mc, returns: r, wealth: w, avg, vol: Math.sqrt(ss / (Y - 1)) });
  }
  let best = 0;
  for (let c = 1; c < n; c++) if (markets[c].wealth[Y] > markets[best].wealth[Y]) best = c;
  const all = markets.flatMap((k) => k.returns);
  const pAvg = all.reduce((a, b) => a + b, 0) / all.length;
  const pVol = Math.sqrt(all.reduce((a, b) => a + (b - pAvg) * (b - pAvg), 0) / (all.length - 1));
  return { markets, best, pooled: { avg: pAvg, vol: pVol } };
}
