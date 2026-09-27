// A limit order book with one of three shapes, and a market order walking it.
// Prices are in cents to keep the arithmetic exact; level j sits j ticks beyond
// the best quote on its side.

export const TICK = 1;            // one cent
export const BEST_BID = 9999;     // $99.99
export const BEST_ASK = 10001;    // $100.01
export const MID = (BEST_BID + BEST_ASK) / 2;
export const LEVELS = 40;

// Depth at level j (0 = the touch). a is the exponent of the shape.
export const SHAPES = {
  flat: { a: 0, label: "Flat", depth: (j) => 500 },
  v: { a: 1, label: "Grows linearly", depth: (j) => 100 * (j + 1) },
  steep: { a: 2, label: "Grows with the square", depth: (j) => 20 * (j + 1) * (j + 1) },
};

export function book(shape, levels = LEVELS) {
  const d = SHAPES[shape].depth;
  const asks = [], bids = [];
  for (let j = 0; j < levels; j++) {
    asks.push({ j, price: BEST_ASK + j * TICK, qty: d(j) });
    bids.push({ j, price: BEST_BID - j * TICK, qty: d(j) });
  }
  return { asks, bids };
}

// Walk one side of the book with a market order for q shares.
export function walk(levels, q) {
  const fills = [];
  let left = q, cost = 0;
  for (const L of levels) {
    if (left <= 0) break;
    const take = Math.min(left, L.qty);
    fills.push({ j: L.j, price: L.price, qty: take, full: take === L.qty });
    cost += take * L.price;
    left -= take;
  }
  const filled = q - left;
  const last = fills.length ? fills[fills.length - 1] : null;
  return {
    fills,
    filled,
    unfilled: left,
    avg: filled > 0 ? cost / filled : NaN,
    last: last ? last.price : NaN,
    lastLevel: last ? last.j : -1,
  };
}

// Where the average fill sits between the touch (0) and the last price hit (1).
export function shareOfWalk(side, result) {
  const touch = side === "buy" ? BEST_ASK : BEST_BID;
  const walked = Math.abs(result.last - touch);
  return walked === 0 ? NaN : Math.abs(result.avg - touch) / walked;
}

// Continuous version: depth density k·x^a ticks from the touch. An order of q
// shares reaches x* = ((a+1)q/k)^(1/(a+1)) and its average fill sits
// (a+1)/(a+2) of the way there.
export function continuousReach(a, k, q) {
  return Math.pow(((a + 1) * q) / k, 1 / (a + 1));
}
export function continuousShare(a) {
  return (a + 1) / (a + 2);
}

// Buy q and sell q straight back: cost per share of the round trip, in cents.
export function roundTrip(shape, q) {
  const b = book(shape, 400);
  const buy = walk(b.asks, q), sell = walk(b.bids, q);
  return buy.avg - sell.avg;
}
