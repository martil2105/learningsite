/*
  Pre-seeded datasets for supply-and-demand.
  Seeded so that every render is identical, smooth on sliders, and passes verification.
*/
import { mulberry32, gaussian } from "./rng.js";
import { A, B, C, S, clearMarket } from "./market.js";

/* 18 months of market observations for TheQuestion */
export function generateQuestionData() {
  const rand = mulberry32(182026);
  // Mild mix of demand and supply shocks, predominantly demand shocks (w ~ 0.7) so it slopes upward slightly
  const points = [];
  const td = 7;
  const ts = 4;
  for (let month = 1; month <= 18; month++) {
    const u = td * gaussian(rand);
    const v = ts * gaussian(rand);
    const { p, q } = clearMarket(u, v);
    points.push({ month, p, q, u, v });
  }
  return points;
}

export const questionPoints = generateQuestionData();

/* 60 standard normal shock pairs (zd, zs) for CloudLab */
export function generateBaseShocks(n = 60, seed = 20260917) {
  const rand = mulberry32(seed);
  const shocks = [];
  for (let i = 0; i < n; i++) {
    shocks.push({
      zd: gaussian(rand),
      zs: gaussian(rand),
    });
  }
  return shocks;
}

export const baseShocks = generateBaseShocks(60);

/* Generate observations for CloudLab given shock share w and total variance V */
export function computeCloudPoints(w, base = baseShocks, totalVar = 100) {
  const td = Math.sqrt(w * totalVar);
  const ts = Math.sqrt((1 - w) * totalVar);
  return base.map(({ zd, zs }) => {
    const u = td * zd;
    const v = ts * zs;
    const { p, q } = clearMarket(u, v);
    return { p, q, u, v };
  });
}

/* 100 points for ShifterFigure: supply shifter z in {-1, 1} with g = 6 */
export function generateShifterData(n = 80, seed = 4242) {
  const rand = mulberry32(seed);
  const points = [];
  const g = 6;
  const td = 5;
  const ts = 3;
  for (let i = 0; i < n; i++) {
    const z = rand() > 0.5 ? 1 : -1;
    const u = td * gaussian(rand);
    const v = ts * gaussian(rand);
    // supply is q = C + S*p + g*z + v
    // excess demand: (A - B*p + u) - (C + S*p + g*z + v) = 0
    const effV = g * z + v;
    const { p, q } = clearMarket(u, effV);
    points.push({ p, q, z, u, v });
  }
  return points;
}

export const shifterPoints = generateShifterData();
