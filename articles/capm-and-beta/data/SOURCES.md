# Data sources

Both files come from the Kenneth R. French Data Library (Tuck School of
Business at Dartmouth), as distributed on 3 October 2026, built from the
**202608 CRSP database** (each file says so in its first line). French revises
the whole history whenever CRSP is updated, so the hash below is the vintage.
`node scripts/fetch-data.mjs` re-downloads both and fails if either hash moved;
`--bump` accepts a new vintage, after which `node scripts/build-data.mjs`, the
checks and a re-read of every number in the prose are needed.

| File | Series | URL | Retrieved | sha256 |
|---|---|---|---|---|
| `F-F_Research_Data_Factors.csv` | Fama/French 3 factors, monthly: Mkt-RF and RF (SMB, HML unused) | https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip | 2026-10-03 | d7d7fe37b150b5b15c9c069b3ba101dfe1af568c6d7b5db6e73cd0a6c0c9e5e5 |
| `Portfolios_Formed_on_BETA.csv` | Value-weighted monthly returns of beta deciles (60-month Scholes–Williams betas, formed each June), and each decile's value-weighted average prior beta | https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/Portfolios_Formed_on_BETA_CSV.zip | 2026-10-03 | 95efd2aed8a1594b13440a1d699efc9194f9ce7ccba0b857efa9e933183aa041 |

The page uses July 1963 to August 2026 (758 months), the months the beta file
covers. What the data can't answer: anything outside US-listed shares, and
anything about the true market portfolio, which the CAPM is about.
