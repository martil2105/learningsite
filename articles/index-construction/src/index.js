/*
  Two indices over the same n stocks. The cap-weighted index holds each stock in
  proportion to its market value, which is what we'd hold if we bought them all
  once and never traded. The equal-weighted index holds 1/n of its money in each
  and trades back to that at every rebalance.

  The identity, exact for any returns, with the equal-weighted index rebalanced
  at the end of every period and both starting at equal weights:

    ln(EW_T / CW_T) = sum over periods of ln(AM_t / GM_t) + ln(G_T / G_0)

  where AM_t and GM_t are the arithmetic and geometric means of the stocks'
  gross returns in period t (so each term is >= 0), and G is the geometric mean
  of the cap weights, which falls as the cap-weighted index concentrates.
*/
import { normals } from "./random.js";

export const SETUP = { years: 30, steps: 12, mu: 0.08, sm: 0.15, si: 0.3 };

// monthly gross returns for n stocks: a common factor plus stock-specific moves.
// kappa > 0 pulls each stock's log size towards the average, so big firms grow
// more slowly than small ones and concentration settles instead of rising.
export function market(n, seed, kappa = 0, { years, steps, mu, sm, si } = SETUP) {
  const z = normals(seed), dt = 1 / steps, T = years * steps, R = [];
  const s = new Float64Array(n);
  const drift = (mu - (sm * sm + si * si) / 2) * dt, a = sm * Math.sqrt(dt), b = si * Math.sqrt(dt);
  for (let t = 0; t < T; t++) {
    const f = z();
    let mean = 0; for (let i = 0; i < n; i++) mean += s[i]; mean /= n;
    const row = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const pull = -kappa * (s[i] - mean) * dt;
      const e = b * z();
      s[i] += e + pull;
      row[i] = Math.exp(drift + a * f + e + pull);
    }
    R.push(row);
  }
  return R;
}

const geoMean = (w) => { let s = 0; for (const v of w) s += Math.log(v); return Math.exp(s / w.length); };

// run both indices through the returns; record the paths and the two terms
export function run(R) {
  const n = R[0].length;
  const w = new Float64Array(n).fill(1 / n);
  const G0 = geoMean(w);
  let lnCW = 0, lnEW = 0, gain = 0, turn = 0;
  const path = [{ t: 0, lnCW: 0, lnEW: 0, gain: 0, conc: 0, neff: n }];
  for (let t = 0; t < R.length; t++) {
    const r = R[t];
    let am = 0, lg = 0, gC = 0;
    for (let i = 0; i < n; i++) { am += r[i]; lg += Math.log(r[i]); gC += w[i] * r[i]; }
    am /= n;
    lnEW += Math.log(am); // equal weights at the start of every period
    lnCW += Math.log(gC);
    gain += Math.log(am) - lg / n;
    // the equal-weighted index trades back from its drifted weights
    let tv = 0; for (let i = 0; i < n; i++) tv += Math.abs(r[i] / (n * am) - 1 / n);
    turn += tv / 2;
    let sq = 0;
    for (let i = 0; i < n; i++) { w[i] = (w[i] * r[i]) / gC; sq += w[i] * w[i]; }
    path.push({ t: t + 1, lnCW, lnEW, gain, conc: Math.log(geoMean(w) / G0), neff: 1 / sq });
  }
  return { path, weights: Array.from(w), turn, end: path[path.length - 1] };
}

// ------------------------------------------------------------ turnover and gain by frequency
// For stock-specific moves with volatility si, one rebalance every dt years trades
// about half the mean absolute gap from equal weight, and the gain is half the
// spread of the stocks' returns in that period:
//   turnover a year  ~ si sqrt(1 - 1/n) / sqrt(2 pi dt)
//   gain a year      ~ (1 - 1/n) si^2 / 2          (the same at every frequency)
export const turnoverRate = (si, perYear, n = 100) => (si * Math.sqrt(1 - 1 / n) * Math.sqrt(perYear)) / Math.sqrt(2 * Math.PI);
export const gainRate = (si, n = 100) => ((1 - 1 / n) * si * si) / 2;
export const FREQS = [
  { perYear: 1, label: "yearly" },
  { perYear: 4, label: "quarterly" },
  { perYear: 12, label: "monthly" },
  { perYear: 52, label: "weekly" },
  { perYear: 252, label: "daily" },
];
// simulate daily moves and rebalance at each frequency from the same days
export function byFrequency(si, { n = 100, years = 10, seed = 5 } = {}) {
  const z = normals(seed), days = 252 * years, dt = 1 / 252;
  const daily = [];
  for (let d = 0; d < days; d++) {
    const row = new Float64Array(n);
    for (let i = 0; i < n; i++) row[i] = Math.exp(-0.5 * si * si * dt + si * Math.sqrt(dt) * z());
    daily.push(row);
  }
  return FREQS.map((f) => {
    const every = Math.round(252 / f.perYear);
    let turn = 0, gain = 0;
    const acc = new Float64Array(n).fill(1);
    for (let d = 0; d < days; d++) {
      for (let i = 0; i < n; i++) acc[i] *= daily[d][i];
      if ((d + 1) % every === 0) {
        let am = 0, lg = 0; for (let i = 0; i < n; i++) { am += acc[i]; lg += Math.log(acc[i]); } am /= n;
        let tv = 0; for (let i = 0; i < n; i++) tv += Math.abs(acc[i] / (n * am) - 1 / n);
        turn += tv / 2; gain += Math.log(am) - lg / n;
        acc.fill(1);
      }
    }
    return { ...f, turn: turn / years, gain: gain / years };
  });
}

// ------------------------------------------------------------ three stocks, one month
// A rises by d, B stays put, C falls by d. Both indices start at a third each.
export function oneMonth(d) {
  const g = [1 + d, 1, 1 - d], tot = g.reduce((a, b) => a + b, 0);
  const drifted = g.map((v) => v / tot);
  const trades = drifted.map((w) => 1 / 3 - w); // what the equal-weighted index buys (+) or sells (-)
  return { drifted, trades, turnover: trades.reduce((a, b) => a + Math.abs(b), 0) / 2 };
}
