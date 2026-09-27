# `nash-equilibrium`

**Kind** concept · **Shape** question first · **Hook** `DeterrenceLab` ·
**Stack** Svelte 5 + Vite

Pass-1 spec: `claude/nash-equilibrium-pass1-spec.md` in the project.

## The angle

In the model economists use to justify deterrence, raising the penalty for
misconduct does not reduce misconduct. It reduces *monitoring*, at exactly the
rate that leaves misconduct where it was. The penalty starts working only once
monitoring has a floor under it, and then it works completely, at a computable
threshold.

Underneath: in a mixed equilibrium your own behaviour is determined entirely by
the other player's payoffs.

## The model

One period. Row = a trader {Breach, Comply}. Column = a risk desk {Audit, Skip}.

| | Audit | Skip |
|---|---|---|
| **Breach** | −F , V−C | +G , −L |
| **Comply** | 0 , −C | 0 , 0 |

Base parameters `G = 60, F = 140, C = 12, V = 50, L = 30`, chosen so the
equilibrium is exact decimals.

- `q* = G/(G+F)` — the **audit** rate, built from **trader** parameters → 0.30
- `p* = C/(V+L)` — the **breach** rate, built from **risk desk** parameters → 0.15

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | Find the equilibrium by checking each cell for a profitable deviation | **The procedure has a failure rate nobody quotes.** Over all 576 ordinal 2×2 games: exactly **72 have none (1/8), 432 have one (3/4), 72 have two (1/8)** — exact rationals, not a simulation |
| 2 | — (how many to expect) | `E[# pure NE] = 1` **exactly at every size**: `n²` cells × `1/n` × `1/n`. Converges to **Poisson(1)**; at n = 100, P(0) = 0.3637 against `1/e` = 0.36788, nothing fitted |
| 3 | Raise the penalty, get less misconduct | **False, exactly.** 500,000 random redraws of the trader's gain and fine move the breach rate by **exactly 0**. A fine of 10⁶ gives the same 15% as a fine of 20 |
| 4 | — (what it does instead) | Buys monitoring, one for one. **`1/q* = 1 + F/G`** exactly — intercept exactly 1, slope exactly `1/G`. Inverting the slope recovers `G = 60` exactly, so the audit rate is a readout of the trader's private gain |
| 5 | — (who bears it) | Nobody. Trader EV **= 0** and risk desk EV **= −4.5** at every fine from 20 to 10⁶ |
| 6 | It is a 2×2 curiosity | **No.** An independent both-matrix solver, replacing **every** row-player payoff with fresh values: own mix moves by **exactly 0** at n = 2, 3, 4, 5 (worst exploitability 3.6e−15) |
| 7 | — (when deterrence works) | **When the monitor is not a player.** At a fixed audit rate `q̄` the trader complies iff `q̄ > G/(G+F)`, so fines deter completely at `F = G(1−q̄)/q̄` |
| 8 | — (both at once) | A mandated **minimum** audit rate makes the fine work above a kink: flat at 0.15 until `F = G(1−q̄)/q̄`, then exactly 0. **F = 180** at q̄ = 0.25, **60** at q̄ = 0.5, never at q̄ = 0. Bisection matches the closed form to 0 |
| 9 | — (what does move it) | Only risk desk parameters. Halving the audit cost halves the breach rate to 0.075 |

## The identity on screen

`1/q*` is exactly linear in the fine, over any range. `ReadoutFigure` draws it
beside the dead-flat breach rate — the article's best figure, and the
project's third wide-range identity after `constrained-choice`'s `log(h/f)`
slope and `economic-rent`'s point–line duality.

## Layout

| Section | Component |
|---|---|
| the question | `CellHunt` — click cells, get a deviation verdict, find nothing |
| the failure rate | `CountFigure` — 576 exact at n=2, simulated + Poisson(1) above |
| the hook | `DeterrenceLab` — fine slider, two bars, one dead |
| the identity | `ReadoutFigure` — flat breach rate vs straight `1/q*` |
| generalisation | `SizeFigure` — live in-browser invariance table |
| when it works | prose + threshold |
| both at once | `FloorLab` — the kink at F = 180 |
| what moves it | `LeverFigure` — three levers, all the monitor's |

`PayoffMatrix` is shared by `CellHunt` and `DeterrenceLab`. It is an HTML table,
not an SVG: a matrix is tabular and `<svg><text>` does not wrap.

## Verification

- `npm run check` — 68 assertions, most at **zero tolerance** because the claims
  are identities. `./verify/ship.sh` runs it.
- `verify/check-browser.mjs` — 54 assertions across 390px and 1280px. The one it
  exists for: sweep the fine slider end to end and assert the breach bar's
  **rendered width is identical** (< 0.01px) while the audit bar shrinks, and
  that both bars agree with the percentages printed beside them.
- `npm run precompute` regenerates `src/precomputed.js` (200,000 games at each
  of seven sizes). The 576-game enumeration is deliberately *not* precomputed —
  it is exact and instant, so the page and the check run the same code.

## Two findings from the probes

1. **QRE was tried as the continuum between the two regimes and dropped.** A
   logit quantal-response slider from "random monitor" to "Nash monitor" would
   have been the elegant version of claims 7→8, but damped best-response
   iteration does not converge cleanly here — the fine-effect came back
   non-monotone in λ and flipped sign between λ = 1 and λ = 3, which is a solver
   wandering between equilibria rather than a result. The mandated audit floor
   replaced it and is better: a real regulatory instrument rather than a
   behavioural parameter, it nests both regimes exactly, and it gives a kink
   with a closed form instead of a smooth curve with a solver behind it.

2. **A probe that proves nothing was easy to write here.** The first
   "beyond 2×2" probe solved the row player's mix from the column player's
   matrix and then checked it had not changed when the row player's matrix
   changed — true by construction, measuring nothing. Rewritten in
   `src/general.js` with a solver that takes both matrices and an exploitability
   check on every answer. The claim survived; the first version of it was
   worthless. **Rule for `verifying-an-article.md`: when the claim is that X does
   not depend on Y, the probe must compute X by a route that is allowed to read
   Y.**

## Source

CORE Econ, *The Economy 2.0: Microeconomics* (2023), Unit 4 §§4.2, 4.3, 4.5.
Theirs: the payoff matrix, best response, the definition of Nash equilibrium,
the dots-and-circles procedure, the Pareto criterion. Mine: everything the
article proves — the game and every number in it, the 576-game enumeration, the
Poisson picture, the two closed forms and their crossover, the invariance sweep,
the `1/q*` identity and the recovery of `G`, the n = 2…5 generalisation, and the
audit-floor model with its threshold.

**The book never uses the phrase "mixed strategy" — zero occurrences in the whole
text.** So nothing in this article's second half can be inherited from it, and
the article owes the reader its own derivation. That is a defensible choice for
an intro text and the article says so.

## Still to do (pass 3 / pass 4)

- `/finish-article nash-equilibrium` in a fresh session.
- Prose read against the charts; final read-through in
  `reference/verifying-an-article.md`.
- The probe finding above goes into `reference/verifying-an-article.md`.
- Row in `reference/choosing-the-shape.md`, tick in
  `reference/subject-queue.md`, entry in `site/articles.json`.
