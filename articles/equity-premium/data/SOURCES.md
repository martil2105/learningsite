# Data sources

Two files, both pinned with their hashes in `data/sources.json`.
`node scripts/fetch-data.mjs` re-downloads both and fails if either hash moved;
`--bump` accepts a new version, after which `node scripts/build-data.mjs`, the
checks and a re-read of every number in the prose are needed.

| File | Series | URL | Retrieved | sha256 |
|---|---|---|---|---|
| `F-F_Research_Data_Factors.csv` | Fama/French 3 factors, monthly and annual: Mkt-RF and RF (SMB, HML unused). Built from the **202608 CRSP database**; French revises the whole history whenever CRSP is updated, so the hash is the vintage | https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip | 2026-10-03 | d7d7fe37b150b5b15c9c069b3ba101dfe1af568c6d7b5db6e73cd0a6c0c9e5e5 |
| `shiller-sp500.csv` | Robert Shiller's monthly S&P composite (price, dividend, earnings, CPI, long rate) since January 1871, as tidied by the Frictionless Data project | https://raw.githubusercontent.com/datasets/s-and-p-500/07b81e6af68239acd65b901a11844d6d95db6ead/data/data.csv | 2026-10-03 | 3a45dffabc414afc298c12159abc84c2875f88175ff3d4473ef7417e725ecac6 |

The Shiller file is pinned to one commit of the GitHub mirror rather than to
Shiller's own spreadsheet, which is an `.xls` that changes in place. Its prices
are monthly averages of daily closes, its dividends are annualised rates
(interpolated from annual figures before 1926), and dividends run to June 2023.

How the page uses them:

- **Premiums**: French's annual Mkt−RF, 1927 to 2025 (99 years), and the
  monthly series over the same years (1,188 months). The 2026 months are left
  out so the two cover the same calendar.
- **Real returns**: January to January. A year's return is the dividends paid
  during the year (the average of its twelve monthly rates) over January's
  price, plus January-to-January price growth, both after CPI inflation.
  Dividend growth is January's rate to the next January's. Years 1871 to 2022
  (152 years); 2023 is the first year without twelve months of dividends.

What the data can't answer: anything outside US shares, and anything about
markets that didn't survive the century, which is the survivorship question
the page quotes rather than tests.
