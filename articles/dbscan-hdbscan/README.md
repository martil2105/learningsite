# DBSCAN & HDBSCAN

A day of GPS pings. The stops are the clusters, the walking in between is the
noise, both axes are metres, and nothing is standardised — so `eps` is a
distance about the world rather than about a preprocessing step.

## The standard telling, written down flatly enough to be wrong

1. DBSCAN does not make you say how many clusters there are. You give it `eps`
   and `minPts` instead, and it finds however many are in the data.
2. To choose `eps`, sort the k-nearest-neighbour distances and read it off the
   elbow.
3. DBSCAN's weakness is clusters of differing density: one global `eps` cannot
   suit a dense cluster and a sparse one at once, so you trade one off against
   the other.
4. HDBSCAN fixes that by running DBSCAN at every `eps` at once and keeping
   whichever clusters persist longest, so you no longer have to pick `eps` —
   only `min_cluster_size`.
5. Mutual reachability distance is a smoothing trick that makes it more robust
   to noise.
6. Density methods find clusters of arbitrary shape, which is why they beat
   k-means.
7. (Unstated, and universally assumed.) DBSCAN is deterministic.

## What the probes found

Everything below is re-derived in `verify/check-numbers.mjs` from the same
modules the page imports.

**3 is the important one, and it is wrong in the way that matters.** It is not
a trade-off. On `cafe-bakery-park`, at minPts = 8, the café and the bakery
merge into one cluster at eps = 6.40 m, and the park does not hold together
until eps = 9.96 m. The window is not narrow; it is missing, by 3.56 m. Raising
minPts makes it worse, not better — the gap runs 0.83 m at minPts = 4 to 9.99 m
at minPts = 20 — and border points do not rescue it either: classic DBSCAN, on
a 10 cm grid over eps ∈ [1, 40] m and every minPts from 3 to 30, never recovers
all three stops. Enumerating every distinct answer the eps knob can produce:
**367 clusterings, none of them right.** The comparison cases behave: platforms
gives 53 right answers out of 302, a whole day 52 out of 522.

**2 is true for a reason nobody states, and it fails where it is needed.** The
elbow lands inside the working window 8 times out of the 14 (dataset, minPts)
combinations where a window exists — 7 out of 7 on the easy dataset and 1 out
of 7 on the realistic one. Across 48 combinations it lands between the 70th and
the 92nd percentile of the sorted curve, median 86th, sd 3.9 points: the
"elbow" is a high percentile in disguise, which is roughly a property of the
shape of any sorted distance curve rather than of this data's clusters. And its
far endpoint is one order statistic — adding a single stray ping to the
platforms data moves the recommendation from 8.27 m to 14.45 m.

**4 is mechanically true and the framing is backwards.** HDBSCAN's move is not
adaptive density, it is a change in the shape of the answer: from a partition
to a tree, cut branch by branch. And `min_cluster_size` is not "no parameter" —
it is a parameter in units of *points*, which is why it is easier. Measured on
a plausible search range, with the neighbour count held at 8 on both sides so
exactly one thing varies in each: `eps` ∈ [2, 40] m works over 12.3% / 0.0% /
26.4% of its range; `min_cluster_size` ∈ [5, 60] works over 100% / 98.2% /
96.4% of its. Leave `min_samples` coupled to `min_cluster_size` as the library
does by default and it drops to 42.9% / 37.5% / 85.7% — still never empty, and
worth knowing the coupling costs something.

**1 is a shell game, quantified.** The eps knob has 302 / 367 / 522 distinct
settings on these three datasets, and the cluster count it produces peaks at
13, 5 and 12.

**5 is understated.** Mutual reachability is not smoothing. On `whole-day` it
does not change the best answer at all — single linkage and mutual
reachability both recover 5/5 — but the window in eps goes 6.24 m (plain) →
10.05 m (m = 8) → 13.72 m (m = 16). It buys width, not accuracy. The mechanism
is visible in the core distances: median 8th-nearest-neighbour distance is
3.8 m inside the stops and 13.7 m along the walking routes, so a ping logged
mid-stride is pushed 3.63× further from everything before anything can chain
through it.

**6 is true and the limit is much sharper than anyone says.** k-means with
k = 2 on the two platforms scores ARI −0.003 and cuts platform 1 into 73 / 77
along its length; DBSCAN* scores 0.968. But the honest counterweight is that a
density method can only ever find things separated by a density valley. An
equal mixture of two isotropic Gaussians is unimodal exactly below 2σ
separation. Above that a second mode exists — and it is still not findable: at
3σ the Bayes-optimal split scores ARI 0.705 and the best density clustering
over every (eps, minPts) scores 0.123. The two do not come within a tenth of
each other until 5.2σ. **The mode exists long before it is findable, and the
gap is 3.2σ wide.**

**7 is false.** Border points join whichever cluster reaches them first. On the
platforms data at eps = 5.25 m, 24 random row orders produce 8 distinct
partitions and 32 pings change cluster (97 of the 324 are border pings there). This is exactly why HDBSCAN is built on
DBSCAN*, in which non-core points are simply noise.

## Two identities, held to machine precision

- **The whole eps sweep is one tree.** Brute-force DBSCAN* agrees with
  thresholding the mutual-reachability MST at every eps the sweep can
  distinguish: 3581 thresholds across 3 datasets × 3 minPts, 0 disagreements.
- **The window has a closed form.** Its edges are the eps at which the loosest
  stop coheres and the eps at which the two closest stops merge — one side
  enumerated from every distinct clustering, the other read off two single
  thresholds. Exact agreement, 39 of 39 (day, minPts) combinations.
- **Stability is measured in points per metre.** Scale a dataset by s and every
  condensed-cluster stability scales by exactly 1/s (worst relative error
  1.2e-14 at s = 7.25). The practical consequence: put two identical clusters
  side by side and shrink one by half, and the shrunken one is 2.01× as stable
  — the criterion systematically prefers the denser candidate, in an algorithm
  whose selling point is coping with differing density.

## Shape

**Question first, then a lab, then a structural argument.** The reader has to
be holding one thing before the tree means anything: that no eps works, and
that this is not a tuning failure. So the hook is the eps slider, and the
article's spine is the sentence *a single eps is a horizontal line drawn across
a tree*. Not the default lab-then-maths-then-scrolly shape the last seven
articles used; the scrollytelling here carries the mechanism walkthrough, and
the payoff is a second and third manipulable object — the draggable cut on the
dendrogram, and the condensed tree.

## What verification changed

- The elbow's hit rate went from "8 of 14" on a seven-value minPts grid to
  **12 of 26** on the thirteen-value grid the checks use — and the split is the
  point: 9 of 13 on the easy day, 3 of 13 on the realistic one.
- The `min_cluster_size` comparison was originally measured with
  `min_samples` coupled to it, which is the library default but is not a
  comparison of one parameter against one parameter. Holding the neighbour
  count at 8 on both sides moved the result from "three times more forgiving"
  to "effectively the whole range", and the coupled figures became a paragraph
  of their own.
- Two claims lost a decimal to the checks: "5.5σ" became 5.2σ and "about 3σ
  wide" became 3.2σ, both now rendered from the sweep rather than typed.

## Bugs the pictures caught that no assertion did

- The cluster regions were drawn as one circle subpath per core ping with a
  nonzero fill rule. The FILL was a correct union; the STROKE drew all five
  hundred circles, so the figure was a scribble with the answer underneath it.
  There is no way to stroke the boundary of a union of subpaths in SVG, so the
  outline is now a marching-squares contour of the stamped distance field.
- On a phone the walkthrough's sticky chart was laid out *after* the steps
  (`flex-direction: column-reverse`), so it sat below the viewport for the
  whole section and only appeared at the very end. Five screens of prose about
  a picture the reader could not see. `check-browser.mjs` now asserts the chart
  is on screen at four points through the section.
- A centred "300 m" tick on the right edge of the plot box hung seven pixels
  past its svg, and two row labels in the verdict figure sat eighty pixels
  outside theirs on mobile.
