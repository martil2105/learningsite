// Every number the page states. Route A is src/payout.js. Route B keeps an
// explicit ledger of the firm's assets and every shareholder's holdings, makes
// the payout by moving cash and shares, and values what each holder ends with.
import * as P from "../src/payout.js";

let fails = 0, n = 0;
function eq(name, a, b, tol = 1e-9) {
  n++;
  const good = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (!good) { fails++; console.log(`FAIL ${name}: ${a} vs ${b}`); } else console.log(`ok   ${name}: ${+(+a).toFixed(6)}`);
}
function truth(name, cond, detail = "") { n++; if (!cond) { fails++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? "  (" + detail + ")" : ""}`); }
const r2 = (x) => Math.round(x * 100) / 100, r1 = (x) => Math.round(x * 10) / 10;

// route B: a ledger. The firm has a business worth 800, cash 200, and 10 shares
// held by ten holders. A payout of D in total; a buyback at price Pb buys shares
// from the first holders on the list until the money is spent.
function ledger(kind, D, Pb = 100) {
  const firm = { business: 800, cash: 200, shares: 10 };
  const holders = Array.from({ length: 10 }, () => ({ shares: 1, cash: 0 }));
  if (kind === "dividend") {
    firm.cash -= D;
    for (const h of holders) h.cash += (D / firm.shares) * h.shares;
  } else {
    let money = D;
    for (const h of holders) {
      if (money <= 1e-12) break;
      const take = Math.min(h.shares, money / Pb);
      h.shares -= take; h.cash += take * Pb; money -= take * Pb; firm.shares -= take;
    }
    firm.cash -= D;
  }
  const perShare = (firm.business + firm.cash) / firm.shares;
  const earnings = 60 + 0.03 * firm.cash;
  const wealth = holders.map((h) => h.shares * perShare + h.cash);
  return { perShare, eps: earnings / firm.shares, wealth, holders };
}

console.log("-- our firm");
{
  const b = P.before();
  eq("a share is worth $100", b.V, 100, 0);
  eq("and earns $6.60", b.EPS, 6.6, 1e-12);
  eq("a P/E of 15.2", r1(b.PE), 15.2, 0);
  eq("an earnings yield of 6.6%", b.EY, 0.066, 1e-12);
}

console.log("-- two ways to hand back $10");
{
  const dv = P.dividend(10), bb = P.buyback(10, 100);
  eq("after the dividend a share is worth $90", dv.price, 90, 1e-12);
  eq("and a holder has $100 in all", dv.wealth, 100, 1e-12);
  eq("the buyback buys one share in ten", bb.bought / P.FIRM.N, 0.1, 1e-12);
  eq("each share that stays is still worth $100", bb.stay, 100, 1e-12);
  eq("EPS falls to $6.30 after the dividend", dv.EPS, 6.3, 1e-12);
  eq("which is 4.5% lower", r1(100 * (dv.EPS / 6.6 - 1)), -4.5, 0);
  eq("and rises to $7.00 after the buyback", bb.EPS, 7, 1e-12);
  eq("which is 6.1% higher", r1(100 * (bb.EPS / 6.6 - 1)), 6.1, 0);
  eq("11% apart", Math.round(100 * (bb.EPS / dv.EPS - 1)), 11, 0);
  eq("the P/E is 14.3 after the dividend", r1(dv.price / dv.EPS), 14.3, 0);
  eq("and 14.3 after the buyback", r1(bb.PE), 14.3, 0);
  eq("cash earning 3% is worth 33 times what it earns", Math.floor(1 / 0.03), 33, 0);
  eq("and the business 13.3 times", r1(80 / 6), 13.3, 0);
  // route B
  const L1 = ledger("dividend", 100), L2 = ledger("buyback", 100, 100);
  truth("the ledger: every holder ends with $100 a share either way", [...L1.wealth, ...L2.wealth].every((w) => Math.abs(w - 100) < 1e-9));
  eq("the ledger's EPS after the dividend", L1.eps, dv.EPS, 1e-12);
  eq("and after the buyback", L2.eps, bb.EPS, 1e-12);
  let worst = 0;
  for (let d = 0; d <= 20; d++) { const a = P.dividend(d), c = P.buyback(d, 100); worst = Math.max(worst, Math.abs(a.wealth - 100), Math.abs(c.stay - 100), Math.abs(a.price / a.EPS - c.PE)); }
  truth("for every payout on the slider, wealth is $100 either way and the two P/Es match", worst < 1e-9, worst.toExponential(1));
  truth("the bigger the payout, the wider the gap in EPS", [2, 5, 10, 15, 20].every((d, i, a) => i === 0 || P.buyback(d, 100).EPS - P.dividend(d).EPS > P.buyback(a[i - 1], 100).EPS - P.dividend(a[i - 1]).EPS));
}

console.log("-- paying the wrong price");
{
  const hi = P.buyback(10, 110), lo = P.buyback(10, 90);
  eq("at $110 each share that stays is worth $99", hi.stay, 99, 1e-12);
  eq("the sellers gain $10 on each", hi.sold - 100, 10, 1e-12);
  eq("the formula V - q/(1-q)(Pb - V) gives the same", 100 - P.stayerLoss(10, 110), hi.stay, 1e-12);
  eq("at $90 each share that stays gains $1.25", lo.stay - 100, 1.25, 1e-12);
  const L = ledger("buyback", 100, 110);
  const sellers = L.holders.map((h, i) => ({ ...h, w: L.wealth[i] })).filter((h) => h.cash > 0), stayers = L.holders.map((h, i) => ({ ...h, w: L.wealth[i] })).filter((h) => h.cash === 0);
  truth("the ledger at $110: the holders who stayed have $99 a share", stayers.every((h) => Math.abs(h.w - 99) < 1e-9));
  const gain = sellers.reduce((a, h) => a + h.w - 100 * 1, 0), loss = stayers.reduce((a, h) => a + 100 - h.w, 0);
  eq("what the sellers gain is what the stayers lose", gain, loss, 1e-9);
  let worst = 0;
  for (let d = 1; d <= 20; d++) for (let pr = -0.2; pr <= 0.2001; pr += 0.01) { const Pb = 100 * (1 + pr), b = P.buyback(d, Pb); worst = Math.max(worst, Math.abs(100 - P.stayerLoss(d, Pb) - b.stay), Math.abs(b.transfer - (P.FIRM.N - b.bought) * (100 - b.stay))); }
  truth("the formula and the transfer hold at every size and price on the sliders", worst < 1e-9, worst.toExponential(1));
}

console.log("-- when a buyback raises EPS");
{
  const a = P.accretion(6, 0.03);
  eq("our firm: 6.6% against 3%, and EPS rises 6.1%", r1(100 * a.change), 6.1, 0);
  let wrong = 0, count = 0;
  for (let e = 2.5; e <= 10; e += 0.5) for (let r = 0.005; r <= 0.08 + 1e-9; r += 0.005) {
    const x = P.accretion(e, r); count++;
    if (Math.abs(x.EY - r) > 1e-9 && (x.change > 0) !== (x.EY > r)) wrong++;
    // route B: the same with a ledger whose cash yield is r
    const eps0 = (10 * e + r * 200) / 10, eps1 = (10 * e + r * 100) / 9;
    if (Math.abs(eps1 / eps0 - 1 - x.change) > 1e-12) wrong++;
  }
  truth("EPS rises exactly when the earnings yield beats the yield on cash, everywhere on the map", wrong === 0, `${count} points`);
  eq("our dot crosses the curve when the cash earns 7.5%", 6 / 80, 0.075, 1e-12);
  truth("just below 7.5% the buyback raises EPS and just above it lowers them", P.accretion(6, 0.07).change > 0 && P.accretion(6, 0.08).change < 0);
  eq("on the curve, P/E is one over the yield", P.accretion(6, 0.075).PE, 1 / 0.075, 1e-12);
  truth("every point the sliders reach is inside the map (P/E 5 to 40)", (() => { for (let e = 2.5; e <= 10; e += 0.5) for (let r = 0.005; r <= 0.08 + 1e-9; r += 0.005) { const x = P.accretion(e, r); if (x.PE < 5 || x.PE > 40) return false; } return true; })());
}

console.log("-- why the price doesn't rise with EPS");
{
  const k = P.risk();
  eq("beta rises from 0.80", k.beta0, 0.8, 1e-12);
  eq("to 0.89", r2(k.beta1), 0.89, 0);
  eq("the return needed rises from 6.6%", k.req0, 0.066, 1e-12);
  eq("to 7.0%", k.req1, 0.07, 1e-12);
  eq("EPS and the return needed both rise by 6.1%", P.buyback(10, 100).EPS / 6.6, k.req1 / k.req0, 1e-12);
  eq("so the price is $100 before", 6.6 / k.req0, 100, 1e-12);
  eq("and after", P.buyback(10, 100).EPS / k.req1, 100, 1e-12);
}

console.log("-- the lab's windows");
{
  let gmin = 0, gmax = 0, emax = 0;
  for (let d = 0; d <= 20; d++) for (let pr = -0.2; pr <= 0.2001; pr += 0.01) {
    const b = P.buyback(d, 100 * (1 + pr)), v = P.dividend(d);
    for (const g of [b.stay - 100, b.sold - 100, v.wealth - 100]) { gmin = Math.min(gmin, g); gmax = Math.max(gmax, g); }
    emax = Math.max(emax, b.EPS, v.EPS);
  }
  truth("every gain or loss on the sliders fits the first chart (±$22)", gmin > -22 && gmax < 22, `${gmin.toFixed(2)} to ${gmax.toFixed(2)}`);
  truth("and every EPS fits the second ($0 to $9)", emax < 9, emax.toFixed(3));
}

console.log(fails ? `\n${fails} CHECKS FAILED of ${n}` : `\nALL ${n} CHECKS PASS`);
process.exit(fails ? 1 : 0);
