# `economic-rent`

**Kind** model · **Shape** question first · **Hook** `RentLab` ·
**Stack** Svelte 5 + Vite

Row 2 of the CORE spine (`subject-queue.md`, U1–U2). Pass-1 modules:
`src/technology.js` (the subject module, pre-existing) and `src/datasets.js`.

## The angle

The rectangle test — the one every first course teaches — removes Legacy and
Ported and leaves five survivors, Balanced among them. The envelope leaves
four. Balanced survives every dominance test there is and is the cheapest way
to run the job at no relative price at all. Rent is the gap between a
technology you might hold and the envelope, and competition closes it from
below while copying the difference that opened it.

## The model

Seven fixed-proportions recipes for one month's processing run; cost in units
of p is `r·N + R` with `r = w/p` the only decision variable. Switch prices
1, 3, 8 (engineer-days per machine-day). Base prices 600 and 200 put the
industry exactly on the INDEXED–BATCHED switch.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | Run the rectangle test and pick the survivor | **The test leaves five survivors**, Balanced included — it removes exactly LEGACY and PORTED and is silent on every real trade-off |
| 2 | Which technology is cheapest depends on prices | **Half-true: on the ratio r alone.** Doubling both input prices moves no choice; the ranking by money cost is the ranking by `r·N + R` at every r |
| 3 | The sensible middle option is a safe pick | **False.** BALANCED is dominated by nothing and is the cheapest technology at no price at all: `winInterval` returns null and the hull excludes it — two routes sharing no code agree |
| 4 | — (when would it be chosen?) | **Identity.** Its window opens once R < 18 = the chord's value at N = 5; from 14 up the window is exactly `18 − R` wide (the rule changes below 14, where TUNED's line sets the lower edge); at R = 14 the window is [1, 5] and covers the standard regime r = 2 |
| 5 | The pioneer earns a rent | **The gap.** At r = 2: envelope 26, holding TUNED costs 34 (rent 8), LEGACY 48 (rent 22), BALANCED 30 (gap 4); the rent is zero across the holder's whole window and positive off it |
| 6 | Competition destroys the rent and spreads the innovation | **Both, by the same arithmetic.** An undercut of anything under the gap is profitable; the rent falls one for one and is exactly zero at the gap. The gain to switching LEGACY→INDEXED is `200·(2r + 18)` — slope exactly the 2 engineer-days the switch sheds — so dearer engineers spread the labour-lean innovation |
| 7 | — (the switch prices) | **Exactly 1, 3, 8**, and the envelope's slope on each piece is the chosen technology's N (15, 7, 3, 1) |

## Layout

| Section | Component |
|---|---|
| the question | `RectangleTest` — click a technology, the dominance rectangle lights up |
| points become lines | `PointLine` — input space beside (r, cost) lines, envelope, switches at 1, 3, 8 |
| the trap | `TrapFigure` — BALANCED's machine-days on a slider, its window shaded |
| the rent | `RentLab` — r slider + regime presets, held technology, rent shaded |
| competition | `SpreadFigure` — the rival's undercut, rent → 0 |

## Verification

- `npm run check` — `verify/check-numbers.mjs`, **43 checks**. The two routes
  (`winInterval` vs `lowerHull`) must return the same ever-chosen set; the
  window arithmetic and the switch prices are asserted with `===` where the
  arithmetic is exact.
- `verify/check-browser.mjs` — the generic checks at 390px and 1280px, plus
  the article's geometry: the envelope dot sits on the highlighted cost line
  (rendered pixels, via `getScreenCTM`) at r swept over 0.5, 2, 5 and 12, and
  the rent rect has zero rendered height exactly when the held technology is
  the frontier.

## Source

CORE Econ, *The Economy 2.0: Microeconomics* (2023), Unit 2 §2.2 —
opportunity costs, economic rents and incentives. Theirs: the definitions.
Ours: the seven recipes, the point–line duality as drawn, the Balanced trap
and its window, and every number on the page.