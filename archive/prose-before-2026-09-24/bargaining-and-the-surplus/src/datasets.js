/*
  The article's bargaining problem. One surplus, normalised to 1; the base
  impatience rates are chosen so the continuous-time limit is exactly 3/4.
*/
export const R_A = 0.05; // A's impatience rate, per unit time
export const R_B = 0.15; // B's impatience rate
export const T_MAX = 40; // the horizon scrubber's top round
export const DTS = [1, 0.1, 0.01, 0.001]; // offer periods on the presets
export const FALLBACK_MAX = 1; // the outside-option slider's top, as a share