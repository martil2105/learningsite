# Data sources

Two files, pinned with their hashes in `data/sources.json`.
`node scripts/fetch-data.mjs` re-downloads them and fails if a hash moved;
`--bump` accepts a new version, after which `node scripts/build-data.mjs`, the
checks and a re-read of every number in the prose are needed.

| File | Series | URL | Retrieved | sha256 |
|---|---|---|---|---|
| `BAA.csv` | FRED `BAA`: Moody's Seasoned Baa Corporate Bond Yield, percent a year, monthly averages, January 1919 to September 2026. Bonds with 20 years or more to maturity | https://fred.stlouisfed.org/graph/fredgraph.csv?id=BAA | 2026-10-10 | 3396297d0b2f8f4e8bb467207286c33c04d97bfe37b25bc5a97da6bafc615e93 |
| `AAA.csv` | FRED `AAA`: Moody's Seasoned Aaa Corporate Bond Yield, the same | https://fred.stlouisfed.org/graph/fredgraph.csv?id=AAA | 2026-10-10 | 15248259177710745867656c413bb2bae549c6485ca3acb7eed348a812f497ac |

How the page uses them: the spread is BAA − AAA each month, in points, kept
exactly as whole hundredths. The 1970–2001 average (1.09 points) is the figure
Chen, Collin-Dufresne and Goldstein (2009) report in their Table 1 from the
same Moody's series, which is our check on the files.

Not data: the default rates (Baa 4.89% and Aaa 0.63% within ten years, Baa
1.55% and Aaa 0.04% within four) and the recovery (44.9 cents) are Moody's
1970–2001 figures as Chen, Collin-Dufresne and Goldstein report them, quoted.

What the data can't answer: how much of the spread is taxes, liquidity or
calls, which would need bond-level prices; and anything about other countries.
