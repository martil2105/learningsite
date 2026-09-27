# samuelson-1963 (Fr17)

Finance row 46, Stage 8a, `finance/portfolios`. The first paper explainer
(📄). Built 27 September 2026. Needs `time-diversification` (Fr16); Mi22
(`expected-utility`) is not built yet, so the article defines expected utility
in a paragraph.

**Kind:** result (a theorem from a paper). **Shape:** paper explainer: citation
card under the title (claims / what we rebuild / what came later) → the story →
lab (every outcome of n bets, with a take-all/share toggle) → the proof in one
display equation → CARA lab → the law of large numbers, where it does help →
what came later, with a loss-aversion figure. **Hooks:** `BetsLab`, `CaraLab`.

## Source

Samuelson, P. A. (1963), "Risk and uncertainty: a fallacy of large numbers",
Scientia 98, 108–113. Read from the Casualty Actuarial Society reprint: the
$200/$100 bet, the colleague's answer ("feel the $100 loss more than the $200
gain", would take 100), the theorem ("at each income or wealth level within a
range"), 34 or more wins needed, the $10,000 worst case, the insurance-ships
remark. Everything else is ours.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| A hundred bets are nearly riskless | Loss chance 1 in 2,289 (about 1 in 2,300), but the worst case grows to −$10,000 and the swing to ±$1,500 |
| Refusing one at every wealth ⇒ refusing n | True by the one-step induction; checked for a non-CARA utility (a two-exponential mix) at every n ≤ 100 |
| CARA: CE of n bets | Exactly n × CE of one (checked against the sum over outcomes and over every sequence for n = 12) |
| (found in probing) The CARA fence | 0.5e^{−200a} + 0.5e^{100a} = 1 reduces to x³ − 2x² + 1 = 0, root x = golden ratio; a* = ln φ / 100 ≈ 4.81 per $1,000 |
| (found in probing) Rabin in miniature | At a*, the largest 50-50 loss ever risked for any prize is ln 2 / a* ≈ $144 |
| The law of large numbers helps | Only when the risk is shared: a hundredth of 100 bets keeps the $50 mean with ±$15 swing |
| The colleague is incoherent | Not under a kinked (loss-averse) utility over final wealth: one bet −$12.50 at λ = 2.25, a hundred as a package ≈ $5,000, and the package needs λ ≈ 32,900 to look bad. The premise fails (after one win the next bet is taken) |

## Paper-explainer template (first use)

`PaperCard.svelte`: label, citation, then three paragraphs (What it claims /
What we rebuild / What came later) passed as snippets from `App.svelte` so the
prose gate reads them. The body then follows claim → rebuild → aftermath, and
keeps the house ends (What this costs you, Conclusion, Sources).

## Checks

80 number checks; 84 browser checks, including every pink bar left of zero and
every blue bar right of it, the long-way circles on the certainty-equivalent
line (perpendicular distance), and the pink dot crossing zero below λ = 2.

## Sources

Samuelson (1963, 1969); Rabin (2000); Ross (1999); Benartzi & Thaler (1995,
1999); Tversky & Kahneman (1992). Abstracts of Rabin, Ross and Benartzi–Thaler
(1999) read on the web on 27 September 2026.
