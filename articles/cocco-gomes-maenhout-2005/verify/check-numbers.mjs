// Every number the page states. Route A is src/cgm.js (the solver) and the file
// it wrote, src/precomputed.js. Route B never forms a value function: a search
// over whole strategies for a two-year life, and a pure-wealth problem whose
// answer is a first-order condition and a recursion in closed form.
import * as C from "../src/cgm.js";
import * as P from "../src/policy.js";
import { DATA } from "../src/precomputed.js";
import { run, GRID } from "../scripts/precompute.mjs";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const pc = (x) => 100 * x;

console.log("-- the file the page reads is what the solver writes");
if (process.env.SKIP_FRESHNESS) console.log("skip freshness (SKIP_FRESHNESS set)");
else {
  const fresh = run();
  truth("src/precomputed.js is fresh: same keys", JSON.stringify(Object.keys(fresh)) === JSON.stringify(Object.keys(DATA)));
  let same = true, where = "";
  for (const k of Object.keys(fresh)) if (JSON.stringify(fresh[k]) !== JSON.stringify(DATA[k])) { same = false; where = k; break; }
  truth("and every number in it is the solver's, run again", same, where);
}
truth("twelve settings: three risk aversions, two limits, two correlations", Object.keys(DATA).length === 12 && GRID.gamma.length * GRID.cap.length * GRID.rho.length === 12);

// ---- route B -------------------------------------------------------------------
const GH5 = [[-2.85697, 0.011257], [-1.355626, 0.222076], [0, 0.533333], [1.355626, 0.222076], [2.85697, 0.011257]];
const GH3 = [[-1.732051, 1 / 6], [0, 2 / 3], [1.732051, 1 / 6]];
const D = C.DEFAULTS;
const mS = Math.log(D.rf + D.prem) - (D.sigS * D.sigS) / 2;
const gross = (z) => Math.exp(mS + D.sigS * z);

console.log("-- a two-year life, by search over whole strategies");
{
  // year 0: work, choose saving s and stock dollars d. Year 1: work and eat everything. No value function is formed.
  for (const gamma of [3, 5]) for (const cap of [1, 2]) {
    const sol = C.solve({ gamma, cap, rho: 0, T: 2 });
    for (const i of [30, 45, 60]) {
      const x = sol.xs[i];
      let best = Infinity, bs = 0, bd = 0;
      const G = C.growth(0), sig = D.sigN;
      for (let k = 1; k < 999; k++) {
        const s = (x * k) / 1000, c = x - s;
        for (let j = 0; j <= 200; j++) {
          const d = (cap * s * j) / 200;
          let acc = 0;
          for (const [zn, wn] of GH3) for (const [zs, ws] of GH5) {
            const nn = G * Math.exp(sig * zn - (sig * sig) / 2);
            const xn = (s * D.rf + d * (gross(zs) - D.rf)) / nn + 1;
            acc += wn * ws * Math.pow(nn, 1 - gamma) * Math.pow(xn, 1 - gamma);
          }
          const v = Math.pow(c, 1 - gamma) + D.beta * acc;
          if (v < best) { best = v; bs = s; bd = j / 200 * cap; }
        }
      }
      const dpS = (x - sol.pol[0].c[i]) , dpD = sol.pol[0].d[i];
      eq(`gamma ${gamma}, limit ${cap}, cash ${x.toFixed(2)}: consumption by search vs by the solver`, (x - bs) / x, sol.pol[0].c[i] / x, 0.006);
      eq(`gamma ${gamma}, limit ${cap}, cash ${x.toFixed(2)}: share by search vs by the solver`, bd, dpD, 0.02);
    }
  }
}

console.log("-- a life with no pay, against a first-order condition and a recursion");
{
  for (const [gamma, cap] of [[2, 1], [3, 1], [1.5, 1], [5, 2]]) {
    const T = 12;
    const sol = C.solve({ gamma, cap, T, retireAt: 0, repl: 0, sigN: 0 });
    // the share solves E[(rf + d (R - rf))^(-g) (R - rf)] = 0 on the same quadrature, or sits at the limit
    const foc = (d) => GH5.reduce((a, [z, w]) => a + w * Math.pow(D.rf + d * (gross(z) - D.rf), -gamma) * (gross(z) - D.rf), 0);
    let lo = 0, hi = 5; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (foc(mid) > 0) lo = mid; else hi = mid; }
    const shareStar = Math.min(cap, (lo + hi) / 2);
    // c/x by backward recursion: k_T = 1, Lambda = beta k' E[Rp^(1-g)], c/x = 1/(1 + Lambda^(1/g)), k = (1 + Lambda^(1/g))^g
    const M = GH5.reduce((a, [z, w]) => a + w * Math.pow(D.rf + shareStar * (gross(z) - D.rf), 1 - gamma), 0);
    let k = 1; const cx = [];
    for (let t = T - 2; t >= 0; t--) { const L = D.beta * k * M; cx[t] = 1 / (1 + Math.pow(L, 1 / gamma)); k = Math.pow(1 + Math.pow(L, 1 / gamma), gamma); }
    // start well inside the grid: a life with no pay runs its cash down, and the last years sit near the grid's floor
    for (const x of [8, 15, 30]) {
      const i = sol.xs.findIndex((v) => v >= x);
      eq(`gamma ${gamma}, limit ${cap}, ${T} years, cash ${sol.xs[i].toFixed(1)}: the share is the root of the first-order condition (${shareStar.toFixed(3)})`, sol.pol[0].d[i], shareStar, 0.003);
    }
    const i8 = sol.xs.findIndex((v) => v >= 8);
    eq(`gamma ${gamma}, limit ${cap}: consumption over cash at the start, by the recursion`, sol.pol[0].c[i8] / sol.xs[i8], cx[0], 0.003);
    eq(`gamma ${gamma}, limit ${cap}: and with six years left`, sol.pol[T - 7].c[i8] / sol.xs[i8], cx[T - 7], 0.003);
  }
  truth("the Merton share of savings alone, at risk aversion 5, is about 32%", round(pc(P.merton(5))) === 32, pc(P.merton(5)).toFixed(2));
  truth("at 3 it is about 54% and at 10 about 16%", round(pc(P.merton(3))) === 54 && round(pc(P.merton(10))) === 16);
}

console.log("-- properties of every solved setting");
{
  let ok1 = true, ok2 = true, ok3 = true, why = "";
  for (const [k, e] of Object.entries(DATA)) {
    const cap = +k.split("|")[1];
    for (let i = 0; i < 64; i++) {
      if (!(e.p10[i] <= e.median[i] + 1e-9 && e.median[i] <= e.p90[i] + 1e-9)) { ok1 = false; why = `${k} ${i}`; }
      if (e.p90[i] > cap + 1e-6 || e.p10[i] < -1e-9) { ok2 = false; why = `${k} ${i}`; }
      if (e.atCap[i] < 0 || e.atCap[i] > 1) ok3 = false;
    }
  }
  truth("10th <= median <= 90th percentile at every age", ok1, why);
  truth("no worker holds more than the limit, or a negative share", ok2, why);
  truth("the fraction at the limit is between 0 and 1", ok3);
  for (const g of GRID.gamma) for (const rho of GRID.rho)
    truth(`a tighter limit can only lower welfare: F is higher with no borrowing (gamma ${g}, rho ${rho})`, DATA[P.key(g, 1, rho)].F >= DATA[P.key(g, 2, rho)].F * (1 - 1e-6));
  eq("and where a cautious worker's pay moves with stocks, the limit never binds, so the two values agree", DATA[P.key(10, 1, 0.3)].F, DATA[P.key(10, 2, 0.3)].F, 1e-6);
}

console.log("-- the page: risk aversion 5, no borrowing, pay unrelated to stocks");
{
  const e = P.get(5, 1, 0);
  truth("the median worker holds all of her savings in stocks until she is about 55 (within half a point)", P.AGES.filter((a) => a <= 54).every((a) => P.medianAt(e, a) >= 0.995));
  eq("and is off the limit by 55", P.leavesLimit(e, 1), 55, 0);
  truth("at 45 about 88% of workers are at the limit", round(pc(P.atCapAt(e, 45))) === 88, pc(P.atCapAt(e, 45)).toFixed(2));
  truth("the share is 85% at 60 and 78% at 65", round(pc(P.medianAt(e, 60))) === 85 && round(pc(P.medianAt(e, 65))) === 78, `${pc(P.medianAt(e, 60)).toFixed(2)} ${pc(P.medianAt(e, 65)).toFixed(2)}`);
  truth("she has saved about 8 years of pay at 65", round(P.wealthAt(e, 65)) === 8, P.wealthAt(e, 65).toFixed(2));
  truth("savings rise with age through the working years (to 64)", P.AGES.filter((a) => a > 25 && a <= 64).every((a) => P.wealthAt(e, a) > P.wealthAt(e, a - 1)));
  const e2 = P.get(5, 2, 0);
  truth("with a 2 to 1 limit the median holds 200% until 37", P.AGES.filter((a) => a <= 37).every((a) => P.medianAt(e2, a) === 2) && P.leavesLimit(e2, 2) === 38, `${P.leavesLimit(e2, 2)}`);
  truth("and 134% at 45", round(pc(P.medianAt(e2, 45))) === 134, pc(P.medianAt(e2, 45)).toFixed(2));
  const e3 = P.get(3, 1, 0);
  truth("at risk aversion 3 the median holds 100% at every age to 88", P.AGES.every((a) => P.medianAt(e3, a) === 1));
  const e10 = P.get(10, 1, 0);
  truth("at 10: 100% at 25, 65% at 35, about a third at 65", P.medianAt(e10, 25) === 1 && round(pc(P.medianAt(e10, 35))) === 65 && Math.abs(pc(P.medianAt(e10, 65)) - 100 / 3) < 1, `${pc(P.medianAt(e10, 35)).toFixed(2)} ${pc(P.medianAt(e10, 65)).toFixed(2)}`);
  truth("and the median is off the limit by 30", P.leavesLimit(e10, 1) === 30 && P.AGES.filter((a) => a > 34).every((a) => P.atCapAt(e10, a) < 0.02));
}

console.log("-- pay that moves with stocks (correlation 0.3)");
{
  const e = P.get(5, 1, 0.3);
  truth("at 45 the median share drops from 100% to 73%", round(pc(P.medianAt(e, 45))) === 73 && P.medianAt(P.get(5, 1, 0), 45) === 1, pc(P.medianAt(e, 45)).toFixed(2));
  truth("and to 52% at 60", round(pc(P.medianAt(e, 60))) === 52, pc(P.medianAt(e, 60)).toFixed(2));
  truth("then jumps when pay stops: 50% at 64, 80% at 65", round(pc(P.medianAt(e, 64))) === 50 && round(pc(P.medianAt(e, 65))) === 80, `${pc(P.medianAt(e, 64)).toFixed(2)} ${pc(P.medianAt(e, 65)).toFixed(2)}`);
  const e10 = P.get(10, 1, 0.3);
  truth("at risk aversion 10 the median holds nothing in her twenties", P.AGES.filter((a) => a < 30).every((a) => P.medianAt(e10, a) < 0.005), `${P.AGES.filter((a) => a < 30).map((a) => P.medianAt(e10, a))}`);
}

console.log("-- what the limit costs");
{
  const c = [3, 5, 10].map((g) => pc(P.ceGain(g, 0))), d = [3, 5, 10].map((g) => pc(P.ceGain(g, 0.3)));
  truth("with pay unrelated to stocks: 3.0%, 1.6% and 0.16%", round(c[0], 1) === 3.0 && round(c[1], 1) === 1.6 && round(c[2], 2) === 0.16, c.map((v) => v.toFixed(3)).join(" "));
  truth("with a correlation of 0.3: 1.5%, 0.17% and nothing", round(d[0], 1) === 1.5 && round(d[1], 2) === 0.17 && d[2] < 0.005, d.map((v) => v.toFixed(3)).join(" "));
  truth("the cost of the limit is eighteen times as large at 3 as at 10", round(c[0] / c[2]) === 18, (c[0] / c[2]).toFixed(2));
  truth("the bold lose more than the cautious, in both worlds", c[0] > c[1] && c[1] > c[2] && d[0] > d[1] && d[1] >= d[2]);
  truth("and a link between pay and stocks lowers every cost", [0, 1, 2].every((i) => d[i] < c[i]));
  // the definition: consumption scaled by (1 + gain) under no borrowing gives the value with a 2 to 1 limit
  for (const g of [3, 5, 10]) eq(`gamma ${g}: scaling consumption by 1 + gain scales F by (1 + gain)^(1-g)`, DATA[P.key(g, 1, 0)].F * Math.pow(1 + P.ceGain(g, 0), 1 - g), DATA[P.key(g, 2, 0)].F, 1e-9);
}

console.log("-- why we stop at 2 to 1");
{
  const worst = gross(GH5[0][0]);
  truth("the worst year in the model is a fall of about a third", round(pc(1 - worst)) === 33, pc(1 - worst).toFixed(1));
  truth("at 3 to 1 that year takes all of a worker's savings", D.rf + 3 * (worst - D.rf) < 0, (D.rf + 3 * (worst - D.rf)).toFixed(3));
  truth("but at 2 to 1 it does not", D.rf + 2 * (worst - D.rf) > 0, (D.rf + 2 * (worst - D.rf)).toFixed(3));
}

console.log("-- what the 4,000 workers can and can't say");
{
  const sol = C.solve({ gamma: 5, cap: 1, rho: 0 });
  const a = C.simulate(sol, 4000, 5), b = C.simulate(sol, 4000, 11), c = C.simulate(sol, 4000, 23);
  let dm = 0, dc = 0;
  for (let i = 0; i < 64; i++) for (const o of [b, c]) { dm = Math.max(dm, Math.abs(a[i].median - o[i].median)); dc = Math.max(dc, Math.abs(a[i].atCap - o[i].atCap)); }
  truth("another set of 4,000 workers moves no median by more than four points", dm < 0.04, dm.toFixed(3));
  truth("but the fraction at the limit can move by a couple of points", dc > 0.005 && dc < 0.05, dc.toFixed(3));
}

console.log(fails ? `\n${fails} OF ${n} CHECKS FAILED` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
