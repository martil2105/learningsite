// Every number on the page, from src/curve.js (and src/bonds.js), in page
// order and rounded as the page rounds. The bootstrap is checked against the
// curve it should recover, the forward identity against compounding, and
// Vasicek's forward rate against the closed-form bond price and against a
// simulation of the short rate.
import * as C from "../src/curve.js";
import { normals } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r2 = (x) => +x.toFixed(2), r0 = (x) => +x.toFixed(0);
const pc2 = (x) => r2(100 * x), pc3 = (x) => +(100 * x).toFixed(3);

const B = C.bootstrap(C.PRICES), F = C.forwards(B.spots);

console.log("-- the bootstrap");
{
  let w = 0; B.spots.forEach((s, i) => (w = Math.max(w, Math.abs(s - C.spot(i + 1)))));
  eq("bootstrapping the five prices gives back the planted spot rates", w, 0, 1e-12);
  eq("the coupons run from 2% to 4%", C.BONDS[0].c + C.BONDS[4].c, 0.06, 1e-12);
  truth("every bond but the shortest pays more than once", C.BONDS.slice(1).every((b) => b.T > 1));
  [2.55, 2.98, 3.32, 3.58, 3.78].forEach((v, i) => eq(`the ${i + 1}-year spot rate is ${v}%`, pc2(B.spots[i]), v, 0));
  const y5 = C.ytm(0.04, 5, C.PRICES[4]);
  eq("the 5-year bond's own yield is 3.74%", pc2(y5), 3.74, 0);
  truth("each bond's yield sits a little below its spot rate", C.BONDS.every((b, i) => i === 0 || C.ytm(b.c, b.T, C.PRICES[i]) < B.spots[i]));
  // the forward identity: compounding the forwards gives the spot rates
  let wf = 0; B.spots.forEach((s, i) => { let p = 1; for (let k = 0; k <= i; k++) p *= 1 + F[k]; wf = Math.max(wf, Math.abs(p - Math.pow(1 + s, i + 1))); });
  eq("every spot rate is the forwards before it compounded together", wf, 0, 1e-12);
  eq("the fifth year's forward is 4.60%", pc2(F[4]), 4.6, 0);
  truth("on a rising curve the forwards sit above the spots", F.every((f, i) => i === 0 || f > B.spots[i]));
}

console.log("-- an error in one price");
{
  const p = C.PRICES.slice(); p[2] += 0.25;
  const b2 = C.bootstrap(p), f2 = C.forwards(b2.spots);
  eq("25 cents too high: the 3-year spot rate goes from 3.32%", pc2(B.spots[2]), 3.32, 0);
  eq("to 3.23%", pc2(b2.spots[2]), 3.23, 0);
  eq("about a tenth of a point", +(100 * (B.spots[2] - b2.spots[2])).toFixed(1), 0.1, 0);
  eq("year 2 to 3: from 3.99%", pc2(F[2]), 3.99, 0);
  eq("to 3.72%", pc2(f2[2]), 3.72, 0);
  eq("year 3 to 4: from 4.37%", pc2(F[3]), 4.37, 0);
  eq("to 4.66%", pc2(f2[3]), 4.66, 0);
  const ds = B.spots[2] - b2.spots[2], d3 = F[2] - f2[2], d4 = f2[3] - F[3];
  truth("the forwards move about three times as far, in opposite directions", r0(d3 / ds) === 3 && r0(d4 / ds) === 3 && d3 > 0 && d4 > 0, `${(d3 / ds).toFixed(2)} ${(d4 / ds).toFixed(2)}`);
  truth("and nothing before the error moves", Math.abs(b2.spots[0] - B.spots[0]) + Math.abs(b2.spots[1] - B.spots[1]) === 0);
  truth("the slider's grid holds +$0.25", Math.abs(0.25 / 0.05 - Math.round(0.25 / 0.05)) < 1e-9);
}

console.log("-- a yield is an average of spot rates");
{
  const b10 = C.couponBond(0.1, 10), z10 = C.couponBond(0, 10);
  eq("a 10% ten-year bond yields 4.15%", pc2(b10.yield), 4.15, 0);
  eq("and the weighted average of the spots is 4.15% too", pc2(b10.rule), 4.15, 0);
  eq("a third of its weight is on earlier years", r0(3 * (1 - b10.weights[9].w)), 1, 0);
  eq("a zero yields the 10-year spot rate, 4.29%", pc2(z10.yield), 4.29, 0);
  eq("which is exactly its spot rate", z10.yield, C.spot(10), 1e-10);
  truth("the higher coupon yields less", b10.yield < C.couponBond(0.04, 10).yield && C.couponBond(0.04, 10).yield < z10.yield);
  // the rule is first order: check it on other curves and coupons, against the exact yield
  let worst = 0;
  for (const s of [(t) => 0.03 + 0.002 * t, (t) => 0.06 - 0.003 * t, C.spot]) for (const c of [0, 0.03, 0.06, 0.12]) { const b = C.couponBond(c, 10, s); worst = Math.max(worst, Math.abs(b.yield - b.rule)); }
  truth("on other curves too, the weighted average is within a few hundredths of a point of the yield", worst < 0.0005, (100 * worst).toFixed(4));
}

console.log("-- forward rates");
{
  const s1 = C.spot(1), s2 = C.spot(2), f = C.forwards([s1, s2])[1];
  eq("$100 in the 2-year zero becomes $106.06", r2(C.twoYear(s1, s2)), 106.06, 0);
  eq("lending twice ties at 3.42%", pc2(f), 3.42, 0);
  eq("where the two plans really are equal", C.rolled(s1, f), C.twoYear(s1, s2), 1e-12);
  eq("at 2% lending twice gives $104.60", r2(C.rolled(s1, 0.02)), 104.6, 0);
  eq("and it's the same forward as the bootstrap's", f, F[1], 1e-12);
}

console.log("-- the model");
{
  // the forward rate against the closed-form bond price
  let w = 0;
  for (const sg of [0.005, 0.01, 0.02]) for (const T of [1, 5, 10, 30]) { const h = 1e-4; const fd = -(Math.log(C.bondPriceV(T + h, sg)) - Math.log(C.bondPriceV(T - h, sg))) / (2 * h); w = Math.max(w, Math.abs(fd - C.forwardV(T, sg, 0))); }
  eq("the forward formula is the slope of Vasicek's closed-form log price", w, 0, 1e-8);
  // the yield as the average of the forwards
  eq("and the yield is the average of the forwards", C.yieldV(30, 0.01, 0), -Math.log(C.bondPriceV(30, 0.01)) / 30, 1e-9);
  // a simulation of the short rate with no premium: price = E[exp(−∫r)], sharing no code with the formula
  const g = normals(23), paths = 20000, T = 10, steps = 400, dt = T / steps;
  let s = 0;
  for (let p = 0; p < paths; p++) { let r = 0.04, I = 0; for (let k = 0; k < steps; k++) { const r1 = r + 0.1 * (0.04 - r) * dt + 0.01 * Math.sqrt(dt) * g(); I += 0.5 * (r + r1) * dt; r = r1; } s += Math.exp(-I); }
  const simYield = -Math.log(s / paths) / T;
  truth("20,000 simulated paths of the short rate price the 10-year zero at the model's yield", Math.abs(simYield - C.yieldV(10, 0.01, 0)) < 0.0003, `${(100 * simYield).toFixed(3)} vs ${(100 * C.yieldV(10, 0.01, 0)).toFixed(3)}`);
  truth("and below the 4% everyone expects", simYield < 0.04 - 0.0005);
  eq("the half-life is about seven years", r0(Math.log(2) / 0.1), 7, 0);
}

console.log("-- the guess card and the lab");
{
  eq("no premium, a point a year: the 30-year forward is 3.55%", pc2(C.forwardV(30, 0.01, 0)), 3.55, 0);
  eq("0.45 points below 4%", pc2(C.convexity(30, 0.01)), 0.45, 0);
  eq("everyone expects 4%", C.expected(30), 0.04, 1e-12);
  eq("at 1.5 points of volatility the convexity is 1.02 points", pc2(C.convexity(30, 0.015)), 1.02, 0);
  eq("it grows with the square of the volatility", C.convexity(30, 0.02) / C.convexity(30, 0.01), 4, 1e-12);
  eq("with no volatility the forwards lie on the expectation", C.forwardV(30, 0, 0), 0.04, 1e-15);
  eq("a premium of half a point lifts it to 4.02%", pc2(C.forwardV(30, 0.01, 0.005)), 4.02, 0);
  let peak = 0, at = 0; for (let t = 0; t <= 30; t += 0.25) { const f = C.forwardV(t, 0.01, 0.005); if (f > peak) { peak = f; at = t; } }
  truth("and a hump appears in the middle", at > 2 && at < 25 && peak > C.forwardV(30, 0.01, 0.005) + 0.0005, `peak ${(100 * peak).toFixed(3)} at ${at}`);
  truth("the sliders' grids hold 1, 1.5 and 0.5", [0.01, 0.015].every((x) => Math.abs(x / 0.001 - Math.round(x / 0.001)) < 1e-9) && Math.abs(0.005 / 0.0005 - 10) < 1e-9);
}

// The 18% in "What the data say" is Fama and Bliss's, quoted from the
// introduction of Cochrane and Piazzesi (2005); nothing here computes it.

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
