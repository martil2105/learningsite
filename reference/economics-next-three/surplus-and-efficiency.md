# `surplus-and-efficiency` — pass-1 spec

**Kind** model · **Shape** comparison spine · **Hook** `RationLab`
**Stack** Svelte 5 + Vite · **Queue** slate row 5 (Mi5); imports
`MarketPanel.svelte` and `src/market.js` from `supply-and-demand`, and adds
the surplus integrals and the rationing model
**Closest analog by shape** `markup-and-elasticity` — two things side by side
the whole way down, and the article is the accumulating difference.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

The subject is two loss channels that every treatment collapses into one, and
the argument is that they behave completely differently. Two panels held side
by side from the first figure to the last — *the wrong quantity* on the left,
*the wrong people* on the right, the same market underneath both — is the
shape that makes the difference accumulate instead of arriving as a twist.
`choosing-the-shape.md` says the comparison spine beats bolting a second panel
onto a lab for genuinely comparative subjects, and this one is genuinely
comparative: the two channels share a market, a quantity and an axis, and
differ in every other respect.

Used once so far (`markup-and-elasticity`, where the two things were two
curves). Here they are two *mechanisms*, which is a different use of the same
shape.

## The angle

The textbook triangle is real and it is second order: put the quantity 10%
below the competitive level and you lose exactly 1% of the gains from trade,
in every linear market, whatever the elasticities. That is the received
result, and it is the argument that deadweight losses are small. It is also
only half the accounting. If the quantity is held down by a price the market
cannot clear at, the units that still trade have to be handed out somehow —
and if they go to whoever turns up rather than to whoever values them most,
the loss from that is **first** order. Cut the quantity by 27% and the
triangle costs 7.1% of the surplus while the rationing costs 19.6%; add them
and the total is 26.7%, which is the quantity cut itself. That is not a
coincidence in this market — **it is exact in every linear one.**

## The model

The base market, identical to `supply-and-demand`'s and `tax-incidence`'s:

```
demand:  q = A − B·p      inverse:  P_d(q) = A/B − q/B     (the value of the q-th unit)
supply:  q = C + S·p      inverse:  P_s(q) = (q − C)/S     (the cost of the q-th unit)
A = 120, B = 3, C = 20, S = 2  →  p* = 20, q* = 60
gap(q) = P_d(q) - P_s(q) = 50 - k*q,  k = (B+S)/(B*S) = 5/6
TS(q)  = ∫₀^q gap = (A/B + C/S)·q − ½·k·q²        TS* = TS(q*) = 1500
```

**One floating-point trap, found at plan time.** `1/B + 1/S` is **not**
bit-identical to `5/6` in doubles (0.8333333333333333 against
0.8333333333333334), so a check written as `k === 5/6` fails on a correct
module. Compute `k` as `(B+S)/(B*S)`, which is exact, and keep that spelling
everywhere it appears. This belongs in `house-idioms.md` in pass 4.

Linear demand **is** a uniform distribution of buyer values: `q = 120 − 3p`
means 120 buyers with values uniform on [0, 40]. That is the sentence article
1's setup figure earns, and it is what makes the rationing model concrete
rather than a hand-wave.

**The two instruments, at the same quantity.** A *quota* at `q` lets the price
rise to `P_d(q)`, so the buyers who trade are the ones who value the good most
and there is no misallocation. A *price ceiling* at `p̄` gives `q = C + S·p̄`
units and `N = A − B·p̄` willing buyers, and the `q` units have to be rationed
among the `N`. With random rationing, and with a share `θ` of units going to
the highest values instead (the slider, `θ = 0` being fully random):

```
triangle       = ½·k·(q* − q)²
misallocation  = (1 − θ)·q·(N − q)/(2B)
```

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | The competitive quantity maximises total surplus | True — a blind golden-section maximum of a trapezoid-integrated surplus lands on 60.000000, gap 3e-7 to `q*`, which is the flat-maximum floor and not a tolerance to tighten. The closed form and the integrator agree on TS\* = 1500 to 6.8e-13 | `SpineFigure` |
| 2 | Any other quantity loses a triangle | True, and the triangle has a closed form: `½·k·(q*−q)²` | left panel |
| 3 | — (**identity A**) | Loss ÷ TS\* = (Δq/q\*)² **exactly**, in every linear market: 3.941e-15 worst over the 277,555 admissible draws in 300,000 random markets × random quantities. It depends on no elasticity, no intercept and no scale. 1% off costs 0.01%; 10% off costs 1%; 25% off costs 6.25% | left panel |
| 4 | So the cost of getting the quantity wrong is small | **True — and it is the whole of the received account, which stops here.** | the turn |
| 5 | The competitive quantity is what efficiency requires | **Necessary, not sufficient.** At the right quantity with the wrong buyers the surplus is still lost. Random rationing costs `q·(N−q)/(2B)`, matched by an explicit shuffle Monte Carlo (4,000 draws) to 3.3e-3 relative, worst over five ceilings | right panel |
| 6 | — (**identity B**) | misallocation ÷ triangle = `q/(q* − q)` — **the units that still trade over the units that no longer do, and nothing else enters**: 2.135e-12 worst relative over the 369,402 admissible draws in 400,000 random markets × random ceilings. At a 10% cut the rationing costs 9× the triangle; at a 1% cut, 99× | `RatioFigure` |
| 7 | — (**identity C, the headline**) | Total loss ÷ TS\* = `d`, the fractional quantity cut itself — **exactly, linearly, in every linear market**: 8.882e-16 worst over those same 369,402 draws. `d² + d(1−d) = d`. A 27% cut costs 27% of the gains from trade | `SpineFigure` readout |
| 8 | — (what actually decides it) | The instrument, not the quantity. At the same `q`, a quota costs `d²` and a ceiling with random rationing costs `d`, a ratio of exactly `1/d` (1.138e-13 worst scaled over 200,000 cuts). At a 10% cut the ceiling costs **ten times** what the quota costs | `InstrumentFigure` |
| 9 | — (honest edge) | Both identities are facts about the straight line. On a constant-elasticity demand (ε = 1.6, same supply, same crossing) a 5% cut costs 11.39% of the surplus rather than 5%, and the rationing is 108× the triangle rather than 19×. The linear case is the **kind** one; the direction is the finding and the magnitude is indicative, because the constant-elasticity value integral has an unbounded upper tail | `InstrumentFigure` note + limits |
| 10 | — (cost) | Resale undoes the misallocation entirely and queueing converts it into a different loss; surplus is a welfare measure only without income effects; and the value distribution is the demand curve, which article 1 spent its length showing you cannot read off market data | limits |

## The worked case

Base market, ceiling at `p̄ = 12`: 44 units trade, 84 buyers are willing, the
competitive quantity was 60 — a cut of `d = 26.667%`.

| | amount | share of TS\* (1500) | formula |
|---|---|---|---|
| triangle | 106.667 | 7.111% | `d²` |
| misallocation | 293.333 | 19.556% | `d(1−d)` |
| **total** | **400.000** | **26.667%** | **`d`** |

ratio = 2.750000 = 44/16 = `q/(q*−q)`.

The `θ` slider, same ceiling:

| θ | misallocation | total loss | share of TS\* | × the triangle |
|---|---|---|---|---|
| 0.00 | 293.333 | 400.000 | 26.667% | 2.750 |
| 0.25 | 220.000 | 326.667 | 21.778% | 2.063 |
| 0.50 | 146.667 | 253.333 | 16.889% | 1.375 |
| 0.75 | 73.333 | 180.000 | 12.000% | 0.688 |
| 1.00 | 0.000 | 106.667 | 7.111% | 0.000 |

And the two channels against the cut, for `RatioFigure`:

| d | triangle (d²) | misallocation (d(1−d)) | ratio (1−d)/d |
|---|---|---|---|
| 0.01 | 0.01% | 0.99% | 99.0 |
| 0.05 | 0.25% | 4.75% | 19.0 |
| 0.10 | 1.00% | 9.00% | 9.0 |
| 0.20 | 4.00% | 16.00% | 4.0 |
| 0.30 | 9.00% | 21.00% | 2.33 |
| 0.50 | 25.00% | 25.00% | 1.00 |
| 0.80 | 64.00% | 16.00% | 0.25 |

The misallocation share peaks at `d = 0.5`, at exactly 25% of the total
surplus, and that is also the only point where the two channels are equal.
Below half the market, rationing always costs more than the triangle.

## The identity on screen

`SpineFigure`, the spine of the whole article: one market, two panels sharing
a quantity axis and a single cut slider. The left panel shades the triangle
and prints `d²`; the right panel shades the misallocation and prints `d(1−d)`;
a bar between them stacks the two and prints the total beside `d` — two
numbers from two unrelated routes, reading the same three decimals at every
position of the slider, in every preset market.

The moment to build the article around is the reader moving the slider and
watching a total that is always, exactly, the number on the slider.

## Layout

`SpineFigure` (the two panels and the cut slider, established first because
the comparison is the article) → `TheTriangle` (left panel alone: the closed
form, the `d²` table, why a blind maximum finds `q*`) → `TheQueue` (right
panel alone: the demand curve as a distribution of values, and 44 units handed
to 84 people) → `RationLab` (hook: the ceiling and `θ` on controls, the value
distribution redrawn as who gets served, the two losses live) → `RatioFigure`
(the two channels against the cut, and the crossing at exactly half) →
`InstrumentFigure` (quota against ceiling at the same quantity, the `1/d`
ratio, the constant-elasticity row as the honest edge) → limits.

`SpineFigure` reappearing under `RatioFigure` is deliberate: a comparison
spine keeps the comparison on screen, and a reader who has to scroll back to
remember which panel is which has lost the argument.

## Non-overlap

- `tax-incidence` (live, slate row 6) owns **DWL = ½t²·BS/(B+S)**, the Laffer
  peak and the two halves at the peak. Note that its formula and this
  article's triangle are the *same object*: a tax `t` cuts the quantity by
  `t·BS/(B+S)`, and substituting that into `½k(q*−q)²` returns
  `½t²BS/(B+S)` identically. **Assert that equality once in
  `check-numbers.mjs`** — it is cheap, it proves the two articles agree, and
  it is the right place to say so — then say in one sentence of prose that the
  tax parameterisation is that article's and move on. Do not build a tax
  figure.
- `externalities` (live) owns the Pigouvian welfare gain `½e²·BS/(B+S)`, which
  is the same triangle again with a third parameterisation. Same treatment:
  name it, link it, do not redraw it.
- `bargaining-and-the-surplus` (live) owns the **split** of a surplus and the
  independence of efficiency and fairness. This article is about the **size**
  of the surplus. One sentence of prose to keep them apart, in the limits
  section, where the distributional question belongs.
- `constrained-choice` (live) owns the frontier and tangency diagram. Not
  reused here; `MarketPanel` is article 1's.
- The welfare-measurement question (CV, EV, and when consumer surplus is
  neither) is slate row 34, `welfare-measures`. It belongs in limits as a
  named debt, in one sentence, not as a section.

## check-numbers.mjs

17–22 `ok()` blocks:

- `p* === 20`, `q* === 60`, `k === 5/6`, `TS* === 1500` exactly, and the
  closed-form TS against a trapezoid integrator to < 1e-9.
- the blind golden-section maximum lands on `q*` to < 1e-6, asserted **as the
  flat-maximum floor**, with a second assertion that a coarse grid search over
  ≥ 10,000 quantities picks the same neighbourhood — the two routes rule.
- **identity A** over ≥ 300,000 seeded random markets × random quantities,
  worst < 1e-12, with the market count reported in the prose.
- the `d²` table at its six quoted values, exact.
- the misallocation closed form against an explicit shuffle simulation
  (≥ 4,000 replications, seeded from `src/rng.js`) at five ceilings, worst
  relative < 5e-3, asserted **as a sampling tolerance** with the replication
  count in the sentence.
- **identity B** over ≥ 300,000 random markets × random ceilings, worst
  relative < 1e-10.
- **identity C** over ≥ 300,000 of the same, worst < 1e-12 — its own `ok()`,
  because `d² + d(1−d) = d` is the article's title claim and a check that
  buries it inside another assertion is a check nobody reads.
- the instrument ratio `=== 1/d` over ≥ 100,000 cuts, worst scaled < 1e-10.
- the worked case as exact integers and the quoted percentages: 44, 84, 60,
  106.667, 293.333, 400, 2.75.
- the `θ` table, all five rows.
- the crossing: the two channels are equal at `d === 0.5` exactly, and the
  misallocation share is maximised there at exactly 0.25.
- **the cross-article equality**: `½t²·BS/(B+S)` from `tax-incidence`'s `dwl`
  against `½k(q*−q)²` with `q*−q = t·BS/(B+S)`, over a rate grid, worst
  < 1e-12.
- the constant-elasticity edge at ε ∈ {1.6, 2.5, 4}, by numerical integration,
  asserted at printed precision with the tolerance stated as the integrator's;
  plus an explicit assertion that the **direction** holds at all three (the
  linear case is the kind one), which is the part the prose claims.

## check-browser.mjs

50–150 assertions at both viewports:

- **the geometry assertion.** Sweep the cut slider and assert the left panel's
  shaded triangle grows quadratically in the cut — fit `area ∝ d²` to within
  0.5% over ≥ 15 positions — while the right panel's shaded region grows
  linearly at small `d`; then assert the stacked total bar's rendered height
  is proportional to `d` to within 0.5% across the whole sweep. That one
  assertion is identity C in rendered pixels.
- the two panels share a bounding-rect `top` at 1280px and do not at 390px.
- at the `d = 0.5` preset the two shaded areas' rendered sizes agree to within
  1%.
- flip the instrument toggle at a fixed quantity and assert the rendered
  quantity line does not move (< 0.5px) while the total-loss bar changes
  height by the printed ratio to within 1%.
- name every drawn region (`shade triangle`, `shade misalloc`, `curve demand`,
  `curve supply`) and select by name; a two-shade panel is exactly the
  `constrained-choice` selector trap.
- **the band-drawing rule**: a shaded band between two curves is drawn from
  the smaller `y` with height `y(low) − y(high)`. This bit `economic-rent` and
  passed every numeric check while the rectangle was upside down. Assert every
  shaded rect has positive rendered height at ≥ 10 slider positions.
- the controls bar sticks above the panels under 700px.

## Sources

CORE U8 for surplus and the competitive quantity; Harberger (1954) *AER*
44(2):77–87 for the triangle and its smallness; Weitzman (1977) *Bell J. Econ.*
8(2):517–524 for rationing versus price as allocation mechanisms; Glaeser &
Luttmer (2003) *AER* 93(4):1027–1046 for the misallocation cost of rent
control, which is the empirical version of the right-hand panel. **Verify all
four before writing the sentence that leans on them.** Theirs: the triangle,
the smallness argument, the misallocation literature. Mine: the `(Δq/q*)²`
normalisation, the `q/(q*−q)` ratio, the total-equals-the-cut identity, the
`1/d` instrument comparison, every number.

## Risks

- **Identity C is almost too neat, which is a reason to check it harder, not
  to soften it.** It is `d² + d(1−d)` and nothing more, so the risk is not
  that it is wrong but that a reader takes it for a deep fact about markets
  rather than a fact about straight lines and random rationing. Claim 9 is
  the antidote and must not be cut.
- **Random rationing is an assumption, not a description.** Real shortages are
  queues, waiting lists and personal ties, and those are not random — they
  select on time cost, which correlates with value in a direction nobody
  agrees on. The `θ` slider exists to make that a parameter rather than a
  hand-wave; say in prose what `θ` would have to be for the triangle to be the
  bigger number (`θ > 1 − (q*−q)/q`, so at a 10% cut, θ above 0.889).
- **Do not let the right-hand panel become an article about price controls.**
  The ceiling is the mechanism that makes rationing necessary; the subject is
  the accounting. `externalities`'s risk note is the precedent — if one figure
  starts doing all the work, collapse the survey and keep the comparison.
- **The value-distribution figure is the one that can mislead.** Drawing 120
  buyers as 120 marks at 390px is a grey block. Draw the distribution as a
  band with a served/unserved split and a count, and let a small multiple show
  the individual marks only at desktop.
- **`MarketPanel` arrives from article 1 and must not be forked.** If it needs
  surplus shading it did not have, add the shading to the shared component and
  rebuild article 1's bundle, rather than copying the file. Two diverging
  copies of the shared panel is the exact debt the slate opened this section
  to avoid.
