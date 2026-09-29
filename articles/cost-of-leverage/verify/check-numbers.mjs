// Every number the page states. Route A is src/kink.js (closed forms). Route B
// never uses them: it maximises expected power utility numerically over one
// very short step to find the share, scans a coin-flip market for the same
// kink, solves a whole working life in that market by backward induction, and
// finds the certain return by scanning shares.
import * as K from "../src/kink.js";
import * as L from "../src/lifecycle.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x) => 100 * x;
const E = 0.05, S = 0.18, V = S * S, R = 0.02;

// route B: the share that maximises expected utility over one very short step -----------
// wealth grows by 1 + R dt + p (E dt + S sqrt(dt) z) - s dt max(p - 1, 0); z is standard normal, summed on a fine grid
const DT = 1 / 2000, ZS = []; { const nz = 2401, zmax = 8; let tot = 0; for (let i = 0; i < nz; i++) { const z = -zmax + (2 * zmax * i) / (nz - 1), w = Math.exp(-z * z / 2); ZS.push([z, w]); tot += w; } for (const q of ZS) q[1] /= tot; }
function utility(gam, x) { return gam === 1 ? Math.log(x) : Math.pow(x, 1 - gam) / (1 - gam); }
function value(gam, s, p) { let v = 0; const drift = 1 + R * DT + p * E * DT - s * DT * Math.max(p - 1, 0), sd = p * S * Math.sqrt(DT); for (const [z, w] of ZS) v += w * utility(gam, drift + sd * z); return v; }
function argmax(gam, s) { let a = 0, b = 8; const q = (Math.sqrt(5) - 1) / 2; let c = b - q * (b - a), d = a + q * (b - a), fc = value(gam, s, c), fd = value(gam, s, d); for (let i = 0; i < 70; i++) { if (fc < fd) { a = c; c = d; fc = fd; d = a + q * (b - a); fd = value(gam, s, d); } else { b = d; d = c; fd = fc; c = b - q * (b - a); fc = value(gam, s, c); } } return (a + b) / 2; }

console.log("-- the rule, against a numerical maximisation of expected utility over a short step");
{
  let worst = 0, where = "";
  for (const g of [0.5, 0.75, 0.9, 1, 1.25, 1.5, 2, 3]) for (const s of [0, 0.01, 0.02, 0.03, 0.04]) {
    const num = argmax(g, s), cl = K.share(g, s), err = Math.abs(num - cl) / Math.max(1, cl);
    if (err > worst) { worst = err; where = `g=${g} s=${s}: ${num.toFixed(4)} vs ${cl.toFixed(4)}`; }
  }
  truth("the closed form matches the numerical optimum within 1% at every risk aversion and spread on the grid", worst < 0.01, `${(100 * worst).toFixed(3)}% at ${where}`);
  eq("no spread: the share is e / (g sigma^2), 154% at a risk aversion of 1", round(pc(K.share(1, 0))), 154, 0);
  eq("and 77% at 2", round(pc(K.share(2, 0))), 77, 0);
  eq("its numerical optimum at 1 is 154%", round(pc(argmax(1, 0))), 154, 0);
  eq("its numerical optimum at 2 is 77%", round(pc(argmax(2, 0))), 77, 0);
}

console.log("-- the guess: a risk aversion of 1 and a spread of 2 points");
{
  eq("at the safe rate she holds 154%", round(pc(K.lenderShare(1))), 154, 0);
  eq("at the borrower's rate the rule gives 93%", round(pc(K.borrowerShare(1, 0.02))), 93, 0);
  truth("so she is pinned, and holds exactly 100%", K.regime(1, 0.02) === "pinned" && K.share(1, 0.02) === 1);
  eq("the numerical optimum agrees to a point", round(pc(argmax(1, 0.02))), 100, 0);
  truth("and the numerical optimum stays at 100% for a wider spread, 2 to 3 points", [0.02, 0.025, 0.03].every((s) => Math.abs(argmax(1, s) - 1) < 0.01));
}

console.log("-- the strip: risk aversions held at exactly 100%");
{
  for (const [s, lo] of [[0.01, 1.23], [0.02, 0.93], [0.03, 0.62], [0.04, 0.31], [0.05, 0]]) {
    eq(`spread ${100 * s} points: the strip starts at ${lo}`, round(K.bandLo(s), 2), lo, 0);
    eq(`spread ${100 * s} points: and ends at 1.54`, round(K.bandHi(), 2), 1.54, 0);
    eq(`spread ${100 * s} points: its width is s / sigma^2`, K.bandHi() - K.bandLo(s), s / V, 1e-12);
  }
  eq("each point widens it by 0.31", round(0.01 / V, 2), 0.31, 0);
  // route B: scan risk aversion for where the numerical optimum sits at 1
  for (const s of [0.02, 0.04]) {
    let lo = null, hi = null;
    for (let g = 0.3; g <= 2.2; g += 0.01) { const p = argmax(g, s); if (Math.abs(p - 1) < 0.02) { if (lo === null) lo = g; hi = g; } }
    truth(`spread ${100 * s} points: the numerical strip is within 0.06 of the closed form`, Math.abs(lo - K.bandLo(s)) < 0.06 && Math.abs(hi - K.bandHi()) < 0.06, `${lo.toFixed(2)} to ${hi.toFixed(2)} vs ${K.bandLo(s).toFixed(2)} to ${K.bandHi().toFixed(2)}`);
  }
  truth("at five points the loan costs all of the premium, and nobody borrows", [0.5, 0.6, 0.8, 1, 1.5].every((g) => K.share(g, 0.05) <= 1 + 1e-12 && (g < 1.543 ? K.share(g, 0.05) === 1 : true)));
  truth("above the strip the spread changes nothing", [1.55, 1.7, 2, 3, 4].every((g) => K.share(g, 0.02) === K.share(g, 0)));
  eq("at a risk aversion of 0.5 the share falls from 309% to 185% at 2 points", round(pc(K.share(0.5, 0))) * 1000 + round(pc(K.share(0.5, 0.02))), 309185, 0);
  truth("nobody with a risk aversion of 1 or more borrows at 2 points, and 0.9 still does, a little", [1, 1.1, 1.5, 2, 4].every((g) => K.share(g, 0.02) <= 1) && K.share(0.9, 0.02) > 1 && K.share(0.9, 0.02) < 1.05, K.share(0.9, 0.02).toFixed(4));
  truth("the share never rises with risk aversion, and a spread never raises it", (() => { for (const s of [0, 0.01, 0.02, 0.03, 0.05]) for (let g = 0.5; g < 4; g += 0.01) { if (K.share(g + 0.01, s) > K.share(g, s) + 1e-12) return false; if (K.share(g, s) > K.share(g, 0) + 1e-12) return false; } return true; })());
  truth("and the share is continuous at both ends of the strip", [0.01, 0.02, 0.03].every((s) => Math.abs(K.share(K.bandLo(s) - 1e-9, s) - 1) < 1e-6 && Math.abs(K.share(K.bandHi() + 1e-9, s) - 1) < 1e-6));
}

console.log("-- a coin-flip market: the same kink, exactly, over one year");
{
  const U = 1.25, D = 0.89, Rs = 1.02, Rb = 1.04;
  const eu = (g, x) => (g === 1 ? Math.log(x) : Math.pow(x, 1 - g) / (1 - g));
  const bf = (g) => { let best = -Infinity, arg = 0; for (let i = 0; i <= 6000; i++) { const p = i / 1000; const grow = (r) => (p <= 1 ? (1 - p) * Rs + p * r : Rb + p * (r - Rb)); const v = 0.5 * eu(g, grow(U)) + 0.5 * eu(g, grow(D)); if (v > best) { best = v; arg = p; } } return arg; };
  const one = (rate, g) => { const a = U - rate, b = rate - D; if (g === 1) return (rate * (a - b)) / (2 * a * b); const k = Math.pow(a / b, 1 / g); return (rate * (k - 1)) / (a + k * b); };
  const kink = (g) => { const a = one(Rs, g); if (a <= 1) return a; const b = one(Rb, g); return b >= 1 ? b : 1; };
  const glo = Math.log((U - Rb) / (Rb - D)) / Math.log(U / D), ghi = Math.log((U - Rs) / (Rs - D)) / Math.log(U / D);
  truth("the coin-flip strip runs from about 0.99 to 1.68 in risk aversion", Math.abs(glo - 0.9906) < 5e-4 && Math.abs(ghi - 1.6797) < 5e-4, `${glo.toFixed(4)} ${ghi.toFixed(4)}`);
  let worst = 0; for (const g of [0.8, 0.95, 1, 1.2, 1.5, 1.65, 1.7, 2, 3]) worst = Math.max(worst, Math.abs(bf(g) - kink(g)));
  truth("scanning every share from 0 to 6, the best share is the kinked rule at every risk aversion tried", worst < 2e-3, worst.toFixed(4));
  truth("and it is exactly 100% for every risk aversion inside the strip", [1, 1.2, 1.4, 1.6, 1.67].every((g) => bf(g) === 1));
  truth("but not outside it: 0.95 borrows, 1.7 lends", bf(0.95) > 1.001 && bf(1.7) < 0.999);
}

console.log("-- a working life");
{
  eq("at 25 and the safe rate the rule asks for about 43 times savings (the human capital article's 4,299%)", round(pc(K.life(25, 2, 0).share)), 4299, 0);
  eq("and the human capital module agrees", round(pc(L.ruleShare(25))), 4299, 0);
  const rows = [[0.02, 1879, 55, 62], [0.03, 1090, 48, 62], [0.04, 480, 38, 62]];
  for (const [s, sh, lev, lend] of rows) {
    eq(`spread ${100 * s} points: the share at 25`, round(pc(K.life(25, 2, s).share)), sh, 0);
    eq(`spread ${100 * s} points: she borrows until about ${lev}`, round(K.leverUntil(2, s)), lev, 0);
    eq(`spread ${100 * s} points: and lends from about ${lend}`, round(K.lendFrom(2, s)), lend, 0);
  }
  eq("at 1 point the share at 25 is 2,915%", round(pc(K.life(25, 2, 0.01).share)), 2915, 0);
  eq("at 5 points she holds exactly 100% at 25", K.life(25, 2, 0.05).share, 1, 0);
  truth("and she never borrows at 5 points, and holds 100% until 62", K.leverUntil(2, 0.05) === 25 && Math.abs(K.lendFrom(2, 0.05) - 61.85) < 0.05 && K.life(40, 2, 0.05).share === 1);
  eq("at the safe rate she borrows until about 62", round(K.leverUntil(2, 0)), 62, 0);
  truth("at 2 points she borrows until 54.75 (within a month)", Math.abs(K.leverUntil(2, 0.02) - 54.75) < 0.03, K.leverUntil(2, 0.02).toFixed(3));
  truth("the share at 25 with the spread is less than half of the share without", K.life(25, 2, 0.02).share / K.life(25, 2, 0).share < 0.5, (K.life(25, 2, 0.02).share / K.life(25, 2, 0).share).toFixed(3));
  // route B: the regimes in order, by scanning ages
  for (const g of [1, 2, 3, 4]) for (const s of [0.01, 0.02, 0.03, 0.04, 0.05]) {
    const order = { lever: 0, pinned: 1, lend: 2 }; let prev = -1, ok = true, cont = true, last = null;
    for (let a = 25; a <= 65 + 1e-9; a += 0.05) { const r = K.life(a, g, s), o = order[r.regime]; if (o < prev) ok = false; prev = o; if (last !== null && Math.abs(r.share - last) > 0.2 * Math.max(1, last) + 0.5) cont = false; last = r.share; }
    truth(`risk aversion ${g}, spread ${100 * s}: the regimes come in the order borrow, hold 100%, lend, and the share never jumps`, ok && cont);
  }
  eq("at 65 she holds the lender's 77% at risk aversion 2", round(pc(K.life(65, 2, 0.02).share)), 77, 0);
  truth("the share never goes below the lender's Merton share, and is 100% or more until she lends", (() => { for (let a = 25; a <= 65; a += 0.25) { const r = K.life(a, 2, 0.02); if (r.share < K.lenderShare(2) - 1e-12) return false; if (r.regime !== "lend" && r.share < 1 - 1e-12) return false; } return true; })());
}

console.log("-- the working-life rule against backward induction in a coin-flip market");
{
  // pay of 1 a year; utility of terminal wealth; up 1.25 or down 0.89; safe 1.02, borrow 1.04. The rule: hold pi_b (W + H_b) while borrowing,
  // W while pinned, pi_l (W + H) while lending, with each pi the one-year coin-flip share and H_b the pay valued at 1.04.
  const U = 1.25, D = 0.89, Rs = 1.02, Rb = 1.04, GAM = 2, T = 40;
  const PV = (k, rate) => (k <= 0 ? 0 : (1 - Math.pow(rate, -k)) / (rate - 1));
  const pi1 = (rate) => { const a = U - rate, b = rate - D, k = Math.pow(a / b, 1 / GAM); return (rate * (k - 1)) / (a + k * b); };
  const NG = 400, lo = Math.log(0.02), hi = Math.log(400), grid = Array.from({ length: NG }, (_, i) => lo + ((hi - lo) * i) / (NG - 1)), h = grid[1] - grid[0];
  const interp = (G, lw) => { let j = Math.floor((lw - grid[0]) / h); j = Math.max(0, Math.min(NG - 2, j)); const t = (lw - grid[j]) / h; return G[j] + t * (G[j + 1] - G[j]); };
  let G = grid.map((x) => (1 - GAM) * x); const policy = [null], q = (Math.sqrt(5) - 1) / 2;
  for (let k = 1; k <= T; k++) {
    const Hn = PV(k - 1, Rb), Hk = PV(k, Rb), Gn = new Float64Array(NG), Dn = new Float64Array(NG);
    for (let i = 0; i < NG; i++) {
      const W = Math.exp(grid[i]) - Hk;
      const f = (d) => { const nx = (up) => d * (up ? U : D) + (W - d) * (W - d >= 0 ? Rs : Rb) + 1 + Hn; const wu = nx(true), wd = nx(false); if (!(wu > 0 && wd > 0)) return Infinity; return 0.5 * Math.exp(interp(G, Math.log(wu))) + 0.5 * Math.exp(interp(G, Math.log(wd))); };
      // the feasible stock dollars keep both outcomes positive; find them by walking out from a feasible start
      let start = 0.5 * Math.max(W, 0.01); if (!Number.isFinite(f(start))) start = 0;
      let a = start, b = start; for (let it = 0; it < 80 && Number.isFinite(f(a - 0.3 * Math.abs(a) - 0.05)); it++) a -= 0.3 * Math.abs(a) + 0.05; for (let it = 0; it < 80 && Number.isFinite(f(b + 0.3 * Math.abs(b) + 0.05)); it++) b += 0.3 * Math.abs(b) + 0.05;
      a -= 0.5 * Math.abs(a) + 0.5; b += 0.5 * Math.abs(b) + 0.5;
      const edge = (inside, outside) => { for (let it = 0; it < 60; it++) { const m2 = (inside + outside) / 2; if (Number.isFinite(f(m2))) inside = m2; else outside = m2; } return inside; };
      const aa = Number.isFinite(f(a)) ? a : edge(start, a), bb = Number.isFinite(f(b)) ? b : edge(start, b);
      let x1 = aa, x2 = bb, c = x2 - q * (x2 - x1), d = x1 + q * (x2 - x1), fc = f(c), fd = f(d);
      for (let it = 0; it < 70; it++) { if (fc < fd) { x2 = d; d = c; fd = fc; c = x2 - q * (x2 - x1); fc = f(c); } else { x1 = c; c = d; fc = fd; d = x1 + q * (x2 - x1); fd = f(d); } }
      const best = (x1 + x2) / 2; Dn[i] = best; Gn[i] = Math.log(f(best));
    }
    G = Gn; policy.push(Dn);
  }
  const at = (k, W) => interp(policy[k], Math.log(W + PV(k, Rb)));
  const rule = (k, W) => { const a = pi1(Rs) * (W + PV(k, Rs)); if (a <= W) return { d: a, r: "lend" }; const b = pi1(Rb) * (W + PV(k, Rb)); return b > W ? { d: b, r: "lever" } : { d: W, r: "pinned" }; };
  let worst = 0, seen = new Set(), where = "";
  for (const k of [40, 30, 20, 10, 5, 2]) for (const W of [0.5, 2, 5, 10, 30]) { const dp = at(k, W), ru = rule(k, W); seen.add(ru.r); const err = Math.abs(dp - ru.d) / ru.d; if (err > worst) { worst = err; where = `${k} years left, W=${W}: ${dp.toFixed(3)} vs ${ru.d.toFixed(3)} (${ru.r})`; } }
  truth("the rule matches backward induction within 3% of the stock held at 30 states, in all three regimes", worst < 0.03 && seen.size === 3, `${(100 * worst).toFixed(2)}% at ${where}; regimes ${[...seen].join(",")}`);
  truth("and while she lends the rule is close to exact", (() => { const dp = at(2, 30), ru = rule(2, 30); return ru.r === "lend" && Math.abs(dp - ru.d) / ru.d < 0.005; })());
  truth("and while she is pinned the dynamic programme holds all of her wealth", [[10, 10], [5, 5], [2, 5], [10, 30]].every(([k, W]) => Math.abs(at(k, W) / W - 1) < 0.005));
}

console.log("-- the return given up");
{
  // route B: the certain return by scanning shares from 0 to 8
  const cer = (g, s, p) => R + E * p - s * Math.max(p - 1, 0) - 0.5 * g * V * p * p;
  const scan = (g, s) => { let b = -Infinity, arg = 0; for (let i = 0; i <= 8000; i++) { const p = i / 1000, v = cer(g, s, p); if (v > b) { b = v; arg = p; } } return { b, arg }; };
  let worst = 0; for (const g of [0.5, 0.75, 1, 1.25, 1.5, 2]) for (const s of [0, 0.01, 0.02, 0.05]) { const r = scan(g, s); worst = Math.max(worst, Math.abs(r.b - K.best(g, s)), Math.abs(r.arg - K.share(g, s)) * 1e-3); }
  truth("the closed-form best share and its certain return match a scan of every share from 0 to 8", worst < 1e-6, worst.toExponential(2));
  eq("at a risk aversion of 1 and 2 points the return given up is 0.5 points a year", round(pc(K.given(1, 0.02)), 1), 0.5, 0);
  eq("at 0.75 it is 1.3", round(pc(K.given(0.75, 0.02)), 1), 1.3, 0);
  eq("at 0.5 it is 2.9", round(pc(K.given(0.5, 0.02)), 1), 2.9, 0);
  truth("a saver who would never have borrowed loses nothing", [1.55, 2, 3, 4].every((g) => K.given(g, 0.02) === 0));
  truth("the loss is never negative, rises with the spread, and falls with risk aversion", (() => { for (let g = 0.5; g <= 4; g += 0.05) for (const s of [0.01, 0.02, 0.03, 0.05]) { if (K.given(g, s) < -1e-12) return false; if (K.given(g, s + 0.005) < K.given(g, s) - 1e-12) return false; if (K.given(g + 0.05, s) > K.given(g, s) + 1e-12) return false; } return true; })());
  eq("the Sharpe ratio for a lender is 0.28", round(E / S, 2), 0.28, 0);
  eq("and for a borrower at 2 points 0.17", round(K.sharpe(0.02), 2), 0.17, 0);
  eq("the reward left is the square of the Sharpe ratios' ratio", K.kept(0.02), Math.pow(K.sharpe(0.02) / K.sharpe(0), 2), 1e-12);
  for (const [s, k] of [[0.01, 64], [0.02, 36], [0.03, 16], [0.04, 4]]) eq(`${100 * s} points: ${k}% of the reward is left`, round(pc(K.kept(s))), k, 0);
  // route B for the reward: the best certain return above the funding rate, for a saver who borrows either way (risk aversion 0.5)
  for (const s of [0.01, 0.02, 0.03]) { const g = 0.5, a = scan(g, 0).b - R, b = scan(g, s).b - (R + s); eq(`${100 * s} points: by scanning, the reward above the funding rate is ${round(pc(K.kept(s)))}% of what it was`, b / a, K.kept(s), 1e-5); }
  truth("the chart's window (0 to 4 points) holds the loss at every risk aversion and spread the sliders allow", (() => { let mx = 0; for (let g = 0.5; g <= 4; g += 0.05) for (let s = 0; s <= 0.05 + 1e-9; s += 0.0025) mx = Math.max(mx, K.given(g, s)); return mx < 0.04; })());
}

console.log("-- what the drawn windows can show");
{
  truth("the first chart's window runs to 320%, and both lines are inside it at every risk aversion from 0.5", K.share(0.5, 0) < 3.2 && K.share(0.5, 0) > 3.0);
  truth("the working-life window runs to 320%: the plan line is inside it by 45 at a risk aversion of 2 and a spread of 2 points", K.life(45, 2, 0.02).share < 3.2 && K.life(25, 2, 0.02).share > 3.2);
  truth("and the strip's left edge is clamped to the chart's left end at five points", K.bandLo(0.05) < 0.5);
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
