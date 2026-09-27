# `monopolistic-competition` — pass-1 spec

**Kind** model · **Shape** assumption lab · **Hook** `VarietyLab`
**Stack** Svelte 5 + Vite · **Queue** slate row 10 (Mi10); builds `src/ces.js`;
imports `src/entry.js` from `perfect-competition` for the free-entry margin
**Closest analog by shape** `tax-incidence` — plant a truth, show it holding,
then put the assumption on a control and break it.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

There is one assumption in this chapter and every result rests on it: that the
group is large enough that a firm ignores its own effect on the price index.
Chamberlin named it the *large group* and then reasoned as though it were
exact; Dixit and Stiglitz made it exact by taking a limit. Put the number of
firms on a control and the whole chapter becomes a function of it, which is
what an assumption lab is for.

The alternative shapes lose the argument. A comparison spine between monopoly
and competition draws the textbook's own picture and inherits its blind spot;
a lab first has nothing to plant.

## The angle

Every result in the monopolistic-competition chapter is an n → ∞ limit, and
each error is exactly one over a count. Firm scale falls short of the value
the chapter gives by **exactly 1/n**. The markup exceeds the chapter's markup
by **exactly 1/(σ(n−1))**. And the market supplies **exactly (σ−1)/σ** more
varieties than the constrained optimum — always less than one, so the famous
"the market gets variety exactly right" is true in the limit and off by a
fraction of a firm everywhere else. The chapter is not wrong. It is a limit
that nobody says is a limit, and the three corrections are the three things
worth knowing.

## The model

CES preferences over `n` symmetric varieties with elasticity of substitution
`σ`, expenditure `E` on the sector, cost `f + c·x` per firm.

The own-price elasticity of demand for one variety is **not** `σ`. With market
share `s`,

```
|ε| = σ − (σ−1)·s          and with n symmetric firms, s = 1/n:
|ε(n)| = σ − (σ−1)/n
```

That is the whole article in one line. From it, with `p = c·|ε|/(|ε|−1)` and
free entry `(p−c)x = f`:

```
n     = (E/f + σ − 1)/σ                     the equilibrium number of varieties
x*(n) = f(σ−1)/c · (1 − 1/n)                firm scale
markup(n) = σ/(σ−1) · (1 + 1/(σ(n−1)))      price over marginal cost
n_planner = E/(f·σ)                          the constrained optimum
```

Base case: `E = 1000, f = 5, c = 1, σ = 4` → `n = 50.75`, scale 14.7044
against the textbook 15, markup 1.340034 against the textbook 1.333333.

**The equilibrium must be found by a solver.** Bisect the firm's profit on
`n`, with the price coming from the firm's own first-order condition, and
compare to the closed form. And the elasticity itself must be measured by
differentiating the CES demand system numerically — deriving `|ε|` and then
asserting it is the oracle problem in its purest form.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | Each firm faces a downward-sloping demand curve of its own | True, and its elasticity is `σ − (σ−1)/n`, **not** `σ`: numeric differentiation of the CES demand system against the closed form, worst relative 2.220e-10 over 24 (n, σ) pairs. At σ = 4 the elasticity is 2.5 with two firms, 3.7 with ten, 3.997 with a thousand | `ElasticityFigure` |
| 2 | Entry continues until profit is zero | True — and the count has a closed form, `n = (E/f + σ − 1)/σ`, matched by a blind bisection on profit to 7.256e-16 over 48 parameterisations | `VarietyLab` |
| 3 | Entry kills profit but not the markup | True. The markup never falls to one, at any n | `VarietyLab` |
| 4 | The markup is σ/(σ−1) | **That is the limit.** The true markup exceeds it by **exactly 1/(σ(n−1))**: worst relative 9.153e-11 over 95 parameterisations. At the base case, 1.340034 against 1.333333 — 0.5025% high, and 1/(σ(n−1)) = 0.5025% | `LimitFigure` |
| 5 | Firm scale is `f(σ−1)/c` and does not depend on market size | **That is the limit too, and the shortfall is exactly 1/n**: worst relative 4.988e-11 over 95 parameterisations. Doubling the market from E = 100 to E = 200 moves scale from 82.6% to 90.7% of the textbook value; at E = 10⁶ it is 99.998% | `ScaleFigure` |
| 6 | — (**the identity**) | Three corrections, three counts: `1/n` on scale, `1/(σ(n−1))` on the markup, `(σ−1)/σ` of a firm on variety. The third is measured against a **blind maximisation of the planner's utility**, which finds `E/(fσ)` to 8.668e-8 — the flat-maximum floor — and the equilibrium-minus-planner difference is `(σ−1)/σ` to 3.881e-11 | `LimitFigure` |
| 7 | Firms carry excess capacity — they produce below minimum average cost | **There is no minimum average cost in this model.** With a fixed cost and constant marginal cost, average cost is 6.00, 1.50, 1.05, 1.005 at scales 1, 10, 100, 1000 — it falls forever. The received "excess capacity" needs a U-shaped average cost the model does not have, and the honest restatement is that price exceeds marginal cost at every scale, which is what pays the fixed cost | `CapacityFigure` |
| 8 | The market therefore wastes resources on too many small firms | **Less than one firm's worth, and in the benchmark it is not waste at all** — the planner, constrained to break even, chooses `E/(fσ)` and the market chooses `(σ−1)/σ` more. The capacity the firms "waste" is what buys the variety | `LimitFigure` |
| 9 | — (cost) | CES, so the elasticity of substitution is a constant and love of variety is built into the utility function rather than measured; symmetric firms, so nothing here is about which varieties exist; and `n` is treated as continuous, which is the assumption `perfect-competition` spent an article breaking — say so, and say the integer correction is smaller than the 1/n one | limits |

## The convergence table

`E`, with `f = 5, c = 1, σ = 4`:

| E | n | firm scale | markup | scale ÷ textbook |
|---|---|---|---|---|
| 100 | 5.75 | 12.3913 | 1.2500 | 0.826087 |
| 200 | 10.75 | 13.6047 | 1.3043 | 0.906977 |
| 400 | 20.75 | 14.2771 | 1.3218 | 0.951807 |
| 1000 | 50.75 | 14.7044 | 1.3400 | 0.980296 |
| 10000 | 500.75 | 14.9700 | 1.3329 | 0.998003 |
| 1000000 | 50000.75 | 14.9997 | 1.33333 | 0.999980 |

(the markup column is `p/c`; re-derive it as `p/c` and not as `p/(p−c)`, which
is a different number and is what the plan-time probe got wrong first.)

## The identity on screen

`LimitFigure`: three panels sharing an x axis of `n` on a log scale, each
showing one quantity's gap from its textbook value against the closed-form
correction — `1/n`, `1/(σ(n−1))`, and the flat line at `(σ−1)/σ`. Three curves,
three closed forms lying exactly on top of them across four orders of
magnitude, and a readout of the worst residual. Nothing is fitted.

The third panel is the one to lead with in the prose, because a constant is
the most surprising of the three: the variety error does not shrink with the
market at all, it is always the same fraction of one firm.

## Layout

`OneFirm` (setup: one variety's demand curve, and the market share readout) →
`ElasticityFigure` (the elasticity against n, with σ as a preset — the chapter's
constant is a horizontal asymptote) → `VarietyLab` (the hook: market size and
σ on controls, with entry resolving live; n, scale, markup and profit as
readouts, and the textbook values ghosted behind each) → `ScaleFigure` (the
1/n shortfall) → `LimitFigure` (the three corrections) → `CapacityFigure`
(average cost falling forever, and what "excess capacity" should have meant) →
limits.

## Non-overlap

- `markup-and-elasticity` (live) owns **markup = 1/\|ε\|** and pass-through.
  This article *uses* the Lerner rule and must cite it in one sentence, not
  re-derive it. The new thing here is what `|ε|` is when the firm is one of n,
  which that article had no reason to ask.
- `elasticity` (row 4) owns what an elasticity is and the ruler. Link; do not
  re-teach.
- `perfect-competition` (row 8) owns free entry with a homogeneous good and
  the integer problem. Import `entry.js` for the margin, and keep the integer
  question in the limits section, where claim 9 puts it.
- `comparative-advantage` (live) owns gains from variety in the trade sense.
  Different mechanism; do not reach for it.
- The welfare economics of variety at the *unconstrained* optimum — where the
  planner may run firms at a loss — is a different and much longer argument.
  Name the constraint every time the word "optimum" appears, or the article
  overclaims claim 8.

## check-numbers.mjs

17–22 `ok()` blocks:

- **the elasticity, by differentiating the demand system**, against
  `σ − (σ−1)/n` over ≥ 20 (n, σ) pairs, worst relative < 1e-8, with the
  differencing step stated. This is the article's oracle and belongs first.
- a second elasticity route: the share form `σ − (σ−1)s` evaluated at an
  *asymmetric* price vector, against the numeric derivative — so the symmetric
  case is not the only one the claim survives.
- the equilibrium count: blind bisection on profit against
  `(E/f + σ − 1)/σ` over ≥ 40 parameterisations, worst relative < 1e-12.
- **the three corrections**, one `ok()` each, over ≥ 90 parameterisations with
  `E/(fσ) > 3` so the planner's optimum is inside the search bracket:
  scale < 1e-8, markup < 1e-8, variety difference < 1e-10 absolute.
- the planner's own count by blind golden-section against `E/(fσ)`, worst
  relative < 1e-6, asserted as the flat-maximum floor.
- the convergence table, all six rows, at printed precision.
- the markup asserted as `p/c` with an explicit check that `p/(p−c)` is a
  different number — the sentence the check defends is "the markup is the
  price over marginal cost", and the plan-time probe got this wrong, so the
  check should make it impossible to get wrong again.
- average cost is strictly decreasing over ≥ 10,000 scales and has no interior
  minimum; and `p > MC` at every n.
- `n → ∞` limits: scale → `f(σ−1)/c`, markup → `σ/(σ−1)`, both to < 1e-6 at
  `n = 10⁸`.

## check-browser.mjs

50–150 assertions at both viewports:

- **the geometry assertion.** In `LimitFigure`, map each of the three measured
  curves and its closed-form line through `getScreenCTM()` and assert the
  perpendicular distance is < 0.5px at ≥ 15 sampled x positions per panel, on
  a log x axis. Three panels, three closed forms, one assertion shape.
- the third panel's curve is **flat** in rendered pixels: the maximum
  difference in y across the whole sweep is < 1px, and the readout prints
  `(σ−1)/σ` to three decimals.
- `VarietyLab`: sweeping market size on its step grid leaves the markup
  readout monotone decreasing and the scale readout monotone increasing across
  ≥ 20 positions; the ghosted textbook values do not move (< 0.1px).
- `ElasticityFigure`: the horizontal asymptote is drawn and the curve
  approaches it from below at every σ preset; assert the curve never crosses it.
- three panels share a bounding-rect `top` at 1280px and do not at 390px.
- name every series (`curve measured`, `line closed`, `line textbook`) and
  select by name.

## Sources

CORE U7 for the price-setting firm; Chamberlin (1933), *The Theory of
Monopolistic Competition*, for the large-group assumption and the excess
capacity theorem; Dixit & Stiglitz (1977) *AER* 67(3):297–308 for the CES
formulation and the optimum-variety result. **Verify all three before writing
the sentences**, particularly the Dixit–Stiglitz optimality claim, which is
stated in several inequivalent forms in the literature and whose exact
constrained version is what claim 8 asserts. Theirs: the model, the theorem.
Mine: the three 1/n corrections as measurements, the convergence table, every
number.

## Risks

- **The article can read as a correction to a footnote.** It is not: the
  chapter's three headline results are all limits, and one of the errors is a
  constant that never shrinks. Lead with that constant, not with the scale
  correction, or the piece reads as pedantry about small n.
- **σ and n are both on the lab and they interact.** Two controls is the
  ceiling, and even two needs care: fix σ with presets and give the slider to
  market size, so the reader sweeps one thing at a time. The `xgboost`
  ten-control failure is one slider away.
- **Claim 7 removes the chapter's most memorable picture** — the tangency of a
  downward-sloping demand curve to a U-shaped average cost curve — and must
  therefore explain what that picture *was* for. Draw it once, honestly, in
  `CapacityFigure`, with the U-shaped cost the model does not have, and say
  which of its claims survive the change and which do not.
- **"Constrained optimum" must never be shortened to "optimum"** anywhere in
  the prose, including in a chart label. That is the whole content of claim 8.
- **The plan-time markup error is the one to expect again.** `p/c` and
  `p/(p−c)` are both called "the markup" in different textbooks. Pick `p/c`,
  say so in the first sentence that uses the word, and let the check enforce it.
