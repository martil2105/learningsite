# market-making (Fm2)

Finance row 2, `finance/markets`. Built 29–30 September 2026.

**Kind:** model (Glosten and Milgrom's market with two values, planted truth).
**Shape:** question first (guess card) → Bayes figure (who sends a buy) → the
ledger in one display → one steered simulation (`TradeLab`, a day of trades
stepped by the reader) → learning speed on a log axis → the bill for a piece of
news. **Hook:** `TradeLab`; smaller interactions in `BayesFigure`, `LearnChart`
and `BillChart`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| The spread widens with the share of informed traders | Yes, and at even odds it is exactly μ × D (20¢ at 10% on a $2 range). In general it is 4μx(1−x)D / (1 − μ² + 4μ²x(1−x)), widest at even odds and closing as the belief x moves to 0 or 1 |
| The market maker loses to the informed exactly what it earns from the uninformed | True in expectation at every quote (asserted at every belief). On any one day its P&L wanders: day 2 of the lab ends +$23.58 for it and −$70.83 for the uninformed |
| (implied) The spread is the market maker's income | No. It breaks even; the spread moves money from the uninformed (half a spread per trade on average, whatever the truth) to the informed |
| (implied) Fewer informed traders are better for the uninformed | Per trade, yes. Per piece of news, no: the log odds drift about 2μ² per trade, so each halving of μ needs four times as many trades (average spread halves after 22 / 85 / 341 trades at 20 / 10 / 5%), and the uninformed's total bill tends to ln 2 × (1 − μ)D/μ ($12.48 at 10%, $26.34 at 5%). With an announcement after N trades, the bill peaks at μ ≈ 1.2/√N (12% at 100, 8% at 250, 4% at 1,000) |

## Numbers on the page

All derived in `verify/check-numbers.mjs` (59 checks): quotes against Bayes by
counting over histories; break-even at every belief; the lab's days (seeds in
`DAYS`); the learning curve against 20,000 simulated days; the bill three ways
(lattice solve, a long sum of exact average spreads, and 6,000 simulated long
days).

## Sources

Glosten & Milgrom (1985), Copeland & Galai (1983), Kyle (1985), Easley &
O'Hara (1987), Hasbrouck (2007). The ln 2 limit and the peak of the bill are
ours, derived here, not taken from a paper.
