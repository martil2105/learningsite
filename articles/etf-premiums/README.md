# etf-premiums (Fm5)

Finance row 6, `finance/markets`. Built 30 September 2026. The slate had this
row as `etfs-and-passive`; pass 1 narrowed it to one claim and renamed it.

**Kind:** model (a fund, its APs and a NAV built from last trades; the truth V
is planted, so both gaps are known).
**Shape:** case first (LQD at a 5.0% discount on 12 March 2020) → the
arbitrage band (`ArbFigure`) → a NAV built from last trades (the recursion) →
the sell-off lab (`SellOffLab`: price and NAV, then the reported premium with
the band) → who closes the gap (`GapRegression`: tomorrow's NAV and price
changes against today's premium, over a thousand simulated days).
**Hook:** `SellOffLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Slate: creation and redemption keep an ETF's price near its NAV without the fund ever trading | Near what its holdings are **worth**, within the AP's round-trip cost, and the fund trades nothing (in kind). Not near the NAV when the holdings trade rarely: at a fifth of the bonds trading each day, a 10% fall over five days leaves a 5.6% discount on day 5 with the price exactly at the bonds' value, 1.9% five days later |
| A deep discount means the ETF is mispriced | Not here. ln(P/NAV) = ln(P/V) + ln(V/NAV) exactly; the NAV closes a share p of its gap a day (NAV_t = NAV_{t−1} + p(V_t − NAV_{t−1}), asserted against 40,000 bonds marked one by one). Over simulated days, tomorrow's NAV change on today's premium has slope ≈ p (0.19 on the page's thousand days, within 0.03 of p over 40,000) and the price's ≈ 0 (−0.04) |
| Slate: what happens to index inclusion effects as the passive share grows | Dropped from this row: an empirical claim (Greenwood & Sammon's disappearing index effect) that needs data this site can't pin. A candidate for a later 📊 row |

## Numbers on the page

`verify/check-numbers.mjs` (30 checks). Quoted, not derived: LQD's 5.0% and
0.19% discounts on 12 and 13 March 2020 (WealthManagement.com), HYG's 2.4%
closing premium to NAV and about 0.4% average intraday premium to an estimate
of current value on 24 March 2020 (BlackRock's presentation to the SEC's Fixed
Income Market Structure Advisory Committee). Both read 29–30 September 2026.

## Sources

Petajisto (2017), Haddad, Moreira & Muir (2021), Madhavan (2016), and the two
quoted above.
