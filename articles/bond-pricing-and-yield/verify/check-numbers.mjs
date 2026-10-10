// Every number on the page, from src/bonds.js, in page order and rounded as
// the page rounds. The two identities (a year's return at an unchanged yield,
// and the money at maturity as the price at the new rate grown at it) are
// checked to machine precision on random bonds, against routes that don't use
// them.
import * as B from "../src/bonds.js";
import { mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r0 = (x) => +x.toFixed(0), r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const pc0 = (x) => r0(100 * x), pc1 = (x) => r1(100 * x), pc2 = (x) => r2(100 * x);

console.log("-- the identities, on random bonds");
{
  const u = mulberry32(3);
  let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
  for (let i = 0; i < 4000; i++) {
    const c = Math.round(u() * 24) / 200, T = 1 + Math.floor(u() * 40), y = 0.005 + u() * 0.15, r = u() * 0.15;
    // a year's return at an unchanged yield is the yield, from the prices alone
    for (const t of [0, Math.floor(T / 2), T - 1]) w1 = Math.max(w1, Math.abs(B.yearReturn(c, T, y, t) - y));
    // the money at maturity, summed coupon by coupon, against P(r)(1 + r)^T
    let sum = 0; for (let t = 1; t <= T; t++) sum += 100 * c * Math.pow(1 + r, T - t);
    w2 = Math.max(w2, Math.abs((sum + 100) / (B.price(c, T, r) * Math.pow(1 + r, T)) - 1));
    w3 = Math.max(w3, Math.abs(B.realised(c, T, y, r) - B.realisedByPrice(c, T, y, r)));
    // the yield that gives a price gives it back
    w4 = Math.max(w4, Math.abs(B.yieldOf(c, T, B.price(c, T, y)) - y));
  }
  eq("at an unchanged yield every year's return is the yield, whatever the coupon", w1, 0, 1e-12);
  eq("the money at maturity is the price at the new rate grown at it", w2, 0, 1e-12);
  eq("so the two routes to what we earn agree", w3, 0, 1e-12);
  eq("the yield is the rate that gives the price", w4, 0, 1e-10);
  // the average wait: by its definition, and as the slope of the log price (modified duration × (1 + y))
  let w5 = 0;
  for (const [c, T, y] of [[0.08, 30, 0.08], [0.05, 10, 0.04], [0, 20, 0.06], [0.12, 7, 0.03]]) {
    const h = 1e-6, slope = -(Math.log(B.price(c, T, y + h)) - Math.log(B.price(c, T, y - h))) / (2 * h) * (1 + y);
    w5 = Math.max(w5, Math.abs(slope / B.macaulay(c, T, y) - 1));
  }
  eq("the average wait is also how far the log price moves, per point, times 1 + y", w5, 0, 1e-6);
}

console.log("-- one rate for every payment");
{
  eq("a ten-year 5% bond: ten payments of $5", B.flows(0.05, 10, 0.05).filter((f) => f.cf === 5).length, 9, 0);
  eq("and a last one of $105 (the $5 coupon and the $100)", B.flows(0.05, 10, 0.05)[9].cf, 105, 1e-12);
  eq("at 4%: $108.11", r2(B.price(0.05, 10, 0.04)), 108.11, 0);
  eq("at 5%: exactly $100", B.price(0.05, 10, 0.05), 100, 1e-12);
  eq("at 6%: $92.64", r2(B.price(0.05, 10, 0.06)), 92.64, 0);
  truth("a higher rate shrinks every payment's value", B.flows(0.05, 10, 0.06).every((f, i) => f.pv < B.flows(0.05, 10, 0.05)[i].pv));
  truth("the slider's grid holds 4%, 5% and 6%", [0.04, 0.05, 0.06].every((x) => Math.abs(x / 0.0025 - Math.round(x / 0.0025)) < 1e-9));
}

console.log("-- the guess card");
{
  eq("a 30-year 8% bond at $100 yields 8%", B.yieldOf(0.08, 30, 100), 0.08, 1e-10);
  const R = B.realised(0.08, 30, 0.08, 0.04);
  eq("rates fall to 4%: we earn 5.84%", pc2(R), 5.84, 0);
  truth("about 6%", r0(100 * R) === 6);
  truth("closer to the new rate than to the yield", Math.abs(R - 0.04) < Math.abs(R - 0.08));
}

console.log("-- what the yield promises");
{
  eq("no coupon: $67.56", r2(B.price(0, 10, 0.04)), 67.56, 0);
  eq("8% coupon: $132.44", r2(B.price(0.08, 10, 0.04)), 132.44, 0);
  eq("$8 a year is 6.04% of the price", pc2(B.currentYield(0.08, 10, 0.04)), 6.04, 0);
  for (const c of [0, 0.04, 0.08]) truth(`the ${c * 100}% bond returns 4% every year`, Array.from({ length: 10 }, (_, t) => B.yearReturn(c, 10, 0.04, t)).every((x) => Math.abs(x - 0.04) < 1e-12));
  truth("the zero's price climbs every year to $100", Array.from({ length: 10 }, (_, t) => B.priceAfter(0, 10, 0.04, t + 1) > B.priceAfter(0, 10, 0.04, t)).every(Boolean) && B.priceAfter(0, 10, 0.04, 10) === 100);
  truth("the 8% bond's slides every year to $100", Array.from({ length: 10 }, (_, t) => B.priceAfter(0.08, 10, 0.04, t + 1) < B.priceAfter(0.08, 10, 0.04, t)).every(Boolean));
  truth("current yield is too high for a premium bond and too low for a discount one", B.currentYield(0.08, 10, 0.04) > 0.04 && B.currentYield(0.02, 10, 0.04) < 0.04);
}

console.log("-- where the money comes from");
{
  const w = B.atMaturity(0.08, 30, 0.08);
  eq("$100 turns into $1,006", r0(w.total), 1006, 0);
  eq("$240 of coupons", w.coupons, 240, 1e-12);
  eq("$666 of interest on coupons", r0(w.interest), 666, 0);
  eq("two thirds of the whole", r0(3 * w.interest / w.total), 2, 0);
  const v = B.atMaturity(0.08, 30, 0.04);
  eq("at 4%, interest on coupons is $209", r0(v.interest), 209, 0);
  eq("and the total $549", r0(v.total), 549, 0);
  eq("which is 5.84% a year", pc2(Math.pow(v.total / 100, 1 / 30) - 1), 5.84, 0);
  const t10 = B.atMaturity(0.08, 10, 0.08);
  eq("a ten-year bond: a sixth of the money", r0(t10.total / t10.interest), 6, 0);
  truth("a 100-year bond: nearly all of it", B.atMaturity(0.08, 100, 0.08).interest / B.atMaturity(0.08, 100, 0.08).total > 0.99);
}

console.log("-- held to maturity, when rates move");
{
  const cross = (c, T, r) => Math.log(B.price(c, T, r) / B.price(c, T, 0.08)) / Math.log(1.08 / (1 + r));
  eq("the promise catches up after about 14 years", r0(cross(0.08, 30, 0.04)), 14, 0);
  truth("the blue line jumps up at once: the bond is worth more at 4%", B.price(0.08, 30, 0.04) > 100);
  const up = B.atMaturity(0.08, 30, 0.12);
  eq("at 12% we finish with $2,031", r0(up.total), 2031, 0);
  eq("and earn 10.56%", pc2(B.realised(0.08, 30, 0.08, 0.12)), 10.56, 0);
  truth("the blue line drops first and overtakes the promise", B.price(0.08, 30, 0.12) < 100 && cross(0.08, 30, 0.12) > 0 && cross(0.08, 30, 0.12) < 30);
  const sell = (8 + B.price(0.08, 29, 0.04)) / 100 - 1;
  eq("sold a year after the fall: 75.9%", pc1(sell), 75.9, 0);
  truth("almost all from the jump in price", (B.price(0.08, 29, 0.04) - 100) / 100 > 0.8 * sell);
  let flat = 0; for (let r = 0; r <= 0.12; r += 0.0025) flat = Math.max(flat, Math.abs(B.realised(0, 30, 0.08, r) - 0.08));
  eq("with no coupon, we earn 8% whatever the new rate", flat, 0, 1e-12);
}

console.log("-- how much of the yield survives");
{
  const D = B.macaulay(0.08, 30, 0.08);
  eq("the 30-year bond waits 12.2 years", r1(D), 12.2, 0);
  eq("41% of its life", pc0(D / 30), 41, 0);
  eq("so the new rate sets 59%", pc0(1 - D / 30), 59, 0);
  eq("the rule says 5.62%", pc2(B.realisedRule(0.08, 30, 0.08, 0.04)), 5.62, 0);
  eq("at 12% the rule says 10.38%", pc2(B.realisedRule(0.08, 30, 0.08, 0.12)), 10.38, 0);
  const D10 = B.macaulay(0.08, 10, 0.08);
  eq("a ten-year bond waits 7.2 years", r1(D10), 7.2, 0);
  eq("72% of its life", pc0(D10 / 10), 72, 0);
  eq("and earns 6.96%", pc2(B.realised(0.08, 10, 0.08, 0.04)), 6.96, 0);
  eq("a zero waits its whole life", B.macaulay(0, 30, 0.08), 30, 1e-12);
  eq("a 100-year bond waits 13.5 years", r1(B.macaulay(0.08, 100, 0.08)), 13.5, 0);
  eq("and earns 4.71%", pc2(B.realised(0.08, 100, 0.08, 0.04)), 4.71, 0);
  truth("which is close to the new rate", Math.abs(B.realised(0.08, 100, 0.08, 0.04) - 0.04) < 0.01);
  // the curve bends upwards and sits above the rule, touching it at the yield
  let above = true;
  for (const [c, T] of [[0.08, 10], [0.08, 30], [0.08, 100]]) for (let r = 0; r <= 0.12001; r += 0.001) if (B.realised(c, T, 0.08, r) < B.realisedRule(c, T, 0.08, r) - 1e-12) above = false;
  truth("the blue curve is never below the rule", above);
  eq("and touches it at the yield", B.realised(0.08, 30, 0.08, 0.08) - B.realisedRule(0.08, 30, 0.08, 0.08), 0, 1e-12);
  // where the rule comes from: a one-point fall raises the price by roughly D percent
  eq("a one-point fall raises the 30-year bond's price by roughly D percent (12.4% against 12.2)", r0(100 * (B.price(0.08, 30, 0.07) / 100 - 1)), r0(D), 0);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
