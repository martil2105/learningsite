import * as m from "../src/mvo.js";
const spec = m.universeSpec();
console.log("mu", spec.mu.map((v) => (100 * v).toFixed(2)).join(" "));
const w = m.optimal(spec.mu, spec.S);
console.log("best SR", m.sharpe(w, spec.mu, spec.S), "1/N SR", m.sharpe(new Array(10).fill(1), spec.mu, spec.S));
console.log("best weights at 10% vol", m.scaleToVol(w, spec.S).map((v) => v.toFixed(3)).join(" "));
console.log("mean blur 16% 50y", m.meanSE(0.16, 50), "years for 1pt", (0.16 / 0.01) ** 2);
for (const N of [2, 10, 25, 50]) {
  const d = m.drawsFor(N);
  console.log(`N=${N}: E[cos] 50y ${m.expectedCos(0.5 * Math.sqrt(50), d).toFixed(3)} 100y ${m.expectedCos(5, d).toFixed(3)} years to 0.8 ${m.yearsToReach(0.8, 0.5, d).toFixed(1)} approx ${m.approxYears(0.8, 0.5, N).toFixed(1)}`);
}
// lab: 30 years, several seeds
for (const years of [10, 30, 60, 100]) {
  const res = [];
  for (let seed = 1; seed <= 200; seed++) {
    const { muHat, Shat } = m.estimate(seed, years, spec);
    const both = m.sharpe(m.optimal(muHat, Shat), spec.mu, spec.S);
    const muOnly = m.sharpe(m.optimal(muHat, spec.S), spec.mu, spec.S);
    res.push([both, muOnly]);
  }
  const mean = (i) => res.reduce((a, r) => a + r[i], 0) / res.length;
  const beat = (i) => res.filter((r) => r[i] > 0.4).length / res.length;
  console.log(`years ${years}: both est mean SR ${mean(0).toFixed(3)} beat1/N ${beat(0).toFixed(2)} | mu only ${mean(1).toFixed(3)} beat ${beat(1).toFixed(2)}`);
}
const d10 = m.drawsFor(10);
console.log("theory mu-only N=10: 10y", 0.5*m.expectedCos(0.5*Math.sqrt(10), d10), "30y", 0.5*m.expectedCos(0.5*Math.sqrt(30), d10), "60y", 0.5*m.expectedCos(0.5*Math.sqrt(60),d10), "100y", 0.5*m.expectedCos(5,d10));
console.log("years to beat 1/N N=10:", m.yearsToReach(0.8, 0.5, d10));
