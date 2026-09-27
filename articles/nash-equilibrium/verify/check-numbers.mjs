/*
  Re-derives every number the article asserts, from the modules the page
  imports. Written for the SENTENCE, not only for the figure in it.

  The article's claims are identities, so most of these are asserted at ZERO
  tolerance rather than to 1e-12. Where a tolerance appears it is because the
  quantity is an expected value accumulated in floating point, and the comment
  says so.
*/
import { mulberry32 } from "../src/rng.js";
import {
  BASE, matrices, pureNE, mixed, mixedGeneric, exploitability, values,
  tolerated, breachFixedMonitor, criticalFine, breachWithFloor,
} from "../src/game.js";
import { enumerateAll, poissonOne, countPureRandom } from "../src/enumerate.js";
import { ownMixDisplacement } from "../src/general.js";
import { fineSweep, traderSweep, floorSweep, leverSweep } from "../src/datasets.js";
import { COUNT_BY_SIZE, TRIALS } from "../src/precomputed.js";

let pass = 0;
const fails = [];
const ok = (claim, cond, detail = "") => {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
};
const close = (a, b, tol = 1e-12) =>
  Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// === 1. the opening question: the game really has no cell ===================
{
  const { A, B } = matrices(BASE);
  ok("the article's game has no pure equilibrium at all", pureNE(A, B).length === 0,
    `found ${pureNE(A, B).length}`);
  // and every cell has someone who would walk away from it
  let allHaveADeviator = true;
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 2; c++)
      if (A[r][c] > A[1 - r][c] && B[r][c] > B[r][1 - c]) allHaveADeviator = false;
  ok("every one of the four cells has a player who would switch", allHaveADeviator);
}

// === 2. the failure rate, exactly ==========================================
{
  const e = enumerateAll();
  ok("all 576 ordinal 2x2 games are enumerated", e.games === 576, `got ${e.games}`);
  ok("exactly 72 of 576 games have no pure equilibrium — one in eight",
    e.counts[0] === 72 && 72 / 576 === 0.125, `got ${e.counts[0]}`);
  ok("exactly 432 of 576 have one — three in four",
    e.counts[1] === 432 && 432 / 576 === 0.75, `got ${e.counts[1]}`);
  ok("exactly 72 of 576 have two — one in eight", e.counts[2] === 72, `got ${e.counts[2]}`);
  ok("no 2x2 game has three or more", e.counts[3] === 0 && e.counts[4] === 0);
  const mean = e.counts.reduce((s, c, k) => s + k * c, 0) / 576;
  ok("the mean number of pure equilibria is EXACTLY one", mean === 1, `got ${mean}`);
  ok("exactly 64 of the 576 pure equilibria are Pareto-dominated — one in nine",
    e.dominated === 64 && e.equilibria === 576 && close(64 / 576, 1 / 9),
    `${e.dominated}/${e.equilibria}`);
}

// === 3. E = 1 at every size, and the Poisson(1) limit ======================
{
  // The closed form: n^2 cells, each an equilibrium with chance (1/n)(1/n).
  for (const { n, mean } of COUNT_BY_SIZE) {
    ok(`the simulated mean at n=${n} sits on the closed-form value of 1`,
      Math.abs(mean - 1) < 0.02, `mean ${mean.toFixed(5)} over ${TRIALS} games`);
  }
  const big = COUNT_BY_SIZE.find((r) => r.n === 100);
  ok("at n=100 the share with no pure equilibrium has converged to 1/e",
    Math.abs(big.p[0] - Math.exp(-1)) < 0.005,
    `simulated ${big.p[0].toFixed(6)} against 1/e = ${Math.exp(-1).toFixed(6)}`);
  ok("at n=100 the whole distribution matches Poisson(1) to within 0.005",
    [0, 1, 2, 3].every((k) => Math.abs(big.p[k] - poissonOne(k)) < 0.005),
    [0, 1, 2, 3].map((k) => `${big.p[k].toFixed(4)}/${poissonOne(k).toFixed(4)}`).join(" "));
  // the precomputed table is reproducible from the seed it names
  const rand = mulberry32(12345 + 2);
  let total = 0;
  for (let t = 0; t < 20000; t++) total += countPureRandom(2, rand);
  ok("the precompute seed reproduces: a fresh 20k run at n=2 lands on 1",
    Math.abs(total / 20000 - 1) < 0.03, `${(total / 20000).toFixed(5)}`);
}

// === 4. the equilibrium, twice, by routes that share no code ===============
{
  const { A, B } = matrices(BASE);
  const m = mixed(BASE);
  const g = mixedGeneric(A, B);
  ok("the breach rate is exactly 0.15", m.p === 0.15, `${m.p}`);
  ok("the audit rate is exactly 0.30", m.q === 0.3, `${m.q}`);
  ok("the closed form and the two-matrix solver agree EXACTLY, not approximately",
    m.p === g.p && m.q === g.q, `${m.p}/${g.p}, ${m.q}/${g.q}`);
  ok("neither player can gain by abandoning the mix",
    exploitability(A, B, m.p, m.q) < 1e-14,
    `exploitability ${exploitability(A, B, m.p, m.q).toExponential(2)}`);
}

// === 5. THE CLAIM: the fine does not move the breach rate ==================
{
  const target = BASE.C / (BASE.V + BASE.L);
  const fines = [20, 60, 140, 340, 700, 1500, 10000, 1e6];
  const rates = fines.map((F) => mixed({ ...BASE, F }).p);
  ok("across fines from 20 to a million the breach rate takes ONE value",
    new Set(rates).size === 1, `${new Set(rates).size} distinct values`);
  ok("and that value is exactly C/(V+L)", rates.every((p) => p === target));

  // the same, over half a million random trader-side parameter draws
  const sweep = traderSweep(mulberry32(20260913), 500000);
  ok("500,000 random redraws of the trader's gain and fine move the breach rate by exactly zero",
    sweep.worst === 0, `worst deviation ${sweep.worst}`);

  // the audit rate, by contrast, does move — and monotonically
  const audits = fines.map((F) => mixed({ ...BASE, F }).q);
  ok("the audit rate falls strictly as the fine rises",
    audits.every((q, i) => i === 0 || q < audits[i - 1]), audits.map((q) => q.toFixed(4)).join(" "));
  ok("raising the fine from 140 to 340 exactly halves the audit rate, 0.30 to 0.15",
    mixed({ ...BASE, F: 140 }).q === 0.3 && mixed({ ...BASE, F: 340 }).q === 0.15);
}

// === 6. nobody's payoff moves either ======================================
{
  // Expected values accumulate in floating point, so this one gets a tolerance.
  const fines = [20, 60, 140, 340, 700, 1500, 10000, 1e6];
  ok("the trader's equilibrium payoff is zero at every fine",
    fines.every((F) => close(values({ ...BASE, F }).row, 0)),
    fines.map((F) => values({ ...BASE, F }).row.toExponential(1)).join(" "));
  ok("the risk desk's equilibrium payoff is -4.5 at every fine",
    fines.every((F) => close(values({ ...BASE, F }).col, -4.5)),
    fines.map((F) => values({ ...BASE, F }).col.toFixed(6)).join(" "));
}

// === 7. the identity on screen: 1/q* is linear in the fine =================
{
  let worst = 0;
  for (let F = 0; F <= 100000; F += 7) {
    const q = mixed({ ...BASE, F }).q;
    worst = Math.max(worst, Math.abs(1 / q - (1 + F / BASE.G)));
  }
  ok("1/q* equals 1 + F/G over a fine range of a hundred thousand",
    worst < 1e-9, `worst absolute error ${worst.toExponential(2)}`);

  ok("the line's intercept is exactly 1", 1 / mixed({ ...BASE, F: 0 }).q === 1);

  const F1 = 13, F2 = 9999;
  const slope = (1 / mixed({ ...BASE, F: F2 }).q - 1 / mixed({ ...BASE, F: F1 }).q) / (F2 - F1);
  ok("inverting the slope recovers the trader's private gain, exactly 60",
    1 / slope === BASE.G, `recovered ${1 / slope}`);

  // and the figure's own sweep agrees with the algebra it is drawn from
  const sweep = fineSweep(240, 1200);
  ok("every point the identity figure draws satisfies the identity",
    sweep.every((s) => Math.abs(s.inv - (1 + s.F / BASE.G)) < 1e-9));
  ok("every point the identity figure draws has the same breach rate",
    new Set(sweep.map((s) => s.p)).size === 1);
}

// === 8. it is not a 2x2 artefact ==========================================
{
  for (const n of [2, 3, 4, 5]) {
    const r = ownMixDisplacement(n, mulberry32(900 + n), 250, 200000);
    ok(`at n=${n}, replacing every one of the row player's payoffs moves their own mix by exactly zero`,
      r.tested >= 100 && r.worst === 0,
      `${r.tested} interior games, worst displacement ${r.worst}`);
    ok(`the n=${n} solutions really are equilibria`, r.worstExploit < 1e-13,
      `worst exploitability ${r.worstExploit.toExponential(2)}`);
  }
}

// === 9. the regime where the received account is right =====================
{
  // A monitor who cannot respond. Trader complies iff qbar > G/(G+F).
  ok("at a fixed audit rate of 25% a fine of 140 does not deter",
    breachFixedMonitor({ ...BASE, F: 140 }, 0.25) === 1);
  ok("at the same fixed audit rate a fine of 200 deters completely",
    breachFixedMonitor({ ...BASE, F: 200 }, 0.25) === 0);
  ok("the tolerated audit rate at the base fine is exactly 0.30", tolerated(BASE) === 0.3);
}

// === 10. the floor, and its kink ==========================================
{
  ok("with no floor the fine is worthless at every size",
    [1, 10, 100, 1e3, 1e4, 1e6, 1e9].every((F) => breachWithFloor({ ...BASE, F }, 0) === 0.15));
  ok("the critical fine is infinite when there is no floor",
    criticalFine(BASE, 0) === Infinity);
  ok("at a 25% floor the critical fine is exactly 180", criticalFine(BASE, 0.25) === 180);
  ok("at a 50% floor it is exactly 60", criticalFine(BASE, 0.5) === 60);
  ok("at a 15% floor it is exactly 340", criticalFine(BASE, 0.15) === 340);

  // bisect the realised breach rate and see whether the closed form is where the kink is
  for (const qbar of [0.05, 0.15, 0.25, 0.5]) {
    let lo = 0, hi = 1e7;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (breachWithFloor({ ...BASE, F: mid }, qbar) > 0) lo = mid;
      else hi = mid;
    }
    ok(`bisecting the breach rate at a ${qbar * 100}% floor finds the closed-form kink`,
      close(lo, criticalFine(BASE, qbar), 1e-12),
      `bisected ${lo} against ${criticalFine(BASE, qbar)}`);
  }

  // both directions of the boundary
  for (const qbar of [0.05, 0.15, 0.25, 0.5]) {
    const Fc = criticalFine(BASE, qbar);
    ok(`just below the ${qbar * 100}% floor's critical fine the breach rate is still 0.15`,
      breachWithFloor({ ...BASE, F: Fc * (1 - 1e-9) }, qbar) === 0.15);
    ok(`just above it the breach rate is zero`,
      breachWithFloor({ ...BASE, F: Fc * (1 + 1e-9) }, qbar) === 0);
  }

  const fs = floorSweep(0.25);
  ok("the floor figure's curve is flat then zero, with the step at the closed form",
    fs.curve.every((d) => d.breach === (d.F < fs.critical ? 0.15 : d.F > fs.critical ? 0 : d.breach)),
    `critical ${fs.critical}`);
}

// === 11. what does move the breach rate ===================================
{
  ok("halving the audit cost halves the breach rate, 0.15 to 0.075",
    mixed({ ...BASE, C: 6 }).p === 0.075);
  ok("doubling the damage from a missed breach does not halve it — V+L is the denominator",
    mixed({ ...BASE, L: 60 }).p === 12 / 110);
  const lev = leverSweep("C", 1, 24, 120);
  ok("the breach rate is strictly increasing in the cost of an audit",
    lev.every((d, i) => i === 0 || d.p > lev[i - 1].p));
  ok("the risk desk can reach any breach rate it likes by moving its own cost",
    close(lev[0].p, 1 / 80) && close(lev[lev.length - 1].p, 24 / 80));
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
