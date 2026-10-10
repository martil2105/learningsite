/*
  Validated as an all-pairs categorical set against --paper #f1f3f3 and white.
  Three categorical colours is the hard ceiling; more levels must be carried by
  another channel. reference/house-idioms.md has the reasoning and the failures.

  Re-run the validator when you change anything here:
    node scripts/validate_palette.js "<hex,hex,...>" --mode light \
      --surface "#ffffff" --pairs all
*/
export const SERIES = ["#2074d5", "#df2a5d", "#2f7d32"];
export const BACKGROUND_CLASS = "#8a94a2"; // deliberately not a hue
export const INK = "#232f3e";
export const ACCENT = "#7c5aed"; // interface only — never beside a mark
