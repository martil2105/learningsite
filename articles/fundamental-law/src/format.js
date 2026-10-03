// Number formatting with a real minus sign and British conventions.
const MINUS = "−";
export function fixed(x, d = 2) {
  const s = Math.abs(x).toFixed(d);
  return (x < 0 && +s !== 0 ? MINUS : "") + s;
}
export function pct(x, d = 1) { return fixed(100 * x, d) + "%"; }
export function signedPct(x, d = 1) { return (x > 0 ? "+" : "") + pct(x, d); }
export function money(x, d = 2) { return (x < 0 ? MINUS : "") + "$" + Math.abs(x).toFixed(d); }
export function thousands(x) { return Math.round(x).toLocaleString("en-GB"); }
// A percentage that can run to thousands, rounded to a whole number, with a comma.
export function bigPct(x) {
  const p = Math.round(100 * x);
  return (p < 0 ? MINUS : "") + Math.abs(p).toLocaleString("en-GB") + "%";
}
