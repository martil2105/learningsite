/*
  Chart colours for the autoencoders article.

  Two series carry the argument almost everywhere - what PCA does against what
  the autoencoder does - so the validated pair does the work and the third is
  held for the nonlinear case. Re-checked with the all-pairs procedure against
  both surfaces this article uses (--paper #f1f3f3, #ffffff for the cards):

    lightness band   PASS   all three inside L 0.43-0.77
    chroma floor     PASS   all three >= 0.1
    CVD separation   PASS   worst all-pairs #2f7d32 <-> #df2a5d  dE 8.3 deutan
    normal vision    PASS   worst all-pairs #2f7d32 <-> #2074d5  dE 25.4
    contrast         PASS   all three >= 3:1 on both surfaces

  --violet is an interface accent only: against --sky it is dE 3.6 under
  deuteranopia. It draws the thing the reader is holding - the decoder vector -
  which is a control rather than a data series and never sits beside a mark.
*/

export const INK = "#232f3e";
export const SURFACE = "#f1f3f3";
export const CARD = "#ffffff";
export const MUTED = "#9aa5b1";
export const FAINT = "#e2e8f0";
export const ACCENT = "#7c5aed"; // the decoder vector: a control, not a series
export const SMILE = "#ff9900"; // the handle being dragged

export const PCA = "#df2a5d"; // the principal direction, and anything PCA does
export const AE = "#2074d5"; // the autoencoder's answer
export const NONLIN = "#2f7d32"; // the nonlinear autoencoder

// Ordinal shading, when several training snapshots are drawn at once.
export const STEP_RAMP = ["#a79eea", "#8c82d2", "#7366b9", "#5b4ba1", "#45308a", "#311072"];
