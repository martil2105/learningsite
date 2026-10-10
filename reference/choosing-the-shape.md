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
| `pastor-stambaugh-2012` | result (paper) | paper explainer: citation card → forecast lab (one history, two bands: the unknown mean) → the predictive system and its five pieces → world-vs-investor lab with a piece-by-piece bar chart → persistence chart (the doubt band and its average) → the paper's numbers, quoted → what came later | `ForecastLab` + `TwoVariances` |
| `anarkulova-cederburg-odoherty-2022` | result (paper, data not reachable) | paper explainer rebuilt on a simulated world: citation card → 39 identical markets, the luckiest in blue, loss chance by horizon from each record → the luck premium and its z-shift → truth against the luckiest record by n and Y → the paper's numbers, quoted | `MarketsLab` |
| `merton-share` | concept | lab first (value of every share, a parabola, borrowing zone shaded) → the formula at the peak → the flat top (2x − x²) → which premium goes in → the premium we have to estimate (200 plug-in investors; kept fraction by years of data) | `ShareLab` |
| `samuelson-merton-1969` | result (paper) | paper explainer: citation card → guess card (thirty years, one, or the same) → dynamic programming in words → the backward solution run in the browser (share by years to go; setup switch) → why the horizon drops out → ways out | `LifetimeLab` |
| `human-capital` | concept | short build-up (future pay as a bond, Merton on total wealth) → lab: the first lifetime exposure timeline (savings under future pay, stock money above; share of savings below on a −100%…300% window) → the β identity → borrowing limits | `LifeLab` |
| `bodie-merton-samuelson-1992` | result (paper) | paper explainer: citation card → guess card → hours as a second asset (Cobb–Douglas, the spending plan) → two workers and one year in the market → where the gap comes from (two Merton problems, one algebra step) → the same factor at every savings level and horizon, and the retirement corner | `FlexLab` + `AcrossLab` |
| `cocco-gomes-maenhout-2005` | result (paper, solver) | paper explainer with a precomputed dynamic programme: citation card → guess card → risky permanent pay and a limit on the share → solving backwards in words → share by age for the median worker and the middle 80% of 4,000, with savings under it → pay that moves with stocks → what the limit costs in consumption | `PolicyLab` + `CostLab` |
| `benzoni-collin-dufresne-goldstein-2007` | result (paper) | paper explainer: citation card → guess card → pay that follows dividends with a lag (half-life) → the hump in the share by age → the loading of each payday (one age at a time) → a knife-edge (share at 25 against the half-life) | `HumpLab` + `HorizonLab` + `EdgeLab` |
| `lifecycle-leverage` | concept | short set-up (money riding on the market, year by year) → exposure lab (bars for each year, last-decade toggle, four rules) → effective years → what a cap on leverage buys, from 100,000 seeded savers (precomputed) → what the glide path does instead | `ExposureLab` + `CapLab` |
| `cost-of-leverage` | concept | guess card → one line split in two by the spread (Merton's share, a band held at exactly 100%) → the same spread on a working life (leverage until 55, not 62) → what it costs in certain return → who borrows near the safe rate | `KinkLab` + `LifeLab` + `CostLab` |
| `market-making` | model | question first (guess card: the break-even spread) → who sends a buy (a Bayes figure: area = probability, the ask is the average over the pink cells) → the ledger in one display → one steered simulation (a day of trades stepped by the reader; curated days, the second goes the wrong way) → learning speed on a log axis (curves shifted by 4 per halving) → the bill for a piece of news, with an announcement horizon; finance Stage 1, third use of the steered simulation | `TradeLab` + `BayesFigure` + `LearnChart` + `BillChart` |
| `short-selling-and-margin` | model | question first (how far before the call?) → account lab (equity and the requirement as two straight lines crossing at the call; long/short toggle, price, both margins) → meeting the call (1/k) → selling short → forty simulated years on a log price axis with the two call lines, and the reflection-principle chance by volatility | `AccountLab` + `PathsLab` |
| `index-construction` | result + model | build-up: three stocks, one month (two panels: cap-weighted needs no trade, equal-weighted sells its winner) → turnover and gain by rebalancing frequency (two panels sharing a log axis) → an exact identity → the lab (a dollar in each index; the gap split into gain and concentration at every date; a world toggle) | `IndexLab` + `DriftFigure` + `TurnoverChart` |
| `etf-premiums` | model | case first (LQD's 5.0% discount on 12 March 2020) → the arbitrage band → a NAV built from last trades (one recursion) → sell-off lab (price and NAV, then the reported premium against the band) → who closes the gap (two regression panels over simulated days) | `SellOffLab` + `ArbFigure` + `GapRegression` |
| `dividends-and-buybacks` | model | question first (EPS up or down, who's better off?) → comparison spine (the same payout as a dividend and a buyback: gains per share held, and EPS, side by side; the buyback price on a slider) → paying the wrong price → an accretion map (P/E against the after-tax yield on cash) → why the price doesn't move (beta and the return needed) | `PayoutLab` + `AccretionMap` |
| `multiples` | model | question first (guess card: a firm that never grows against one reinvesting half at 8%; same P/E) → lab (P/E against growth, one curve per ROE, every curve through 12.5 at zero growth and flat at ROE = r) → PVGO and the P/B identity → how long the margin lasts (P/E against years, two firms at the same 25) → one P/E, a line of stories (required return against growth for a P/E and a P/B, with presets) | `GrowthLab` + `FadeChart` + `StoryMap` |
| `capital-structure` | model | question first (borrow half at a safe 3%: is the cost of capital 5.5%, 8% or more?) → both propositions in two displays → assumption lab (expected returns against D/E with the safe-debt line; asset volatility on a slider, so the line bends when the loan stops being safe) → the payoff split stacked to the firm over the distribution of next year's assets → the yield is a promise → taxes | `ReturnsLab` + `SplitFigure` + `YieldChart` + `TaxFigure` |
| `npv-vs-irr` | result | question first (Quick at 50% or Slow at 24.6%?) → two scores → Hazen's identity in two displays → lab (NPV profiles above, the same NPVs as rectangles below: width = money tied up, height = IRR − r; a pair toggle) → reinvestment (the crossover rate again) → a mine with two IRRs and the identity at each | `RateLab` + `ReinvestFigure` + `MineFigure` |
| `sharpe-ratio` | result | case first (two funds with the same returns, one priced by the market and one by appraisers; guess card) → from a month to a year (variance of a q-month return with memory) → one seeded history, true and reported, with an unsmooth toggle → the months Lo's correction can't see (reported ÷ true by horizon) → unsmoothing | `SmoothLab` + `MemoryFigure` + `HorizonChart` |
| `capm-and-beta` | model + empirical | build-up: a beta is a slope (French's beta deciles, a scatter per decile) → the CAPM's line → a test that flattens the line on its own (a world where the CAPM holds; noise on a slider, the x axis on a toggle between sorting betas and the betas the groups then had) → the same test on US data → alphas by decile | `SortLab` + `BetaScatter` + `AlphaBars` |
| `factor-models` | result + empirical | case first (value's 4.5% CAPM alpha; guess card) → alpha is an intercept → the identity (each added factor takes loading × its own alpha) → factor prices → waterfall lab (asset, factors, model presets; steps chain to the alpha left) → alphas that grow (momentum with value) → low beta under five factors | `AlphaLab` + `PriceBars` |
| `equity-premium` | empirical | build-up: a century of yearly premiums with the band (window sliders, presets, a yearly/monthly toggle, a ruler under the bars) → guess card → yearly and monthly bands against years of data → rolling windows (20/30/50, a scrubber) → realised against Fama and French's dividend estimate by period, stacked | `BandLab` + `FreqBands` + `RollingChart` + `SplitLab` |
| `fundamental-law` | result | question first (A: IC 0.06 on 50 stocks, B: 0.02 on 1,000; guess card) → one month of forecasts (scatter, IC slider) → breadth → lab (IR against N on a log axis, Grinold's curve and the curve with a month-to-month swing, its ceiling) → the two managers with the swing (the order flips) → ten simulated years against the risk model's bands | `BreadthLab` + `IcScatter` + `ManagerBars` + `RiskLab` |
| `kelly-criterion` | result | case first (Haghani and Dewey's 60% coin: 61 seeded players, a share slider, log axis) → Kelly's rule (typical growth against the average's) → from coins to stocks → guess card (Kelly against half Kelly after 30 years) → the race (40 pairs as Kelly ÷ rival on a log axis, the chance ahead below) → how far down (x^(2/c − 1) against the full-Kelly diagonal) | `RaceLab` + `CoinLab` + `GrowthFigure` + `DrawdownLab` |
| `efficient-markets` | model + empirical | case first (a rule that held the market after up days: 30.5% a year on paper in 1962–86) → five-year windows (lag-1 autocorrelation, or the rule) → the variance ratio by period → two efficient markets that fail the test (stale prices / bid–ask bounce toggle, 40 days true against recorded, VR formula against 25 simulated years) → $1 on paper and for real | `WorldLab` + `HistoryBars` + `VRFigure` + `ProfitFigure` |
| `fat-tails` | empirical + result | case first (19 October 1987, 16.2 sd) → every day binned on a log axis with the normal's counts and a threshold → the tails on log–log axes with Hill's fit (a k selector) → kurtosis that settles and doesn't (precomputed t₃ and t₆ samples; US windows split into the biggest day's slice and the rest) | `CountLab` + `TailFigure` + `KurtosisLab` |
| `value-at-risk` | concept | question first (two bonds, each with a 95% VaR of zero; $50 in each gives $30) → a height and an area (the quantile panel: VaR a dot, ES a dashed rectangle with the shaded area's area) and both numbers against the number of bonds → apart and together (bars; bonds against two normal losses with a correlation slider) → FRTB | `BondsLab` + `PairFigure` |
| `volatility-clustering` | empirical + model | question first (1987 or 1955: which was the bigger surprise?) → memory in sign and size (ACF by lag, band robust to clustering) → GARCH and its half-life → three years with the forecast band (five windows, pink days outside) → the ten biggest days ranked two ways | `VolLab` + `AcfFigure` + `RankFigure` |
| `var-backtesting` | concept + empirical | question first (a model that's really a 98% VaR: how often green?) → the count lab (Binomial(250, p) over the three zones, the right model as grey caps, capital on US losses) → Kupiec → days needed (power against days on a log axis, jagged) → four models over 104 blocks of 250 US days (bars by block, one block's days with the VaR line) → bunching (the same exceptions shuffled; block counts against the binomial; the variance-ratio bracket) → the rules now | `ZoneLab` + `DaysFigure` + `CenturyLab` + `ShuffleFigure` |
| `drawdowns` | result + empirical | question first (a ten-year backtest: will ten live years go past its worst?) → one steered path (backtest then 30 live years, live drawdowns from the live start, five curated seeds) → growth with record length, with a toggle to the strategy's own units where every Sharpe ratio above zero lies on one curve → live against backtest (50% at equal lengths) → a working and a dead strategy's densities with a stopping line → Wald's d/μ → the US century against a random walk | `PathLab` + `ScaleFigure` + `NextFigure` + `DeepFigure` + `UsFigure` |
| `bond-pricing-and-yield` | concept | build-up (PV bars at one rate) → question first (30-year 8% bond, rates to 4% the next day) → what the yield promises (three bonds at 4%: price paths and each year's return split into coupon and price change) → where the money comes from → lab (the position worth P(r)(1 + r)^t against the promise on a log axis, with the crossing; the money at maturity in three parts) → the D/T rule as a tangent | `RealisedLab` + `PriceFigure` + `PullFigure` + `RuleFigure` |
| `duration-and-convexity` | result | question first (sell at 12.2 years; rates to 4% or 12%: which is better?) → the average wait as a seesaw (moments cancel at the fulcrum) → the slope of the price (tangent and convexity) → lab (money at H against the promise for every new rate; a button for H = D) → why the floor is the promise (one zero, the coupon bond and a barbell with the same D) → is convexity free? → the duration hump | `HorizonLab` + `SeesawFigure` + `PriceCurve` + `SpreadFigure` + `HumpFigure` |
| `yield-curve-and-forwards` | concept + model | build-up: bootstrapping as a short steered run (Next bond; a price-error slider) → a yield is a duration-weighted average of spot rates → forwards as break-evens (two ways to lend for two years) → question first (expected 4% for ever, no premium: the 30-year forward?) → lab (Vasicek: expected rate, forward and yield; premium and convexity shaded) → what the data say, quoted | `ForecastLab` + `BootLab` + `CouponFigure` + `BreakEvenFigure` |
| `merton-model` | model + result | lab first after a guess card (shares move 60%: how much do the assets?) → two clues as two curves of possible firms in the plane of asset volatility and asset value, crossing at the firm → why the shares move more (the same firm at other asset values: share volatility above, the market's chance of default on a log axis below) → distance to default → whose chance (market's ÷ real against the real chance, 1 and 10 years, Sharpe slider) → default before the debt is due (200 seeded years, two counting rules) | `SolveLab` + `FallFigure` + `WhoseFigure` + `PathsFigure` |
| `credit-spread-puzzle` | empirical + model | case first (a century of Baa over Aaa from FRED, period buttons, the expected-loss line) → what defaults cost → guess card (which bond's spread is the bigger multiple?) → lab (stacked bars: expected loss and the price of when defaults happen, the model's gap against what Baa paid; correlation and market Sharpe sliders) → the multiple against the default rate, following the lab → how sure is a default rate (2,000 seeded 32-year records in a one-factor world) | `ModelLab` + `HistoryFigure` + `MultipleFigure` + `NoiseFigure` |
| `forwards-and-futures` | model | case first (WTI for May and June 2020, Friday and Monday) → two ways to own the index in a year (lab: forty seeded years with the carry line, then what each piece of the arbitrage pays, flat together) → guess card (two forecasts, one price) → a price, not a forecast → which prices an arbitrage rules out (index against oil) → back to April 2020 → daily settlement (three curated years; the tailed account lands on the forward's payoff, and one contract minus the tailed position) | `CarryLab` + `OilFigure` + `ForecastFigure` + `CeilingFigure` + `MarginFigure` |
| `put-call-parity` | result | comparison spine: a call and a put side by side in every figure, the difference pinned. Payoffs (strike and ending-price sliders, toggle to the difference) → guess card → conversions → two models, one difference (lab) → the forward hiding in option prices (implied volatilities with a borrowing fee, wrong forward against the options' own) → Palm in March 2000 (synthetic share ranges by expiry against the price) → box spread → American band | `ModelsLab` + `PayoffFigure` + `IvLab` + `PalmFigure` |
| `binomial-pricing` | model | question first (an optimist and a pessimist price the same call) → assumption lab (the reader finds the copy: shares and money owed on a one-step tree) → the risk-neutral probability → what the real chance sets (expected returns against p, two lines crossing at the safe rate, slopes 7 to 1) → a four-step tree filled backwards one column per press → convergence (price against steps, the zigzag) → a third branch (the no-arbitrage band and a risk-averse investor's price, real chances on sliders) | `CopyLab` + `ReturnFigure` + `TreeLab` + `ConvergeFigure` + `TrinomialLab` |

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

**When the paper's data can't be had** (`anarkulova-cederburg-odoherty-2022`,
a 📄📊 row whose Global Financial Data panel isn't public, with no open
multi-country panel reachable from the container or the Mac), rebuild the
*mechanism* on a simulated world where the truth is known, and give the
paper's real-data numbers a section of their own ("What the paper found"),
each attributed to the version it came from (published abstract or working
paper). The simulated world should be the smallest one that produces the
paper's effect on its own: 39 identical markets reproduced the paper's
US-versus-pooled gap from luck alone, which made a better article than a
calibration to the paper's table would have. Say in "What this costs you"
what the simulation leaves out.

**A lab that runs a solver** (`samuelson-merton-1969` solves a 30-year dynamic
programme per setup, about 150 ms each) solves lazily and caches per setup:
`const sol = (c) => (cache[c] ??= solve(c))` inside the `$derived`, so the page
pays only for the setup on screen.

**A solver too slow for the page** (`cocco-gomes-maenhout-2005`: a 40-period
dynamic programme with nested searches, twelve settings, 4,000 simulated
workers) runs in `scripts/precompute.mjs` and ships as `src/precomputed.js`;
the first check in `check-numbers.mjs` re-runs the solver and compares it with
the committed file, so a stale file fails. `lifecycle-leverage` does the same
for its 100,000-saver simulations.

**A paper explainer still needs the maths on the page.** Rows 53 to 55 each
put the paper's own step in a display equation (two Merton problems and one
algebra step; the policy problem; the loading of a payday), and each put the
paper's *claim* in a guess card first. A paper explainer that only runs a lab
reads as a demo of the paper rather than a rebuild of it.

**Stage 1 of the finance slate (`market-making` to `dividends-and-buybacks`,
30 September 2026).** Five articles on market mechanics, built together after
Stage 8. Three of the five turned out question first, because the received
account in each was a procedure a reader can run (quote the break-even spread,
find the call price, compare EPS), and one added case turns the answer. The
comparison spine suited the payout article better than a lab: a dividend and a
buyback are the same payout in two wrappers, and the article is the list of
things that differ (EPS) and don't (wealth, P/E). Where a paper's identity
carries an article (`index-construction`, Fernholz's split of the gap between
two indices), it can sit in an ordinary build-up without the paper-explainer
furniture, as long as the sources say whose idea it is.

**Stage 2 of the finance slate, and row 12 (`multiples` to `sharpe-ratio`,
3 October 2026).** Three of the four are question first again, because each
received account is a procedure (raise g in the P/E formula, average 8% and 3%
by weight, take the higher IRR) that one added case turns. The slate flagged
`npv-vs-irr` as a possible merge into the dividend discount model; pass 1 found
an identity of its own (Hazen's NPV = margin × money tied up), and that turned a
merge candidate into the clearest picture of the four, two rectangles whose
heights are the IRR's verdict and whose areas are the NPV's. A slate's "may
merge" is a pass-1 hypothesis like its "What it shows" line. Where an identity
is a product, draw it as an area.

**Stage 3 of the finance slate, rows 15 to 18 (`capm-and-beta` to
`fundamental-law`, 3 October 2026).** Three of the four rest on pinned French
data, and the shape that served them was a build-up whose first figure is the
data itself (a decile's scatter, a century of bars), so the reader has seen the
raw thing before a summary of it. Two used a world where the received claim
holds exactly (the CAPM, Grinold's law) as the control for what the data or the
added assumption does; that pairing is the cheapest way to separate a
measurement effect from a real one. The guess card worked best where the
received answer is a number the reader already carries (8.9%, "B has the higher
IR") and the article changes what it means rather than whether it's right.

**Rows 19 to 23 (`kelly-criterion` to `volatility-clustering`, 4 October
2026).** Three of the five rest on the same pinned daily file, and each used it
for a different question: the sign of daily moves, their size, and their size
against a forecast. Two of them turned a slate claim already covered elsewhere
(`merton-share` had Kelly's flat top; `sharpe-ratio` had autocorrelation into
√12) into a path or recording question instead, so check the built articles for
the slate's line before probing it. Where a received account is "this number
measures that" (kurtosis measures tails, VaR measures risk, a z-score measures
surprise), the strongest figure put the number next to a second ruler that
disagrees with it: the biggest day's slice of a kurtosis bar, ES as an area
beside VaR as a height, the century's standard deviation against the
forecast's. Draw an identity that is an average as a rectangle with the same
area as the shaded region it averages (`value-at-risk`), and check the two
areas in pixels.

**Rows 24 to 28 (`var-backtesting` to `yield-curve-and-forwards`, 9 to 10
October 2026), built a third longer than earlier rows on request.** About 2,000
words, four or five figures and a guess card each, rather than 1,500 words and
three figures. Martin made this the standard length the next day (see
`CLAUDE.md`), so every shape in the menu above now plans for one more worked
section than its earlier examples show. The extra length went into one more worked section with its own
small figure (the capital the traffic light leaves, the shuffle, the
detection densities, the US century, the duration hump, the bootstrap's error
slider), not into longer paragraphs; that kept the voice numbers where they
were. Three of the five turned the slate's line around: the VaR count can't see
*when* (bunching), the √T law is only the no-edge case (with an edge it's
logarithmic, and in the strategy's own units every edge is one curve), and
duration's third job (the immunising horizon) is the claim, because
`dividend-discount-model` already had duration as a sensitivity. Two neighbours
were planned together so the first could hand the second its question:
`bond-pricing-and-yield` ends on the crossing point of the promise and the real
position, and `duration-and-convexity` opens on it; `duration-and-convexity`
ends on the convexity a market must charge for, and `yield-curve-and-forwards`
shows the same convexity pulling forward rates below expectations.

**Rows 29 to 33 (`merton-model` to `binomial-pricing`, 10 October 2026), the
first batch at the standard length.** 1,983 to 2,040 words, four or five
figures and a guess card each. Two of them open on a real day rather than a
toy: `forwards-and-futures` on WTI's −$37.63 (quoted settlements, with the
Friday derived from the reported changes) and `put-call-parity` on Palm and
3Com (Lamont and Thaler's quotes, reproduced to the cent), and in both the
case is the place the clean result looks broken and isn't. The other three
reuse one identity across two articles: `merton-model`'s
N⁻¹(Q) = N⁻¹(P) + λ√T became `credit-spread-puzzle`'s whole model, so the
second article could spend its length on data and on how uncertain the
default rate is. `binomial-pricing` found its gap by adding a branch: the real
chance drops out because the copy is exact, and a third branch is the
smallest change that breaks it. Its hook asks the reader to find the copy's
shares and loan with two sliders, which gives the lab something to do rather
than something to watch.
