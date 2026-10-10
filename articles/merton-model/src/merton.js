/*
  Merton's (1974) firm, read backwards from its shares.

  The firm's assets are worth V today and follow dV/V = mu dt + s dW. It owes
  one zero-coupon debt with face value F, due in T years. At T the lenders get
  min(V_T, F) and the shareholders max(V_T - F, 0), so the shares are a call on
  the assets struck at the debt. Prices use the safe rate r (continuously
  compounded), as Black and Scholes do; real probabilities use mu.

  What a market shows us is the shares' value E and how much they move, sE.
  solve() finds the V and s that produce both.
*/

// The firm we follow: it owes $70 (say, millions) in a year, its shares are
// worth $30 and move 60% a year, and the safe rate is 3%.
export const F = 70;
export const T = 1;
export const R = 0.03;
export const E0 = 30;
export const SE0 = 0.6;
// A safer firm for comparison: shares worth $40 moving 45% a year, owing $60.
export const SAFE = { E: 40, sE: 0.45, F: 60 };

// The standard normal distribution function, to about 1e-15 (a series for
// small |x| and a continued fraction for erfc beyond), and its inverse.
export function Phi(x) {
  return 0.5 * erfc(-x / Math.SQRT2);
}
function erfc(x) {
  const z = Math.abs(x);
  let r;
  if (z < 0.5) {
    let sum = z, term = z, n = 0;
    while (Math.abs(term) > 1e-17 * Math.abs(sum)) { n++; term *= (-z * z) / n; sum += term / (2 * n + 1); }
    r = 1 - (2 / Math.sqrt(Math.PI)) * sum;
  } else {
    const tiny = 1e-300;
    let f = z, C = z, D = 0;
    for (let i = 1; i < 300; i++) {
      const a = i / 2;
      D = z + a * D; D = Math.abs(D) < tiny ? tiny : D; D = 1 / D;
      C = z + a / C; C = Math.abs(C) < tiny ? tiny : C;
      const delta = C * D; f *= delta;
      if (Math.abs(delta - 1) < 1e-16) break;
    }
    r = Math.exp(-z * z) / Math.sqrt(Math.PI) / f;
  }
  return x >= 0 ? r : 2 - r;
}
export function PhiInv(p) {
  let lo = -40, hi = 40;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// Everything about a firm with assets V and asset volatility s.
export function firm(V, s, f = F, t = T, r = R) {
  const sq = s * Math.sqrt(t);
  const d1 = (Math.log(V / f) + (r + (s * s) / 2) * t) / sq;
  const d2 = d1 - sq;
  const disc = f * Math.exp(-r * t);
  const E = V * Phi(d1) - disc * Phi(d2);
  const D = V - E;
  const delta = Phi(d1);
  return {
    V, s, E, D, d1, d2, delta,
    sE: (s * V * delta) / E,          // the shares' volatility
    lever: (V * delta) / E,           // how many times the assets' moves the shares make
    pdQ: Phi(-d2),                    // the risk-neutral chance the assets end below the debt
    spread: Math.log(disc / D) / t,   // the yield on the debt above the safe rate
    recovery: (D * Math.exp(r * t) - f * Phi(d2)) / (f * Phi(-d2)), // lenders' risk-neutral recovery, per dollar owed, in default
  };
}

// The real chance of default when the assets are expected to earn mu.
export function pdP(V, s, mu, f = F, t = T) {
  return Phi(-(Math.log(V / f) + (mu - (s * s) / 2) * t) / (s * Math.sqrt(t)));
}
// The same from the risk-neutral chance and a Sharpe ratio lam = (mu - r)/s.
export const pdFromQ = (pdq, lam, t = T) => Phi(PhiInv(pdq) - lam * Math.sqrt(t));

// Assets V for which the shares are worth e, at asset volatility s.
export function assetsFor(e, s, f = F, t = T, r = R) {
  let lo = e, hi = e + f * 3;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (firm(m, s, f, t, r).E < e) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
// Assets V for which the shares move sE a year, at asset volatility s < sE
// (the shares move more the closer the assets are to the debt).
export function assetsForVol(sE, s, f = F, t = T, r = R) {
  if (!(s < sE)) return NaN;
  let lo = f * Math.exp(-r * t) * 0.2, hi = f * 400;
  for (let i = 0; i < 200; i++) { const m = Math.sqrt(lo * hi); if (firm(m, s, f, t, r).sE > sE) lo = m; else hi = m; }
  return Math.sqrt(lo * hi);
}

// The firm behind shares worth e that move sE: two equations, two unknowns.
// Fixed point on s, with V found exactly for each s.
export function solve(e = E0, sE = SE0, f = F, t = T, r = R) {
  let s = (sE * e) / (e + f * Math.exp(-r * t)), V = 0;
  for (let it = 0; it < 500; it++) {
    V = assetsFor(e, s, f, t, r);
    const x = firm(V, s, f, t, r);
    const next = (sE * e) / (V * x.delta);
    if (Math.abs(next - s) < 1e-15) { s = next; break; }
    s = next;
  }
  V = assetsFor(e, s, f, t, r);
  return firm(V, s, f, t, r);
}

// Black and Cox's (1976) firm, which defaults the first time its assets touch
// the debt: the chance that happens within t years, with log drift m = mu - s^2/2.
export function firstPassage(V, s, mu, f = F, t = T) {
  const x = Math.log(V / f), m = mu - (s * s) / 2, sq = s * Math.sqrt(t);
  return Phi((-x - m * t) / sq) + Math.exp((-2 * m * x) / (s * s)) * Phi((-x + m * t) / sq);
}

// Asset paths over the year for the figures, from seeded normal draws.
export function paths(V, s, mu, draws, n, steps, t = T) {
  const dt = t / steps, a = (mu - (s * s) / 2) * dt, b = s * Math.sqrt(dt);
  const out = [];
  for (let p = 0; p < n; p++) {
    const xs = [V];
    let v = V;
    for (let i = 0; i < steps; i++) { v *= Math.exp(a + b * draws()); xs.push(v); }
    out.push(xs);
  }
  return out;
}
