/*
  The unemployment stock and its two flows.

  Each month s(1 - u) people lose their jobs and f u find one, so

      u' = u + s (1 - u) - f u,

  whose steady state is u* = s / (s + f) = 1 / (1 + f/s): a function of the
  ratio f/s and nothing else. Everything the rate cannot see — how long spells
  last, how many of the unemployed have been out for a year, how fast the rate
  catches up with a change in the flows — depends on the scale of the flows
  instead, and is computed here in closed form.
*/

export const steady = (s, f) => s / (s + f);

/* The path of the rate from u0 when the flows are (s, f) from month 1 on. */
export function path(u0, s, f, months) {
  const out = [{ t: 0, u: u0, losers: s * (1 - u0), finders: f * u0 }];
  let u = u0;
  for (let t = 1; t <= months; t++) {
    u = u + s * (1 - u) - f * u;
    out.push({ t, u, losers: s * (1 - u), finders: f * u });
  }
  return out;
}

/* Expected length of a completed spell, in months, when a month's exit chance is f. */
export const meanSpell = (f) => 1 / f;

/* Share of the unemployed, in steady state, who have been out k months or more. */
export const longTermShare = (f, k) => Math.pow(1 - f, k);

/* Months for the gap to the steady state to halve. */
export const halfLife = (s, f) => Math.log(0.5) / Math.log(1 - s - f);

/* Steady-state shares of the unemployed by completed months of search so far, in bins. */
export function durationBins(f, edges) {
  // P(duration >= k) = (1 - f)^k, so the share in [lo, hi) is the difference.
  return edges.slice(0, -1).map((lo, i) => {
    const hi = edges[i + 1];
    const upper = hi === Infinity ? 0 : Math.pow(1 - f, hi);
    return { lo, hi, share: Math.pow(1 - f, lo) - upper };
  });
}

/* The f that gives rate u for a given s: the iso-rate ray through the origin. */
export const fForRate = (s, u) => (s * (1 - u)) / u;

/*
  A shock at the start of month 1. Row 0 is the old steady state, with the old
  month's flows; row t ≥ 1 has the flows DURING month t under the new rates and
  the rate at the END of month t.
*/
export function shockRun(before, after, months) {
  const u0 = steady(before.s, before.f);
  const rows = [{ t: 0, u: u0, losers: before.s * (1 - u0), finders: before.f * u0 }];
  let u = u0;
  for (let t = 1; t <= months; t++) {
    const losers = after.s * (1 - u);
    const finders = after.f * u;
    u = u + losers - finders;
    rows.push({ t, u, losers, finders });
  }
  return rows;
}
