// A lifetime portfolio problem solved backwards, after Samuelson (1969).
//
// Each year the stock either goes up (gross return UP) or down (DOWN), and a
// safe bond returns R. We pick a share pi of wealth for the stock each year
// and care only about wealth at the end, through
//   u(W) = (W - F)^(1 - g) / (1 - g),
// with g = GAMMA. F = 0 is Samuelson's isoelastic case; F > 0 is a floor we
// must end above. In the mean-reverting variant, the chance of an up year
// depends on whether last year was up or down, with the same long-run average.
//
// The solver works backwards from the end: with k years to go, it picks the
// share that maximises the expected value of next year's value function,
// found at k - 1. Values are stored as G = log((1 - g) V), which is linear in
// log W for the isoelastic case, and interpolated linearly in log W.

export const UP = 1.25;
export const DOWN = 0.89;
export const R = 1.02;
export const GAMMA = 2;
export const YEARS = 30;
export const FLOOR = 1;
export const REVERT = 0.1; // up-chance 0.4 after an up year, 0.6 after a down one

const A = UP - R, B = R - DOWN;

// One year, isoelastic, up-chance p: the first-order condition
// p A (R + pi A)^-g = (1 - p) B (R - pi B)^-g solves in closed form.
export function oneYearShare(p = 0.5, g = GAMMA) {
  const k = Math.pow((p * A) / ((1 - p) * B), 1 / g);
  return (R * (k - 1)) / (A + k * B);
}
export const SAMUELSON_SHARE = oneYearShare();

// The floor case in closed form: hold the floor's present value in bonds and
// the isoelastic share of what's left.
export const floorShare = (W, k, F = FLOOR) => SAMUELSON_SHARE * (1 - (F * Math.pow(R, -k)) / W);

// The wealth grid, in logs.
export const GRID = (() => { const n = 241, lo = Math.log(0.02), hi = Math.log(60); return Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1)); })();

function interp(G, lw) {
  const n = GRID.length, h = GRID[1] - GRID[0];
  let j = Math.floor((lw - GRID[0]) / h);
  if (j < 0) j = 0; else if (j > n - 2) j = n - 2;
  const t = (lw - GRID[j]) / h;
  return G[j] + t * (G[j + 1] - G[j]);
}

// Solve the problem. case: "samuelson" | "floor" | "revert". Returns
// share[k][s][i]: the best share with k years to go, in state s (0 after an up
// year, 1 after a down year), at the i-th grid point. The grid is over the log
// of wealth above what the floor needs with k years to go, W - F R^-k (plain
// log W when there's no floor), so both cases are stored on the same footing.
export const reserve = (k, F) => F * Math.pow(R, -k);
export function solve(kase = "samuelson", years = YEARS, g = GAMMA) {
  const F = kase === "floor" ? FLOOR : 0;
  const pUp = kase === "revert" ? [0.5 - REVERT, 0.5 + REVERT] : [0.5, 0.5];
  const n = GRID.length;
  // terminal values: G = (1 - g) log(W - F)
  let G = [0, 1].map(() => GRID.map((x) => (1 - g) * x));
  const share = [null];
  for (let k = 1; k <= years; k++) {
    const need = reserve(k - 1, F); // next year's wealth must stay above this
    const Gk = [new Float64Array(n), new Float64Array(n)], Sk = [new Float64Array(n), new Float64Array(n)];
    for (let s = 0; s < 2; s++) {
      const p = pUp[s];
      for (let i = 0; i < n; i++) {
        const W = Math.exp(GRID[i]) + reserve(k, F);
        // feasible shares keep both outcomes above next year's reserve
        const hiP = Math.min(20, (W * R - need) / (W * B) - 1e-9), loP = Math.max(-20, -(W * R - need) / (W * A) + 1e-9);
        const f = (pi) => {
          const su = W * (R + pi * A) - need, sd = W * (R - pi * B) - need;
          if (!(su > 0 && sd > 0)) return Infinity;
          return p * Math.exp(interp(G[0], Math.log(su))) + (1 - p) * Math.exp(interp(G[1], Math.log(sd))); // minimise: V = e^G / (1 - g), 1 - g < 0
        };
        let a = loP, b = hiP; const q = (Math.sqrt(5) - 1) / 2;
        let c = b - q * (b - a), d = a + q * (b - a), fc = f(c), fd = f(d);
        for (let it = 0; it < 64; it++) {
          if (fc < fd) { b = d; d = c; fd = fc; c = b - q * (b - a); fc = f(c); }
          else { a = c; c = d; fc = fd; d = a + q * (b - a); fd = f(d); }
        }
        const best = (a + b) / 2;
        Sk[s][i] = best;
        Gk[s][i] = Math.log(f(best));
      }
    }
    G = Gk;
    share.push(Sk);
  }
  return { share, F };
}

// The best share at wealth W with k years to go, in state s.
export function shareAt(sol, k, s, W) {
  const x = W - reserve(k, sol.F);
  return x > 0 ? interp(sol.share[k][s], Math.log(x)) : NaN;
}
