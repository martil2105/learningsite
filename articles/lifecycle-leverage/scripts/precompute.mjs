// Runs the seeded simulation of final wealth for every rule the page draws and
// writes src/precomputed.js. Each rule takes a second or so, so the page carries
// the results rather than running them. The first check in
// verify/check-numbers.mjs calls run() and compares it with the committed file,
// so a stale file fails.
import { flatCap, exposure, simulate, glide, allStocks } from "../src/expo.js";
import { CAPS } from "../src/caps.js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export { CAPS };
const r = (x, d) => +x.toFixed(d);

export function run() {
  const rules = {};
  const one = (key, e) => {
    const q = simulate(e), d = exposure(e);
    rules[key] = { sd: r(q.sd, 4), median: r(q.median, 3), p5: r(q.p5, 3), mean: r(q.mean, 3), neff: r(d.neff, 4), sumE: r(d.sumE, 4), sdDelta: r(d.sd, 4), e1: r(e[0], 4) };
  };
  for (const cap of CAPS) one(String(cap), cap === 1 ? allStocks() : flatCap(cap));
  one("glide", glide());
  return rules;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const here = dirname(fileURLToPath(import.meta.url));
  const data = run();
  const body = Object.entries(data).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n");
  writeFileSync(join(here, "../src/precomputed.js"),
    "// Written by scripts/precompute.mjs from src/expo.js. Do not edit by hand.\n" +
    "// Key: the leverage cap (1 is 100% stocks), or \"glide\". Values: sd, median and 5th percentile of the final wealth\n" +
    "// of 100,000 seeded savers (median and percentile in years of deposits), the mean, and the exposure measures.\n" +
    `export const DATA = {\n${body}\n};\n`);
  console.log("wrote src/precomputed.js");
}
