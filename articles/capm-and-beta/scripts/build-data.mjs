/*
  Parse the pinned files in data/ into src/data.js, the only form of the data
  the page and the checks import. check-numbers.mjs runs this again and fails
  if the committed src/data.js differs, so a stale file can't ship.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { frenchBlock, jsModule } from "./data-lib.mjs";

const read = (f) => readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8");

export function run() {
  const fac = frenchBlock(read("F-F_Research_Data_Factors.csv"), /^This file/);
  const beta = read("Portfolios_Formed_on_BETA.csv");
  const vw = frenchBlock(beta, /Value Weighted Returns -- Monthly/);
  const prior = frenchBlock(beta, /Value-Weighted Average of Prior Beta/);
  const F = new Map(fac.rows.map((r) => [r[0], r]));
  const dec = vw.cols.map((c, i) => [c, i]).filter(([c]) => /^(Lo 10|Dec \d|Hi 10)$/.test(c)).map(([, i]) => i + 1);
  const months = vw.rows.filter((r) => F.has(r[0]));
  const out = {
    vintage: (read("F-F_Research_Data_Factors.csv").match(/created using the (\d{6}) CRSP/) || [])[1],
    labels: dec.map((i) => vw.cols[i - 1]),
    dates: months.map((r) => r[0]),
    mkt: months.map((r) => F.get(r[0])[1]),
    rf: months.map((r) => F.get(r[0])[4]),
    deciles: dec.map((i) => months.map((r) => r[i])),
    priorYears: prior.rows.map((r) => r[0]),
    priorBeta: dec.map((i) => prior.rows.map((r) => r[i])),
  };
  return jsModule(
    "Kenneth French's value-weighted beta deciles, monthly returns in percent,\nwith the market's excess return and the one-month bill rate over the same\nmonths, and each decile's average prior beta at each June's formation.",
    out
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../src/data.js", import.meta.url), run());
  console.log("wrote src/data.js");
}
