/*
  Two towns, one unemployment rate.

  Rates are monthly: s is the share of the employed who lose or leave their job
  in a month, f the share of the unemployed who find one. The labour force is
  fixed at 1, so u is both the unemployment rate and the unemployed share of
  the town. Both towns sit at exactly 6% (f/s = 47/3 in each).
*/
export const TOWN_A = { name: "Eastport", s: 0.03, f: 0.47 };
export const TOWN_B = { name: "Millbrook", s: 0.006, f: 0.094 };

// A spell of 12 months or more is "long-term unemployment", as in most statistics.
export const LONG_TERM = 12;

// The two shocks compared in the section on the hiring freeze.
export const FREEZE = { s: 0.03, f: 0.235 }; // hiring halves in Eastport
export const LAYOFFS = { s: 0.06, f: 0.47 }; // layoffs double in Eastport
export const RUN_MONTHS = 24;

// The lab's axes.
export const S_MAX = 0.08;
export const F_MAX = 0.8;
