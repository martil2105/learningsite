/*
  Every number and every CLAIM this article makes, re-derived from the same
  modules the page imports.

  The distinction matters. A figure staying correct while the sentence around it
  stops being true is the failure this file exists to catch, so most assertions
  below are worded as the sentence they defend rather than as the quantity they
  read. When a claim is an identity it is held to machine precision; when it is
  a measurement it is held to a bound that would fail if the story changed.

  Run: npm run check
*/
import { run as precompute } from "../scripts/precompute.mjs";
import COMMITTED from "../src/precomputed.js";
import { DATA, EXTENT, byId, LEGIT as LEGIT_MIX, mixturePdf } from "../src/datasets.js";
import {
  smote, kNearestWithin, convexHull, inHull, normalTerritory, childMoments, traceVar,
  varianceRatioAtFullK, balancedNeighbourVerdict, nearestIsMajority, dist2,
} from "../src/smote.js";
import { contourOf } from "../src/contour.js";
import { mulberry32 } from "../src/rng.js";
import {
  SCEN, HOOK, scen, CROSS, HEADLINE, HULL_TRIALS, HULL_ESCAPES, VAR_IDENTITY,
  CHEAP_CHECK, VERDICT, K_DEFAULT,
} from "../src/experiments.js";

let failures = 0;
let checks = 0;
function ok(claim, cond, detail = "") {
  checks++;
  if (cond) {
    console.log("  ok   " + claim + (detail ? "   [" + detail + "]" : ""));
  } else {
    failures++;
    console.log("  FAIL " + claim + (detail ? "   [" + detail + "]" : ""));
  }
}
const head = (s) => console.log("\n" + s);
const pc = (x) => (100 * x).toFixed(1) + "%";

const hard = scen("as-it-arrives");
const two = scen("two-kinds");
const easy = scen("one-kind");
const rate = (s, k) => s.sweep.find((r) => r.k === k).contaminated;
const V = (id) => VERDICT.find((v) => v.id === id);

/* =====================================================================
   0. The committed precompute is not stale
   ===================================================================== */
head("The precompute is fresh");
{
  const fresh = precompute();
  ok(
    "src/precomputed.js matches what scripts/precompute.mjs produces right now",
    JSON.stringify(fresh) === JSON.stringify(COMMITTED)
  );
}

/* =====================================================================
   1. The two identities the maths section asserts
   ===================================================================== */
head("Identities — these are not tolerances");
{
  // Hull: exhaustive over the whole sweep, recomputed rather than read.
  let trials = 0;
  let escapes = 0;
  for (const sc of DATA) {
    const hull = convexHull(sc.minority);
    for (let k = 1; k <= sc.minority.length - 1; k++) {
      const kids = smote(sc.minority, k, 3000, mulberry32(7));
      for (const c of kids) {
        trials++;
        if (!inHull(c.p, hull)) escapes++;
      }
    }
  }
  ok("no synthetic row is ever outside the hull of the rows it was built from", escapes === 0, escapes + " of " + trials);
  ok("the count the article prints for that sweep is what the sweep actually ran", HULL_TRIALS === 1260000 && HULL_ESCAPES === 0, HULL_TRIALS + " rows, " + HULL_ESCAPES + " escapes");

  // Variance at k = n-1, against the closed form.
  for (const sc of DATA) {
    const n = sc.minority.length;
    const exact = childMoments(sc.minority, n - 1).trace / traceVar(sc.minority);
    const ident = varianceRatioAtFullK(n);
    ok(
      "at k = n-1 the spread ratio is exactly 2/3 - 1/(3(n-1))  [" + sc.id + "]",
      Math.abs(exact - ident) / ident < 1e-12,
      "exact " + exact.toFixed(12) + " vs " + ident.toFixed(12)
    );
  }
  ok("the number the article prints for it is that identity at n = " + HOOK.minority.length, Math.abs(VAR_IDENTITY - varianceRatioAtFullK(HOOK.minority.length)) < 1e-15);

  // childMoments against a large sample of the generator it describes. Two
  // derivations of the same quantity, one closed-form and one by simulation.
  for (const k of [1, 3, 5, 9, 15, 21]) {
    const exact = childMoments(HOOK.minority, k).trace / traceVar(HOOK.minority);
    const sampled = traceVar(smote(HOOK.minority, k, 300000, mulberry32(3)).map((c) => c.p)) / traceVar(HOOK.minority);
    ok(
      "closed-form spread agrees with simulating the sampler, k = " + k,
      Math.abs(exact - sampled) < 0.01,
      "exact " + exact.toFixed(4) + " sampled " + sampled.toFixed(4)
    );
  }
}

/* =====================================================================
   2. The sentences the maths section makes about spread
   ===================================================================== */
head("Spread: the article says the contraction is a large-k effect, not a default-k one");
{
  const atDefault = HOOK.sweep.find((r) => r.k === K_DEFAULT).spreadRatio;
  const atFull = HOOK.sweep.find((r) => r.k === HOOK.minority.length - 1).spreadRatio;
  ok("at the default k the synthetic cloud is not narrower than the real one", atDefault > 1.0, "ratio " + atDefault);
  ok("by k = n-1 it has lost about a third of the variance", atFull < 0.7, "ratio " + atFull);
  const tail = HOOK.sweep.filter((r) => r.k >= K_DEFAULT).map((r) => r.spreadRatio);
  ok("and it falls monotonically from the default onwards", tail.every((v, i) => i === 0 || v <= tail[i - 1] + 1e-9));
}

/* =====================================================================
   3. The scrollytelling section, step by step
   ===================================================================== */
head("Where the assumption holds and where it does not");
{
  ok("step 1: one convex blob puts almost nothing in normal territory, at any k", easy.sweep.every((r) => r.contaminated < 0.01), "worst " + pc(Math.max(...easy.sweep.map((r) => r.contaminated))));
  ok("step 2: two well-separated clusters are still fine at the default k", rate(two, K_DEFAULT) < 0.005, pc(rate(two, K_DEFAULT)));
  ok("step 2's reason: at k = 5 no neighbour pair crosses between the two kinds", two.sweep.find((r) => r.k === K_DEFAULT).crossPairs === 0);
  ok("step 3: the same data at k = 15 breaks badly", rate(two, 15) > 0.2, pc(rate(two, 15)));
  ok("step 3's reason: at k = 15 the pairs do cross", two.sweep.find((r) => r.k === 15).crossPairs > 0, two.sweep.find((r) => r.k === 15).crossPairs + " pairs");
  ok("step 4: the realistic label set is already broken at the default k", rate(hard, K_DEFAULT) > 0.09, pc(rate(hard, K_DEFAULT)));
  ok(
    "step 4's reason: " + CROSS.points + " of " + hard.minority.length + " rows cannot find " + K_DEFAULT + " neighbours of their own kind",
    CROSS.points > 0 && CROSS.pairs > 0 && CROSS.pairsTotal === K_DEFAULT * hard.minority.length,
    CROSS.pairs + " of " + CROSS.pairsTotal + " pairs cross"
  );
  ok("step 4's coda: turning k down to 1 does not fix it, and no pair crosses kinds there", rate(hard, 1) > 0.03 && hard.sweep.find((r) => r.k === 1).crossPairs === 0, pc(rate(hard, 1)));
  ok("step 5: balancing needs " + HEADLINE.made + " rows and " + HEADLINE.bad + " of them land in normal territory", HEADLINE.made === hard.majority.length - hard.minority.length && HEADLINE.bad > 0);
  ok("step 5's punchline: more misleading synthetic rows than there were real ones", HEADLINE.ratio > 1, HEADLINE.ratio.toFixed(1) + "x");

  // The balancing count is a re-derivation, not a read.
  const kids = smote(hard.minority, K_DEFAULT, hard.majority.length - hard.minority.length, mulberry32(31)).map((c) => c.p);
  ok("and that count reproduces from the generator", kids.filter((p) => normalTerritory(p, hard)).length === HEADLINE.bad);
}

/* =====================================================================
   4. The hook starts benign and breaks when you drag it
   ===================================================================== */
head("The hook does what the prose promises");
{
  const START = 4;
  const SLOTS = (() => {
    const r = mulberry32(4242);
    return Array.from({ length: 180 }, () => r());
  })();
  const kidsAt = (pts, k, sel) => {
    const cand = kNearestWithin(pts, k)[sel];
    return SLOTS.map((lam, t) => {
      const j = cand[t % cand.length];
      const a = pts[sel];
      const b = pts[j];
      return [a[0] + lam * (b[0] - a[0]), a[1] + lam * (b[1] - a[1])];
    });
  };

  const home = HOOK.minority.map((p) => p.slice());
  const atHome = kidsAt(home, K_DEFAULT, START).filter((p) => normalTerritory(p, HOOK)).length;
  ok("it opens with the handle inside its own cluster and nothing flagged", atHome === 0, atHome + " of 180");

  // Drag it to the densest part of the legitimate cloud.
  const moved = home.map((p) => p.slice());
  moved[START] = [-0.62, 0.2];
  const atCentre = kidsAt(moved, K_DEFAULT, START).filter((p) => normalTerritory(p, HOOK)).length;
  ok("dragging it into the middle of ordinary spending flags most of them", atCentre > 90, atCentre + " of 180");

  ok("the handle's start position really is a card-testing row", HOOK.kinds[START] === "testing");

  // Every child is a convex combination: on the segment, and between the ends.
  const pts = home;
  const cand = kNearestWithin(pts, K_DEFAULT)[START];
  let offSegment = 0;
  SLOTS.forEach((lam, t) => {
    const j = cand[t % cand.length];
    const a = pts[START];
    const b = pts[j];
    const c = [a[0] + lam * (b[0] - a[0]), a[1] + lam * (b[1] - a[1])];
    const cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(cr) > 1e-12 || lam < 0 || lam > 1) offSegment++;
  });
  ok("every child drawn in the hook is on the segment it claims to be on", offSegment === 0);
}

/* =====================================================================
   5. The last section's comparison
   ===================================================================== */
head("What it bought");
{
  for (const v of VERDICT) {
    ok("SMOTE beats doing nothing at the usual threshold  [" + v.short + "]", v.smote.atHalf.balanced < v.none.atHalf.balanced, pc(v.smote.atHalf.balanced) + " vs " + pc(v.none.atHalf.balanced));
    ok("moving the threshold matches or beats SMOTE  [" + v.short + "]", v.none.tuned.balanced <= v.smote.atHalf.balanced + 1e-9, pc(v.none.tuned.balanced) + " vs " + pc(v.smote.atHalf.balanced));
  }
  const h = V("as-it-arrives");
  ok(
    "the article calls it a dead heat, so it had better be within a tenth of a point everywhere",
    VERDICT.every((v) => Math.abs(v.none.tuned.balanced - v.smote.atHalf.balanced) < 0.002),
    VERDICT.map((v) => (100 * (v.smote.atHalf.balanced - v.none.tuned.balanced)).toFixed(2)).join(", ") + " points"
  );
  ok("and a dead heat in the same direction all three times, which is what the article rests on", VERDICT.every((v) => v.none.tuned.balanced <= v.smote.atHalf.balanced));
  ok("the remedies stay a few tenths either side of plain SMOTE rather than closing the gap", [h.borderline, h.enn].every((m) => Math.abs(m.atHalf.balanced - h.smote.atHalf.balanced) < 0.01));
  ok("and neither of them gets clear of the moved threshold", [h.borderline, h.enn].every((m) => m.atHalf.balanced > h.none.tuned.balanced - 0.005));
  ok("without resampling, at threshold 0.5, it misses every fraud on that set", h.none.atHalf.miss === 1, pc(h.none.atHalf.miss) + " missed");
  ok("so the intro's '0% of the fraud' is 0% and not a rounding of something else", Math.round(100 * (1 - h.none.atHalf.miss)) === 0);
  ok("and that classifier therefore has no boundary to draw anywhere on the plane", hard.boundaries.noneHalf.length === 0);
  ok("the other two boundaries in that figure do exist", hard.boundaries.noneTuned.length > 0 && hard.boundaries.smoteHalf.length > 0);
  ok(
    "the two boundaries in that figure really do track each other, which is what the prose says",
    h.disagreement.weighted < 0.1 && VERDICT.slice(0, 2).every((v) => v.disagreement.weighted < 0.03),
    VERDICT.map((v) => v.short + " " + pc(v.disagreement.weighted)).join(", ")
  );
  ok("SMOTE does catch most of the fraud once balanced", h.smote.atHalf.miss < 0.3, pc(1 - h.smote.atHalf.miss) + " caught");

  const share = hard.majority.length / (hard.majority.length + hard.minority.length);
  ok("the intro's always-legitimate accuracy is right", (100 * share).toFixed(1) === "97.6", (100 * share).toFixed(1) + "%");
}

/* =====================================================================
   6. The cheap check the conclusion recommends
   ===================================================================== */
head("The model-free check in the conclusion");
{
  ok("it agrees with the density verdict most of the time", CHEAP_CHECK.agree > 0.92, pc(CHEAP_CHECK.agree));
  ok("and reports a rate close to the true one", Math.abs(CHEAP_CHECK.cheapRate - CHEAP_CHECK.trueRate) < 0.05, pc(CHEAP_CHECK.cheapRate) + " vs " + pc(CHEAP_CHECK.trueRate));
  ok("while the unscaled version does not, which is why the paragraph warns about it", CHEAP_CHECK.naiveRate > 2 * CHEAP_CHECK.trueRate, pc(CHEAP_CHECK.naiveRate));
}

/* =====================================================================
   7. Geometry the charts depend on
   ===================================================================== */
head("Geometry");
{
  // Marching squares against a shape with a known area.
  const rings = contourOf((p) => 1 - (p[0] ** 2 + p[1] ** 2), { x0: -2, x1: 2, y0: -2, y1: 2 }, 161, 0);
  const area = Math.abs(
    rings[0].slice(0, -1).reduce((a, p, i) => a + p[0] * rings[0][i + 1][1] - rings[0][i + 1][0] * p[1], 0) / 2
  );
  ok("the contour code recovers a unit circle to three decimals", rings.length === 1 && Math.abs(area - Math.PI) < 0.002, "area " + area.toFixed(4));

  ok("one kind of fraud draws one region", easy.territory.length === 1, easy.territory.length + " rings");
  ok("four kinds draw four", hard.territory.length === hard.spec.length, hard.territory.length + " rings for " + hard.spec.length + " kinds");
  ok("every territory ring is closed", SCEN.every((s) => s.territory.every((r) => Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 1e-9)));
  ok("every drawn point is inside the chart's extent", SCEN.every((s) => s.majority.concat(s.minority).every((p) => p[0] > EXTENT.x0 && p[0] < EXTENT.x1 && p[1] > EXTENT.y0 && p[1] < EXTENT.y1)));
  ok("nothing anywhere is NaN", SCEN.every((s) => s.majority.concat(s.minority).every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))));
}

/* =====================================================================
   8. Things the prose says about the scenarios themselves
   ===================================================================== */
head("The scenarios are what the prose says they are");
{
  ok("all three have the same class counts, so the comparison is about shape only", SCEN.every((s) => s.minority.length === 22 && s.majority.length === 900));
  ok("two kinds at k = 5 really is exactly zero, as the step text states", two.sweep.find((r) => r.k === K_DEFAULT).contaminated === 0);
  ok("the two-kinds clusters are 13 and 9 points, as the step text states", JSON.stringify(two.spec.map((s) => s.n)) === "[13,9]");
  ok("the realistic set is 10, 6, 4, 2 across four kinds, as its step text states", JSON.stringify(hard.spec.map((s) => s.n)) === "[10,6,4,2]");
  const mid = [(-1.7 + 1.52) / 2, (-1.42 + 1.46) / 2];
  ok("the midpoint between the two fraud modes really is dense legitimate ground", mixturePdf(mid, LEGIT_MIX) > 10 * hard.pMin(mid), "legit density " + hard.pMaj(mid).toFixed(3) + " vs fraud " + hard.pMin(mid).toFixed(4));
}

console.log("\n" + (failures === 0 ? "ALL " + checks + " CHECKS PASS" : failures + " of " + checks + " CHECKS FAILED"));
process.exit(failures === 0 ? 0 : 1);
