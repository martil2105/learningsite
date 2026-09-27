# `comparative-advantage`

**Kind** concept · **Shape** question first, into a size lab · **Hook** `SizeLab` ·
**Stack** Svelte 5 + Vite

Pass-1 spec: `claude/comparative-advantage-pass1-spec.md` in the project.
Row 1 (Mi1) of `economics-curriculum-slate.md`.

## The angle

Trade leaves both sides better off at any price strictly between their two
opportunity costs, and the textbook stops there. But in a market nobody gets to
pick the price. Relative size picks it, and over a whole range of sizes it sits
exactly on the bigger economy's own opportunity cost, where that economy gains
exactly nothing. A country that is better at everything, trading with a partner
of its own size, is always on that edge.

## The model

Two economies, two goods, labour only, identical Cobb–Douglas tastes with half
of spending on each good. Output of one worker in a day:

| | tools | sacks of grain | sacks per tool |
|---|---|---|---|
| the Valley | 9 | 18 | 2 |
| the Coast | 2 | 9 | 4.5 |

The Valley is better at both; it has the comparative advantage in tools. `k` is
Coast workers per Valley worker. The market price is

`p = clamp(k · (9/9), 2, 4.5)` sacks per tool,

so inside the band the price **is** the size ratio. Gains: `√(p/2)` for the
Valley and `√(4.5/p)` for the Coast.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | Comparative advantage, not absolute advantage, decides who makes what | **True.** Across sizes 0.01–100 and spending shares 0.2–0.8, tools are never made only on the Coast and grain never only in the Valley; at most one good is ever made in both places |
| 2 | Any price strictly between the two opportunity costs leaves both better off | **True, exactly.** At every slider price strictly inside (2, 4.5) both gain; at 2 the Valley's gain is **exactly 0** and the Coast's **exactly 50%**; outside the range one side refuses |
| 3 | So when two economies trade, both gain — even if one is better at everything | **False for a market.** At equal workforces the price is **exactly 2** and the Valley gains **exactly nothing**; its basket is identical to its no-trade basket. Over **100,000** random equal-sized pairs, the economy better at both gains exactly nothing **every time**. With equal spending shares, *both gain iff each is the bigger total producer of what it sells*: **100,000 / 100,000** random pairs of any size agree |
| 4 | Each economy specialises, and the world makes more of both goods | **Only inside the band.** At equal size **250 of 1,000** Valley workers keep farming; world grain is **exactly unchanged at 13,500** and tools rise **5,500 → 6,750**, and all **1,250** extra tools end up on the Coast. At 3× both goods rise by **exactly 20%**. More of both ⟺ 2 < k < 4.5, with no exceptions over 1,201 sizes |
| 5 | — (how wide the "both gain" range is) | **Identity.** The band is `k ∈ (2, 4.5)`, a factor of **exactly 2.25 = the ratio of the opportunity costs**. With CES tastes it is `2.25^σ` (σ = 0.5, 2, 3), confirmed by bisecting an independent CES solver |
| 6 | — (what size does to the gains) | **Identity: a fixed pie.** `gainValley × gainCoast = 1.5` at **every** size, inside the band and outside it (worst 2e−16). Each economy consumes exactly as much of its own export as without trade; the whole gain arrives as the import. Neither can gain more than 50% |
| 7 | Absolute advantage is irrelevant | **Irrelevant to the pattern, decisive for wages.** A Valley wage buys `clamp(k, 2, 4.5)` Coast wages — between its edge in grain (2×) and in tools (4.5×). At equal size, **exactly 2×** |
| 8 | Productivity growth abroad is good for you (Samuelson 2004 disputes it) | **Only in the good you import.** At k = 3, Coast tool productivity 2 → 3 moves the Valley's 22.5% gain by **exactly 0**; 3 → 4.5 takes it to **exactly 0** at parity (kink where the Coast's tool capacity equals the Valley's); past parity trade reverses and the Valley gains again (**41.4%** at 9). Coast grain 9 → 18 lifts the Valley to **73.2%** |
| 9 | One side gaining nothing is a two-good curiosity | **Partly.** With N equally weighted goods the Valley gains nothing iff `k ≤ 2/(N−1)` and the Coast iff `k ≥ 4.5(N−1)` — **48,000** random economies, **0** violations. Ten goods: 222 to 40,500 Coast workers per 1,000; at equal size the Valley gains **2.7%** and the Coast **28.7%**. The zero goes; the lopsided split stays. The fixed pie does not survive (1.25 at 3× with ten goods) |

## The identity on screen

`BandFigure`: the market price against relative size on log–log axes is a
straight line of slope exactly 1 with two flat ends, and the band between the
kinks spans exactly the ratio of the two opportunity costs. Beside it, the two
gains trade places while their product stays at 1.5.

## Layout

| Section | Component |
|---|---|
| who makes what | `WhoMakesWhat` — pick, and get the opportunity-cost verdict |
| the price test | `PriceTest` — a price slider over both frontiers |
| the twist | `MarketReveal` — equal workforces, open trade, baskets before and after |
| why it sticks | `WorldFrontier` — the world's kinked frontier and where production sits |
| the hook | `SizeLab` — the Coast's workforce, both frontiers, the capacity test |
| the identity | `BandFigure` — clamp and split, one scrubber |
| catch-up | `CatchUpFigure` — Samuelson's case |
| more goods | `GoodsFigure` — the zero-gain edges move out as (N−1) |

`Frontier` is the per-worker panel shared by `PriceTest` and `SizeLab`. Both
panels always use the **same scales**, because the argument is about slopes and
a panel fitted to its own frontier would draw every frontier corner to corner.

## Verification

- `npm run check` — `verify/check-numbers.mjs`, **105 checks**, asserting every
  number in the prose from `src/trade.js` (closed form) and `src/market.js`
  (labour-market bisection, no shared code). Most are `===`: the prices, the
  zero gains, the baskets and the world outputs are exact in floating point.
- `verify/check-browser.mjs` — **153 checks**, green at 390px and 1280px. The
  article-specific geometry, measured through `getScreenCTM()`: at 1× the
  Valley's trading line is within 0.5px of its frontier and the Coast's is more
  than 10px off it, the reverse at 8×, and both are off at 3×; the product
  readout says 1.500 at 25 slider positions; all 19 solved-market dots sit on
  the closed-form clamp; the clamp's middle piece has slope 1 in log–log to
  0.2%; the many-goods curves leave zero exactly at the closed-form edges.
- Verified build: `bundle 3459731ff8d1b3604165fef49e9f0ab2`, the same bytes as
  `site/comparative-advantage/build/bundle.js`.

## Sources

CORE Econ, *The Economy 2.0: Microeconomics* (2023), Unit 2 §2.3 — the subject
(absolute and comparative advantage, opportunity cost, specialisation, and a
bilateral agreement at a price between the two opportunity costs). Nothing is
reproduced from it. Samuelson (2004), *JEP* 18(3): 135–146, for the catch-up
section; Jones (1961), *RES* 28(3): 161–175, and Dornbusch, Fischer & Samuelson
(1977), *AER* 67(5): 823–839, for the limits and the many-goods section.
