/*
  The fixed scenarios the prose names, and the sweeps the figures draw.
  Every number in the article comes from here or from the modules it calls —
  nothing is typed into a sentence.
*/
import { BASE, mixed, values, criticalFine, tolerated } from "./game.js";

export { BASE };

/* The fines the prose stops at, in thousands of kroner. */
export const FINE_PRESETS = [20, 140, 340, 10000];

/* A wide sweep for the identity figure: the fine over three orders of magnitude. */
export function fineSweep(steps = 240, fMax = 1200) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const F = (fMax * i) / steps;
    const P = { ...BASE, F };
    const m = mixed(P);
    out.push({ F, p: m.p, q: m.q, inv: 1 / m.q, ...values(P) });
  }
  return out;
}

/*
  The invariance claim, run live: every trader-side number replaced, the breach
  rate measured each time. The figure draws the cloud; the check asserts the
  spread is exactly zero.
*/
export function traderSweep(rand, n = 4000) {
  const target = BASE.C / (BASE.V + BASE.L);
  let worst = 0;
  const points = [];
  for (let i = 0; i < n; i++) {
    const G = rand() * 400 + 1;
    const F = rand() * 4000 + 1;
    const { p, q } = mixed({ ...BASE, G, F });
    worst = Math.max(worst, Math.abs(p - target));
    if (i < 900) points.push({ G, F, p, q });
  }
  return { target, worst, points, n };
}

/* The floor model, as a curve of breach rate against fine at a given floor. */
export function floorSweep(qbar, steps = 240, fMax = 1200) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const F = (fMax * i) / steps;
    const P = { ...BASE, F };
    out.push({ F, breach: qbar > tolerated(P) ? 0 : BASE.C / (BASE.V + BASE.L) });
  }
  return { qbar, critical: criticalFine(BASE, qbar), curve: out };
}

export const FLOOR_PRESETS = [0, 0.05, 0.15, 0.25, 0.5];

/* What the risk desk can actually change, and by how much. */
export function leverSweep(key, lo, hi, steps = 120) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const v = lo + ((hi - lo) * i) / steps;
    out.push({ v, p: mixed({ ...BASE, [key]: v }).p });
  }
  return out;
}
