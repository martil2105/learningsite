# The next five economics articles — pass-1 brief

> **Superseded on voice.** These specs were written before the voice rules of
> 22 September 2026. Where anything here disagrees with
> `reference/writing-the-prose.md`, that file wins. In particular, "report the
> draw count in the prose" means a sample the reader is looking at, never the
> checks' own counts or tolerances, and "the textbook" framings are pitches for
> the builder, not sentences for the page.

Planned 16 September 2026. One spec per article in this directory, plus a
finish brief for `economic-rent`. Hand each spec to the implementer with
`CLAUDE.md`, `reference/pass-1-design.md`, `reference/choosing-the-shape.md`,
`reference/scaffolding.md` and `reference/house-idioms.md` in context.

**Status of the numbers in the specs.** Every verdict was measured in
throwaway node probes on 16 September 2026 — closed forms against independent
numerical routes. They are hypotheses, not findings: the first job of every
pass 1 is to re-derive them against the article's own `src/` modules. Where a
new measurement disagrees, the measurement wins and the spec changes
(`verifying-an-article.md` has three precedents for this).

## Build order

| # | Slug | Row | Why here |
|---|---|---|---|
| 0 | `economic-rent` | 2 | prerequisite — its pass 1 exists, passes 2–4 remain |
| 1 | `bargaining-and-the-surplus` | 4 | lifts `constrained-choice`'s frontier |
| 2 | `markup-and-elasticity` | 5 | builds `src/market.js` |
| 3 | `tax-incidence` | 6 | extends `market.js` with the wedge |
| 4 | `externalities` | 8 | reuses the wedge; a Pigouvian tax *is* a tax wedge |
| 5 | `efficiency-wages` | 7 | lifts `constrained-choice`'s tangency |

Rows 7 and 8 are swapped against the CORE queue's nominal order on purpose:
7's own machinery is the elasticity rule article 2 proves, and 8 is 6's wedge
with the tax relabelled. Building them back to back is one shared module and
one `Wedge` component serving three articles with recognisable axes — the
shared-setup debt `subject-queue.md` records. Update the queue's order note
in pass 4 of the first article.

## Cross-cutting rules (put these in every handoff)

1. **Re-derive before you build.** See the status note above.
2. **An invariance claim needs an oracle that could have seen the variable.**
   The statutory side in `tax-incidence` and the workforce size in
   `efficiency-wages` must be computed by a route that *reads* them. This is
   the rule `nash-equilibrium` earned; `verifying-an-article.md` has it.
3. **Two derivations sharing no code** for every headline number: one closed
   form, one solver or simulation.
4. **`===` where the arithmetic is exact**, a stated tolerance elsewhere, and
   each tolerance says which of the two it is.
5. **Shared modules, in this order.** `src/market.js` is built in
   `markup-and-elasticity` (demand family, elasticity, monopoly optimum,
   pass-through), extended in `tax-incidence` (wedge, surplus integrals,
   revenue), imported in `externalities`. Lift the frontier/tangency panel
   from `constrained-choice` for `bargaining-and-the-surplus` and
   `efficiency-wages`; keep axes and parameter names recognisable between the
   three market articles. Copy plumbing, never shape (`scaffolding.md`).
6. **Prose per `reference/writing-the-prose.md`** — "we" to narrate, "you" to
   instruct, whole sentences with the logic said out loud, at most one dash
   pair per paragraph, bold-then-define in the same sentence, British
   spelling, `Thanks for reading!` as its own paragraph. Labels stay terse.
7. **One hook, small interactions everywhere else**, and every one of them
   gets a browser check.
8. **Verify every citation before writing the sentence that leans on it.**
   The volume and page numbers in the specs are from memory; two specifics
   were cut from `smote` for exactly this reason.
9. **Per-article budget**: roughly 70–150 assertions in
   `check-numbers.mjs`, 50–150 in `check-browser.mjs` at 390px and 1280px,
   including one rendered-pixel geometry assertion via `getScreenCTM()`.

## Headline identities (details and exact numbers in each spec)

| Article | The identity | Measured at plan time |
|---|---|---|
| bargaining | finite-horizon share `(1−(−δ)^T)/(1+δ)` → `r_B/(r_A+r_B)`; the outside option worth exactly zero below a threshold | backward induction agrees to 2.22e-16; seven fallback values leave 0.750037 unmoved |
| markup | pass-through `ρ = n/(1+n)`; two demands with the same point and elasticity, same price, different pass-through | 0.5057 → 1/2; ε=3 → 1.4998 vs 1.5; at c=12 the two prices are 26 and 30 |
| tax-incidence | statutory side irrelevant; at the revenue peak `q/q₀ = ½` and `DWL/revenue = ½` | 2.13e-14 over 401 rates; 1e-12 and 2e-12 over 279,871 random markets |
| externalities | tax revenue = quota rent; instrument loss ratio `(g/b)²` | 384.0 = 384.0; 0.25 / 1.00 / 4.00 at g/b = 0.5 / 1 / 2 |
| efficiency-wages | effort elasticity exactly 1 at the optimal wage; the wage independent of labour demand | 1.0 to 1e-8 over 9 parameterisations; identical at L = 1, 10, 1000 |

## Also owed

- **The spine page** (after `externalities` ships): an ordered index under
  `site/` with two sentences of bridge between consecutive articles — what
  the last one established, what the next one needs. A small change to
  `scripts/render-index.py` and the manifest; the argument is in
  `subject-queue.md`.
- **Pass-4 bookkeeping, every article**: a shape-table row
  (`choosing-the-shape.md`), a queue tick (`subject-queue.md`), a
  `site/articles.json` entry whose blurb is the claim, and anything learned
  that is not about the subject folded back into `reference/`.

## Environment reminders

The standing ones all apply (`house-idioms.md`, § Environment): `emptyOutDir`
stays false, GNU sed, `sync; sleep 1` between a build and anything that reads
its output, `NODE_PATH` for the Linux rolldown bindings when `node_modules`
was installed on the Mac, and read-only git in `site/` as
`git --no-optional-locks`.