# `measuring-gdp`

**Kind** concept · **Shape** question first, into a displacement lab · **Hook** `ImportLab` ·
**Stack** Svelte 5 + Vite

Pass-1 spec: `claude/measuring-gdp-pass1-spec.md` in the project.
Row 14 (Ma1) of `economics-curriculum-slate.md`.

## The angle

GDP is written C + I + G + X − M, and the minus sign is routinely read as imports
making a country poorer. It's a correction: M removes import content that the
other four terms already counted. An import changes GDP only through the home
production it displaces, anywhere from none of its value to all of it, and the
net-exports line in a release reads the same across that whole range.

## The model

An island with three firms: a farm (wheat €30 to the mill), a mill (flour €50 to
the bakery) and a bakery (bread €100 to households). Wage shares per firm are
fixed; profit is the residual. `src/accounts.js` writes the ledger for any
combination of four events and reads it three ways, production, expenditure and
income, with no shared code. `verify/check-numbers.mjs` adds a fourth route, the
domestic content of each final use, written from scratch.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | The three approaches give the same number | **True by construction**: production and expenditure agree with `===`, and income to machine precision, in all 16 combinations of the events |
| 2 | Adding up sales double-counts | **True, and the overcount is industrial organisation**: €180 of sales on €100 of GDP, 30·3 + 20·2 + 50·1; k equal firms sell (k+1)/2 times GDP; merging mill and bakery drops sales to €130, GDP unchanged |
| 3 | Imports subtract from GDP | **False as stated**: €40 of imported bikes, C +40, M +40, GDP +0; imported flour, GDP −€50, the domestic value added displaced |
| 4 | The net-exports contribution measures the damage imports did | **False**: with home-made flour it reads −€40 at every slider position while GDP moves from €0 to −€40 (−€40·d); with imported flour GDP moves −€20·d and NX slopes. Consumption net of its own imports equals ΔGDP exactly |
| 5 | Unsold goods don't count | **They do**: C −€20, inventories +€20, GDP unchanged; a stockpiling quarter reads NX −€40, inventories +€40, both zero net of own imports |

## Layout

| Section | Component |
|---|---|
| the base year | `LedgerFigure` — transactions and three stacked columns ending on one GDP line |
| the question | `EventQuiz` — four events, answer each, the ledger redraws |
| double counting | `ChainFigure` — a stepper for the number of firms, sales vs GDP |
| the hook | `ImportLab` — share of the bike money taken from bread, flour toggle, three release lines, two tables |
| reading a release | `ReleaseTable` — the stockpiling quarter |

## Verification

- `npm run check` — **30 checks**, every number in the prose, the 16-combination
  agreement, the lab's lines over the slider's whole grid, and the stockpile
  ledger three ways.
- `verify/check-browser.mjs` — **70 checks** at 390px and 1280px. Article
  geometry through `getScreenCTM()`: the three net stacks end on the GDP line
  (base, imported flour, bikes); the chain's bars add to the readout and the
  last reaches €100; every lab marker lies on its line, the NX line is flat with
  home-made flour and sloped with imported flour, the GDP line halves its slope,
  and the tables print the markers' values; the slider stays on screen on a
  phone.

## Sources

"Do imports subtract from GDP?", FRED Blog, 13 Sept 2018; Hale, Hobijn, Nechio
& Wilson, FRBSF Economic Letter 2019-01. Nothing is reproduced from either.
