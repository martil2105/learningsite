// Every number the page states, re-derived from src/growth.js. The second route
// rolls the firm forward year by year (book, earnings, dividend) for 4,000 years
// and discounts the dividends, without using the closed forms.
import * as G from "../src/growth.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r1 = (x) => Math.round(x * 10) / 10, r0 = (x) => Math.round(x);
const R = G.R;

// route B: the firm year by year
function rolled({ r = R, roe, g, years = 4000 }) {
  let B = 1 / roe, P = 0;
  for (let t = 1; t <= years; t++) {
    const E = roe * B, D = E * (1 - g / roe);
    P += D / Math.pow(1 + r, t);
    B += E * (g / roe);
  }
  return { P, B0: 1 / roe };
}

console.log("-- the guess card");
{
  const A = G.value({ roe: 0.08, g: 0 }), B = G.value({ roe: 0.08, g: 0.04 });
  eq("Firm A is worth $12.50", A.P, 12.5, 1e-12);
  eq("Firm B reinvests half", B.b, 0.5, 1e-12);
  eq("and pays out 50 cents next year", B.D1, 0.5, 1e-12);
  eq("and is worth $12.50 too", B.P, 12.5, 1e-12);
  eq("so both have a P/E of 12.5", B.PE, A.PE, 1e-12);
  eq("the year-by-year route agrees for Firm B", rolled({ roe: 0.08, g: 0.04 }).P, 12.5, 1e-9);
  eq("Firm B trades at its book value", B.PB, 1, 1e-12);
}

console.log("-- what growth costs");
{
  eq("half payout and 4% growth needs an ROE of 8%", 0.04 / 0.5, 0.08, 1e-12);
  eq("half payout and 6% growth needs an ROE of 12%", 0.06 / 0.5, 0.12, 1e-12);
  let worst = 0;
  for (let roe = 0.04; roe <= 0.2001; roe += 0.01) for (let g = 0; g < Math.min(roe, 0.075); g += 0.005) {
    const a = G.value({ roe, g }).P, b = rolled({ roe, g }).P;
    worst = Math.max(worst, Math.abs(a - b) / b);
  }
  truth("the closed-form price matches the year-by-year route across ROE 4–20% and growth 0–7.5%", worst < 1e-9, `worst relative gap ${worst.toExponential(1)}`);
  let flat = 0;
  for (let g = 0; g < 0.08; g += 0.0005) flat = Math.max(flat, Math.abs(G.peOf(R, g, R) - 12.5));
  truth("at ROE = r the P/E is 12.5 at every growth rate", flat < 1e-12, `largest gap ${flat.toExponential(1)}`);
  eq("that's 1/r", G.flatPE(), 12.5, 1e-12);
}

console.log("-- growth on a chart (the lab's opening firm)");
{
  const v = G.value({ roe: 0.12, g: 0.06 });
  eq("ROE 12%, growth 6%: a P/E of 25", v.PE, 25, 1e-12);
  eq("twice Firm A's multiple", v.PE / 12.5, 2, 1e-12);
  eq("price to book 3", v.PB, 3, 1e-12);
  eq("pays out half", 1 - v.b, 0.5, 1e-12);
  eq("worth $12.50 with no growth", v.noGrowth, 12.5, 1e-12);
  eq("growth is worth $12.50", v.pvgo, 12.5, 1e-12);
  eq("which is half the price", v.growthShare, 0.5, 1e-12);
  eq("earnings yield 4%", v.EY, 0.04, 1e-12);
  const w = G.value({ roe: 0.06, g: 0.03 });
  eq("ROE 6%, growth 3%: the P/E falls to 10", w.PE, 10, 1e-12);
  eq("and growth is worth −$2.50", w.pvgo, -2.5, 1e-12);
  let start = 0;
  for (let roe = 0.04; roe <= 0.2001; roe += 0.005) start = Math.max(start, Math.abs(G.peOf(R, 0, roe) - 12.5));
  truth("every curve starts at 12.5 with no growth", start < 1e-12);
  let order = true;
  const fam = [0.04, 0.06, 0.08, 0.1, 0.12, 0.16, 0.2];
  for (let g = 0.001; g < 0.04; g += 0.001) for (let i = 1; i < fam.length; i++) if (!(G.peOf(R, g, fam[i]) > G.peOf(R, g, fam[i - 1]))) order = false;
  truth("the grey curves are ordered: a higher ROE gives a higher P/E at any positive growth", order);
  // the lab never needs a P/E above its 50 window at the slider limits (growth up to 6.5%)
  eq("the highest P/E the lab can reach (ROE 20%, growth 6.5%) is 45", G.peOf(R, 0.065, 0.2), 45, 1e-12);
  truth("so the dot always stays inside the chart, whose top is 50", G.peOf(R, 0.065, 0.2) < 50);
}

console.log("-- how much of the price is growth");
{
  let sign = true, closed = 0, pb = 0;
  for (let roe = 0.04; roe <= 0.2001; roe += 0.005) for (let g = 0.0025; g < Math.min(roe, 0.075); g += 0.0025) {
    const v = G.value({ roe, g });
    if (Math.sign(Math.round(v.pvgo * 1e12)) !== Math.sign(Math.round((roe - R) * 1e12))) sign = false;
    closed = Math.max(closed, Math.abs(v.pvgo - v.noGrowth * G.pvgoRatio(R, g, roe)));
    pb = Math.max(pb, Math.abs(v.PB - 1 - (roe - R) / (R - g)));
  }
  truth("PVGO has the sign of ROE − r everywhere on the grid", sign);
  truth("PVGO equals (E1/r)·g/(r − g)·(1 − r/ROE)", closed < 1e-9, closed.toExponential(1));
  truth("P/B − 1 equals (ROE − r)/(r − g)", pb < 1e-9, pb.toExponential(1));
  eq("PVGO at 12%/6% from the formula is $12.50", G.pvgoRatio(R, 0.06, 0.12) * 12.5, 12.5, 1e-12);
}

console.log("-- how long the margin has to last");
{
  const A = { roe: 0.12, g: 0.06 }, B = { roe: 0.2, g: 0.05 };
  const pe = (N, f) => 12.5 + G.pvgoFor(N, f);
  eq("ten years at 12% gives a P/E of 14.6", r1(pe(10, A)), 14.6, 0);
  eq("thirty years gives 17.9", r1(pe(30, A)), 17.9, 0);
  eq("for ever gives 25", G.value(A).PE, 25, 1e-12);
  truth("150 years still falls short of 25", pe(150, A) < 25, pe(150, A).toFixed(2));
  const q = (f) => (1 + f.g) / (1 + R);
  let fade = 0;
  for (const f of [A, B]) for (let N = 0; N <= 150; N += 5) fade = Math.max(fade, Math.abs(G.pvgoFor(N, f) - G.value(f).pvgo * (1 - Math.pow(q(f), N))));
  truth("the year-by-year fade sums equal PVGO·(1 − ((1+g)/(1+r))^N)", fade < 1e-9, fade.toExponential(1));
  const half = (f) => Math.log(0.5) / Math.log(q(f));
  eq("half the value of growth comes after year 37", r0(half(A)), 37, 0);
  eq("at that year the P/E is half-way between 12.5 and 25", 12.5 + G.value(A).pvgo * (1 - Math.pow(q(A), half(A))), 18.75, 1e-12);
  eq("the second firm also reaches 25", G.value(B).PE, 25, 1e-12);
  eq("ten years give it 15.6", r1(pe(10, B)), 15.6, 0);
  eq("and half its growth value is earned by about year 25", r0(half(B)), 25, 0);
  let faster = true;
  for (let N = 1; N <= 150; N++) if (!(pe(N, B) > pe(N, A))) faster = false;
  truth("the second firm's curve is above the first at every horizon", faster);
}

console.log("-- one P/E, a line of stories");
{
  eq("P/E 20 and P/B 3 mean an ROE of 15%", G.impliedROE(20, 3), 0.15, 1e-12);
  eq("with no growth the required return is 5%", G.impliedR(20, 3, 0), 0.05, 1e-12);
  eq("growing 3% it is 7%", G.impliedR(20, 3, 0.03), 0.07, 1e-12);
  eq("growing 6% it is 9%", G.impliedR(20, 3, 0.06), 0.09, 1e-12);
  let back = 0;
  for (let g = 0; g < 0.07; g += 0.0025) back = Math.max(back, Math.abs(G.peOf(G.impliedR(20, 3, g), g, 0.15) - 20));
  truth("every point on the line prices the share at 20 times earnings", back < 1e-9, back.toExponential(1));
  let flat = 0;
  for (let g = 0; g < 0.07; g += 0.0025) flat = Math.max(flat, Math.abs(G.impliedR(12.5, 1, g) - 0.08));
  truth("at book the required return is the 8% earnings yield whatever the growth", flat < 1e-15);
  truth("below book the line slopes down", G.impliedR(12.5, 0.6, 0.03) < G.impliedR(12.5, 0.6, 0));
  eq("the below-book preset earns 4.8% on equity", G.impliedROE(12.5, 0.6), 0.048, 1e-12);
}

console.log(`\n${n - fails} of ${n} checks pass`);
if (fails) process.exit(1);
