/*
  Chart colours.

  A clustering article wants one colour per cluster and the house ceiling is
  three categorical colours, so the encoding does the work instead of the
  palette. What DBSCAN actually computes is the union of the eps-discs around
  its core points, and that is what these figures draw: each cluster is a
  REGION with an outline. Two clusters are told apart by being two shapes, not
  by being two hues, so the three hues only have to keep NEIGHBOURING regions
  apart, and they cycle by cluster index.

  Points carry two states and no more: in some cluster (ink) or noise (the
  neutral). The neutral is deliberately the one colour here that is not a hue -
  noise is the background class and has to recede.

  Validated with scripts/validate_palette.js against both surfaces, all pairs:

    lightness band   PASS   all three inside L 0.52-0.60
    chroma floor     PASS
    normal vision    PASS   worst 25.4   #2074d5 <-> #2f7d32
    Vienot deutan    PASS   worst 18.5   #2074d5 <-> #2f7d32
    Machado deutan   PASS   worst  8.3   #df2a5d <-> #2f7d32   (the tight one)
    contrast         PASS   worst 4.08:1 on --paper

  The 8.3 is the same worst pair the earlier articles record, and it is only
  ever reached by two REGION OUTLINES, never by two dots: a region carries an
  area and a border, which is a great deal more signal than 8.3 points of
  colour distance on a 3px circle.
*/

export const INK = "#232f3e";
export const SURFACE = "#f1f3f3";
export const CARD = "#ffffff";
export const FAINT = "#e2e8f0";
export const GRID = "#eef1f5";
export const AXIS = "#b6bfcc";
export const LABEL = "#718096";
export const TICK = "#9aa5b1";

/* The three cluster hues, cycled by cluster index. */
export const HUES = ["#2074d5", "#df2a5d", "#2f7d32"];
export const hue = (i) => HUES[((i % HUES.length) + HUES.length) % HUES.length];

/* Their washes, for the region fill. Light enough to sit under the points. */
export const WASH = ["rgba(32, 116, 213, 0.13)", "rgba(223, 42, 93, 0.12)", "rgba(47, 125, 50, 0.13)"];
export const wash = (i) => WASH[((i % WASH.length) + WASH.length) % WASH.length];

export const NOISE = "#8a94a2"; // a ping the clustering called noise
export const ACCENT = "#7c5aed"; // interface only - active pill, focus ring, the cut line
export const HANDLE = "#ff9900"; // the one thing the reader is holding

/* Ground truth, used only where the article is explicitly comparing against it. */
export const TRUTH = "#005276";
export const GOOD = "#2f7d32";
export const BAD = "#df2a5d";
