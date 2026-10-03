# equity-premium (Fr7) 📊

Finance row 17, `finance/portfolios`. Built 3 October 2026. Needs Fr4.

**Kind:** empirical. Two pinned files (hashes in `data/sources.json`, notes in
`data/SOURCES.md`): Kenneth French's research factors, 202608 CRSP vintage
(yearly and monthly Mkt−RF, 1927 to 2025), and Shiller's monthly S&P composite
from the datasets/s-and-p-500 mirror at commit 07b81e6 (1871 to 2023).
**Shape:** build-up: a century of premiums and its band (`BandLab`) → more
often isn't more precise (`GuessCard`, `FreqBands`) → thirty years at a time
(`RollingChart`) → what dividends say (`SplitLab`) → costs. **Hook:** `BandLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| The US equity premium is about 8–9% | Average yearly Mkt−RF 1927–2025: 8.9%, sd 20.1, SE 2.0, 95% band 4.9–12.8. Halves 8.5 (1.9–15.0) and 9.3 (4.7–13.8). Log premium 6.5 |
| More data (monthly) narrows it | No: monthly over the same 99 years gives 8.3 with SE 1.9; at every length from 20 to 99 years the monthly SE is 83–94% of the yearly one, against the 29% that twelve times as many years would give. 12 × the monthly mean is the sum of months over T, so only T matters (Merton 1980) |
| A century settles it | 30-year windows run from 4.7% (1965–94) to 14.2% (1932–61); 20-year 2.5–16.1; 50-year 5.4–10.0 |
| (Fama–French 2002) the dividend estimate | Real S&P, January to January: 1871–1950 8.1 realised vs 7.6 from dividends; 1951–2000 9.3 vs 4.6 (SE 2.2 vs 0.6), P/D 14 → 83, the gap is exactly mean price growth minus mean dividend growth and, compounded, exactly the rise in P/D; 1951–2022 8.3 vs 5.1, P/D → 59 |
| Survivorship pushes it up | Not testable here; quoted (Jorion and Goetzmann 1999; Dimson, Marsh and Staunton) and linked to Fr20 |

## Numbers on the page

`verify/check-numbers.mjs` (82 checks): data hashes and a fresh parse against
`src/data.js`; raw values read straight from both CSVs; a 20,000-draw bootstrap
of the years against the standard error formula; the monthly-sum identity; the
two decomposition identities for every period; every number in page order,
rounded the way the page rounds; chart windows for every slider position.
`verify/check-browser.mjs` (76 at 390 and 1280 px): readouts for every preset
and toggle, the mean line and 1931's bar read back from the pixels, the
ruler's band, the imagined band at one root-twelfth of the yearly one, the
rolling line read at 1961 and 1994, the slider clamps in both labs, the
stacks read back to 9.3 and 4.6 on a shared yield.

## Data

`scripts/fetch-data.mjs` (downloads and checks hashes), `scripts/build-data.mjs`
(writes `src/data.js`), `scripts/data-lib.mjs` (curl, unzip, French CSV blocks).

## Sources

French Data Library; Shiller's data; Mehra & Prescott (1985); Merton (1980);
Fama & French (2002); Jorion & Goetzmann (1999); Dimson, Marsh & Staunton
(2002).
