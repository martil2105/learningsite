/*
  Two economies, two goods, labour only — the closed-form route.

  An economy is { tools, grain }: what one worker makes in a day on one good.
  A price p is always sacks of grain per tool. `a` is the economy with the lower
  opportunity cost of a tool (the tool exporter) and `b` the other one; `k` is
  b's workforce divided by a's, and `share` is the fraction of income everyone
  spends on tools (Cobb–Douglas preferences, identical everywhere).

  verify/check-numbers.mjs checks every function here against src/market.js,
  which solves the same economy through its labour market and shares no code
  with this file.
*/

export const oppCost = (c) => c.grain / c.tools; // sacks given up per tool

// What a worker consumes without trade: `share` of the day on tools.
export function autarkyBasket(c, share = 0.5) {
  return { tools: share * c.tools, grain: (1 - share) * c.grain };
}

/*
  The deal in the opening question: a sells tools, b sells grain, at a price the
  reader picks. a accepts at p >= oppCost(a) and b at p <= oppCost(b); an
  economy that accepts gains (p / pa)^(1 - share) or (pb / p)^share.
  Written as powers of a ratio so that the edge of the range gives exactly 1.
*/
export function deal(a, b, p, share = 0.5) {
  const pa = oppCost(a), pb = oppCost(b);
  const okA = p >= pa, okB = p <= pb;
  return {
    pa,
    pb,
    accepted: okA && okB,
    okA,
    okB,
    gainA: okA ? Math.pow(p / pa, 1 - share) : null,
    gainB: okB ? Math.pow(pb / p, share) : null,
  };
}

/*
  The market. Suppose both specialise; then a makes a.tools per worker, b makes
  b.grain per worker, and spending shares clear the market at

      p* = (share / (1 - share)) · (k · b.grain) / a.tools

  (b's grain capacity over a's tool capacity, per a-worker). If that lands
  below a's own opportunity cost, a cannot stop making grain and the price
  sticks at pa; above b's, b keeps making tools and it sticks at pb.
*/
export function market(a, b, k, share = 0.5) {
  const pa = oppCost(a), pb = oppCost(b);
  if (!(pa < pb)) throw new Error("a must have the comparative advantage in tools");
  // Grouped so that the article's numbers (share 1/2, 9 sacks against 9 tools)
  // give the size ratio itself, to the last bit.
  const pStar = (share / (1 - share)) * k * (b.grain / a.tools);
  let p, regime;
  if (pStar <= pa) { p = pa; regime = "a makes both"; }
  else if (pStar >= pb) { p = pb; regime = "b makes both"; }
  else { p = pStar; regime = "both specialise"; }

  const gainA = Math.pow(p / pa, 1 - share);
  const gainB = Math.pow(pb / p, share);

  // Income per worker, in sacks. a's workers always make some tools and b's
  // always make some grain, so these hold in every regime.
  const incomeA = a.tools * p;
  const incomeB = b.grain;
  const basketA = { tools: (share * incomeA) / p, grain: (1 - share) * incomeA };
  const basketB = { tools: (share * incomeB) / p, grain: (1 - share) * incomeB };

  // Relative wage: a tool costs wa / a.tools and a sack costs wb / b.grain.
  const wageRatio = (p * a.tools) / b.grain;

  // Production, per a-worker (multiply by a's workforce for totals).
  let aFarm = 0, bTools = 0;
  if (regime === "a makes both") {
    const worldIncome = incomeA + k * incomeB;
    const grainWanted = (1 - share) * worldIncome;
    aFarm = (grainWanted - k * b.grain) / a.grain; // share of a's workers on grain
  } else if (regime === "b makes both") {
    const worldIncome = incomeA + k * incomeB;
    const toolsWanted = (share * worldIncome) / p;
    bTools = (toolsWanted - a.tools) / b.tools; // b-workers on tools, per a-worker
  }
  const production = {
    tools: (1 - aFarm) * a.tools + bTools * b.tools,
    grain: aFarm * a.grain + (k - bTools) * b.grain,
  };
  const autA = autarkyBasket(a, share), autB = autarkyBasket(b, share);
  const autarkyProduction = {
    tools: autA.tools + k * autB.tools,
    grain: autA.grain + k * autB.grain,
  };

  return {
    p, pStar, pa, pb, regime,
    gainA, gainB,
    incomeA, incomeB, basketA, basketB,
    wageRatio,
    aFarm, bToolsPerA: bTools,
    production, autarkyProduction,
  };
}

/*
  Either direction. `market` needs the tool exporter first; the catch-up
  section moves the Coast's productivity past the point where the two swap
  roles, so this works out who exports what and reports the gains by name.
  Equal opportunity costs mean nothing to trade, so both gains are exactly 1.
*/
export function gainsFor(valley, coast, k, share = 0.5) {
  const pv = oppCost(valley), pc = oppCost(coast);
  if (pv === pc) return { valley: 1, coast: 1, p: pv, exporter: "nobody", regime: "no trade" };
  if (pv < pc) {
    const m = market(valley, coast, k, share);
    return { valley: m.gainA, coast: m.gainB, p: m.p, exporter: "valley", regime: m.regime };
  }
  // The Coast now sells tools: its workforce is the base and the Valley's is 1/k of it.
  const m = market(coast, valley, 1 / k, share);
  return { valley: m.gainB, coast: m.gainA, p: m.p, exporter: "coast", regime: m.regime };
}

/* The sizes k = b-workers per a-worker between which both specialise. */
export function band(a, b, share = 0.5) {
  const f = ((1 - share) / share) * (a.tools / b.grain);
  return { lo: f * oppCost(a), hi: f * oppCost(b) };
}

/*
  The capacity test. With equal spending shares, a gains exactly when b can
  make more grain than a could, and b gains exactly when a can make more tools
  than b could; `share` weights the comparison otherwise.
*/
export function capacityTest(a, b, k, share = 0.5) {
  const aTools = a.tools, bTools = k * b.tools;
  const aGrain = a.grain, bGrain = k * b.grain;
  return {
    aTools, bTools, aGrain, bGrain,
    aGains: share * bGrain > (1 - share) * aGrain,
    bGains: (1 - share) * aTools > share * bTools,
  };
}

/*
  With a general elasticity of substitution sigma between the goods (CES),
  the interior price is (share/(1-share)) · (capacity ratio)^(1/sigma) and the
  band stretches to a factor of (pb/pa)^sigma. Used only by the maths section
  and the checks.
*/
export function priceCES(a, b, k, share, sigma) {
  const pa = oppCost(a), pb = oppCost(b);
  const pStar = (share / (1 - share)) * Math.pow((k * b.grain) / a.tools, 1 / sigma);
  return Math.min(pb, Math.max(pa, pStar));
}

export function bandCES(a, b, share, sigma) {
  const f = a.tools / b.grain;
  const c = (1 - share) / share;
  return { lo: f * Math.pow(c * oppCost(a), sigma), hi: f * Math.pow(c * oppCost(b), sigma) };
}

/*
  Many goods, equal spending shares, two economies. `edgeList[j]` is the
  Valley's productivity edge on good j (Valley output / Coast output). The
  Valley gains nothing when the Coast is at most min(edge) / (N - 1) of its
  size, and the Coast gains nothing from max(edge) · (N - 1) up. With two goods
  this is band() again. src/market.js checks it by solving the labour market.
*/
export function manyGoodsBand(edgeList) {
  const n = edgeList.length;
  return {
    lo: Math.min(...edgeList) / (n - 1),
    hi: Math.max(...edgeList) * (n - 1),
  };
}
