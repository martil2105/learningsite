/*
  Re-derives every number the page states, from the same modules the page
  imports, with no build step.

  The article's argument is that "both sides gain from trade" depends on a
  price nobody chooses, and that relative size picks it. Almost every claim is
  therefore an identity: an exact price, an exact zero, an exact product. Those
  are asserted with === where the arithmetic is exact (integer ratios, a power
  of exactly 1), and with a stated tolerance where a value has been through a
  square root or a bisection. Each tolerance says which of the two it is.

  Two routes to every equilibrium, sharing no code:
    src/trade.js   the two-good answer written down in closed form
    src/market.js  any number of goods, solved by bisecting the labour market
*/
import { VALLEY, COAST, SHARE_TOOLS, VALLEY_WORKERS, edges, CATCHUP_SIZE } from "../src/datasets.js";
import {
  oppCost, autarkyBasket, deal, market, band, capacityTest,
  priceCES, bandCES, manyGoodsBand, gainsFor,
} from "../src/trade.js";
import { solve, solveTwoGood, solveEdges } from "../src/market.js";
import { mulberry32 } from "../src/rng.js";
import { linear, log } from "../src/chart.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300);
const pct = (g) => (g - 1) * 100;
const logSweep = (lo, hi, n) =>
  Array.from({ length: n + 1 }, (_, i) => Math.exp(Math.log(lo) + (i / n) * (Math.log(hi) - Math.log(lo))));
const V = VALLEY, C = COAST;

// ------------------------------------------------------------ the economy
{
  ok("the Valley is better at both goods", V.tools > C.tools && V.grain > C.grain);
  ok("a Valley worker gives up exactly 2 sacks for a tool", oppCost(V) === 2);
  ok("a Coast worker gives up exactly 4.5 sacks for a tool", oppCost(C) === 4.5);
  ok("so the Valley has the comparative advantage in tools", oppCost(V) < oppCost(C));
  ok("and a sack costs the Valley half a tool and the Coast two-ninths of one",
     1 / oppCost(V) === 0.5 && Math.abs(1 / oppCost(C) - 2 / 9) < 1e-16);
  ok("the Valley's edge is 2× in grain and 4.5× in tools",
     V.grain / C.grain === 2 && V.tools / C.tools === 4.5);
  ok("half of spending goes on each good", SHARE_TOOLS === 0.5);
  const a = autarkyBasket(V), c = autarkyBasket(C);
  ok("without trade a Valley worker has 4.5 tools and 9 sacks", a.tools === 4.5 && a.grain === 9);
  ok("without trade a Coast worker has 1 tool and 4.5 sacks", c.tools === 1 && c.grain === 4.5);
  ok("the many-goods edges start at the article's own two goods",
     edges(2)[0] === 2 && edges(2)[1] === 4.5 && edges(10)[9] === 4.5 && edges(10)[0] === 2);
}

// ------------------------------------------- two routes, one equilibrium
// Price and both gains, closed form against the labour market, over sizes
// from a hundredth to a hundred. The tolerance is the bisection's.
{
  let worst = 0;
  for (const k of logSweep(0.01, 100, 2000)) {
    const m = market(V, C, k), s = solveTwoGood(V, C, k);
    worst = Math.max(worst, rel(m.p, s.p), rel(m.gainA, s.gainValley), rel(m.gainB, s.gainCoast), rel(m.wageRatio, s.w));
  }
  ok("closed form and labour market agree on the article's economy at every size", worst < 1e-12,
     `worst relative gap ${worst.toExponential(2)}`);

  const rnd = mulberry32(20260916);
  const lu = (a, b) => Math.exp(Math.log(a) + rnd() * (Math.log(b) - Math.log(a)));
  let worstR = 0, n = 0;
  for (let t = 0; t < 20000; t++) {
    let a = { tools: lu(0.2, 20), grain: lu(0.2, 20) };
    let b = { tools: lu(0.2, 20), grain: lu(0.2, 20) };
    if (oppCost(a) === oppCost(b)) continue;
    if (oppCost(a) > oppCost(b)) [a, b] = [b, a];
    const k = lu(0.05, 20), share = 0.1 + 0.8 * rnd();
    const m = market(a, b, k, share), s = solveTwoGood(a, b, k, share);
    worstR = Math.max(worstR, rel(m.p, s.p), rel(m.gainA, s.gainValley), rel(m.gainB, s.gainCoast));
    n++;
  }
  ok("and on 20,000 random economies with random spending shares", worstR < 1e-12 && n > 19000,
     `${n} economies, worst ${worstR.toExponential(2)}`);

  let worstCES = 0;
  for (const sigma of [0.5, 2, 3]) {
    for (const k of logSweep(0.05, 60, 400)) {
      const p = priceCES(V, C, k, 0.5, sigma), s = solveTwoGood(V, C, k, 0.5, sigma);
      worstCES = Math.max(worstCES, rel(p, s.p));
    }
  }
  ok("with substitutable or complementary goods the CES closed form matches the solver", worstCES < 1e-12,
     `worst ${worstCES.toExponential(2)}`);
}

// ----------------------------- claim 1: comparative advantage sets the pattern
{
  let wrong = 0, twoShared = 0, cases = 0;
  for (const share of [0.2, 0.35, 0.5, 0.65, 0.8]) {
    for (const k of logSweep(0.01, 100, 400)) {
      const s = solveTwoGood(V, C, k, share);
      cases++;
      if (s.maker[0] === "coast" || s.maker[1] === "valley") wrong++;
      if (s.maker[0] === "both" && s.maker[1] === "both") twoShared++;
    }
  }
  ok("tools are never made only on the Coast, and grain never only in the Valley", wrong === 0,
     `${wrong} of ${cases}`);
  ok("and at most one good is ever made in both places", twoShared === 0);
}

// ---------------------------------------- claim 2: the price-between test
{
  const at2 = deal(V, C, 2), at45 = deal(V, C, 4.5), at3 = deal(V, C, 3);
  ok("at 2 sacks per tool the Valley gains exactly nothing", at2.accepted && at2.gainA === 1);
  ok("and the Coast gains exactly 50%", at2.gainB === 1.5);
  ok("at 4.5 it is the other way round", at45.accepted && at45.gainB === 1 && at45.gainA === 1.5);
  ok("at 3 both gain the same 22.5%",
     at3.gainA === at3.gainB && pct(at3.gainA).toFixed(1) === "22.5" && Math.abs(at3.gainA - Math.sqrt(1.5)) < 1e-15);
  let inside = 0, bothGain = 0, outside = 0, refused = 0;
  for (let i = 20; i <= 120; i++) {
    const p = i / 20; // the slider's 0.05 grid from 1 to 6
    const d = deal(V, C, p);
    if (p > 2 && p < 4.5) { inside++; if (d.accepted && d.gainA > 1 && d.gainB > 1) bothGain++; }
    if (p < 2 || p > 4.5) { outside++; if (!d.accepted) refused++; }
  }
  ok("every price strictly between 2 and 4.5 leaves both better off", bothGain === inside && inside === 49,
     `${bothGain} of ${inside}`);
  ok("and at every price outside that range one side refuses the deal", refused === outside && outside === 50,
     `${refused} of ${outside}`);
}

// ----------------- claim 3: the market picks the price, and size picks it
{
  const m = market(V, C, 1);
  ok("with equal workforces the market price is exactly 2 sacks per tool", m.p === 2);
  ok("because the Valley keeps making grain", m.regime === "a makes both");
  ok("so the Valley's gain is exactly zero", m.gainA === 1, `${m.gainA}`);
  ok("and the Coast's is exactly 50%", m.gainB === 1.5, `${m.gainB}`);
  const aut = autarkyBasket(V);
  ok("a Valley worker's basket is exactly what it was without trade",
     m.basketA.tools === aut.tools && m.basketA.grain === aut.grain);
  ok("a Coast worker goes from 1 tool to 2.25, with 4.5 sacks either way",
     m.basketB.tools === 2.25 && m.basketB.grain === 4.5);
  const cap = capacityTest(V, C, 1);
  ok("the capacity test says the Coast cannot out-farm the Valley (9 against 18 sacks a worker)",
     cap.bGrain === 9 && cap.aGrain === 18 && !cap.aGains && cap.bGains);

  // The theorem behind it, on random pairs: equal workforces, equal shares,
  // one economy better at both goods -> that economy gains exactly nothing.
  const rnd = mulberry32(1776);
  const lu = (a, b) => Math.exp(Math.log(a) + rnd() * (Math.log(b) - Math.log(a)));
  let pairs = 0, zero = 0, otherGains = 0, agree = 0;
  while (pairs < 100000) {
    let a = { tools: lu(0.2, 20), grain: lu(0.2, 20) };
    let b = { tools: lu(0.2, 20), grain: lu(0.2, 20) };
    const aBetter = a.tools > b.tools && a.grain > b.grain;
    const bBetter = b.tools > a.tools && b.grain > a.grain;
    if (!aBetter && !bBetter) continue;
    if (oppCost(a) === oppCost(b)) continue;
    let better = aBetter ? "a" : "b";
    if (oppCost(a) > oppCost(b)) { [a, b] = [b, a]; better = better === "a" ? "b" : "a"; }
    const m1 = market(a, b, 1);
    const gBetter = better === "a" ? m1.gainA : m1.gainB;
    const gOther = better === "a" ? m1.gainB : m1.gainA;
    pairs++;
    if (gBetter === 1) zero++;
    if (gOther > 1) otherGains++;
    const s1 = solveTwoGood(a, b, 1);
    const sBetter = better === "a" ? s1.gainValley : s1.gainCoast;
    if (Math.abs(sBetter - 1) < 1e-12) agree++;
  }
  ok("in 100,000 random equal-sized pairs the economy better at both gains exactly nothing, every time",
     zero === 100000, `${zero} of ${pairs}`);
  ok("while its partner gains something, every time", otherGains === 100000, `${otherGains}`);
  ok("and the labour-market solver agrees on all of them", agree === 100000, `${agree}`);

  // The capacity test is the whole criterion (equal shares), sizes unequal.
  let tested = 0, same = 0;
  const rnd2 = mulberry32(1817);
  const lu2 = (a, b) => Math.exp(Math.log(a) + rnd2() * (Math.log(b) - Math.log(a)));
  while (tested < 100000) {
    let a = { tools: lu2(0.2, 20), grain: lu2(0.2, 20) };
    let b = { tools: lu2(0.2, 20), grain: lu2(0.2, 20) };
    if (oppCost(a) === oppCost(b)) continue;
    if (oppCost(a) > oppCost(b)) [a, b] = [b, a];
    const k = lu2(0.01, 100);
    const m2 = market(a, b, k), t = capacityTest(a, b, k);
    tested++;
    if ((m2.gainA > 1) === t.aGains && (m2.gainB > 1) === t.bGains) same++;
  }
  ok("in 100,000 random pairs of any sizes, 'each is the bigger producer of what it sells' decides who gains",
     same === 100000, `${same} of ${tested}`);
}

// ------------------------- claim 4: complete specialisation, and world output
{
  const m1 = market(V, C, 1);
  ok("at equal size a quarter of the Valley's workers keep farming (250 of 1,000)",
     m1.aFarm === 0.25 && m1.aFarm * VALLEY_WORKERS === 250);
  ok("world grain output is exactly what it was without trade: 13,500 sacks",
     m1.production.grain === m1.autarkyProduction.grain && m1.production.grain * VALLEY_WORKERS === 13500);
  ok("world tool output rises from 5,500 to 6,750",
     m1.autarkyProduction.tools * VALLEY_WORKERS === 5500 && m1.production.tools * VALLEY_WORKERS === 6750);
  const coastExtra = 1 * (m1.basketB.tools - autarkyBasket(C).tools);
  ok("and every one of the 1,250 extra tools ends up on the Coast",
     m1.production.tools - m1.autarkyProduction.tools === coastExtra && coastExtra * VALLEY_WORKERS === 1250);

  const m3 = market(V, C, 3);
  ok("with the Coast three times the size, both economies specialise completely",
     m3.regime === "both specialise" && m3.aFarm === 0 && m3.bToolsPerA === 0);
  ok("and world output of both goods is up by exactly 20%",
     m3.production.tools / m3.autarkyProduction.tools === 1.2 && m3.production.grain / m3.autarkyProduction.grain === 1.2);

  let wrong = 0, cases = 0, unchangedOutside = 0, outside = 0;
  for (const k of logSweep(0.05, 40, 1200)) {
    const m = market(V, C, k);
    const up = m.production.tools > m.autarkyProduction.tools * (1 + 1e-12) &&
               m.production.grain > m.autarkyProduction.grain * (1 + 1e-12);
    const inBand = k > 2 && k < 4.5;
    cases++;
    if (up !== inBand) wrong++;
    if (k < 2 || k > 4.5) {
      outside++;
      const same = k < 2
        ? Math.abs(m.production.grain - m.autarkyProduction.grain) <= 1e-13 * m.production.grain
        : Math.abs(m.production.tools - m.autarkyProduction.tools) <= 1e-13 * m.production.tools;
      if (same) unchangedOutside++;
    }
  }
  ok("the world makes more of both goods exactly when the Coast is between 2 and 4.5 times the Valley's size",
     wrong === 0, `${wrong} of ${cases}`);
  ok("and outside that range, the small economy's export is made in exactly the old quantity",
     unchangedOutside === outside, `${unchangedOutside} of ${outside} (to rounding)`);
}

// -------------------------------------------------- claim 5: the band
{
  const b = band(V, C);
  ok("both specialise exactly when the Coast has between 2 and 4.5 workers per Valley worker",
     b.lo === 2 && b.hi === 4.5);
  ok("so the band spans a factor of 2.25, the ratio of the two opportunity costs",
     b.hi / b.lo === 2.25 && oppCost(C) / oppCost(V) === 2.25);
  let wrongRegime = 0, wrongPrice = 0, n = 0;
  for (const k of logSweep(0.01, 100, 3000)) {
    const m = market(V, C, k);
    n++;
    const want = k <= 2 ? "a makes both" : k >= 4.5 ? "b makes both" : "both specialise";
    if (m.regime !== want) wrongRegime++;
    if (m.p !== Math.min(4.5, Math.max(2, k))) wrongPrice++; // exact: the price IS the size ratio
  }
  ok("the regime switches exactly at 2 and 4.5", wrongRegime === 0, `${wrongRegime} of ${n}`);
  ok("inside the band the price equals the size ratio, and outside it sticks at 2 or 4.5", wrongPrice === 0,
     `${wrongPrice} of ${n}`);

  // numeric edges on the independent solver
  const both = (k) => { const s = solveTwoGood(V, C, k); return s.gainValley > 1 + 1e-12 && s.gainCoast > 1 + 1e-12; };
  const edge = (inside, outsideK) => {
    let a = inside, c = outsideK;
    for (let i = 0; i < 200; i++) { const m = Math.sqrt(a * c); if (both(m)) a = m; else c = m; }
    return Math.sqrt(a * c);
  };
  const lo = edge(3, 0.5), hi = edge(3, 20);
  ok("bisecting the labour-market solver finds the same two edges", rel(lo, 2) < 1e-9 && rel(hi, 4.5) < 1e-9,
     `${lo}, ${hi}`);

  for (const sigma of [0.5, 2, 3]) {
    const bc = bandCES(V, C, 0.5, sigma);
    const bothS = (k) => { const s = solveTwoGood(V, C, k, 0.5, sigma); return s.gainValley > 1 + 1e-10 && s.gainCoast > 1 + 1e-10; };
    const mid = Math.sqrt(bc.lo * bc.hi);
    const edgeS = (inside, outsideK) => {
      let a = inside, c = outsideK;
      for (let i = 0; i < 200; i++) { const m = Math.sqrt(a * c); if (bothS(m)) a = m; else c = m; }
      return Math.sqrt(a * c);
    };
    const l = edgeS(mid, mid / 100), h = edgeS(mid, mid * 100);
    ok(`with sigma = ${sigma} the band stretches to 2.25^sigma, and the solver's edges agree`,
       rel(bc.hi / bc.lo, Math.pow(2.25, sigma)) < 1e-14 && rel(l, bc.lo) < 1e-6 && rel(h, bc.hi) < 1e-6,
       `ratio ${bc.hi / bc.lo}, edges ${l} ${h} vs ${bc.lo} ${bc.hi}`);
  }
}

// ------------------------------------------- claim 6: a fixed pie, split by size
{
  let worst = 0, worstS = 0, keepsOwn = 0, n = 0;
  for (const k of logSweep(0.01, 100, 3000)) {
    const m = market(V, C, k), s = solveTwoGood(V, C, k);
    worst = Math.max(worst, Math.abs(m.gainA * m.gainB - 1.5));
    worstS = Math.max(worstS, Math.abs(s.gainValley * s.gainCoast - 1.5));
    n++;
    if (Math.abs(m.basketA.tools - 4.5) < 1e-13 && m.basketB.grain === 4.5) keepsOwn++;
  }
  ok("the two gain factors multiply to 1.5 at every size, inside the band and outside it", worst < 1e-15,
     `worst ${worst.toExponential(2)}`);
  ok("the labour-market route gives the same product", worstS < 1e-12, `worst ${worstS.toExponential(2)}`);
  ok("each economy consumes exactly as much of its own export as it did without trade", keepsOwn === n);
  ok("so neither can ever gain more than 50%", Math.sqrt(2.25) === 1.5);
  let inside = 0, formula = 0;
  for (const k of logSweep(2.0001, 4.4999, 500)) {
    const m = market(V, C, k);
    inside++;
    if (Math.abs(m.gainA - Math.sqrt(k / 2)) < 1e-15 && Math.abs(m.gainB - Math.sqrt(4.5 / k)) < 1e-15) formula++;
  }
  ok("inside the band the gains are √(k/2) and √(4.5/k)", formula === inside);
  const e27 = market(V, C, 2.7);
  ok("at 2.7 the split is 16.2% and 29.1%, and 1.162 × 1.291 prints as 1.500",
     pct(e27.gainA).toFixed(1) === "16.2" && pct(e27.gainB).toFixed(1) === "29.1" &&
     (e27.gainA * e27.gainB).toFixed(3) === "1.500");
}

// ----------------------------------------------------- claim 7: wages
{
  let exact = 0, n = 0, inRange = 0;
  for (const k of logSweep(0.01, 100, 2000)) {
    const m = market(V, C, k), s = solveTwoGood(V, C, k);
    n++;
    const want = Math.min(4.5, Math.max(2, k));
    if (Math.abs(m.wageRatio - want) < 1e-15 * want && rel(s.w, want) < 1e-12) exact++;
    if (m.wageRatio >= V.grain / C.grain && m.wageRatio <= V.tools / C.tools) inRange++;
  }
  ok("a Valley wage is worth between 2 and 4.5 Coast wages, and inside the band exactly k of them", exact === n,
     `${exact} of ${n}`);
  ok("which is between the Valley's edge in grain and its edge in tools", inRange === n);
  ok("at equal size the Valley's wage is exactly twice the Coast's", market(V, C, 1).wageRatio === 2);
}

// --------------------------------------- claim 8: when the Coast catches up
{
  const k = CATCHUP_SIZE;
  ok("the catch-up section starts inside the band", market(V, C, k).regime === "both specialise");
  const flat = gainsFor(V, C, k).valley;
  ok("where the Valley gains 22.5%", pct(flat).toFixed(1) === "22.5");

  // tools, 2 -> 9 a day, on a 0.01 grid
  let stayFlat = true, falls = true, rises = true, agree = 0, n = 0, coastZero = true;
  let prev = null;
  for (let i = 200; i <= 900; i++) {
    const t = i / 100;
    const coast = { ...C, tools: t };
    const g = gainsFor(V, coast, k);
    const s = solveTwoGood(V, coast, k);
    n++;
    if (Math.abs(g.valley - s.gainValley) < 1e-12 && Math.abs(g.coast - s.gainCoast) < 1e-12) agree++;
    if (t <= 3 && g.valley !== flat) stayFlat = false;
    if (t > 3 && t <= 4.5 && prev !== null && !(g.valley < prev)) falls = false;
    if (t >= 3 && t <= 4.5 && g.coast !== 1) coastZero = false;
    if (t > 4.5 && prev !== null && !(g.valley > prev)) rises = false;
    prev = g.valley;
  }
  ok("as the Coast gets better at tools, the Valley's gain does not move by one digit until 3 tools a day", stayFlat);
  ok("3 tools a day is where the Coast's tool capacity reaches the Valley's", 3 * k === V.tools);
  ok("then it falls, all the way to parity", falls);
  ok("while the Coast, now making both goods, gains exactly nothing from trade", coastZero);
  const parity = gainsFor(V, { ...C, tools: 4.5 }, k);
  ok("at 4.5 tools a day the opportunity costs match and the Valley's gain is exactly zero",
     parity.valley === 1 && parity.exporter === "nobody" && oppCost({ ...C, tools: 4.5 }) === 2);
  ok("past parity the trade runs the other way and the Valley gains again", rises);
  const nine = gainsFor(V, { ...C, tools: 9 }, k);
  ok("at 9 tools a day the Valley gains 41.4%, importing tools", nine.exporter === "coast" &&
     Math.abs(nine.valley - Math.SQRT2) < 1e-15 && pct(nine.valley).toFixed(1) === "41.4");
  ok("both routes agree along the whole sweep", agree === n, `${agree} of ${n}`);

  // grain, 9 -> 18 a day
  let up = true, prevG = null, agreeG = 0, nG = 0;
  for (let i = 900; i <= 1800; i++) {
    const g = i / 100;
    const coast = { ...C, grain: g };
    const r = gainsFor(V, coast, k), s = solveTwoGood(V, coast, k);
    nG++;
    if (Math.abs(r.valley - s.gainValley) < 1e-12) agreeG++;
    if (prevG !== null && !(r.valley > prevG)) up = false;
    prevG = r.valley;
  }
  ok("if the Coast gets better at grain instead, the Valley's gain rises the whole way", up);
  const g18 = gainsFor(V, { ...C, grain: 18 }, k);
  ok("reaching 73.2% when the Coast's grain doubles", Math.abs(g18.valley - Math.sqrt(3)) < 1e-15 &&
     pct(g18.valley).toFixed(1) === "73.2");
  ok("and the solver agrees there too", agreeG === nG);
}

// --------------------------------------------- claim 9: more goods
{
  const bands = [2, 3, 5, 10].map((N) => manyGoodsBand(edges(N)));
  ok("with 2 goods the band is 2 to 4.5", bands[0].lo === 2 && bands[0].hi === 4.5);
  ok("with 3 goods it is 1 to 9", bands[1].lo === 1 && bands[1].hi === 9);
  ok("with 5 goods it is 0.5 to 18", bands[2].lo === 0.5 && bands[2].hi === 18);
  ok("with 10 goods it is 2/9 to 40.5, i.e. 222 Coast workers per 1,000 up to 40,500",
     Math.abs(bands[3].lo - 2 / 9) < 1e-16 && bands[3].hi === 40.5 &&
     Math.floor(bands[3].lo * VALLEY_WORKERS) === 222 && bands[3].hi * VALLEY_WORKERS === 40500);

  // the closed form against the solver, random edges, N = 2..12
  const rnd = mulberry32(1977);
  const lu = (a, b) => Math.exp(Math.log(a) + rnd() * (Math.log(b) - Math.log(a)));
  let checked = 0, bad = 0, strict = 0, insideN = 0;
  for (let t = 0; t < 4000; t++) {
    const N = 2 + (t % 11);
    const ed = Array.from({ length: N }, () => lu(0.3, 10));
    const bd = manyGoodsBand(ed);
    for (const f of [0.3, 0.9, 0.999, 1.001, 1.1, 3]) {
      for (const edgeK of [bd.lo, bd.hi]) {
        const k = edgeK * f;
        const r = solveEdges(ed, k);
        const vZero = Math.abs(r.gainValley - 1) < 1e-12, cZero = Math.abs(r.gainCoast - 1) < 1e-12;
        checked++;
        if (vZero !== (k <= bd.lo) || cZero !== (k >= bd.hi)) bad++;
        if (k > bd.lo && k < bd.hi) { insideN++; if (r.gainValley > 1 + 1e-9 && r.gainCoast > 1 + 1e-9) strict++; }
      }
    }
  }
  ok("48,000 random many-good economies put the zero-gain edges exactly where the formula says",
     checked === 48000 && bad === 0, `${bad} of ${checked}`);
  ok("and strictly between them both economies gain", strict === insideN, `${strict} of ${insideN}`);

  const ten = solveEdges(edges(10), 1);
  ok("with ten goods and equal workforces the Valley gains 2.7% and the Coast 28.7%",
     pct(ten.gainValley).toFixed(1) === "2.7" && pct(ten.gainCoast).toFixed(1) === "28.7");
  const three = solveEdges(edges(3), 1);
  ok("with three goods equal size sits exactly on the Valley's edge", Math.abs(three.gainValley - 1) < 1e-12);
  const four = solveEdges(edges(4), 1);
  ok("with four it is already inside, and the Valley gains something", four.gainValley > 1 + 1e-6);
  const prod10 = solveEdges(edges(10), 3);
  ok("with ten goods the pie is no longer fixed: at 3× the product is 1.25, not 1.5",
     (prod10.gainValley * prod10.gainCoast).toFixed(2) === "1.25");
  let maxProd = 0;
  for (const k of logSweep(0.01, 100, 600)) { const r = solveEdges(edges(10), k); maxProd = Math.max(maxProd, r.gainValley * r.gainCoast); }
  ok("and it only reaches 1.5 when one side takes it all", Math.abs(maxProd - 1.5) < 1e-12);

  // the two-good case of the general solver is the article's economy
  let worst = 0;
  for (const k of logSweep(0.05, 20, 300)) {
    const r = solveEdges(edges(2), k), m = market(V, C, k);
    worst = Math.max(worst, rel(r.gainValley, m.gainA), rel(r.gainCoast, m.gainB));
  }
  ok("the many-goods solver with two goods reproduces the article's gains", worst < 1e-12, worst.toExponential(2));
}

// ---------------------------------------- sentences the prose leans on
{
  // "the Coast gains 50%, which is the most it could gain at any price in the range"
  let best = 0, bestP = null;
  for (let i = 40; i <= 90; i++) { const d = deal(V, C, i / 20); if (d.gainB > best) { best = d.gainB; bestP = i / 20; } }
  ok("50% is the most the Coast can gain at any price in the range, and it comes at 2", best === 1.5 && bestP === 2);

  // "at any price above 2 ... buyers want a good deal more grain than the Coast's 9,000 sacks"
  let short = true;
  for (let i = 1; i <= 250; i++) {
    const p = 2 + i / 100; // prices above 2, with the Valley making only tools
    const worldIncome = VALLEY_WORKERS * (V.tools * p) + VALLEY_WORKERS * C.grain; // in sacks
    const grainWanted = (1 - SHARE_TOOLS) * worldIncome;
    if (!(grainWanted >= 13500 && grainWanted > 1.4 * VALLEY_WORKERS * C.grain)) short = false;
  }
  ok("above 2 sacks per tool, buyers want at least 13,500 sacks, half again the Coast's 9,000", short);

  // capacities with 1,000 workers each
  const cap = capacityTest(V, C, 1);
  ok("with 1,000 workers each: 9,000 tools against 2,000, and 9,000 sacks against 18,000",
     cap.aTools * VALLEY_WORKERS === 9000 && cap.bTools * VALLEY_WORKERS === 2000 &&
     cap.bGrain * VALLEY_WORKERS === 9000 && cap.aGrain * VALLEY_WORKERS === 18000);
  const justOver2 = capacityTest(V, C, 2.0001), justUnder2 = capacityTest(V, C, 1.9999);
  const justOver45 = capacityTest(V, C, 4.5001), justUnder45 = capacityTest(V, C, 4.4999);
  ok("past twice the Valley's size the Coast becomes the bigger grain grower", justOver2.aGains && !justUnder2.aGains);
  ok("past four and a half times the Valley stops being the bigger tool maker", !justOver45.bGains && justUnder45.bGains);

  // "if their opportunity costs differed by 10%, the window would be only 10% wide"
  const rnd = mulberry32(42);
  let sameRatio = 0;
  for (let t = 0; t < 10000; t++) {
    let a = { tools: 0.2 + 20 * rnd(), grain: 0.2 + 20 * rnd() };
    let b = { tools: 0.2 + 20 * rnd(), grain: 0.2 + 20 * rnd() };
    if (oppCost(a) > oppCost(b)) [a, b] = [b, a];
    const bd = band(a, b);
    if (rel(bd.hi / bd.lo, oppCost(b) / oppCost(a)) < 1e-14) sameRatio++;
  }
  ok("for any two economies the band is exactly as wide as the ratio of their opportunity costs", sameRatio === 10000,
     `${sameRatio} of 10000`);
  const tenPct = band({ tools: 1, grain: 2 }, { tools: 1, grain: 2.2 });
  ok("so opportunity costs 10% apart give a band 10% wide", rel(tenPct.hi / tenPct.lo, 1.1) < 1e-15);

  // "1.162 × 1.291 comes to 1.500" — the printed factors, multiplied as printed
  ok("the rounded factors at 2.7 multiply to 1.500 as printed", (1.162 * 1.291).toFixed(3) === "1.500");

  // "it doesn't leave anybody worse off"
  let worst = Infinity;
  for (const k of logSweep(0.01, 100, 2000)) { const m = market(V, C, k); worst = Math.min(worst, m.gainA, m.gainB); }
  ok("no size ever leaves either economy worse off than without trade", worst >= 1);

  // world output at six times the size (the WorldFrontier readout)
  const m6 = market(V, C, 6);
  ok("at six times the size production is on the Coast's piece", m6.regime === "b makes both" && m6.p === 4.5);
  ok("and the world makes the same 10,500 tools, and 47,250 sacks instead of 36,000",
     Math.round(m6.production.tools * VALLEY_WORKERS) === 10500 &&
     Math.round(m6.autarkyProduction.tools * VALLEY_WORKERS) === 10500 &&
     Math.round(m6.production.grain * VALLEY_WORKERS) === 47250 &&
     Math.round(m6.autarkyProduction.grain * VALLEY_WORKERS) === 36000);
  const extraGrain = m6.production.grain - m6.autarkyProduction.grain;
  const valleyExtra = m6.basketA.grain - autarkyBasket(V).grain;
  const coastExtra6 = m6.basketB.grain - autarkyBasket(C).grain;
  ok("at six times the size every one of the 11,250 extra sacks ends up in the Valley ('the other way round')",
     Math.round(extraGrain * VALLEY_WORKERS) === 11250 && Math.abs(extraGrain - valleyExtra) < 1e-12 && coastExtra6 === 0,
     `${extraGrain} vs ${valleyExtra}, coast ${coastExtra6}`);
  const m8 = market(V, C, 8);
  ok("at eight times the size 22% of Coast workers stay in the workshops", Math.round((m8.bToolsPerA / 8) * 100) === 22,
     `${(m8.bToolsPerA / 8) * 100}`);

  // "as an economy shrinks relative to its partner ... its share of the gain grows"
  // — monotone in size, with two goods and with ten.
  let mono2 = true, mono10 = true, prev2 = null, prev10 = null;
  for (const k of logSweep(0.02, 80, 600)) {
    const m = market(V, C, k);
    if (prev2 && (m.gainA < prev2.a - 1e-15 || m.gainB > prev2.b + 1e-15)) mono2 = false;
    prev2 = { a: m.gainA, b: m.gainB };
    const r = solveEdges(edges(10), k);
    if (prev10 && (r.gainValley < prev10.a - 1e-12 || r.gainCoast > prev10.b + 1e-12)) mono10 = false;
    prev10 = { a: r.gainValley, b: r.gainCoast };
  }
  ok("with two goods, the Valley's gain never falls and the Coast's never rises as the Coast grows", mono2);
  ok("and the same holds with ten goods", mono10);
  ok("a 22.5% gain is written as a factor of 1.225", Math.sqrt(1.5).toFixed(3) === "1.225");

  // the Coast's side of the catch-up
  let steady = true;
  for (let i = 200; i <= 300; i++) {
    const t = i / 100;
    const mm = market(V, { ...C, tools: t }, CATCHUP_SIZE);
    if (!(mm.basketB.tools === 1.5 && mm.basketB.grain === 4.5)) steady = false;
  }
  ok("a Coast worker's basket stays at 1.5 tools and 4.5 sacks while its tool productivity goes from 2 to 3", steady);
  ok("while its gain from trade falls from 22.5% to exactly zero",
     pct(gainsFor(V, C, CATCHUP_SIZE).coast).toFixed(1) === "22.5" &&
     gainsFor(V, { ...C, tools: 3 }, CATCHUP_SIZE).coast === 1);

  // ten goods: the pie is below 1.5 whenever both gain, and about 1.25 at 2x and 3x
  const ed10 = edges(10), b10 = manyGoodsBand(ed10);
  let below = true;
  for (const k of logSweep(b10.lo * 1.001, b10.hi / 1.001, 400)) {
    const r = solveEdges(ed10, k);
    if (!(r.gainValley * r.gainCoast < 1.5 - 1e-9)) below = false;
  }
  ok("with ten goods the product is below 1.5 whenever both economies gain", below);
  const r2 = solveEdges(ed10, 2), r3 = solveEdges(ed10, 3);
  ok("and about 1.25 when the Coast has two or three times the workforce",
     (r2.gainValley * r2.gainCoast).toFixed(2) === "1.25" && (r3.gainValley * r3.gainCoast).toFixed(2) === "1.25",
     `${r2.gainValley * r2.gainCoast}, ${r3.gainValley * r3.gainCoast}`);
}

// ------------------------------- the limits section: three economies, three goods
// An assignment of one good to each economy can pass every two-economy
// comparison and still not minimise the product of labour requirements, which is
// the efficiency criterion for this case (Jones 1961).
{
  const rnd = mulberry32(1961);
  const lu = (a, b) => Math.exp(Math.log(a) + rnd() * (Math.log(b) - Math.log(a)));
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const worlds = 100000;
  let trapped = 0;
  for (let t = 0; t < worlds; t++) {
    const a = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => lu(0.5, 5)));
    const logprod = (s) => Math.log(a[0][s[0]]) + Math.log(a[1][s[1]]) + Math.log(a[2][s[2]]);
    const best = Math.min(...perms.map(logprod));
    let trap = false;
    for (const s of perms) {
      let pairwise = true;
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        if (a[i][s[i]] * a[j][s[j]] > a[i][s[j]] * a[j][s[i]]) pairwise = false;
      }
      if (pairwise && logprod(s) > best + 1e-12) trap = true;
    }
    if (trap) trapped++;
  }
  const share = (100 * trapped) / worlds;
  // A Monte Carlo share: its standard error at this sample size is about 0.1
  // points, so the prose rounds it to a whole percent and this checks that.
  ok("in about 12% of random three-by-three worlds some assignment passes every pairwise test and still wastes output",
     Math.round(share) === 12, `${share.toFixed(2)}%`);
}

// ------------------------------------------------------- the chart helpers
{
  const x = log(0.25, 16, 40, 600);
  let worst = 0;
  for (const v of logSweep(0.25, 16, 200)) worst = Math.max(worst, rel(x.invert(x(v)), v));
  ok("the size axis inverts to machine precision", worst < 1e-12, worst.toExponential(2));
  const y = linear(0, 10, 200, 20);
  ok("linear maps the domain ends onto the range ends", y(0) === 200 && y(10) === 20);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
