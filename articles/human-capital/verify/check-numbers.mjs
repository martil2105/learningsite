// Every number the page states, derived here. Route A is src/lifecycle.js.
// Route B values the paydays one by one, runs the savings plan year by year,
// finds ages by scanning rather than bisection, and checks the rule itself
// (stocks = share x (savings + future pay)) by brute force over whole
// strategies in a two-year coin-flip market with a safe wage.
import * as L from "../src/lifecycle.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const scan = (f, level) => { for (let a = 25; a <= 65; a += 0.001) if (f(a) <= level) return a; return NaN; };

console.log("-- the plan");
{
  let pv = 0; for (let t = 1; t <= 40; t++) pv += 1 / Math.pow(1.02, t);
  eq("future pay at 25, paydays summed one by one", L.futurePay(25), pv, 1e-12);
  let w = 0.5; for (let a = 25; a < 45; a++) w = w * 1.04 + 0.1;
  eq("savings at 45, the plan run year by year", L.savings(45), w, 1e-12);
}
truth("future pay at 25 is about 27 years of pay", round(L.futurePay(25)) === 27);
truth("fifty-five times our savings", round(L.futurePay(25) / L.savings(25)) === 55);
eq("the Merton share is about 77%", round(100 * L.MERTON), 77, 0);

console.log("-- the rule");
for (const [a, b] of [[25, 0], [40, 0.3], [60, 0.9]]) eq(`share = stocks wanted / savings (age ${a}, beta ${b})`, L.ruleShare(a, b), (L.MERTON * (L.savings(a) + L.futurePay(a)) - b * L.futurePay(a)) / L.savings(a), 1e-12);
truth("at 25 about 4,300%", round(L.ruleShare(25) * 100, -2) === 4300, (100 * L.ruleShare(25)).toFixed(1));
truth("forty-three times our savings", round(L.ruleShare(25)) === 43);
eq("which is 77% of everything we own", (L.ruleShare(25) * L.savings(25)) / (L.savings(25) + L.futurePay(25)), L.MERTON, 1e-12);
{
  const a10 = scan((a) => L.futurePay(a) / L.savings(a), 10);
  truth("future pay is ten times savings in our mid-thirties", a10 >= 34 && a10 < 37, a10.toFixed(2));
  truth("and the share there is about 850%", round(100 * L.ruleShare(a10), -1) === 850, (100 * L.ruleShare(a10)).toFixed(1));
}
truth("below 300% at about 48", round(scan((a) => L.ruleShare(a), 3)) === 48 && round(L.ageWhenShareFalls(3)) === 48);
truth("below 200% at about 53", round(scan((a) => L.ruleShare(a), 2)) === 53 && round(L.ageWhenShareFalls(2)) === 53);
truth("below 100% at about 62", round(scan((a) => L.ruleShare(a), 1)) === 62 && round(L.ageWhenShareFalls(1)) === 62);
eq("back at the Merton share at 65", L.ruleShare(65), L.MERTON, 1e-12);
truth("the share falls at every age", (() => { for (let a = 25; a < 65; a += 0.25) if (!(L.ruleShare(a + 0.25) < L.ruleShare(a))) return false; return true; })());
truth("about 21 years of pay in stocks at 25", round(L.ruleDollars(25)) === 21);
truth("and about 9 at 65", round(L.ruleDollars(65)) === 9);
truth("the rule's stock money falls with age while savings rise", (() => { for (let a = 25; a < 65; a++) if (!(L.ruleDollars(a + 1) < L.ruleDollars(a) && L.savings(a + 1) > L.savings(a))) return false; return true; })());

console.log("-- pay that moves with stocks");
truth("at beta equal to the Merton share the share is flat", [25, 35, 50, 64].every((a) => Math.abs(L.ruleShare(a, L.MERTON) - L.MERTON) < 1e-12));
truth("about 77% is that level", round(100 * L.MERTON) === 77);
{
  const shortUntil = scan((a) => -L.ruleShare(a, 1), 0);
  truth("at 100%, short until about 47", round(shortUntil) === 47 && L.ruleShare(25, 1) < 0, shortUntil.toFixed(2));
  let b = 0; while (L.ruleShare(25, b) > 1) b += 1e-4;
  truth("a 25-year-old's rule is above 100% unless about three quarters of pay moves with stocks", Math.abs(b - 0.75) < 0.03, b.toFixed(4));
}

console.log("-- a borrowing limit");
truth("no borrowing: at 100% until about 62", round(scan((a) => L.cappedShare(a, 1), 0.9999)) === 62);
truth("a 200% limit: at the limit until about 53", round(scan((a) => L.cappedShare(a, 2), 1.9999)) === 53);
truth("within the limit never above the rule", [1, 2].every((c) => { for (let a = 25; a <= 65; a += 0.5) if (L.cappedShare(a, c) > L.ruleShare(a) + 1e-12) return false; return true; }));

console.log("-- the rule itself, by brute force (two years, coin-flip market, safe wage)");
{
  const UP = 1.25, DOWN = 0.89, RR = 1.02, g = 2, y = 1, W = 0.5;
  const A = UP - RR, B = RR - DOWN, k = Math.pow(A / B, 1 / g), share = (RR * (k - 1)) / (A + k * B); // one-year isoelastic share
  const u = (w) => Math.pow(w, 1 - g) / (1 - g);
  // dollars d0 now, then d1 after each first-year outcome; wage y arrives at the end of each year
  const leg = (w1, d1) => { const a = w1 * RR + d1 * A + y, b = w1 * RR - d1 * B + y; return a > 0 && b > 0 ? 0.5 * u(a) + 0.5 * u(b) : -Infinity; };
  let best = -Infinity, arg = 0;
  for (let d0 = 0; d0 <= 3; d0 += 0.002) {
    const wu = W * RR + d0 * A + y, wd = W * RR - d0 * B + y;
    if (wu <= 0 || wd <= 0) continue;
    let bu = -Infinity, bd = -Infinity;
    for (let d1 = 0; d1 <= 4; d1 += 0.004) { bu = Math.max(bu, leg(wu, d1)); bd = Math.max(bd, leg(wd, d1)); }
    const v = 0.5 * bu + 0.5 * bd; if (v > best) { best = v; arg = d0; }
  }
  const H = y / RR + y / (RR * RR);
  eq("first-year stock money = share x (savings + future pay), by brute force (grid 0.002)", arg, share * (W + H), 0.004);
  truth("which is several times the savings themselves", arg / W > 2, (arg / W).toFixed(2));
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
