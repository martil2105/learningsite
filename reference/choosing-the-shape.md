# Choosing the shape

Read in pass 1, before there is an outline. The shape is the first thing that
should differ between two articles, and the first thing that does not if nobody
decides it.

Only the ends are fixed:

```
Meta → Logo → Title → Intro          ...the article...          Conclusion → Resources
```

Pick what goes between by asking: **what does the reader have to be holding in
their head already for the interactive to mean anything?** If the honest answer
is "nothing", put it first. If it is "three ideas", earn them first.

- **Lab first.** One manipulable object carries the whole mechanism and the
  article is an examination of it. Works when the object is legible cold.
  (`smote`, `autoencoders`)
- **Build-up.** Three or four small figures, each making one point, and the
  interactive arrives only once the reader can use it. The right shape when a lab
  shown cold would just be a picture nobody has a reason to touch.
  (`dbscan-hdbscan`)
- **One steered simulation.** The article *is* a single running thing the reader
  advances, prose alongside it. Natural for anything iterative — an optimiser, a
  clustering loop, boosting rounds.
- **Comparison spine.** Two things side by side the whole way down; the article is
  the accumulating differences. For genuinely comparative subjects this beats
  bolting a second panel onto a lab.
- **Question first.** Open on a concrete puzzle the reader can attempt, and let
  the machinery arrive as the answer. `shapley-values` is naturally this shape and
  was not built as it.
- **Case first.** Open on one concrete situation with real institutional
  furniture, and let every later section be a question that situation raises.
  (`population-stability-index`: four channels of one lender, one month, one
  scorecard — and the same truth reads 0.0014 at one channel and 0.0505 at
  another.) Strong when the subject is something people *do* rather than something
  people compute.
- **Assumption lab.** For a closed model: plant a truth, show the estimator
  recovering it, then put the identifying assumption on a control and let the
  reader break it. The mechanism and its failure are the same object. The obvious
  shape for difference-in-differences, IV, synthetic control, auctions, bank runs.

These combine, and the list is not exhaustive. State the chosen shape in the
spec, with a reason that is about this subject.

## What has been built

Derived from each article's `App.svelte` section order. Add a row in pass 4.

| Slug | Kind | Shape | Hook |
|---|---|---|---|
| `isolation-forest` | method | starter skeleton, maths first | `CutChart` |
| `xgboost` | method | starter skeleton, maths first | `LineChart` (ten controls — the known mistake) |
| `shapley-values` | method | starter skeleton | `CoalitionExplorer` |
| `k-means` | method | starter skeleton | `LloydLab` |
| `lightgbm` | method | starter skeleton | `SplitLab` |
| `autoencoders` | method | starter skeleton | `ProjectionLab` |
| `smote` | method | starter skeleton, centre-scroll replaced by a verdict | `SmoteLab` |
| `f1-score` | method | lab → reveal → consequences → three figures | `HuntLab` |
| `dbscan-hdbscan` | method | build-up, twelve content sections | `EpsLab` + `TreeCut` |
| `population-stability-index` | result | case first, fourteen content sections | `MonitorLab` |
| `constrained-choice` | model | build-up (three figures) into an assumption lab | `WageLab` |
| `nash-equilibrium` | concept | question first, thirteen content sections | `DeterrenceLab` |
| `comparative-advantage` | concept | question first, turning into an assumption lab (size on the slider); twelve content sections | `SizeLab` |
| `economic-rent` | model | question first, two-panel duality figure; the trap on its own slider | `RentLab` |
| `bargaining-and-the-surplus` | model | question first → assumption lab (horizon and fallback on controls); table-as-HTML for the two-theories check | `OfferLab` |
| `markup-and-elasticity` | concept | comparison spine (two curves, one pin, one cost slider); first use of the shape | `CurvatureLab` |
| `tax-incidence` | model | assumption lab (rate slider + statutory toggle: the curve moves, the outcome does not); first use of the shape | `WedgeLab` |
| `externalities` | model | case first (one plant, one river, one town) → instrument toggle → the Weitzman turn | `InstrumentLab` |
| `efficiency-wages` | model | lab first (drag the wage, find the tangency); the Ray from the origin is the object | `EffortLab` |
| `supply-and-demand` | model | assumption lab (shock variance ratio on the slider; direct and reverse regression lines bracket the true curve) | `ShiftLab` |
| `elasticity` | concept | build-up (ruler on straight line → smooth curves → revenue peak → arc and log formulas) | `RulerLab` |
| `surplus-and-efficiency` | model | comparison spine (two panels side by side: wrong quantity vs wrong people; d² + d(1−d) = d stacked bar) | `RationLab` |
| `cost-curves` | model | assumption lab (plant capacity slider; tangency vs minimum envelope geometry) | `PlantLab` |
| `perfect-competition` | model | one steered simulation (entry/exit round-by-round + sawtooth supply profile); first use of the shape | `EntryRun` |
| `monopolistic-competition` | model | comparison spine (monopoly vs monopolistic competition vs social planner under CES varieties) | `VarietyLab` |
| `cartels-and-the-prisoners-dilemma` | model | question first → assumption lab (cartel size k of n; outsider free-rider windfall) | `MergerLab` |
| `tragedy-of-the-commons` | model | build-up into an assumption lab (number of boats on lake; AP = w vs MP = w rent dissipation) | `LakeLab` |
| `gini-and-the-lorenz-curve` | concept | case first / comparison spine (two populations, identical Gini; credit scorecard validation) | `TwoPopulations` |
| `measuring-gdp` | concept | question first (four events: which lowers GDP?) into a displacement lab; the ledger read three ways | `ImportLab` |
| `price-indices` | model | assumption lab with the unobservable (σ) on the slider; guess first, then square law and chaining | `BasketLab` |
| `unemployment-flows` | model | case first (two towns at 6%) → flow cross → ratio plane → month-by-month shock run | `RatioLab` |
| `compound-growth` | result | build-up (log axis) → question (steady vs swinging) → identity → fan lab | `FanLab` |
| `money-creation` | model | one steered simulation (three banks' balance sheets, five steps), into a lab; second use of the shape | `InStepLab` |
| `peer-group-outliers` | method | field guide: case first, then six parts in pipeline order (data, preprocessing, fitting, scoring, testing, explaining); one shared catch strip under ~20 switch figures; first use of the shape | `RingLab` |
| `order-book` | model | build-up (a quiet book) → lab (walk it, switch the shape) → result chart (walk against size on log axes); finance row 1 | `WalkLab` |
| `volatility-drag` | result | smallest case (two days) → zigzag → the rule → lab where the reader sets the rule's two inputs → region map → parabola; finance | `PathLab` |
| `dividend-discount-model` | result | derive → stream lab (value today above, running total in its own panel below) → price-against-gap curve with the tangent → two-stage lab; finance | `StreamLab` |
| `diversification` | result + model | lab first (risk against n) → why (the covariance grid) → the part the risk numbers hide (growth) → simulated universe; finance | `RiskCurve` |
| `mean-variance-optimisation` | result + model | case first (a ten-asset optimiser scored against the truth) → the mean blur → the angle picture on equal axes → years chart; finance | `WeightsLab` |
| `time-diversification` | concept | lab first, one simulation on two rulers (yearly average / money at the end) → odds and depth in two panels sharing x → the parabola identity (how long each tail keeps sinking) → the fair case; finance Stage 8 | `HorizonLab` |
| `samuelson-1963` | result (paper) | paper explainer: citation card → story → outcomes lab with a take-all/share toggle → the proof in one display → CARA lab (n × one bet) → what came later, with a loss-aversion figure; first use of the shape | `BetsLab` + `CaraLab` |
| `bodie-1995` | result (paper) | paper explainer: citation card → guess card → two-panel lab (cost and chance) → only σ√T → price against expected payout → what came later | `PutLab` |

The first ten are Svelte 3 + Rollup 2 and stay that way; new articles are
Svelte 5 + Vite from `articles/_scaffold-svelte5/`, of which
`constrained-choice` was the first. That changes the component syntax, not
the shapes — `reference/house-idioms.md` says which reactivity rules apply where.

**Field guide (`peer-group-outliers`).** Used once, on request, for a reader
who needs a whole pipeline rather than one idea. It breaks the narrow-and-deep
rule on purpose and keeps the other one: every subsection proves one claim on
screen from the same running case. What made forty subsections read as one
article was a single readout shared by every figure, the catch strip (planted
groups caught out of the budget, plus everyone else), so the reader learns to
read it once. A generic switch figure (options × k, catch strip, a table of
every option at this k) carried about twenty sections; build that component
first. It needs a contents list after the intro, and it runs to about 8,000
words, so it is not a template for ordinary articles.

**One steered simulation has now been used twice** (`perfect-competition`, `money-creation`). In
`money-creation` the rounds are balance-sheet entries rather than market rounds, and the shape
earned its place for the same reason: the claim (a loan's reserves drain away, then come back when
the other banks move in step) is a sequence, and a stepper lets the reader see each sheet balance
before the next move.

**One steered simulation (`perfect-competition`) works well when discrete rounds drive the intuition.**
In `perfect-competition`, stepping individual firm entry/exit events round-by-round allowed
the reader to witness the exact point where the discrete integer constraint creates the sawtooth
supply curve and traps positive economic profits. For iterative algorithms, dynamic games, or
round-based market adjustments, steered simulations turn an opaque convergence formula into a
concrete mechanical process.

**Seven of the first ten are the starter skeleton or a near-variant of it** — `Intro →
[hook] → TextAndMathEquations → ScrollSide → [figure] → ScrollCenter →
Conclusion`. That is convergent evolution from copying the previous article, not
seven subjects that each wanted it; MLU-Explain's own articles vary far more. The
three that chose — `f1-score`, `dbscan-hdbscan`, `population-stability-index` —
are the three most recent and the three best, which is the argument for doing it.

**Question first is three for three, and the signal is now identified.**
`economic-rent`, `nash-equilibrium` and `comparative-advantage` all became
question-first once a probe found that the received account contains **a test
the reader can run**: the rectangle test, the dots-and-circles cell check, and
the two-step comparative-advantage procedure (compare opportunity costs, then
check that the price lies between them). The reader runs it, gets it right, and
one added case makes them wrong, which buys the transition into the second half
instead of announcing it. When a subject's received account is a *procedure*
rather than a *statement*, look here first. `comparative-advantage` also shows
the shapes combining: once the turn has landed, the second half is an assumption
lab with the hidden assumption, relative size, on the slider.

**Pick the structural analog by shape, not by topic.** The old rule ("regression
subjects → `linear-regression`") mapped ML topics onto the reference repo and is
useless outside ML. Choose the shape first, then read whichever of our own
articles already has that shape for its section mechanics, and the reference repo
only for component patterns (`reference/scaffolding.md` maps it).

## Component conventions, whatever the shape

- Name the hook for the subject — `ProjectionLab`, `SmoteLab`, `MonitorLab` —
  never `LineChart`. Two articles have a `LineChart.svelte` and neither of them
  should.
- **Avoid the starter's centre-scroll pattern.** A text card floating over a
  sticky chart covered the chart in both articles that first used it. It survives
  in the six starter-skeleton articles and in none of the four most recent.
  Side-by-side on desktop, folding to stacked on mobile, is what reads.
- One hook, and small interactions everywhere else — see the editorial voice
  section of `CLAUDE.md`, which is where that rule lives.

**Paper explainer (`samuelson-1963`, `bodie-1995`).** For a subject that *is* one
paper. `PaperCard.svelte` sits directly under the title block: a small "The
paper" label, the citation, and three short paragraphs (What it claims / What
we rebuild / What came later), passed in as snippets from `App.svelte` so the
prose gate reads them. The body then runs claim → rebuild → aftermath, and keeps
the house ends ("What this costs you", conclusion, sources). The rebuild is the
article: put the paper's argument on screen and assert it, then give the later
work its due in its own section rather than as a footnote. The sources say which
parts are the paper's (the story, the theorem, the setup) and which are ours
(every figure and number). Both first uses found a closed form the paper didn't
state (the golden-ratio fence and the $144 cap; price equal to expected payout
at a zero premium), and it carried the best figure, as on the economics line.
