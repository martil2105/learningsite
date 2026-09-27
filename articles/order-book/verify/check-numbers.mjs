// Every number the page states, derived twice. Route A is the article's own
// module (src/book.js). Route B is closed-form arithmetic written here, sharing
// no code with it.
import { book, walk, shareOfWalk, roundTrip, continuousReach, continuousShare, MID, BEST_ASK, BEST_BID } from "../src/book.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!ok) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}`); }

// Route B: sums over levels with no walking loop.
const depthB = { flat: () => 500, v: (j) => 100 * (j + 1), steep: (j) => 20 * (j + 1) ** 2 };
const wholeLevelOrder = (s, levels) => { let q = 0; for (let j = 0; j < levels; j++) q += depthB[s](j); return q; };
const avgB = (s, levels, touch = 10001, dir = 1) => { let c = 0, q = 0; for (let j = 0; j < levels; j++) { c += depthB[s](j) * (touch + dir * j); q += depthB[s](j); } return c / q; };

console.log("-- the quiet book (figure 1)");
eq("best bid is $99.99", BEST_BID, 9999);
eq("best ask is $100.01", BEST_ASK, 10001);
eq("mid is $100.00", MID, 10000);
eq("spread is two cents", BEST_ASK - BEST_BID, 2);
truth("flat book holds 500 at every level", book("flat").asks.every((l) => l.qty === 500) && book("flat").bids.every((l) => l.qty === 500));
truth("linear book holds 100, 200, 300 at the first three levels", book("v").asks.slice(0, 3).map((l) => l.qty).join() === "100,200,300");

console.log("-- walking the flat book");
const f5 = walk(book("flat", 400).asks, 5000);
eq("flat 5,000: levels used", f5.fills.length, 10);
eq("flat 5,000: last price $100.10", f5.last, 10010);
eq("flat 5,000: average $100.055 (A)", f5.avg, 10005.5);
eq("flat 5,000: average $100.055 (B)", avgB("flat", 10), 10005.5);
eq("flat 5,000: cost above mid 5.5 cents", f5.avg - MID, 5.5);
let worstFlat = 0;
for (let q = 1000; q <= 15000; q += 500) worstFlat = Math.max(worstFlat, Math.abs(shareOfWalk("buy", walk(book("flat", 400).asks, q)) - 0.5));
eq("flat: average sits half way for every whole-level size in the lab", worstFlat, 0, 1e-12);
eq("flat: 1,500 shares is three whole levels", 1500 / 500, 3);
eq("flat: 8,000 shares is sixteen whole levels", 8000 / 500, 16);
const f6 = walk(book("flat", 400).asks, 600);
truth("flat: a partial last level moves the share off a half", Math.abs(shareOfWalk("buy", f6) - 0.5) > 0.1);

console.log("-- the linear book");
eq("linear: 5,500 shares is ten whole levels (B)", wholeLevelOrder("v", 10), 5500);
const v55 = walk(book("v", 400).asks, 5500);
eq("linear 5,500: last price $100.10", v55.last, 10010);
eq("linear 5,500: average $100.07 (A)", v55.avg, 10007);
eq("linear 5,500: average $100.07 (B)", avgB("v", 10), 10007);
eq("linear 5,500: two thirds of the way", shareOfWalk("buy", v55), 2 / 3);
let worstV = 0;
for (let L = 2; L <= 40; L++) {
  const r = walk(book("v", 400).asks, wholeLevelOrder("v", L));
  worstV = Math.max(worstV, Math.abs(shareOfWalk("buy", r) - 2 / 3));
  // closed form: average offset 2(L-1)/3 over a walk of L-1
  eq(`linear: ${L} whole levels, average offset (B)`, avgB("v", L) - 10001, (2 * (L - 1)) / 3, 1e-12);
}
eq("linear: two thirds for every whole-level order up to 40 levels", worstV, 0, 1e-12);
let partialOff = 0;
for (let q = 100; q <= 15000; q += 100) partialOff = Math.max(partialOff, Math.abs(shareOfWalk("buy", walk(book("v", 400).asks, q)) - 2 / 3) || 0);
truth("linear: partial last levels move the share off two thirds", partialOff > 0.01, `max off ${partialOff}`);

console.log("-- the square book");
for (const L of [2, 5, 10, 20, 40]) {
  const r = walk(book("steep", 400).asks, wholeLevelOrder("steep", L));
  eq(`square: ${L} whole levels, share (A) = (3L+2)/(2(2L+1)) (B)`, shareOfWalk("buy", r), (3 * L + 2) / (2 * (2 * L + 1)), 1e-12);
}
truth("square: share approaches three quarters from above", [2, 5, 10, 20, 40].map((L) => (3 * L + 2) / (2 * (2 * L + 1))).every((v, i, a) => v > 0.75 && (i === 0 || v < a[i - 1])));
eq("square: 40 levels is about three quarters", (3 * 40 + 2) / (2 * 81), 0.753086, 1e-5);

console.log("-- the continuous rule");
for (const a of [0, 1, 2]) {
  // Route B: integrate k x^a numerically to find the reach and the average
  const k = 7, Q = 1234;
  const steps = 200000;
  let x = 0, got = 0, moment = 0; const dx = 1e-4;
  while (got < Q) { const dq = k * Math.pow(x + dx / 2, a) * dx; got += dq; moment += dq * (x + dx / 2); x += dx; }
  eq(`a=${a}: reach matches ((a+1)Q/k)^(1/(a+1))`, x, continuousReach(a, k, Q), 1e-3);
  eq(`a=${a}: average share (a+1)/(a+2)`, moment / got / x, continuousShare(a), 1e-3);
}
eq("doubling multiplies the walk by 2.00 in a flat book", continuousReach(0, 500, 2e4) / continuousReach(0, 500, 1e4), 2);
eq("doubling multiplies the walk by 1.41 in a linear book", continuousReach(1, 100, 2e4) / continuousReach(1, 100, 1e4), Math.SQRT2);
eq("doubling multiplies the walk by 1.26 in a square book", continuousReach(2, 20, 2e4) / continuousReach(2, 20, 1e4), Math.cbrt(2));
eq("four times the order, twice as far, linear book", continuousReach(1, 100, 4e4) / continuousReach(1, 100, 1e4), 2);
eq("discrete linear: 5,500 uses 10 levels, 21,000 uses 20", walk(book("v", 400).asks, 21000).fills.length / walk(book("v", 400).asks, 5500).fills.length, 2);

console.log("-- the cost and the round trip");
const f10 = walk(book("flat", 400).asks, 10000);
const ratio = (10000 * (f10.avg - MID)) / (5000 * (f5.avg - MID));
truth("flat: doubling 5,000 to 10,000 costs roughly four times as much", ratio > 3.5 && ratio < 4, `ratio ${ratio.toFixed(3)}`);
eq("flat 5,000 round trip: 11 cents a share (A)", roundTrip("flat", 5000), 11);
eq("flat 5,000 round trip: 11 cents a share (B)", avgB("flat", 10) - avgB("flat", 10, 9999, -1), 11);
eq("flat round trip splits into 2 cents of spread", BEST_ASK - BEST_BID, 2);
eq("and 9 cents of walking", (avgB("flat", 10) - 10001) + (9999 - avgB("flat", 10, 9999, -1)), 9);
eq("flat 5,000 round trip: $550 in total", (5000 * roundTrip("flat", 5000)) / 100, 550);
eq("on half a million dollars of stock", (5000 * 10000) / 100, 500000);

console.log(fails ? `\n${fails} of ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
if (fails) process.exit(1);
