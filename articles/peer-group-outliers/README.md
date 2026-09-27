# Peer groups and outliers

K-means as an outlier detector for transaction monitoring, as a field guide in
six parts: the input data, preprocessing, fitting and choosing k, scoring and
thresholds, testing the detector, and explaining an alert. One synthetic bank
(5,035 private customers, a 1% alert budget, a planted mule ring, planted
structurers and legitimate house sales) runs through every section.

Pass-1 spec: `reference/peer-group-outliers/spec.md` (project copy
`claude/peer-group-outliers-pass1-spec.md`).

## Running it

```
npm install
npm run precompute   # regenerates src/precomputed.js (a few minutes)
npm run build
npm run check        # re-derives every number in the prose
./verify/ship.sh
```

## The claims and the verdicts

The received account is written down flat in the spec (21 claims). Verdicts, in
the order the article takes them:

1. The population is a model choice: 400 dormant accounts get their own
   cluster, triple the spread of log inflow and hide the house sales.
2. Missing evidence can't be imputed back: a mule whose sender count is missing
   is never flagged, whatever the method.
3. Rarity becomes distance: a z-scored dummy of prevalence p takes √((1−p)/p).
4. Transforms, offsets, caps and scalers each decide which typology is visible.
5. Correlated, irrelevant and even well-chosen features change the alert list;
   the feature that best separates the ring hides it.
6. Inertia splits exactly into within and between; our peer groups are built on
   cash use, not on senders.
7. Seeds, k criteria and distances disagree; four k criteria give four answers.
8. A ring that acts alike buys (or drags) a centroid: split gain n·m/(n+m)·D².
9. Per-cluster quotas and normalised scores equalise clusters by construction.
10. Simple univariate rules beat every k-means setting on our planted cases, and
    AUC hides it.
11. Clusters can be stable while alerts are not.
12. Shapley values of d² with a centroid baseline are the per-feature terms.
13. Four global importance measures give four orders.

Every one is asserted in `verify/check-numbers.mjs`.

## Notes specific to this article

- The house sale is a one-off in month 1; every other planted behaviour
  persists, so the persistence section reads correctly.
- Numbers quoted "in our month" come from month 1 (profile seed 11, month seed
  101), one fit with ten restarts at seed 7. Directional claims are also checked
  across six other months in `check-numbers.mjs`.
- British spelling throughout.
