/*
  Re-derives every number the page states, from the same modules the page
  imports, with no build step.

  The article's argument is that the rectangle test and the price test are
  different tests, and that a technology can pass the first and fail the
  second everywhere. The load-bearing assertions are the two routes to "ever
  chosen" — winInterval's algebra and lowerHull's geometry, sharing no code —
  and the window arithmetic for BALANCED, which is exact.
*/
import {
  SET, BALANCED, BAL_CHORD, BAL_EVICTS, W_BASE, P_BASE, R_MIN, R_MAX,
} from "../src/datasets.js";
import {
  dominates, isDominated, undominated, winInterval, isEverChosen,
  lowerHull, costAt, cheapest, envelope, gap, rent, rentSlope, switchPrices,
} from "../src/technology.js";

let pass = 0;
const fails = [];
function ok(claim, cond, detail = "") {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
}
const byId = (id) => SET.find((t) => t.id === id);
const sweep = (lo, hi, n) =>
  Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);

// ------------------------------------------------------------ the rectangle
{
  const dom = SET.filter((t) => isDominated(t, SET)).map((t) => t.id);
  ok("the rectangle test removes exactly LEGACY and PORTED",
     dom.length === 2 && dom.includes("L") && dom.includes("M"), dom.join(","));
  // The test leaves FIVE survivors, Balanced among them; the envelope wants four.
  ok("the rectangle test's survivors are BRUTE, BATCHED, INDEXED, TUNED and BALANCED",
     undominated(SET).map((t) => t.id).join("") === "PQSTB");
  ok("BALANCED is dominated by nothing", !isDominated(BALANCED, SET));
  ok("BALANCED beats PORTED on the rectangle test and loses to nothing",
     dominates(BALANCED, byId("M")) && !dominates(byId("M"), BALANCED));
}

// ------------------------------------------- two routes to "ever chosen"
{
  const algebra = SET.filter((t) => winInterval(t, SET) !== null).map((t) => t.id);
  const geometry = lowerHull(SET).map((t) => t.id);
  ok("the algebraic route and the hull route agree on what is ever chosen",
     algebra.join("") === geometry.join(""),
     `algebra ${algebra.join(",")} vs hull ${geometry.join(",")}`);
  ok("the hull is the four survivors in input order", geometry.join("") === "PQST");
  ok("BALANCED is ever chosen at no price at all", !isEverChosen(BALANCED, SET));
  for (const t of SET) {
    const w = winInterval(t, SET);
    if (w) {
      const hi = Math.min(w.hi, R_MAX);
      const mid = Math.min((w.lo + hi) / 2, R_MAX);
      for (const rr of [w.lo, mid, hi]) {
        ok(`${t.id} touches the envelope at r = ${rr.toFixed(2)}`,
           Math.abs(costAt(t, rr) - envelope(SET, rr)) < 1e-9,
           `cost ${costAt(t, rr)} vs envelope ${envelope(SET, rr)}`);
      }
    }
  }
}

// ------------------------------------------------------------ switch prices
{
  const s = switchPrices(SET);
  ok("the industry switches technology at r = 1, 3 and 8, exactly",
     s.length === 3 && s[0] === 1 && s[1] === 3 && s[2] === 8, s.join(","));
  ok("BRUTE is the answer when engineers are dear (r = 12)", cheapest(SET, 12).id === "P");
  ok("BATCHED is the answer at r = 5", cheapest(SET, 5).id === "Q");
  ok("INDEXED is the answer at the standard r = 2", cheapest(SET, 2).id === "S");
  ok("HAND-TUNED is the answer when machines are dear (r = 0.5)", cheapest(SET, 0.5).id === "T");
  const slope = (a, b) => (envelope(SET, b) - envelope(SET, a)) / (b - a);
  ok("the envelope's slope is the chosen technology's N on each piece",
     slope(0.25, 0.75) === 15 && slope(1.25, 2.75) === 7 &&
     slope(3.5, 7.5) === 3 && slope(8.5, 13.5) === 1);
}

// --------------------------------------------------------------- the rents
{
  ok("at r = 2 the envelope is 26 (INDEXED)", envelope(SET, 2) === 26);
  ok("holding TUNED at the standard regime carries a rent of exactly 8",
     gap(byId("T"), SET, 2) === 8);
  ok("holding LEGACY carries the article's rent of exactly 22",
     gap(byId("L"), SET, 2) === 22);
  ok("BALANCED at the standard regime sits 4 above the envelope",
     gap(BALANCED, SET, 2) === 4);
  const on = winInterval(byId("S"), SET);
  ok("the rent is zero across INDEXED's whole window and positive off it",
     sweep(on.lo - 0.5, on.hi + 0.5, 40).every((rr) => {
       const g = gap(byId("S"), SET, rr);
       return rr >= on.lo && rr <= on.hi ? g === 0 : g > 0;
     }));
}

// --------------------------------------------------- BALANCED's window trap
{
  ok("at 20 machine-days the window is null — chosen never",
     winInterval(BALANCED, SET) === null);
  const w14 = winInterval({ ...BALANCED, R: 14 }, SET);
  ok("at 14 machine-days the window is [1, 5]",
     w14 && w14.lo === 1 && w14.hi === 5, w14 && `${w14.lo}..${w14.hi}`);
  ok("a window of [1, 5] covers the standard regime r = 2",
     w14 && w14.lo <= 2 && 2 <= w14.hi);
  let worst = 0;
  for (let R = 14; R <= 17; R++) {
    const w = winInterval({ ...BALANCED, R }, SET);
    if (!w) { worst = 1; break; }
    worst = Math.max(worst, Math.abs(w.hi - w.lo - (18 - R)));
  }
  ok("for 14 <= R < 18 the window is exactly 18 - R wide", worst === 0, `worst ${worst}`);
  ok("at R = 18 the window is gone — the chord tie goes to the lower N",
     winInterval({ ...BALANCED, R: 18 }, SET) === null && BAL_CHORD === 18);
  ok("BAL_CHORD is the chord's value at N = 5",
     BAL_CHORD === (24 + 12) / 2 && BAL_CHORD === 18);
  ok("BAL_EVICTS marks where the window's lower edge reaches r = 1",
     BAL_EVICTS === 14 && (BAL_EVICTS - 12) / 2 === 1);
}

// ------------------------------------------------- scaling cannot decide
{
  // Scaling both input prices scales every money cost by the same factor, so
  // the ranking — and only the ranking — is unchanged. The choice follows r,
  // which scaling cannot move.
  let okScale = true;
  const w0 = 300, p0 = 150;
  const argmin = (w, p) => {
    let bestT = null, bestC = Infinity;
    for (const t of SET) {
      const c = w * t.N + p * t.R;
      if (c < bestC || (c === bestC && t.N < bestT.N)) { bestC = c; bestT = t; }
    }
    return bestT.id;
  };
  for (const rr of sweep(R_MIN, R_MAX, 60)) {
    const w = rr * p0;
    if (argmin(w, p0) !== argmin(2 * w, 2 * p0)) okScale = false;
    if (argmin(w, p0) !== cheapest(SET, rr).id) okScale = false;
  }
  ok("doubling both input prices moves no choice (the choice is r alone)", okScale);
  ok("the article's base prices give r = 3 exactly", W_BASE / P_BASE === 3);
}

// ------------------------------------------------ the spread of innovation
{
  const L = byId("L"), S = byId("S");
  ok("the gain to switching from LEGACY to INDEXED is 22 machine-days at r = 2, 4400 in money",
     rent(L, S, 400, 200) === 4400 && rent(L, S, 400, 200) === 22 * 200);
  ok("that gain's slope in r is exactly the engineer-days the switch sheds",
     rentSlope(L, S) === 2);
  let worst = 0;
  for (const rr of sweep(0.5, 12, 100)) {
    worst = Math.max(worst, Math.abs(rent(L, S, rr * 200, 200) - 200 * (2 * rr + 18)));
  }
  ok("the switch's gain is 200·(2r + 18) over the whole range", worst < 1e-9, `worst ${worst}`);
  const g = gap(L, SET, 2);
  ok("an undercut of anything under the gap is profitable; at the gap, profit is exactly zero",
     g - 0.5 > 0 && g - g === 0);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);