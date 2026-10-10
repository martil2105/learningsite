/*
  The daily US market from src/data.js: dates, total simple returns and the
  bill rate, decoded once. Everything the page says about real data is
  computed from these arrays.
*/
import DATA from "./data.js";

const toDate = (n) => Date.UTC(Math.floor(n / 1e4), Math.floor(n / 100) % 100 - 1, n % 100);
const fromMs = (ms) => { const d = new Date(ms); return d.getUTCFullYear() * 1e4 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); };

export const VINTAGE = DATA.vintage;
export const DATES = (() => {
  const out = [DATA.start];
  let ms = toDate(DATA.start);
  for (const ch of DATA.gaps) { ms += parseInt(ch, 36) * 864e5; out.push(fromMs(ms)); }
  return out;
})();
// total simple return of the market, and the bill's, as fractions
export const RET = DATA.ex.map((e, i) => (e + DATA.rf[i]) / 1e4);
export const RF = DATA.rf.map((x) => x / 1e4);
export const LOGRET = RET.map((r) => Math.log1p(r));
export const N = RET.length;

// the index range [i0, i1) of the trading days from year a to year b inclusive
export function span(a, b) {
  let i0 = 0; while (i0 < N && DATES[i0] < a * 1e4) i0++;
  let i1 = i0; while (i1 < N && DATES[i1] < (b + 1) * 1e4) i1++;
  return [i0, i1];
}
export const yearOf = (i) => Math.floor(DATES[i] / 1e4);
export const dayIndex = (yyyymmdd) => DATES.indexOf(yyyymmdd);
