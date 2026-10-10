/*
  Parse the pinned daily file in data/ into src/data.js, the only form of the
  data the page and the checks import. check-numbers.mjs runs this again and
  fails if the committed src/data.js differs.

  French gives each day's market return above one-month bills (Mkt-RF) and the
  bill return (RF), both in percent with two decimals, so each is kept as a
  whole number of hundredths of a percent and the market's total return is
  their sum, exactly. Dates are kept as the first date and a string of
  calendar-day gaps to each next trading day, one base-36 character each.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { jsModule } from "./data-lib.mjs";

const read = (f) => readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8");
const toDate = (n) => new Date(Date.UTC(Math.floor(n / 1e4), Math.floor(n / 100) % 100 - 1, n % 100));

export function run() {
  const text = read("F-F_Research_Data_Factors_daily.csv");
  const lines = text.split(/\r?\n/);
  const h = lines.findIndex((l) => /^\s*,\s*Mkt-RF/.test(l));
  const cols = lines[h].split(",").map((s) => s.trim());
  const iM = cols.indexOf("Mkt-RF"), iF = cols.indexOf("RF");
  const date = [], ex = [], rf = [];
  for (let k = h + 1; k < lines.length; k++) {
    const l = lines[k];
    if (!/^\s*\d{8}\s*,/.test(l)) break;
    const p = l.split(",").map((s) => s.trim());
    date.push(+p[0]);
    ex.push(Math.round(+p[iM] * 100));
    rf.push(Math.round(+p[iF] * 100));
  }
  let gaps = "";
  for (let i = 1; i < date.length; i++) {
    const g = Math.round((toDate(date[i]) - toDate(date[i - 1])) / 864e5);
    if (!(g >= 1 && g < 36)) throw new Error(`gap of ${g} days before ${date[i]}`);
    gaps += g.toString(36);
  }
  const out = {
    vintage: (text.match(/created by using the (\d{6}) CRSP/) || text.match(/(\d{6}) CRSP/) || [])[1],
    start: date[0],
    gaps,
    ex,
    rf,
  };
  return jsModule(
    "The US stock market's daily return above one-month bills and the bill\nreturn (Kenneth French), in hundredths of a percent, with the trading dates\nas a first date and the calendar-day gaps between them.",
    out
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../src/data.js", import.meta.url), run());
  console.log("wrote src/data.js");
}
