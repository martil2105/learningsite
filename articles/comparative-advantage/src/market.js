/*
  The second route: any number of goods, solved through the labour market.

  Shares no code with src/trade.js on purpose. trade.js writes the two-good
  answer down in closed form; this file only knows that each good is made
  wherever it is cheaper, that spending shares are fixed (or CES), and that the
  Valley's workers must all be employed. check-numbers.mjs makes the two agree.

    va[j], ca[j]   days of work per unit of good j in the Valley and the Coast
    k              Coast workers per Valley worker
    shares[j]      spending weights (they sum to 1)
    sigma          elasticity of substitution between goods; 1 is Cobb–Douglas

  The Coast's wage is the unit of account, and w is the Valley's wage in Coast
  wages. Good j is made in the Valley when w·va[j] < ca[j], in the Coast when
  it is dearer, and by either when the two costs tie.
*/

function spendShares(prices, shares, sigma) {
  if (sigma === 1) return shares;
  const wts = prices.map((p, j) => Math.pow(shares[j], sigma) * Math.pow(p, 1 - sigma));
  const tot = wts.reduce((s, v) => s + v, 0);
  return wts.map((v) => v / tot);
}

// Days of Valley work demanded per Valley worker, with tied goods given
// entirely to the Valley (upper) or entirely to the Coast (lower).
function valleyDemand(w, va, ca, k, shares, sigma, tiesToValley) {
  const prices = va.map((v, j) => Math.min(w * v, ca[j]));
  const s = spendShares(prices, shares, sigma);
  const income = w + k; // world income per Valley worker, in Coast wages
  let d = 0;
  for (let j = 0; j < va.length; j++) {
    const cv = w * va[j], cc = ca[j];
    if (cv < cc || (cv === cc && tiesToValley)) d += (s[j] * income) / w;
  }
  return d;
}

export function solve(va, ca, k, shares, sigma = 1) {
  const edgesNow = va.map((v, j) => ca[j] / v); // the Valley is cheaper at j iff w < edge
  let lo = Math.min(...edgesNow) * 0.5;
  let hi = Math.max(...edgesNow) * 2;
  let w = NaN;
  for (let it = 0; it < 300; it++) {
    const mid = 0.5 * (lo + hi);
    if (valleyDemand(mid, va, ca, k, shares, sigma, false) > 1) lo = mid;
    else if (valleyDemand(mid, va, ca, k, shares, sigma, true) < 1) hi = mid;
    else { w = mid; break; }
    if (hi - lo <= 4e-16 * hi) break;
  }
  if (Number.isNaN(w)) w = 0.5 * (lo + hi);
  // A wage that has converged onto a tie is exactly that tie: the flat steps in
  // this model are exact, and the bisection only approaches them from one side.
  for (const e of edgesNow) {
    if (Math.abs(w - e) <= 1e-9 * e &&
        valleyDemand(e, va, ca, k, shares, sigma, false) <= 1 &&
        valleyDemand(e, va, ca, k, shares, sigma, true) >= 1) {
      w = e;
    }
  }
  const prices = va.map((v, j) => Math.min(w * v, ca[j]));
  const maker = va.map((v, j) => (w * v < ca[j] ? "valley" : w * v > ca[j] ? "coast" : "both"));
  return { w, prices, maker, ...welfare(w, va, ca, prices, shares, sigma) };
}

// Real-wage gain of each economy over its own no-trade position.
function welfare(w, va, ca, prices, shares, sigma) {
  const index = (ps) => {
    if (sigma === 1) return Math.exp(ps.reduce((s, p, j) => s + shares[j] * Math.log(p), 0));
    const v = ps.reduce((s, p, j) => s + Math.pow(shares[j], sigma) * Math.pow(p, 1 - sigma), 0);
    return Math.pow(v, 1 / (1 - sigma));
  };
  const P = index(prices);
  // Without trade each economy prices goods at its own labour cost, wage = 1.
  const gainValley = (w / P) / (1 / index(va));
  const gainCoast = (1 / P) / (1 / index(ca));
  return { gainValley, gainCoast };
}

/*
  The two-good article economy through this route, for the checks: outputs per
  worker-day become days per unit.
*/
export function solveTwoGood(valley, coast, k, share = 0.5, sigma = 1) {
  const va = [1 / valley.tools, 1 / valley.grain];
  const ca = [1 / coast.tools, 1 / coast.grain];
  const r = solve(va, ca, k, [share, 1 - share], sigma);
  return { ...r, p: r.prices[0] / r.prices[1] };
}

/*
  The many-goods figure: N goods with equal shares and the Valley's edge on
  each. Only the edges matter, so the Valley's days per unit are all 1.
*/
export function solveEdges(edgeList, k) {
  const n = edgeList.length;
  const va = edgeList.map(() => 1);
  return solve(va, edgeList, k, edgeList.map(() => 1 / n), 1);
}
