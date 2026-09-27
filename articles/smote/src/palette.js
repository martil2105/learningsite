/*
  Chart colours for the SMOTE article.

  Three things need to be told apart everywhere on this page: a REAL fraud row,
  a SYNTHETIC one, and a legitimate transaction. The first two carry the whole
  argument, so they take the two most separated slots; the third is the field
  the other two sit in - nine hundred points of context - and takes a neutral.

  Run against both surfaces this article uses (--paper #f1f3f3 and the white
  cards), all pairs:

    lightness band   PASS   all four inside L 0.43-0.77
    chroma floor     FAIL   #8a94a2 at 0.021 - see below
    CVD separation   PASS   worst all-pairs #2f7d32 <-> #df2a5d  dE 8.3 deutan
    normal vision    PASS   worst all-pairs #8a94a2 <-> #2074d5  dE 17.5
    contrast         PASS   all four >= 3:1 on both surfaces

  The chroma failure is the point of that slot rather than a defect in it:
  LEGIT is the background class and has to recede, so it is deliberately the one
  colour on the page that is not a hue. It was darkened from the #9aa5b1 the
  earlier articles used because that sat at 2.5:1 against a white card, below
  the contrast floor; #8a94a2 clears 3:1 while keeping the most distance from
  --sky of any neutral that does.

  GREEN and CROSS never appear as adjacent marks: GREEN draws one labelled
  boundary line in the last figure, where the only red on screen is a dot.
  Different mark type and a direct label, which is what the 8.3 needs.
*/

export const INK = "#232f3e";
export const SURFACE = "#f1f3f3";
export const CARD = "#ffffff";
export const FAINT = "#e2e8f0";
export const GRID = "#eef1f5";
export const AXIS = "#b6bfcc";
export const LABEL = "#718096";
export const TICK = "#9aa5b1";

export const LEGIT = "#8a94a2"; // a legitimate transaction: the background class
export const FRAUD = "#df2a5d"; // a real, labelled fraud row
export const SYNTH = "#2074d5"; // a synthetic row SMOTE invented
export const GREEN = "#2f7d32"; // the third series, used once, on a labelled line

export const ACCENT = "#7c5aed"; // interface only - active pill, focus ring, step border
export const HANDLE = "#ff9900"; // the one thing the reader is holding

/* Very light washes of the two class colours, for the territory shading. Fills
   under everything else, so they are tints rather than series colours. */
export const FRAUD_WASH = "rgba(223, 42, 93, 0.09)";
export const FRAUD_EDGE = "rgba(223, 42, 93, 0.45)";
