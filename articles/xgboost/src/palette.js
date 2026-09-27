/*
  Chart colors and palette definitions for the XGBoost article.
  Aligned with MLU-Explain's design tokens and contrast standards.
*/

export const INK = "#232f3e"; // --squidink
export const SURFACE = "#f1f3f3"; // --paper
export const SKY = "#2074d5"; // --sky: current ensemble prediction y_hat
export const GHOST = "#9cbbe0"; // ghosted previous ensemble prediction
export const COSMOS = "#df2a5d"; // --cosmos: residuals / negative gradients
export const VIOLET = "#7c5aed"; // --violet: new tree f_t, split thresholds, gain
export const SMILE = "#ff9900"; // --smile: active drag handle, interactive point
export const JUNGLE = "#2f7d32"; // third series line — see note below
export const MUTED = "#9aa5b1"; // grid lines, subtle axes

export const SERIES = {
  prediction: SKY,
  residual: COSMOS,
  tree: VIOLET,
  target: INK,
  highlight: SMILE,
};

/*
  The third series colour was #00a86b. Against --cosmos it collapses under
  deuteranopia (OKLab ΔE 4.0, well under the 8 target), which is the classic
  red/green failure. #2f7d32 keeps the green reading, clears the lightness band
  and chroma floor, and lifts the worst all-pairs pair to ΔE 8.3 under
  deuteranopia and 25.4 under normal vision, above 3:1 contrast on both the
  white card and the paper background.
*/
