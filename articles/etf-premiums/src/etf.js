/*
  A bond ETF, its basket and its NAV.

  V is what the fund's bonds are really worth today, per share of the ETF.
  Authorised participants (APs) can hand the fund a basket of bonds for new
  shares, or hand shares back for bonds, at a round-trip cost of c. So the
  ETF's price P stays within c of V: above V(1 + c) they create and sell,
  below V(1 - c) they buy and redeem.

  The NAV is worked out from each bond's last trade. If a share p of the bonds
  trade on a given day, and the rest keep yesterday's mark, then with many
  bonds the NAV closes a share p of its gap to V every day:
     NAV_t = NAV_{t-1} + p (V_t - NAV_{t-1}).
  The reported premium is P / NAV - 1, which mixes the two gaps.
*/
import { normals, mulberry32 } from "./random.js";

// ------------------------------------------------------------ the arbitrage band
// what an AP makes on a creation or a redemption, per dollar, at a premium x of
// the price over the basket's value
export const createProfit = (x, c) => x - c;
export const redeemProfit = (x, c) => -x - c;
export const afterArbitrage = (x, c) => Math.max(-c, Math.min(c, x));

// ------------------------------------------------------------ a sell-off, many bonds
// The basket falls by `fall` in total over `downDays` equal steps, then stays
// put; `days` in all. With many bonds the NAV follows the recursion exactly,
// and with no flows the ETF trades at the basket's value.
export function sellOff({ fall = 0.1, p = 0.2, days = 20, downDays = 5 } = {}) {
  const step = Math.pow(1 - fall, 1 / downDays);
  let V = 100, nav = 100;
  const out = [{ t: 0, V, nav, P: V, prem: 0 }];
  for (let t = 1; t <= days; t++) {
    if (t <= downDays) V *= step;
    nav += p * (V - nav);
    out.push({ t, V, nav, P: V, prem: V / nav - 1 });
  }
  return out;
}
// the same sell-off with a finite number of bonds, each re-marked at random
export function sellOffBonds({ fall = 0.1, p = 0.2, days = 20, downDays = 5, bonds = 200, seed = 3 } = {}) {
  const u = mulberry32(seed), step = Math.pow(1 - fall, 1 / downDays);
  let V = 100; const marks = new Float64Array(bonds).fill(100);
  const out = [{ t: 0, V, nav: 100 }];
  for (let t = 1; t <= days; t++) {
    if (t <= downDays) V *= step;
    for (let i = 0; i < bonds; i++) if (u() < p) marks[i] = V;
    out.push({ t, V, nav: marks.reduce((a, b) => a + b, 0) / bonds });
  }
  return out;
}

// ------------------------------------------------------------ ordinary days
// Daily moves in the basket with volatility vol; each of `bonds` bonds re-marked
// with chance p; the ETF price wanders inside the band with buying and selling
// pressure that fades by half each day.
export function ordinaryDays({ days = 2000, bonds = 200, p = 0.2, c = 0.003, vol = 0.01, flow = 0.002, seed = 11 } = {}) {
  const z = normals(seed), u = mulberry32(seed + 1);
  let V = 100, dev = 0;
  const marks = new Float64Array(bonds).fill(100);
  const out = [];
  for (let t = 0; t <= days; t++) {
    if (t > 0) V *= Math.exp(vol * z() - (vol * vol) / 2);
    for (let i = 0; i < bonds; i++) if (t > 0 && u() < p) marks[i] = V;
    let nav = 0; for (let i = 0; i < bonds; i++) nav += marks[i]; nav /= bonds;
    dev = afterArbitrage(0.5 * dev + flow * z(), c);
    out.push({ t, V, nav, P: V * (1 + dev) });
  }
  return out;
}
// today's premium against tomorrow's change in the NAV and in the price
export function nextDay(series) {
  const pts = [];
  for (let t = 0; t + 1 < series.length; t++) {
    const a = series[t], b = series[t + 1];
    pts.push({ prem: a.P / a.nav - 1, dNav: b.nav / a.nav - 1, dP: b.P / a.P - 1 });
  }
  return pts;
}
export function slope(pts, key) {
  const n = pts.length;
  let mx = 0, my = 0; for (const q of pts) { mx += q.prem; my += q[key]; } mx /= n; my /= n;
  let sxy = 0, sxx = 0; for (const q of pts) { sxy += (q.prem - mx) * (q[key] - my); sxx += (q.prem - mx) ** 2; }
  return { slope: sxy / sxx, mx, my };
}
