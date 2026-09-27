/*
  Chart colours for the Shapley values article.

  Three players / three features need a categorical triple. Validated with the
  data-viz all-pairs check against both surfaces this article uses (--paper
  #f1f3f3 for the page, #ffffff for the chart cards):

    lightness band   PASS   all three inside L 0.43-0.77
    chroma floor     PASS   all three >= 0.1
    CVD separation   PASS   worst all-pairs #2f7d32 <-> #df2a5d  dE 8.3 deutan
    normal vision    PASS   worst all-pairs #2f7d32 <-> #2074d5  dE 25.4
    contrast         PASS   all three >= 3:1 on both surfaces

  The deutan 8.3 and the tritan 7.5 on that same pair sit on the floor, so every
  coloured mark in this article also carries a name or an initial. Colour is
  never the only thing distinguishing two players.

  --violet (#7c5aed) is deliberately NOT a series colour: against --sky it is
  dE 3.6 under deuteranopia and 11.8 under normal vision, which is a hard fail.
  It is used only for interface accents that never sit next to a player mark.
*/

export const INK = "#232f3e"; // --squidink
export const SURFACE = "#f1f3f3"; // --paper
export const CARD = "#ffffff";
export const MUTED = "#9aa5b1"; // grid, axes, inactive
export const FAINT = "#e2e8f0"; // hairlines, card borders
export const ACCENT = "#7c5aed"; // --violet: UI only, never a mark
export const SMILE = "#ff9900"; // --smile: the active drag handle

// The categorical triple. Index order is fixed and never cycled.
export const PLAYER_COLORS = ["#2074d5", "#df2a5d", "#2f7d32"];

// The waterfall reads as polarity, not identity: two hues either side of a
// neutral baseline. Both are drawn from the validated pair above.
export const PUSH_UP = "#df2a5d"; // contribution raises the prediction
export const PUSH_DOWN = "#2074d5"; // contribution lowers it
