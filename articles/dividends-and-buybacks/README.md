# dividends-and-buybacks (Fm6)

Finance row 7, `finance/markets`. Built 30 September 2026.

**Kind:** model (Miller and Modigliani's payout irrelevance, on one firm with
a business and idle cash).
**Shape:** question first (guess card: EPS up 6.1% or down 4.5%, who's
better off?) → comparison spine (`PayoutLab`: the same $10 as a dividend and a
buyback; gains per share held, and EPS, side by side; the buyback price on a
slider) → paying the wrong price (the stayers' formula) → when a buyback raises
EPS (`AccretionMap`: P/E against the after-tax yield on cash) → why the price
doesn't rise with EPS (beta and the return needed). **Hook:** `PayoutLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Slate: at a fair price a buyback and a dividend of the same size leave shareholders equally well off before tax | Yes: $100 a share either way, asserted by a ledger of every holder for every payout on the slider. The P/E also lands at 14.3 after either, from 15.2, because the cash paid out was worth 33 times its earnings and the business 13.3 |
| Slate: EPS rise after a buyback and value doesn't | EPS rise (6.1%) exactly when the earnings yield beats the after-tax yield on the cash spent (P/E < 1/r); here the line is at 7.5%, the business's own yield. The price stays at $100 because the return needed rises by the same 6.1% (beta 0.80 → 0.89, 6.6% → 7.0%) |
| (implied) A buyback is just a dividend | Only at a fair price. At Pb ≠ V a buyback is a dividend plus a trade between sellers and stayers: a kept share is worth V − q/(1−q)(Pb − V) ($99.00 at $110, $101.25 at $90) |

## Numbers on the page

`verify/check-numbers.mjs` (44 checks), with a ledger of ten holders as the
second route.

## Sources

Miller & Modigliani (1961), Grullon & Michaely (2002), Ikenberry, Lakonishok &
Vermaelen (1995), Almeida, Fos & Kronlund (2016), Brealey, Myers & Allen.
