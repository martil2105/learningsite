/*
  Chart colours for this article.

  The two series colours are MLU-Explain brand hues (--sky and --cosmos from
  global.css), checked as a categorical pair on the all-pairs test against the
  --paper surface: worst pair ΔE 19.1 under protanopia, 32.6 under normal
  vision, both above 3:1 contrast on the page background.

  The score ramp is a single-hue sequential scale built on --violet, running
  light to dark with a monotone lightness step of at least 0.06 in OKLCH and a
  light end that still clears 2:1 against the page.
*/

export const INK = "#232f3e"; // --squidink
export const SURFACE = "#f1f3f3"; // --paper
export const ACCENT = "#7c5aed"; // --violet
export const PROBE = "#ff9900"; // --smile

export const SERIES = {
  normal: "#2074d5", // --sky
  anomaly: "#df2a5d", // --cosmos
};

export const SCORE_RAMP = [
  "#a79eea",
  "#8c82d2",
  "#7366b9",
  "#5b4ba1",
  "#45308a",
  "#311072",
];

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const RAMP_RGB = SCORE_RAMP.map(hexToRgb);

// Piecewise-linear walk along the ramp. t is clamped to [0, 1].
export function rampColor(t) {
  const u = Math.max(0, Math.min(1, t)) * (RAMP_RGB.length - 1);
  const i = Math.min(RAMP_RGB.length - 2, Math.floor(u));
  const f = u - i;
  const a = RAMP_RGB[i];
  const b = RAMP_RGB[i + 1];
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}
