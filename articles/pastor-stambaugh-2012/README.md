# pastor-stambaugh-2012 (Fr19)

Finance row 48, Stage 8a, `finance/portfolios`. Paper explainer (📄). Built 28
September 2026. Needs `time-diversification` (Fr16); Fr7 (`equity-premium`) is
not built, so the article explains the estimated mean inline.

**Kind:** result (a decomposition from a paper). **Shape:** paper explainer:
citation card → the measurement and the other question → forecast lab (the
unknown mean) → the predictive system and its five pieces → two-variances lab
with a piece-by-piece bar chart → persistence chart (Jensen) with the long-run
parabola → what the paper found (quoted) → what came later. **Hooks:**
`ForecastLab`, `TwoVariances`, `PersistenceFig`.

## Source

Pástor, Ľ. and Stambaugh, R. F. (2012), "Are stocks really less volatile in the
long run?", Journal of Finance 67(2), 431–478. Read from the 2011 Rodney L.
White Center working-paper version and the NBER abstract: the predictive
system, equation 12 (five components), the (1 + k/T) example with k = 50 and
T = 206, the 1802–2007 sample, the prior median of β (0.83), and the benchmark
results quoted on the page (30-year per-year variance about 45% above one
year, 50-year about 80%; 50-year range 1.45–1.96 across priors), plus the
target-date conclusion from the abstract. We write N for the years of data
(the paper's T) to keep T free for the horizon used elsewhere in the section.

Carvalho, Lopes & McCulloch (2018, JASA 113(523)) and Avramov, Cederburg &
Lučivjanská (2018, RFS 31(2)): abstracts read on the web, 28 September 2026.

## Model (ours)

r = μ + u, μ − μ̄ = β(μ − μ̄) + w, corr(u, w) = ρ. One-year volatility 20%,
R² (share of one-year variance from μ) 5%, β = 0.83, ρ ∈ {−0.9, −0.7, −0.5}
(strong/moderate/weak, default moderate). The investor sees 206 returns and
nothing else: a two-state Kalman filter over (μ̄, μ_T − μ̄), flat on μ̄. Doubt
about β is uniform on [0.75, 0.91] or [0.66, 1], averaged on 200 midpoints,
starting from a day when the best guess of today's expected return equals the
best guess of μ̄ (so only variances average).

## Claims and verdicts

| Claim | Verdict |
|---|---|
| Not knowing the mean adds variance that grows with the horizon | Exact: per-year forecast variance σ²(1 + k/N). 1.30 at k = 30, N = 100; the paper's 1.243 at 50/206 reproduced; a nominal 90% band holds 85%; equal parts at k = N |
| The record's per-year variance falls with the horizon | True in our world: 0.59 of one year at 30 years (moderate) |
| So does the investor's | Not by as much: 0.66 with β known (the ignorance pieces grow), 0.81 with β in [0.66, 1], above one (1.06 at 30, 1.18 at 50) with weak reversion as well |
| Mean reversion can make the long run as calm as we like | No: with everything known the long-run per-year variance is σ_u²(1 + 2ρd + d²), d = σ_w/(σ_u(1 − β)); its floor is 1 − ρ² (0.51 at ρ = −0.7), and it exceeds σ_u² once d > −2ρ (β ≈ 0.95 here) |
| (found in probing) Why doubt about β matters | The 30-year variance is flat in β up to 0.9, more than doubles by 0.98, peaks near 0.99 and falls back at 1 (a constant is learnable); averaging over a band that reaches the steep part lifts it well above its value at 0.83 |
| Our small model reproduces the paper's +45% | No, and the page says so: fixing σ, R² and ρ keeps ours below one at moderate reversion; the paper's investor is unsure about every parameter |

## Checks

49 number checks: the unknown-mean law against a brute-force simulation with
its own generator; the world's variance against a covariance-matrix sum; the
investor's total against universal kriging on the full 206 × 206 covariance
matrix (no filter); the known-model pieces against a simulation of the system;
the long-run parabola against the pieces at k = 20,000. 118 browser checks,
including the drawn count of futures outside each band equal to the readout
across five histories, the one negative (pink) bar, the investor's dot on her
line, and the pink average line equal to the curve's mean over the band in
pixels.

## Sources

Pástor & Stambaugh (2012); Siegel, *Stocks for the Long Run*; Carvalho, Lopes
& McCulloch (2018); Avramov, Cederburg & Lučivjanská (2018).
