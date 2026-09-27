# `unemployment-flows`

**Kind** model · **Shape** case first (two towns at 6%) · **Hook** `RatioLab` ·
**Stack** Svelte 5 + Vite

Pass-1 spec: `claude/unemployment-flows-pass1-spec.md` in the project.
Row 16 (Ma3) of `economics-curriculum-slate.md`.

## The angle

The unemployment rate is a stock fed by two monthly flows, and its steady state
depends only on their ratio: u* = 1/(1 + f/s). Doubling layoffs and halving
hiring give exactly the same rate, so the rate can double while layoffs fall, and
the same 6% can mean two-month spells in one town and eleven-month spells in
another.

## The model

Monthly separation rate s and job-finding rate f; labour force fixed. Eastport
s = 3%, f = 47%; Millbrook s = 0.6%, f = 9.4%. Closed forms in `src/flows.js`;
`src/agents.js` simulates 20,000 individual workers and shares no code with them.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | Unemployment rises because more people lose their jobs | **Not necessarily**: halving Eastport's hiring takes u from 6% to 11.3% while job losses fall from 28.2 to 26.6 per 1,000 workers a month |
| 2 | Layoffs and hiring are different stories | **The rate can't tell them apart**: doubling s and halving f give the same u* (11.3%) with `===`; only the path differs (half-life 0.9 vs 2.3 months; 56.4 per 1,000 losing jobs in the first month vs 28.2) |
| 3 | The rate says how bad unemployment is | **Only half of it**: both towns at exactly 6%; average spell 2.1 vs 10.6 months; out a year or more 0.05% vs 30.6%; five times the inflow in Eastport. The worker simulation agrees |
| 4 | The rate reflects current conditions | **Where turnover is high**: half-life exactly 1 month in Eastport, 6.6 in Millbrook |

## Layout

| Section | Component |
|---|---|
| the case | `TwoTowns` — duration shares, small multiples on one scale |
| the mechanism | `FlowCross` — inflow and outflow against u, a scrubber and a town toggle |
| the hook | `RatioLab` — drag in the (f, s) plane; iso-rate rays; presets; readouts |
| the freeze | `FreezeRun` — month stepper; the rate and job losses under both shocks |

## Verification

- `npm run check` — **27 checks**, including the agent simulation (sampling
  tolerances stated in each claim) and a second route to the freeze path.
- `verify/check-browser.mjs` — **56 checks** at 390px and 1280px: the ring sits on
  both flow lines and at the same pixel in both towns; the lab's point sits on its
  own ray after presets, keys and a click converted from screen pixels; both
  towns share the 6% ray and both shocks share one ray; at month 24 both runs sit
  on the same rate and only the layoff shock's job losses are above the old line.

## Sources

Shimer (2012), RED 15(2):127–148; Elsby, Michaels & Solon (2009), AEJ: Macro
1(1):84–110. Nothing reproduced.
