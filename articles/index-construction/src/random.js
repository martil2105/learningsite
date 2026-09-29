// Seeded random numbers shared by every simulation, so a figure draws the same
// paths on every load and the checks can reproduce them.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal draws by Box-Muller, caching the second value.
export function normals(seed) {
  const u = mulberry32(seed);
  let spare = null;
  return function () {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let a = 0; while (a === 0) a = u();
    const b = u();
    const r = Math.sqrt(-2 * Math.log(a));
    spare = r * Math.sin(2 * Math.PI * b);
    return r * Math.cos(2 * Math.PI * b);
  };
}
