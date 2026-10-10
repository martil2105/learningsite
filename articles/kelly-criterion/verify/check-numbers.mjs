// Every number the page states, from src/kelly.js, in page order and rounded
// the way the page rounds (toFixed). The closed forms are checked first against
// routes that don't use them: brute force over the binomial, a lattice walk,
// and simulations with their own seeds.
import * as K from "../src/kelly.js";
import { Phi, PhiInv } from "../src/stats.js";
import { normals, mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2), r3 = (x) => +x.toFixed(3);

console.log("-- the tools");
{
  eq("Φ(1.96) is 0.975", Phi(1.959964), 0.975, 1e-6);
  eq("Φ⁻¹ inverts Φ", Phi(PhiInv(0.9)), 0.9, 1e-9);
  let s = 0; const w = K.pmf(300); for (const x of w) s += x;
  eq("the binomial probabilities add to one", s, 1, 1e-12);
  // the lattice walk against a simulation that shares no code with it
  const u = mulberry32(99); let hit = 0; const M = 200000;
  for (let i = 0; i < M; i++) { let lw = Math.log(25), h = false; for (let t = 0; t < 300; t++) { lw += u() < 0.6 ? Math.log(1.2) : Math.log(0.8); if (lw <= Math.log(12.5)) { h = true; break; } } if (h) hit++; }
  truth("the lattice's chance of halving at 20% agrees with 200,000 simulated games", Math.abs(hit / M - K.everTouch(0.2, 12.5)) < 3 * Math.sqrt(0.25 / M), (hit / M).toFixed(4) + " vs " + K.everTouch(0.2, 12.5).toFixed(4));
}

console.log("-- the coin game");
{
  eq("Kelly's share for a 60% coin is 20%", K.KELLY_COIN, 0.2, 1e-12);
  // the growth peak by brute force over a fine grid
  let best = 0, bf = 0; for (let f = 0; f < 1; f += 1e-5) { const g = K.growth(f); if (g > best) { best = g; bf = f; } }
  eq("a grid search over shares finds the peak at 20%", bf, 0.2, 1e-4);
  eq("typical growth at 20% is about 2% a flip", r2(100 * K.growth(0.2)), 2.01, 0);
  eq("the growth is back at zero at 38.9%", r1(100 * K.zeroGrowth()), 38.9, 0);
  truth("which is a little under twice Kelly", K.zeroGrowth() < 0.4 && K.zeroGrowth() > 0.38);
  // the median: the 150th of 301 outcomes by brute force
  for (const f of [0.1, 0.2, 0.3, 0.5]) {
    const w = K.pmf(300), outs = []; for (let k = 0; k <= 300; k++) outs.push([K.wealthAfter(f, k, 300), w[k]]);
    outs.sort((a, b) => a[0] - b[0]); let c = 0, med = 0; for (const [x, p] of outs) { c += p; if (c >= 0.5) { med = x; break; } }
    eq(`the median at ${f * 100}% by sorting every outcome is 25·exp(300 g)`, med, 25 * Math.exp(300 * K.growth(f)), 1e-10);
  }
  eq("the typical Kelly player ends 300 flips with $10,504", r0(K.medianWealth(0.2)), 10504, 0);
  eq("all-in average after 300 flips is about $1.4 × 10²⁵", r1(K.meanWealth(1) / 1e25), 1.4, 0);
  eq("all-in survives only one game in about 3.6 × 10⁶⁶", r1(1 / Math.pow(0.6, 300) / 1e66), 3.6, 0);
  // the mean rises with the share at every share
  let rising = true; for (let f = 0.01; f <= 1; f += 0.01) if (K.meanWealth(f) <= K.meanWealth(f - 0.01)) rising = false;
  truth("the average after 300 flips rises with every extra percent bet", rising);
  eq("a Kelly player is cut to $12.50 at some point in 45% of games", r0(100 * K.everTouch(0.2, 12.5)), 45, 0);
  eq("a half-Kelly player in 10%", r0(100 * K.everTouch(0.1, 12.5)), 10, 0);
  eq("the Kelly player passes $250 in about 94% of games", r0(100 * K.everTouch(0.2, 250, 300, false)), 94, 0);
  eq("and ends behind $25 in 4.4%", r1(100 * K.behind(0.2)), 4.4, 0);
}

console.log("-- the 61 players on screen (seed " + K.PLAYER_SEED + ")");
{
  const P = K.players();
  const at = (f) => {
    const fin = P.map((h) => K.wealthAfter(f, h[300], 300)).sort((a, b) => a - b);
    return { med: fin[30], behind: fin.filter((w) => w < 25).length, halved: P.filter((h) => K.everBelow(h, f, 12.5)).length, cap: P.filter((h) => h.some((k, t) => K.wealthAfter(f, k, t) >= 250)).length, pennies: fin.filter((w) => w < 1).length };
  };
  const a20 = at(0.2), a50 = at(0.5);
  eq("at 20% our middle player ends with $10,504", r0(a20.med), 10504, 0);
  eq("only 3 of the 61 finish behind", a20.behind, 3, 0);
  eq("and 57 of them pass $250 along the way", a20.cap, 57, 0);
  truth("the seeded run is representative: behind within 1 of 61 × 4.4%", Math.abs(a20.behind - 61 * K.behind(0.2)) <= 1, `${a20.behind} vs ${(61 * K.behind(0.2)).toFixed(1)}`);
  truth("halved within 2 of 61 × 45%", Math.abs(a20.halved - 61 * K.everTouch(0.2, 12.5)) <= 2, `${a20.halved} vs ${(61 * K.everTouch(0.2, 12.5)).toFixed(1)}`);
  truth("reached $250 within 2 of 61 × 94%", Math.abs(a20.cap - 61 * K.everTouch(0.2, 250, 300, false)) <= 2, `${a20.cap}`);
  truth("at 50% most of our players end behind", a50.behind > 30, `${a50.behind} of 61`);
  truth("and plenty are left with pennies", a50.pennies >= 20, `${a50.pennies} under $1`);
  eq("in the long run at 50%, 87% end behind", r0(100 * K.behind(0.5)), 87, 0);
}

console.log("-- from coins to stocks");
{
  eq("Kelly's share of our stocks is 154%", r0(100 * K.KELLY), 154, 0);
  truth("which is more than all her money", K.KELLY > 1);
  eq("its growth over cash is SR²/2", K.drift(1), (K.SR * K.SR) / 2, 1e-14);
  eq("twice Kelly grows no faster than cash", K.drift(2), 0, 1e-15);
  // brute force: growth of a continuously rebalanced position f is f m − f² σ²/2
  let best = 0, bf = 0; for (let f = 0; f < 4; f += 1e-4) { const g = f * K.M - (f * f * K.SIGMA * K.SIGMA) / 2; if (g > best) { best = g; bf = f; } }
  eq("a grid search finds the same peak", bf, K.KELLY, 1e-4);
}

console.log("-- how long is the long run");
{
  // the race formula against a direct simulation of two investors in one market
  const g = normals(31); const M = 40000; let aheadA = 0;
  for (let i = 0; i < M; i++) { const B = g() * Math.sqrt(30); const lk = K.drift(1) * 30 + K.vol(1) * B, lh = K.drift(0.5) * 30 + K.vol(0.5) * B; if (lk > lh) aheadA++; }
  truth("40,000 simulated pairs at 30 years agree with the race formula", Math.abs(aheadA / M - K.raceStocks(0.5, 30)) < 3 * Math.sqrt(0.25 / M), (aheadA / M).toFixed(4));
  // and with daily steps of a market whose log return is normal, rebalanced daily
  const g2 = normals(32); let aheadD = 0; const MD = 2000, steps = 30 * 252, dt = 1 / 252;
  for (let i = 0; i < MD; i++) { let wk = 0, wh = 0; for (let s = 0; s < steps; s++) { const r = K.M * dt + K.SIGMA * Math.sqrt(dt) * g2(); wk += Math.log1p(K.KELLY * r); wh += Math.log1p(0.5 * K.KELLY * r); } if (wk > wh) aheadD++; }
  truth("2,000 pairs rebalancing daily agree within sampling error", Math.abs(aheadD / MD - K.raceStocks(0.5, 30)) < 3 * Math.sqrt(0.25 / MD), (aheadD / MD).toFixed(3));
  eq("guess card: the Kelly investor is ahead 65% of the time after 30 years", r0(100 * K.raceStocks(0.5, 30)), 65, 0);
  truth("which is about two thirds", Math.abs(K.raceStocks(0.5, 30) - 2 / 3) < 0.03);
  eq("75% takes 94 years", r0(K.yearsFor(0.75)), 94, 0);
  eq("90% takes 341 years", r0(K.yearsFor(0.9)), 341, 0);
  eq("1/SR² is 13 years", r0(1 / (K.SR * K.SR)), 13, 0);
    eq("one flip has a Sharpe ratio of 0.204", r3(K.SR_COIN), 0.204, 0);
  eq("a year of stocks has 0.28", r2(K.SR), 0.28, 0);
  truth("so a flip is not far below a whole year of stocks", K.SR_COIN < K.SR && K.SR_COIN > 0.7 * K.SR);
  eq("300 flips hold as much evidence as 162 years", r0(K.yearsLikeFlips(300)), 162, 0);
  eq("after 300 flips a Kelly player is ahead of a half-Kelly one 81% of the time (exact)", r0(100 * K.raceCoin(0.2, 0.1, 300)), 81, 0);
  eq("our investors reach 81% after 162 years", r0(100 * K.raceStocks(0.5, K.yearsLikeFlips(300))), 81, 0);
  // the 40 pairs on screen
  const B = K.brownian();
  for (const [c, T] of [[0.5, 30], [0.5, 94], [0.5, 162], [0.5, 300], [0.25, 30], [1.5, 30]]) {
    const k = B.filter((b) => K.gapAt(c, b, T) > 0).length, want = 40 * K.raceStocks(c, T);
    truth(`the 40 pairs on screen are representative at ${c} Kelly, ${T} years`, Math.abs(k - want) <= 1.5, `${k} vs ${want.toFixed(1)}`);
  }
  // the readout's lines stay inside the chart at the start
  let inside = true; for (const b of B) for (let t = 0; t <= 30; t++) { const r = Math.exp(K.gapAt(0.5, b, t)); if (r < 0.01 || r > 100) inside = false; }
  truth("the first 30 years of every pair stay inside the 0.01× to 100× window", inside);
}

console.log("-- how far down");
{
  // first passage: the formula against a simulation with fine steps (a discrete walk crosses
  // a little less often, so allow the known shortfall)
  const g = normals(41); let hit = 0; const M = 4000, dt = 1 / 252, steps = 30 * 252;
  for (let i = 0; i < M; i++) { let x = 0; for (let s = 0; s < steps; s++) { x += K.drift(1) * dt + K.vol(1) * Math.sqrt(dt) * g(); if (x <= -Math.log(2)) { hit++; break; } } }
  const f30 = K.fallWithin(1, 0.5, 30);
  truth("the 30-year halving chance at full Kelly agrees with daily steps (which cross a little less)", hit / M < f30 + 0.02 && hit / M > f30 - 0.05, `${(hit / M).toFixed(3)} vs ${f30.toFixed(3)}`);
  eq("the 30-year formula tends to the endless one", K.fallWithin(1, 0.5, 1e6), K.everFall(1, 0.5), 1e-6);
  eq("at full Kelly the chance of ever falling to x is x (x = 0.37)", K.everFall(1, 0.37), 0.37, 1e-14);
  eq("halving at full Kelly: 50%", r0(100 * K.everFall(1, 0.5)), 50, 0);
  eq("losing 90%: 10%", r0(100 * K.everFall(1, 0.1)), 10, 0);
  eq("half Kelly's exponent is 3", 2 / 0.5 - 1, 3, 0);
  eq("half Kelly halves with 12.5%", r1(100 * K.everFall(0.5, 0.5)), 12.5, 0);
  eq("and loses 90% with 0.1%", r1(100 * K.everFall(0.5, 0.1)), 0.1, 0);
  eq("half the bet keeps three quarters of the growth", K.drift(0.5) / K.drift(1), 0.75, 1e-14);
  eq("with half the volatility", K.vol(0.5) / K.vol(1), 0.5, 1e-14);
  eq("all in stocks is 0.65 of Kelly", r2(1 / K.KELLY), 0.65, 0);
  eq("and halves at some point with 24%", r0(100 * K.everFall(1 / K.KELLY, 0.5)), 24, 0);
  eq("within 30 years at full Kelly: 42%", r0(100 * K.fallWithin(1, 0.5, 30)), 42, 0);
}

console.log("-- what this costs you");
{
  eq("a 20% fall takes 31% off a 154% position", r0(100 * 0.2 * K.KELLY), 31, 0);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
