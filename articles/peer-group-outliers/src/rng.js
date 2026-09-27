/*
  A seeded generator, so every number on the page is the same number on every
  machine, and the checks re-derive exactly what the page draws.

  mulberry32: 32-bit state, one multiply-xorshift round. Not cryptographic and
  not meant to be.
*/
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller; one of the pair is discarded so the stream order stays simple.
export function gaussian(r) {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

// Knuth's product method for small rates, a rounded normal for large ones.
export function poisson(r, lam) {
  if (lam > 40) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gaussian(r)));
  const L = Math.exp(-lam);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}

export const logn = (r, med, s) => med * Math.exp(s * gaussian(r));
