# `cartels-and-the-prisoners-dilemma` — pass-1 spec

**Kind** model · **Shape** question first · **Hook** `MergerLab`
**Stack** Svelte 5 + Vite · **Queue** slate row 11 (Mi11); builds
`src/cournot.js` (which `cournot-and-bertrand`, Mi30, will import) and
`src/nplayer.js` (the sequential best-response solver, which
`tragedy-of-the-commons` imports)
**Closest analog by shape** `comparative-advantage` — the reader runs the
received procedure, gets the answer everyone gives, and one case makes it
wrong.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

The received account is a procedure with an answer the reader will supply
unprompted: *four of these five firms are forming a cartel — who gains?*
Everybody says the four. `choosing-the-shape.md` records question first as the
identified signal when the received account is a procedure rather than a
statement, and this is as clean an instance as the project has had: the
reader's answer is not merely imprecise, it is exactly backwards, and the
correction is an integer ratio they can check by hand.

## The angle

Every treatment of cartels says they are profitable and unstable, and spends
its length on the instability. The prior question is never asked. In the
standard quantity-setting model a cartel of four firms out of five leaves each
member's profit **unchanged to the last bit** — not reduced by cheating,
unchanged before anyone has cheated at all — while the single firm that stayed
out sees its profit **quadruple**. The cartel raises the price, hurts
consumers, and transfers the whole gain to the firms that refused to join. The
prisoner's dilemma is real, but it is in the decision to join, not in the
decision to cheat, and it bites before the cartel exists.

## The model

Linear Cournot: inverse demand `p = a − Q`, `n` identical firms with marginal
cost `c`, no fixed cost. `a = 100, c = 10`.

```
symmetric equilibrium:   q = (a−c)/(n+1),  p = (a + n·c)/(n+1),  π = (a−c)²/(n+1)²
k firms merge into one:  the industry has n − k + 1 firms, so
    each member earns    (a−c)²/(k·(n−k+2)²)
    each outsider earns  (a−c)²/(n−k+2)²
profitable  ⟺  k·(n−k+2)² < (n+1)²
```

**Every equilibrium in the checks is computed by `nplayer.js`, a sequential
best-response solver that reads every rival's current quantity**, and only
then compared to the closed form. See the risk note below: the obvious
simultaneous version diverges and looks like a wrong formula.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | More firms means a lower price and less profit each | True — `π = (a−c)²/(n+1)²`, matched by sequential best response over seven industry sizes to 8.242e-13, with the largest remaining single-firm deviation 6.395e-13 | `TheQuestion` |
| 2 | So firms would rather there were fewer of them, and a cartel delivers that | True of the *industry*, and that is exactly why the answer to the question is wrong | `TheQuestion` |
| 3 | A cartel is profitable for its members | **Usually not.** At n = 5: two firms merging get 0.72× their old profit, three get 0.75×, four get **exactly 1.00×**, and only all five get more (1.80×). The same solver on the merged industry agrees with the closed form to 4.8e-16 | `MergerLab` |
| 4 | — (**the knife edge**) | n = 5, k = 4: before, each of the five earns 225; after, the four split 900 and earn 225 each. **Exact integer equality**, not a near miss | `MergerLab` preset |
| 5 | — (**the identity**) | The firm that stayed out earns **exactly k times** what a cartel member earns, for every (n, k): worst relative 2.203e-16 over every pair to n = 200. So being outside always beats being inside, and the gap is the cartel's own size | `FreeRideFigure` |
| 6 | Cartels are undone by cheating | **They are undone before that.** Every member would rather be the outsider, so the cartel is a prisoner's dilemma in the joining decision. Cheating is the next article's subject and this one does not model it | `FreeRideFigure` + prose |
| 7 | — (how big a cartel has to be) | Profitable iff `k(n−k+2)² < (n+1)²`. For n ≤ 5 only a full merger works. From n = 6 the smallest profitable cartel is 5 of 6 (83.3%), then 9 of 10 (90%), 17 of 20 (85%), 92 of 100 (92%), 970 of 1000 (97%). The number of firms that can stay out is `⌊√n⌋ − 2` to within one, over sizes from 6 to 20,000 | `ThresholdFigure` |
| 8 | The cartel at least gains at the consumer's expense | **The consumer loses either way.** n = 5, k = 4: the price rises from 25 to 40 and consumer surplus falls from 2812.5 to 1800, while the four who did it gain nothing. The transfer goes to the fifth firm | `WelfareFigure` |
| 9 | — (cost) | Quantity competition, identical constant costs, one shot, no side payments between members and outsiders, and a merger modelled as a costless pooling of quantities. Side payments are exactly what would fix it, and they are also exactly what competition law forbids — say that, and stop there | limits |

## The worked case

n = 5, `a = 100`, `c = 10`:

| k | member before | member after | ratio | outsider after | outsider ratio |
|---|---|---|---|---|---|
| 2 | 225 | 162 | 0.72 | 324 | 1.44 |
| 3 | 225 | 168.75 | 0.75 | 506.25 | 2.25 |
| **4** | **225** | **225** | **1.00** | **900** | **4.00** |
| 5 | 225 | 405 | 1.80 | — | — |

Price 25 → 40. Consumer surplus 2812.5 → 1800.

## The identity on screen

`MergerLab`: `n` and `k` on two small controls, with the industry drawn as `n`
marks that gather into a block when they merge, and three readouts — a
member's profit, an outsider's profit, and the price — each shown as a ratio
to its pre-merger value. The outsider readout always prints exactly `k`× the
member readout, whatever the reader does, and that invariance is the figure.

`ThresholdFigure` carries the second identity: the smallest profitable cartel
share against industry size on a log x axis, rising towards 100%, with the
number of permitted outsiders plotted beside `√n − 2`.

## Layout

`TheQuestion` (five firms, the payoffs, and a two-button question: *if four of
these merge, who is better off?* — the reader answers before anything is
revealed) → `TheAnswer` (the table above, one row at a time, ending on the
exact equality) → `MergerLab` (the hook) → `FreeRideFigure` (outsider ÷ member
= k, over a sweep of n and k) → `ThresholdFigure` (how big a cartel has to be)
→ `WelfareFigure` (price and consumer surplus) → limits.

`TheQuestion` must record the reader's answer and refer back to it in
`TheAnswer`. A question the reader can skip past is a heading.

## Non-overlap

- `nash-equilibrium` (live) owns the payoff matrix, mixed strategies and the
  deterrence result. **This article has no matrix**; it has a quantity game
  with a closed form, and the link between the two is one sentence.
- `repeated-games` (Mi29, unbuilt) owns the discount factor that sustains
  collusion, and `folk-theorem` (Mi53) owns what that buys. The slate flags
  these three as one argument told three times and says to keep all three only
  if each has its own provable claim. **This one's claim is the merger
  paradox, which is one-shot and needs no discounting.** Do not model cheating,
  do not mention δ, and say plainly in the conclusion that the cheating
  question is the next article's — that sentence is what earns all three rows.
- `cournot-and-bertrand` (Mi30, unbuilt) owns the Cournot–Bertrand comparison
  and the n → ∞ convergence to the competitive price. This article builds
  `cournot.js` early because it needs it; it introduces the model in one
  figure as the cartel's setting, states that price competition behaves
  completely differently, and hands over. **Record the handover in
  `subject-queue.md` in pass 4** so Mi30 does not rebuild the module.
- `markup-and-elasticity` (live) owns markup = 1/\|ε\|. Not used here.

## check-numbers.mjs

15–20 `ok()` blocks:

- **`nplayer.js` against the closed form**, symmetric case, seven industry
  sizes, worst relative < 1e-12. First, because everything else leans on it.
- the same solver on the **merged** industry against
  `(a−c)²/(k(n−k+2)²)`, seven (n, k) pairs, worst relative < 1e-12.
- the worked table as exact arithmetic, including `member after === member
  before` at (5, 4) with `===` on integers, and `outsider after === 4 ×
  before`.
- **the identity**: `outsider ÷ member === k` over every (n, k) with
  `3 ≤ n ≤ 200`, `2 ≤ k < n`, worst relative < 1e-12.
- the profitability condition: for every such (n, k), `member after > member
  before` ⟺ `k(n−k+2)² < (n+1)²` — the equivalence asserted as an
  equivalence, in both directions.
- the smallest profitable `k` at each of the quoted industry sizes, exactly.
- the outsider count against `⌊√n⌋ − 2`: assert the difference is in `{−1, 0,
  1}` at every size from 6 to 20,000, and report the sizes where it is exact.
- price and consumer surplus for the worked case, exact.
- an inequality the prose states: for every (n, k) with `k < n`, the outsider's
  profit strictly exceeds the pre-merger profit — the free-rider gain is never
  negative.
- **the solver's own convergence**: assert that the sequential solver reaches a
  fixed point (the largest single-player deviation gain is < 1e-10), so a
  silently non-converged run cannot pass as an equilibrium.

## check-browser.mjs

50–150 assertions at both viewports:

- **the geometry assertion.** In `FreeRideFigure`, map the outsider and member
  bars through `getScreenCTM()` and assert the rendered length ratio equals the
  printed `k` to within 0.5% at every (n, k) preset — the identity in pixels,
  not in the readout.
- `MergerLab`: at the (5, 4) preset the member bar's rendered height equals the
  pre-merger bar's to within 0.5px, **and** the outsider bar is more than 3×
  taller. Both halves, per the `constrained-choice` precedent.
- sweep `k` on its step grid at n = 5 and assert the member ratio readout is
  non-monotone — down, down, back to 1.00, then up — which is the shape of
  claim 3 and the thing a reader will not believe.
- `TheQuestion`: clicking either answer records it and the later section quotes
  it back; assert the recorded text appears in `TheAnswer`.
- `ThresholdFigure`: the plotted outsider count and the `√n − 2` reference
  curve are within 1.5 rendered steps of each other across the sweep.
- name every series and every bar; select by name.

## Sources

CORE U4 and U7; Salant, Switzer & Reynolds (1983) *QJE* 98(2):185–199 for the
merger paradox — the source of the "80%" folklore, which this article should
state as what it is: the n = 6 case of an exact condition, not a rule.
Stigler (1964) *JPE* 72(1):44–61 for the cartel-stability literature the
article deliberately does not enter. **Verify both, and the volume and page
numbers especially, before writing the sentences.** Theirs: the paradox and
the condition. Mine: the exact-equality case, the outsider-over-member = k
identity, the `√n − 2` measurement, every number.

## Risks

- **The simultaneous best-response solver diverges and looks like a wrong
  formula.** Updating every firm's quantity at once has eigenvalue −(n−1)/2,
  so it blows up for n ≥ 5 even with 0.5 damping; the plan-time probe reported
  a relative error of 4.07 against a formula that was perfectly correct. Use
  sequential updates, one firm at a time. **This belongs in `house-idioms.md`
  in pass 4** — it is a general fact about fixed-point iteration in games and
  the project will meet it again at Mi27–Mi30.
- **"Exactly 1.00×" will read as a rounding artefact** unless the arithmetic is
  shown. Show it: 225 before, 900 split four ways after. Integers, on screen,
  in the prose.
- **Do not let cheating in.** Every reader will ask about it and the honest
  answer is one sentence with a forward link. A paragraph on δ turns this into
  Mi29 and leaves Mi29 with nothing.
- **The merger paradox depends on quantity competition** and a reader who
  knows Bertrand will object immediately. Say in the limits section what
  changes: with price competition a partial merger does nothing at all until
  it is complete, which is a different and equally uncomfortable result.
- **`a = 100, c = 10` gives round numbers**, which is a presentation choice and
  not a result. Check at least one irrational parameterisation in
  `check-numbers.mjs` so the identities are not artefacts of the arithmetic.
