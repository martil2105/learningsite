/*
  A synthetic regression problem, generated from a seeded stream so that the
  page and verify/check-numbers.mjs see identical rows.

  The features are deliberately shaped differently from one another, because the
  whole article is about what happens when you replace a column with a histogram
  of it, and a column's shape is what decides where its bin edges land. Two are
  heavily skewed, one is bimodal, one is uniform.

  Nothing here is a real dataset and the article never pretends otherwise. It is
  a delivery-time problem because that makes the skew plausible - most parcels go
  a short way, a few go a long way - not because it is data about deliveries.
*/
import { mulberry32, gaussian } from "./rng.js";

export const FEATURES = [
  { key: "distance", name: "distance", unit: "km", short: "dist" },
  { key: "weight", name: "parcel weight", unit: "kg", short: "wt" },
  { key: "hour", name: "hour of day", unit: "h", short: "hr" },
  { key: "stops", name: "stops on the route", unit: "", short: "stops" },
];

export const N_TRAIN = 6000;
export const N_TEST = 3000;
export const NOISE_SD = 4.0; // minutes; the irreducible floor

/*
  Minutes. Nonlinear in distance (traffic slows the long routes), nonlinear in
  hour (two rush peaks), and it carries one genuine interaction: weight only
  costs time when there are stops to carry it between.
*/
function trueFunction(d, w, h, s) {
  const drive = 6 * Math.pow(d, 0.78);
  const rush = 9 * Math.exp(-Math.pow((h - 8.5) / 1.6, 2)) + 11 * Math.exp(-Math.pow((h - 17) / 1.9, 2));
  const handling = 1.6 * s + 0.045 * w * s;
  return 8 + drive + rush + handling;
}

function draw(rand, n) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    /*
      Three continuous features and one small-integer one, on purpose. The
      continuous ones have as many distinct values as there are rows, so max_bin
      is a real constraint on them and the sweep in the article measures
      something. `stops` has fifteen distinct values, fewer than any bin count
      worth using, so it is never binned at all - which is a fact about every
      real dataset with an integer column in it, and the article says so.
    */
    // Skewed: most deliveries are local, a few are not.
    const distance = 0.8 + Math.exp(gaussian(rand) * 0.85 + 1.05);
    // Skewed the other way.
    const weight = 0.2 + Math.exp(gaussian(rand) * 0.9 + 0.5);
    // Bimodal: a morning wave and an afternoon wave.
    const hour = Math.min(21, Math.max(6, rand() < 0.45
      ? 8.6 + gaussian(rand) * 1.7
      : 16.4 + gaussian(rand) * 2.1));
    const stops = Math.max(1, Math.min(20, Math.round(3 + Math.abs(gaussian(rand)) * 4)));
    const y = trueFunction(distance, weight, hour, stops) + gaussian(rand) * NOISE_SD;
    rows.push({ x: [distance, weight, hour, stops], y });
  }
  return rows;
}

const rand = mulberry32(20260907);
export const TRAIN = draw(rand, N_TRAIN);
export const TEST = draw(rand, N_TEST);

// Column views, which is how every split finder actually wants the data.
export const column = (rows, j) => Float64Array.from(rows, (r) => r.x[j]);
export const targets = (rows) => Float64Array.from(rows, (r) => r.y);

export const TRAIN_COLS = FEATURES.map((_, j) => column(TRAIN, j));
export const TRAIN_Y = targets(TRAIN);
export const TEST_COLS = FEATURES.map((_, j) => column(TEST, j));
export const TEST_Y = targets(TEST);

/*
  A second, deliberately adversarial problem for the section on what binning
  costs. The signal lives entirely inside a narrow window of one feature: below
  0.44 and above 0.50 the target is flat. A bin edge has to land inside that
  window for a tree to see it at all, and a coarse binning will not put one there.
*/
export const NEEDLE_WIDTH = 0.035;
export const NEEDLE_LO = 0.417;
export const NEEDLE_HI = NEEDLE_LO + NEEDLE_WIDTH;

export function needleData(n, seed) {
  const r = mulberry32(seed);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const x = r();
    const inWindow = x >= NEEDLE_LO && x < NEEDLE_HI;
    rows.push({ x: [x], y: (inWindow ? 10 : 0) + gaussian(r) * 1.0 });
  }
  return rows;
}
export const NEEDLE_TRAIN = needleData(4000, 606);
export const NEEDLE_TEST = needleData(2000, 607);
