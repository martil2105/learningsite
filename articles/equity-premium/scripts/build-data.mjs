/*
  Parse the pinned files in data/ into src/data.js, the only form of the data
  the page and the checks import. check-numbers.mjs runs this again and fails
  if the committed src/data.js differs.

  From Shiller's monthly series we keep, for each year, January's price, the
  dividend rate in January, January's CPI, and the dividends paid during the
  year (the average of the twelve monthly dividend rates). Years without a full
  twelve months of dividends are left out.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { frenchBlock, jsModule } from "./data-lib.mjs";

const read = (f) => readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8");

export function run() {
  const ff = read("F-F_Research_Data_Factors.csv");
  const annual = frenchBlock(ff, /Annual Factors/);
  const monthly = frenchBlock(ff, /^This file/);
  const lines = read("shiller-sp500.csv").trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
  const byYear = new Map();
  for (const p of lines) {
    const y = +p[0].slice(0, 4), m = +p[0].slice(5, 7);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push({ m, P: +p[1], D: +p[2], CPI: +p[4] });
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const sh = { year: [], P: [], D: [], CPI: [], paid: [] };
  for (const y of years) {
    const rows = byYear.get(y), jan = rows.find((r) => r.m === 1);
    if (!jan || !(jan.D > 0) || !(jan.CPI > 0)) continue;
    const full = rows.length === 12 && rows.every((r) => r.D > 0);
    sh.year.push(y); sh.P.push(jan.P); sh.D.push(jan.D); sh.CPI.push(jan.CPI);
    sh.paid.push(full ? +(rows.reduce((s, r) => s + r.D, 0) / 12).toFixed(6) : null);
  }
  const out = {
    vintage: (ff.match(/created using the (\d{6}) CRSP/) || [])[1],
    annual: { year: annual.rows.map((r) => r[0]), mktrf: annual.rows.map((r) => r[1]), rf: annual.rows.map((r) => r[4]) },
    monthly: { date: monthly.rows.map((r) => r[0]), mktrf: monthly.rows.map((r) => r[1]) },
    shiller: sh,
  };
  return jsModule(
    "The market's yearly and monthly return above one-month bills (Kenneth\nFrench), and Shiller's S&P composite: each January's price, dividend rate\nand CPI, with the dividends paid during that year.",
    out
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../src/data.js", import.meta.url), run());
  console.log("wrote src/data.js");
}
