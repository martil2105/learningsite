# `externalities` — pass-1 spec

**Kind** model · **Shape** case first · **Hook** `InstrumentLab`
**Stack** Svelte 5 + Vite · **Queue** CORE spine row 8 (U10.2–10.7); imports
`src/market.js` from `tax-incidence`
**Closest analog by shape** `population-stability-index`.
Planned 16 Sep 2026; re-derive all numbers in pass 1.

## Shape reason
This is something people *do* — a regulator picks an instrument — and the
shape table says case first is strong exactly there. Open on one plant, one
river, one town, and let every later section be a question that situation
raises. Case first is used once, by `population-stability-index`; that is a
precedent, not a saturated pattern.

## The angle
A tax, a quota and a private bargain reach the same quantity and move the
same money into different pockets, so the choice looks purely distributional.
It stops being distributional the moment the regulator is uncertain, and
which instrument wins is the square of a slope ratio.

## The model
Linear market with an uncounted constant external cost e per unit:
D: `q = A − B·pc`, S: `q = C + S·pp`. Base `A=100, B=2, C=10, S=1, e=12` →
laissez-faire q₀ = 40 (price 30) and social optimum
`q_s = q₀ − e·BS/(B+S)` = 32 exactly.
Instruments: a tax t (the firm's price rises by t), a quota q̄, and Coasean
bargaining over the surplus between the parties.
Uncertainty turn: the private-benefit intercept `a` shocks ±20 around 100;
both instruments are set for the mean. Weitzman: the expected-loss ratio
tax:quota `→ (g/b)²`, where b is the private-benefit slope and g the damage
slope.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | An uncounted cost means the market makes too much | True — q₀ = 40 against 32 | `GapFigure` |
| 2 | Private and social optima differ by exactly the uncounted cost | **Identity** — `q_s = q₀ − e·BS/(B+S)`; numeric optimum 32.000001 against the closed form | `GapFigure` |
| 3 | A Pigouvian tax equal to marginal external cost restores the optimum | **Exactly** — t = e = 12 → q = 32; there the buyer–seller price gap is 12.000000 = e | `InstrumentLab` |
| 4 | Tax, quota, bargain: same quantity, different pockets | **True, and literally the same money** — tax revenue 384.0 = quota rent 384.0; the welfare gain 48.0 = ½e²·BS/(B+S) exactly | `MoneyFigure` |
| 5 | So the instrument choice is distributional, not an efficiency question | **False under uncertainty — the intuition inverts.** Loss ratio = (g/b)²: 0.25 at g/b = 0.5, 1.00 at 1, 4.00 at 2. The price instrument wins iff the damage curve is flatter than the benefit curve | `SlopeFigure` |
| 6 | — (honest edge) | At g/b = 8 the measured ratio is **46.0, not 64** (this parameterisation): the tax drives output to a corner. A corner is a finding — state it | `SlopeFigure` note |
| 7 | Bargaining reaches the optimum if rights are clear (Coase) | **In this model, yes**, and who holds the right changes only the transfer — but it needs two parties who can find each other | `InstrumentLab` |
| 8 | — (cost) | The external cost is a known constant here; it is the thing nobody knows, which is why claim 5 matters | limits |

## The identity on screen
`SlopeFigure`: the two expected losses against the slope ratio on log–log
axes, crossing at exactly 1, with the ratio curve lying on a line of slope
exactly 2.

## Layout
`TheCase` (the plant, the river, the numbers) → `GapFigure` (private against
social; the gap = e) → `InstrumentLab` (hook: three instruments as a toggle,
one quantity, three money-flow bars) → `MoneyFigure` (revenue = rent, side
by side) → `UncertaintyLab` (the turn: the shock on a slider, the ranking
flips) → `SlopeFigure` ((g/b)²) → limits.

## check-numbers.mjs
- closed forms against a numerical welfare integrator: q_s to 1e-5, the
  welfare gain to 1e-4, the price gap = e to 1e-9.
- revenue = rent as exact integers; the 384 and 48 numbers.
- Weitzman: the (g/b)² ratio against a seeded Monte Carlo (≥10⁴ shock draws)
  at g/b ∈ {0, 0.5, 1, 2} to ~1e-2; the corner value at 8 reported as
  measured, with the corner condition named.
- Coase: the bargaining outcome = q_s from an independent negotiation module.

## check-browser.mjs
- cycle the instrument toggle: the rendered quantity line does not move
  (<0.01px) while the money bars change.
- `SlopeFigure`: the log–log ratio curve's rendered slope is 2 to 0.2%, and
  the crossing sits at 1.

## Sources
CORE U10.2–10.7; Pigou (1920); Coase (1960) *J. Law & Econ.* 3:1–44; Weitzman
(1974) *RES* 41(4):477–491. **Verify all four before writing the sentences.**
Theirs: the instruments and the theorem. Mine: the case, every number, the
revenue-equals-rent equality, the (g/b)² measurement and its corner.

## Risks
- Scope control. One idea: *the instruments are equivalent only while the
  regulator knows the curves.* If the Weitzman figure ends up doing all the
  work, collapse the three-instrument survey to two figures and keep the
  case, the equivalence and the turn — do not grow a second article inside
  this one.
- Keep the three money bars to one palette slot each; `palette.js` allows
  three categorical colours and no more.