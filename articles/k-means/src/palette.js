/*
  Chart colours for the k-means article.

  k = 3 throughout the main demonstrations, which is what makes this palette
  workable: three clusters need exactly three categorical marks, and the
  project's validated triple has exactly three entries. Re-checked here with
  the data-viz all-pairs procedure against both surfaces this article uses
  (--paper #f1f3f3 for the page, #ffffff for the chart cards):

    lightness band   PASS   all three inside L 0.43-0.77
    chroma floor     PASS   all three >= 0.1
    CVD separation   PASS   worst all-pairs #2f7d32 <-> #df2a5d  dE 8.3 deutan
    normal vision    PASS   worst all-pairs #2f7d32 <-> #2074d5  dE 25.4
    contrast         PASS   all three >= 3:1 on both surfaces

  Cluster identity is never carried by colour alone: every centroid also
  carries a numeral, and the Voronoi cell it owns is outlined.

  --violet (#7c5aed) is deliberately NOT a cluster colour. Against --sky it is
  dE 3.6 under deuteranopia and 11.8 under normal vision, a hard fail. It is
  used only for interface accents - active pills, focus rings, the step border
  on a scrollytelling card - which never sit beside a cluster mark.

  The figures that need more than three levels (choosing k, where k runs to 8)
  do not colour by cluster at all. They use the validated single-hue violet
  ramp for ordinal shading, or leave the points ink and outline the cells.
*/

export const INK = "#232f3e"; // --squidink
export const SURFACE = "#f1f3f3"; // --paper
export const CARD = "#ffffff";
export const MUTED = "#9aa5b1"; // grid, axes, unassigned points
export const FAINT = "#e2e8f0"; // hairlines, card borders
export const ACCENT = "#7c5aed"; // --violet: UI only, never a mark
export const SMILE = "#ff9900"; // --smile: the centroid you are dragging

// The categorical triple. Index order is fixed and never cycled.
export const CLUSTER_COLORS = ["#2074d5", "#df2a5d", "#2f7d32"];

// Very light cell washes, one per cluster, for the Voronoi regions. These sit
// under the points, so they are tints rather than marks.
export const CLUSTER_WASH = ["#e8f1fc", "#fdeaf0", "#e9f3ea"];

// Single-hue violet ramp, monotone in lightness with dL >= 0.06 between steps
// and a light end above 2:1 on paper. Ordinal use only.
export const VIOLET_RAMP = ["#a79eea", "#8c82d2", "#7366b9", "#5b4ba1", "#45308a", "#311072"];
