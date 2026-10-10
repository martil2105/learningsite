/*
  The GARCH(1,1) fit to the century of daily returns, which takes several
  seconds of Nelder–Mead and so isn't run on page load. Written to
  src/precomputed.js; check-numbers.mjs re-runs the fit and fails if it differs.
*/
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fit } from "../src/garch.js";

export function run() {
  const p = fit();
  const out = { w: +p.w.toPrecision(10), a: +p.a.toPrecision(10), b: +p.b.toPrecision(10) };
  return `/*\n  GARCH(1,1) parameters fitted to the daily file by scripts/precompute.mjs.\n  Do not edit by hand: run \`npm run precompute\`.\n*/\nexport default ${JSON.stringify(out)};\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../src/precomputed.js", import.meta.url), run());
  console.log("wrote src/precomputed.js");
}
