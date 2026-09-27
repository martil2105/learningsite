import * as d from "../src/diversify.js";
const s = 0.3, rho = 0.3;
for (const n of [1, 2, 5, 10, 20, 30, 100]) console.log(n, d.portfolioVol(n, s, rho).toFixed(4), d.removedShare(n));
console.log("floor", d.floorVol(s, rho), "gain inf", d.growthGain(1e12, s, rho), d.growthGain(1e12, 0.5, rho));
for (const sig of [0.3, 0.5]) for (const T of [1, 10, 30]) console.log(sig, T, d.beatProbability(sig, rho, T).toFixed(4));
for (const seed of [1, 2, 3]) {
  const u = d.universe(seed, 500, 0.5, 0.3, 30);
  const finals = u.paths.map((p) => p.at(-1));
  const P = u.port.at(-1);
  const beat = finals.filter((w) => w > P).length / finals.length;
  const lost = finals.filter((w) => w < 1).length / finals.length;
  const med = [...finals].sort((a, b) => a - b)[250];
  console.log(`seed ${seed}: port ${P.toFixed(2)} median stock ${med.toFixed(2)} beat ${beat.toFixed(3)} lost money ${lost.toFixed(3)} share carrying all gain ${d.shareCarryingGain(finals).toFixed(3)} mean final ${(finals.reduce((a,b)=>a+b,0)/500).toFixed(2)}`);
}
