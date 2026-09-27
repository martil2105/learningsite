# `bargaining-and-the-surplus` — pass-1 spec

**Kind** model · **Shape** question first → assumption lab · **Hook** `OfferLab`
**Stack** Svelte 5 + Vite · **Queue** CORE spine row 4 (`subject-queue.md`, U5)
**Closest analog by shape** `comparative-advantage` (question first off a
runnable procedure). Planned 16 Sep 2026; re-derive every number below in
pass 1 before building (`economics-next-five/README.md`, rule 1).

## Shape reason
The received account is a *procedure* the reader can run — draw the frontier,
note that any point on it beats no deal, observe that the theory stops there.
Question first is 3/3 when that is true. The reader runs the procedure,
concludes the split is indeterminate, and is then shown a second procedure
that picks exactly one point. The second half is an assumption lab: the
period length and the outside option go on controls.

## The angle
Nothing in the static surplus picture picks a point on the frontier, but the
moment you write down how offers alternate, the model picks exactly one — and
it is built from the other side's impatience, not your own.

## The model
A surplus of 1 to divide. A offers, B responds, they alternate; a rejecter
may opt out for a fallback `s_i` (0 in the base case). Discount factors
`δ_i = exp(−r_i·Δ)`; base rates `r_A = 0.05`, `r_B = 0.15`, Δ a control, so
the limit share is exactly 0.75. Closed forms:

- infinite-horizon share of the first proposer: `x* = (1−δ_B)/(1−δ_A·δ_B)`
- equal δ, finite horizon T: `x_T = (1−(−δ)^T)/(1+δ)`
- continuous-time limit: `x* → r_B/(r_A+r_B)`
- with outside options (Δ→0): payoffs `max(x*, s_A)` and `max(1−x*, s_B)` —
  the kink sits exactly at `x*`.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | Any point on the frontier beats no deal, so the split is indeterminate | **False once the procedure is modelled** — alternating offers has one subgame-perfect share | `OfferLab` |
| 2 | — (does the horizon matter?) | **Identity.** `x_T` matches literal backward induction to 2.22e-16 (δ ∈ {0.3,0.5,0.8,0.95} × T=1..60); it oscillates — δ=0.5: 1, 0.5, 0.75, 0.625, 0.65625, → 0.666667 | `OfferLab` scrubber |
| 3 | Moving first is an advantage | **Worth O(Δ) and it vanishes.** Limit errors 1.8e-2, 1.9e-3, 1.9e-4, 1.9e-5 at Δ = 1, 0.1, 0.01, 0.001 — exactly linear in the period length | `PatienceFigure` |
| 4 | Patience is bargaining power | **Your share's numerator is the other side's impatience**: `x* = r_B/(r_A+r_B)` (0.75000000 at 0.05/0.15) | `PatienceFigure` |
| 5 | Cooperative and strategic bargaining are different theories | **They agree exactly.** Nash with weights ∝ 1/r gives 0.75000000, from a second module sharing no code | `NashCheck` |
| 6 | A better outside option strengthens you | **Exactly zero, then everything.** Fallbacks 0, 0.1, 0.3, 0.5, 0.7, 0.74, 0.749 all give 0.750037; kink at `x*` (residual 7.2e-5, itself O(Δ)) | `OptionLab` |
| 7 | Efficiency and fairness are independent properties of the point | **True** — the split runs 50/50 → 90/10 with every point efficient | `SplitPicker` |
| 8 | — (cost) | **The model predicts no haggling**: the first offer is always accepted, so observed delay is outside it. Limits section | prose |

## The identity on screen
The horizon scrubber: the opening offer alternates above and below the
infinite-horizon line and converges geometrically. The check asserts the
alternation and the halving gap; `check-numbers.mjs` asserts the closed form
against the literal backward induction.

## Layout

| Section | Component |
|---|---|
| the question | `SplitPicker` — drag a point; every point is efficient, nothing chooses |
| the procedure | `OfferLab` (hook) — offer ladder, horizon scrubber, the shrinking pie |
| the limit | `PatienceFigure` — share vs r_B/(r_A+r_B); Δ on presets |
| two theories | `NashCheck` — live table, procedure vs axioms, 8 dp agreement |
| the fallback | `OptionLab` — the outside-option kink: flat, then diagonal |
| what it costs | prose — no delay predicted, two parties, transferable surplus |

## check-numbers.mjs
- exact: 0.75 at r 0.05/0.15; the δ=0.5 oscillation values; the `x_T` closed
  form against literal backward induction (exact rationals at δ=1/2).
- 1e-8: Nash golden-section optimum against the closed form.
- kink position: worst |fixed point − max(x*, s_A)| < 2e-4 at Δ=0.01, with
  the residual shrinking as Δ shrinks.
- Watch: best-response fixed-point iteration converges slowly as δ→1 (at
  δ=0.99, 4e6 rounds still leaves ~1e-5). State the tolerance and why, or
  solve the two equations algebraically on the page and keep the iteration
  for the checks.

## check-browser.mjs
- sweep the horizon scrubber: the offer marker's rendered y alternates side
  of the limit line and the gap roughly halves each step.
- `OptionLab`: seven fallback positions on the flat arm give identical
  rendered payoff height (<0.01px); past the kink it rises one-for-one.

## Sources
CORE U5 — theirs: the frontier, the surplus, the role of institutions.
Rubinstein (1982) *Econometrica* 50(1):97–109; Nash (1950) *Econometrica*
18(2):155–162; Binmore, Shaked & Sutton (1989) on the outside-option
principle — **verify all three before writing the sentences that lean on
them.** Mine: the game, every number, the oscillation identity, the O(Δ)
result, the two-construction agreement, the kink measurement.

## Risks
- The kink is the catalogue's third flat-then-rising figure (the audit floor,
  the BALANCED window). It is here because the subject puts it there; the
  prose must say what the flat arm *means* (an unbinding threat buys
  nothing), so it is not decorative.
- Near δ→1 the fixed point needs the closed form on the page; the solver is
  for the checks. Report the convergence honestly in the README.