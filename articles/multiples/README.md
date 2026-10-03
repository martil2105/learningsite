# multiples (Fm8)

Finance row 9, `finance/markets`. Built 3 October 2026. Needs Fm7
(`dividend-discount-model`).

**Kind:** model (a firm that earns a constant return on equity on its book and
reinvests a constant share of its earnings at that return, priced as a growing
stream of dividends). **Shape:** question first (guess card: a firm that
doesn't grow against one that reinvests half at 8% and grows 4%; same P/E) →
lab (`GrowthLab`: P/E against growth, one curve per ROE, all through 12.5 at
zero growth, flat at ROE = r) → how much of the price is growth (PVGO and the
P/B identity) → how long the margin has to last (`FadeChart`) → one P/E, a line
of stories (`StoryMap`). **Hook:** `GrowthLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| A higher P/E means faster expected growth (P/E = payout/(r − g)) | Only when ROE > r. At ROE = r the forward P/E is 1/r = 12.5 at every growth rate; at ROE 6%, 3% growth takes it to 10. Raising g in Gordon's formula at a fixed payout raises ROE with it: half payout and 4% growth means ROE 8%, 6% means 12% |
| Growth adds value | PVGO = (E1/r)·g/(r − g)·(1 − r/ROE) has the sign of ROE − r: +$12.50 (half the price) at 12%/6%, −$2.50 at 6%/3% |
| A price above book means the market expects growth | P/B − 1 = (ROE − r)/(r − g): above 1 exactly when ROE > r, at any growth. Firm B (4% at ROE 8%) trades at book |
| A P/E of 25 prices a fast grower | It prices a margin that lasts: 12%/6% for 10 years gives 14.6, 30 years 17.9, for ever 25; half the value of growth comes from money reinvested after year 37. ROE 20%/5% also reaches 25, with 15.6 at 10 years and half by about year 25 |
| (slate) A high P/E can't tell low risk from high growth | Even with the P/B beside it: P/E 20 and P/B 3 (ROE 15%) fit r = 5% with no growth, 7% with 3%, 9% with 6%, from r = E/P + g(1 − B/P). At book the earnings yield is the required return whatever the growth |

PEG was probed in pass 1 and left out: in a world of perpetual growth, PEG
below 1 picks out firms reinvesting below r, which is unfair to a rule meant
for five years of growth.

## Numbers on the page

`verify/check-numbers.mjs` (49 checks): closed forms against the firm rolled
forward year by year for 4,000 years; the flat line on a grid; PVGO's sign and
formula and the P/B identity on a grid; the fade sums against their closed
form; the line of stories priced back to 20 times earnings.
`verify/check-browser.mjs` (78 at 390 and 1280 px) reads the dots back from the
drawn axes and checks each is on its curve, every curve starts on the flat
line, the blue curve lies on the dashed line at ROE 8%, the half-way marker
sits on the fade curve, and the story line is flat at book.

## Sources

Miller & Modigliani (1961); Gordon (1959); Ohlson (1995); Koller, Goedhart &
Wessels, *Valuation* (the value driver formula); Damodaran, *Investment
Valuation*.
