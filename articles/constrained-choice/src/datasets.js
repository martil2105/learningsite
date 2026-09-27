/*
  The article's one worker. Every figure uses these numbers, so a reader who
  learns the frontier in the first figure is looking at the same person in the
  last one.

  a = 0.5 and T = 16 are chosen so the Cobb-Douglas answer is an exactly
  eight-hour working day — a number worth recognising when it refuses to move.
*/
export const BASE = { a: 0.5, T: 16, sigma: 1 };

export const W_MIN = 30;
export const W_MAX = 90;
export const W_DEFAULT = 45;

/* Named regimes, used by the preset buttons and by the prose that names them. */
export const REGIMES = [
  { sigma: 0.5, label: "σ = 0.5", gloss: "poor substitutes — hours fall" },
  { sigma: 1, label: "σ = 1", gloss: "Cobb–Douglas — hours do not move" },
  { sigma: 2, label: "σ = 2", gloss: "good substitutes — hours rise" },
];

/* The subsistence figure runs over a much wider wage range than the lab. */
export const SUB_W_MIN = 5;
export const SUB_W_MAX = 800;
export const CBAR_DEFAULT = 40;
