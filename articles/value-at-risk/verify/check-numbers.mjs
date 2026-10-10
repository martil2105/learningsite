// Every number on the page, from src/risk.js, in page order and rounded as the
// page rounds. The quantile route and the formula route to expected shortfall
// are checked against each other, and both against a simulation of defaults.
import * as R from "../src/risk.js";
import { mulberry32 } from "../src/random.js";
import { Phi } from "../src/stats.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r2 = (x) => +x.toFixed(2), r0 = (x) => +x.toFixed(0);

console.log("-- the routes agree");
{
  for (const nb of [1, 2, 3, 7, 25, 100]) for (const a of [0.95, 0.975, 0.99]) {
    const d = R.losses(nb);
    eq(`ES by the formula equals ES by the area, ${nb} bonds at ${a}`, R.esOf(d, a), R.esByArea(d, a), 1e-10);
  }
  // simulation of defaults, sharing no code with the binomial
  const u = mulberry32(42), M = 400000;
  for (const nb of [1, 2, 10]) {
    const L = new Float64Array(M);
    for (let i = 0; i < M; i++) { let k = 0; for (let j = 0; j < nb; j++) if (u() < R.P) k++; L[i] = (100 * R.LGD * k) / nb; }
    L.sort();
    const v = L[Math.ceil(0.95 * M) - 1];
    let tail = 0; for (let i = Math.ceil(0.95 * M); i < M; i++) tail += L[i];
    const es = (tail + v * (Math.ceil(0.95 * M) - 0.95 * M)) / (0.05 * M);
    truth(`400,000 simulated years of ${nb} bonds give the same VaR`, v === R.bonds(nb, 0.95).var, `${v}`);
    truth(`and the same ES within sampling error`, Math.abs(es - R.bonds(nb, 0.95).es) < 0.03 * Math.max(1, R.bonds(nb, 0.95).es), `${es.toFixed(3)} vs ${R.bonds(nb, 0.95).es.toFixed(3)}`);
  }
}

console.log("-- the guess card");
{
  eq("one bond at 95%: VaR zero", R.bonds(1, 0.95).var, 0, 0);
  eq("two bonds: $30", R.bonds(2, 0.95).var, 30, 1e-12);
  eq("because at least one defaults 7.84% of the time", r2(100 * R.bonds(2, 0.95).anyDefault), 7.84, 0);
  truth("which is more than 5%", R.bonds(2, 0.95).anyDefault > 0.05);
}

console.log("-- a height and an area");
{
  const d1 = R.losses(1), steps = R.quantileSteps(d1);
  eq("one bond: the curve is flat at zero until 96%", steps[0][1], 0.96, 1e-12);
  eq("and then jumps to $60", steps[1][2], 60, 1e-12);
  eq("the worst 5% have an average loss of $48", R.bonds(1, 0.95).es, 48, 1e-9);
  eq("five bonds: $12", R.bonds(5, 0.95).var, 12, 1e-12);
  eq("ten bonds: $12 again", R.bonds(10, 0.95).var, 12, 1e-12);
  truth("in between it dips (six to nine bonds)", [6, 7, 8, 9].every((k) => R.bonds(k, 0.95).var < 12));
  eq("100 bonds: $4.20", R.bonds(100, 0.95).var, 4.2, 1e-9);
  let pos = true; for (let k = 2; k <= 2000; k++) if (!(R.bonds(k, 0.95).var > 0)) pos = false;
  truth("it never gets back to zero (2 to 2,000 bonds)", pos);
  eq("the average loss is $2.40", R.bonds(1, 0.95).expected, 2.4, 1e-12);
  {
    // with many bonds the loss settles at its average: VaR − $2.40 shrinks like 1/√n, as the normal approximation says
    const approx = (k) => 2.4 + R.zOf(0.95) * 60 * Math.sqrt((R.P * (1 - R.P)) / k);
    truth("with many bonds the VaR heads to $2.40, shrinking like 1/√n (within 2 cents of the normal approximation plus one default's step)", [500, 1000, 2000].every((k) => Math.abs(R.bonds(k, 0.95).var - approx(k)) < 0.02 + 60 / k), [500, 1000, 2000].map((k) => R.bonds(k, 0.95).var.toFixed(2) + "/" + approx(k).toFixed(2)).join(" "));
  }
  let falls = true; for (const a of [0.95, 0.99]) for (let k = 2; k <= 400; k++) if (R.bonds(k, a).es > R.bonds(k - 1, a).es + 1e-12) falls = false;
  truth("ES falls the whole way, at 95% and at 99% (1 to 400 bonds)", falls);
  eq("to $5.12 with 100", r2(R.bonds(100, 0.95).es), 5.12, 0);
  let lowest = true; for (let k = 2; k <= 400; k++) if (R.bonds(k, 0.95).var <= R.bonds(1, 0.95).var) lowest = false;
  truth("at 95%, one bond has the lowest VaR of all", lowest);
  truth("at 99% it's the other way round: one bond has the highest", [...Array(99)].every((_, i) => R.bonds(i + 2, 0.99).var <= R.bonds(1, 0.99).var));
}

console.log("-- apart and together");
{
  const b = R.pair("bonds", 0.95);
  eq("each bond alone: VaR zero", b.varA, 0, 0);
  eq("together: $60", b.varAB, 60, 1e-12);
  eq("ES each: $48", b.esA, 48, 1e-9);
  eq("added up: $96", b.esA + b.esB, 96, 1e-9);
  eq("together: $61.92", r2(b.esAB), 61.92, 0);
  // subadditivity of ES on random lumpy pairs (brute force over many distributions)
  const u = mulberry32(7); let worst = -Infinity;
  for (let t = 0; t < 3000; t++) {
    const pa = 0.01 + 0.08 * u(), pb = 0.01 + 0.08 * u(), la = 100 * u(), lb = 100 * u(), al = 0.9 + 0.09 * u();
    const A = [[0, 1 - pa], [la, pa]], B = [[0, 1 - pb], [lb, pb]];
    const AB = [[0, (1 - pa) * (1 - pb)], [la, pa * (1 - pb)], [lb, (1 - pa) * pb], [la + lb, pa * pb]].sort((x, y) => x[0] - y[0]);
    worst = Math.max(worst, R.esOf(AB, al) - R.esOf(A, al) - R.esOf(B, al));
  }
  truth("ES is subadditive on 3,000 random pairs of lumpy losses", worst <= 1e-9, worst.toExponential(2));
  eq("a normal VaR is 1.64 standard deviations at 95%", r2(R.zOf(0.95)), 1.64, 0);
  let ok1 = true; for (let rho = -1; rho <= 1.0001; rho += 0.05) { const p = R.pair("normal", 0.95, rho); if (p.varAB > p.varA + p.varB + 1e-9 || p.esAB > p.esA + p.esB + 1e-9) ok1 = false; }
  truth("two normal losses are subadditive at every correlation", ok1);
  const p1 = R.pair("normal", 0.95, 1);
  truth("and reach equality only at a correlation of 1", Math.abs(p1.varAB - p1.varA - p1.varB) < 1e-9 && R.pair("normal", 0.95, 0.9).varAB < p1.varAB - 0.1);
}

console.log("-- what the regulators did");
{
  eq("a normal 97.5% expected shortfall is 2.34 sd", r2(R.normalEs(1, 0.975)), 2.34, 0);
  eq("and a 99% value at risk 2.33", r2(R.normalVar(1, 0.99)), 2.33, 0);
  // the normal ES formula against a numerical integral of the quantile
  let s = 0; const K = 200000; for (let i = 0; i < K; i++) { const uu = 0.975 + (0.025 * (i + 0.5)) / K; let lo = -10, hi = 10; for (let j = 0; j < 60; j++) { const mm = (lo + hi) / 2; if (Phi(mm) < uu) lo = mm; else hi = mm; } s += lo; }
  eq("the normal ES formula agrees with averaging the quantiles", R.normalEs(1, 0.975), s / K, 1e-4);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
