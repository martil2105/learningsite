/*
  Three banks and a central bank.

  Shares are each bank's share of the deposits in the system, and payments land
  in proportion to them: a euro spent by anyone arrives at Anchor with
  probability 0.5, at Birch with 0.3 and at Cedar with 0.2. That is the one
  assumption the reserve-drain identity rests on.
*/
export const BANKS = [
  { id: "anchor", name: "Anchor", share: 0.5 },
  { id: "birch", name: "Birch", share: 0.3 },
  { id: "cedar", name: "Cedar", share: 0.2 },
];

export const LOAN = 100; // Anchor's loan to the bakery

// Opening balance sheets, in euros. Reserves are deposits at the central bank.
export const OPENING = {
  anchor: { reserves: 50, loans: 450, bonds: 50, deposits: 500, equity: 50 },
  birch: { reserves: 30, loans: 270, bonds: 30, deposits: 300, equity: 30 },
  cedar: { reserves: 20, loans: 180, bonds: 20, deposits: 200, equity: 20 },
};

// The multiplier section: currency held per euro of deposits, and the reserve ratio.
export const CURRENCY_RATIO = 0.1;
export const RESERVE_RATIO = 0.1;
export const INJECTION = 100; // reserves added by the central bank
export const QE_PURCHASE = 500; // bonds bought from a pension fund
// Opening aggregates for the multiplier lab: currency, deposits, reserves.
export const AGG = { C: 100, D: 1000, R: 100 };
