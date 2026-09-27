/*
  Generates src/precomputed.js.

      node scripts/precompute.mjs

  Same arrangement as articles/lightgbm: the heavy fits run here, from the SAME
  modules the page imports, and verify/check-numbers.mjs re-runs every one of
  them and fails if a committed number has moved. A stale precompute is a
  failing check, not a quiet lie.

  What is heavy here is not the arithmetic but the number of steps. The
  interesting behaviour - the basis rotating inside a subspace that stopped
  moving twenty thousand steps ago - only shows up if you keep going long after
  the loss has flattened, which is the whole point of the section it feeds.
*/
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { WIDE, WIDE_K, ARC, PLANE } from "../src/datasets.js";
import { pca, encode, decode, tailSum, reconstructionError } from "../src/pca.js";
import {
  trainLinear, reconstruct, loss, initMLP, trainMLP, mlpForward, mlpLoss, optimalEncoder,
} from "../src/autoencoder.js";
import { transpose, matMul, matVec, jacobiEigen, subspaceDistance, angleBetween, norm } from "../src/linalg.js";

export const SEEDS = [11, 12, 13];
export const L2 = 0.02;
export const STEPS = 25000;
export const LR = 0.012;

const acute = (a, b) => {
  const t = angleBetween(a, b);
  return Math.min(t, 180 - t);
};

// Left singular vectors of a tall thin matrix, as the eigenvectors of M Mᵀ.
export function leftSingular(M, k) {
  const { vectors, values } = jacobiEigen(matMul(M, transpose(M)));
  return { vectors: vectors.slice(0, k), sv: values.slice(0, k).map((v) => Math.sqrt(Math.max(0, v))) };
}

const symmetryGap = (W1, W2) => {
  const T = transpose(W2);
  let w = 0;
  for (let i = 0; i < W1.length; i++) for (let j = 0; j < W1[i].length; j++) w = Math.max(w, Math.abs(W1[i][j] - T[i][j]));
  return w;
};

const latentStats = (Z) => {
  const n = Z.length;
  const m = [0, 1].map((j) => Z.reduce((a, z) => a + z[j], 0) / n);
  const v = [0, 1].map((j) => Z.reduce((a, z) => a + (z[j] - m[j]) ** 2, 0) / n);
  const cov = Z.reduce((a, z) => a + (z[0] - m[0]) * (z[1] - m[1]), 0) / n;
  return { variance: v, correlation: cov / Math.sqrt(v[0] * v[1]) };
};

export function computeAll(log = () => {}) {
  const out = { config: { SEEDS, L2, STEPS, LR, k: WIDE_K, n: WIDE.length, d: WIDE[0].length } };

  log("pca");
  const p = pca(WIDE);
  const B = transpose(p.components.slice(0, WIDE_K));
  out.pca = {
    eigenvalues: p.eigenvalues,
    explained: p.explained,
    cumulative: p.cumulative,
    components: p.components,
    bestError: tailSum(p.eigenvalues, WIDE_K),
    latent: latentStats(encode(WIDE, p.components, WIDE_K)),
  };

  /*
    The trace. Measured at log-spaced steps, because everything interesting
    happens across four orders of magnitude of step count and a linear grid
    would spend all its points where nothing is changing.
  */
  log("rotation traces");
  const marks = [];
  for (let e = 0; e <= Math.log10(STEPS) + 1e-9; e += 0.125) marks.push(Math.min(STEPS, Math.round(10 ** e)));
  const MARKS = [...new Set([0, ...marks])].sort((a, b) => a - b);

  const traceRun = (l2, seed) => {
    const rows = [];
    const r = trainLinear(WIDE, WIDE_K, {
      steps: STEPS, lr: LR, seed, l2,
      trace: 1,
      // the trace hook in trainLinear records every step; that is far more than
      // is wanted here, so the run is done in segments instead
    });
    return r;
  };

  // Segmented so only the marked steps are measured.
  const runTraced = (l2, seed) => {
    let acc = { W1: null, W2: null };
    const rows = [];
    let done = 0;
    for (const m of MARKS) {
      const chunk = m - done;
      if (chunk > 0) {
        const r = trainLinear(WIDE, WIDE_K, {
          steps: chunk, lr: LR, seed, l2,
          ...(acc.W1 ? { warm: acc } : {}),
        });
        acc = { W1: r.W1, W2: r.W2 };
        done = m;
      }
      if (!acc.W1) continue;
      const ls = leftSingular(acc.W2, WIDE_K);
      rows.push({
        step: m,
        loss: loss(WIDE, acc.W1, acc.W2),
        subspace: subspaceDistance(acc.W2, B),
        symmetry: symmetryGap(acc.W1, acc.W2),
        angle1: acute(ls.vectors[0], p.components[0]),
        angle2: acute(ls.vectors[1], p.components[1]),
        encoderRows: acute(acc.W1[0], acc.W1[1]),
      });
    }
    return { rows, final: acc };
  };

  out.traces = [
    { l2: 0, seed: SEEDS[0], ...runTraced(0, SEEDS[0]) },
    { l2: L2, seed: SEEDS[0], ...runTraced(L2, SEEDS[0]) },
  ];

  log("fits");
  out.fits = [];
  for (const l2 of [0, L2]) {
    for (const seed of SEEDS) {
      const r = trainLinear(WIDE, WIDE_K, { steps: STEPS, lr: LR, seed, l2 });
      const ls = leftSingular(r.W2, WIDE_K);
      const Z = WIDE.map((x) => matVec(r.W1, x));
      const R = reconstruct(WIDE, r.W1, r.W2);
      const Rpca = decode(encode(WIDE, p.components, WIDE_K), p.components, WIDE_K);
      let worst = 0;
      for (let i = 0; i < R.length; i++) for (let j = 0; j < R[i].length; j++) worst = Math.max(worst, Math.abs(R[i][j] - Rpca[i][j]));
      out.fits.push({
        l2, seed,
        loss: r.loss,
        subspace: subspaceDistance(r.W2, B),
        symmetry: symmetryGap(r.W1, r.W2),
        angle1: acute(ls.vectors[0], p.components[0]),
        angle2: acute(ls.vectors[1], p.components[1]),
        encoderRows: acute(r.W1[0], r.W1[1]),
        decoderNorms: [0, 1].map((c) => norm(r.W2.map((row) => row[c]))),
        encoderNorms: r.W1.map(norm),
        reconGap: worst,
        latent: latentStats(Z),
        // The latent scatter itself, so the comparison figure can draw it.
        Z: Z.map((z) => z.map((v) => +v.toFixed(4))),
        W1: r.W1.map((row) => Array.from(row, (v) => +v.toFixed(6))),
        W2: r.W2.map((row) => Array.from(row, (v) => +v.toFixed(6))),
      });
    }
  }
  out.dataScale = Math.max(...WIDE.map((r) => Math.max(...r.map(Math.abs))));
  out.pcaLatent = encode(WIDE, p.components, WIDE_K).map((z) => z.map((v) => +v.toFixed(4)));

  log("arc");
  const arcP = pca(ARC);
  const lin = trainLinear(ARC, 1, { steps: 6000, lr: 0.01, seed: 3 });
  let M = initMLP(2, 6, 1, 42);
  M = trainMLP(ARC, M, { steps: 6000, lr: 0.03 });
  const codes = ARC.map((x) => mlpForward(M, x).z[0]);
  const lo = Math.min(...codes);
  const hi = Math.max(...codes);
  // The learned curve, swept by feeding codes through the decoder half alone.
  const curve = [];
  for (let i = 0; i <= 140; i++) {
    const z = [lo + ((hi - lo) * i) / 140];
    const h2 = matVec(M.W3, z).map((v, j) => Math.tanh(v + M.b3[j]));
    const r = matVec(M.W4, h2).map((v, j) => v + M.b4[j]);
    curve.push(r.map((v) => +v.toFixed(4)));
  }
  out.arc = {
    eigenvalues: arcP.eigenvalues,
    bestLinear: tailSum(arcP.eigenvalues, 1),
    linearLoss: lin.loss,
    linearDirection: [lin.W2[0][0], lin.W2[1][0]],
    pc1: arcP.components[0],
    nonlinearLoss: mlpLoss(ARC, M),
    hidden: 6,
    curve,
    codes: codes.map((v) => +v.toFixed(4)),
    recon: ARC.map((x) => mlpForward(M, x).r.map((v) => +v.toFixed(4))),
  };

  log("plane");
  const planeP = pca(PLANE);
  out.plane = {
    eigenvalues: planeP.eigenvalues,
    explained: planeP.explained,
    pc1: planeP.components[0],
    bestError: tailSum(planeP.eigenvalues, 1),
  };

  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const t0 = Date.now();
  const data = computeAll((s) => process.stdout.write("  " + s + "\n"));
  const here = dirname(fileURLToPath(import.meta.url));
  const body =
    "/*\n" +
    "  GENERATED by scripts/precompute.mjs - do not edit.\n\n" +
    "  Produced by the same modules the page imports (src/autoencoder.js,\n" +
    "  src/pca.js, src/linalg.js, src/datasets.js). verify/check-numbers.mjs\n" +
    "  re-runs every fit in here and fails if any number has moved.\n" +
    "*/\n" +
    "export default " + JSON.stringify(data) + ";\n";
  writeFileSync(join(here, "../src/precomputed.js"), body);
  console.log("wrote src/precomputed.js in " + ((Date.now() - t0) / 1000).toFixed(1) + "s, " +
              (body.length / 1024).toFixed(0) + " KB");
}
