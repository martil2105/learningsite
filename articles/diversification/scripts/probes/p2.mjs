import * as d from "../src/diversify.js";
const s = 0.4, rho = 0.2;
for (const n of [1, 2, 5, 10, 20, 30, 100]) console.log(n, d.portfolioVol(n, s, rho).toFixed(4));
console.log("floor", d.floorVol(s, rho), "gain", d.growthGain(1e12, s, rho), "median rel 30y", Math.exp(-d.growthGain(1e12, s, rho) * 30));
console.log("beat 30y", d.beatProbability(s, rho, 30), "10y", d.beatProbability(s, rho, 10), "1y", d.beatProbability(s, rho, 1));
const res = [];
for (let seed = 1; seed <= 40; seed++) {
  const u = d.universe(seed, 400, s, rho, 30);
  const f = u.paths.map((p) => p.at(-1)); const P = u.port.at(-1);
  const sorted = [...f].sort((a, b) => a - b);
  res.push([seed, P.toFixed(2), (f.filter((w) => w > P).length / 400).toFixed(3), (sorted[200] / P).toFixed(3), (f.reduce((a, b) => a + b, 0) / 400 / P).toFixed(3)]);
}
console.log(res.map((r) => r.join(" ")).join("\n"));
