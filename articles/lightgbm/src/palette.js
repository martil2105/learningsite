/*
  Chart colours for the LightGBM article.

  Two series carry almost everything here - "exact" against "histogram" - so the
  validated pair does the work, with the third validated colour held for the
  occasional third line (a second bin setting, a held-out curve). Re-checked with
  the all-pairs procedure against both surfaces this article uses (--paper
  #f1f3f3 for the page, #ffffff for the chart cards):

    lightness band   PASS   all three inside L 0.43-0.77
    chroma floor     PASS   all three >= 0.1
    CVD separation   PASS   worst all-pairs #2f7d32 <-> #df2a5d  dE 8.3 deutan
    normal vision    PASS   worst all-pairs #2f7d32 <-> #2074d5  dE 25.4
    contrast         PASS   all three >= 3:1 on both surfaces

  --violet (#7c5aed) is an interface accent only: against --sky it is dE 3.6
  under deuteranopia, a hard fail, so it never sits beside a series mark. Bin
  edges and the selected split are drawn in it because they are annotations on
  the chart rather than data series.
*/

export const INK = "#232f3e"; // --squidink
export const SURFACE = "#f1f3f3"; // --paper
export const CARD = "#ffffff";
export const MUTED = "#9aa5b1"; // grid, axes, the exact curve when backgrounded
export const FAINT = "#e2e8f0"; // hairlines, card borders
export const ACCENT = "#7c5aed"; // --violet: UI and annotation only
export const SMILE = "#ff9900"; // --smile: the chosen split

export const EXACT = "#df2a5d"; // every candidate, the thing being approximated
export const HIST = "#2074d5"; // the binned candidates
export const THIRD = "#2f7d32"; // held-out curves, third series

// Ordinal shading for bin counts, when several are drawn at once. Single-hue
// violet ramp, monotone in lightness with dL >= 0.06 between steps.
export const BIN_RAMP = ["#a79eea", "#8c82d2", "#7366b9", "#5b4ba1", "#45308a", "#311072"];
