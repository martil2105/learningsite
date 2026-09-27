/*
  The article's one job, and the technologies that can do it.

  The job is fixed: one month's processing run, delivered. What varies is how.
  Each technology is a recipe in fixed proportions — so many engineer-days of
  someone's time, so many machine-days of rented compute — and twice the job
  means twice of both.

  The numbers are chosen so the hull's edges have integer slopes: the industry
  changes technology at relative prices of exactly 1, 3 and 8 engineer-days per
  machine-day. BALANCED is the article. It is the reasonable-looking middle
  option, it survives the test every treatment of this teaches, and it is the
  cheapest choice at no price at all.
*/

/* Engineer-days (N) and machine-days (R) for one run. */
export const BRUTE   = { id: "P", name: "Brute force",   N: 1,  R: 40 };
export const BATCHED = { id: "Q", name: "Batched",       N: 3,  R: 24 };
export const INDEXED = { id: "S", name: "Indexed",       N: 7,  R: 12 };
export const TUNED   = { id: "T", name: "Hand-tuned",    N: 15, R: 4  };

/* Two the rectangle test removes: LEGACY is beaten by INDEXED, PORTED by
   HAND-TUNED. */
export const LEGACY  = { id: "L", name: "Legacy",        N: 9,  R: 30 };
export const PORTED  = { id: "M", name: "Ported legacy", N: 18, R: 22 };

/* The one the article is about. Beaten by nothing. Chosen never. */
export const BALANCED = { id: "B", name: "Balanced", N: 5, R: 20 };

/* The six a reader meets first — the trap arrives on its own, later. */
export const STARTERS = [BRUTE, BATCHED, INDEXED, TUNED, LEGACY, PORTED];

/* Everything. */
export const SET = [...STARTERS, BALANCED];

/* Prices. r = w/p is the only thing the choice depends on; these are the
   numbers the money sentences use. An engineer-day at 600 and a machine-day at
   200 puts the industry exactly on the switch between INDEXED and BATCHED. */
export const W_BASE = 600; // one engineer-day
export const P_BASE = 200; // one machine-day

export const R_MIN = 0.2;
export const R_MAX = 14;
export const R_DEFAULT = 2;

/* Axis extents for input space, shared by every figure so a reader who learns
   the diagram once is not relearning it. */
export const N_MAX = 20;
export const RR_MAX = 44;

/* The trap's machine-days, as a control. It is chosen at no price above the
   chord joining BATCHED and INDEXED, and on a window of width exactly
   (chord - R) below it — until it evicts INDEXED at R = 14 and the closed form
   changes. */
export const BAL_MIN = 8;
export const BAL_MAX = 28;
export const BAL_CHORD = 18;
export const BAL_EVICTS = 14;

/* Named price regimes, used by the preset buttons and by the prose naming
   them. */
export const REGIMES = [
  { r: 0.5, label: "r = 0.5", gloss: "people are cheap" },
  { r: 2,   label: "r = 2",   gloss: "the industry standard" },
  { r: 5,   label: "r = 5",   gloss: "people have got dear" },
  { r: 12,  label: "r = 12",  gloss: "throw hardware at it" },
];
