/*
  Synthetic datasets for the XGBoost article.

  Scenario: one row per DAY. Electricity a single household used that day (kWh),
  against the outdoor temperature that day (°C).
  - Cold weather (< 10°C) triggers electric resistance heating and heat pumps.
  - Mild weather (15°C - 20°C) operates at the baseline (appliances, refrigeration).
  - Hot weather (> 24°C) triggers air conditioning compressors.

  Generated with a seedable PRNG (mulberry32) so numbers and graphs stay deterministic.
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

export const BOUNDS = {
  x0: -10,
  x1: 35,
  y0: 10,
  y1: 95,
};

export const AXIS = {
  x: "Outdoor Temperature (°C)",
  y: "Electricity Demand (kWh / day)",
};

export function trueFunction(temp) {
  // Underlying physical curve
  if (temp < 15) {
    const delta = 15 - temp;
    return 22 + 1.8 * delta + 0.025 * delta * delta;
  } else if (temp > 22) {
    const delta = temp - 22;
    return 22 + 1.6 * delta + 0.04 * delta * delta;
  }
  return 22 + 0.2 * Math.sin((temp - 15) * 0.8);
}

export function generateEnergyData() {
  const rng = mulberry32(42069);
  const temps = [
    -9.2, -8.0, -6.5, -5.1, -3.8, -2.2, -0.5,
    1.2, 3.0, 5.2, 7.1, 9.5, 11.8, 14.0,
    16.2, 17.8, 19.5, 21.0, 22.8, 24.5, 26.0,
    27.8, 29.2, 31.0, 32.5, 34.0,
  ];

  return temps.map((x, i) => {
    const cleanY = trueFunction(x);
    const noise = gauss(rng) * 2.8;
    const y = Math.round((cleanY + noise) * 10) / 10;
    return {
      id: i,
      x,
      y: Math.max(BOUNDS.y0 + 2, Math.min(BOUNDS.y1 - 2, y)),
      origY: y,
    };
  });
}

export const energyData = generateEnergyData();

// Curated 10-point sample for the single-tree walkthrough in ScrollSide.svelte
export const smallSample = [
  { id: "s0", x: -8.0, y: 76.5 },
  { id: "s1", x: -4.0, y: 62.0 },
  { id: "s2", x: 0.5, y: 51.5 },
  { id: "s3", x: 6.0, y: 40.0 },
  { id: "s4", x: 12.0, y: 28.5 },
  { id: "s5", x: 17.5, y: 21.0 },
  { id: "s6", x: 21.0, y: 23.5 },
  { id: "s7", x: 25.5, y: 32.0 },
  { id: "s8", x: 29.5, y: 44.5 },
  { id: "s9", x: 33.5, y: 61.0 },
];

// Extreme outlier for the regularization demonstration
export const outlierPoint = {
  id: "outlier",
  x: 18.0,
  y: 86.0, // High demand in mild weather (e.g. crypto mining or heated swimming pool)
  label: "Uninsulated Greenhouse",
};

/*
  Held-out days: the same physics, the same noise, drawn from a different seed
  and never shown to the model.

  This exists because training error is not the quantity any of this article's
  claims are about. Every curve in the article that argues about shrinkage or
  overfitting is an argument about generalization, and on training data alone
  the argument runs backwards: less shrinkage always looks better, because more
  of each tree gets to memorise the sample.
*/
export function generateTestData(n = 240, seed = 90210) {
  const rng = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = BOUNDS.x0 + rng() * (BOUNDS.x1 - BOUNDS.x0);
    const y = trueFunction(x) + gauss(rng) * 2.8;
    out.push({ id: `t${i}`, x, y });
  }
  return out;
}

export const testData = generateTestData();
