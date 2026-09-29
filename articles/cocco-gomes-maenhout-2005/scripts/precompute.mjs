// Solves every setting the lab offers and writes src/precomputed.js. Each solve
// takes several seconds, so the page carries the results rather than running
// the solver. The first check in verify/check-numbers.mjs calls run() and
// compares it with the committed file, so a stale file fails.
import { solve, simulate, valueAt } from "../src/cgm.js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const GRID = { gamma: [3, 5, 10], cap: [1, 2], rho: [0, 0.3] };
const r = (x, d) => +x.toFixed(d);

export function run() {
  const data = {};
  for (const gamma of GRID.gamma) for (const cap of GRID.cap) for (const rho of GRID.rho) {
    const sol = solve({ gamma, cap, rho });
    const sim = simulate(sol);
    data[`${gamma}|${cap}|${rho}`] = {
      median: sim.map((s) => r(s.median, 4)),
      p10: sim.map((s) => r(s.p10, 4)),
      p90: sim.map((s) => r(s.p90, 4)),
      atCap: sim.map((s) => r(s.atCap, 4)),
      wealth: sim.map((s) => r(s.wealth, 3)),
      F: r(valueAt(sol, 1.5), 6),
    };
  }
  return data;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const here = dirname(fileURLToPath(import.meta.url));
  const data = run();
  const body = Object.entries(data).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n");
  writeFileSync(join(here, "../src/precomputed.js"),
    "// Written by scripts/precompute.mjs from src/cgm.js. Do not edit by hand.\n" +
    "// Key: risk aversion | limit on the share (1 = no borrowing, 2 = 2:1) | correlation of pay with stocks.\n" +
    "// Per age from 25 to 89: median, 10th and 90th percentile of the share in stocks, the fraction of workers at the limit,\n" +
    "// median savings in years of permanent income. F: value at 25 of cash on hand 1.5 (in units of c^(1-g)).\n" +
    `export const DATA = {\n${body}\n};\n`);
  console.log("wrote src/precomputed.js");
}
