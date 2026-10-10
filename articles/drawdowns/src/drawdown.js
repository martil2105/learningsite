/*
  The worst drawdown of a strategy whose log value is a Brownian motion with
  drift μ and volatility σ (both a year): X_t = μt + σW_t. A drawdown is how far
  X sits below its highest value so far; the worst drawdown over T years is the
  largest of those, D_T, in log points (a fall of 1 − e^(−D) in money).

  Scaling. Measure depth in units of σ²/μ and time in units of σ²/μ² = 1/SR²
  years (SR = μ/σ): every strategy with an edge then has the same worst
  drawdown, a function of τ = SR²·T alone. So one function does for all of
  them, and for a strategy with no edge (μ = 0) depth goes in units of σ and
  the worst drawdown grows exactly like √T.

  The distribution. The drawdown is a reflected Brownian motion, and the worst
  one stays below h until τ if and only if that motion hasn't reached h. That
  chance solves a heat equation on [0, h], reflecting at 0 and absorbing at h,
  and we sum its eigenfunction series: with drift 1, ψ = e^(x) (cos kx − sin kx / k)
  with tan kh = k, plus one hyperbolic mode when h > 1; with no drift,
  cos((n + ½)πx/h). The mean is ∫ P(D ≥ h) dh. Magdon-Ismail, Atiya, Pratap
  and Abu-Mostafa (2004) give the same function as Q_p, and its two ends:
  √(πτ/2) for a short record and ½ ln τ + 0.63519 for a long one.
*/
import { normals } from "./random.js";

// ------------------------------------------------- scaled, drift 1, σ = 1
export function survivalPos(h, s, tol = 1e-15) {
  if (Math.abs(h - 1) < 1e-9) h = 1 + 1e-9;
  let v = 0;
  const add = (a, lam) => { v += a * Math.exp(-lam * s); };
  if (h > 1) {
    // κ = 1 − δ with tanh(κh) = κ, solved for δ so that it stays accurate when κ is within 1e-16 of 1
    const F = (d) => { const y = (1 - d) * h, e = Math.exp(-2 * y); return (2 * e) / (1 + e) - d; };
    let lo = Math.log(1e-300), hi = Math.log(1 - 1e-12);
    for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (F(Math.exp(m)) > 0) lo = m; else hi = m; }
    const d = Math.exp((lo + hi) / 2), k = 1 - d;
    const E = Math.exp(-2 * k * h), c = (1 + 1 / k) / 2;
    const tail = Math.abs(k - 1) * h < 1e-8 ? h : Math.expm1((k - 1) * h) / (k - 1);
    const num = c * ((1 - Math.exp(-(1 + k) * h)) / (1 + k) - E * tail);
    const den = c * c * ((1 - E) / (2 * k) - 2 * h * E + (E - E * E) / (2 * k));
    add(num / den, (d * (2 - d)) / 2);
  }
  const root = (a, b) => {
    let ga = h * Math.sin(a) - a * Math.cos(a);
    for (let i = 0; i < 100; i++) { const m = (a + b) / 2, gm = h * Math.sin(m) - m * Math.cos(m); if (gm > 0 === ga > 0) { a = m; ga = gm; } else b = m; }
    return (a + b) / 2;
  };
  const trig = (th) => {
    const k = th / h;
    const ic = (Math.exp(-h) * (k * Math.sin(th) - Math.cos(th)) + 1) / (1 + k * k);
    const is = (Math.exp(-h) * (-Math.sin(th) - k * Math.cos(th)) + k) / (1 + k * k);
    const s2 = Math.sin(2 * th), sn = Math.sin(th);
    const den = h / 2 + s2 / (4 * k) - (2 / k) * ((sn * sn) / (2 * k)) + (1 / (k * k)) * (h / 2 - s2 / (4 * k));
    return { a: (ic - is / k) / den, lam: (k * k + 1) / 2 };
  };
  if (h < 1) { const t = trig(root(1e-9, Math.PI / 2 - 1e-12)); add(t.a, t.lam); }
  for (let j = 1; j < 1e6; j++) {
    const t = trig(root(j * Math.PI - Math.PI / 2, j * Math.PI + Math.PI / 2));
    add(t.a, t.lam);
    if (t.lam * s > 40 && Math.abs(t.a) * Math.exp(-t.lam * s) < tol) break;
  }
  return Math.min(1, Math.max(0, v));
}
// scaled, no drift, σ = 1
export function survivalZero(h, s) {
  let v = 0;
  for (let n = 0; n < 1e6; n++) {
    const k = ((n + 0.5) * Math.PI) / h, lam = (k * k) / 2;
    v += ((4 / Math.PI) * (n % 2 ? -1 : 1)) / (2 * n + 1) * Math.exp(-lam * s);
    if (lam * s > 40) break;
  }
  return Math.min(1, Math.max(0, v));
}
// the mean worst drawdown in scaled units, ∫ P(D ≥ h) dh by Simpson's rule
export function meanScaled(tau, surv = survivalPos) {
  // the depth that matters is about √τ for a short record and ½ ln τ for a long one
  const H = surv === survivalZero ? 8 * Math.sqrt(tau) : Math.min(8 * Math.sqrt(tau), 0.5 * Math.log(Math.max(tau, 1)) + 25);
  let n = Math.ceil(H / (Math.min(Math.sqrt(tau), 1) / 40)); n += n % 2;
  const dh = H / n;
  let acc = 1;
  for (let i = 1; i <= n; i++) acc += (1 - surv(i * dh, tau)) * (i === n ? 1 : i % 2 ? 4 : 2);
  return (acc * dh) / 3;
}
export const meanShort = (tau) => Math.sqrt((Math.PI * tau) / 2);
export const meanLong = (tau) => 0.5 * Math.log(tau) + 0.63519;

// ------------------------------------------------------- in years and money
// P(D_T < h) for drift μ and volatility σ, h in log points
export function cdf(h, mu, sig, T) {
  if (h <= 0) return 0;
  if (mu === 0) return survivalZero(h / sig, T);
  if (mu < 0) throw new Error("only μ ≥ 0");
  const unit = (sig * sig) / mu;
  return survivalPos(h / unit, (T * mu * mu) / (sig * sig));
}
export function quantile(q, mu, sig, T) {
  let lo = 1e-9, hi = 30;
  for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (cdf(m, mu, sig, T) < q) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
export const median = (mu, sig, T) => quantile(0.5, mu, sig, T);
// a fall in money from a fall in log points, and back
export const lost = (d) => 1 - Math.exp(-d);
export const logOf = (x) => -Math.log(1 - x);

// the chance that L fresh years bring a worse drawdown than the B years before
// them did: ∫ P(D_L > h) dF_B(h), on a fine grid of h
export function beatChance(L, B, mu, sig, n = 2400) {
  const H = 1.25 * Math.max(quantile(0.99999, mu, sig, B), quantile(0.99999, mu, sig, L)), dh = H / n;
  let acc = 0, Fprev = 0;
  for (let i = 1; i <= n; i++) {
    const F = cdf(i * dh, mu, sig, B);
    acc += (F - Fprev) * (1 - cdf((i - 0.5) * dh, mu, sig, L));
    Fprev = F;
  }
  return acc;
}

// the density of D_T in log points, for drawing, by differencing the cdf
export function density(mu, sig, T, h0, h1, n) {
  const out = [], dh = (h1 - h0) / n;
  let F0 = cdf(Math.max(1e-9, h0), mu, sig, T);
  for (let i = 1; i <= n; i++) { const F1 = cdf(h0 + i * dh, mu, sig, T); out.push([h0 + (i - 0.5) * dh, (F1 - F0) / dh]); F0 = F1; }
  return out;
}

// the average time to climb back to the peak from a drawdown of d log points
// (Wald: the drift covers the distance at μ a year, whatever the volatility)
export const backYears = (d, mu) => d / mu;

// ------------------------------------------------------------ one strategy
export const SIGMA = 0.15, SR = 0.5, MU = SR * SIGMA;
export const DAYS = 252;
// daily log values over `years`, seeded
export function path(sr, seed, years = 40, sig = SIGMA) {
  const g = normals(seed), n = years * DAYS, dt = 1 / DAYS, m = sr * sig * dt, sd = sig * Math.sqrt(dt);
  const x = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) x[i] = x[i - 1] + m + sd * g();
  return x;
}
// the drawdown each day, the worst so far, and the days a drawdown first went
// past the worst before it (one per episode between two peaks)
export function underwater(x) {
  const n = x.length, dd = new Float64Array(n), worst = new Float64Array(n), records = [];
  let peak = x[0], w = 0, ep = 0, lastEp = -1;
  for (let i = 0; i < n; i++) {
    if (x[i] > peak) { peak = x[i]; ep++; }
    dd[i] = peak - x[i];
    if (dd[i] > w) { w = dd[i]; if (ep !== lastEp) { records.push(i); lastEp = ep; } }
    worst[i] = w;
  }
  return { dd, worst, records };
}
// the seeded paths the lab shows, one list for each Sharpe ratio
export const SEEDS = [20, 58, 19, 69, 2];

// ------------------------------------------------------- the US market
import { RET, DATES, N } from "./market.js";
const ms = (d) => Date.UTC(Math.floor(d / 1e4), (Math.floor(d / 100) % 100) - 1, d % 100);
export const US_YEARS = (ms(DATES[N - 1]) - ms(DATES[0])) / (365.25 * 864e5);
export const US_LOG = (() => { const x = new Float64Array(N + 1); for (let i = 0; i < N; i++) x[i + 1] = x[i] + Math.log1p(RET[i]); return x; })();
// drift and volatility a calendar year, from the whole century
export const US_MU = US_LOG[N] / US_YEARS;
export const US_SIGMA = (() => {
  let s = 0, s2 = 0;
  for (let i = 0; i < N; i++) { const r = Math.log1p(RET[i]); s += r; s2 += r * r; }
  const m = s / N, v = s2 / N - m * m;
  return Math.sqrt((v * N) / US_YEARS);
})();
// the date of each point of US_LOG (the value at the close of DATES[i − 1]; the first is the start)
export const usDate = (i) => (i === 0 ? DATES[0] : DATES[i - 1]);
// drawdown episodes from peak to recovery, deepest first
export function usEpisodes() {
  const x = US_LOG, out = [];
  let peak = x[0], pi = 0, cur = null;
  for (let i = 1; i < x.length; i++) {
    if (x[i] >= peak) { if (cur) { cur.back = i; out.push(cur); cur = null; } peak = x[i]; pi = i; continue; }
    const d = peak - x[i];
    if (!cur) cur = { peak: pi, low: i, depth: d, back: null };
    if (d > cur.depth) { cur.depth = d; cur.low = i; }
  }
  if (cur) out.push(cur);
  return out.sort((a, b) => b.depth - a.depth);
}
export const yearsBetween = (a, b) => (ms(b) - ms(a)) / (365.25 * 864e5);
