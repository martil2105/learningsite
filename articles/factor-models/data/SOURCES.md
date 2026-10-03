# Data sources

All three files come from the Kenneth R. French Data Library (Tuck School of
Business at Dartmouth), as distributed on 3 October 2026, built from the
**202608 CRSP database** (each file says so in its first line). French revises
the whole history whenever CRSP is updated, so the hash is the vintage.
`node scripts/fetch-data.mjs` re-downloads them and fails if a hash moved;
`--bump` accepts a new vintage, after which `node scripts/build-data.mjs`, the
checks and a re-read of every number in the prose are needed.

| File | Series | URL | Retrieved | sha256 |
|---|---|---|---|---|
| `F-F_Research_Data_5_Factors_2x3.csv` | Fama/French 5 factors (2x3), monthly and annual: Mkt-RF, SMB, HML, RMW, CMA, RF | https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_5_Factors_2x3_CSV.zip | 2026-10-03 | c4915afc1e2a1fce6fbba415f574d825a3e1b800c8d1aa31c72351789851eb22 |
| `F-F_Momentum_Factor.csv` | Momentum factor (Mom), monthly and annual | https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Momentum_Factor_CSV.zip | 2026-10-03 | 613b628c5ffa8b957e03ad3a4ccd891d3aa6daafc1801dffb7db7376f2017bdc |
| `Portfolios_Formed_on_BETA.csv` | Portfolios formed on market beta, value-weighted monthly returns (the lowest-beta decile is used) | https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/Portfolios_Formed_on_BETA_CSV.zip | 2026-10-03 | 95efd2aed8a1594b13440a1d699efc9194f9ce7ccba0b857efa9e933183aa041 |

The page uses July 1963 to August 2026 (758 months), the months all three
files cover. What the data can't answer: whether the factors are rewards for
risk or mispricing, and how the paper portfolios would have fared after
trading costs.
