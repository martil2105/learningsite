# `perfect-competition` — pass-1 spec

**Kind** model · **Shape** one steered simulation — **the project's first use**
· **Hook** `EntryRun`
**Stack** Svelte 5 + Vite · **Queue** slate row 8 (Mi8); builds `src/entry.js`,
which `monopolistic-competition` imports; imports `src/cost.js` from
`cost-curves` and `MarketPanel.svelte` from `supply-and-demand`
**Closest analog by shape** none — the shape has never been built here. The
nearest mechanics are `dbscan-hdbscan`'s step sequence, and the nearest
*feeling* is `smote`'s lab, which runs a process the reader controls.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

Entry is a process that happens one firm at a time, and the whole claim is
about what the last firm finds when it arrives. `choosing-the-shape.md` says
one steered simulation is natural for anything iterative and lists it as
unused; this is the subject it was written for. The article *is* the run: the
reader admits firms one at a time, watches the price step down and the profit
step down with it, and stops at the firm that would lose money. Everything
else on the page is a figure hung off that run.

The shape also does the argument's work for free. A continuous story says
price falls *to* minimum average cost; a stepped one makes it visible that it
falls *past* nothing and lands wherever the last whole firm leaves it.

## The angle

Free entry does not drive price to minimum average cost, and the reason is not
frictions or barriers — it is that firms are whole numbers. The last firm that
can enter leaves the price strictly above minimum average cost, and every
surviving firm keeps a profit no entrant can compete away. In a market with
fifty firms that profit is 2% of a firm's fixed cost; it shrinks like one over
the number of firms, and it never reaches zero. So the long-run supply curve
that every course draws as a horizontal line at minimum average cost is a
**sawtooth**, and the teeth have a closed form.

## The model

Identical firms, `C(q) = F + c·q + d·q²/2` with `F = 50, c = 10, d = 2`, so
the efficient scale is `q_e = √(2F/d) = 7.0711` and minimum average cost is
`c + √(2Fd) = 24.1421`. Linear demand `Q = A − B·p`.

Each firm is a price taker, so `p = MC` gives `q = (p − c)/d` and

```
p(n) = (A·d + n·c)/(B·d + n)
π(n) = (p(n) − c)²/(2d) − F          so π ≥ 0  ⟺  p ≥ min AC
n̄    = d(A − B·(c + s))/s            s = √(2Fd), the real-valued zero-profit n
n*   = ⌊n̄⌋
```

**The equilibrium must be reached by the run, not by the formula.** The
article's own solver admits firms one at a time and stops at the first one
that would lose money, and `check-numbers.mjs` compares that to `⌊n̄⌋`. A
check that computes `n*` from the closed form and then reports that the closed
form holds has measured nothing.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | Entry continues while profits are positive | True, and the run shows it: at A = 600, B = 10 the prices are 24.7059, 24.4928, 24.2857, 24.0845 as the 48th, 49th, 50th and 51st firms arrive | `EntryRun` |
| 2 | Free entry drives profit to zero | **It cannot.** n̄ = 50.7107, so the 51st firm would lose 0.4067 and stays out; the fifty firms that are in each keep **1.0204**, which is 2.041% of a firm's fixed cost, and no entrant can take it | `EntryRun` readout |
| 3 | Price falls to minimum average cost | **It stops 0.1436 above it**, at 24.2857 against 24.1421 | `EntryRun` |
| 4 | — (**the identity**) | `p − min AC = s·frac(n̄)/(B·d + n*)` and `π/F = (1+x)² − 1` with `x = frac(n̄)/(B·d + n*)`: worst relative ≈5e-10 on both, over ~370,000 random markets. The residual is a cancellation of two nearly equal prices, not an error — state the tolerance as such | `SawtoothFigure` |
| 5 | In a big enough market the story is right | **In the limit, and it gets there like 1/n.** Mean surviving profit as a share of fixed cost: 2.62% in markets with under ten firms, 1.78% at 10–49, 0.71% at 50–199, 0.19% at 200–999, 0.092% above a thousand (200,000 random markets; the bucket means move in the third figure with the seed, so assert the ordering and the magnitudes, not the decimals). The received account is an excellent approximation and a false statement, which is the honest description | `SawtoothFigure` |
| 6 | The long-run supply curve is horizontal at minimum average cost | **It is a sawtooth around it**, with each tooth ending where the next whole firm becomes viable, and the teeth shrinking like 1/n | `SawtoothFigure` |
| 7 | Free entry gives too many firms (business stealing) | **Not here, and the direction is the opposite.** Over 37,040 random markets the welfare-maximising number of firms is either `n*` or `n* + 1` and **never anything else** — 50.2% and 49.8% — so price-taking entry is never excessive and is at most one firm short. The excess-entry result needs market power, which is the next article's | `WelfareFigure` |
| 8 | — (cost) | Identical firms, so the whole of `economic-rent`'s story is switched off; perfect divisibility of output but not of firms, which is the asymmetry the article is built on; no sunk costs, no entry lags, no uncertainty about whether the others will come too | limits |

## The worked run

A = 600, B = 10. n̄ = 50.710678.

| n | price | profit per firm |
|---|---|---|
| 48 | 24.705882 | 4.065744 |
| 49 | 24.492754 | 2.509977 |
| 50 | **24.285714** | **1.020408** |
| 51 | 24.084507 | −0.406665 |
| 52 | 23.888889 | −1.774691 |

min AC = 24.142136. The run stops at 50.

## The identity on screen

`SawtoothFigure`: market size on the x axis, price on the y, with the
horizontal line at minimum average cost drawn as the textbook answer and the
actual long-run price drawn over it — a sawtooth that touches the line at
every market size where `n̄` happens to be a whole number and rises above it
in between. A second panel shows the same thing as profit over fixed cost,
with the 1/n envelope drawn through the peaks.

The figure has to be read at two zoom levels to land: at small market sizes
the teeth are obvious, and at large ones the reader sees them flatten into the
line they were taught. A zoom control is the right small interaction, and it
is the one place a log axis earns itself.

## Layout

`TheFirm` (setup: one firm's average and marginal cost from `cost.js`, and the
price line — the only figure with a market in it, on `MarketPanel`) →
`EntryRun` (the hook: admit firms one at a time, with a step button, an
auto-run and a scrubber; price, profit and the firm count update together, and
the run refuses the firm that would lose money) → `TheLastFirm` (what the run
found: the three numbers, the gap to minimum average cost) →
`SawtoothFigure` (the identity, with the zoom) → `WelfareFigure` (the
free-entry count against the welfare-maximising count, over a market-size
sweep, showing only ever 0 or 1 apart) → limits.

`EntryRun` is the article. The others are short.

## Non-overlap

- `surplus-and-efficiency` (row 5) owns the surplus triangle and the
  quantity-versus-allocation accounting. `WelfareFigure` here reports a
  *number of firms*, not a triangle, and must not shade one.
- `economic-rent` (live) owns what identical firms switch off: with different
  costs the marginal firm earns zero and the rest earn rent. Say that in one
  sentence and link; the heterogeneous long-run supply curve is `industry-supply`
  (Mi25), and promising it here is a debt the spine page will have to keep.
- `monopolistic-competition` (row 10) owns the excess-entry result and free
  entry with differentiated products. Claim 7 exists to hand that over, not to
  settle it.
- `cost-curves` (row 7) owns the shape of `C(q)` and the envelope. Import
  `cost.js`; do not redraw the plant family.

## check-numbers.mjs

15–20 `ok()` blocks:

- the firm: `q_e === √(2F/d)` and `min AC === c + √(2Fd)`, and `π(n) ≥ 0 ⟺
  p(n) ≥ min AC` over a grid of n — the equivalence, not just the values.
- **the run against the formula**: the step-by-step admitting solver stops at
  `⌊n̄⌋` in ≥ 10,000 seeded random markets, exactly, every time. This is the
  check that makes everything else a measurement.
- the worked run's five rows as exact arithmetic.
- **the identity**, both halves, over ≥ 300,000 seeded random markets, worst
  relative < 1e-8, **excluding markets where `frac(n̄) < 1e-4`** and saying in
  the check why: the price gap is a difference of two numbers near 24.14, so
  the relative error on a vanishing gap is cancellation and not a defect.
- the profit-by-market-size table: assert the five bucket means are strictly
  decreasing and that the first exceeds 2% while the last is under 0.2%. The
  decimals are seed-dependent and asserting them is the mistake
  `verifying-an-article.md` records against `comparative-advantage` — put the
  draw count in the prose and assert the shape.
- the 1/n envelope: `π/F ≤ 3/(B·d + n*)` in every one of those markets — an
  inequality the prose states, asserted as an inequality.
- **claim 7**: over ≥ 30,000 random markets the welfare-maximising integer
  minus `n*` is in `{0, 1}` and never outside it, with the two frequencies
  reported; plus the worst welfare loss, named as a small-market number.
- a market where `n̄` is a whole number by construction: profit is then exactly
  zero and price exactly minimum average cost, to < 1e-12. The knife edge has
  to be shown to exist, or claim 2 sounds like an approximation argument.

## check-browser.mjs

50–150 assertions at both viewports:

- **the geometry assertion.** Step the run to `n*` and assert, through the
  `getScreenCTM()` of the price panel, that the rendered price marker sits
  **above** the minimum-average-cost line by the same number of pixels the
  readout's gap implies, to within 1px; then step one further and assert the
  marker crosses below it. Both directions.
- the run's controls: stepping forward n times and scrubbing to n land on
  identical rendered state (compare the price marker's y to < 0.1px), so the
  scrubber and the button cannot drift apart.
- the run refuses to admit the loss-making firm: after pressing step at `n*`
  the firm count does not change and a readout says why.
- `SawtoothFigure`: at the zoomed-in setting the drawn price path is strictly
  above the min-AC line at ≥ 20 sampled x positions and touches it (< 0.5px)
  at the marked integer points; at the zoomed-out setting the maximum vertical
  distance is under 2px — the flattening, asserted rather than described.
- `WelfareFigure`: the two step series never differ by more than one step at
  any sampled x.
- name every series; the run's state lives in one `$state` object and the
  scrubber is `$bindable`.

## Sources

CORE U8 for the competitive market and long-run equilibrium; the integer
problem in free entry is standard in industrial organisation — Novshek (1980)
*RES* 47(3):473–486 on Cournot existence with free entry, and Mankiw &
Whinston (1986) *RAND* 17(1):48–58 for the entry-externality result that claim
7 says does **not** apply under price taking. **Verify all three before
writing the sentences that lean on them**, and in particular check whether
Mankiw–Whinston's "at most one firm too many" statement is theirs or is being
reconstructed here — the measurement is ours either way, but the attribution
must not be. Theirs: the framework and the entry-externality literature. Mine:
the sawtooth, the `(1+x)² − 1` form, every number.

## Risks

- **First use of the shape, so budget for it.** A steered simulation needs a
  state machine, a scrubber, an auto-run with a stop, and a way to get back to
  the start — none of which the scaffold has. Write it as one `$state` object
  with a pure `stepTo(n)`, so the scrubber and the button share a code path
  and the browser check above can compare them.
- **Auto-run plus a CSS transition is the element-screenshot trap** in
  `house-idioms.md`: a still frame catches the animation mid-flight and looks
  like a bug. Pause the run before any screenshot, and keep transitions under
  100ms.
- **The claim is small and must not be oversold.** Two per cent of a fixed
  cost is not a scandal, and the article that pretends it is will lose the
  reader who knows better. The interesting thing is that a statement everyone
  repeats is exactly false and approximately true, and that the error has a
  closed form. Claim 5 is where the article earns its honesty; do not cut it.
- **`frac(n̄)` is the whole story and it is invisible.** Put it on screen as a
  readout from the first figure onward, named in words ("the market has room
  for 50.71 firms"), or the sawtooth arrives from nowhere.
- **Do not let the run become a game.** No score, no animation of little
  factories. The controls are step, play, scrub, reset.
