/*
  Where a loan's money goes, and what the money multiplier is.

  A loan is written as two entries on the lending bank's balance sheet: a new
  asset (the loan) and a new liability (the borrower's deposit). When the
  borrower spends it, the deposit moves to whichever bank the recipient uses,
  and the lending bank settles by passing the same amount of reserves across.
*/
import { BANKS } from "./datasets.js";

/*
  Net reserves flowing INTO each bank when bank i lends loans[i] and every euro
  lent is spent and lands at bank j with probability shares[j]. Summed over the
  system the flows are zero: reserves only move between banks.
*/
export function settle(shares, loans) {
  const total = loans.reduce((a, b) => a + b, 0);
  return shares.map((s, i) => s * total - loans[i]);
}

/*
  The closed form for one bank: it lends L, and every other bank j lends
  phi * (s_j / s_i) * L, so phi = 1 is lending in proportion to size ("in step")
  and phi = 0 is lending alone. The bank's net reserve flow is

      -(1 - s_i) (1 - phi) L.
*/
export const drain = (si, phi, L) => -(1 - si) * (1 - phi) * L;

/* The loans behind drain(): bank i lends L, the others follow by phi. */
export function inStepLoans(i, phi, L, banks = BANKS) {
  return banks.map((b, j) => (j === i ? L : (phi * b.share * L) / banks[i].share));
}

/*
  Balance sheets, step by step. Each step is a list of entries; applying one
  adds to a bank's reserves, loans or deposits. Money (deposits held by the
  public) and reserves are then read off the sheets rather than tracked.
*/
export function applySteps(opening, steps) {
  const sheets = JSON.parse(JSON.stringify(opening));
  for (const step of steps) {
    for (const [bank, item, amount] of step.entries) sheets[bank][item] += amount;
  }
  return sheets;
}

export const totalOf = (sheets, item) => Object.values(sheets).reduce((a, s) => a + s[item], 0);

/* The steps of the case, as entries. */
export function caseSteps(L, banks = BANKS) {
  const [A, B, C] = banks;
  const spendA = settle(banks.map((b) => b.share), [L, 0, 0]);
  const followLoans = inStepLoans(0, 1, L, banks);
  const all = settle(banks.map((b) => b.share), [0, followLoans[1], followLoans[2]]);
  return [
    {
      id: "lend",
      label: "Anchor lends",
      entries: [["anchor", "loans", L], ["anchor", "deposits", L]],
    },
    {
      id: "spend",
      label: "The bakery spends it",
      entries: banks.flatMap((b, j) => [
        [b.id, "deposits", b.share * L - (j === 0 ? L : 0)],
        [b.id, "reserves", spendA[j]],
      ]),
    },
    {
      id: "follow",
      label: "Birch and Cedar lend too",
      entries: [
        ["birch", "loans", followLoans[1]], ["birch", "deposits", followLoans[1]],
        ["cedar", "loans", followLoans[2]], ["cedar", "deposits", followLoans[2]],
      ],
    },
    {
      id: "settle",
      label: "Their borrowers spend",
      entries: banks.flatMap((b, j) => {
        const lent = followLoans[j] * (j === 0 ? 0 : 1);
        const arrives = b.share * (followLoans[1] + followLoans[2]);
        return [[b.id, "deposits", arrives - lent], [b.id, "reserves", all[j]]];
      }),
    },
  ];
}

/*
  The textbook multiplier process: the central bank adds dB of reserves, and
  banks lend out every euro beyond the required ratio r. Each loan is spent;
  the public keeps c/(1+c) of it as currency and redeposits the rest. Returns
  the round-by-round increases in money, and the totals.
*/
export function multiplierRounds(dB, c, r, maxRounds = 400) {
  let C = 0, D = 0, R = dB;
  const rounds = [];
  for (let k = 0; k < maxRounds; k++) {
    const loan = R - r * D;
    if (loan < 1e-12) break;
    const cash = (loan * c) / (1 + c);
    const dep = loan - cash;
    C += cash;
    D += dep;
    R -= cash;
    rounds.push(loan);
  }
  return { rounds, C, D, R, M: C + D, B: C + R };
}

/* The multiplier, as a ratio read off any state: M / B = (1 + c) / (c + r). */
export const multiplier = (c, r) => (1 + c) / (c + r);
export const measured = ({ C, D, R }) => (C + D) / (C + R);
export const identity = ({ C, D, R }) => multiplier(C / D, R / D);

/*
  Quantitative easing with reserves already abundant: the central bank buys Q of
  bonds from a pension fund. The fund's bank credits its deposit and receives
  the same amount of reserves. No loan changes.
*/
export const qe = ({ C, D, R }, Q) => ({ C, D: D + Q, R: R + Q });

/* The same purchase in the textbook world, where every new reserve is lent out. */
export function textbookQe(state, Q, c, r) {
  const m = multiplier(c, r);
  return { dM: m * Q };
}
