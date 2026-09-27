// Every number the page states, derived twice: route A is src/diversify.js,
// route B builds the covariance matrix and averages it, or integrates the
// normal density, here.
import { portfolioVol, portfolioVariance, floorVol, removedShare, growthGain, beatProbability, Phi, universe } from "../src/diversify.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!ok) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }

// Route B: average of the n x n covariance matrix
const gridVar = (k, s, r) => { let sum = 0; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) sum += i === j ? s * s : r * s * s; return sum / (k * k); };
// Route B: Phi by Simpson integration of the density
const PhiB = (x) => { const a = -12, N = 20000, h = (x - a) / N; let s = 0; for (let i = 0; i <= N; i++) { const t = a + i * h; const f = Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI); s += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * f; } return (s * h) / 3; };

const S = 0.4, R = 0.2;
console.log("-- the risk curve at 40% and 0.2");
for (const [k, want] of [[1, 40], [2, 31], [10, 21], [30, 19]]) {
  eq(`${k} stocks: variance (A vs grid B)`, portfolioVariance(k, S, R), gridVar(k, S, R), 1e-12);
  truth(`${k} stocks: volatility rounds to ${want}%`, Math.round(100 * portfolioVol(k, S, R)) === want, (100 * portfolioVol(k, S, R)).toFixed(2));
}
eq("floor 17.9%", +(100 * floorVol(S, R)).toFixed(1), 17.9);
truth("never below about 18%", portfolioVol(1e9, S, R) > 0.178 && Math.round(100 * portfolioVol(1e9, S, R)) === 18);
truth("thirty stocks about a point above the floor", Math.abs(100 * (portfolioVol(30, S, R) - floorVol(S, R)) - 1) < 0.25, (100 * (portfolioVol(30, S, R) - floorVol(S, R))).toFixed(2));
for (const r of [0, 0.2, 0.5, 0.9]) for (const s of [0.2, 0.4, 0.6]) {
  const excess = (k) => gridVar(k, s, r) - r * s * s;
  if (r < 1) eq(`share removed by 10 stocks is 90% at rho ${r}, sigma ${s} (B)`, 1 - excess(10) / excess(1), 0.9, 1e-9);
}
eq("10 stocks remove 90% (A)", removedShare(10), 0.9);
eq("20 stocks remove 95% (A)", removedShare(20), 0.95);
eq("grid: six stocks, a sixth of cells are variances", 6 / 36, 1 / 6);

console.log("-- growth");
eq("single stock compounds at about 0%", 0.08 - 0.5 * S * S, 0);
eq("portfolio compounds at about 6.4%", 0.08 - 0.5 * floorVol(S, R) ** 2, 0.064, 1e-12);
eq("growth gap is half the variance removed (A)", growthGain(1e12, S, R), 0.064, 1e-9);
truth("over 30 years a factor of about seven", Math.round(Math.exp(0.064 * 30)) === 7, Math.exp(0.064 * 30).toFixed(3));
truth("the middle stock ends at about a seventh", Math.abs(1 / Math.exp(0.064 * 30) - 1 / 7) < 0.01);
eq("chance of being ahead after 30 years (A vs integrated B)", beatProbability(S, R, 30), PhiB(-0.5 * Math.sqrt((1 - R) * S * S * 30)), 1e-6);
truth("  about one in six: 16.4%", (100 * beatProbability(S, R, 30)).toFixed(1) === "16.4");
truth("  and it falls the longer we wait", beatProbability(S, R, 1) > beatProbability(S, R, 10) && beatProbability(S, R, 10) > beatProbability(S, R, 30));
eq("Phi (A) matches integration at 1.3", Phi(1.3), PhiB(1.3), 2e-7);

console.log("-- the universe drawn on the page (seed 11)");
const u = universe(11, 400, S, R, 30);
const finals = u.paths.map((p) => p[30]);
const P = u.port[30];
truth("portfolio turns $1 into $7.36", P.toFixed(2) === "7.36", P.toFixed(4));
const med = [...finals].sort((a, b) => a - b)[200];
truth("middle stock ends at $1.03", med.toFixed(2) === "1.03", med.toFixed(4));
const ahead = finals.filter((w) => w > P).length / 400;
truth("16.5% of stocks finish ahead", (100 * ahead).toFixed(1) === "16.5", String(ahead));
// Route B for the portfolio: rebuild it from monthly stock values is not possible from yearly paths, so check the
// identity that an equal buy-and-hold stake is the average of final values, and it stays close to the rebalanced one
const avg = finals.reduce((a, b) => a + b, 0) / 400;
truth("average final value close to the portfolio's", Math.abs(avg / P - 1) < 0.1, (avg / P).toFixed(3));
let spread = [];
for (let sd = 1; sd <= 30; sd++) { const v = universe(sd, 400, S, R, 30); const f = v.paths.map((p) => p[30]); spread.push(f.filter((w) => w > v.port[30]).length / 400); }
truth("share ahead barely moves across 30 universes", Math.max(...spread) - Math.min(...spread) < 0.06 && Math.abs(spread.reduce((a, b) => a + b) / 30 - beatProbability(S, R, 30)) < 0.01, `${Math.min(...spread)}..${Math.max(...spread)}`);

console.log(fails ? `\n${fails} of ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
if (fails) process.exit(1);
