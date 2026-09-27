/*
 * nplayer.js - Sequential best-response solver for common-pool resource games
 */

const g = (Math.sqrt(5) - 1) / 2;

function gmin(fn, lo, hi, it = 200) {
  for (let i = 0; i < it; i++) {
    const x = hi - g * (hi - lo);
    const y = lo + g * (hi - lo);
    if (fn(x) < fn(y)) hi = y;
    else lo = x;
  }
  return (lo + hi) / 2;
}

export function solveCommons(n, theta = 0.5, A = 100, w = 1, iters = 30000) {
  const Eeff = Math.pow((theta * A) / w, 1 / (1 - theta));
  let e = new Array(n).fill(Eeff / n);

  const pay = (ei, others) => {
    const E = ei + others;
    return E <= 0 ? 0 : (ei / E) * A * Math.pow(E, theta) - w * ei;
  };

  for (let it = 0; it < iters; it++) {
    const i = it % n;
    let others = 0;
    for (let j = 0; j < n; j++) {
      if (j !== i) others += e[j];
    }
    e[i] = gmin((x) => -pay(x, others), 1e-9, Math.max(10 * Eeff, 1), 200);
  }
  return e;
}
