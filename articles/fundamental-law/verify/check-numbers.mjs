// Every number the page states, from src/law.js. The closed forms are tested
// against a stock-by-stock simulation first, then the claims in page order,
// rounded the way the page rounds them (toFixed).
import * as L from "../src/law.js";
import { normals } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const meanSd = (v) => { const m = v.reduce((a, b) => a + b, 0) / v.length; return [m, Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1))]; };
const { A, B } = L.MANAGERS;

console.log("-- the model against a stock-by-stock simulation");
{
  // 6,000 months; the annual ratio's sampling error is about sqrt(12/6000) = 0.045
  for (const [ic, N, s, seed] of [[0.02, 500, 0.05, 3], [0.02, 1000, 0, 4], [0.06, 50, 0.05, 5], [0.05, 200, 0.1, 6]]) {
    const [m, sd] = meanSd(L.simulate(ic, N, s, 6000, seed));
    const ir = (m / sd) * L.ROOT12, want = L.irAnnual(ic, N, s);
    truth(`IC ${ic}, ${N} stocks, swing ${s}: simulated ratio ${ir.toFixed(3)} matches ${want.toFixed(3)} (within 3 sampling errors)`, Math.abs(ir - want) < 3 * Math.sqrt(12 / 6000) * Math.sqrt(1 + want ** 2 / 24));
    truth(`  and its average return is the IC, swing or not`, Math.abs(m - ic) < 3 * sd / Math.sqrt(6000), m.toFixed(4));
    truth(`  and its volatility is the formula's`, Math.abs(sd / Math.sqrt(s * s + (1 + ic * ic + s * s) / N) - 1) < 0.03, sd.toFixed(4));
  }
  eq("with no swing the ratio is IC root N over root (1 + IC²)", L.irMonthly(0.02, 500), (0.02 * Math.sqrt(500)) / Math.sqrt(1 + 0.0004), 1e-12);
  truth("which is IC root N to within 0.2% for every IC on the page", [0.02, 0.06].every((ic) => Math.abs(L.irMonthly(ic, 100) / (ic * 10) - 1) < 0.002));
  eq("the months the page draws have the same volatility as the stock-level world", (() => { const v = L.months(0.02, 500, 0.05, 20000, 9); return meanSd(v)[1]; })(), Math.sqrt(0.05 ** 2 + (1 + 0.02 ** 2 + 0.05 ** 2) / 500), 0.02);
  // the hit rate, a million normal pairs
  const g = normals(13); let hit = 0; const M = 1_000_000, ic = 0.06;
  for (let i = 0; i < M; i++) { const z = g(), r = ic * z + Math.sqrt(1 - ic * ic) * g(); if (z * r > 0) hit++; }
  truth("a million pairs at IC 0.06 get the direction right as often as ½ + arcsin(IC)/π", Math.abs(hit / M - L.hitRate(ic)) < 0.0015, (hit / M).toFixed(4));
  truth("the long-run share of winning months agrees with a simulation", Math.abs(L.months(0.02, 1000, 0.05, 40000, 17).filter((x) => x > 0).length / 40000 - L.positiveShare(0.02, 1000, 0.05)) < 0.008);
}

console.log("-- the guess card");
{
  eq("B's ratio is 2.2 a year", r1(L.irAnnual(B.ic, B.n)), 2.2, 0);
  eq("A's is 1.5", r1(L.irAnnual(A.ic, A.n)), 1.5, 0);
  eq("B makes twenty times as many bets", B.n / A.n, 20, 0);
}

console.log("-- skill is a small correlation");
{
  eq("an IC of 0.02 gets the direction right 50.6% of the time", r1(100 * L.hitRate(0.02)), 50.6, 0);
  eq("A's 0.06 lifts that to 51.9%", r1(100 * L.hitRate(0.06)), 51.9, 0);
  const P = L.scatter(500, 5).at(0.02);
  eq("this month's forecasts got 53.0% right", r1((100 * P.filter(([x, y]) => x * y > 0).length) / 500), 53.0, 0);
  truth("which is more than the real edge", P.filter(([x, y]) => x * y > 0).length / 500 > L.hitRate(0.02));
  let out = 0;
  for (const ic of [0, 0.1, 0.2, 0.3, 0.4, 0.5]) out = Math.max(out, L.scatter(500, 5).at(ic).filter(([x, y]) => Math.abs(x) > 3.6 || Math.abs(y) > 3.6).length);
  truth("at most a few dots of 500 sit on the scatter's edge at any IC", out <= 3, String(out));
}

console.log("-- when the IC moves");
{
  const ic = 0.02, s = 0.05;
  eq("500 stocks: 1.03 a year with the swing", r2(L.irAnnual(ic, 500, s)), 1.03, 0);
  eq("against Grinold's 1.55", r2(L.irAnnual(ic, 500)), 1.55, 0);
  eq("Grinold's doubles from 500 to 2,000 stocks", L.irAnnual(ic, 2000) / L.irAnnual(ic, 500), 2, 1e-12);
  eq("to 3.10", r2(L.irAnnual(ic, 2000)), 3.1, 0);
  eq("with the swing it creeps up to 1.26", r2(L.irAnnual(ic, 2000, s)), 1.26, 0);
  eq("under a ceiling of 1.39", r2(L.ceiling(ic, s)), 1.39, 0);
  eq("500 stocks are worth 222 independent bets", r0(L.bets(ic, 500, s)), 222, 0);
  eq("2,000 are worth 333", r0(L.bets(ic, 2000, s)), 333, 0);
  eq("and no number gets past 400", r0(L.betsCap(ic, s)), 400, 0);
  truth("the ratio rises with N and stays under the ceiling", [10, 100, 1e3, 1e4, 1e6, 1e9].every((N, i, a) => L.irAnnual(ic, N, s) < L.ceiling(ic, s) && (i === 0 || L.irAnnual(ic, N, s) > L.irAnnual(ic, a[i - 1], s))));
  eq("the bets match the ratio in Grinold's terms", L.irMonthly(ic, L.bets(ic, 2000, s)), L.irMonthly(ic, 2000, s), 1e-12);
  eq("at 500 stocks a swing of 0.05 moves the IC 1.5 times as much as noise alone", r1(L.kappa(ic, 500, s)), 1.5, 0);
}

console.log("-- the two managers again");
{
  eq("with no swing B is ahead, 2.2", r1(L.irAnnual(B.ic, B.n, 0)), 2.2, 0);
  eq("to 1.5", r1(L.irAnnual(A.ic, A.n, 0)), 1.5, 0);
  const x = L.crossing();
  eq("A takes the lead once the swing passes about 0.04", r2(x), 0.04, 0);
  truth("on the slider, B leads at 0.03 and A at 0.04", L.irAnnual(B.ic, B.n, 0.03) > L.irAnnual(A.ic, A.n, 0.03) && L.irAnnual(A.ic, A.n, 0.04) > L.irAnnual(B.ic, B.n, 0.04));
  eq("at 0.05, 1.38 for A", r2(L.irAnnual(A.ic, A.n, 0.05)), 1.38, 0);
  eq("against 1.17 for B", r2(L.irAnnual(B.ic, B.n, 0.05)), 1.17, 0);
  const dropA = 1 - L.irAnnual(A.ic, A.n, 0.1) / L.irAnnual(A.ic, A.n), dropB = 1 - L.irAnnual(B.ic, B.n, 0.1) / L.irAnnual(B.ic, B.n);
  truth("B's bar falls quickly while A's barely moves (a third of B's drop or less, across the slider)", dropA < dropB / 3, `${dropA.toFixed(2)} vs ${dropB.toFixed(2)}`);
  const share = (g, s) => (s * s) / (s * s + (1 + g.ic * g.ic + s * s) / g.n);
  truth("at 0.05 the swing is most of B's risk and little of A's", share(B, 0.05) > 0.5 && share(A, 0.05) < 0.15, `${share(B, 0.05).toFixed(2)} ${share(A, 0.05).toFixed(2)}`);
  let fit = true;
  for (let s = 0; s <= 0.1001; s += 0.01) for (const g of [A, B]) if (L.irAnnual(g.ic, g.n, s) > 2.5) fit = false;
  truth("every bar fits the chart's 0 to 2.5", fit);
}

console.log("-- where the extra risk hides");
{
  eq("the risk model's tracking error is 4%", L.TE, 4, 0);
  eq("B with a swing of 0.05: 7.5% in the long run", r1(L.TE * L.kappa(B.ic, B.n, 0.05)), 7.5, 0);
  truth("almost twice the risk", L.kappa(B.ic, B.n, 0.05) > 1.75 && L.kappa(B.ic, B.n, 0.05) < 2);
  eq("A with the same swing: 4.2%", r1(L.TE * L.kappa(A.ic, A.n, 0.05)), 4.2, 0);
  eq("with no swing the model is right", L.kappa(B.ic, B.n, 0), 1, 1e-12);
  for (const id of ["A", "B"]) { const [m] = meanSd(L.months(L.MANAGERS[id].ic, L.MANAGERS[id].n, 0.05, 40000, 21)); const p = Math.sqrt((1 + L.MANAGERS[id].ic ** 2) / L.MANAGERS[id].n); truth(`${id}'s expected month is the green line, swing or not (simulated)`, Math.abs((m / p) * (L.TE / L.ROOT12) / L.expectedMonth(id) - 1) < 0.05); }
  const band = (2 * L.TE) / L.ROOT12;
  const outside = (id, s) => L.riskRun(id, s).filter((r) => Math.abs(r - L.expectedMonth(id)) > band).length;
  truth("with no swing B's months stay inside the lines, much as expected", outside("B", 0) <= 8, String(outside("B", 0)));
  truth("with a swing of 0.05 they spill over", outside("B", 0.05) >= 3 * Math.max(1, outside("B", 0)), String(outside("B", 0.05)));
  const p2 = 2 * (1 - L.Phi(2));
  truth("about one month in twenty lands beyond two standard deviations", p2 > 0.04 && p2 < 0.05, p2.toFixed(4));
  const ten = (id, s) => L.sdOf(L.riskRun(id, s)) * L.ROOT12;
  truth("this run's realised tracking errors sit near the long run (within 10%)", ["A", "B"].every((id) => [0, 0.05].every((s) => Math.abs(ten(id, s) / (L.TE * L.kappa(L.MANAGERS[id].ic, L.MANAGERS[id].n, s)) - 1) < 0.1)),
    ["A", "B"].flatMap((id) => [0, 0.05].map((s) => ten(id, s).toFixed(2))).join(" "));
  let lim = 0;
  for (let s = 0; s <= 0.1001; s += 0.01) for (const id of ["A", "B"]) lim = Math.max(lim, ...L.riskRun(id, s).map(Math.abs));
  truth("every bar the slider can reach fits the chart's ±12%", lim < 12, lim.toFixed(2));
  eq("we'd need about 45 months to put an IC of 0.02 two standard errors from zero", r0((2 * Math.sqrt(0.05 ** 2 + (1 + 0.02 ** 2 + 0.05 ** 2) / 500) / 0.02) ** 2), 45, 0);
}

console.log(`\n${n - fails} of ${n} checks pass`);
if (fails) process.exit(1);
