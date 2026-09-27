/*
  Fits the model once, for the whole article.

  ES modules are evaluated a single time, so every component that imports from
  here shares one ensemble and one set of explanations. Fitting 40 depth-3 trees
  on 400 rows costs well under a fifth of a second; recomputing it per component
  would not.
*/
import { trainRows, testRows, LISTINGS, FEATURES } from "./datasets.js";
import { fitEnsemble, predict, rmse, makeValueFunction, backgroundSample } from "./model.js";
import { shapleyExact } from "./shapley.js";

export const model = fitEnsemble(trainRows);
export const background = backgroundSample(trainRows, 200);

export const fit = {
  train: rmse(model, trainRows),
  heldOut: rmse(model, testRows),
  nTrain: trainRows.length,
  nTest: testRows.length,
};

function explainOne(listing) {
  const v = makeValueFunction(model, listing.x, background);
  const { phi, rows } = shapleyExact(3, v);
  return {
    ...listing,
    v,
    phi,
    rows,
    baseline: v(0),
    prediction: predict(model, listing.x),
    // Per feature: how much the credit moves depending on when the feature
    // arrives. This spread is the reason an average is needed at all.
    spread: FEATURES.map((_, i) => {
      const vals = rows.map((r) => r.marginals[i]);
      return { min: Math.min(...vals), max: Math.max(...vals) };
    }),
  };
}

export const EXPLAINED = LISTINGS.map(explainOne);
export const LARGE = EXPLAINED[0];
export const STUDIO = EXPLAINED[1];

// Formatting shared by every figure in the second half.
export const kr = (x) =>
  (x < 0 ? "−" : "") + Math.round(Math.abs(x)).toLocaleString("en-US") + " kr";
export const krSigned = (x) =>
  (x > 0 ? "+" : x < 0 ? "−" : "") + Math.round(Math.abs(x)).toLocaleString("en-US") + " kr";
export const krPlain = (x) => Math.round(x).toLocaleString("en-US");
