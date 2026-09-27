# `externalities`

**Kind** model · **Shape** case first · **Hook** `InstrumentLab` ·
**Stack** Svelte 5 + Vite

CORE spine row 8 (U10.2–10.7). Imports `src/market.js`'s demand/supply
pattern from `tax-incidence`; builds `src/externality.js`.

## The angle

Tax, quota and bargain reach the same quantity (32) and move the same money
(384) into different pockets — so the choice looks purely distributional.
Under uncertainty it is not: the expected-loss ratio tax:quota is (g/b)²
while both optima stay interior (0.25 / 1.00 / 4.00 at g/b = 0.5 / 1 / 2),
crossing at exactly 1 — and the tax side departs from the square when the
corner bites (measured 46.0 at g/b = 8 in this parameterisation, not 64).

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | An uncounted cost means too much output | True — 40 against 32 |
| 2 | The optima differ by exactly the uncounted cost | **Identity** — q_s = q₀ − e·BS/(B+S); blind numeric search lands on 32 to 1e-4 |
| 3 | t = e restores the optimum | **Exactly** — q = 32; the price gap there is 12.000000 = e |
| 4 | Same quantity, different pockets | **True, literally the same money** — tax revenue 384 = quota rent 384 = bargain payment 384; the welfare gain is 48, the DWL the market was burning |
| 5 | The instrument choice is distributional | **False under uncertainty — the inversion.** Loss ratio = (g/b)²; the price instrument wins iff damage is flatter than benefit |
| 6 | — (honest edge) | At g/b = 8 the measured ratio is 46.0, not 64: the tax hit the corner |
| 7 | Coase: bargaining reaches the optimum | In-model yes; who holds the rights moves only the payment |
| 8 | — (cost) | The known e is the fiction; the multi-party bargain; bent damage curves. Limits section |

## Layout

`GapFigure` (private vs social, the gap = e) → `InstrumentLab` (hook: three
instruments, one output bar that never moves, one money bar that changes
pockets) → `SlopeFigure` (the turn: losses against g/b on log–log, crossing
at 1, the corner named).

## Verification

- `npm run check` — 13 checks; the closed forms against a blind numeric
  optimum and a trapezoid integrator; the money equality as integers; the
  Weitzman ratio by direct integration of both instruments' losses.
- `verify/check-browser.mjs` — the output bar identical (<0.5px) across all
  three instruments while the pocket text changes; the crossing circle near
  g/b = 1.

## Source

CORE U10.2–10.7; Pigou (1920); Coase (1960) *J. Law & Econ.* 3:1–44;
Weitzman (1974) *RES* 41(4):477–491 — **verify before citing.** Theirs: the
instruments and the theorem. Ours: the case, the revenue-equals-rent
equality, the (g/b)² measurement and its corner, every number.