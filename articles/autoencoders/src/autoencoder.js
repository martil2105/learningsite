/*
  The autoencoders. Deliberately plain: full-batch gradient descent, no
  momentum, no tricks. Nothing here is about optimisation - the article is
  about what the optimum IS - and a plain loop is a loop a reader can check.

  Convention throughout: rows of X are examples, W1 is k x d (encoder) and W2
  is d x k (decoder), and the reconstruction of row x is W2 (W1 x).
*/
import { mulberry32, gaussian } from "./rng.js";
import { matMul, transpose, matVec, dot, eye, solve, zeros } from "./linalg.js";

export const reconstruct = (X, W1, W2) => X.map((x) => matVec(W2, matVec(W1, x)));

export function loss(X, W1, W2) {
  let s = 0;
  for (const x of X) {
    const r = matVec(W2, matVec(W1, x));
    for (let j = 0; j < x.length; j++) s += (x[j] - r[j]) ** 2;
  }
  return s / X.length;
}

/*
  The best encoder for a GIVEN decoder, in closed form. With W2 fixed, the loss
  is quadratic in W1 and the minimiser makes W2 W1 the orthogonal projector onto
  the column space of W2:

      W1* = (W2^T W2)^{-1} W2^T

  Two consequences the hook is built on. The reconstruction becomes the
  perpendicular drop onto the decoder's subspace - so the residuals go from
  slanted to square. And the loss stops depending on the LENGTH of W2 entirely:
  stretch the decoder and the encoder shrinks to match.
*/
export function optimalEncoder(W2) {
  const W2t = transpose(W2);
  const G = matMul(W2t, W2);
  return matMul(solve(G, eye(G.length)), W2t);
}

const randomMatrix = (r, c, rand, s = 0.35) =>
  Array.from({ length: r }, () => Array.from({ length: c }, () => gaussian(rand) * s));

/*
  Gradient descent on both matrices at once. For one example x, with code
  z = W1 x and reconstruction r = W2 z, the residual e = r - x gives

      dL/dW2 = e z^T          dL/dW1 = (W2^T e) x^T

  averaged over the batch and scaled by 2. Written out rather than derived in a
  comment because the checking script differentiates the loss numerically and
  compares.
*/
export function gradients(X, W1, W2, l2 = 0) {
  const k = W1.length;
  const d = W2.length;
  const g1 = zeros(k, d);
  const g2 = zeros(d, k);
  const n = X.length;
  for (const x of X) {
    const z = matVec(W1, x);
    const r = matVec(W2, z);
    const e = r.map((v, j) => v - x[j]);
    for (let j = 0; j < d; j++) for (let i = 0; i < k; i++) g2[j][i] += (2 / n) * e[j] * z[i];
    const back = Array.from({ length: k }, (_, i) => {
      let s = 0;
      for (let j = 0; j < d; j++) s += W2[j][i] * e[j];
      return s;
    });
    for (let i = 0; i < k; i++) for (let j = 0; j < d; j++) g1[i][j] += (2 / n) * back[i] * x[j];
  }
  if (l2 > 0) {
    // An L2 penalty on the weights themselves. It changes nothing about which
    // SUBSPACE is optimal, and everything about which basis of it the optimum
    // sits at: of all the (W1, W2) pairs that give the same reconstruction, the
    // penalty prefers the one with the smallest weights, and that single extra
    // condition is enough to pin down the principal directions.
    for (let i = 0; i < g1.length; i++) for (let j = 0; j < g1[i].length; j++) g1[i][j] += 2 * l2 * W1[i][j];
    for (let i = 0; i < g2.length; i++) for (let j = 0; j < g2[i].length; j++) g2[i][j] += 2 * l2 * W2[i][j];
  }
  return { g1, g2 };
}

export function step(X, W1, W2, lr, l2 = 0) {
  const { g1, g2 } = gradients(X, W1, W2, l2);
  return {
    W1: W1.map((row, i) => row.map((v, j) => v - lr * g1[i][j])),
    W2: W2.map((row, i) => row.map((v, j) => v - lr * g2[i][j])),
  };
}

export function trainLinear(X, k, { steps = 600, lr = 0.02, seed = 7, initScale = 0.35, trace = 0, l2 = 0, warm = null } = {}) {
  const d = X[0].length;
  const rand = mulberry32(seed);
  // `warm` continues a run that was already in progress, so a trace can measure
  // at a handful of log-spaced steps instead of at all twenty-five thousand.
  let W1 = warm ? warm.W1.map((r) => [...r]) : randomMatrix(k, d, rand, initScale);
  let W2 = warm ? warm.W2.map((r) => [...r]) : randomMatrix(d, k, rand, initScale);
  const history = [];
  for (let t = 0; t < steps; t++) {
    if (trace && (t % trace === 0 || t === steps - 1)) {
      history.push({ t, loss: loss(X, W1, W2), W1: W1.map((r) => [...r]), W2: W2.map((r) => [...r]) });
    }
    ({ W1, W2 } = step(X, W1, W2, lr, l2));
  }
  return { W1, W2, loss: loss(X, W1, W2), history, steps, lr, seed, l2 };
}

/* ------------------------------------------------------- the nonlinear one
   d -> h -> k -> h -> d with tanh on the two hidden layers and a linear code
   and output. Small enough to train with the same plain loop, and present for
   exactly one purpose: to show what a straight line cannot do.
*/
const tanh = Math.tanh;
const dtanh = (y) => 1 - y * y;

export function initMLP(d, h, k, seed) {
  const rand = mulberry32(seed);
  const m = (r, c, s) => Array.from({ length: r }, () => Array.from({ length: c }, () => gaussian(rand) * s));
  return {
    W1: m(h, d, 0.9), b1: new Array(h).fill(0),
    W2: m(k, h, 0.9), b2: new Array(k).fill(0),
    W3: m(h, k, 0.9), b3: new Array(h).fill(0),
    W4: m(d, h, 0.9), b4: new Array(d).fill(0),
  };
}

export function mlpForward(P, x) {
  const h1 = matVec(P.W1, x).map((v, i) => tanh(v + P.b1[i]));
  const z = matVec(P.W2, h1).map((v, i) => v + P.b2[i]);
  const h2 = matVec(P.W3, z).map((v, i) => tanh(v + P.b3[i]));
  const r = matVec(P.W4, h2).map((v, i) => v + P.b4[i]);
  return { h1, z, h2, r };
}

export const mlpLoss = (X, P) => {
  let s = 0;
  for (const x of X) {
    const { r } = mlpForward(P, x);
    for (let j = 0; j < x.length; j++) s += (r[j] - x[j]) ** 2;
  }
  return s / X.length;
};

export function trainMLP(X, P, { steps = 4000, lr = 0.02 } = {}) {
  const d = X[0].length;
  const h = P.W1.length;
  const k = P.W2.length;
  const n = X.length;
  const zeroLike = (M) => M.map((row) => new Array(row.length).fill(0));

  for (let t = 0; t < steps; t++) {
    const g = {
      W1: zeroLike(P.W1), b1: new Array(h).fill(0),
      W2: zeroLike(P.W2), b2: new Array(k).fill(0),
      W3: zeroLike(P.W3), b3: new Array(h).fill(0),
      W4: zeroLike(P.W4), b4: new Array(d).fill(0),
    };
    for (const x of X) {
      const { h1, z, h2, r } = mlpForward(P, x);
      const e = r.map((v, j) => (2 / n) * (v - x[j]));
      for (let j = 0; j < d; j++) {
        g.b4[j] += e[j];
        for (let i = 0; i < h; i++) g.W4[j][i] += e[j] * h2[i];
      }
      const d2 = Array.from({ length: h }, (_, i) => {
        let s = 0;
        for (let j = 0; j < d; j++) s += P.W4[j][i] * e[j];
        return s * dtanh(h2[i]);
      });
      for (let i = 0; i < h; i++) {
        g.b3[i] += d2[i];
        for (let j = 0; j < k; j++) g.W3[i][j] += d2[i] * z[j];
      }
      const dz = Array.from({ length: k }, (_, j) => {
        let s = 0;
        for (let i = 0; i < h; i++) s += P.W3[i][j] * d2[i];
        return s;
      });
      for (let j = 0; j < k; j++) {
        g.b2[j] += dz[j];
        for (let i = 0; i < h; i++) g.W2[j][i] += dz[j] * h1[i];
      }
      const d1 = Array.from({ length: h }, (_, i) => {
        let s = 0;
        for (let j = 0; j < k; j++) s += P.W2[j][i] * dz[j];
        return s * dtanh(h1[i]);
      });
      for (let i = 0; i < h; i++) {
        g.b1[i] += d1[i];
        for (let j = 0; j < d; j++) g.W1[i][j] += d1[i] * x[j];
      }
    }
    for (const key of ["W1", "W2", "W3", "W4"]) {
      P[key] = P[key].map((row, i) => row.map((v, j) => v - lr * g[key][i][j]));
    }
    for (const key of ["b1", "b2", "b3", "b4"]) {
      P[key] = P[key].map((v, i) => v - lr * g[key][i]);
    }
  }
  return P;
}
