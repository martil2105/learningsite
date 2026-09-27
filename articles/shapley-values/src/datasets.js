/*
  Synthetic apartment data for the second half of the article.

  One row per RENTAL LISTING in a made-up city. Three features, monthly rent in
  kroner as the target. The generating function is deliberately multiplicative
  in size and distance:

      rent = 3000 + size * (360 - 20 * distance) + 250 * floor + noise

  so the value of a kilometre depends on how many square metres you are moving.
  That interaction is the reason the article needs Shapley values at all: there
  is no single number for "what distance is worth" to read off the model, only
  a number for what it is worth to a particular listing.

  Everything is generated from a seeded PRNG so the figures and the numbers
  quoted in the prose never drift apart.
*/

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

function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Feature order is fixed everywhere: 0 = size, 1 = distance, 2 = floor.
export const FEATURES = [
  { key: "size", name: "Size", unit: "m²", short: "size", digits: 0 },
  { key: "distance", name: "Distance to centre", unit: "km", short: "distance", digits: 1 },
  { key: "floor", name: "Floor", unit: "", short: "floor", digits: 0 },
];

export const NOISE_SD = 900;

export function trueRent(x) {
  return 3000 + x[0] * (360 - 20 * x[1]) + 250 * x[2];
}

function makeRows(seed, n) {
  const rng = mulberry32(seed);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const size = 28 + rng() * 67; // 28 - 95 m²
    const distance = 0.4 + rng() * 8.6; // 0.4 - 9.0 km
    const floor = Math.floor(rng() * 8); // 0 - 7
    const x = [size, distance, floor];
    rows.push({ x, y: trueRent(x) + gauss(rng) * NOISE_SD });
  }
  return rows;
}

export const trainRows = makeRows(20260906, 400);
export const testRows = makeRows(77712, 150);

/*
  The two listings the article explains. Same distance from the centre, very
  different size — which is the whole demonstration, because under this model
  the kilometres cannot be worth the same to both.
*/
export const LISTINGS = [
  { key: "large", label: "the large flat", x: [72, 6.5, 1] },
  { key: "small", label: "the studio", x: [32, 6.5, 1] },
];
