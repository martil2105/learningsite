# K-means as an outlier detector: a field guide

**Pass-1 spec, rewritten 23 September 2026.** Slug `peer-group-outliers`. Kind:
**method**. Stack: Svelte 5 + Vite from `articles/_scaffold-svelte5/`.

**What changed from the first plan.** Martin asked for a reference, not a story:
everything about the input data, every preprocessing choice (imputation,
capping, cut-offs, correlation, standardisation, feature importance), the tests
you can run on k-means *as a detector* (inertia, distances, how similar the
clusters are, stability), and explainability at the end. So the shape is now a
**field guide in six parts**, held together by one synthetic bank that every
section tests on. The ring that buys a centroid stays as the central lab, but it
is one part of six rather than the spine.

**The rule it keeps.** Every subsection proves one claim on screen, from the
running case, and every number is re-derived by `check-numbers.mjs`. A
subsection that can't name its claim gets cut. This is deliberately far longer
than the house article; the page needs a sticky part navigation so a reader can
use it as a reference.

**Everything is synthetic.** Generic retail segments and textbook typologies.
Nothing about any real bank's features, thresholds, segments or volumes.

**Non-overlap.** `k-means` owns Lloyd's algorithm, initialisation and "the
silhouette names a k even on noise"; this article links there. `isolation-forest`,
`dbscan-hdbscan`, `shapley-values` and `population-stability-index` are linked
where they are the alternative, the explainer or the monitor.

**Where the numbers come from.** Probe scripts `probes/p10.mjs` to `p17.mjs`
(plus the first plan's `plan-probes.mjs`), run 23 September 2026, full output in
`probes/probe-output-2026-09-23.txt`. **SINGLE** marks a one-draw number: it must
become a seed average (or be presented as "in this month's data") before it
reaches prose.

## The running case

One synthetic bank, one month, **5,035 private customers**, an alert budget of
**1% = 50 alerts**. Five everyday segments (students 15%, salaried 50%,
pensioners 20%, high earners 10%, self-employed 5%) and three planted groups:

- a **mule ring** of 20: many different senders (about 22 a month), money
  straight through, 60% sent abroad;
- **10 structurers**: salaried-looking, plus a steady ~38,000 in cash a month;
- **5 house sales**: legitimate, a one-off ~3.5M inflow. **Change for the
  build:** the probe generator repeats the sale every month; the article's data
  module must make it one-off (month 1 only), which changes only the persistence
  numbers in 5.6.

Six monthly features: inflow, outflow, transaction count, cash in, international
out, distinct senders. Each customer has a persistent profile; each month is a
noisy draw from it.

## Shape, hook, interactions

- **Shape: field guide.** Intro (the case), then six parts in pipeline order:
  **I The input data, II Preprocessing, III Fitting and choosing k, IV Scoring
  and thresholds, V Testing the detector, VI Explaining an alert**, then "What
  this costs you" and the conclusion. The case-first opening earns the rest:
  each subsection is a question our bank raises at one stage.
- **One reusable readout carries the whole page: `CatchStrip`.** Three chips,
  ring x/20, structurers x/10, house sales x/5, plus "others" out of the 50
  alerts. Every toggle in the article updates one, so a reader learns to read it
  once. This is what makes forty subsections feel like one article.
- **Primary hook: `RingLab`** (Part IV). 2-D (log inflow × log senders),
  k-means live in the browser, sliders for ring size and k, a resample button.
- **Small interactions** (each with a check in `check-browser.mjs`):
  `FeatureShape` (feature picker, raw/log toggle), `ScopeToggle` (dormant
  accounts in/out), `ImputeToggle`, `CategoryToggle`, `TransformLab` (transform
  + log offset + cap level, one at a time), `ScalerToggle`, `CorrMatrix`
  (hover), `NoiseSlider`, `KCriteria` (k slider across five criteria and the
  catch strip), `SeedStrip` (40 seeds as dots, nInit toggle), `DistanceToggle`,
  `RuleToggle`, `DoseChart` (amount slider), `BenchmarkTable`, `AriMatrix`,
  `MonthStepper`, `MarginDeciles`, `WhyThisCustomer` (pick an alert: bars of
  d² terms, Shapley toggle, counterfactual), `SurrogateTree` (depth slider).
- Heavy numbers are precomputed from the same modules (`scripts/precompute.mjs`
  → `src/precomputed.js`, freshness asserted first in `check-numbers.mjs`); the
  RingLab, the catch strips for single fits and the explainer panel stay live.

## The received account, flat enough to be wrong

Data
1. Monthly aggregates per customer are a neutral summary of behaviour; who is in
   the population is a data question, not a model question.
2. Missing values are a nuisance: impute with the median and move on.
3. Categorical attributes can be one-hot encoded and standardised like the rest.
4. A longer aggregation window only smooths.

Preprocessing
5. Standardise and every feature counts equally.
6. Log-transform skewed amounts; cap outliers at the 99th percentile. Both are
   housekeeping.
7. Robust scaling (median/IQR) is the safer choice for heavy tails.
8. Correlated features are harmless, and PCA keeping 90% of the variance keeps
   the signal.
9. Extra features can only add information; a feature that separates the
   suspicious group helps.

Fitting and k
10. Inertia tells you how good the clustering is; the elbow, silhouette and
    similar indices find the right k.
11. k-means++ with a fixed seed is deterministic enough.

Scoring
12. Distance to the centroid is a suspicion score; coordinated activity deviates
    from peers, so a ring will be surfaced.
13. The distance metric is a detail; Mahalanobis is strictly better.
14. Under a Gaussian cluster, d² is chi-square, which gives a principled cut-off.
15. Flagging the top p% per peer group keeps alerting fair.

Testing
16. Stable clusters (bootstrap, refit) mean a stable detector.
17. A high AUC against planted cases means the detector works.
18. k-means beats simple univariate rules because it sees combinations.

Explaining
19. Explaining an alert needs SHAP or similar machinery.
20. The peer average shown to an investigator is the cluster mean.
21. One global feature-importance ranking describes the model.

## Part I: the input data

**I.1 What a row is, and who is in the table.** A row is one customer-month.
*Claim 1 is false: the population is a model choice.* Adding 400 dormant accounts
(7.4%) makes one cluster of exactly those 400, triples the spread of log inflow
(sd 0.689 → 2.389, ×3.47), and the five house sales go from 5/5 flagged to 0/5 at
k = 3 and k = 5 (SINGLE). Interaction: `ScopeToggle` with the catch strip.

**I.2 The shape of each feature.** Raw inflow: skew 25.7, kurtosis 783, mean
51,437 against a median of 38,346; the five house sales hold **84.9%** of the
inflow sum of squares and the top 50 customers 89.9%; the median customer's raw
z-score is **−0.125**. After log1p the skew is 0.29. Zero-inflation: cash is
zero for 89.1% of customers and international transfers for 84.7%; senders has
only 30 distinct values. Interaction: `FeatureShape` (feature picker, raw/log).
These three facts set up every later section: tails decide scaling, zeros
decide clusters, discreteness decides ties.

**I.3 The aggregation window.** One month versus a three-month average. Alert
overlap between consecutive, non-overlapping periods: 0.47–0.67 for one month,
0.67 for three at k = 3, 5, 8. Ring caught at k = 5: 13 → 18 (SINGLE). A rolling
three-month window shifted by one month overlaps 0.75–0.85, but two thirds of
its data are shared, so that stability is partly bookkeeping. *Claim 4 is only
half true: the window changes what the model sees, not just its noise.*

**I.4 Missing values and imputation.** Senders missing for 15.1% of customers
(MCAR), then a "legacy system" mechanism that also holds half the ring. **A mule
whose sender count is missing was never flagged under any method** (median,
mean, zero, missing-indicator, drop): 0 of 3 under MCAR, 0 of 10 under the
legacy mechanism, where the ring's recall halves (17 → 10 at k = 3). The
typology's evidence *is* the missing feature, and imputation replaces evidence
with an ordinary value. Exact identities: mean-imputing a fraction q shrinks the
feature's sd by exactly √(1 − q) (0.921550 both ways at q = 15.1%), so after
re-standardising every observed customer's z on that feature grows by
1/√(1 − q); dropping incomplete rows means they are never scored. Zero and
indicator imputation also cost ring recall at higher k (15 → 10–11 at k = 5).
Interaction: `ImputeToggle` (method × mechanism).

**I.5 Categorical attributes.** A random "foreign address" flag held by 2.72%,
unrelated to risk, one-hot and z-scored: holders get **+5.98**, everyone else
−0.17. At every k it gets its own cluster of exactly its 137 holders, takes 4, 9
and 12 of the 50 alerts at k = 3, 5, 8, and changes 44–46% of the alert list
(J 0.54–0.56). Exact: a z-scored dummy of prevalence p takes √((1−p)/p); the
squared distance between customers in two different categories a and b is
1/(p_a(1−p_a)) + 1/(p_b(1−p_b)), so with shares 60/31/7/2% the pairs cost 8.86,
54.55 and 65.00 against a flat 2 unscaled. *Rarity becomes distance.*
Interaction: `CategoryToggle`.

**I.6 Data quality: own-account transfers and seasons.** 5.4% of customers
moving savings through the account take only 2–4 of 50 alerts in log space; an
honest "smaller than feared here", with the reason (log compresses a
proportional bump). December, everyone's flows ×1.3: a frozen model's alert list
overlaps the normal month's at J 0.79–0.82 and tilts toward high earners (11 → 17
at k = 3); a refit gives J 1.00, because log + z-score absorbs a uniform
multiplicative shift. The same property absorbs a real bank-wide change, which
is the argument for monitoring the frozen scaling (link to
`population-stability-index`).

## Part II: preprocessing

**II.1 Transforms decide which typology you can see.** Table at k = 3, 50 alerts
(SINGLE): raw z catches ring 14, structurers 9, sales 1; winsorised z 20/0/0;
log z 20/0/5. Alert lists across four transforms overlap at J 0.15–0.37 (k = 5).
Exact: log1p gap from 0 to 3,000 is 8.007 and from 3,000 to 38,000 is 2.539, so
*any* cash is three times as unusual as thirteen times more cash. **The offset is
a hidden hyperparameter:** under log(x + c) the gap is ln(1 + x/c) exactly;
c = 1: structurers 0/10; c = 10,000: **10/10** at k = 3 (ring 13). Dose-response
(V.1) makes this vivid: under log1p no structurer is flagged even at 160,000 a
month. Interaction: `TransformLab` step 1.

**II.2 Capping and cut-offs.** Sweep 99.9/99.5/99/97.5/95. Raw data, k = 3: a
99.9% cap lets all 5 house sales be flagged (they no longer buy a centroid) and
keeps 9 structurers; at 99.5% and tighter the structurers and sales vanish
(capped into ties: 26, 51, 126, 252 customers at the cash cap), and at 95% the
ring goes too (3). At k = 5, a 99% cap takes the ring from 13 to 0. Exact: every
customer above a cap is tied, so a typology rarer than the cap's tail is
unrecoverable. A mean + 3 sd cap is **set by the outliers it is meant to cap**:
365,168 with the five sales, 169,894 without (10 vs 113 customers above).
Percentile caps commute with any monotone transform (to 1e-5 with interpolated
quantiles, exactly with order statistics); "z-score then clip at 3" and "clip
at mean + 3 sd then z-score" differ by up to 4.78 sd. Interaction:
`TransformLab` step 2.

**II.3 Scaling.** Every z-scored column contributes exactly N to the total sum of
squares, so k = 1 inertia is exactly N·p = 30,210: "equal weight" means equal
variance, nothing more. Robust scaling: the IQR of cash and international out is
**0** (most values are zero); scikit-learn's RobustScaler then uses 1, which
leaves those two features in kroner and lets them swamp everything: raw robust
at k = 3 catches ring 0, structurers 10. Min-max: 99% of customers sit inside the
first 5.9% of the inflow axis, because the house sale sets the maximum. Log +
min-max: ring 7 at k = 3. Interaction: `ScalerToggle`.

**II.4 Correlation and implicit weights.** Log inflow and log outflow correlate
at 0.9883; eigenvalues 2.329, 1.133, 1.020, 0.885, 0.621, **0.012**;
participation ratio 4.04 effective features of 6. Duplicating one feature
changes 28–48% of the alert list (J 0.52–0.72). "Money volume" is counted twice
by default. Interaction: `CorrMatrix` with a "duplicate this feature" click.

**II.5 PCA and whitening.** Keeping 4 components (89.5% of variance) cuts the
ring from 13 to 6 at k = 5 and 12 to 6 at k = 8; 18.9% of the ring's offset lives
in PC5, which a 90% rule is likely to drop. Structurers live 87.2% in PC3.
Whitening (global Mahalanobis) amplifies the 0.012-variance direction, which is
inflow minus outflow, so its alerts have twice the population's pass-through
deviation (0.159 vs 0.074). *Claim 8 is false: variance is not signal.*

**II.6 Irrelevant features.** Adding 0/2/5/10/20 pure-noise columns: the
distance contrast (99th percentile over median) falls 2.90 → 2.18 → 1.81 →
1.58 → 1.41 at k = 3, and ring recall at k = 5 falls 13 → 4. Interaction:
`NoiseSlider`.

**II.7 Engineered features: the helpful feature that hurts.** The ring sends 60%
of inflow abroad; only 28 ordinary customers reach that ratio. Adding it as a
feature took ring recall **from 13 to 3 at k = 5** and 12 → 3 at k = 8 (18 at
k = 3): the new feature makes the ring cheap to explain, and it drags a centroid
(all 20 share a cluster of 168). This is Part IV's mechanism arriving early, and
the section says so. *Claim 9 is false in the most useful way.*

**II.8 Order of operations and fit/apply.** Fit every transform on the
reference month and apply it to the scoring month; state the order (impute →
cap → transform → scale) and show the two orders that do and don't commute.

## Part III: fitting and choosing k

**III.1 What inertia is, and what it splits into.** Total = within + between,
exactly (residual 6.5e-11 on 30,210), per feature. Per-feature R² at k = 5:
cash 0.958, international 0.816, outflow 0.551, inflow 0.545, transactions
0.364, **senders 0.154**. *Our peer groups are "uses cash / sends abroad", and
barely know about senders, which is the ring's feature.* Interaction: bars per
feature, k slider.

**III.2 Who owns the inertia.** At k = 1 under raw z the five house sales hold
20.3% of total inertia and the top 50 customers 41.3%; under log z, 1.1% and
5.6%. A centroid goes where the inertia is.

**III.3 Seeds and restarts.** 40 seeds each. nInit = 1 at k = 8: 37 distinct
local optima, worst inertia 15.6% above best, ring caught anywhere from 0 to 20,
alert overlap between seeds mean 0.60 and minimum 0.18. nInit = 10 fixes k = 5
(one answer, J 1.00) but not k = 10 (ring 0–17, J min 0.35). *The seed is a model
parameter: fix it, record it, and test over it.* Interaction: `SeedStrip`.

**III.4 Choosing k.** k = 1…12: elbow (largest second difference at k = 2, next
k = 4), Calinski–Harabasz picks 4, Davies–Bouldin 7, silhouette 4 (0.317), the
gap statistic 1. Detection: k = 1 catches 12 of the ring, k = 3 all 20, k = 4
12, k = 10–12 0–1. Four criteria, four answers, and none of them is asking our
question. Interaction: `KCriteria`.

## Part IV: scoring and thresholds

**IV.1 The ring buys a centroid (primary hook).** At k = 8 (log z, six features,
12 seeds): lone mule flagged 100%, ring of 20 76%, ring of 40 23%; k = 12, ring
of 20: 10%. Exact split gain n·m/(n+m)·D² (to 1e-15). Rough price of a centroid
m* ≈ ΔI(k)/D²: ~49 at k = 8, ~23 at k = 12; the ring owns a centroid in 67% of
seeds at m = 80, k = 8 and 58% at m = 40, k = 12. Two masking modes, buy and drag.
2-D lab agrees: ring of 40 flagged 16–22% at k = 5–12. Same mechanism: raw z
gives the house sales their own cluster of exactly 5 at k = 3, 5, 8, 12. The
m* heuristic is the one number here that is not an identity; present it as a
rule of thumb or tighten it (include the ring's own spread, 0.494 per member).

**IV.2 Four ways to turn distance into alerts.** Global top 1%, per-cluster top
1%, normalised distance (d / cluster RMS), small clusters. Exact: per-cluster
gives cluster j `ceil(p·n_j)` alerts whatever it holds; normalised score has mean
square exactly 1 in every cluster, so a cluster that *is* the ring looks as
normal as the salaried one. At k = 5 and 8 per-cluster and normalised catch 3 and
1 of the ring against global's 13 and 12. Global sends alerts to wide segments:
self-employed 5.1% → 36% of alerts, high earners 10.0% → 26%, salaried 51.1% →
0%. The small-cluster rule (size < 1%) flagged nobody. Interaction:
`RuleToggle`.

**IV.3 Distances on the same clustering.** Euclidean, Manhattan, Chebyshev,
cosine, global Mahalanobis, per-cluster Mahalanobis. Overlap with Euclidean:
Manhattan 0.41–0.54, Chebyshev 0.47–0.59, global Mahalanobis 0.54–0.64, cosine
0.00–0.08. Chebyshev catches all 20 of the ring at k = 5 (the most extreme
*single* feature). Exact: cosine(x, 10x) = 1, so cosine can't see volume at all.
**Per-cluster Mahalanobis is undefined for 48–65% of customers**, because
clusters built on "no cash" have a constant cash column and a singular
covariance; raw z adds a cluster of 5 in 6 dimensions. Interaction:
`DistanceToggle`.

**IV.4 Is there a principled cut-off?** Scaling d² by each cluster's per-dimension
variance and cutting at the chi-square(6) 99th percentile (16.812) flags 4.8–5.8%
of customers, not 1%; full per-cluster covariance, where defined, 3.0–3.9%.
Heavy tails break the textbook calibration, so the budget is set by capacity,
not theory.

**IV.5 The budget and what sits below it.** Above/below-the-line sampling.
Exact: zero findings in 2,995 sampled below-the-line cases bound the miss rate at
0.1% with 95% confidence (rule of three: ≈ 3/n).

## Part V: testing the detector

**V.1 Planted-typology tests and dose-response.** Ring size × k grid (from IV.1).
Structurer cash per month, k = 3: raw z catches 5/10 at 20,000 and 9–10 above;
log(x + 10,000) 8 at 20,000 and 10 above; rank 4–6; **log1p: 0 at every amount
up to 160,000**. Ring senders per month: k = 3 needs about 15 to catch 11, k = 8
needs about 30 for 14. Interaction: `DoseChart`.

**V.2 Benchmarks you have to beat.** Top-50 catches and AUCs, log z: univariate
max |z| rules **ring 20, structurers 9, sales 5**, beating every k-means
setting; global Mahalanobis 19/0/5; k-means k = 1 12/0/5 and k = 3 20/0/5; kNN
distance k = 5 **0**/0/5 (the same masking: five neighbours inside a ring of 20),
k = 30 9/0/5; isolation forest 14/0/0. Clustering *hurts* the structurers'
ranking: AUC 0.951 at k = 1, 0.617 at k = 3, because the clusters are built on
cash use. AUC for the ring is 0.99+ everywhere while top-50 catch ranges from 0
to 20: **AUC is the wrong yardstick for a 1% budget.** Interaction:
`BenchmarkTable`.

**V.3 How similar are two sets of peer groups?** ARI/NMI between five
preprocessing choices at k = 5: 0.11–0.69 ARI. Label IDs are arbitrary: ARI of a
relabelling is exactly 1. Interaction: `AriMatrix`.

**V.4 Are the clusters stable?** Hennig's clusterwise bootstrap Jaccard, 30
resamples: every cluster at k = 3, 5, 8 scores 0.73–0.99, "stable" by the usual
reading (≥ 0.75, one at 0.73). The detector at the same k is not (III.3, V.5).
*Claim 16 is false: cluster stability and alert stability are different
properties, and a validation must test the second.*

**V.5 Next month.** Refit: raw label agreement 15.8%, 56.1%, 5.2% (k = 3, 5, 8)
against 95.0%, 88.8%, 79.3% after Hungarian matching; ARI 0.825 → 0.731 → 0.580.
Who switches peer group: 45.1% of the lowest assignment-margin decile, 0.4% of
the highest (11.0% overall). Whole-population score Spearman 0.69–0.80 while the
top-1% overlap is 0.45–0.67. Frozen vs refit churn differs by at most 0.06: the
churn is behaviour at the threshold. Interaction: `MonthStepper`, `MarginDeciles`.

**V.6 Persistence.** Alerted in at least two of three months (frozen model): at
k = 3 all 23 once-only alerts are ordinary customers and the whole ring
persists. (Re-derive after making the house sale one-off.)

**V.7 Remedies for masking.** 12 seeds, log z. k-means-- (Chawla & Gionis 2013)
with l = 50: ring of 20 at k = 12 goes 0.10 → 0.65; ring of 40 at k = 8 0.23 →
0.66. Trim-and-refit (drop the top 2%, refit, rescore everyone) helps less
(0.18, 0.42).

**V.8 The validation checklist.** A table the reader can expand: test → what it
catches → which section shows it. Conceptual soundness (features ↔ typologies,
I.4, II.7), population scope (I.1), preprocessing sensitivity grid (II), seed
and k sensitivity (III), score and distance choice (IV), planted typologies and
dose-response (V.1), benchmarks (V.2), cluster and alert stability (V.3–V.5),
persistence (V.6), below-the-line sampling (IV.5), explainability (VI),
ongoing monitoring (PSI on features and cluster sizes; centroid drift).

## Part VI: explaining an alert

**VI.1 Why this customer.** d² splits exactly into per-feature terms. Among the
50 alerts at k = 5, senders is the top reason for 26, inflow 8, cash 7,
international 5, outflow 3, transactions 1; 30/50 have one feature above half of
d², 15/50 above 80%. Interaction: `WhyThisCustomer`.

**VI.2 Shapley values are the terms.** With the centroid as baseline and the
assignment held fixed, the exact Shapley value of each feature equals its d²
term (max gap 2.5e-14 over 50 alerts), so SHAP adds nothing. If the value
function re-assigns to the nearest centroid, Shapley differs for 12/50 alerts and
the top reason changes for 2. *Claim 19 is false for d², true for anything
nonlinear on top of it.*

**VI.3 The peer average is not an average.** Back-transforming a log-space
centroid gives a geometric-type mean: the arithmetic mean inflow of each peer
group is 1.05–1.26× what the back-transformed centroid says. Show both on the
investigator card, labelled.

**VI.4 Counterfactuals.** Moving straight toward the centroid, an alert clears
the threshold at t/d of its distance (between 51.5% and 100% here). 44/50 alerts
could be cleared by changing one feature alone (condition: term_j ≥ d² − t²,
exact). The example ring member would need 22.8 senders instead of 41 (peer
centroid 2.3).

**VI.5 Why this peer group.** Nearest centroid and the margin to the second
(links V.5). A surrogate decision tree on original units reproduces the k = 5
groups with fidelity 55.9%, 72.3%, 82.4%, 87.2%, 91.0% at depths 1–5; at depth 2
one of the five groups never appears. Interaction: `SurrogateTree`.

**VI.6 Global feature importance: four measures, four orders.** Segmentation R²:
cash > international > outflow > inflow > transactions > senders. Mean share of
alert d²: senders > inflow > outflow > international > cash > transactions.
Permutation (1 − J of alerts): senders > cash > outflow > inflow >
international > transactions. Drop-column refit: international = senders > cash
> inflow > outflow > transactions. *Claim 21 is false; say which question each
answers.*

## What this costs you (the fair case)

First, what k-means is good at here: cheap, deterministic once seeded,
explainable exactly per feature, and peer-relative in a way a fixed rule isn't.
Then: it rewards groups that act alike; every preprocessing step is a weight
you chose; clusters form on zero-inflation rather than behaviour; no time
dimension; segments can proxy for age; it needs benchmarks it may lose to.

## Into `check-numbers.mjs`

Every number above, re-derived from the article's own `src/` modules with the
same seeds; SINGLE numbers turned into seed averages or explicitly framed as
"this month". Identities at machine precision: split gain, Huygens
decomposition, N·p, mean square one, ceil(p·n_j), √(1−q), dummy value and
category distance, log gap ln(1+x/c), Shapley = terms, t/d, single-feature
condition, cosine(x, λx) = 1, ARI relabelling = 1, rule of three. Direction
claims asserted as directions (recall non-increasing in ring size, contrast
falling with noise, etc.).

## References to cite

- Lloyd (1982), *IEEE Trans. Inf. Theory* 28(2); Arthur & Vassilvitskii (2007), k-means++, SODA.
- Ward (1963), *JASA* 58: the merge cost / split gain.
- Chawla & Gionis (2013), *k-means--*, SIAM SDM.
- Bolton & Hand (2001), unsupervised profiling and peer group analysis.
- Calinski & Harabasz (1974); Davies & Bouldin (1979); Rousseeuw (1987) silhouette; Tibshirani, Walther & Hastie (2001) gap statistic.
- Hubert & Arabie (1985) ARI; Hennig (2007) clusterwise stability, *CSDA* 52.
- Liu, Ting & Zhou (2008), isolation forest.
- Hanley & Lippman-Hand (1983), rule of three.
- Lundberg & Lee (2017), SHAP.
- SR 11-7 (2011) for validation vocabulary.
