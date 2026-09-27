# `tragedy-of-the-commons` — pass-1 spec

**Kind** model · **Shape** case first · **Hook** `LakeLab`
**Stack** Svelte 5 + Vite · **Queue** slate row 12 (Mi12); imports
`src/nplayer.js` from `cartels-and-the-prisoners-dilemma`
**Closest analog by shape** `externalities` — one concrete situation with real
institutional furniture, and every later section is a question it raises.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

This is something people *do*, in places with names, and the shape table says
case first is strong exactly there. One lake, a known number of boats, a
season's catch. The abstraction — a rent, a common pool, a wedge between
average and marginal product — arrives as the answer to a question the lake
raises, not as the setup.

Case first has been used twice (`population-stability-index`,
`externalities`). This is its third use and the pattern is earning its place:
both previous ones are among the project's better articles, and both had the
same property this subject has — a reader who already believes the situation
exists before any model is drawn.

## The angle

"Open access dissipates the rent" is a limit, and the way it gets there is the
opposite of everyone's intuition. Going from one owner to two users destroys a
quarter of the rent; going from ten users to eleven destroys under two points
of it. **The tragedy is front-loaded**: the second user does more damage than
the next eight combined. And the reason is one line — with `n` users the
equilibrium sets a weighted average of average and marginal product equal to
the wage, with weights `(n−1)/n` and `1/n` — from which the fraction of rent
destroyed comes out, for a square-root resource, as exactly `((n−1)/n)²`.

## The model

`n` users choose effort `e_i`; total effort `E = Σe_i`. The resource yields
`F(E) = A·E^θ` and each user takes their share of it, `(e_i/E)·F(E)`. Effort
costs `w` per unit. `A = 100, w = 1, θ = 1/2`.

```
efficient:     F'(E) = w                        →  E* = (θA/w)^(1/(1−θ)) = 2500
n users:       (1 − 1/n)·AP(E) + (1/n)·MP(E) = w      AP = F/E,  MP = F'
rent:          R(E) = F(E) − w·E
```

The weighted-average condition is the article's spine. At `n = 1` it is
`MP = w`, the sole owner's rule; as `n → ∞` it is `AP = w`, which is where the
rent is gone. Everything in between is the weight.

**Every equilibrium in the checks is found by `nplayer.js`** — sequential
best response, each user maximising their own catch minus their own cost,
reading every other user's effort — and only then compared to the closed form.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | A resource with open access is overused | True, and by a lot: with `θ = 1/2` the effort at open access tends to **exactly four times** the efficient effort, `E_n/E* = ((2n−1)/n)²` | `LakeLab` |
| 2 | — (the mechanism) | The equilibrium sets `(1−1/n)·AP + (1/n)·MP = w`: a blind sequential best-response solver agrees with that closed form to 3.045e-8 across 15 (n, θ) pairs — the search's flat-maximum floor — and reproduces the sole owner's `MP = w` exactly at `n = 1` | `WedgeFigure` |
| 3 | Open access dissipates the entire rent | **In the limit, for every θ.** What depends on θ is how fast | `DissipationFigure` |
| 4 | — (**the identity**) | For `θ = 1/2` the fraction of rent destroyed is **exactly `((n−1)/n)²`**: worst absolute gap 1.443e-15 over n = 1…4000. Two users destroy 25%, three 44.4%, five 64%, ten 81%, a hundred 98.01% | `DissipationFigure` |
| 5 | Each extra user makes it worse | True, but **the tragedy is front-loaded and everyone has the slope backwards.** The second user costs 25.0 points of rent, the third 19.4, the fourth 11.8, the fifth 7.75, the tenth under 2. The most damaging user is the second one | `MarginalUserFigure` |
| 6 | — (where the halfway point is) | Half the rent is gone at `n = 2 + √2 = 3.414` users. A commons with three or four users has already lost half of what a sole owner would have kept | `DissipationFigure` marker |
| 7 | So the problem is common ownership | **The problem is the count, and the model says so.** `n = 1` is efficient whether the owner is a person, a village or a state; the dissipation is a function of how many independent decisions there are, not of who holds the title. This is the sentence Ostrom's field evidence turns on, and the model reaches it without her data | prose + `LakeLab` |
| 8 | — (what fixes it, and what is not this article's) | A quota at `E*` restores the rent by construction, and the effort tax that does the same is `AP(E*) − MP(E*) = 1.000` per unit here. That a tax, a quota and a bargain all land on the same effort and differ only in who keeps the money **is `externalities`, and this article cites it rather than re-proving it** | limits |
| 9 | — (cost) | Identical users, effort as the only choice, a static resource with no stock dynamics — so nothing here is about fisheries collapsing, which needs a stock that can be driven to zero and is a different and harder model. Say that plainly; the reader is thinking about cod | limits |

## The dissipation table (θ = 1/2)

| n | effort ÷ E* | rent kept | rent destroyed | ((n−1)/n)² |
|---|---|---|---|---|
| 1 | 1.0000 | 100.00% | 0.00% | 0.00% |
| 2 | 2.2500 | 75.00% | 25.00% | 25.00% |
| 3 | 2.7778 | 55.56% | 44.44% | 44.44% |
| 4 | 3.0625 | 43.75% | 56.25% | 56.25% |
| 5 | 3.2400 | 36.00% | 64.00% | 64.00% |
| 10 | 3.6100 | 19.00% | 81.00% | 81.00% |
| 20 | 3.8025 | 9.75% | 90.25% | 90.25% |
| 100 | 3.9601 | 1.99% | 98.01% | 98.01% |

Other technologies, for the honest edge — the square is a fact about `θ = 1/2`,
and the rest is measured:

| θ | D(2) | D(5) | D(20) | D(∞) |
|---|---|---|---|---|
| 0.2 | 34.20% | 71.37% | 92.60% | 100% |
| 0.5 | 25.00% | 64.00% | 90.25% | 100% |
| 0.8 | 19.91% | 58.53% | 88.27% | 100% |

## The identity on screen

`DissipationFigure`: rent destroyed against the number of users, with the
measured points (from the solver) and the curve `((n−1)/n)²` drawn through
them, the half-rent marker at `n = 3.414`, and a θ selector that visibly moves
the measured points off the square while the shape survives. The strongest
version puts the *increment* beside it — a bar per additional user, tall at
two and almost invisible at ten — because claim 5 is the one that changes how
the reader thinks and a level curve hides it.

## Layout

`TheLake` (the case: one lake, a season, a wage, the numbers — how much a sole
owner would take and what it would be worth) → `TheSecondBoat` (one more user
arrives; the reader sets the second user's effort and watches the first user's
best response move) → `WedgeFigure` (the `(1−1/n)AP + (1/n)MP = w` condition,
with the two curves and the weighted point sliding between them) → `LakeLab`
(the hook: `n` on a control, effort and rent live, the efficient point ghosted)
→ `DissipationFigure` (the identity) → `MarginalUserFigure` (the front-loading)
→ limits.

## Non-overlap

- `externalities` (live) owns **instrument equivalence** — tax, quota and
  bargain reaching the same quantity and splitting the money differently — and
  the Weitzman uncertainty turn. Claim 8 names the tax and cites that article;
  it does not draw three instruments.
- `economic-rent` (live) owns what a rent is and the gap-to-the-frontier
  picture. This article takes rent as given and asks what destroys it; one
  sentence and a link, and do not rebuild the frontier diagram.
- `surplus-and-efficiency` (row 5) owns the deadweight-loss triangle and the
  misallocation channel. The rent destroyed here is a different accounting on
  a different diagram — say so once, or a reader who has just read row 5 will
  assume it is the same triangle.
- `cartels-and-the-prisoners-dilemma` (row 11) owns Cournot and the merger
  paradox. Import `nplayer.js`; the structural kinship — both are `1/n` wedges
  between a private and a social margin — belongs in the spine bridge, in one
  sentence, and not in a section here.
- `perfect-competition` (row 8) owns free entry. The number of users here is a
  control, not an entry margin, and the article should not open that question.

## check-numbers.mjs

15–20 `ok()` blocks:

- **`nplayer.js` against the closed form** over ≥ 15 (n, θ) pairs, worst
  relative < 1e-6, asserted as the flat-maximum floor; and `n = 1` reproducing
  `E*` to < 1e-9. First, because it is the oracle.
- the weighted-average condition asserted directly: at the solved effort,
  `(1−1/n)·AP + (1/n)·MP − w` is < 1e-9 for every (n, θ).
- **the identity**: rent destroyed against `((n−1)/n)²` for `θ = 1/2` over
  `n = 1…4000`, worst absolute < 1e-12.
- the effort ratio `E_n/E* === ((2n−1)/n)²` over the same range, worst
  relative < 1e-12, and the limit of 4 at `n = 10⁶` to < 1e-9.
- the dissipation table, all eight rows, exact where it is exact (25%, 44.44%,
  64%, 81%, 98.01% are exact rationals — assert them as such).
- the increments: the largest single-user increment is at `n = 2`, asserted by
  comparing all increments to `n = 200` rather than by checking the two the
  prose quotes.
- the half-rent point `=== 2 + √2` to < 1e-12, by bisection on the closed form
  **and** by interpolating the solver's own points, which is the second route.
- the θ table at its nine entries, with the tolerance stated as the solver's.
- full dissipation in the limit for every θ tried: rent kept at `n = 10⁶` is
  < 1e-3 of `R*` for θ ∈ {0.2, …, 0.8}.
- the corrective tax `=== AP(E*) − MP(E*)`, and an assertion that effort under
  that tax equals `E*` to < 1e-9 — computed through the solver, so it could
  have failed.
- **the floating-point note**: any reciprocal sum is spelled as a single
  division.

## check-browser.mjs

50–150 assertions at both viewports:

- **the geometry assertion.** In `DissipationFigure`, map the measured points
  and the `((n−1)/n)²` path through `getScreenCTM()` and assert every point's
  perpendicular distance to the path is < 0.5px at θ = 1/2; then switch the θ
  selector to 0.8 and assert the *same* points are more than 5px off that path
  while still lying on the newly drawn one. Both directions, in one control.
- `MarginalUserFigure`: the rendered bar at `n = 2` is taller than the sum of
  the rendered bars from `n = 6` to `n = 13`, which is claim 5 stated as
  pixels.
- `WedgeFigure`: the weighted point's rendered position sits on the segment
  between the AP and MP points, at the fraction `1/n` from the AP end, to
  within 0.5px, at ≥ 8 values of n.
- `LakeLab`: sweeping `n` leaves the ghosted efficient marker stationary
  (< 0.1px) while the equilibrium marker moves monotonically.
- the half-rent marker's rendered x matches `n = 3.414` on the axis to < 1px.
- name every series and every marker; select by name.

## Sources

CORE U10 and U12; Gordon (1954) *JPE* 62(2):124–142 for the
average-product-equals-cost condition in a common-pool fishery; Hardin (1968)
*Science* 162:1243–1248 for the name and the framing the article disputes;
Ostrom (1990), *Governing the Commons*, for the field evidence that small,
rule-bound commons do not behave as the model's large-`n` limit says. **Verify
all four before writing the sentences that lean on them** — Hardin especially,
whose argument is frequently described from memory and is not quite what it is
usually said to be. Theirs: the model, the name, the counter-evidence. Mine:
the `((n−1)/n)²` measurement, the front-loading, the `2 + √2` point, every
number.

## Risks

- **Hardin is a minefield and the article must be fair to him.** Read the
  paper before characterising it. The point of claim 7 is not that Hardin was
  foolish but that the model's own comparative static is about the number of
  independent decisions, which is what Ostrom then found in the field. "Be
  fair to whatever the article argues against" is in
  `verifying-an-article.md` and applies here more than anywhere else in this
  batch.
- **The reader is thinking about a fishery collapsing** and this model cannot
  collapse — there is no stock. Claim 9 has to arrive before the reader
  notices, not after.
- **`LakeLab` must not gain a stock dynamic.** That is a different article, and
  adding a year counter to this one produces a simulation that does not match
  any of the identities.
- **Claim 5 is counterintuitive and a level curve will not carry it.** The
  increments figure is not optional; the level curve alone reads as "more
  users, more damage", which is what the reader already believed.
- **Three colours, and this article wants four things** — the AP curve, the MP
  curve, the equilibrium and the efficient point. Two curves take two slots,
  the equilibrium takes the third, and the efficient point is the background
  class `#8a94a2` with a distinct mark shape rather than a fourth hue.
