# Data sources

One file, pinned with its hash in `data/sources.json`.
`node scripts/fetch-data.mjs` re-downloads it and fails if the hash moved;
`--bump` accepts a new version, after which `node scripts/build-data.mjs`, the
checks and a re-read of every number in the prose are needed.

| File | Series | URL | Retrieved | sha256 |
|---|---|---|---|---|
| `F-F_Research_Data_Factors_daily.csv` | Fama/French 3 factors, daily: Mkt-RF and RF (SMB, HML unused), 1 July 1926 to 31 August 2026. Built from the **202608 CRSP database**; French revises the whole history whenever CRSP is updated, so the hash is the vintage | https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_daily_CSV.zip | 2026-10-04 | c2dc30c9e89eeea05a689c81fb426f4d76711270733b3731997615cbdff5b247 |

How the page uses it: the market's total daily return is Mkt-RF + RF (both in
percent with two decimals, kept exactly as whole hundredths of a percent).
GARCH(1,1) is fitted to the demeaned simple returns of every day, starting
from the sample variance; the fit is in `src/precomputed.js` and the check
re-runs it.

What the data can't answer: anything outside US shares, and whether one set
of GARCH numbers suits a century in which trading itself changed.
