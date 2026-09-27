import { book, walk, shareOfWalk, roundTrip, SHAPES, MID } from "../src/book.js";
for (const s of Object.keys(SHAPES)) {
  const b = book(s, 400);
  console.log(`\n${s}`);
  for (const q of [500, 1000, 2000, 4000, 5000, 5500, 8000, 11000, 16000, 22000, 44000]) {
    const r = walk(b.asks, q);
    console.log(`q=${q} last=${r.last} lvl=${r.lastLevel} avg=${r.avg.toFixed(3)} costVsMid=${(r.avg - MID).toFixed(3)}c share=${shareOfWalk("buy", r).toFixed(4)} rt=${roundTrip(s, q).toFixed(3)}`);
  }
}
// whole-level orders
const whole = (s, n) => { let q = 0; for (let j = 0; j < n; j++) q += SHAPES[s].depth(j); return q; };
for (const s of Object.keys(SHAPES)) for (const n of [2, 5, 10, 20, 40]) {
  const q = whole(s, n); const r = walk(book(s, 400).asks, q);
  console.log(s, n, q, shareOfWalk("buy", r).toFixed(6));
}
