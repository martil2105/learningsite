/*
  Build src/data.js from the pinned FRED files: Moody's Baa and Aaa yields,
  monthly from January 1919, kept exactly as whole hundredths of a percent.
  The check re-runs this and compares, so src/data.js can't drift from data/.
*/
import { readFileSync, writeFileSync } from "node:fs";

export function build() {
  const read = (f) => readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8").trim().split("\n").slice(1).map((l) => l.split(","));
  const baa = read("BAA.csv"), aaa = read("AAA.csv");
  if (baa.length !== aaa.length) throw new Error("the two series have different lengths");
  baa.forEach((r, i) => { if (r[0] !== aaa[i][0]) throw new Error(`months differ at row ${i}: ${r[0]} vs ${aaa[i][0]}`); });
  const cents = (v) => { const x = Math.round(+v * 100); if (Math.abs(x / 100 - +v) > 1e-9) throw new Error(`not two decimals: ${v}`); return x; };
  const start = baa[0][0].slice(0, 7), end = baa[baa.length - 1][0].slice(0, 7);
  // months must run without gaps
  baa.forEach((r, i) => { const [y, m] = start.split("-").map(Number); const k = (y * 12 + m - 1) + i; const want = `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`; if (r[0].slice(0, 7) !== want) throw new Error(`gap at ${r[0]}`); });
  return `// Built by scripts/build-data.mjs from data/BAA.csv and data/AAA.csv (FRED, Moody's).
// Yields in hundredths of a percent a year, one a month from ${start} to ${end}.
export const START = "${start}";
export const END = "${end}";
export const BAA = [${baa.map((r) => cents(r[1])).join(",")}];
export const AAA = [${aaa.map((r) => cents(r[1])).join(",")}];
`;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  writeFileSync(new URL("../src/data.js", import.meta.url), build());
  console.log("wrote src/data.js");
}
