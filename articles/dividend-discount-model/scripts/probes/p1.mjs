import * as d from "../src/ddm.js";
const r = 0.08, g = 0.05;
console.log("P/D1", d.gordon(1, r, g), "yield", r - g, "mod dur", d.modifiedDuration(r, g), "mac", d.macaulayDuration(r, g));
console.log("half-life", d.halfLife(r, g), "after 10", d.shareAfter(r, g, 10), "after 30", d.shareAfter(r, g, 30), "after 50", d.shareAfter(r,g,50), "after 100", d.shareAfter(r,g,100));
console.log("r+1", d.gordon(1, r + 0.01, g) / d.gordon(1, r, g) - 1, "r-1", d.gordon(1, r - 0.01, g) / d.gordon(1, r, g) - 1, "tangent", -d.modifiedDuration(r, g) * 0.01);
console.log("same gap r=10 g=7", d.gordon(1, 0.10, 0.07));
for (const [g1, N, r2, g2] of [[0.15, 10, 0.09, 0.04], [0.12, 10, 0.08, 0.04], [0.10, 5, 0.09, 0.03], [0.20, 10, 0.10, 0.04], [0.15, 10, 0.08, 0.04]]) {
  const t = d.twoStage(1, r2, g1, N, g2); console.log(g1, N, r2, g2, t.price.toFixed(2), "TV share", t.terminalShare.toFixed(3));
}
// gap uncertainty
console.log("gap 2%:", 1/0.02, "gap 4%:", 1/0.04);
// growth stock vs value stock: gap 2% vs 6%: duration 50 vs 16.7; +1pt r: -33% vs -14%
for (const gap of [0.02, 0.03, 0.06]) console.log("gap", gap, "dur", 1/gap, "+1pt", (1/(gap+0.01))/(1/gap) - 1);
