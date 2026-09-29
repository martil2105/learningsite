// Every number the page states, derived here. Route A is src/lifetime.js (the
// backward solution on a wealth grid). Route B solves small versions by brute
// force over whole strategies, with no value function at all, and checks the
// floor against its closed form.
import * as L from "../src/lifetime.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x, d = 0) => round(100 * x, d);
const { UP, DOWN, R, GAMMA: g } = L;

console.log("-- the market");
eq("premium of 5 points", (UP + DOWN) / 2 - R, 0.05, 1e-12);
eq("volatility of 18%", (UP - DOWN) / 2, 0.18, 1e-12);

console.log("-- Samuelson's case");
const S = L.solve("samuelson");
let worst = 0;
for (let k = 1; k <= 30; k++) for (let s = 0; s < 2; s++) for (let i = 0; i < L.GRID.length; i++) worst = Math.max(worst, Math.abs(S.share[k][s][i] - L.SAMUELSON_SHARE));
truth("the backward solution is flat at every horizon and wealth, to its search precision", worst < 1e-6, worst.toExponential(2));
truth("at about 84%", pc(L.SAMUELSON_SHARE) === 84, L.SAMUELSON_SHARE.toFixed(5));
truth("close to the Merton share's 77% (within 10 points)", Math.abs(L.SAMUELSON_SHARE - 0.05 / (2 * 0.18 * 0.18)) < 0.1);
{
  // Route B: two years by brute force over whole strategies (first share, then a share after up and after down)
  const u = (W) => Math.pow(W, 1 - g) / (1 - g);
  const EU = (p0, pu, pd) => {
    const w1u = R + p0 * (UP - R), w1d = R + p0 * (DOWN - R);
    if (w1u <= 0 || w1d <= 0) return -Infinity;
    const leg = (w, p) => { const a = w * (R + p * (UP - R)), b = w * (R + p * (DOWN - R)); return a > 0 && b > 0 ? 0.5 * u(a) + 0.5 * u(b) : -Infinity; };
    return 0.5 * leg(w1u, pu) + 0.5 * leg(w1d, pd);
  };
  let best = -Infinity, arg = null;
  for (let a = 0.5; a <= 1.2; a += 0.005) for (let b = 0.5; b <= 1.2; b += 0.005) for (let c = 0.5; c <= 1.2; c += 0.005) { const v = EU(a, b, c); if (v > best) { best = v; arg = [a, b, c]; } }
  truth("brute force over two-year strategies picks the same share every time (grid 0.005)", arg.every((p) => Math.abs(p - L.SAMUELSON_SHARE) < 0.006), arg.map((p) => p.toFixed(3)).join(", "));
}
eq("the one-year share satisfies its first-order condition", 0.5 * (UP - R) * Math.pow(R + L.SAMUELSON_SHARE * (UP - R), -g) + 0.5 * (DOWN - R) * Math.pow(R + L.SAMUELSON_SHARE * (DOWN - R), -g), 0, 1e-12);

console.log("-- a floor");
const F = L.solve("floor");
{
  let w = 0;
  for (const W of [1.1, 1.25, 1.6, 2, 3, 4, 8]) for (const k of [1, 2, 5, 10, 20, 30]) w = Math.max(w, Math.abs(L.shareAt(F, k, 0, W) - L.floorShare(W, k)));
  truth("the backward solution matches 'bonds for the floor, Samuelson's share for the rest'", w < 1e-4, w.toExponential(2));
}
truth("twice the floor: about 61% with thirty years to go", pc(L.shareAt(F, 30, 0, 2)) === 61);
truth("and about 43% with one", pc(L.shareAt(F, 1, 0, 2)) === 43);
truth("the lines slope down as time passes (every wealth, every year)", [1.25, 2, 4].every((W) => { for (let k = 2; k <= 30; k++) if (!(L.shareAt(F, k, 0, W) > L.shareAt(F, k - 1, 0, W))) return false; return true; }));
truth("and spread apart: richer holds more at every horizon", [1, 10, 30].every((k) => L.shareAt(F, k, 0, 4) > L.shareAt(F, k, 0, 2) && L.shareAt(F, k, 0, 2) > L.shareAt(F, k, 0, 1.25)));
truth("the floor's cost falls with the horizon", L.reserve(30, 1) < L.reserve(1, 1));

console.log("-- returns that revert");
const V = L.solve("revert");
eq("after an up year the chance of up is 0.4, and 0.6 after a down year; long-run average one half", 0.5 * (0.5 - L.REVERT) + 0.5 * (0.5 + L.REVERT), 0.5, 1e-15);
eq("one year to go, after a down year: the closed form", L.shareAt(V, 1, 1, 1), L.oneYearShare(0.6), 1e-6);
eq("one year to go, after an up year: the closed form", L.shareAt(V, 1, 0, 1), L.oneYearShare(0.4), 1e-6);
truth("after a down year: about 145% with one year to go", pc(L.shareAt(V, 1, 1, 1)) === 145);
truth("and about 153% with three or more", [3, 5, 10, 20, 30].every((k) => pc(L.shareAt(V, k, 1, 1)) === 153));
truth("after an up year: about 24% and 31%", pc(L.shareAt(V, 1, 0, 1)) === 24 && [3, 5, 10, 20, 30].every((k) => pc(L.shareAt(V, k, 0, 1)) === 31));
{
  const d = [0, 1].map((s) => L.shareAt(V, 30, s, 1) - L.shareAt(V, 1, s, 1));
  truth("about 8 points more in both states", d.every((x) => round(100 * x) === 8), d.map((x) => (100 * x).toFixed(2)).join(", "));
}
truth("wealth still doesn't matter (isoelastic)", Math.abs(L.shareAt(V, 30, 0, 4) - L.shareAt(V, 30, 0, 1)) < 1e-6 && Math.abs(L.shareAt(V, 30, 1, 0.5) - L.shareAt(V, 30, 1, 1)) < 1e-6);
truth("it stops growing after a couple of years", Math.abs(L.shareAt(V, 3, 1, 1) - L.shareAt(V, 30, 1, 1)) < 0.002 && Math.abs(L.shareAt(V, 2, 1, 1) - L.shareAt(V, 1, 1, 1)) > 0.05);
{
  // Route B: two years with reversion by brute force: first share (state known), then one share per outcome
  const u = (W) => Math.pow(W, 1 - g) / (1 - g);
  const run = (s0) => {
    const p0 = s0 === 1 ? 0.6 : 0.4;
    const leg = (w, p, pr) => { const a = w * (R + p * (UP - R)), b = w * (R + p * (DOWN - R)); return a > 0 && b > 0 ? pr * u(a) + (1 - pr) * u(b) : -Infinity; };
    let best = -Infinity, arg = null;
    for (let a = -0.2; a <= 2.2; a += 0.004) {
      const wu = R + a * (UP - R), wd = R + a * (DOWN - R); if (wu <= 0 || wd <= 0) continue;
      // the second-year shares are one-year problems; brute force them too
      let bu = -Infinity, bd = -Infinity;
      for (let c = -0.2; c <= 2.2; c += 0.004) { bu = Math.max(bu, leg(wu, c, 0.4)); bd = Math.max(bd, leg(wd, c, 0.6)); }
      const v = p0 * bu + (1 - p0) * bd; if (v > best) { best = v; arg = a; }
    }
    return arg;
  };
  for (const s0 of [0, 1]) eq(`two years to go, state ${s0}: brute force against the backward solution (grid 0.004)`, run(s0), L.shareAt(V, 2, s0, 1), 0.005);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
