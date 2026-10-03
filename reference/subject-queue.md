# What to build, and what it is for

Read in pass 1, before picking a subject — and before agreeing to one that was
suggested. The shape menu says how to build an article; this says what is worth
building one about.

## The standing interest

The generator started on machine-learning methods and is not limited to them.
The subjects worth a session are the ones where **a quantitative practitioner
carries a compressed explanation that is slightly wrong**, and the error is
visible on screen. That is a property of the explanation, not of the field. In
practice it lands in four places:

- **Economics**, currently the main line — the models a quant is expected to
  have met and usually met once, at speed, in a diagram. See the queue below.
- **Finance**, a second line since 26 September 2026 — the technical side of
  markets, from the order book to quant research methods. The ordered list is
  the project doc `claude/finance-curriculum-slate.md` (69 rows, IDs `Fm`, `Fr`,
  `Fd`); 27 are published under the `finance` track in `site/articles.json`
  (3 October 2026).
  Finance theory built on economics machinery (CAPM from consumption, the term
  structure, bank runs) stays on the economics slate and is cross-linked.
- **Statistics and econometrics** — estimators with an identifying assumption
  that gets stated once and then forgotten. Difference-in-differences,
  instrumental variables, synthetic control, event studies. The **model** kind in
  `pass-1-design.md` is built for these, and they are the most natural labs in
  the catalogue.
- **Concepts and pitfalls** — Simpson's paradox, regression to the mean, multiple
  testing, Berkson's paradox, selection, where the bootstrap fails. Build both
  regimes and put the boundary on a control.
- **Papers** — a single result, usually one theorem, taken from a paper and
  simulated rather than summarised. `population-stability-index` is the model for
  this: the picture and the subtraction are the contribution, the theorem is
  cited.

Machine-learning methods are not retired, but ten of them are shipped and the
eleventh adds less than the first article in a field that has none.

## The bar, restated

Narrow and deep beats a survey, and a subject only graduates when it has a claim
that can be **proved on screen** — something the reader watches happen, that a
check asserts, and that the received account gets slightly wrong. Everything else
stops at a study note, which is the cheap tier and the one most subjects should
reach. A chapter summary with sliders on it is not an article, and a queue entry
is a candidate, not a commitment.

## Current queue: the economics curriculum

Since 16 September 2026 the queue is the whole micro and macro curriculum, from
principles to graduate prep, in reading order: 172 rows in the project doc
`economics-curriculum-slate.md`, which supersedes the CORE table below (its rows
are folded in there, marked "CORE slate"). Build in the slate's order, and treat
every "what it shows" line in it as a pass-1 hypothesis.

Shipped from it so far: `comparative-advantage` (row 1, Mi1) ✔,
`economic-rent` (row 2, Mi2) ✔, `supply-and-demand` (row 3, Mi3) ✔,
`elasticity` (row 4, Mi4) ✔, `surplus-and-efficiency` (row 5, Mi5) ✔,
`tax-incidence` (row 6, Mi6) ✔, `cost-curves` (row 7, Mi7) ✔,
`perfect-competition` (row 8, Mi8) ✔, `markup-and-elasticity` (row 9 / Mi9) ✔,
`monopolistic-competition` (row 10, Mi10) ✔,
`cartels-and-the-prisoners-dilemma` (row 11, Mi11) ✔,
`tragedy-of-the-commons` (row 12, Mi12) ✔,
`gini-and-the-lorenz-curve` (row 13, Mi13) ✔, `constrained-choice` (row 30, Mi17) ✔,
`nash-equilibrium` (row 40, Mi27) ✔, `bargaining-and-the-surplus` (row 45, Mi32) ✔,
`externalities` (row 47, Mi34) ✔, `efficiency-wages` (row 50, Mi37) ✔,
`measuring-gdp` (row 14, Ma1) ✔, `price-indices` (row 15, Ma2) ✔,
`unemployment-flows` (row 16, Ma3) ✔, `compound-growth` (row 17, Ma4) ✔ and
`money-creation` (row 18, Ma5) ✔.
**Stage 1 Microeconomics (Rows 1–13) is now fully shipped and closed.**
The spine index runs the 23 shipped rows in slate order, Part 01 through Part 23,
with connecting narrative bridges (`externalities` moved ahead of `efficiency-wages`
on 18 September to match rows 47 and 50), under the heading "The Economics
Sequence" now that it holds macro as well as micro.

### Stage 1 macro, rows 14–18 (shipped 18 September 2026)

`measuring-gdp`, `price-indices`, `unemployment-flows`, `compound-growth` and
`money-creation`, planned and built in one session from the project brief
`claude/economics-stage1-macro-brief.md` (one pass-1 spec per article beside it).
None needed real data. All five moved their slate claim, now twenty-three for
twenty-three on this line. Next in slate order is row 19, `quantity-theory`, the
first **empirical** row: it needs the `data/` provenance machinery and a shared
time-series panel, neither of which exists yet (each of these five drew its own
time axis).

### The next six (shipped 18 September 2026 — Stage 1 micro closed)

All six articles from `reference/economics-next-six/` (slate rows 7, 8, 10, 11, 12, 13)
shipped with all 77 plan-time probe assertions verified in-repo:
`cost-curves`, `perfect-competition`, `monopolistic-competition`,
`cartels-and-the-prisoners-dilemma`, `tragedy-of-the-commons`, and
`gini-and-the-lorenz-curve`.

### The next three, planned 17 September 2026

`reference/economics-next-three/` holds pass-1 specs for slate rows 3, 4 and
5 — `supply-and-demand` (Mi3), `elasticity` (Mi4) and
`surplus-and-efficiency` (Mi5) — plus `probes/plan-probes.mjs`, which
reproduces and asserts every measured number in them (50 checks, green on 17
September 2026). Build in that order: article 1 builds the shared
`MarketPanel` that article 3 imports.

These three are **backfill**. Rows 6, 7, 8 and 9 shipped ahead of them, so
each spec carries a `Non-overlap` section naming what the live downstream
article already proved, and the spine page needs six bridges rewritten rather
than three appended. The brief's README has the rest.

All three probes found a wide-range identity the slate's "what it shows" line
did not contain — the `1/R²` identification bracket, the tangent-segment
ruler, and total loss equal to the quantity cut — which is now four for four
on this line. Rewrite those three slate rows in pass 4.

### The next five, planned 16 September 2026

`reference/economics-next-five/` holds pass-1 specs for the next five
articles and a finish brief for `economic-rent`. Build in the brief's order:
`economic-rent` first (passes 2–4), then `bargaining-and-the-surplus`,
`markup-and-elasticity`, `tax-incidence`, `externalities`,
`efficiency-wages`. Rows 7 and 8 are swapped against this table's order so
that `externalities` can reuse `tax-incidence`'s wedge module — the reason is
in the brief. The verdicts in the specs were probed at plan time and must be
re-derived in each article's own pass 1.

## Off the queue: `peer-group-outliers` ✔ (planned and shipped 23 September 2026)

k-means used as a peer-group outlier detector in retail transaction
monitoring, walked through the whole pipeline on synthetic data. A deliberate
long flagship rather than a narrow article; every section still owes one
proved claim. Pass-1 spec and green plan probes in
`reference/peer-group-outliers/` (project copy:
`claude/peer-group-outliers-pass1-spec.md`). Central claim: a ring of
customers who act alike buys its own centroid, so the bigger the ring, the
less each member is flagged. Rewritten the same day, at Martin's request, as a
six-part field guide (data, preprocessing, fitting, scoring, testing,
explaining) and shipped under the machine-learning section.

## Earlier queue: CORE micro

Ten units of CORE Econ's *The Economy 2.0: Microeconomics* (2023), read as a
source rather than a syllabus. The intent is foundations for quantitative and
financial work, so the order below is not the book's: it is the order in which
each article's machinery is needed by the next one, and each article has to build
its own setup because the book is not being read alongside them.

The plan and the reasoning behind the ordering are in the project doc
`claude/core-econ-curriculum-and-slate.md`.

| # | Slug | Covers | The claim it has to prove |
|---|---|---|---|
| 1 | `constrained-choice` ✔ | U3 | Income and substitution effects cancel *identically* under Cobb–Douglas; the sign is decided by σ, not by a standoff |
| 2 | `economic-rent` ✔ | U1–U2 | Rent is the reward for being temporarily different, and competition is what destroys it and what spreads the innovation |
| 3 | `nash-equilibrium` ✔ | U4 | Your own equilibrium behaviour is built from the other player's payoffs, so raising a penalty buys less monitoring rather than less misconduct |
| 4 | `bargaining-and-the-surplus` ✔ | U5 | Nothing inside the model picks a point on the frontier — institutions do, and efficiency and fairness are independent properties of the point |
| 5 | `markup-and-elasticity` ✔ | U7 | markup = 1/\|ε\|: cost sets the floor, elasticity sets the distance above it |
| 6 | `tax-incidence` ✔ | U8 | Who writes the cheque is irrelevant; the burden lands on whichever side cannot move |
| 7 | `efficiency-wages` ✔ | U6 | The wage is an incentive device, not a clearing price — perfect monitoring collapses the construction |
| 8 | `externalities` ✔ | U10.2–10.7 | Private and social optima differ by exactly the uncounted cost; bargaining, taxing and regulating reach the same quantity and split the money differently |
| 9 | `adverse-selection` | U10.8–10.11 | Asymmetric information alone unravels a market — the failure is informational, not moral |
| 10 | `discount-rates` | U9 | The interest rate is a relative price between two dates, and wealth decides whether you face it at all |

Off the spine, worth building on its own merits: **`gini-and-the-lorenz-curve`**
(U5.12) — the same Gini comes from very different distributions, and the
credit-scoring Gini (2·AUC − 1) is a different construction inheriting the same
blindness.

Unit 1 gets a study note and no article: its content is data and narrative with
no mechanism under it.

### Two things this queue owes itself

- **A spine page.** ✔ Built under `site/` (`scripts/render-index.py` and `site/articles.json`) as an ordered index connecting consecutive articles with two-sentence bridges explaining what the last one established and what the next one needs.
- **The shared setup component.** `constrained-choice`, `bargaining-and-the-surplus`,
  `tax-incidence`, `externalities` and `discount-rates` all draw a feasible
  frontier with an indifference or isoprofit family and a tangency marker. It is
  built in `constrained-choice`; lift it rather than rewriting it, and keep the
  axes and the parameters recognisable between articles so a reader who learned
  the diagram once is not relearning it.

## Handing a source over

Book chapters, papers and lecture notes go in `sources/` and never ship. Run
`/read-source` first — it costs one session and it decides whether there is an
article at all. `device_bash` cannot render a PDF, so stage the file into the
container to read it.

## Keeping this file honest

Tick a slug here when its `site/articles.json` entry is added, in pass 4, at the
same time as the shape-table row. A queue that still lists a shipped article as
pending is the kind of stale fact that made the last restructure necessary.
