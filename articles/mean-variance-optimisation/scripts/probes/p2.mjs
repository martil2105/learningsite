import * as m from "../src/mvo.js";
const spec = m.universeSpec();
// pick a 30-year history near the median Sharpe
const rows = [];
for (let seed = 1; seed <= 60; seed++) {
  const { muHat, Shat } = m.estimate(seed, 30, spec);
  const w = m.optimal(muHat, Shat);
  const ws = m.scaleToVol(w, Shat);
  rows.push([seed, m.sharpe(w, spec.mu, spec.S).toFixed(3), Math.max(...ws.map(Math.abs)).toFixed(3), ws.reduce((a, b) => a + Math.abs(b), 0).toFixed(2)]);
}
console.log(rows.map((r) => r.join(" ")).join("\n"));
// blur of each asset's mean at 30y
console.log("se per asset 30y", 0.2 / Math.sqrt(30), "neighbour gap", spec.mu[1] - spec.mu[0]);
