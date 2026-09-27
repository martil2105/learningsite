// Every number the page states, derived twice: route A is src/ddm.js, route B
// is brute-force summation of the dividend stream written here.
import { gordon, pvDividend, shareAfter, halfLife, modifiedDuration, macaulayDuration, twoStage } from "../src/ddm.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!ok) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }

// Route B: sum the stream year by year, carrying each year's value today
// forward by the ratio (1+g)/(1+r), for 20,000 years.
const priceB = (r, g) => { let p = 0, v = 1 / (1 + r); for (let t = 1; t <= 20000; t++) { p += v; v *= (1 + g) / (1 + r); } return p; };
const cumB = (r, g, T) => { let p = 0, v = 1 / (1 + r); for (let t = 1; t <= T; t++) { p += v; v *= (1 + g) / (1 + r); } return p; };
const firstYearHalfB = (r, g) => { const P = priceB(r, g); let p = 0, v = 1 / (1 + r); for (let t = 1; ; t++) { p += v; v *= (1 + g) / (1 + r); if (p >= P / 2) return t; } };

console.log("-- the Gordon price");
eq("$1 at 8% and 5% is $33.33 (A)", gordon(1, 0.08, 0.05), 100 / 3);
eq("$1 at 8% and 5% is $33.33 (B)", priceB(0.08, 0.05), 100 / 3, 1e-9);
eq("10% and 7% give the same (B)", priceB(0.10, 0.07), 100 / 3, 1e-9);
eq("5% and 2% give the same (B)", priceB(0.05, 0.02), 100 / 3, 1e-9);
eq("dividend yield is the gap, 3%", 1 / gordon(1, 0.08, 0.05), 0.03);
eq("r = D1/P + g recovers 8%", 1 / gordon(1, 0.08, 0.05) + 0.05, 0.08);

console.log("-- where the value comes from");
eq("each year worth 1.05/1.08 of the last (A)", pvDividend(1, 0.08, 0.05, 2) / pvDividend(1, 0.08, 0.05, 1), 1.05 / 1.08);
truth("  which is about 97%", Math.round(100 * 1.05 / 1.08) === 97);
eq("share after year 10 is 75.4% (A vs B)", shareAfter(0.08, 0.05, 10), 1 - cumB(0.08, 0.05, 10) / priceB(0.08, 0.05), 1e-9);
truth("  rounds to 75.4%", (100 * shareAfter(0.08, 0.05, 10)).toFixed(1) === "75.4");
eq("half-way year 24.6", +halfLife(0.08, 0.05).toFixed(1), 24.6);
eq("  half the value first reached in year 25 by summation (B)", firstYearHalfB(0.08, 0.05), 25);
eq("g = 6.5%: price about $67 (A vs B)", gordon(1, 0.08, 0.065), priceB(0.08, 0.065), 1e-9);
truth("  rounds to $67 and doubles", Math.round(gordon(1, 0.08, 0.065)) === 67 && Math.abs(gordon(1, 0.08, 0.065) / gordon(1, 0.08, 0.05) - 2) < 1e-9);
truth("  half-way year about 50", Math.abs(halfLife(0.08, 0.065) - 50) < 1, halfLife(0.08, 0.065).toFixed(2));
eq("  summation agrees within a year (B)", firstYearHalfB(0.08, 0.065), Math.ceil(halfLife(0.08, 0.065)));
eq("10% and 7%: half-way year 25.1", +halfLife(0.10, 0.07).toFixed(1), 25.1);

console.log("-- duration and convexity");
eq("duration is 1/(r-g) = 33.3 (A)", modifiedDuration(0.08, 0.05), 100 / 3);
const h = 1e-6, dB = -(priceB(0.08 + h, 0.05) - priceB(0.08 - h, 0.05)) / (2 * h) / priceB(0.08, 0.05);
eq("duration by finite difference (B)", dB, 100 / 3, 1e-5);
eq("Macaulay duration 36 years (A)", macaulayDuration(0.08, 0.05), 36);
let w = 0, P = 0, v = 1 / 1.08; for (let t = 1; t <= 20000; t++) { w += t * v; P += v; v *= 1.05 / 1.08; }
eq("Macaulay duration by weighted wait (B)", w / P, 36, 1e-9);
eq("tangent predicts a third off for +1 point", modifiedDuration(0.08, 0.05) * 0.01, 1 / 3);
eq("+1 point: price $33.33 to $25 (B)", priceB(0.09, 0.05), 25, 1e-9);
eq("  a quarter off", priceB(0.09, 0.05) / priceB(0.08, 0.05) - 1, -0.25, 1e-9);
eq("-1 point: price to $50 (B)", priceB(0.07, 0.05), 50, 1e-9);
eq("  half added", priceB(0.07, 0.05) / priceB(0.08, 0.05) - 1, 0.5, 1e-9);
truth("6% gap loses about 14% for +1 point", Math.round(-100 * (gordon(1, 0.07, 0) / gordon(1, 0.06, 0) - 1)) === 14);
eq("2% gap loses a third for +1 point", gordon(1, 0.03, 0) / gordon(1, 0.02, 0) - 1, -1 / 3);
eq("gap 2%: $50 per dollar", gordon(1, 0.02, 0), 50);
eq("gap 4%: $25 per dollar", gordon(1, 0.04, 0), 25);

console.log("-- two stages (r 8%, then 4%)");
function twoStageB(g1, N) {
  let p = 0, tv = 0, v = 1 / 1.08;
  for (let t = 1; t <= 20000; t++) { p += v; if (t > N) tv += v; v *= (t < N ? 1 + g1 : 1.04) / 1.08; }
  return { price: p, share: tv / p };
}
const a10 = twoStage(1, 0.08, 0.12, 10, 0.04), b10 = twoStageB(0.12, 10);
eq("12% for 10 years: price (A vs B)", a10.price, b10.price, 1e-9);
eq("12% for 10 years: terminal share (A vs B)", a10.terminalShare, b10.share, 1e-9);
truth("  terminal value 75%, forecast years a quarter", Math.round(100 * a10.terminalShare) === 75);
const a20 = twoStage(1, 0.08, 0.12, 20, 0.04);
eq("12% for 20 years: terminal share (A vs B)", a20.terminalShare, twoStageB(0.12, 20).share, 1e-9);
truth("  rounds to 64%", Math.round(100 * a20.terminalShare) === 64);

console.log(fails ? `\n${fails} of ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
if (fails) process.exit(1);
