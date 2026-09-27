# `money-creation`

**Kind** model · **Shape** one steered simulation (balance sheets, step by step), into a
lab · **Hook** `InStepLab` · **Stack** Svelte 5 + Vite

Pass-1 spec: `claude/money-creation-pass1-spec.md` in the project.
Row 18 (Ma5) of `economics-curriculum-slate.md`.

## The angle

Every banker knows a bank needs deposits before it can lend, and the textbook says
the central bank's reserves are multiplied into money. The first is true of one
bank lending alone and false of the system: a bank lending alone loses
(1 − its share) of the loan in reserves, and banks lending in step lose exactly
nothing. The second is a ratio, M/B = (1 + c)/(c + r), that holds whichever way
causation runs.

## The model

Anchor (50% of deposits), Birch (30%), Cedar (20%), each with a tenth of its
deposits in reserves; payments land at each bank in proportion to its share.
`src/banks.js` writes loans and payments as balance-sheet entries and reads money
and reserves off the sheets; the in-step closed form is checked against the full
bank-by-bank settlement.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | Banks lend out depositors' money | **False for the system**: Anchor lends €100, loans +100 and deposits +100, nobody's deposit falls; money €1,000 → €1,100 |
| 2 | A bank needs deposits before it can lend | **True alone, false in step**: alone Anchor loses €50 (every reserve it had); ΔR = −(1 − s)(1 − φ)L exactly over the lab's grid; €90 at a tenth of the market; in step (Birch €60, Cedar €40) every bank ends with its opening reserves and deposits are up €200; net flows always sum to zero |
| 3 | The central bank sets reserves and the multiplier turns them into money | **The ratio always holds**: 5.5 with c = r = 0.1; textbook rounds turn €100 of reserves into €550, each round lending q = (1 − r)/(1 + c) of the last |
| 4 | QE multiplies into money | **Only through the purchase**: €500 of bonds from a pension fund adds €500 of money, not €2,750; the measured ratio falls from 5.5 to 2.29 and the identity still holds |

## Layout

| Section | Component |
|---|---|
| the case | `BalanceSheets` — five steps, three T-accounts, reserve bars, system totals |
| the hook | `InStepLab` — φ and Anchor's share; the drain line and every bank's net flow |
| the multiplier | `MultiplierLab` — textbook rounds vs QE, and a table checking M/B against the formula |

## Verification

- `npm run check` — **28 checks**: every sheet balances at every step, system
  reserves never move, the in-step formula equals the settlement to 1e-12 over a
  17 × 21 grid, flows sum to zero, the rounds' geometric ratio, and the identity
  in every state.
- `verify/check-browser.mjs` — **54 checks** at 390px and 1280px: every rendered
  sheet balances at all five steps and the totals read €1,000 → €1,200 with
  reserves at €100; the drain marker rides its line at four settings; the flow
  bars sum to zero; the table's measured and formula columns agree in every row;
  the rounds marker sits on the cumulative curve; and no KaTeX spacing command
  was lost to a single-backslash escape.

## Sources

McLeay, Radia & Thomas (2014), BoE Quarterly Bulletin 2014 Q1; Keynes, A Treatise
on Money (1930), Collected Writings vol. 5, p. 23 (quoted, and checked against
Sardoni's citation); Federal Reserve, reserve requirements to zero from 26 March
2020. Nothing reproduced beyond the one quoted sentence.
