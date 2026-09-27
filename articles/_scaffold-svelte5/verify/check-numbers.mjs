/*
  Re-derives every number the page asserts, from the same modules the page
  imports, with no build step. Write the check for the SENTENCE, not only for the
  number in it — a figure staying correct while the sentence around it stops
  being true is the failure this file exists for.

  What is here is the scaffold's own arithmetic. Replace it, and keep the shape:
  identities to machine precision wherever the subject has a theorem in it, and
  two derivations of the same quantity that share no code.
*/
import { linear, log, ticks, clampW } from "../src/chart.js";

let pass = 0;
const fails = [];

function ok(claim, cond, detail = "") {
  if (cond) {
    pass++;
  } else {
    fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
  }
}

function close(a, b, tol = 1e-12) {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}

// --- the scale is a bijection on its own range -----------------------------
// The lab converts a pointer position back to data units and then to a slope.
// If invert is not the exact inverse, the handle stops sitting on the line and
// the readout stops matching the drawing.
{
  const y = linear(0, 6, 260 - 34, 16);
  let worst = 0;
  for (let i = 0; i <= 1000; i++) {
    const v = (6 * i) / 1000;
    worst = Math.max(worst, Math.abs(y.invert(y(v)) - v));
  }
  ok(
    "the lab's y scale inverts to machine precision over its whole domain",
    worst < 1e-12,
    `worst round-trip error ${worst.toExponential(2)}`
  );
}

// --- the handle lies on the line, analytically ----------------------------
// The drawn line runs from (0, 0) to (4, 4a) and the handle sits at (3, 3a).
// Collinearity in SCREEN units is what check-browser.mjs asserts in rendered
// pixels; here it is asserted in the transform itself, at 200 slopes.
{
  const X_AT = 3;
  let worst = 0;
  for (let i = 0; i <= 200; i++) {
    const a = 0.2 + (1.6 * i) / 200;
    const W = 320 + (i % 7) * 53;
    const x = linear(0, 4, 46, W - 20);
    const y = linear(0, 6, 260 - 34, 16);
    const o = [x(0), y(0)];
    const e = [x(4), y(4 * a)];
    const h = [x(X_AT), y(X_AT * a)];
    // cross product of (e - o) and (h - o): zero iff the three are collinear
    const cross =
      (e[0] - o[0]) * (h[1] - o[1]) - (e[1] - o[1]) * (h[0] - o[0]);
    worst = Math.max(worst, Math.abs(cross));
  }
  ok(
    "the handle is collinear with the drawn line at every slope and every width",
    worst < 1e-9,
    `largest |cross| ${worst.toExponential(2)}`
  );
}

// --- clamping is a floor, not a transform ---------------------------------
{
  ok("a zero measured width clamps to the 260px floor", clampW(0) === 260);
  ok("a real measured width passes through untouched", clampW(741) === 741);
}

// --- the helpers do what their names say ----------------------------------
{
  const x = linear(0, 10, 0, 100);
  ok("linear maps the domain ends onto the range ends", close(x(0), 0) && close(x(10), 100));
  const l = log(1, 1000, 0, 300);
  ok("log is exact on its decades", close(l(1), 0) && close(l(1000), 300) && close(l(10), 100));
  const t = ticks(0, 4, 4);
  ok(
    "ticks stay inside the domain they were asked for",
    t.every((v) => v >= 0 && v <= 4) && t.length > 1,
    `got ${t.join(", ")}`
  );
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
