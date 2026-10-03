/*
  Parse the pinned files in data/ into src/data.js, the only form of the data
  the page and the checks import. check-numbers.mjs runs this again and fails
  if the committed src/data.js differs.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { frenchBlock, jsModule } from "./data-lib.mjs";

const read = (f) => readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8");

export function run() {
  const five = frenchBlock(read("F-F_Research_Data_5_Factors_2x3.csv"), /^This file/);
  const mom = frenchBlock(read("F-F_Momentum_Factor.csv"), /Missing data/);
  const beta = frenchBlock(read("Portfolios_Formed_on_BETA.csv"), /Value Weighted Returns -- Monthly/);
  const M = new Map(mom.rows.map((r) => [r[0], r[1]]));
  const lo = beta.cols.indexOf("Lo 10") + 1;
  const B = new Map(beta.rows.map((r) => [r[0], r[lo]]));
  const rows = five.rows.filter((r) => M.has(r[0]) && B.has(r[0]));
  const col = (name) => { const i = five.cols.indexOf(name) + 1; return rows.map((r) => r[i]); };
  const out = {
    vintage: (read("F-F_Research_Data_5_Factors_2x3.csv").match(/created using the (\d{6}) CRSP/) || [])[1],
    dates: rows.map((r) => r[0]),
    mkt: col("Mkt-RF"), smb: col("SMB"), hml: col("HML"), rmw: col("RMW"), cma: col("CMA"), rf: col("RF"),
    mom: rows.map((r) => M.get(r[0])),
    lowBeta: rows.map((r) => B.get(r[0])),
  };
  return jsModule(
    "Fama and French's five factors and the momentum factor, monthly returns in\npercent, and the lowest-beta tenth of US shares (value-weighted), over the\nmonths all three files cover.",
    out
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../src/data.js", import.meta.url), run());
  console.log("wrote src/data.js");
}
