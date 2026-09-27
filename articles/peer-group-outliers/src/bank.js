/*
  Our bank. 5,000 ordinary private customers in five segments, plus three
  planted groups: a mule ring, structurers who pay in cash, and legitimate
  house sales. Every customer has a persistent profile (drawn once), and each
  month is a noisy draw around it, so "next month" means the same people
  behaving the same way.

  Nothing here describes a real bank. The segments and the typologies are
  generic, and every parameter is ours.
*/
import { mulberry32, gaussian, poisson, logn } from "./rng.js";

export const FEATURES = ["inflow", "outflow", "txns", "cashIn", "intlOut", "senders"];
export const FEATURE_LABELS = {
  inflow: "money in",
  outflow: "money out",
  txns: "transactions",
  cashIn: "cash paid in",
  intlOut: "sent abroad",
  senders: "different senders",
};

export const PROFILE_SEED = 11;
export const MONTH_SEEDS = [101, 202, 303, 404, 505, 606];
export const N_ORDINARY = 5000;
export const PLANTED = { mules: 20, struct: 10, extreme: 5 };
export const BUDGET_SHARE = 0.01;

export const SEGMENTS = [
  // share, median inflow, sd of log inflow, extra senders, transactions, P(cash), cash median, P(abroad), abroad median
  { name: "student", w: 0.15, inc: 14000, s: 0.45, snd: 2.0, tx: 55, pc: 0.06, cm: 2000, pi: 0.10, im: 3000 },
  { name: "salaried", w: 0.50, inc: 45000, s: 0.35, snd: 0.6, tx: 80, pc: 0.08, cm: 3000, pi: 0.15, im: 5000 },
  { name: "pensioner", w: 0.20, inc: 26000, s: 0.25, snd: 0.3, tx: 35, pc: 0.20, cm: 4000, pi: 0.05, im: 3000 },
  { name: "high", w: 0.10, inc: 110000, s: 0.50, snd: 1.5, tx: 110, pc: 0.05, cm: 8000, pi: 0.40, im: 20000 },
  { name: "selfemp", w: 0.05, inc: 40000, s: 0.70, snd: 8.0, tx: 120, pc: 0.30, cm: 8000, pi: 0.20, im: 8000 },
];
export const SEGMENT_LABELS = {
  student: "students", salaried: "salaried", pensioner: "pensioners", high: "high earners",
  selfemp: "self-employed", mule: "mule ring", struct: "structurers", extreme: "house sales", dormant: "dormant",
};

export function makeProfiles(n = N_ORDINARY, seed = PROFILE_SEED, planted = PLANTED) {
  const r = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    let u = r(), seg = SEGMENTS[0];
    for (const s of SEGMENTS) { if (u < s.w) { seg = s; break; } u -= s.w; }
    out.push({
      kind: "normal", seg: seg.name,
      inc: logn(r, seg.inc, seg.s),
      ratio: Math.min(1.2, Math.max(0.6, 0.93 + 0.08 * gaussian(r))),
      snd: 1 + poisson(r, seg.snd),
      tx: seg.tx * Math.exp(0.3 * gaussian(r)),
      cash: r() < seg.pc ? logn(r, seg.cm, 0.6) : 0,
      intl: r() < seg.pi ? logn(r, seg.im, 0.7) : 0,
    });
  }
  // A mule ring: many different senders, money straight through, 60% sent abroad.
  for (let i = 0; i < planted.mules; i++)
    out.push({ kind: "mule", seg: "mule", inc: logn(r, 60000, 0.12), ratio: 0.99, snd: 22 + poisson(r, 4),
      tx: 70 * Math.exp(0.1 * gaussian(r)), cash: 0, intl: -1 });
  // Structurers: salaried-looking, plus a steady amount of cash every month.
  for (let i = 0; i < planted.struct; i++)
    out.push({ kind: "struct", seg: "struct", inc: logn(r, 42000, 0.3), ratio: 0.95, snd: 1 + poisson(r, 0.6),
      tx: 80 * Math.exp(0.3 * gaussian(r)), cash: logn(r, 38000, 0.12), intl: 0 });
  // Legitimate extremes: a house sale lands in the first month, and only then.
  for (let i = 0; i < planted.extreme; i++)
    out.push({ kind: "extreme", seg: "extreme", inc: 45000 + logn(r, 3500000, 0.3), base: 45000, ratio: 0.3, snd: 2,
      tx: 85, cash: 0, intl: 0 });
  return out;
}

/*
  One month. `monthIndex` 0 is the month the house sales land; in any later
  month those five customers are back to an ordinary salary. The random stream
  is consumed identically either way, so month 0 is unaffected by the switch.
*/
export function drawMonth(profiles, seed, monthIndex = 0) {
  const r = mulberry32(seed);
  return profiles.map((p) => {
    const saleOver = p.kind === "extreme" && monthIndex > 0;
    const inc = saleOver ? p.base : p.inc;
    const ratio = saleOver ? 0.93 : p.ratio;
    const inflow = inc * Math.exp(0.10 * gaussian(r));
    const cashIn = p.cash > 0 ? p.cash * Math.exp(0.25 * gaussian(r)) : 0;
    return {
      kind: p.kind, seg: p.seg,
      x: [
        inflow + cashIn,
        (inflow + cashIn) * ratio * Math.exp(0.05 * gaussian(r)),
        poisson(r, p.tx),
        cashIn,
        p.intl < 0 ? 0.6 * inflow : p.intl > 0 ? p.intl * Math.exp(0.3 * gaussian(r)) : 0,
        Math.max(1, poisson(r, p.snd)),
      ],
    };
  });
}

/* The month every "in our month" number comes from. */
export function ourMonth() {
  return drawMonth(makeProfiles(), MONTH_SEEDS[0], 0);
}
export const rowsOf = (month) => month.map((c) => c.x);
export const budgetFor = (n) => Math.round(BUDGET_SHARE * n);

// ------------------------------------------------------------ scenarios
// Dormant accounts: nothing much happens in them.
export function addDormant(month, n, seed) {
  const r = mulberry32(seed);
  const extra = Array.from({ length: n }, () => {
    const inflow = r() < 0.5 ? 0 : 20 + 200 * r();
    return { kind: "dormant", seg: "dormant", x: [inflow, 0, poisson(r, 0.3), 0, 0, inflow > 0 ? 1 : 0] };
  });
  return [...month, ...extra];
}
// Own-account transfers: savings moved through the account inflate money in
// and money out together.
export function addInternal(month, share, seed) {
  const r = mulberry32(seed);
  return month.map((c) => {
    if (c.kind !== "normal" || r() >= share) return c;
    const t = 60000 * Math.exp(0.5 * gaussian(r));
    const x = c.x.slice(); x[0] += t; x[1] += t; x[2] += 2; x[5] += 1;
    return { ...c, internal: true, x };
  });
}
// A yes/no attribute unrelated to risk, such as "has a foreign address".
export function binaryColumn(month, prevalence, seed) {
  const r = mulberry32(seed);
  return month.map(() => (r() < prevalence ? 1 : 0));
}
// Which customers are missing a value. "ring": a legacy system that also holds
// half of the ring's accounts.
export function missingMask(month, rate, seed, mech = "mcar") {
  const r = mulberry32(seed);
  return month.map((c) => (mech === "ring" && c.kind === "mule" ? r() < 0.5 : r() < rate));
}

export const idxOf = (month, kind) => month.map((c, i) => (c.kind === kind ? i : -1)).filter((i) => i >= 0);
export const caught = (month, set, kind) => idxOf(month, kind).filter((i) => set.has(i)).length;
/* The catch strip every figure shows: planted groups caught, and everyone else. */
export function catches(month, set) {
  const c = { ring: 0, struct: 0, sales: 0, other: 0, size: set.size };
  for (const i of set) {
    const k = month[i].kind;
    if (k === "mule") c.ring++; else if (k === "struct") c.struct++; else if (k === "extreme") c.sales++; else c.other++;
  }
  return c;
}
