// Every number on the page, from src/duration.js (and src/bonds.js), in page
// order and rounded as the page rounds. First duration's three jobs checked
// against each other on random bonds by routes that don't share code: the
// weighted average of dates, the numerical slope of the log price, and the
// numerical minimum of the money at the horizon.
import * as M from "../src/duration.js";
import { mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toPrecision(8)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2), r0 = (x) => +x.toFixed(0);
const pc2 = (x) => r2(100 * x), pc0 = (x) => r0(100 * x);
const C = 0.08, T = 30, Y = 0.08;
const D = M.dates(C, T, Y).D;
const gain = (H, r) => M.atHorizon(C, T, Y, H, r) - 1;

console.log("-- three jobs, one number (random bonds)");
{
  const u = mulberry32(17);
  let wSlope = 0, wMin = 0, wH = 0, wVar = 0, floor = true;
  for (let i = 0; i < 300; i++) {
    // coupon bonds only: a zero's money at its own maturity doesn't depend on the rate at all (checked below)
    const c = (1 + Math.round(u() * 23)) / 200, t = 2 + Math.floor(u() * 38), y = 0.01 + u() * 0.12;
    const d = M.dates(c, t, y);
    // the slope of the log price against the log of 1 + y
    const h = 1e-5, x0 = Math.log(1 + y), lp = (x) => Math.log(M.price(c, t, Math.exp(x) - 1));
    wSlope = Math.max(wSlope, Math.abs(-(lp(x0 + h) - lp(x0 - h)) / (2 * h) / d.D - 1));
    // the money at the horizon D is lowest when the rate doesn't move: golden-section search for its minimum
    let a = y - 0.05, b = y + 0.05; const g = (r) => M.atHorizon(c, t, y, d.D, r);
    for (let k = 0; k < 200; k++) { const m1 = a + 0.382 * (b - a), m2 = a + 0.618 * (b - a); if (g(m1) < g(m2)) b = m2; else a = m1; }
    wMin = Math.max(wMin, Math.abs((a + b) / 2 - y));
    for (let r = Math.max(0, y - 0.08); r <= y + 0.08; r += 0.005) if (g(r) < 1 - 1e-12) floor = false;
    // the slope of the log money against the log of 1 + r is H − D(r), at any H and r
    const H = u() * 40, r = 0.01 + u() * 0.12, xr = Math.log(1 + r), lw = (x) => Math.log(M.price(c, t, Math.exp(x) - 1)) + H * x;
    wH = Math.max(wH, Math.abs((lw(xr + h) - lw(xr - h)) / (2 * h) - (H - M.dates(c, t, r).D)));
    // and its second derivative is the variance of the payment dates
    const h2 = 1e-3;
    wVar = Math.max(wVar, Math.abs((lw(xr + h2) - 2 * lw(xr) + lw(xr - h2)) / (h2 * h2) / M.dates(c, t, r).V - 1));
  }
  eq("the average wait is the slope of the log price", wSlope, 0, 1e-6);
  eq("the money at the horizon D is lowest where the rate doesn't move", wMin, 0, 1e-6);
  truth("at that horizon no parallel move leaves us below the promise", floor);
  eq("d ln W_H / d ln(1 + r) = H − D", wH, 0, 1e-6);
  eq("and the bend is the variance of the payment dates", wVar, 0, 1e-4);
  eq("a zero has no spread of dates, so at its maturity the rate doesn't matter", Math.abs(M.atHorizon(0, 20, 0.05, 20, 0.11) - 1) + M.dates(0, 20, 0.05).V, 0, 1e-12);
}

console.log("-- the guess card and the average wait");
{
  eq("the 30-year 8% bond waits 12.2 years", r1(D), 12.2, 0);
  eq("a fall to 4% leaves us 6.91% ahead", pc2(gain(D, 0.04)), 6.91, 0);
  eq("a rise to 12%, 5.47% ahead", pc2(gain(D, 0.12)), 5.47, 0);
  truth("both of them", gain(D, 0.04) > 0 && gain(D, 0.12) > 0);
  const fs = M.flows(C, T, Y);
  eq("the last payment is $108", fs[29].cf, 108, 1e-12);
  eq("worth $10.73 today", r2(fs[29].pv), 10.73, 0);
  eq("about 11% of the price", pc0(fs[29].pv / 100), 11, 0);
  eq("with no coupon the balance point is the maturity", M.macaulay(0, 30, Y), 30, 1e-12);
  truth("shortening the bond moves the balance point down", [29, 20, 10, 5, 1].every((t, i, a) => M.macaulay(C, t, Y) < (i ? M.macaulay(C, a[i - 1], Y) : D)));
}

console.log("-- the slope of the price");
{
  eq("modified duration 11.26", r2(D / (1 + Y)), 11.26, 0);
  const m1 = M.priceMove(C, T, Y, -0.01), m4 = M.priceMove(C, T, Y, -0.04), p4 = M.priceMove(C, T, Y, 0.04);
  eq("a one-point fall: the price rises 12.41%", pc2(m1.exact), 12.41, 0);
  eq("duration guesses 11.26%", pc2(m1.duration), 11.26, 0);
  eq("with convexity, 12.32%", pc2(m1.withConvexity), 12.32, 0);
  eq("four points down: 69.17%", pc2(m4.exact), 69.17, 0);
  eq("where the line says 45.03%", pc2(m4.duration), 45.03, 0);
  eq("four points up: −32.22%", pc2(p4.exact), -32.22, 0);
  eq("rather than −45.03%", pc2(p4.duration), -45.03, 0);
  let convex = true; for (let dy = -0.06; dy <= 0.06; dy += 0.0025) if (M.priceMove(C, T, Y, dy).exact < M.priceMove(C, T, Y, dy).duration - 1e-12) convex = false;
  truth("the line always overstates losses and understates gains", convex);
  truth("the slider's grid holds −1 and ±4 points", [-0.04, -0.01, 0.04].every((x) => Math.abs(x / 0.0025 - Math.round(x / 0.0025)) < 1e-9));
}

console.log("-- the horizon where the two cancel");
{
  eq("five years, a fall to 4%: +40.08%", pc2(gain(5, 0.04)), 40.08, 0);
  eq("a rise to 12%: −18.70%", pc2(gain(5, 0.12)), -18.7, 0);
  eq("25 years, a fall: −34.15%", pc2(gain(25, 0.04)), -34.15, 0);
  eq("a rise: +68.25%", pc2(gain(25, 0.12)), 68.25, 0);
  let lo = Infinity, at = 0; for (let r = 0.04; r <= 0.12 + 1e-9; r += 0.0005) { const g = gain(D, r); if (g < lo) { lo = g; at = r; } }
  eq("at the average wait the lowest point is the promise", lo, 0, 1e-12);
  eq("and it's at 8%", at, 0.08, 1e-9);
  truth("before the wait a rise hurts, after it a fall does", gain(5, 0.12) < 0 && gain(25, 0.04) < 0);
}

console.log("-- why the floor is the promise");
{
  const bb = M.barbell(D, Y), bu = M.bullet(D, Y), d = M.dates(C, T, Y);
  let flat = 0, order = true;
  for (let r = 0.04; r <= 0.12 + 1e-9; r += 0.0025) {
    flat = Math.max(flat, Math.abs(bu.atHorizon(D, r) - 1));
    if (!(bb.atHorizon(D, r) >= gain(D, r) + 1 - 1e-12 && gain(D, r) >= -1e-12)) order = false;
  }
  eq("a single zero maturing at 12.2 years gives exactly the promise", flat, 0, 1e-12);
  truth("the barbell's valley is deeper than the coupon bond's everywhere", order);
  eq("all three wait 12.2 years", Math.abs(bb.D - D) + Math.abs(bu.D - D), 0, 1e-12);
  eq("the coupon bond's dates spread 9.4 years", r1(Math.sqrt(d.V)), 9.4, 0);
  eq("the barbell's 13.5", r1(Math.sqrt(bb.V)), 13.5, 0);
  eq("the barbell gains 14.57% if rates fall to 4%", pc2(bb.atHorizon(D, 0.04) - 1), 14.57, 0);
  // the second-order formula is the limit of the exact gain
  const x = (r) => Math.log((1 + r) / (1 + Y));
  truth("½·Var·Δ² matches the exact log gain for small moves", Math.abs(Math.log(1 + gain(D, 0.081)) / (0.5 * d.V * x(0.081) ** 2) - 1) < 0.01);
}

console.log("-- is convexity free?");
{
  const bb = M.barbell(D, Y), bu = M.bullet(D, Y);
  eq("at a point a year, the barbell's extra convexity is worth 0.78% a year", pc2(M.convexityEdge(bb.C - bu.C, 0.01)), 0.78, 0);
  truth("and the barbell beats the zero after every parallel move", Array.from({ length: 33 }, (_, i) => 0.04 + i * 0.0025).every((r) => bb.atHorizon(D, r) >= bu.atHorizon(D, r) - 1e-12));
}

console.log("-- a longer bond with a shorter wait");
{
  eq("a perpetuity waits 13.5 years at 8%", r1(M.perpetuityWait(Y)), 13.5, 0);
  let below = true; for (let t = 1; t <= 200; t++) if (M.macaulay(C, t, Y) >= M.perpetuityWait(Y)) below = false;
  truth("the 8% bond's wait never passes it", below);
  let k = 1; for (let t = 2; t <= 100; t++) if (M.macaulay(0.02, t, Y) > M.macaulay(0.02, k, Y)) k = t;
  eq("the 2% bond peaks at 34 years to maturity", k, 34, 0);
  eq("at 16.4 years", r1(M.macaulay(0.02, k, Y)), 16.4, 0);
  eq("a 100-year 2% bond waits 13.6", r1(M.macaulay(0.02, 100, Y)), 13.6, 0);
  let falls = true; for (let t = 35; t <= 100; t++) if (!(M.macaulay(0.02, t, Y) < M.macaulay(0.02, t - 1, Y))) falls = false;
  truth("beyond 34 years a longer bond has a shorter wait", falls);
}

console.log("-- costs");
{
  eq("a year on, the date is 11.2 years away", r1(D - 1), 11.2, 0);
  eq("and the bond waits 12.1", r1(M.macaulay(C, 29, Y)), 12.1, 0);
  eq("after ten years, 2.2 years away", r1(D - 10), 2.2, 0);
  eq("and the bond waits 10.6", r1(M.macaulay(C, 20, Y)), 10.6, 0);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
