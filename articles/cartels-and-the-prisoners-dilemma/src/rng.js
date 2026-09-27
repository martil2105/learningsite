/*
  A seeded generator, so that every number in this article is the same number
  on every machine and the checks in verify/ re-derive exactly what the page
  draws. Math.random() would make the prose unverifiable.

  mulberry32: 32-bit state, one multiply-xorshift round. Not cryptographic and
  not meant to be - it needs to be reproducible and roughly uniform, and it is.
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

// Box-Muller. One of the pair is discarded; at these sample sizes the cost is
// irrelevant and keeping both would make the stream order harder to reason about.
export function gaussian(rand) {
  let u = 0;
  while (u === 0) u = rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Fisher-Yates, driven by the same stream.
export function shuffled(array, rand) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
