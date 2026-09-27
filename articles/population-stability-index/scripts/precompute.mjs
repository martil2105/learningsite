/*
  Everything in this article that is too slow to compute while a page is
  loading, computed from the same modules in src/ that the page imports, and
  written to src/precomputed.js.

  The discipline (reference/verifying-an-article.md): this file exports
  computeAll() and only writes when it is run directly, so the FIRST check in
  verify/check-numbers.mjs can call computeAll() and deep-diff the result
  against the committed file. A stale precompute is then a failing check rather
  than a quiet lie, which is a stronger guarantee than computing in the browser
  would give - it also catches the case where a dataset changed and nobody
  re-ran anything.

  What is NOT here: every population quantity that has a closed form or an
  exact integral. Bin masses, approval rates, bad rates and AUC are integrals
  against the generating mixture and are computed exactly, here and in the
  checks. Only the genuinely stochastic quantities are simulated - which is
  most of the article, because sampling is its subject.

  Runtime: about two minutes.
*/

import * as D from "../src/datasets.js";
import * as P from "../src/psi.js";
import * as S from "../src/stats.js";
import { mulberry32 } from "../src/rng.js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const M = D.BASELINE_N;
const B0 = D.DEFAULT_BINS;
const BIN_SET = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100];
const REPS = 20000;
const r6 = (x) => Math.round(x * 1e6) / 1e6;
const r8 = (x) => Math.round(x * 1e8) / 1e8;

/* The development sample. Drawn once from a fixed seed and never redrawn -
   which is what a development sample is. Its own sampling error is frozen into
   the bin edges for the life of the model, and the article makes a point of
   that: the 1/M half of the noise floor is a permanent offset on every future
   month, not something that averages out. */
function baselineSample() {
  return Array.from(D.mixSamples(D.BASELINE, M, mulberry32(D.BASELINE_SEED))).sort((a, b) => a - b);
}

/*
  Sampling the null WITHOUT drawing a fresh 50,000-point baseline every time.

  The bin edges are the (kM/B)-th order statistics of the baseline, so the true
  population mass falling in those B bins is the vector of spacings between
  those order statistics, which is exactly Dirichlet(m+1, m, ..., m) with
  m = M/B. Drawing p from that and then Multinomial(N, p) is therefore an exact
  simulation of the two-sample setting, not an approximation - and it costs
  O(B) instead of O(M). check-numbers.mjs asserts it against brute force.
*/
function nullDraws(B, N, reps, seed) {
  const rand = mulberry32(seed);
  const m = M / B;
  const alpha = Array.from({ length: B }, (_, i) => (i === 0 ? m + 1 : m));
  const e = Array.from({ length: B }, () => 1 / B);
  const out = new Float64Array(reps);
  for (let t = 0; t < reps; t++) {
    const p = S.dirichletSample(alpha, rand);
    out[t] = P.psi(P.props(S.multinomialSample(N, p, rand)), e, 1e-6);
  }
  return out;
}

const q = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)))];

function summarise(v) {
  const s = Array.from(v).sort((a, b) => a - b);
  const mu = S.mean(s);
  return {
    mean: mu,
    sd: Math.sqrt(S.mean(s.map((x) => (x - mu) ** 2))),
    q05: q(s, 0.05), q25: q(s, 0.25), q50: q(s, 0.5), q75: q(s, 0.75), q95: q(s, 0.95),
    q99: q(s, 0.99),
    pAmber: s.filter((x) => x >= 0.1).length / s.length,
    pRed: s.filter((x) => x >= 0.25).length / s.length,
  };
}

export function computeAll(log = () => {}) {
  const base = baselineSample();

  /* ------------------------------------------------- edges and frozen error */
  log("edges");
  const edgesByB = {};
  const frozenByB = {};
  for (const B of BIN_SET) {
    const ed = P.quantileEdges(base, B);
    edgesByB[B] = ed.map(r6);
    const trueP = D.binProbs(D.BASELINE, ed);
    const e = Array.from({ length: B }, () => 1 / B);
    frozenByB[B] = { trueP: trueP.map(r8), psiFrozen: r8(P.psi(trueP, e, 0)) };
  }
  const E10 = P.quantileEdges(base, B0);
  const e10 = Array.from({ length: B0 }, () => 1 / B0);

  /* --------------------------------------------------- population constants */
  log("population");
  const L = D.BASELINE;
  const bad1000 = (spec, pdFn) => D.approvalRate(spec) * D.acceptedBadRate(spec, D.CUTOFF, pdFn) * 1000;
  const population = {
    mean: r6(D.mixMean(L)), sd: r6(D.mixSd(L)),
    badRate: r6(D.badRate(L)), approvalRate: r6(D.approvalRate(L)),
    acceptedBad: r6(D.acceptedBadRate(L)), auc: r6(D.auc(L)),
    badPer1000: r6(bad1000(L, D.pd)),
    p001: r6(D.mixQuantile(L, 0.001)), p999: r6(D.mixQuantile(L, 0.999)),
    thinShare: L[1].w,
  };

  /* ------------------------------- how a location shift maps onto a reading */
  log("shift curve");
  const shiftCurve = [];
  for (let d = 0; d <= 60; d += 1) {
    const a = D.binProbs(D.shiftLocation(L, -d), E10);
    shiftCurve.push({ points: d, sd: r6(d / population.sd), psi: r8(P.psi(a, e10, 0)),
                      psiPop: r8(P.psi(a, D.binProbs(L, E10), 0)) });
  }
  const pointsForPsi = (target) => {
    let lo = 0, hi = 200;
    for (let i = 0; i < 90; i++) {
      const mid = (lo + hi) / 2;
      if (P.psi(D.binProbs(D.shiftLocation(L, -mid), E10), e10, 0) < target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const psiToPoints = [0.005, 0.01, 0.02, 0.05, 0.1, 0.15, 0.25].map((psi) => {
    const pts = pointsForPsi(psi);
    const sp = D.shiftLocation(L, -pts);
    return { psi, points: r6(pts), sd: r6(pts / population.sd),
             dApprovalPP: r6((D.approvalRate(sp) - D.approvalRate(L)) * 100) };
  });

  /* ---------------------------------------------------- the null, over N */
  log("null grid");
  const N_GRID = [30, 40, 50, 65, 80, 100, 125, 150, 170, 200, 250, 300, 400, 500, 650, 800,
                  1000, 1500, 2000, 3000, 5000, 8000, 12000, 20000, 35000, 60000, 100000, 200000];
  const nullGrid = N_GRID.map((N) => {
    const v = nullDraws(B0, N, REPS, 900000 + N);
    const s = summarise(v);
    return {
      N,
      floor: r8(P.floorOf(B0, N, M)),
      mean: r8(s.mean), sd: r8(s.sd),
      q05: r8(s.q05), q25: r8(s.q25), q50: r8(s.q50), q75: r8(s.q75), q95: r8(s.q95), q99: r8(s.q99),
      pAmber: r6(s.pAmber), pRed: r6(s.pRed),
      scaledMean: r6(s.mean / (1 / N + 1 / M)),
    };
  });

  /* --------------------- the chi-square approximation's own range of validity */
  log("chi2 validity");
  const chiApprox = [];
  for (const [B, N] of [[10, 40], [10, 60], [10, 100], [10, 150], [10, 200], [10, 300], [10, 500],
                        [10, 1000], [10, 3000], [10, 10000], [10, 50000],
                        [20, 200], [20, 1000], [5, 100], [5, 1000], [50, 1000], [50, 10000]]) {
    const reps = 50000;
    const v = nullDraws(B, N, reps, 770000 + B * 977 + N);
    const scale = 1 / (1 / N + 1 / M);
    const sc = Array.from(v, (x) => x * scale);
    const crit = S.chi2Inv(0.95, B - 1);
    const mu = S.mean(sc);
    const sd = Math.sqrt(S.mean(sc.map((x) => (x - mu) ** 2)));
    chiApprox.push({
      B, N, perBin: r6(N / B), reps,
      ratio: r6(mu / (B - 1)),
      /* the Monte Carlo error on that ratio, so the prose does not read a
         1.003 as a real 0.3% when it is two standard errors of nothing */
      ratioSe: r6(sd / Math.sqrt(reps) / (B - 1)),
      tail: r6(sc.filter((x) => x > crit).length / sc.length),
    });
  }

  /* --------------------------------- the overlay: simulated law vs chi-square */
  log("overlay histograms");
  const overlay = [];
  const OV_REPS = 35000;
  for (const [B, N] of [[10, 180], [10, 2600], [10, 44000], [20, 1000], [5, 500]]) {
    const v = nullDraws(B, N, OV_REPS, 550000 + B * 31 + N);
    const scale = 1 / (1 / N + 1 / M);
    const sc = Array.from(v, (x) => x * scale).sort((a, b) => a - b);
    const hi = Math.max(S.chi2Inv(0.999, B - 1), q(sc, 0.999));
    const NB = 50, w = hi / NB;
    const counts = new Array(NB).fill(0);
    for (const x of sc) { const i = Math.floor(x / w); if (i >= 0 && i < NB) counts[i]++; }
    overlay.push({
      B, N, reps: OV_REPS, width: r6(w),
      density: counts.map((c) => r6(c / sc.length / w)),
      chi2: Array.from({ length: NB }, (_, i) => {
        const x = (i + 0.5) * w, k = B - 1;
        return r6(Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - S.lnGamma(k / 2)));
      }),
      mean: r6(S.mean(sc)), sd: r6(Math.sqrt(S.mean(sc.map((x) => (x - S.mean(sc)) ** 2)))),
      tail: r6(sc.filter((x) => x > S.chi2Inv(0.95, B - 1)).length / sc.length),
    });
  }

  /* ---------------------------------------------------------------- power */
  log("power");
  const powerAt = (thr, d, N, reps, seed) => {
    const a = D.binProbs(D.shiftLocation(L, -d), E10);
    const rand = mulberry32(seed);
    let k = 0;
    for (let t = 0; t < reps; t++) if (P.psi(P.props(S.multinomialSample(N, a, rand)), e10, 1e-4) >= thr) k++;
    return k / reps;
  };
  const solvePower = (thr, N, seed) => {
    let lo = 0, hi = 90;
    for (let i = 0; i < 13; i++) {
      const mid = (lo + hi) / 2;
      if (powerAt(thr, mid, N, 2500, seed + i) < 0.8) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const power = [200, 350, 500, 1000, 2000, 5000, 12000, 44000, 150000, 1000000].map((N) => {
    const crit = S.chi2Inv(0.95, B0 - 1) * (1 / N + 1 / M);
    return {
      N,
      crit: r8(crit),
      fixedPts: r6(solvePower(0.1, N, 120000 + N)),
      adaptivePts: r6(solvePower(crit, N, 340000 + N)),
    };
  });

  /* ------------------------------------------------------ the bin count */
  log("bin sweep");
  const sweepN = D.SEGMENTS.find((s) => s.id === "dealer").n;
  const sweepShift = 6;
  const sweepSpec = D.shiftLocation(L, -sweepShift);
  const binSweep = BIN_SET.map((B) => {
    const ed = P.quantileEdges(base, B);
    const e = Array.from({ length: B }, () => 1 / B);
    const a = D.binProbs(sweepSpec, ed);
    const q = D.binProbs(L, ed);
    /* Two different "truths", and the difference matters.
       truePsi  - what an infinitely long month would print, measured against
                  the bin edges as the pack does, so it still carries whatever
                  the development sample got wrong.
       truePop  - the divergence between the two POPULATIONS, which is what the
                  corrected reading is an estimate of, because subtracting
                  (B-1)(1/N + 1/M) removes the frozen half of the floor too. */
    const truePsi = P.psi(a, e, 0);
    const truePop = P.psi(a, q, 0);
    const fl = P.floorOf(B, sweepN, M);
    const rand = mulberry32(600000 + B);
    let s = 0; const reps = 6000;
    for (let t = 0; t < reps; t++) s += P.psi(P.props(S.multinomialSample(sweepN, a, rand)), e, 1e-4);
    return {
      B, perBin: r6(sweepN / B),
      truePsi: r8(truePsi), truePop: r8(truePop), floor: r8(fl),
      /* what the corrected reading is an estimate of: the limit the raw reading
         converges to, minus the frozen half of the floor that the subtraction
         also removes. Accurate while the bins are full; see the check. */
      adjTarget: r8(truePsi - (B - 1) / M),
      rawMean: r8(s / reps), adjMean: r8(s / reps - fl) };
  });

  /*
    Merging two adjacent bins can never increase an f-divergence, so refining a
    partition can never decrease PSI. Checked rather than cited, over random
    (actual, expected) pairs at every bin count from 3 to 30.
  */
  log("data processing");
  const dpi = (() => {
    const rand = mulberry32(4242);
    let trials = 0, violations = 0, worst = 0;
    for (let t2 = 0; t2 < 3000; t2++) {
      const K = 3 + Math.floor(rand() * 28);
      const a = Array.from({ length: K }, () => rand() ** 2 + 1e-3);
      const e = Array.from({ length: K }, () => rand() ** 2 + 1e-3);
      const na = S.sum(a), ne = S.sum(e);
      const A = a.map((x) => x / na), E2 = e.map((x) => x / ne);
      const before = P.psi(A, E2, 0);
      for (let i = 0; i + 1 < K; i++) {
        const A2 = A.slice(), E3 = E2.slice();
        A2.splice(i, 2, A[i] + A[i + 1]);
        E3.splice(i, 2, E2[i] + E2[i + 1]);
        const after = P.psi(A2, E3, 0);
        trials++;
        if (after > before + 1e-12) { violations++; worst = Math.max(worst, after - before); }
      }
    }
    return { trials, violations, worst };
  })();

  /*
    Quantile bins at two different B are NOT nested, so nothing forces the true
    divergence to increase with B - and in the sweep above it does not, quite.
    What IS forced is that a genuine refinement never decreases it. This chain
    is nested by construction: 100 quantile bins merged 2-for-1 down to 2.
  */
  log("nested chain");
  const nested = (() => {
    const ed64 = P.quantileEdges(base, 64);
    let a = D.binProbs(sweepSpec, ed64);
    let e = Array.from({ length: 64 }, () => 1 / 64);
    const chain = [{ B: 64, psi: r8(P.psi(a, e, 0)) }];
    while (a.length > 2) {
      const a2 = [], e2 = [];
      for (let i = 0; i < a.length; i += 2) { a2.push(a[i] + a[i + 1]); e2.push(e[i] + e[i + 1]); }
      a = a2; e = e2;
      chain.push({ B: a.length, psi: r8(P.psi(a, e, 0)) });
    }
    return chain.reverse();
  })();

  /* ------------------------------------------------------- the empty bin */
  log("empty bins");
  const emptyB = 20, emptyN = 300;
  const emptyEdges = P.quantileEdges(base, emptyB);
  const emptyE = Array.from({ length: emptyB }, () => 1 / emptyB);
  const emptyA = D.binProbs(D.shiftLocation(L, -20), emptyEdges);
  let emptyCounts = null;
  {
    const rand = mulberry32(808);
    for (let t = 0; t < 6000 && !emptyCounts; t++) {
      const c = S.multinomialSample(emptyN, emptyA, rand);
      if (c.filter((x) => x === 0).length === 1) emptyCounts = c;
    }
  }
  const mergedEmpty = (() => {
    const c = emptyCounts.slice(), ee = emptyE.slice();
    for (let i = 0; i < c.length; i++) if (c[i] === 0) {
      const j = i > 0 ? i - 1 : i + 1;
      c[j] += c[i]; ee[j] += ee[i]; c[i] = null; ee[i] = null;
    }
    const c2 = c.filter((x) => x !== null), e2 = ee.filter((x) => x !== null);
    const tot = S.sum(e2);
    return { bins: c2.length, psi: r6(P.psi(P.props(c2), e2.map((x) => x / tot), 0)) };
  })();
  const emptyEps = {
    B: emptyB, N: emptyN, counts: emptyCounts,
    rows: [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-8].map((eps) => ({ eps, psi: r6(P.psi(P.props(emptyCounts), emptyE, eps)) })),
    merged: mergedEmpty,
    truePsi: r6(P.psi(emptyA, emptyE, 0)),
    pEmptyByN: [150, 200, 300, 500, 1000, 2000, 5000].map((N) => {
      const rand = mulberry32(9100 + N);
      let k = 0; const reps = 4000;
      for (let t = 0; t < reps; t++) if (S.multinomialSample(N, emptyA, rand).some((x) => x === 0)) k++;
      return { N, p: r6(k / reps) };
    }),
  };

  /* ------------------------------------------------------- zeros, honestly */
  log("zeros");
  const emptyRisk = [];
  for (const B of [10, 20, 50]) {
    const ed = P.quantileEdges(base, B);
    for (const [label, spec] of [["no drift", L], ["-20 points", D.shiftLocation(L, -20)]]) {
      const a = D.binProbs(spec, ed);
      for (const N of [100, 180, 300, 1000, 5000]) {
        const rand = mulberry32(88000 + B * 131 + N + label.length);
        let k = 0; const reps = 6000;
        for (let t2 = 0; t2 < reps; t2++) if (S.multinomialSample(N, a, rand).some((x) => x === 0)) k++;
        emptyRisk.push({ B, N, label, p: r6(k / reps) });
      }
    }
  }

  /* A categorical characteristic, where the zero is structural rather than
     unlucky: the new level has an EXPECTED proportion of exactly zero. */
  const catShare = 0.015;
  const catLevels = D.withNewLevel(D.RESIDENTIAL, catShare);
  const catE = catLevels.map((l) => (l.isNew ? 0 : D.RESIDENTIAL.find((r) => r.code === l.code).p));
  const catA = catLevels.map((l) => l.p);
  const zeros = {
    share: catShare,
    levels: catLevels.map((l) => ({ code: l.code, expected: r6(l.isNew ? 0 : D.RESIDENTIAL.find((r) => r.code === l.code).p), actual: r6(l.p), isNew: !!l.isNew })),
    byEps: [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-8].map((eps) => ({ eps, psi: r6(P.psi(catA, catE, eps)) })),
    /* the honest alternative: fold the new level into "Other" and say so */
    merged: (() => {
      const idxOther = D.RESIDENTIAL.findIndex((l) => l.code === "Other");
      const a = D.RESIDENTIAL.map((l, i) => catA[i] + (i === idxOther ? catShare : 0));
      const e = D.RESIDENTIAL.map((l) => l.p);
      return r6(P.psi(a, e, 0));
    })(),
    /* and what the rest of the characteristic did on its own */
    withoutNew: (() => {
      const a = D.RESIDENTIAL.map((l, i) => catA[i] / (1 - catShare));
      return r6(P.psi(a, D.RESIDENTIAL.map((l) => l.p), 0));
    })(),
    /* a rare level going empty by chance, which is the other way in */
    rareEmpty: [180, 500, 2000, 10000].map((N) => {
      const pEmpty = D.RESIDENTIAL.map((l) => Math.pow(1 - l.p, N));
      return { N, pRarest: r6(pEmpty[5]), pAny: r6(1 - pEmpty.reduce((s, q2) => s * (1 - q2), 1)) };
    }),
  };

  /* --------------------------------------------------------- the segments */
  log("segments");
  const segments = D.SEGMENTS.map((sg) => {
    const a = D.binProbs(sg.spec, E10);
    const truePsi = P.psi(a, e10, 0);
    const fl = P.floorOf(B0, sg.n, M);
    const rand = mulberry32(430000 + sg.n);
    const months = [];
    for (let t = 0; t < 24; t++) months.push(r6(P.psi(P.props(S.multinomialSample(sg.n, a, rand)), e10, 1e-4)));
    const dist = (() => {
      const rand2 = mulberry32(431000 + sg.n);
      const v = [];
      for (let t = 0; t < 40000; t++) v.push(P.psi(P.props(S.multinomialSample(sg.n, a, rand2)), e10, 1e-4));
      const s = v.sort((x, y) => x - y);
      return { q05: r6(q(s, 0.05)), q50: r6(q(s, 0.5)), q95: r6(q(s, 0.95)),
               pAmber: r6(s.filter((x) => x >= 0.1).length / s.length),
               pRed: r6(s.filter((x) => x >= 0.25).length / s.length), sorted: s };
    })();
    return {
      id: sg.id, name: sg.name, n: sg.n, moved: sg.moved, truth: sg.truth,
      truePsi: r8(truePsi), floor: r8(fl), expRaw: r8(truePsi + fl), expAdj: r8(truePsi),
      months, q05: dist.q05, q50: dist.q50, q95: dist.q95, pAmber: dist.pAmber, pRed: dist.pRed,
      binProbs: a.map(r6),
      damage: {
        mean: r6(D.mixMean(sg.spec)),
        dMean: r6(D.mixMean(sg.spec) - population.mean),
        approval: r6(D.approvalRate(sg.spec)),
        dApprovalPP: r6((D.approvalRate(sg.spec) - D.approvalRate(L)) * 100),
        dApprovals: Math.round((D.approvalRate(sg.spec) - D.approvalRate(L)) * sg.n),
        acceptedBad: r6(D.acceptedBadRate(sg.spec)),
        auc: r6(D.auc(sg.spec)),
        badPer1000: r6(bad1000(sg.spec, D.pd)),
      },
    };
  });
  /* How often each channel is flagged when it is compared against its OWN
     no-drift band. For the two that did not move this is the size of the test
     and should come out near 5%; for the two that did it is the power. The
     closing section reports all four rather than claiming the verdict column
     never flickers, which it does, by construction. */
  log("flag rates");
  for (const sg of segments) {
    const rand0 = mulberry32(437000 + sg.n);
    const nullV = [];
    for (let t2 = 0; t2 < 20000; t2++)
      nullV.push(P.psi(P.props(S.multinomialSample(sg.n, D.binProbs(L, E10), rand0)), e10, 1e-4));
    nullV.sort((a, b) => a - b);
    const q95 = nullV[Math.floor(0.95 * nullV.length)];
    const rand1 = mulberry32(438000 + sg.n);
    const a = D.binProbs(D.SEGMENTS.find((x) => x.id === sg.id).spec, E10);
    let k = 0; const reps = 20000;
    for (let t2 = 0; t2 < reps; t2++)
      if (P.psi(P.props(S.multinomialSample(sg.n, a, rand1)), e10, 1e-4) > q95) k++;
    sg.nullQ95 = r8(q95);
    sg.pFlag = r6(k / reps);
  }

  /* how often the quiet channel outscores the one that moved */
  const onlineExp = segments.find((s) => s.id === "online").expRaw;
  for (const sg of segments) {
    const rand = mulberry32(432000 + sg.n);
    const a = D.binProbs(D.SEGMENTS.find((x) => x.id === sg.id).spec, E10);
    let k = 0; const reps = 40000;
    for (let t = 0; t < reps; t++) if (P.psi(P.props(S.multinomialSample(sg.n, a, rand)), e10, 1e-4) > onlineExp) k++;
    sg.pBeatsOnline = r6(k / reps);
  }

  /* --------------------------------------------- same reading, other outcome */
  log("scenarios");
  const scen = [];
  const pushScen = (kind, label, spec, pdFn = D.pd, extra = {}) => {
    const a = D.binProbs(spec, E10);
    scen.push({
      kind, label, ...extra,
      psi: r6(P.psi(a, e10, 0)),
      approval: r6(D.approvalRate(spec)),
      dApprovalPP: r6((D.approvalRate(spec) - D.approvalRate(L)) * 100),
      acceptedBad: r6(D.acceptedBadRate(spec, D.CUTOFF, pdFn)),
      badPer1000: r6(bad1000(spec, pdFn)),
      dBadPer1000: r6(bad1000(spec, pdFn) - population.badPer1000),
      auc: r6(D.auc(spec, pdFn)),
    });
  };
  for (const d of [-45, -35, -26, -20, -15, -10, -6, -3, 3, 5, 10, 20]) pushScen("location", `${d > 0 ? "+" : ""}${d} pts`, D.shiftLocation(L, d), D.pd, { param: d });
  for (const s of [0.85, 0.9, 0.95, 1.05, 1.12, 1.2, 1.3]) pushScen("spread", `x${s}`, D.shiftSpread(L, s), D.pd, { param: s });
  for (const w of [0.22, 0.28, 0.44, 0.52, 0.6, 0.7]) pushScen("mix", `thin ${Math.round(w * 100)}%`, D.shiftMixWeight(L, w), D.pd, { param: w });
  for (const [w, mu] of [[0.02, 500], [0.05, 500], [0.1, 500], [0.05, 560], [0.1, 560], [0.05, 440], [0.12, 470]])
    pushScen("source", `${Math.round(w * 100)}% at ${mu}`, D.addSource(L, w, mu, 55), D.pd, { param: w });
  for (const sh of [10, 20, 30, 40]) pushScen("concept", `${sh} pts of calibration`, L, (s) => D.pdShifted(s, sh), { param: sh });

  /* ---------------------------------------------- rearrangement inside a bin */
  log("within-bin");
  const breaks10 = D.breaksFromEdges(L, E10);
  const within = [1, 1.6, 2.2, 3].map((gamma) => {
    const meanX = D.warpedIntegral(L, breaks10, gamma, (x) => x, 20000);
    const appr = 1 - D.warpedCdf(L, breaks10, gamma, D.CUTOFF);
    const meanPd = D.warpedIntegral(L, breaks10, gamma, (x) => D.pd(x), 20000);
    /* the proportions the warped population puts in the REAL bins, integrated
       rather than asserted: this is what makes PSI = 0 a measured fact */
    const a = Array.from({ length: B0 }, (_, i) => {
      const lo = i === 0 ? -1e9 : E10[i - 1];
      const hi = i === B0 - 1 ? 1e9 : E10[i];
      return D.warpedCdf(L, breaks10, gamma, hi) - D.warpedCdf(L, breaks10, gamma, lo);
    });
    const frozen = D.binProbs(L, E10);
    return {
      gamma,
      psi: P.psi(a, e10, 0),
      psiVsFrozen: P.psi(a, frozen, 0),
      maxPropGap: Math.max(...a.map((x, i) => Math.abs(x - frozen[i]))),
      mean: r6(meanX), dMean: r6(meanX - population.mean),
      approval: r6(appr), dApprovalPP: r6((appr - D.approvalRate(L)) * 100),
      meanPd: r6(meanPd), dMeanPdPct: r6((meanPd / population.badRate - 1) * 100),
      /* a coarse picture of what it does to the shape, for the figure */
      fine: Array.from({ length: 48 }, (_, k) => {
        const lo = 380 + k * (520 / 48), hi = lo + 520 / 48;
        return r6(D.warpedCdf(L, breaks10, gamma, hi) - D.warpedCdf(L, breaks10, gamma, lo));
      }),
    };
  });

  /* --------------------------------------- bunching on the far side of a cutoff */
  log("bunching");
  const cutBin = P.binOf(D.CUTOFF, E10);
  const cutLo = E10[cutBin - 1], cutHi = E10[cutBin];
  const uLo = D.mixCdf(L, cutLo), uCut = D.mixCdf(L, D.CUTOFF), uHi = D.mixCdf(L, cutHi);
  const bunching = [0, 0.15, 0.3, 0.45, 0.6].map((frac) => {
    const moved = (uCut - uLo) * frac;              // mass crossing the line
    /* they are the applicants nearest the cutoff from below, so their true risk
       is the risk of their ORIGINAL score - the score moved, the borrower did not */
    const uFrom = uCut - moved;
    let s = 0; const panels = 2000;
    for (let k = 0; k < panels && moved > 0; k++) s += D.pd(D.mixQuantile(L, uFrom + ((k + 0.5) / panels) * moved));
    const pdMoved = moved > 0 ? s / panels : 0;
    const appr0 = D.approvalRate(L), bad0 = D.acceptedBadRate(L);
    const appr = appr0 + moved;
    const bad = (appr0 * bad0 + moved * pdMoved) / appr;
    return {
      frac, moved: r6(moved),
      psi: 0,
      approval: r6(appr), dApprovalPP: r6((appr - appr0) * 100),
      acceptedBad: r6(bad), dAcceptedBadPct: r6((bad / bad0 - 1) * 100),
      pdOfMoved: r6(pdMoved),
      scoreFrom: r6(D.mixQuantile(L, uFrom)),
    };
  });
  const bunchGeom = { bin: cutBin + 1, lo: r6(cutLo), hi: r6(cutHi), cutoff: D.CUTOFF,
                      massBelow: r6(uCut - uLo), massAbove: r6(uHi - uCut) };

  /* ------------------------------------------------- concept drift, by band */
  log("concept");
  const conceptBands = [10, 20, 30, 40].map((sh) => ({
    points: sh, psi: 0,
    badRate: r6(D.badRate(L, (s) => D.pdShifted(s, sh))),
    acceptedBad: r6(D.acceptedBadRate(L, D.CUTOFF, (s) => D.pdShifted(s, sh))),
    auc: r6(D.auc(L, (s) => D.pdShifted(s, sh))),
    badPer1000: r6(bad1000(L, (s) => D.pdShifted(s, sh))),
    byBin: Array.from({ length: B0 }, (_, i) => {
      const lo = i === 0 ? -1e9 : E10[i - 1], hi = i === B0 - 1 ? 1e9 : E10[i];
      const panels = 1200;
      let ex = 0, ob = 0;
      const u0 = D.mixCdf(L, lo), u1 = D.mixCdf(L, hi);
      for (let k = 0; k < panels; k++) {
        const x = D.mixQuantile(L, u0 + ((k + 0.5) / panels) * (u1 - u0));
        ex += D.pd(x); ob += D.pdShifted(x, sh);
      }
      return { expected: r6(ex / panels), observed: r6(ob / panels) };
    }),
  }));

  /* ------------------------------------------------- PSI has no direction */
  log("direction");
  const frozen10 = D.binProbs(L, E10);
  const mirrorSpecs = { up: D.shiftMixWeight(L, 0.22), down: D.shiftMixWeight(L, 0.52) };
  const mirrorProbs = { up: D.binProbs(mirrorSpecs.up, E10), down: D.binProbs(mirrorSpecs.down, E10) };
  const quad = (a, e) => a.reduce((s, x, i) => s + (x - e[i]) ** 2 / e[i], 0);
  const mirror = {
    /* mass is linear in the mixture weight, so the two scenarios move every bin
       by the SAME absolute amount in opposite directions. That is what makes
       this a clean experiment rather than a coincidence. */
    maxAntisymmetry: Math.max(...frozen10.map((x, i) => Math.abs((mirrorProbs.up[i] - x) + (mirrorProbs.down[i] - x)))),
    quadUp: r8(quad(mirrorProbs.up, frozen10)),
    quadDown: r8(quad(mirrorProbs.down, frozen10)),
    psiVsFrozenUp: r8(P.psi(mirrorProbs.up, frozen10, 0)),
    psiVsFrozenDown: r8(P.psi(mirrorProbs.down, frozen10, 0)),
    psiUp: r8(P.psi(mirrorProbs.up, e10, 0)),
    psiDown: r8(P.psi(mirrorProbs.down, e10, 0)),
    shiftUp: frozen10.map((x, i) => r8(mirrorProbs.up[i] - x)),
    shiftDown: frozen10.map((x, i) => r8(mirrorProbs.down[i] - x)),
    termsUp: P.terms(mirrorProbs.up, e10, 0).map(r8),
    termsDown: P.terms(mirrorProbs.down, e10, 0).map(r8),
    ratioUp: mirrorProbs.up.map((x) => r6(x * B0)),
    ratioDown: mirrorProbs.down.map((x) => r6(x * B0)),
    approvalUp: r6((D.approvalRate(mirrorSpecs.up) - D.approvalRate(L)) * 100),
    approvalDown: r6((D.approvalRate(mirrorSpecs.down) - D.approvalRate(L)) * 100),
    badUp: r6(bad1000(mirrorSpecs.up, D.pd)), badDown: r6(bad1000(mirrorSpecs.down, D.pd)),
  };

  /* emptying a bin costs more than filling it by the same amount of mass */
  const additiveMirror = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08].map((d) => {
    const e = 1 / B0;
    const fill = d * Math.log((e + d) / e);
    const empty = -d * Math.log((e - d) / e);
    return { d, fill: r8(fill), empty: r8(empty), ratio: r6(empty / fill) };
  });

  /* the two halves of J, which turn out to carry almost nothing */
  const klSplit = [
    ...[0.22, 0.28, 0.44, 0.52, 0.6, 0.7].map((w) => ({ label: `thin ${Math.round(w * 100)}%`, spec: D.shiftMixWeight(L, w) })),
    ...[-26, -10, 10, 26].map((d) => ({ label: `${d > 0 ? "+" : ""}${d} pts`, spec: D.shiftLocation(L, d) })),
    { label: "spread x0.85", spec: D.shiftSpread(L, 0.85) },
    { label: "spread x1.2", spec: D.shiftSpread(L, 1.2) },
    { label: "10% at 500", spec: D.addSource(L, 0.1, 500, 55) },
  ].map(({ label, spec }) => {
    const k = P.klParts(D.binProbs(spec, E10), e10, 0);
    return { label, psi: r6(k.jeffreys), forward: r6(k.forward), reverse: r6(k.reverse), share: r6(k.forward / k.jeffreys) };
  });

  /* which sample defines the bins: same in expectation, not on your data */
  log("bin side");
  const binSide = D.SEGMENTS.map((sg) => {
    const rand = mulberry32(70000 + sg.n);
    const reps = 250;
    const ratios = [];
    for (let t2 = 0; t2 < reps; t2++) {
      const cur = Array.from(D.mixSamples(sg.spec, sg.n, rand)).sort((x, y) => x - y);
      const v1 = P.psi(P.props(P.countsIn(cur, E10)), e10, 1e-4);
      const v2 = P.psi(P.props(P.countsIn(base, P.quantileEdges(cur, B0))), e10, 1e-4);
      ratios.push(v2 / v1);
    }
    ratios.sort((x, y) => x - y);
    return { id: sg.id, n: sg.n, mean: r6(S.mean(ratios)), q05: r6(ratios[Math.floor(reps * 0.05)]),
             q50: r6(ratios[Math.floor(reps * 0.5)]), q95: r6(ratios[Math.floor(reps * 0.95)]) };
  });

  /* ------------------------------------------ the other end of the N range */
  log("large N");
  const bigN = 4000000;
  const psiTarget = 0.01;
  const bigPts = pointsForPsi(psiTarget);
  const alertCut = D.mixQuantile(L, 0.01);
  const large = {
    N: bigN, M,
    floor: P.floorOf(B0, bigN, M),
    crit: S.chi2Inv(0.95, B0 - 1) * (1 / bigN + 1 / M),
    psi: psiTarget,
    points: r6(bigPts), sd: r6(bigPts / population.sd),
    alertCut: r6(alertCut),
    alertBase: 0.01,
    alertNew: r6(D.mixCdf(D.shiftLocation(L, -bigPts), alertCut)),
    alertRatio: r6(D.mixCdf(D.shiftLocation(L, -bigPts), alertCut) / 0.01),
    zScore: r6((psiTarget - P.floorOf(B0, bigN, M)) / P.sdOf(B0, bigN, M)),
  };

  return {
    meta: { M, B: B0, binSet: BIN_SET, reps: REPS, seed: D.BASELINE_SEED, cutoff: D.CUTOFF, pdo: D.PDO },
    population, edgesByB, frozenByB, shiftCurve, psiToPoints,
    nullGrid, chiApprox, overlay, power, binSweep, nested, emptyEps,
    binSweepMeta: { N: sweepN, shiftPoints: sweepShift }, dpi,
    segments: segments.map(({ ...s }) => s),
    emptyRisk, zeros,
    scenarios: scen, within, bunching, bunchGeom, conceptBands, large,
    mirror, additiveMirror, klSplit, binSide,
  };
}

export function run() {
  const t0 = Date.now();
  let last = t0;
  const out = computeAll((m) => {
    const now = Date.now();
    process.stdout.write(`  ${((now - last) / 1000).toFixed(1).padStart(6)}s  before ${m}\n`);
    last = now;
  });
  const here = dirname(fileURLToPath(import.meta.url));
  const body =
    "/*\n  GENERATED by scripts/precompute.mjs - do not edit by hand.\n\n" +
    "  Everything here is simulated from the same modules in src/ that the page\n" +
    "  imports. The first check in verify/check-numbers.mjs recomputes it and\n" +
    "  deep-diffs against this file, so a stale copy is a failing check rather\n" +
    "  than a quiet lie.\n*/\n\n" +
    "export const PRE = " + JSON.stringify(out) + ";\n";
  writeFileSync(join(here, "..", "src", "precomputed.js"), body);
  console.log(`wrote src/precomputed.js (${(body.length / 1024).toFixed(0)} KB) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
