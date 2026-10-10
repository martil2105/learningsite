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
// a positive number for a readout: two decimals below 10, whole numbers with
// commas below a million, and powers of ten (with superscripts) beyond
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export function wide(v) {
  if (!(v > 0)) return "0";
  if (v < 0.001 || v >= 1e6) {
    const e = Math.floor(Math.log10(v)), c = v / Math.pow(10, e);
    const ce = +c.toFixed(1) >= 10 ? [1, e + 1] : [+c.toFixed(1), e];
    return ce[0].toFixed(1) + " × 10" + (ce[1] < 0 ? "⁻" : "") + String(Math.abs(ce[1])).split("").map((d) => SUP[+d]).join("");
  }
  if (v < 0.1) return v.toPrecision(2);
  if (v < 10) return v.toFixed(2);
  if (v < 100) return v.toFixed(1);
  return Math.round(v).toLocaleString("en-GB");
}
