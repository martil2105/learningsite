# order-book (Fm1)

Finance row 1, `finance/markets`. Built 26 September 2026 in the cloud container
on the rebuilt harness (see `claude/finance-first-five-build-notes.md`).

**Kind:** model (a frozen limit order book; plant the shape, walk it).
**Shape:** build-up → lab → result chart. **Hook:** `WalkLab`.

## Claim as built

A market order's average fill sits a fixed fraction of the way from the touch to
the last price it hits, and the book's shape sets both that fraction and how the
walk grows with size. With depth growing like x^a, the fraction is (a+1)/(a+2)
and the walk grows like Q^(1/(a+1)): flat book half way and linear growth,
linear book two thirds and square-root growth, square book three quarters and
cube-root growth. The linear (V) book is the static version of the latent-book
explanation of the square-root impact law (Tóth et al. 2011).

## What pass 1 moved

- The slate line said "the average fill sits exactly (a+1)/(a+2) of the way".
  In whole cents that is exact for the flat and linear books **only when the
  order clears whole levels**; a partly used last level moves it (a 600-share
  flat order sits at 17%, not 50%). The first draft claimed the flat book was
  half way at every size, and the number check caught it. The page now says
  "whole levels" and the lab says which case the reader is in.
- The square book is never exact in whole cents: the share is (3L+2)/(2(2L+1))
  for L whole levels, approaching ¾ from above (0.753 at 40 levels).
- Microprice and queue-race ideas were dropped to `market-making` (Fm2).

## Numbers on the page

| Statement | Value |
|---|---|
| quiet book | bid $99.99, ask $100.01, spread 2¢, mid $100.00, flat 500 a level |
| flat, 5,000 shares | 10 levels, last $100.10, average $100.055, 5.5¢ above mid |
| linear, 5,500 shares | 10 levels, last $100.10, average $100.07 (⅔) |
| doubling the order | walk ×2.00 flat, ×1.41 linear, ×1.26 square |
| linear, 4× order | twice as far (continuous); 5,500 → 10 levels, 21,000 → 20 |
| flat, 5,000 → 10,000 | total cost ×3.82 ("roughly four times") |
| flat round trip, 5,000 | 11¢ a share = 2¢ spread + 9¢ walking; $550 on $500,000 |

All in `verify/check-numbers.mjs` (86 checks), each headline by the module and
by level sums that share no code with it; the continuous rule by numerical
integration.

## Sources checked

Harris (2003); Bouchaud, Mézard & Potters (2002) for the average book peaking
away from the best price; Gould et al. (2013) survey; Tóth et al. (2011) for the
latent-book account of the square-root law; Bouchaud et al. (2018) for the law
across stocks, futures and options.

## Built

Ported onto the house scaffold on 27 September 2026 from the cloud build of 26 September: page furniture from cost-curves, the house palette (three categorical colours, ink for the fourth mark, a violet ramp for families), a viewBox on every chart, and the common block of check-browser.mjs. The numbers module and its checks are unchanged.
