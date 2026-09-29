// Every number the page states. Route A is src/margin.js (the account and the
// closed forms). Route B never uses them: it finds the call by bisection on the
// account's own balance sheet, meets the call by actually trading, and counts
// calls in simulated years with its own random numbers.
import * as M from "../src/margin.js";
import { mulberry32 } from "../src/random.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

// route B: the call price by bisection on equity - k * shares, from the balance sheet alone
function bisectCall(side, m, k) {
  const gap = (P) => {
    const shares = 100 * P;
    const equity = side === "long" ? shares - (1 - m) * 100 * 100 : (1 + m) * 100 * 100 - shares;
    return equity - k * shares;
  };
  let lo = side === "long" ? 1e-9 : 100, hi = side === "long" ? 100 : 1e4;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if ((gap(mid) > 0) === (side === "long")) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}

console.log("-- the long");
{
  const a0 = M.account("long", 100);
  eq("we put in $5,000 and borrow $5,000", a0.equity * 1e4 + a0.loan, 5000 * 1e4 + 5000, 0);
  eq("leverage starts at 2", a0.leverage, 2, 1e-12);
  eq("the call comes at $66.67", r(M.callPrice("long")), 66.67, 0);
  eq("by bisection on the balance sheet too", M.callPrice("long"), bisectCall("long", 0.5, 0.25), 1e-12);
  eq("a fall of a third", M.callMove("long"), 1 / 3, 1e-12);
  const ac = M.account("long", M.callPrice("long"));
  eq("two thirds of our $5,000 is gone at the call", ac.lost, 2 / 3, 1e-12);
  eq("leverage is 4 at the call", ac.leverage, 4, 1e-12);
  eq("the equity falls $100 per dollar of price, the requirement $25", (M.account("long", 90).equity - M.account("long", 89).equity) * 1000 + 0.25 * 100, 100025, 1e-12);
  eq("wiped out at $50, a fall of 50%", M.wipePrice("long"), 50, 0);
  truth("status: fine above the call, a call below it, wiped out below $50", M.account("long", 67).status === "fine" && M.account("long", 66).status === "call" && M.account("long", 49).status === "wiped");
  // every m and k: the fall formula agrees with bisection, and leverage at the call is 1/k
  let worst = 0, lw = 0;
  for (let m = 0.3; m <= 0.95; m += 0.05) for (let k = 0.1; k < m; k += 0.05) {
    worst = Math.max(worst, Math.abs(M.callPrice("long", m, k) - bisectCall("long", m, k)), Math.abs(1 - M.callPrice("long", m, k) / 100 - (m - k) / (1 - k)));
    lw = Math.max(lw, Math.abs(M.account("long", M.callPrice("long", m, k), m, k).leverage - 1 / k));
  }
  truth("(m - k)/(1 - k) matches bisection for every initial and maintenance margin", worst < 1e-9, worst.toExponential(1));
  truth("leverage at the call is 1/k for every m and k", lw < 1e-9, lw.toExponential(1));
  eq("with no loan (m = 100%) there is no call", M.callPrice("long", 1, 0.25), 0, 0);
}

console.log("-- meeting the call after a gap to $60");
{
  const a = M.account("long", 60);
  eq("equity is $1,000", a.equity, 1000, 1e-12);
  eq("the broker wants $1,500", 0.25 * a.shares, 1500, 1e-12);
  eq("we're $500 short", a.shortfall, 500, 1e-12);
  eq("selling covers it only at $2,000 of shares", a.trade, 2000, 1e-12);
  eq("four times the shortfall", a.trade / a.shortfall, 4, 1e-12);
  // route B: actually sell $2,000 and repay the loan with it
  const shares = a.shares - 2000, loan = a.loan - 2000, equity = shares - loan;
  eq("after selling $2,000 and repaying the loan, equity is 25% of the shares", equity / shares, 0.25, 1e-12);
  truth("and selling a dollar less leaves us short", (shares + 1 - (loan + 1)) / (shares + 1) < 0.25);
  const b = M.account("short", 125);
  eq("a short at $125: buying back covers a $1,250 shortfall only at $4,166.67", r(b.trade), 4166.67, 0);
  const owe = b.shares - b.trade, cash = b.cash - b.trade;
  eq("after buying back, equity is 30% of the shares we owe", (cash - owe) / owe, 0.3, 1e-12);
}

console.log("-- the short");
{
  const s0 = M.account("short", 100);
  eq("the account holds $15,000 and our equity is $5,000", s0.cash * 1e4 + s0.equity, 15000 * 1e4 + 5000, 0);
  eq("the call comes at $115.38", r(M.callPrice("short")), 115.38, 0);
  eq("by bisection too", M.callPrice("short"), bisectCall("short", 0.5, 0.3), 1e-12);
  eq("a rise of 15.4%", r(100 * M.callMove("short"), 1), 15.4, 0);
  eq("30.8% of the deposit is lost at the call", r(100 * M.account("short", M.callPrice("short")).lost, 1), 30.8, 0);
  eq("leverage at the call is 1/0.3", M.account("short", M.callPrice("short")).leverage, 1 / 0.3, 1e-12);
  eq("wiped out at $150, a rise of 50%", M.wipePrice("short"), 150, 0);
  eq("with the same 25% rule a short is called after a rise of 20%", M.callMove("short", 0.5, 0.25), 0.2, 1e-12);
  let worst = 0;
  for (let m = 0.3; m <= 1; m += 0.05) for (let k = 0.1; k < Math.min(0.5, m); k += 0.05) worst = Math.max(worst, Math.abs(M.callPrice("short", m, k) - bisectCall("short", m, k)), Math.abs(M.callPrice("short", m, k) / 100 - 1 - (m - k) / (1 + k)));
  truth("(m - k)/(1 + k) matches bisection for every m and k", worst < 1e-9, worst.toExponential(1));
  truth("at the same m and k the short is always called after a smaller move than the long", (() => { for (let m = 0.3; m <= 0.9; m += 0.05) for (let k = 0.1; k < m; k += 0.05) if (!(M.callMove("short", m, k) < M.callMove("long", m, k))) return false; return true; })());
  truth("the short's loss grows without a ceiling as the price rises", M.account("short", 400).equity < M.account("short", 300).equity && M.account("short", 300).equity < -10000);
}

console.log("-- how far, in the way prices move");
{
  eq("log distance to the long's call is 0.41", r(M.logDistance("long", 0.5, 0.25)), 0.41, 0);
  eq("and to the short's 0.14", r(M.logDistance("short", 0.5, 0.3)), 0.14, 0);
  const ratio = M.logDistance("long", 0.5, 0.25) / M.logDistance("short", 0.5, 0.3);
  truth("almost three times closer", ratio > 2.7 && ratio < 3, ratio.toFixed(3));
}

console.log("-- the chance of a call within a year");
{
  // Phi against a numerical integral of the normal density
  const dens = (t) => Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI);
  const PhiQ = (x) => { const a = -12, N = 20000, h = (x - a) / N; let s = dens(a) + dens(x); for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * dens(a + i * h); return (s * h) / 3; };
  let pw = 0; for (let x = -4; x <= 4; x += 0.25) pw = Math.max(pw, Math.abs(M.Phi(x) - PhiQ(x)));
  truth("the normal distribution function is right to 1e-7", pw < 1e-7, pw.toExponential(1));
  eq("30% volatility: a long is called with a chance of 17.7%", r(100 * M.callChance("long", 0.3), 1), 17.7, 0);
  eq("and a short with 63.3%", r(100 * M.callChance("short", 0.3), 1), 63.3, 0);
  truth("more than three times as often", M.callChance("short", 0.3) / M.callChance("long", 0.3) > 3 && M.callChance("short", 0.3) / M.callChance("long", 0.3) < 4);
  eq("20%: 4.3% for a long", r(100 * M.callChance("long", 0.2), 1), 4.3, 0);
  eq("and 47.4% for a short", r(100 * M.callChance("short", 0.2), 1), 47.4, 0);
  eq("which is eleven times", Math.round(M.callChance("short", 0.2) / M.callChance("long", 0.2)), 11, 0);
  truth("with a positive drift the long's chance falls and the short's rises", M.callChance("long", 0.3, 1, 0.5, 0.25, 0.05) < M.callChance("long", 0.3) && M.callChance("short", 0.3, 1, 0.5, 0.3, 0.05) > M.callChance("short", 0.3));
  // route B: simulate daily years with their own random numbers; daily checks miss some touches,
  // which shifts the level away by about 0.5826 sigma sqrt(dt) (Broadie, Glasserman and Kou)
  const u = mulberry32(4242); let spare = null;
  const z = () => { if (spare !== null) { const s = spare; spare = null; return s; } let a = 0; while (a === 0) a = u(); const b = u(); const rr = Math.sqrt(-2 * Math.log(a)); spare = rr * Math.sin(2 * Math.PI * b); return rr * Math.cos(2 * Math.PI * b); };
  for (const sig of [0.2, 0.3]) {
    const YEARS = 60000, dt = 1 / 252, bL = M.logDistance("long", 0.5, 0.25), bS = M.logDistance("short", 0.5, 0.3);
    let hL = 0, hS = 0;
    for (let y = 0; y < YEARS; y++) {
      let lp = 0, gotL = false, gotS = false;
      for (let d = 0; d < 252; d++) { lp += sig * Math.sqrt(dt) * z(); if (lp <= -bL) gotL = true; if (lp >= bS) gotS = true; }
      if (gotL) hL++; if (gotS) hS++;
    }
    const shift = 0.5826 * sig * Math.sqrt(dt);
    const pL = 2 * M.Phi(-(bL + shift) / sig), pS = 2 * M.Phi(-(bS + shift) / sig);
    const seL = Math.sqrt(pL * (1 - pL) / YEARS), seS = Math.sqrt(pS * (1 - pS) / YEARS);
    truth(`simulated daily years at ${100 * sig}% agree with the shifted formula within four standard errors`, Math.abs(hL / YEARS - pL) < 4 * seL && Math.abs(hS / YEARS - pS) < 4 * seS, `${(100 * hL / YEARS).toFixed(2)} vs ${(100 * pL).toFixed(2)}, ${(100 * hS / YEARS).toFixed(2)} vs ${(100 * pS).toFixed(2)}`);
    truth(`and daily checks find a call a little less often than the continuous formula at ${100 * sig}%`, hL / YEARS < M.callChance("long", sig) && hS / YEARS < M.callChance("short", sig));
  }
}

console.log("-- the lab's forty years");
{
  const count = (sig) => { const P = M.paths(40, sig, 21); let L = 0, S = 0; for (const p of P) { if (M.firstTouch(p, M.callPrice("long"), "long") >= 0) L++; if (M.firstTouch(p, M.callPrice("short"), "short") >= 0) S++; } return [L, S]; };
  const [L, S] = count(0.3);
  eq("at 30%, 7 of the 40 years call the long", L, 7, 0);
  eq("and 25 call the short", S, 25, 0);
  truth("the paths start at $100 and have no drift in the log on average", (() => { const P = M.paths(2000, 0.3, 5); const m = P.reduce((a, p) => a + Math.log(p[252] / 100), 0) / 2000; return Math.abs(m) < 4 * 0.3 / Math.sqrt(2000) && P.every((p) => p[0] === 100); })());
  truth("the same shocks are rescaled when the volatility changes", (() => { const a = M.paths(3, 0.2, 21), b = M.paths(3, 0.4, 21); return a.every((p, i) => Math.abs(Math.log(b[i][100] / 100) - 2 * Math.log(p[100] / 100)) < 1e-9); })());
}

console.log(fails ? `\n${fails} CHECKS FAILED of ${n}` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
