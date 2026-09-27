<script>
  /*
    Inside a bin, PSI sees nothing at all - and "nothing" here is exact, not
    approximate. Two demonstrations: an arbitrary monotone rearrangement inside
    every decile, and the one that actually happens, which is mass gathering on
    the profitable side of a cut-off.
  */
  import { PRE, POP, B, EDGES, num, int, pct, psiFmt } from "../experiments.js";
  const FROZEN = PRE.frozenByB[B].psiFrozen;
  /* the interior decile widths, measured rather than eyeballed */
  const widths = EDGES.slice(1).map((e, i) => e - EDGES[i]);
  import * as D from "../datasets.js";
  import { binOf } from "../psi.js";
  import { linear, pathOf, areaOf } from "../chart.js";
  import { SIGNAL, MARK, FLOOR, INK, AXIS, TICK, LABEL, RULE, ACCENT } from "../palette.js";

  const W = PRE.within;
  const BG = PRE.bunchGeom;
  const BN = PRE.bunching;
  let wi = 2;
  $: w = W[wi];
  let bi = 3;
  $: b = BN[bi];

  const breaks = D.breaksFromEdges(D.BASELINE, EDGES);

  /* ------------------------------------------------- panel 1: the warp */
  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  const H = 168;
  const mg = { l: 14, r: 14, t: 12, b: 26 };
  $: pw = Math.max(60, BW - mg.l - mg.r);
  const LO = 400, HI = 880, NB = 60;
  const STEP = (HI - LO) / NB;
  const baseBins = Array.from({ length: NB }, (_, k) =>
    D.mixCdf(D.BASELINE, LO + (k + 1) * STEP) - D.mixCdf(D.BASELINE, LO + k * STEP));
  $: warpBins = Array.from({ length: NB }, (_, k) =>
    D.warpedCdf(D.BASELINE, breaks, w.gamma, LO + (k + 1) * STEP) -
    D.warpedCdf(D.BASELINE, breaks, w.gamma, LO + k * STEP));
  $: wx = linear(LO, HI, mg.l, mg.l + pw);
  $: wMax = Math.max(...baseBins, ...warpBins) * 1.12;
  $: wy = linear(0, wMax, H - mg.b, mg.t);
  /* Reactive: reads wx / wy. */
  $: wBar = (k) => wx(LO + k * STEP);
  $: wBw = () => Math.max(1, wx(LO + STEP) - wx(LO) - 1);
  $: basePath = pathOf(baseBins.map((d, k) => [wx(LO + (k + 0.5) * STEP), wy(d)]));

  /* --------------------------------------------- panel 2: the cut-off */
  const ZLO = 606, ZHI = 678, ZNB = 48;
  const ZSTEP = (ZHI - ZLO) / ZNB;
  const zBase = Array.from({ length: ZNB }, (_, k) =>
    D.mixCdf(D.BASELINE, ZLO + (k + 1) * ZSTEP) - D.mixCdf(D.BASELINE, ZLO + k * ZSTEP));
  const LAND = 4; // the moved applications land just inside the cut-off
  $: zCur = zBase.map((m, k) => {
    const lo = ZLO + k * ZSTEP, hi = lo + ZSTEP;
    let v = m;
    /* mass removed: the applications nearest the line from below */
    const rl = Math.max(lo, b.scoreFrom), rh = Math.min(hi, BG.cutoff);
    if (rh > rl && BG.cutoff > b.scoreFrom) v -= b.moved * ((rh - rl) / (BG.cutoff - b.scoreFrom));
    /* mass added: uniformly over a narrow band above it */
    const al = Math.max(lo, BG.cutoff), ah = Math.min(hi, BG.cutoff + LAND);
    if (ah > al) v += b.moved * ((ah - al) / LAND);
    return Math.max(0, v);
  });
  $: zx = linear(ZLO, ZHI, mg.l, mg.l + pw);
  $: zMax = Math.max(...zBase, ...zCur) * 1.12;
  $: zy = linear(0, zMax, H - mg.b, mg.t);
  $: zBar = (k) => zx(ZLO + k * ZSTEP);
  $: zBw = () => Math.max(1, zx(ZLO + ZSTEP) - zx(ZLO) - 1);
  $: zBasePath = pathOf(zBase.map((d, k) => [zx(ZLO + (k + 0.5) * ZSTEP), zy(d)]));
</script>

<h1 class="body-header">Inside a bin, PSI is blind</h1>

<p class="body-text">
  Binning is the whole method, and it has an immediate consequence. If the
  applications stay in the deciles they were already in, every proportion is
  unchanged, and the reading doesn't move. We don't mean that it barely moves.
  It doesn't move at all, down to the last bit of a double. This means that
  everything that happens <em>inside</em> a decile is invisible, and the deciles
  of this scorecard are
  {num(Math.min(...widths), 0)} to {num(Math.max(...widths), 0)} score points
  wide, with two more running off to either end.
</p>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <div class="ftitle">Every application pushed toward the bottom of the decile it was already in</div>
  <svg width={BW} height={H} viewBox="0 0 {BW} {H}" role="img"
       aria-label="the development distribution and a rearranged one with identical decile counts">
    {#each EDGES as e}
      <line x1={wx(e)} y1={mg.t} x2={wx(e)} y2={H - mg.b} stroke={RULE} stroke-width="1" stroke-dasharray="2 4" />
    {/each}
    {#each warpBins as d, k}
      <rect x={wBar(k)} y={wy(d)} width={wBw()} height={Math.max(0, wy(0) - wy(d))} fill={SIGNAL} opacity="0.6" />
    {/each}
    <path d={basePath} fill="none" stroke={INK} stroke-width="2" stroke-linejoin="round" />
    <line x1={mg.l} y1={H - mg.b} x2={mg.l + pw} y2={H - mg.b} stroke={AXIS} stroke-width="1" />
    {#each [400, 500, 600, 700, 800] as t}
      <text x={wx(t)} y={H - mg.b + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{t}</text>
    {/each}
    <text x={mg.l + pw / 2} y={H - 2} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">application score</text>
  </svg>
  <div class="pills warp">
    {#each W as x, i}
      <button class="pill" class:on={wi === i} on:click={() => (wi = i)}>{i === 0 ? "no rearrangement" : "×" + num(x.gamma, 1)}</button>
    {/each}
  </div>
  <div class="ro">
    <div class="rc"><span class="rk">change in PSI</span><span class="rv zero warppsi">0.000000</span></div>
    <div class="rc"><span class="rk">mean score</span><span class="rv">{num(w.mean, 1)} <em>({num(w.dMean, 1)})</em></span></div>
    <div class="rc"><span class="rk">approval rate</span><span class="rv">{pct(w.approval)} <em>({num(w.dApprovalPP, 2)} pts)</em></span></div>
    <div class="rc"><span class="rk">expected bad rate</span><span class="rv">{pct(w.meanPd)} <em>(+{num(w.dMeanPdPct, 0)}%)</em></span></div>
  </div>
</div>

<p class="body-text">
  The strongest setting there moves the mean score by
  {num(Math.abs(W[3].dMean), 1)} points, takes
  {num(Math.abs(W[3].dApprovalPP), 2)} points off the approval rate and raises
  the expected bad rate by {num(W[3].dMeanPdPct, 0)}%. Yet the decile
  proportions are identical to the last bit at every setting, so the reading
  holds at {psiFmt(FROZEN)} throughout. And that {psiFmt(FROZEN)} isn't a
  response to the rearrangement either. It's the development sample's own
  frozen error, which we met in the section on PSI's sampling distribution, and
  it would be there even if nothing had happened at all.
</p>

<h2 class="sub-header">The version that actually happens</h2>

<p class="body-text">
  That rearrangement was contrived, but this next one isn't. The cut-off sits at
  {BG.cutoff}, and decile {BG.bin} of the development sample runs from
  {num(BG.lo, 0)} to {num(BG.hi, 0)}. This means the line that the whole lending
  decision turns on sits <em>inside a bin</em>, with {pct(BG.massBelow / (BG.massBelow + BG.massAbove), 0)}
  of that bin below it.
</p>

<p class="body-text">
  Brokers learn where cut-offs are. When applications start gathering on the
  profitable side of one (because a product was switched, a co-applicant was
  added, or an application was held back a fortnight), the mass moves a few
  points, stays inside decile {BG.bin}, and changes nothing that PSI can see.
</p>

<div class="fig">
  <div class="ftitle">Decile {BG.bin} of the development sample, with the cut-off inside it</div>
  <svg width={BW} height={H} viewBox="0 0 {BW} {H}" role="img"
       aria-label="applications gathering just above the cut-off, entirely inside one decile">
    {#each EDGES.filter((e) => e > ZLO && e < ZHI) as e}
      <line x1={zx(e)} y1={mg.t} x2={zx(e)} y2={H - mg.b} stroke={RULE} stroke-width="1" stroke-dasharray="2 4" />
    {/each}
    {#each zCur as d, k}
      <rect x={zBar(k)} y={zy(d)} width={zBw()} height={Math.max(0, zy(0) - zy(d))} fill={SIGNAL} opacity="0.6" />
    {/each}
    <path d={zBasePath} fill="none" stroke={INK} stroke-width="2" stroke-linejoin="round" />
    <line x1={zx(BG.cutoff)} y1={mg.t - 4} x2={zx(BG.cutoff)} y2={H - mg.b} stroke={MARK} stroke-width="1.6" />
    <text x={zx(BG.cutoff) + 5} y={mg.t + 6} font-size="9.5" fill={MARK} font-family="var(--font-main)"
          stroke="#fff" stroke-width="3" paint-order="stroke">cut-off {BG.cutoff}</text>
    <line x1={mg.l} y1={H - mg.b} x2={mg.l + pw} y2={H - mg.b} stroke={AXIS} stroke-width="1" />
    {#each [610, 630, 650, 670] as t}
      <text x={zx(t)} y={H - mg.b + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{t}</text>
    {/each}
    <text x={mg.l + pw / 2} y={H - 2} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">application score</text>
  </svg>
  <div class="pills bunch">
    {#each BN as x, i}
      <button class="pill" class:on={bi === i} on:click={() => (bi = i)}>{i === 0 ? "none" : pct(x.frac, 0) + " nudged across"}</button>
    {/each}
  </div>
  <div class="ro">
    <div class="rc"><span class="rk">change in PSI</span><span class="rv zero bunchpsi">0.000000</span></div>
    <div class="rc"><span class="rk">approval rate</span><span class="rv">{pct(b.approval)} <em>(+{num(b.dApprovalPP, 2)} pts)</em></span></div>
    <div class="rc"><span class="rk">bad rate among approved</span><span class="rv">{pct(b.acceptedBad, 2)} <em>(+{num(b.dAcceptedBadPct, 1)}%)</em></span></div>
    <div class="rc"><span class="rk">true risk of the nudged</span><span class="rv">{b.frac === 0 ? "—" : pct(b.pdOfMoved, 1)}</span></div>
  </div>
</div>

<p class="body-text">
  The applications that cross the line didn't become safer. Only their scores
  did. Their real default rate is {pct(BN[3].pdOfMoved, 1)}, against
  {pct(PRE.population.acceptedBad, 2)} for the book they're joining, which is
  nearly three times the risk of the average approval. Yet the scorecard now
  says they're ordinary. The reading doesn't move by so much as a last bit at
  any of those settings, and neither does anything else in the pack that looks
  only at the distribution of the score.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .fig { max-width: 660px; margin: 1.4rem auto; padding: 0 0.75rem; }
  .measure { width: 100%; height: 0; }
  .ftitle { font-family: var(--font-main); font-size: 0.74rem; color: #718096; margin-bottom: 0.1rem; }
  .pills { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.35rem; }
  .pill {
    font-family: var(--font-main); font-size: 0.7rem; padding: 0.22rem 0.5rem;
    border: 1px solid #cbd5e0; background: var(--white); border-radius: 999px;
    color: #4a5568; cursor: pointer; white-space: nowrap;
  }
  .pill.on { border-color: var(--primary); color: var(--primary); background: rgba(124, 90, 237, 0.07); }

  .ro { display: flex; flex-wrap: wrap; gap: 0.35rem 1.2rem; margin-top: 0.55rem; padding-top: 0.5rem; border-top: 1px solid #eef1f5; }
  .rc { display: flex; flex-direction: column; min-width: 120px; }
  .rk { font-family: var(--font-main); font-size: 0.68rem; color: #718096; }
  .rv { font-family: var(--font-heavy); font-size: 1rem; color: var(--squid-ink); }
  .rv em { font-family: var(--font-mono, monospace); font-size: 0.72rem; font-style: normal; color: #2074d5; }
  .rv.zero { font-family: var(--font-mono, monospace); font-size: 0.95rem; color: #8a94a2; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .fig { padding: 0 0.5rem; }
  }
</style>
