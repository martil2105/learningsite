/*
  Re-derives every number this article asserts, from the modules the page
  imports. Written for the SENTENCES, not only for the figures in them: the
  claim that two effects "cancel exactly" is the article, so it is asserted as
  an identity at zero tolerance rather than as a small number.
*/
import { linear, log as logScale, clampW } from "../src/chart.js";
import {
  optimum, optimumByFOC, optimumByMax, utility, mrs, hicks,
  logOddsLine, hoursElasticity, stoneGearyHours, stoneGearyByFOC,
} from "../src/choice.js";
import { BASE, W_MIN, W_MAX, SUB_W_MIN, SUB_W_MAX, CBAR_DEFAULT } from "../src/datasets.js";

let pass = 0;
const fails = [];
const ok = (claim, cond, detail = "") => {
  if (cond) pass++;
  else fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
};
const close = (a, b, tol = 1e-12) =>
  Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

const P = { a: BASE.a, sigma: 1, T: BASE.T };

// --- claim 4: the tangency IS the optimum ----------------------------------
// Closed form and a bisection on MRS = w share no algebra. They agree to 0 ulp,
// which is what makes "where the two rates agree" a derivation rather than a
// picture.
{
  // At sigma = 1 the two agree bit for bit, which is the case the article is
  // about. Off it, bisection lands within a few ulp of the closed form and no
  // closer, so that is asserted as machine precision rather than as identity.
  let worstCD = 0, worstAll = 0;
  for (const sigma of [0.4, 0.5, 0.8, 1, 1.25, 1.6, 2, 2.5]) {
    for (let i = 0; i <= 40; i++) {
      const w = 5 * Math.pow(200 / 5, i / 40);
      const p = { a: BASE.a, sigma, T: BASE.T };
      const d = Math.abs(optimum(w, p).f - optimumByFOC(w, p).f);
      worstAll = Math.max(worstAll, d);
      if (sigma === 1) worstCD = Math.max(worstCD, d);
    }
  }
  ok("at sigma = 1, closed form and FOC bisection agree bit for bit", worstCD === 0,
    `largest disagreement ${worstCD}`);
  ok("across the whole sigma range they agree to machine precision", worstAll < 1e-14,
    `largest disagreement ${worstAll.toExponential(2)}`);

  const o = optimum(45, P);
  ok("MRS equals the wage at the optimum", close(mrs(o.c, o.f, P), 45),
    `MRS ${mrs(o.c, o.f, P)}`);
}

// --- searching the maximum is the WORSE method, and the article says so -----
// A maximum is flat, so golden section stalls near sqrt(eps). Asserted in both
// directions: it must be close, and it must NOT be exact, or the sentence
// explaining why the condition is solved instead stops being true.
{
  let worst = 0;
  for (let i = 0; i <= 30; i++) {
    const w = 10 + i * 10;
    worst = Math.max(worst, Math.abs(optimum(w, P).f - optimumByMax(w, P).f));
  }
  ok("golden-section search agrees to about 2e-8", worst < 5e-7 && worst > 1e-10,
    `largest disagreement ${worst.toExponential(2)}`);
}

// --- claim 3, the article: at sigma = 1 the wage cancels --------------------
{
  let worst = 0, worstW = 0;
  for (let i = 0; i <= 8000; i++) {
    const w = Math.pow(10, -2 + i * (8 / 8000));   // 1e-2 .. 1e6
    const d = Math.abs(optimum(w, P).h - BASE.a * BASE.T);
    if (d > worst) { worst = d; worstW = w; }
  }
  ok("at sigma = 1 hours worked equal alpha*T at every wage, exactly",
    worst === 0, `worst ${worst} at w=${worstW}`);
  ok("and that value is the eight-hour day the prose names",
    optimum(45, P).h === 8);

  // the lab's own readout: hours move by 0.00 over the whole slider
  const spread = Math.abs(optimum(W_MAX, P).h - optimum(W_MIN, P).h);
  ok("the lab's wage slider moves hours worked by exactly zero", spread === 0,
    `spread ${spread}`);
}

// --- claim 1 and 2: the pieces are large, and they cancel -------------------
{
  const d = hicks(25, 400, P);
  ok("a 16-fold wage rise moves the substitution effect by exactly six hours",
    Math.abs(d.substitution + 6) < 1e-9, `SE ${d.substitution}`);
  ok("the income effect is the same six hours back",
    Math.abs(d.income - 6) < 1e-9, `IE ${d.income}`);
  ok("the two sum to exactly zero", d.substitution + d.income === 0,
    `sum ${d.substitution + d.income}`);
  ok("six hours is three quarters of the worker's free time",
    close(6 / d.f0, 0.75));

  // and it is not one lucky pair of wages
  let worstSum = 0;
  for (let i = 0; i <= 60; i++) {
    const w1 = 30 + i * (370 / 60);
    const h = hicks(25, w1, P);
    worstSum = Math.max(worstSum, Math.abs(h.substitution + h.income));
  }
  ok("the effects cancel at every wage change on the slider", worstSum < 1e-9,
    `worst |SE+IE| ${worstSum.toExponential(2)}`);
}

// --- the identity on screen ------------------------------------------------
// log(h/f) is linear in log w with slope sigma - 1, over the sigma range the
// slider offers and the wage range the figure draws.
{
  let worstResid = 0, worstSlope = 0;
  for (let s = 0; s <= 42; s++) {
    const sigma = 0.4 + s * (2.1 / 42);
    const p = { a: BASE.a, sigma, T: BASE.T };
    const xs = [], ys = [];
    for (let i = 0; i <= 200; i++) {
      const lw = (i / 200) * Math.log(1000);
      const o = optimum(Math.exp(lw), p);
      xs.push(lw); ys.push(Math.log(o.h / o.f));
    }
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
    const slope = sxy / sxx, icept = my - slope * mx;
    for (let i = 0; i < n; i++) {
      worstResid = Math.max(worstResid, Math.abs(ys[i] - (icept + slope * xs[i])));
    }
    worstSlope = Math.max(worstSlope, Math.abs(slope - (sigma - 1)));
  }
  ok("log(h/f) is linear in log w to a part in a trillion", worstResid < 1e-11,
    `worst residual ${worstResid.toExponential(2)}`);
  ok("and the slope measured off the drawn points is sigma - 1", worstSlope < 1e-11,
    `worst slope error ${worstSlope.toExponential(2)}`);

  // the drawn line and the solved model are the same object
  let worstLine = 0;
  for (const sigma of [0.4, 0.9, 1, 1.6, 2.5]) {
    const p = { a: BASE.a, sigma, T: BASE.T };
    for (let i = 0; i <= 50; i++) {
      const w = Math.exp((i / 50) * Math.log(1000));
      const o = optimum(w, p);
      worstLine = Math.max(worstLine, Math.abs(Math.log(o.h / o.f) - logOddsLine(w, p)));
    }
  }
  ok("the closed-form line passes through the solved points", worstLine < 1e-12,
    `worst gap ${worstLine.toExponential(2)}`);
}

// --- the sign of the response is the sign of sigma - 1 ----------------------
{
  let bad = null, worstEl = 0;
  for (let s = 0; s <= 40; s++) {
    const sigma = 0.4 + s * (2.1 / 40);
    const p = { a: BASE.a, sigma, T: BASE.T };
    const lo = optimum(20, p).h, hi = optimum(2000, p).h;
    const expect = Math.sign(sigma - 1);
    if (Math.sign(hi - lo) !== expect && Math.abs(sigma - 1) > 1e-9) bad = sigma;
    const e = 1e-6, w = 50;
    const cd = (Math.log(optimum(w * (1 + e), p).h) - Math.log(optimum(w * (1 - e), p).h)) / (2 * e);
    worstEl = Math.max(worstEl, Math.abs(cd - hoursElasticity(w, p)));
  }
  ok("hours rise with the wage iff sigma > 1, over the whole slider", bad === null,
    `first failure at sigma=${bad}`);
  ok("the closed-form elasticity matches a central difference", worstEl < 1e-6,
    `worst gap ${worstEl.toExponential(2)}`);
  ok("at sigma = 1 the elasticity is exactly zero", hoursElasticity(50, P) === 0);
}

// --- the subsistence floor -------------------------------------------------
{
  const sp = { a: BASE.a, T: BASE.T, cbar: CBAR_DEFAULT };
  let worst = 0;
  for (let i = 0; i <= 60; i++) {
    const w = SUB_W_MIN * Math.pow(SUB_W_MAX / SUB_W_MIN, i / 60);
    worst = Math.max(worst, Math.abs(stoneGearyHours(w, sp) - stoneGearyByFOC(w, sp)));
  }
  ok("the Stone-Geary closed form is the same as bisecting its FOC", worst < 1e-9,
    `worst ${worst.toExponential(2)}`);

  let mono = true, above = true, prev = Infinity;
  for (let i = 0; i <= 4000; i++) {
    const w = SUB_W_MIN * Math.pow(SUB_W_MAX / SUB_W_MIN, i / 4000);
    const h = stoneGearyHours(w, sp);
    if (h > prev) mono = false;
    if (!(h > BASE.a * BASE.T)) above = false;
    prev = h;
  }
  ok("hours fall monotonically in the wage", mono);
  ok("and stay above alpha*T — approaching eight hours from above, never past it", above);
  ok("the limit is exactly the Cobb-Douglas answer",
    close(stoneGearyHours(1e12, sp), BASE.a * BASE.T, 1e-9));

  // the figure's own readout
  ok("the readout's two endpoints are what the prose implies",
    close(stoneGearyHours(10, sp), 10) && close(stoneGearyHours(400, sp), 8.05),
    `${stoneGearyHours(10, sp)} and ${stoneGearyHours(400, sp)}`);

  // the contrast curve really does collapse
  const ces = { a: BASE.a, sigma: 0.5, T: BASE.T };
  ok("a constant sigma below one drives hours towards zero instead",
    optimum(1e6, ces).h < 0.02, `h(1e6) = ${optimum(1e6, ces).h}`);
}

// --- drawing plumbing the pointer maths depends on -------------------------
{
  const y = linear(0, 90 * 16, 320 - 40, 18);
  let worst = 0;
  for (let i = 0; i <= 1000; i++) {
    const v = (90 * 16 * i) / 1000;
    worst = Math.max(worst, Math.abs(y.invert(y(v)) - v));
  }
  ok("the lab's consumption scale inverts to machine precision", worst < 1e-9,
    `worst round-trip ${worst.toExponential(2)}`);

  const lx = logScale(SUB_W_MIN, SUB_W_MAX, 52, 400);
  ok("the log scale is exact on the values the axis labels",
    close(lx.invert(lx(10)), 10) && close(lx.invert(lx(500)), 500));

  ok("a zero measured width clamps to the 260px floor", clampW(0) === 260);
  ok("a real measured width passes through untouched", clampW(741) === 741);
}

// --- utility is what the indifference curves claim it is -------------------
{
  const p = P;
  const U = utility(360, 8, p);
  let worst = 0;
  for (let i = 1; i <= 60; i++) {
    const f = 0.5 + (i / 60) * 15;
    const c = Math.pow(U / Math.pow(f, 1 - p.a), 1 / p.a);
    worst = Math.max(worst, Math.abs(utility(c, f, p) - U));
  }
  ok("every point drawn on one indifference curve has the same utility",
    worst < 1e-9, `worst ${worst.toExponential(2)}`);
}

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);
