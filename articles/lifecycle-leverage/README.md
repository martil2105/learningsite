# lifecycle-leverage (Fr27, row 56)

A concept with an identity. A saver puts 1 into stocks at the start of each of 40 years. The money riding on the market in year s, as a share of final
wealth, is E_s = e_s ω_s, and to first order Var[ln W_T] ≈ σ² Σ E_s². Effective years N_eff = (ΣE)²/ΣE². Borrowing early and holding less late, at
the same total exposure, lifts N_eff and shrinks the spread. The page shows how much, and that it is modest.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| The slate says a saver at 100% stocks has most of the exposure in the last decade | **False as stated.** The last 10 of 40 years carry 34% of exposure and 41% of variance (25% if even); N_eff is 35.2 of 40 |
| Early leverage evens it out | True but modest: at equal total exposure, cap 2 gives N_eff 39.0, spread of ln W −8%, 5th percentile +14%, median −2%, mean about −5% |
| More leverage keeps helping | Diminishing: N_eff 38.2 / 39.0 / 39.6 / 39.8 at caps 1.5 / 2 / 3 / 4; uncapped is 40.0 and needs 6.4 to 1 in year 1 |
| A glide path 90→40 is a better spread | No: it is a smaller bet (total exposure 16.1 vs 28.6), spread −43% but median −24% |
| The coefficient of variation of wealth is the right spread measure | No: exact CV is 1.11 at 100% stocks and about 1.07 for caps 2 and up. (A 100,000-path simulation gave 1.10 to 1.14 with no trend, which is sampling noise in the tail: use ln W.) |

## Model

deposit 1 at the start of each year, stocks 7% mean and log-volatility 18%, safe 2%, borrowing at the safe rate. The capped rule is e_s = min(cap, c/ω_s)
with c chosen so that ΣE equals the all-stocks saver's.

## Files

`src/expo.js` model; `src/caps.js` the caps; `scripts/precompute.mjs` the seeded 100,000-path simulation of each rule into `src/precomputed.js`;
`verify/check-numbers.mjs` route B: forward balances, enumeration of a small market for the identity, an independent simulation, and the exact
moments of final wealth.
