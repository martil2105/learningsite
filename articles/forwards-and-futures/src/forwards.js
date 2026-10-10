/*
  Forward prices from the cost of carrying the asset.

  A share index stands at S0 = 100, the safe rate is r = 4% and the index pays
  dividends at q = 1.5% a year, both continuously compounded. A forward agrees
  today on the price F at which the index changes hands in T = 1 year.

  Oil can be stored but not lent: holding a barrel costs storage instead of
  paying a dividend, and only someone who already holds oil can sell it today
  and buy it back forward.
*/
export const S0 = 100, R = 0.04, Q = 0.015, T = 1, SIGMA = 0.18;

// The forward price: the cost of buying now and carrying to T.
export const forward = (s = S0, r = R, q = Q, t = T) => s * Math.exp((r - q) * t);

// The arbitrage at a quoted forward price: what it locks in at T, per share.
// Above the fair price: borrow, buy e^(-qT) shares (dividends reinvested grow
// them to one), sell forward. Below: the reverse.
export function arbitrage(quoted, s = S0, r = R, q = Q, t = T) {
  const fair = forward(s, r, q, t);
  const locked = Math.abs(quoted - fair);
  return {
    fair, quoted, locked,
    side: quoted > fair + 1e-12 ? "carry" : quoted < fair - 1e-12 ? "reverse" : "none",
    shares: Math.exp(-q * t),                  // shares bought (or shorted) today
    borrowed: s * Math.exp(-q * t),            // money borrowed (or lent) today
    owed: s * Math.exp(-q * t) * Math.exp(r * t), // repaid (or received) at T, = fair
  };
}
// The money at T from each piece of the cash-and-carry, for an index level sT.
export const pieces = (sT, quoted, s = S0, r = R, q = Q, t = T) => ({
  share: sT - forward(s, r, q, t),  // one share at T, less the loan that bought it
  forward: quoted - sT,              // the forward we sold
  total: quoted - forward(s, r, q, t),
});

// Seeded index paths over the year, lognormal with expected return mu (so the
// price grows at mu - q on average) and volatility sigma.
export function paths(draws, n, steps, mu, sigma = SIGMA, s = S0, q = Q, t = T) {
  const dt = t / steps, a = (mu - q - (sigma * sigma) / 2) * dt, b = sigma * Math.sqrt(dt);
  const out = [];
  for (let p = 0; p < n; p++) {
    const xs = [s];
    let v = s;
    for (let i = 0; i < steps; i++) { v *= Math.exp(a + b * draws()); xs.push(v); }
    out.push(xs);
  }
  return out;
}
export const expected = (mu, t = T, s = S0, q = Q) => s * Math.exp((mu - q) * t);
// The middle 90% of the index at time t, for expected return mu.
export function band(mu, t, sigma = SIGMA, s = S0, q = Q) {
  const m = Math.log(s) + (mu - q - (sigma * sigma) / 2) * t, sd = sigma * Math.sqrt(t), z = 1.6448536269514722;
  return [Math.exp(m - z * sd), Math.exp(m + z * sd)];
}

// Oil: spot 60, storage paid as it accrues. The ceiling on the forward price
// is the cost of buying now, storing and financing; nothing pins it from below.
export const OIL = { spot: 60, storage: 0.5 }; // dollars a barrel, dollars a barrel a month
export const ceiling = (months, spot = OIL.spot, storage = OIL.storage, r = R) => {
  const t = months / 12;
  // storage paid monthly in arrears, each payment financed to delivery
  let s = 0; for (let k = 1; k <= months; k++) s += storage * Math.exp(r * (t - k / 12));
  return spot * Math.exp(r * t) + s;
};

// 20 April 2020, NYMEX WTI settlements (quoted): May and June contracts, and
// the Friday before (from the day's changes, -55.90 and -4.60).
export const WTI = {
  fri: { may: 18.27, june: 25.03 },
  mon: { may: -37.63, june: 20.43 },
  change: { may: -55.9, june: -4.6 },
};

// Daily settlement. The futures price is the forward price for what's left of
// the year, F_t = S_t e^((r-q)(T-t)). A long futures position receives
// h_t (F_{t+1} - F_t) at the end of each day, and the cash earns r to T.
// Tailed: hold e^(-r(T - t_{+1})) contracts over the day, so each day's cash
// grows back to exactly its size at T and the total is F_T - F_0, a forward's
// payoff. Untailed: one contract all year.
export function settle(path, r = R, q = Q, t = T) {
  const n = path.length - 1, dt = t / n;
  const fut = path.map((v, i) => v * Math.exp((r - q) * (t - i * dt)));
  let tailed = 0, untailed = 0, cash = [0], cashU = [0], acc = 0, accU = 0;
  for (let i = 0; i < n; i++) {
    const d = fut[i + 1] - fut[i], grow = Math.exp(r * (t - (i + 1) * dt));
    tailed += (d / grow) * grow;   // e^(-r(T-t)) contracts, cash grown to T
    untailed += d * grow;
    acc = acc * Math.exp(r * dt) + d / grow;  // the tailed margin account, marked daily
    accU = accU * Math.exp(r * dt) + d;
    cash.push(acc); cashU.push(accU);
  }
  return { fut, tailed, untailed, forward: path[n] - fut[0], cash, cashU };
}
