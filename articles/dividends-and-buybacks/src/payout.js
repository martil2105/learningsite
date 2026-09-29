/*
  One firm, two ways to hand out cash.

  Per share, before the payout: a business worth OP = $80 that earns e = $6 a
  year for ever, and cash of C = $20 that earns r = 3% a year after tax. So a
  share is worth V = OP + C = $100 and earns e + rC = $6.60. There are N = 10
  shares (the numbers scale to any count).

  A dividend of d a share leaves each share worth V - d, and hands d in cash.
  A buyback of the same total d N at a price Pb buys back d N / Pb shares; the
  firm is then worth (V - d) N and the shares that stay are worth
  ((V - d) N) / (N - d N / Pb) each.
*/
export const FIRM = { OP: 80, e: 6, C: 20, r: 0.03, N: 10 };

export function before({ OP, e, C, r, N } = FIRM) {
  const V = OP + C, E = e + r * C;
  return { V, E, EPS: E, PE: V / E, EY: E / V, N };
}

export function dividend(d, f = FIRM) {
  const { OP, e, C, r } = f;
  const price = OP + C - d, EPS = e + r * (C - d);
  return { price, cash: d, wealth: price + d, EPS, PE: price / EPS };
}

export function buyback(d, Pb, f = FIRM) {
  const { OP, e, C, r, N } = f;
  const V = OP + C, bought = (d * N) / Pb, left = N - bought;
  const firm = (V - d) * N;
  const stay = firm / left; // what a share that stays is worth
  const EPS = ((e + r * (C - d)) * N) / left;
  return { bought, left, stay, sold: Pb, EPS, PE: stay / EPS, transfer: bought * (Pb - V) };
}
// the transfer, per share that stays, from the closed form
export const stayerLoss = (d, Pb, f = FIRM) => {
  const V = f.OP + f.C, q = d / Pb; // share of the shares bought back
  return (q / (1 - q)) * (Pb - V);
};

// ------------------------------------------------------------ accretion
// EPS after a fair buyback of all the payout d, against before. It rises exactly
// when the earnings yield E/V beats the after-tax yield r on the cash spent.
export function accretion(e, r, d = 10, f = FIRM) {
  const g = { ...f, e, r };
  const b = before(g);
  const after = buyback(d, b.V, g).EPS;
  return { ...b, after, change: after / b.EPS - 1 };
}

// ------------------------------------------------------------ risk
// The business has a beta of 1 and needs a return of eOP = e / OP; the cash has a
// beta of 0 and needs r. A share's beta and required return are the weighted
// averages, so they rise when cash is paid out, by as much as the EPS does.
export function risk(d = 10, f = FIRM) {
  const { OP, C, e, r } = f;
  const k = e / OP;
  const w0 = OP / (OP + C), w1 = OP / (OP + C - d);
  return { beta0: w0, beta1: w1, req0: w0 * k + (1 - w0) * r, req1: w1 * k + (1 - w1) * r };
}
