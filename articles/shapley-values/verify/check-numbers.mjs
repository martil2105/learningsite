/*
  Every numeric claim this article makes, checked from the same modules the
  page imports. Run it after any change to the data, the model or the game:

      node verify/check-numbers.mjs

  It exits non-zero if anything it asserts stops being true.
*/
import { shapleyExact, shapleyByWeights, efficiencyGap } from "../src/shapley.js";
import { PRESETS } from "../src/game.js";
import { BIG_N, bigValue, BIG_TRUTH } from "../src/bigGame.js";
import { LARGE, STUDIO, EXPLAINED, fit } from "../src/explain.js";
import { NOISE_SD, FEATURES } from "../src/datasets.js";

let failures = 0;
const ok = (label, condition, detail = "") => {
  console.log((condition ? "  PASS  " : "  FAIL  ") + label + (detail ? "   " + detail : ""));
  if (!condition) failures++;
};
const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
const n0 = (x) => Math.round(x).toLocaleString("en-US");

console.log("\n--- the three-player game: each preset teaches what it claims ---");
const EXPECTED = {
  consultancy: [40, 55, 25],
  freerider: [30, 45, 0],
  twins: [35, 35, 20],
  unanimity: [40, 40, 40],
};
for (const p of PRESETS) {
  const v = (m) => p.payoffs[m];
  const { phi } = shapleyExact(3, v);
  const want = EXPECTED[p.key];
  ok(p.key.padEnd(12) + " phi = " + phi.map((x) => x.toFixed(0)).join(" / "),
     phi.every((x, i) => close(x, want[i])), "expected " + want.join(" / "));
  ok(p.key.padEnd(12) + " efficiency", close(efficiencyGap(phi, 3, v), 0, 1e-9));
  ok(p.key.padEnd(12) + " enumeration == closed form",
     shapleyByWeights(3, v).every((x, i) => close(x, phi[i], 1e-9)));
}
ok("null player is paid exactly zero", close(shapleyExact(3, (m) => PRESETS[1].payoffs[m]).phi[2], 0));
{
  const phi = shapleyExact(3, (m) => PRESETS[2].payoffs[m]).phi;
  ok("interchangeable players are paid the same", close(phi[0], phi[1]));
}

console.log("\n--- the eight-player game: closed form against the analytic answer ---");
{
  const exact = shapleyByWeights(BIG_N, bigValue);
  ok("matches a + (1/2) sum of synergies",
     exact.every((x, i) => close(x, BIG_TRUTH[i], 1e-9)));
  ok("efficiency", close(exact.reduce((a, b) => a + b, 0), bigValue((1 << BIG_N) - 1), 1e-9));
}

console.log("\n--- the model and its explanations ---");
ok("held-out RMSE is above the noise floor, as it must be",
   fit.heldOut > NOISE_SD, n0(fit.heldOut) + " kr vs " + NOISE_SD);
ok("held-out RMSE is not absurdly worse than the floor",
   fit.heldOut < NOISE_SD * 1.6, n0(fit.heldOut) + " kr");
for (const e of EXPLAINED) {
  ok(e.label.padEnd(15) + " v(all) equals the prediction", close(e.v(7), e.prediction, 1e-6));
  ok(e.label.padEnd(15) + " bars close on the prediction",
     close(e.phi.reduce((a, b) => a + b, 0), e.prediction - e.baseline, 1e-6));
  ok(e.label.padEnd(15) + " enumeration == closed form",
     shapleyByWeights(3, e.v).every((x, i) => close(x, e.phi[i], 1e-6)));
}

console.log("\n--- the claims the prose makes about the interaction ---");
const di = FEATURES.findIndex((f) => f.key === "distance");
ok("both listings really are the same distance out", LARGE.x[di] === STUDIO.x[di],
   LARGE.x[di] + " km");
ok("distance costs the large flat more than the studio",
   Math.abs(LARGE.phi[di]) > Math.abs(STUDIO.phi[di]),
   n0(LARGE.phi[di]) + " vs " + n0(STUDIO.phi[di]) + " kr");
ok("the studio's distance credit swings widely across orderings",
   Math.abs(STUDIO.spread[di].min) > 4 * Math.abs(STUDIO.spread[di].max),
   n0(STUDIO.spread[di].min) + " .. " + n0(STUDIO.spread[di].max) + " kr");
ok("the large flat's three contributions nearly cancel",
   Math.abs(LARGE.prediction - LARGE.baseline) < Math.abs(LARGE.phi[di]),
   "net " + n0(LARGE.prediction - LARGE.baseline) + " kr");

console.log("\n" + (failures ? failures + " CHECK(S) FAILED" : "all checks passed") + "\n");
process.exit(failures ? 1 : 0);
