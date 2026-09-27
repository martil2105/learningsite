/*
  Every claim this article makes, re-derived from the same modules the page
  imports:

      npm run check          (or: node verify/check-numbers.mjs)

  This article is unusually checkable, because almost everything in it is an
  exact statement about linear algebra rather than an empirical tendency. The
  autoencoder's optimum is a theorem; the invariance is an identity; a projector
  is idempotent or it is not. So most of what follows is not a tolerance - it is
  an equality, held to machine precision.

  The first section matters most: the sweeps are committed as src/precomputed.js
  because fifty thousand gradient steps is too slow to run while a page paints,
  and that is only safe if a stale file fails loudly.
*/
import { computeAll } from "../scripts/precompute.mjs";
import COMMITTED from "../src/precomputed.js";
import { PLANE, WIDE, ARC, WIDE_K } from "../src/datasets.js";
import { pca, encode, covariance, centre } from "../src/pca.js";
import { trainLinear, loss as aeLoss, gradients, optimalEncoder, reconstruct } from "../src/autoencoder.js";
import {
  jacobiEigen, matMul, transpose, matVec, projector, subspaceDistance, angleBetween, eye, solve,
} from "../src/linalg.js";
import {
  ANGLE_CURVE, PC1_ANGLE, PLANE_PCA, WIDE_PCA, UNREG, REG, TRACE_FREE,
  SETTLED_STEP, CONFIG, ARC_RESULT, ARC_GAIN, lossAtAngle, num, deg,
} from "../src/experiments.js";
import { mulberry32, gaussian } from "../src/rng.js";

let failures = 0;
const ok = (label, condition, detail = "") => {
  console.log((condition ? "  PASS  " : "  FAIL  ") + label + (detail ? "   " + detail : ""));
  if (!condition) failures++;
};
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const acute = (a, b) => Math.min(angleBetween(a, b), 180 - angleBetween(a, b));

console.log("\n--- the committed precompute is not stale ---");
{
  const fresh = computeAll();
  const diffs = [];
  const walk = (a, b, path) => {
    if (typeof a === "number" && typeof b === "number") {
      if (!near(a, b, 1e-9)) diffs.push(path + ": " + a + " != " + b);
    } else if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) diffs.push(path + ": length " + a.length + " != " + b.length);
      else a.forEach((v, i) => walk(v, b[i], path + "[" + i + "]"));
    } else if (a && b && typeof a === "object" && typeof b === "object") {
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], path + "." + k);
    } else if (a !== b) diffs.push(path + ": " + a + " != " + b);
  };
  walk(fresh, COMMITTED, "");
  ok("src/precomputed.js matches a fresh run of scripts/precompute.mjs",
     diffs.length === 0, diffs.length ? diffs.length + " differences, first: " + diffs[0] : "");
  if (diffs.length) console.log("        run: node scripts/precompute.mjs");
}

console.log("\n--- the linear algebra, against its own definitions ---");
{
  const C = covariance(centre(WIDE));
  const { values, vectors } = jacobiEigen(C);
  let worstEig = 0;
  for (let i = 0; i < vectors.length; i++) {
    const Av = matVec(C, vectors[i]);
    for (let j = 0; j < Av.length; j++) worstEig = Math.max(worstEig, Math.abs(Av[j] - values[i] * vectors[i][j]));
  }
  // Relative to the largest eigenvalue: this covariance has entries of order 10,
  // so an absolute threshold is a statement about the data's units.
  const scale = Math.max(...values.map(Math.abs));
  ok("eigenvectors satisfy A v = lambda v", worstEig / scale < 1e-13,
     "worst residual " + worstEig.toExponential(2) + " against lambda_max " + scale.toFixed(2));
  let worstOrth = 0;
  for (let i = 0; i < vectors.length; i++) for (let j = 0; j < vectors.length; j++) {
    const d = vectors[i].reduce((s, x, t) => s + x * vectors[j][t], 0);
    worstOrth = Math.max(worstOrth, Math.abs(d - (i === j ? 1 : 0)));
  }
  ok("eigenvectors are orthonormal", worstOrth < 1e-10, "worst deviation " + worstOrth.toExponential(2));
  ok("eigenvalues come back in descending order", values.every((v, i) => i === 0 || v <= values[i - 1] + 1e-12));
  ok("their sum is the total variance",
     near(values.reduce((a, b) => a + b, 0), C.reduce((s, row, i) => s + row[i], 0), 1e-10));
}
{
  const B = transpose(WIDE_PCA.components.slice(0, WIDE_K));
  const P = projector(B);
  const PP = matMul(P, P);
  let worst = 0;
  for (let i = 0; i < P.length; i++) for (let j = 0; j < P.length; j++) {
    worst = Math.max(worst, Math.abs(PP[i][j] - P[i][j]), Math.abs(P[i][j] - P[j][i]));
  }
  ok("the projector is idempotent and symmetric", worst < 1e-10, "worst deviation " + worst.toExponential(2));
  ok("a subspace is at distance 0 from itself", subspaceDistance(B, B) < 1e-12);
}

console.log("\n--- the gradients the training loop uses ---");
{
  const X = WIDE.slice(0, 60);
  const rand = mulberry32(99);
  const W1 = Array.from({ length: 2 }, () => Array.from({ length: 8 }, () => gaussian(rand) * 0.4));
  const W2 = Array.from({ length: 8 }, () => Array.from({ length: 2 }, () => gaussian(rand) * 0.4));
  const { g1, g2 } = gradients(X, W1, W2);
  const eps = 1e-6;
  let worst = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 8; j++) {
    const a = W1.map((r) => [...r]); a[i][j] += eps;
    const b = W1.map((r) => [...r]); b[i][j] -= eps;
    worst = Math.max(worst, Math.abs((aeLoss(X, a, W2) - aeLoss(X, b, W2)) / (2 * eps) - g1[i][j]));
  }
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
    const a = W2.map((r) => [...r]); a[i][j] += eps;
    const b = W2.map((r) => [...r]); b[i][j] -= eps;
    worst = Math.max(worst, Math.abs((aeLoss(X, W1, a) - aeLoss(X, W1, b)) / (2 * eps) - g2[i][j]));
  }
  ok("analytic gradients match numerical ones", worst < 1e-6, "worst gap " + worst.toExponential(2));
}

console.log("\n--- 'the bottleneck is doing PCA' ---");
ok("the trained loss equals the sum of the discarded eigenvalues",
   near(UNREG[0].loss, WIDE_PCA.bestError, 1e-6),
   num(UNREG[0].loss, 6) + " vs " + num(WIDE_PCA.bestError, 6));
ok("...and no fit beats it", UNREG.every((f) => f.loss >= WIDE_PCA.bestError - 1e-9));
ok("the top two eigenvalues carry the bulk of the variance",
   WIDE_PCA.cumulative[1] > 0.9, (100 * WIDE_PCA.cumulative[1]).toFixed(2) + "%");
ok("there is a real gap after the second", WIDE_PCA.eigenvalues[1] / WIDE_PCA.eigenvalues[2] > 10,
   (WIDE_PCA.eigenvalues[1] / WIDE_PCA.eigenvalues[2]).toFixed(1) + "x");
ok("the plane's best rank-1 error is its second eigenvalue",
   near(PLANE_PCA.bestError, PLANE_PCA.eigenvalues[1], 1e-12));

console.log("\n--- the hook's two claims ---");
{
  const best = ANGLE_CURVE.reduce((a, b) => (b.loss < a.loss ? b : a));
  ok("the loss curve bottoms out at the first principal direction",
     Math.abs(best.deg - PC1_ANGLE) <= 1, best.deg + "° vs PC1 at " + deg(PC1_ANGLE, 2));
  ok("...and its value there is the best possible",
     near(lossAtAngle(PC1_ANGLE), PLANE_PCA.bestError, 1e-9),
     num(lossAtAngle(PC1_ANGLE), 6) + " vs " + num(PLANE_PCA.bestError, 6));
  let worst = 0;
  for (const d of [7, 28.161, 61, 103, 155]) {
    for (const c of [0.2, 1, 3.7, 40]) worst = Math.max(worst, Math.abs(lossAtAngle(d, c) - lossAtAngle(d, 1)));
  }
  /*
    In exact arithmetic this difference is identically zero - it is the identity
    the whole hook is built on. In doubles the closed-form encoder goes through
    a division, so scaling the decoder by 40 and by 0.2 can differ in the last
    bit. The article says the number "stays where it is", which is true of every
    digit anyone will ever see; it does not say the bits are identical, and this
    check is what stopped it saying so.
  */
  ok("with the encoder solved, the decoder's length changes the loss only by rounding",
     worst < 1e-14, "largest difference across 20 scalings: " + worst.toExponential(2));
  const th = (61 * Math.PI) / 180;
  const W2 = [[2.9 * Math.cos(th)], [2.9 * Math.sin(th)]];
  const P = matMul(W2, optimalEncoder(W2));
  const PP = matMul(P, P);
  let pw = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    pw = Math.max(pw, Math.abs(PP[i][j] - P[i][j]), Math.abs(P[i][j] - P[j][i]));
  }
  ok("the solved round trip is an orthogonal projection", pw < 1e-12, "worst deviation " + pw.toExponential(2));
}

console.log("\n--- the invariance: the loss cannot see the basis ---");
{
  const f = UNREG[0];
  const A = [[1.7, -0.9], [0.4, 2.3]];
  const Ainv = solve(A.map((r) => [...r]), eye(2));
  const W1p = matMul(A, f.W1);
  const W2p = matMul(f.W2, Ainv);
  const before = aeLoss(WIDE, f.W1, f.W2);
  const after = aeLoss(WIDE, W1p, W2p);
  ok("re-basing by an arbitrary invertible matrix leaves the loss unchanged",
     Math.abs(after - before) < 1e-9, before.toFixed(12) + " vs " + after.toFixed(12));
  const R1 = reconstruct(WIDE, f.W1, f.W2);
  const R2 = reconstruct(WIDE, W1p, W2p);
  let worst = 0;
  for (let i = 0; i < R1.length; i++) for (let j = 0; j < R1[i].length; j++) {
    worst = Math.max(worst, Math.abs(R1[i][j] - R2[i][j]));
  }
  ok("...and every reconstruction unchanged", worst < 1e-9, "worst " + worst.toExponential(2));
  ok("...while the weights are completely different",
     acute(W1p[0], f.W1[0]) > 5, deg(acute(W1p[0], f.W1[0]), 1) + " between old and new encoder rows");
  ok("...and the subspace is the same", subspaceDistance(W2p, f.W2) < 1e-9);
}

console.log("\n--- 'the subspace arrives, the basis never does' ---");
for (const f of UNREG) {
  ok(("seed " + f.seed + ": found the subspace").padEnd(34), f.subspace < 1e-10, f.subspace.toExponential(1));
  ok(("seed " + f.seed + ": did not find the basis").padEnd(34), f.angle1 > 20, deg(f.angle1, 1) + " from PC1");
}
ok("the three seeds land on three different bases",
   new Set(UNREG.map((f) => f.angle1.toFixed(1))).size === UNREG.length,
   UNREG.map((f) => deg(f.angle1, 1)).join("  "));
{
  const after = TRACE_FREE.rows.filter((r) => r.step >= SETTLED_STEP);
  const spread = Math.max(...after.map((r) => r.angle1)) - Math.min(...after.map((r) => r.angle1));
  ok("after the loss settles, the angle does not move at all", spread < 0.01,
     "range " + spread.toExponential(1) + "° over " + after.length + " measurements to step " + CONFIG.STEPS);
  const lossSpread = Math.max(...after.map((r) => r.loss)) - Math.min(...after.map((r) => r.loss));
  ok("...and neither does the loss", lossSpread < 5e-5, lossSpread.toExponential(1));
  ok("the subspace keeps improving all the way down to machine precision",
     after[after.length - 1].subspace < 1e-14, after[after.length - 1].subspace.toExponential(1));
}

console.log("\n--- what the L2 penalty fixes, and what it does not ---");
for (const f of REG) {
  ok(("seed " + f.seed + ": the decoder's SVD IS the PCA basis").padEnd(44),
     f.angle1 < 0.05 && f.angle2 < 0.05, deg(f.angle1, 3) + " / " + deg(f.angle2, 3));
  ok(("seed " + f.seed + ": encoder equals the decoder transpose").padEnd(44), f.symmetry < 1e-8,
     f.symmetry.toExponential(1));
  ok(("seed " + f.seed + ": encoder rows are perpendicular").padEnd(44),
     Math.abs(f.encoderRows - 90) < 0.2, deg(f.encoderRows, 2));
  ok(("seed " + f.seed + ": decoder columns are equal length").padEnd(44),
     Math.abs(f.decoderNorms[0] - f.decoderNorms[1]) < 0.01, f.decoderNorms.map((v) => v.toFixed(3)).join(" / "));
}
ok("the penalty costs a little accuracy, as it must",
   REG[0].loss > UNREG[0].loss && REG[0].reconGap > UNREG[0].reconGap,
   num(REG[0].loss, 5) + " vs " + num(UNREG[0].loss, 5) + ", gap " +
   REG[0].reconGap.toExponential(0) + " vs " + UNREG[0].reconGap.toExponential(0));
ok("but it does NOT decorrelate the codes - that is the article's caveat",
   REG.some((f) => Math.abs(f.latent.correlation) > 0.1),
   REG.map((f) => f.latent.correlation.toFixed(2)).join("  "));

console.log("\n--- 'the same answer, in unrecognisable coordinates' ---");
ok("PCA's codes are exactly uncorrelated", Math.abs(WIDE_PCA.latent.correlation) < 1e-12);
ok("PCA's codes are sorted by variance", WIDE_PCA.latent.variance[0] > WIDE_PCA.latent.variance[1]);
ok("the autoencoder's are not uncorrelated", UNREG.some((f) => Math.abs(f.latent.correlation) > 0.5),
   UNREG.map((f) => f.latent.correlation.toFixed(3)).join("  "));
ok("...nor sorted: at least one run puts more variance in the second unit",
   UNREG.some((f) => f.latent.variance[1] > f.latent.variance[0]),
   UNREG.map((f) => f.latent.variance.map((v) => v.toFixed(1)).join("/")).join("  "));
ok("...while every reconstruction agrees with PCA's to machine precision",
   UNREG.every((f) => f.reconGap < 1e-11), UNREG.map((f) => f.reconGap.toExponential(0)).join("  "));
ok("PCA's own eigenvalues are its latent variances", (() => {
  const Z = encode(WIDE, WIDE_PCA.components, WIDE_K);
  const n = Z.length;
  const v = [0, 1].map((j) => Z.reduce((a, z) => a + z[j] * z[j], 0) / n);
  return near(v[0], WIDE_PCA.eigenvalues[0], 1e-9) && near(v[1], WIDE_PCA.eigenvalues[1], 1e-9);
})());

console.log("\n--- 'where the line runs out' ---");
ok("the linear autoencoder on the arc finds exactly PCA's line",
   near(ARC_RESULT.linearLoss, ARC_RESULT.bestLinear, 1e-5),
   num(ARC_RESULT.linearLoss, 5) + " vs " + num(ARC_RESULT.bestLinear, 5));
ok("...and its direction is the first principal direction",
   acute(ARC_RESULT.linearDirection, ARC_RESULT.pc1) < 0.5,
   deg(acute(ARC_RESULT.linearDirection, ARC_RESULT.pc1), 3));
ok("the nonlinear one does substantially better", ARC_GAIN > 5, ARC_GAIN.toFixed(1) + "x lower error");
ok("its learned curve is not a straight line", (() => {
  const c = ARC_RESULT.curve;
  const a = c[0];
  const b = c[c.length - 1];
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const L = Math.hypot(ux, uy);
  let maxDev = 0;
  for (const q of c) maxDev = Math.max(maxDev, Math.abs((q[0] - a[0]) * uy - (q[1] - a[1]) * ux) / L);
  return maxDev > 0.5;
})());

console.log("\n--- determinism ---");
{
  const a = trainLinear(WIDE, WIDE_K, { steps: 40, lr: 0.012, seed: 11 });
  const b = trainLinear(WIDE, WIDE_K, { steps: 40, lr: 0.012, seed: 11 });
  ok("two identical runs agree bit for bit", a.loss === b.loss && a.W2[0][0] === b.W2[0][0]);
}

console.log("\n" + (failures ? failures + " CHECK(S) FAILED" : "all checks passed") + "\n");
process.exit(failures ? 1 : 0);
