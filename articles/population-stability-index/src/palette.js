/*
  Chart colours.

  This article has one recurring picture - a reading, split into the part that
  is a real population movement and the part that is the sample size - so the
  palette is built around that split and stays fixed across fourteen figures:

    SIGNAL  the movement that is actually there
    FLOOR   the part of the reading that would be there anyway
    MARK    a threshold, or anything the article is pointing at as wrong
    THEORY  a closed form drawn over a simulation

  Validated with scripts/validate_palette.js, all pairs, against --paper
  #f1f3f3 and a white card:

    lightness band   PASS
    chroma floor     PASS except FLOOR, which is the one background class
    normal vision    PASS   worst 17.5   #2074d5 <-> #8a94a2
    Machado deutan   PASS   worst 10.0   #df2a5d <-> #8a94a2
    contrast         PASS   worst 3.07:1 on white

  NOT USED, deliberately: a green/amber/red traffic light. The article argues
  that three coloured bands are the wrong output, and the palette check agrees
  for a second reason - #ff9900 is 1.92:1 against the page, below the 3:1 floor,
  and every amber dark enough to clear it collapses toward either the green or
  the red under simulated deuteranopia (worst pair dE 3.1 to 6.6 against a floor
  of 8). Verdict zones here are neutral bands with words in them.
*/

export const INK = "#232f3e";
export const SURFACE = "#f1f3f3";
export const CARD = "#ffffff";
export const FAINT = "#e8ecf0";
export const GRID = "#eef1f5";
export const AXIS = "#b6bfcc";
export const LABEL = "#718096";
export const TICK = "#9aa5b1";
export const RULE = "#cbd5e0";

export const SIGNAL = "#2074d5"; // the movement that is really there
export const FLOOR = "#8a94a2";  // the part of the reading that is sample size
export const MARK = "#df2a5d";   // a threshold, or something being pointed at
export const THEORY = "#2f7d32"; // a closed form over a simulation

export const SIGNAL_WASH = "rgba(32, 116, 213, 0.14)";
export const FLOOR_WASH = "rgba(138, 148, 162, 0.22)";
export const MARK_WASH = "rgba(223, 42, 93, 0.12)";
export const THEORY_WASH = "rgba(47, 125, 50, 0.13)";

export const ACCENT = "#7c5aed"; // interface only - active pill, focus ring
export const HANDLE = "#ff9900"; // the one thing the reader is holding

/* The verdict zones. Ordinal, so they are a single neutral ramp plus a word -
   never three hues. */
export const ZONE = ["#eef1f5", "#dfe4ea", "#ccd3db"];
export const ZONE_LABEL = ["no action", "investigate", "review the model"];
export const zoneOf = (v) => (v < 0.1 ? 0 : v < 0.25 ? 1 : 2);
