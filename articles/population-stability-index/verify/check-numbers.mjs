/*
  Every claim this article makes, re-derived from the same modules the page
  imports. Run with `npm run check`, and by `./verify/ship.sh` before anything
  is built for the browser pass.

  The rule these are written to (reference/verifying-an-article.md): write the
  check for the SENTENCE, not only for the number in it. A figure staying
  correct while the sentence around it stops being true is the failure this file
  exists for, so the assertions below read like the claims they defend.

  Where the subject has an identity in it - and this one has several - the check
  is an identity held to machine precision rather than a tolerance. Where a
  quantity has two derivations, both are computed and compared.
*/

import * as D from "../src/datasets.js";
import * as P from "../src/psi.js";
import * as S from "../src/stats.js";
import { mulberry32 } from "../src/rng.js";
import { PRE } from "../src/precomputed.js";
import { computeAll } from "../scripts/precompute.mjs";

let pass = 0, fail = 0;
const ok = (what, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ok   ${what}${detail ? "   " + detail : ""}`); }
  else { fail++; console.log(`  FAIL ${what}${detail ? "   " + detail : ""}`); }
};
const head = (s) => console.log(`\n--- ${s} ---`);
const f = (x, d = 5) => Number(x).toFixed(d);
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));

const M = D.BASELINE_N, B = D.DEFAULT_BINS;
const base = Array.from(D.mixSamples(D.BASELINE, M, mulberry32(D.BASELINE_SEED))).sort((a, b) => a - b);
const E10 = P.quantileEdges(base, B);
const e10 = Array.from({ length: B }, () => 1 / B);
const frozen = D.binProbs(D.BASELINE, E10);

/* =========================================================== 0. freshness */
head("0. the precompute is not stale");
{
  const fresh = computeAll();
  const a = JSON.stringify(fresh), b = JSON.stringify(PRE);
  if (a !== b) {
    /* name the first divergence rather than saying "they differ" */
    const keys = Object.keys(fresh);
    const bad = keys.filter((k) => JSON.stringify(fresh[k]) !== JSON.stringify(PRE[k]));
    ok("src/precomputed.js is what scripts/precompute.mjs produces today", false,
       "differing keys: " + bad.join(", ") + "  — run `npm run precompute`");
  } else {
    ok("src/precomputed.js is what scripts/precompute.mjs produces today", true,
       `${(b.length / 1024).toFixed(0)} KB, byte-identical`);
  }
}

/* ============================================= 1. identities, to the last bit */
head("1. identities the article states as identities");
{
  /* PSI IS the Kullback-Leibler divergence J */
  const rand = mulberry32(31337);
  let worstJ = 0;
  for (let t = 0; t < 20000; t++) {
    const K = 2 + Math.floor(rand() * 20);
    const a = Array.from({ length: K }, () => rand() + 1e-4);
    const b = Array.from({ length: K }, () => rand() + 1e-4);
    const A = a.map((x) => x / S.sum(a)), Ee = b.map((x) => x / S.sum(b));
    worstJ = Math.max(worstJ, rel(P.psi(A, Ee, 0), P.klParts(A, Ee, 0).jeffreys));
  }
  ok("the sum equals KL(A||E) + KL(E||A), which is what the Anatomy section claims",
     worstJ < 1e-10, `worst relative gap over 20,000 random pairs ${worstJ.toExponential(2)}`);

  /* every term non-negative - the claim the whole floor argument rests on */
  let neg = 0, zeroAtEqual = 0;
  const r2 = mulberry32(99);
  for (let t = 0; t < 20000; t++) {
    const K = 2 + Math.floor(r2() * 20);
    const a = Array.from({ length: K }, () => r2() + 1e-4);
    const b = Array.from({ length: K }, () => r2() + 1e-4);
    const A = a.map((x) => x / S.sum(a)), Ee = b.map((x) => x / S.sum(b));
    if (P.terms(A, Ee, 0).some((x) => x < -1e-15)) neg++;
    if (Math.abs(P.psi(A, A, 0)) > 1e-15) zeroAtEqual++;
  }
  ok("no bin can offset another: every term is non-negative", neg === 0, `${20000} draws, ${neg} negative terms`);
  ok("and PSI is exactly zero when the proportions match", zeroAtEqual === 0);

  /* the multiplicative mirror, (r-1)ln r = r * (1/r - 1) ln(1/r) */
  let worstR = 0;
  for (let i = 1; i <= 400; i++) {
    const r = 1 + i / 50;
    const a = (r - 1) * Math.log(r);
    const b = r * ((1 / r - 1) * Math.log(1 / r));
    worstR = Math.max(worstR, rel(a, b));
  }
  ok("a bin holding r times its share costs exactly r times one holding 1/r",
     worstR < 1e-12, `worst relative gap ${worstR.toExponential(2)} over r in (1, 9]`);

  /* quantile edges put exactly M/B baseline observations in every bin, so the
     expected proportions really are 1/B and not approximately */
  const divides = PRE.meta.binSet.filter((b) => M % b === 0);
  const others = PRE.meta.binSet.filter((b) => M % b !== 0);
  ok("where B divides M the bins hold EXACTLY M/B, so e = 1/B is exact and not approximate",
     divides.every((b) => P.countsIn(base, P.quantileEdges(base, b)).every((x) => x === M / b)),
     `B in {${divides.join(", ")}}, including the ${B} used throughout`);
  ok("  and where it does not, they are off by at most one observation in fifty thousand",
     others.every((b) => P.countsIn(base, P.quantileEdges(base, b)).every((x) => Math.abs(x - M / b) <= 1)),
     `B in {${others.join(", ")}}`);
}

/* ==================================== 2. the null law, and its two derivations */
head("2. the chi-square law under no drift");
{
  /* derivation one: brute force. Draw a real baseline, take its real deciles,
     ask what mass the population truly puts in them.
     derivation two: the spacings of uniform order statistics, Dirichlet(m+1, m...).
     They share no code. */
  const Mb = 4000, Bb = 10, m = Mb / Bb, REPS = 1800;
  const r1 = mulberry32(11);
  const bf = [];
  for (let t = 0; t < REPS; t++) {
    const b2 = Array.from(D.mixSamples(D.BASELINE, Mb, r1)).sort((a, b) => a - b);
    bf.push(D.binProbs(D.BASELINE, P.quantileEdges(b2, Bb)));
  }
  const r2 = mulberry32(12);
  const alpha = Array.from({ length: Bb }, (_, i) => (i === 0 ? m + 1 : m));
  const sc = [];
  for (let t = 0; t < REPS; t++) sc.push(S.dirichletSample(alpha, r2));
  const disp = (rows) => S.mean(rows.map((r) => r.reduce((s, x) => s + (x - 1 / Bb) ** 2, 0)));
  const d1 = disp(bf), d2 = disp(sc), theory = (1 - 1 / Bb) / (Mb + 1);
  ok("the Dirichlet shortcut the precompute uses reproduces brute-force quantile edges",
     rel(d1, d2) < 0.1 && rel(d1, theory) < 0.1,
     `brute ${d1.toExponential(3)}  dirichlet ${d2.toExponential(3)}  theory ${theory.toExponential(3)}`);

  /* the law itself, where the prose says it holds */
  for (const o of PRE.overlay) {
    const perBin = o.N / o.B;
    const tol = perBin >= 100 ? 0.02 : 0.05;
    ok(`scaled PSI has mean B-1 at B=${o.B}, N=${o.N} (${Math.round(perBin)} per bin)`,
       rel(o.mean, o.B - 1) < tol, `${f(o.mean, 3)} against ${o.B - 1}`);
    ok(`  and sd sqrt(2(B-1))`, rel(o.sd, Math.sqrt(2 * (o.B - 1))) < tol + 0.02,
       `${f(o.sd, 3)} against ${f(Math.sqrt(2 * (o.B - 1)), 3)}`);
  }
  const big = PRE.overlay.find((o) => o.N === 44000);
  ok("at 4,400 applications per bin the tail rate is the nominal 5%, as the caption says",
     near(big.tail, 0.05, 0.004), `${f(big.tail, 4)}`);

  /* the floor formula, against the simulated mean, where the approximation holds */
  const fine = PRE.nullGrid.filter((g) => g.N / B >= 100);
  const worstFloor = Math.max(...fine.map((g) => rel(g.mean, P.floorOf(B, g.N, M))));
  ok("E[PSI | nothing moved] = (B-1)(1/N + 1/M) above 100 applications per bin",
     worstFloor < 0.02, `worst relative gap ${f(worstFloor, 4)} across ${fine.length} sample sizes`);

  /* and the honest limit: it fails BELOW that, upward */
  const thin = PRE.chiApprox.filter((c) => c.B === 10 && c.perBin <= 20);
  ok("below 20 per bin the real floor is HIGHER than the formula, as the validity table says",
     thin.every((c) => c.ratio > 1 + 3 * c.ratioSe),
     thin.map((c) => `${c.perBin}/bin: ${f(c.ratio, 3)}`).join("  "));
  const four = PRE.chiApprox.find((c) => c.B === 10 && c.perBin === 4);
  ok("  at four per bin it is 1.7 times the formula", near(four.ratio, 1.75, 0.06), f(four.ratio, 3));
  const monotone = PRE.chiApprox.filter((c) => c.B === 10).every((c, i, arr) =>
    i === 0 || arr[i - 1].ratio >= c.ratio - 3 * (c.ratioSe + arr[i - 1].ratioSe));
  ok("  and the ratio falls toward 1 as the bins fill up", monotone);

  /* the frozen half */
  ok("the frozen half of the floor is the baseline's own error, (B-1)/M in expectation",
     PRE.frozenByB[B].psiFrozen > 0 && PRE.frozenByB[B].psiFrozen < 6 * (B - 1) / M,
     `${f(PRE.frozenByB[B].psiFrozen, 6)} against an expected ${f((B - 1) / M, 6)}`);
}

/* ========================================================= 3. the thresholds */
head("3. what the fixed thresholds do");
{
  const g = (n) => PRE.nullGrid.find((x) => x.N === n);
  ok("at 50 applications a population that did not move crosses 0.25 in about a quarter of months",
     g(50).pRed > 0.2 && g(50).pRed < 0.35, `${f(g(50).pRed, 4)}`);
  ok("at 100 it crosses 0.10 in about two months in five",
     g(100).pAmber > 0.33 && g(100).pAmber < 0.45, `${f(g(100).pAmber, 4)}`);
  ok("at 500 the problem has gone: it essentially never crosses 0.10",
     g(500).pAmber < 0.002, `${f(g(500).pAmber, 4)}`);
  ok("the false-alarm rate falls monotonically with N",
     PRE.nullGrid.every((x, i, a) => i === 0 || x.pAmber <= a[i - 1].pAmber + 1e-9));

  /* the sample size at which each threshold IS a 5% test */
  const c95 = S.chi2Inv(0.95, B - 1);
  const nFor = (th) => 1 / (th / c95 - 1 / M);
  ok("0.10 is an exactly calibrated 5% test at about 170 applications",
     near(nFor(0.1), 170, 3), `${f(nFor(0.1), 1)}`);
  ok("0.25 is one at about 68", near(nFor(0.25), 68, 2), `${f(nFor(0.25), 1)}`);
  const g170 = g(170);
  ok("  and the simulation agrees at that sample size",
     near(g170.pAmber, 0.05, 0.02), `${f(g170.pAmber, 4)} of months cross 0.10 at N=170`);

  /* the blindness half: the fixed threshold's detectable shift does not shrink */
  const pw = PRE.power;
  const fixed = pw.map((p) => p.fixedPts);
  const spread = (Math.max(...fixed) - Math.min(...fixed)) / S.mean(fixed);
  ok("the shift the 0.10 rule can detect is FLAT from 200 applications to a million",
     spread < 0.07, `${f(Math.min(...fixed), 2)} to ${f(Math.max(...fixed), 2)} points, spread ${f(spread * 100, 1)}%`);
  ok("while a sample-size-aware test's falls by more than an order of magnitude",
     pw[0].adaptivePts / pw[pw.length - 1].adaptivePts > 10,
     `${f(pw[0].adaptivePts, 2)} to ${f(pw[pw.length - 1].adaptivePts, 2)} points`);
  ok("  and falls monotonically after the smallest window",
     pw.slice(1).every((p, i, a) => i === 0 || p.adaptivePts <= a[i - 1].adaptivePts + 1e-9));

  /* the thresholds as effect sizes */
  const amber = PRE.psiToPoints.find((p) => p.psi === 0.1);
  const red = PRE.psiToPoints.find((p) => p.psi === 0.25);
  const recomputed = (() => {
    let lo = 0, hi = 200;
    for (let i = 0; i < 90; i++) {
      const mid = (lo + hi) / 2;
      if (P.psi(D.binProbs(D.shiftLocation(D.BASELINE, -mid), E10), e10, 0) < 0.1) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  })();
  ok("the lab's true-value readout is zero at zero drift, not the frozen error",
     PRE.shiftCurve[0].psiPop === 0 && PRE.shiftCurve[0].psi > 0,
     `psiPop ${PRE.shiftCurve[0].psiPop}, against e=1/B ${f(PRE.shiftCurve[0].psi, 6)}`);
  ok("  and rises monotonically with the shift",
     PRE.shiftCurve.every((r, i, a) => i === 0 || r.psiPop >= a[i - 1].psiPop));

  ok("0.10 is a third of a standard deviation, recomputed from the exact bin masses",
     rel(amber.points, recomputed) < 1e-6 && near(amber.sd, 0.314, 0.005),
     `${f(amber.points, 2)} points = ${f(amber.sd, 3)} sd`);
  ok("0.25 is about half of one", near(red.sd, 0.49, 0.01), `${f(red.points, 2)} points = ${f(red.sd, 3)} sd`);
  ok("by the amber line the approval rate has already moved eleven points",
     near(Math.abs(amber.dApprovalPP), 11.3, 0.3), `${f(amber.dApprovalPP, 2)} pts`);
  ok("and by the red line, eighteen", near(Math.abs(red.dApprovalPP), 18.5, 0.4), `${f(red.dApprovalPP, 2)} pts`);
}

/* ========================================================== 4. the four channels */
head("4. the monitoring pack the article opens and closes on");
{
  const S4 = Object.fromEntries(PRE.segments.map((s) => [s.id, s]));
  /* the expected readings, recomputed from the populations rather than read back */
  for (const sg of D.SEGMENTS) {
    const a = D.binProbs(sg.spec, E10);
    const truth = P.psi(a, e10, 0);
    const exp = truth + P.floorOf(B, sg.n, M);
    ok(`${sg.id}: the expected reading is the truth plus the floor`,
       rel(S4[sg.id].expRaw, exp) < 1e-6, `${f(S4[sg.id].expRaw, 5)}`);
  }
  ok("the highest expected reading in the pack belongs to a channel that did NOT move",
     S4.broker.expRaw > S4.online.expRaw && S4.broker.moved === false,
     `broker ${f(S4.broker.expRaw, 4)} > online ${f(S4.online.expRaw, 4)}`);
  ok("  and it beats the channel that moved in about three months out of four",
     S4.broker.pBeatsOnline > 0.65 && S4.broker.pBeatsOnline < 0.82, `${f(S4.broker.pBeatsOnline, 3)}`);
  ok("  and crosses 0.10 on nothing about once every two years",
     S4.broker.pAmber > 0.03 && S4.broker.pAmber < 0.07,
     `${f(S4.broker.pAmber, 4)} — one month in ${Math.round(1 / S4.broker.pAmber)}`);
  ok("the three channels with real volume never leave the green band all year",
     PRE.segments.filter((s) => s.n > 1000).every((s) => s.months.every((m) => m < 0.1)),
     `worst month ${f(Math.max(...PRE.segments.filter((s) => s.n > 1000).flatMap((s) => s.months)), 4)}`);
  ok("  while the 180-application panel reaches amber inside two years, on nothing",
     Math.max(...S4.broker.months) >= 0.1,
     `worst of 24 months ${f(Math.max(...S4.broker.months), 4)} — the Conclusion says one month in ${Math.round(1 / S4.broker.pAmber)}`);
  ok("the same truth — nothing moved — reads 36 times higher at 180 than at 9,300",
     near(S4.broker.expRaw / S4.branch.expRaw, 35, 6) && !S4.broker.moved && !S4.branch.moved,
     `${f(S4.broker.expRaw / S4.branch.expRaw, 1)}x, on identical populations`);

  /* subtracting the floor puts the ordering right */
  const byAdj = [...PRE.segments].sort((a, b) => b.expAdj - a.expAdj);
  ok("subtracting the floor recovers the right ordering: online, dealer, then the two that did not move",
     byAdj[0].id === "online" && byAdj[1].id === "dealer" && !byAdj[2].moved && !byAdj[3].moved,
     byAdj.map((s) => `${s.id} ${f(s.expAdj, 4)}`).join("  "));
  ok("  and the two that did not move land on the same number",
     rel(byAdj[2].expAdj, byAdj[3].expAdj) < 1e-6);

  /* the damage the pack does not report */
  const on = S4.online;
  ok("the Online shift is 15 points of mean score", near(on.damage.dMean, -15.3, 0.2), `${f(on.damage.dMean, 2)}`);
  ok("  8.4 points of approval rate", near(on.damage.dApprovalPP, -8.39, 0.05), `${f(on.damage.dApprovalPP, 3)}`);
  ok("  and 3,690 approvals", near(on.damage.dApprovals, -3690, 5), `${on.damage.dApprovals}`);
  ok("  recomputed independently from the exact integrals",
     rel(D.approvalRate(D.SEGMENTS[0].spec), on.damage.approval) < 1e-6);

  /* the closing section's flag rates: the size of the test on the two channels
     that did not move, the power on the two that did */
  const quiet = PRE.segments.filter((s) => !s.moved);
  ok("compared against its own no-drift band, a channel that did not move is flagged about 5% of the time",
     quiet.every((s) => s.pFlag > 0.03 && s.pFlag < 0.07),
     quiet.map((s) => `${s.id} ${f(s.pFlag, 4)}`).join("  ") + "  — which is what a 5% test does");
  ok("  and that is true at 180 applications as well as at 9,300, which the raw threshold never managed",
     Math.abs(S4.broker.pFlag - S4.branch.pFlag) < 0.03,
     `${f(S4.broker.pFlag, 4)} vs ${f(S4.branch.pFlag, 4)}`);
  ok("Online is flagged in essentially every month", S4.online.pFlag > 0.98, f(S4.online.pFlag, 4));
  ok("  and Motor dealer in about two months in three, which the prose does not round up",
     S4.dealer.pFlag > 0.55 && S4.dealer.pFlag < 0.72, f(S4.dealer.pFlag, 4));

  /* the month both sections draw is the same month */
  const drawMonth = (m) => {
    const rand = mulberry32(920000 + m * 7919);
    return PRE.segments.map((s) => {
      const c = S.multinomialSample(s.n, s.binProbs, rand);
      return P.psi(P.props(c), e10, 1e-4);
    });
  };
  const m1a = drawMonth(1), m1b = drawMonth(1);
  ok("the month the article opens on is reproducible",
     m1a.every((v, i) => v === m1b[i]), m1a.map((v) => f(v, 4)).join("  "));
  ok("  and in it the broker panel outscores the channel that lost 3,690 approvals",
     m1a[3] > m1a[0], `broker ${f(m1a[3], 4)} vs online ${f(m1a[0], 4)}`);
  ok("  while every reading is still green", m1a.every((v) => v < 0.1));
}

/* ============================================================ 5. the bin count */
head("5. bins");
{
  const SW = PRE.binSweep;
  const first = SW[0], last = SW[SW.length - 1];
  ok("the printed number is worth a factor of fourteen between 2 bins and 100",
     near(last.rawMean / first.rawMean, 14, 1.5), `${f(first.rawMean, 5)} to ${f(last.rawMean, 5)}`);
  ok("  and the raw reading rises monotonically with the bin count",
     SW.every((s, i) => i === 0 || s.rawMean > SW[i - 1].rawMean));
  /* Two earlier versions of this check used the wrong target and the article
     is better for both corrections. What the raw reading converges to, with a
     FIXED development sample, is psi(a, e) - which still carries that sample's
     own error. Subtracting the full floor removes the frozen half too, so the
     corrected reading estimates psi(a, e) - (B-1)/M. */
  const full = SW.filter((s) => s.perBin >= 80);
  const adjErr = full.map((s) => Math.abs(s.adjMean - s.adjTarget) / s.truePsi);
  ok("with at least 80 applications per bin, the corrected reading is what it should be",
     Math.max(...adjErr) < 0.05,
     `worst relative gap ${f(Math.max(...adjErr), 4)} across ${full.length} bin counts, up to B = ${Math.max(...full.map((s) => s.B))}`);
  ok("  and E[raw] is exactly that plus this month's half of the floor",
     SW.every((s) => rel(s.rawMean - s.truePsi, (s.B - 1) / PRE.binSweepMeta.N) < 0.2),
     `worst relative gap ${f(Math.max(...SW.map((s) => rel(s.rawMean - s.truePsi, (s.B - 1) / PRE.binSweepMeta.N))), 3)}`);

  /* the limit the article now draws, and the reason for it */
  const thin = SW.filter((s) => s.perBin < 40);
  ok("below 40 per bin the correction does not take off enough, which is the validity table again",
     thin.length > 0 && thin.every((s) => s.adjMean > s.adjTarget * 1.05),
     thin.map((s) => `B=${s.B} (${Math.round(s.perBin)}/bin) ${f(s.adjMean / s.adjTarget, 3)}x`).join("  "));
  ok("  and at 100 bins about a fifth of what is left is still floor, as the prose says",
     rel(SW[SW.length - 1].adjMean / SW[SW.length - 1].adjTarget, 1.2) < 0.06,
     `${f(SW[SW.length - 1].adjMean / SW[SW.length - 1].adjTarget, 3)}`);
  ok("  and the residue is exactly the gap between the real floor and the formula",
     thin.every((s) => rel(s.adjMean - s.adjTarget, (s.rawMean - s.truePsi) - (s.B - 1) / PRE.binSweepMeta.N) < 0.02),
     "corrected minus target equals realised floor minus (B-1)/N");
  ok("  while the corrected one moves by about two, a seventh as much",
     last.adjMean / first.adjMean < 2.5 && last.adjMean / first.adjMean > 1.5,
     `${f(first.adjMean, 5)} to ${f(last.adjMean, 5)}, a factor of ${f(last.adjMean / first.adjMean, 2)}`);

  ok("merging two adjacent bins never increases PSI",
     PRE.dpi.violations === 0, `${PRE.dpi.trials} merges, ${PRE.dpi.violations} violations`);
  ok("  so a genuinely nested refinement climbs the whole way",
     PRE.nested.every((r, i) => i === 0 || r.psi > PRE.nested[i - 1].psi),
     PRE.nested.map((r) => `${r.B}:${f(r.psi, 5)}`).join(" "));

  /* the sentence the article writes about the exception */
  const b6 = SW.find((s) => s.B === 6), b8 = SW.find((s) => s.B === 8);
  ok("the prose's exception is real: unnested quantile bins are NOT forced to climb, and at 8 they dip",
     b8.truePsi < b6.truePsi, `B=6 ${f(b6.truePsi, 5)}  B=8 ${f(b8.truePsi, 5)}`);
}

/* ================================================================= 6. zeros */
head("6. zeros");
{
  const E = PRE.emptyEps;
  const lo = E.rows.find((r) => r.eps === 1e-2).psi;
  const mid = E.rows.find((r) => r.eps === 1e-4).psi;
  const hi = E.rows.find((r) => r.eps === 1e-8).psi;
  ok("one empty bin plus the default epsilon moves a reading from amber to red",
     lo < 0.25 && mid > 0.25, `eps 1e-2 -> ${f(lo, 4)}, eps 1e-4 -> ${f(mid, 4)}`);
  ok("  and the epsilon is worth a factor of five across plausible values",
     hi / lo > 4.5, `${f(lo, 4)} to ${f(hi, 4)}`);
  ok("  while merging the bin gives an answer near the truth",
     E.merged.psi < mid / 2, `merged ${f(E.merged.psi, 4)} against a true ${f(E.truePsi, 4)}`);

  /* the honest half: on quantile bins of a continuous score it barely happens */
  const at10 = PRE.emptyRisk.filter((r) => r.B === 10 && r.label === "-20 points");
  ok("but at ten bins an empty bin barely ever happens, which the article says out loud",
     at10.every((r) => r.p < 0.01), at10.map((r) => `N=${r.N}: ${f(r.p, 4)}`).join("  "));
  const at50 = PRE.emptyRisk.filter((r) => r.B === 50 && r.label === "-20 points");
  ok("  it needs fifty bins to become common", at50.find((r) => r.N === 300).p > 0.2,
     at50.map((r) => `N=${r.N}: ${f(r.p, 3)}`).join("  "));

  /* the categorical case, where the zero is structural */
  const Z = PRE.zeros;
  ok("the rest of the characteristic contributes exactly nothing — only the new level moved",
     Z.withoutNew === 0, `${Z.withoutNew}`);
  const zlo = Z.byEps.find((r) => r.eps === 1e-2).psi;
  const zhi = Z.byEps.find((r) => r.eps === 1e-8).psi;
  ok("a single new category spans a hundredfold range on the epsilon alone",
     zhi / zlo > 50, `${f(zlo, 4)} to ${f(zhi, 4)}`);
  ok("  and folding it into 'other' gives a small number instead",
     Z.merged < Z.byEps.find((r) => r.eps === 1e-4).psi / 3, `${f(Z.merged, 4)}`);
  const r180 = Z.rareEmpty.find((r) => r.N === 180);
  ok("a level holding 0.8% of applications is missing from a 180-application window a quarter of the time",
     near(r180.pRarest, 0.236, 0.01), `${f(r180.pRarest, 4)}`);
}

/* ============================================================= 7. direction */
head("7. direction");
{
  const MI = PRE.mirror;
  ok("the mirror pair moves every bin by the same mass in opposite directions",
     MI.maxAntisymmetry < 1e-15, `worst antisymmetry ${MI.maxAntisymmetry.toExponential(2)}`);
  ok("  so the approval rate moves by exactly the same amount either way",
     rel(MI.approvalUp, -MI.approvalDown) < 1e-6, `${f(MI.approvalUp, 3)} and ${f(MI.approvalDown, 3)} points`);
  ok("the Pearson part is identical for the two, so the whole gap is the cubic term and beyond",
     rel(MI.quadUp, MI.quadDown) < 1e-7, `${f(MI.quadUp, 8)} vs ${f(MI.quadDown, 8)}`);
  ok("  yet PSI calls the improvement the bigger problem",
     MI.psiUp > MI.psiDown && MI.approvalUp > 0 && MI.approvalDown < 0,
     `improvement ${f(MI.psiUp, 5)} vs deterioration ${f(MI.psiDown, 5)}, ratio ${f(MI.psiUp / MI.psiDown, 3)}`);

  ok("emptying a bin costs more than filling it by the same mass, always",
     PRE.additiveMirror.every((r) => r.ratio > 1));
  ok("  and by more, the bigger the move",
     PRE.additiveMirror.every((r, i, a) => i === 0 || r.ratio > a[i - 1].ratio),
     PRE.additiveMirror.map((r) => f(r.ratio, 2)).join(" "));
  const half = PRE.additiveMirror.find((r) => Math.abs(r.d - 0.05) < 1e-9);
  ok("  1.7 times at a decile that loses or gains half its share", near(half.ratio, 1.71, 0.02), f(half.ratio, 3));

  /* the idea the article explicitly rejects */
  const shares = PRE.klSplit.map((k) => k.share);
  ok("the split into the two KL halves carries nothing — it is a coin flip on all thirteen shifts",
     Math.min(...shares) > 0.45 && Math.max(...shares) < 0.56,
     `${f(Math.min(...shares), 3)} to ${f(Math.max(...shares), 3)}`);

  /* the claim that did NOT survive, kept as a check so it cannot creep back */
  ok("which sample defines the bins does NOT change the expected reading (an earlier draft said it did)",
     PRE.binSide.every((r) => Math.abs(r.mean - 1) < 0.12),
     PRE.binSide.map((r) => `${r.id} ${f(r.mean, 3)}`).join("  "));
  ok("  though on a small window the two directions disagree by a factor of four in a given month",
     PRE.binSide.find((r) => r.id === "broker").q95 /
     PRE.binSide.find((r) => r.id === "broker").q05 > 3,
     `broker q05 ${f(PRE.binSide[3].q05, 3)} q95 ${f(PRE.binSide[3].q95, 3)}`);
}

/* ============================================================== 8. blindness */
head("8. what happens inside a bin");
{
  const breaks = D.breaksFromEdges(D.BASELINE, E10);
  for (const w of PRE.within) {
    /* recompute the warped bin masses from the transform, do not read them back */
    const a = Array.from({ length: B }, (_, i) => {
      const lo = i === 0 ? -1e9 : E10[i - 1];
      const hi = i === B - 1 ? 1e9 : E10[i];
      return D.warpedCdf(D.BASELINE, breaks, w.gamma, hi) - D.warpedCdf(D.BASELINE, breaks, w.gamma, lo);
    });
    const gap = Math.max(...a.map((x, i) => Math.abs(x - frozen[i])));
    ok(`rearranging inside every decile (gamma ${w.gamma}) leaves the bin masses identical`,
       gap === 0, `largest difference ${gap}`);
  }
  const strong = PRE.within[PRE.within.length - 1];
  ok("  while moving the mean 13 points and the expected bad rate by half",
     near(strong.dMean, -12.7, 0.4) && strong.dMeanPdPct > 45,
     `${f(strong.dMean, 1)} points, bad rate +${f(strong.dMeanPdPct, 0)}%`);

  /* the cut-off really is inside a bin */
  const cb = P.binOf(D.CUTOFF, E10);
  ok("the cut-off sits inside decile 4, not on a bin edge",
     cb + 1 === PRE.bunchGeom.bin && D.CUTOFF > E10[cb - 1] && D.CUTOFF < E10[cb],
     `decile ${cb + 1} runs ${f(E10[cb - 1], 1)} to ${f(E10[cb], 1)}`);
  const bn = PRE.bunching[3];
  ok("nudging 45% of that bin's sub-cut-off mass across the line changes no decile count",
     bn.psi === 0);
  ok("  and moves the approval rate 1.7 points", near(bn.dApprovalPP, 1.71, 0.03), `${f(bn.dApprovalPP, 3)}`);
  ok("  with the nudged applications carrying nearly three times the accepted book's risk",
     bn.pdOfMoved / PRE.population.acceptedBad > 2.5,
     `${f(bn.pdOfMoved, 4)} against ${f(PRE.population.acceptedBad, 4)}`);
  ok("  and more nudging always costs more", PRE.bunching.every((r, i, a) => i === 0 || r.acceptedBad > a[i - 1].acceptedBad));
}

/* ================================================================ 9. damage */
head("9. what a reading is worth");
{
  const S9 = PRE.scenarios;
  const worst4 = [...S9].sort((a, b) => b.dBadPer1000 - a.dBadPer1000).slice(0, 4);
  ok("the four most expensive months are all concept drift, and all have the LOWEST PSI",
     worst4.every((s) => s.kind === "concept"),
     worst4.map((s) => `${s.label} PSI ${f(s.psi, 4)} +${f(s.dBadPer1000, 2)}`).join("  |  "));
  ok("  and every one of them sits inside the green band",
     worst4.every((s) => s.psi < 0.1));
  const c40 = S9.find((s) => s.kind === "concept" && s.param === 40);
  ok("forty points of calibration drift nearly doubles the losses",
     c40.badPer1000 / PRE.population.badPer1000 > 1.9, `${f(c40.badPer1000, 2)} against ${f(PRE.population.badPer1000, 2)} per 1,000`);
  ok("  while AUC barely moves, so the rank-order check does not catch it either",
     Math.abs(c40.auc - PRE.population.auc) < 0.01, `${f(c40.auc, 4)} against ${f(PRE.population.auc, 4)}`);
  ok("  and the observed-against-expected table does catch it, in every band",
     PRE.conceptBands[3].byBin.every((r) => r.observed / r.expected > 1.3));

  const a = S9.find((s) => s.kind === "spread" && s.param === 1.2);
  const b = S9.find((s) => s.kind === "mix" && s.param === 0.22);
  ok("the article's near-tie pair really is a near tie",
     Math.abs(a.psi - b.psi) < 0.0025, `${f(a.psi, 4)} and ${f(b.psi, 4)}`);
  ok("  with opposite signs on both consequences",
     a.dBadPer1000 * b.dBadPer1000 < 0 && a.dApprovalPP * b.dApprovalPP < 0,
     `${f(a.dBadPer1000, 2)} vs +${f(b.dBadPer1000, 2)} bad per 1,000`);

  /* the large-N end */
  const L = PRE.large;
  ok("at four million transactions a PSI of 0.01 is a hundred standard errors above its floor",
     (L.psi - L.floor) / (Math.sqrt(2 * (B - 1)) * (1 / L.N + 1 / M)) > 100,
     `z = ${f((L.psi - L.floor) / (Math.sqrt(2 * (B - 1)) * (1 / L.N + 1 / M)), 0)}, reported as no significant change`);
  ok("  and worth about thirty per cent more alerts at a 1% rule",
     near(L.alertRatio, 1.29, 0.02), `${f(L.alertRatio, 3)}x the volume`);
  ok("  from a shift of a tenth of a standard deviation", near(L.sd, 0.104, 0.003), `${f(L.sd, 3)} sd`);
}

/* =========================================================== 10. the scorecard */
head("10. the scorecard itself is a plausible one");
{
  const p = PRE.population;
  ok("approval rate, bad rate and AUC are what the intro says",
     near(p.approvalRate, 0.666, 0.002) && near(p.badRate, 0.0415, 0.001) && near(p.auc, 0.848, 0.003),
     `approval ${f(p.approvalRate, 4)}  bad ${f(p.badRate, 4)}  AUC ${f(p.auc, 4)}`);
  ok("  and are re-derived from the mixture, not read back",
     rel(D.approvalRate(D.BASELINE), p.approvalRate) < 1e-6 && rel(D.auc(D.BASELINE), p.auc) < 1e-6);
  ok("the odds really do double every PDO points",
     near(Math.exp(D.logOddsBad(600) - D.logOddsBad(600 + D.PDO)), 2, 1e-9));
  ok("the score range the charts draw holds essentially all of the population",
     D.mixCdf(D.BASELINE, 380) < 0.002 && 1 - D.mixCdf(D.BASELINE, 900) < 0.001,
     `${(D.mixCdf(D.BASELINE, 380) * 100).toFixed(3)}% below 380, ${((1 - D.mixCdf(D.BASELINE, 900)) * 100).toFixed(3)}% above 900`);

  /* the samplers the whole simulation rests on */
  const r = mulberry32(9);
  let s = 0, s2 = 0;
  const R = 60000, n = 4000, pr = 0.1;
  for (let t = 0; t < R; t++) { const x = S.binomialSample(n, pr, r); s += x; s2 += x * x; }
  const mu = s / R, va = s2 / R - mu * mu;
  ok("the exact binomial sampler is exact (the simulation cannot approximate what it is testing)",
     rel(mu, n * pr) < 0.004 && rel(va, n * pr * (1 - pr)) < 0.04,
     `mean ${f(mu, 2)}/${n * pr}  var ${f(va, 1)}/${f(n * pr * (1 - pr), 1)}`);
  ok("chi2Inv inverts chi2Cdf", [1, 5, 9, 19, 49].every((k) =>
     [0.05, 0.5, 0.95, 0.99].every((q) => rel(S.chi2Cdf(S.chi2Inv(q, k), k), q) < 1e-8)));
  ok("normInv inverts normCdf, including in the tail",
     [1e-6, 0.01, 0.5, 0.99, 1 - 1e-6].every((q) => rel(S.normCdf(S.normInv(q)), q) < 1e-9));
}

console.log(`\n${fail === 0 ? `ALL ${pass} CHECKS PASS` : `${fail} of ${pass + fail} CHECKS FAILED`}\n`);
process.exit(fail === 0 ? 0 : 1);
