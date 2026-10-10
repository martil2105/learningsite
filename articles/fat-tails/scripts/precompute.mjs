/*
  The running kurtosis of the seeded Student t samples drawn in the kurtosis
  figure, too slow to draw on load (eight samples of 100,000 days). Written to
  src/precomputed.js; check-numbers.mjs re-runs this and fails if it differs.
*/
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tRun, T_SEEDS } from "../src/tails.js";

export function run() {
  const out = {};
  for (const nu of [3, 6]) out[nu] = T_SEEDS[nu].map((s) => tRun(nu, s).map(([n, k]) => [n, +k.toFixed(4)]));
  return `/*\n  Running kurtosis of seeded Student t samples (scripts/precompute.mjs).\n  Do not edit by hand: run \`npm run precompute\`.\n*/\nexport default ${JSON.stringify(out)};\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../src/precomputed.js", import.meta.url), run());
  console.log("wrote src/precomputed.js");
}
