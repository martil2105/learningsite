// Every number the page states, derived here. Route A is src/markets.js (the
// closed forms and the seeded world the lab draws). Route B simulates many
// worlds with a generator of its own and reads the luckiest record directly,
// and recomputes E[max] by brute force.
import * as M from "../src/markets.js";
import { mulberry32 } from "../src/random.js";
import { normCdf } from "../src/stats.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x, d = 1) => round(100 * x, d);
const g = mulberry32(777), gauss = () => { let a = 0; while (a === 0) a = g(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * g()); };

console.log("-- the truth and the lab's world");
truth("the true thirty-year loss chance is about 13.7%", pc(M.lossChance(0.04, 0.2, 30)) === 13.7);
const w = M.simulateWorld(3), b = w.markets[w.best];
truth("the lab's world: the luckiest market grew about 7.8% a year", pc(b.avg) === 7.8, pc(b.avg, 3) + "%");
truth("nearly twice the true 4%", b.avg / 0.04 > 1.8 && b.avg / 0.04 < 2);
truth("its record says about 2.3% at thirty years", pc(M.lossChance(b.avg, b.vol, 30)) === 2.3, pc(M.lossChance(b.avg, b.vol, 30), 3) + "%");
const poolP = M.lossChance(w.pooled.avg, w.pooled.vol, 30);
truth("pooling all 39 gets much closer to the truth", Math.abs(poolP - 0.137) < 0.02 && Math.abs(poolP - 0.137) < Math.abs(M.lossChance(b.avg, b.vol, 30) - 0.137) / 5, pc(poolP, 2) + "%");
truth("the blue market is the one that ended richest", w.markets.every((k) => k.wealth[130] <= b.wealth[130]));
truth("and its growth is its final wealth over 130 years", Math.abs(b.avg - b.wealth[130] / 130) < 1e-12);
{
  // the markets really are identical: every true mean is 4%
  truth("every market in the lab has the same true growth", w.markets.every((k) => k.trueMean === 0.04));
}

console.log("-- across many worlds (route B: own generator)");
{
  const W = 3000, bestAvg = [], bestP = [], poolPs = [];
  for (let i = 0; i < W; i++) {
    let top = -Infinity, topVol = 0, all = 0, all2 = 0;
    for (let c = 0; c < 39; c++) {
      let s = 0, s2 = 0;
      for (let t = 0; t < 130; t++) { const x = 0.04 + 0.2 * gauss(); s += x; s2 += x * x; }
      all += s; all2 += s2;
      const avg = s / 130;
      if (avg > top) { top = avg; topVol = Math.sqrt((s2 - 130 * avg * avg) / 129); }
    }
    bestAvg.push(top); bestP.push(normCdf((-top * Math.sqrt(30)) / topVol));
    const pa = all / (39 * 130); poolPs.push(normCdf((-pa * Math.sqrt(30)) / Math.sqrt((all2 - 39 * 130 * pa * pa) / (39 * 130 - 1))));
  }
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  eq("the luckiest record is ahead by E[max] standard errors on average (sampling tolerance)", mean(bestAvg) - 0.04, M.luckPremium(39, 130), 0.03);
  truth("the luckiest record typically puts thirty years at about 1.7%", pc(med(bestP)) === 1.7, pc(med(bestP), 3) + "%");
  truth("and the formula with the luck premium agrees (1.7%)", pc(M.lossChance(0.04 + M.luckPremium(39, 130), 0.2, 30)) === 1.7, pc(M.lossChance(0.04 + M.luckPremium(39, 130), 0.2, 30), 3) + "%");
  truth("pooled records typically land on the truth", Math.abs(med(poolPs) - M.lossChance(0.04, 0.2, 30)) < 0.003, pc(med(poolPs), 2) + "%");
  truth("a factor of about eight", round(M.lossChance(0.04, 0.2, 30) / med(bestP)) === 8, (M.lossChance(0.04, 0.2, 30) / med(bestP)).toFixed(2));
}

console.log("-- the luck premium");
{
  // E[max of 39] by brute force
  let s = 0; const R = 200000;
  for (let i = 0; i < R; i++) { let m = -Infinity; for (let c = 0; c < 39; c++) m = Math.max(m, gauss()); s += m; }
  eq("E[max of 39 normals]: integral against brute force (sampling tolerance)", M.expectedMax(39), s / R, 0.004);
}
truth("E[max] for 39 is about 2.15", round(M.expectedMax(39), 2) === 2.15, M.expectedMax(39).toFixed(4));
eq("E[max] of one draw is zero", M.expectedMax(1), 0, 1e-12);
eq("E[max] of two is 1/sqrt(pi)", M.expectedMax(2), 1 / Math.sqrt(Math.PI), 1e-9);
truth("the standard error is about 1.75 points", round(100 * 0.2 / Math.sqrt(130), 2) === 1.75);
truth("the luck premium is about 3.8 points", pc(M.luckPremium(39, 130)) === 3.8, pc(M.luckPremium(39, 130), 3));
truth("the z-shift at thirty years is about one standard deviation", round(M.zShift(39, 30, 130), 1) === 1.0, M.zShift(39, 30, 130).toFixed(4));
{
  // the shift doesn't depend on m or sigma: read it off the loss formula at other values
  const zs = [[0.02, 0.15], [0.04, 0.2], [0.07, 0.3]].map(([m, s]) => {
    const z0 = (-m * Math.sqrt(30)) / s, z1 = (-(m + M.luckPremium(39, 130, s)) * Math.sqrt(30)) / s;
    return z0 - z1;
  });
  truth("the shift is the same whatever the growth and volatility", zs.every((z) => Math.abs(z - M.zShift(39, 30, 130)) < 1e-12), zs.map((z) => z.toFixed(6)).join(", "));
}
eq("with one market to choose from the curves meet", M.luckPremium(1, 130), 0, 1e-12);
truth("more markets make it worse, slowly (10, 39, 100)", M.luckPremium(10, 130) < M.luckPremium(39, 130) && M.luckPremium(39, 130) < M.luckPremium(100, 130) && M.expectedMax(100) / M.expectedMax(39) < 1.2);
truth("100 markets: only about 4.4 points", pc(M.luckPremium(100, 130)) === 4.4, pc(M.luckPremium(100, 130), 3));
truth("180 years only brings it down to about 3.2 points", pc(M.luckPremium(39, 180)) === 3.2, pc(M.luckPremium(39, 180), 3));
truth("the shift grows with the horizon", M.zShift(39, 10, 130) < M.zShift(39, 30, 130) && M.zShift(39, 30, 130) < M.zShift(39, 50, 130));

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
