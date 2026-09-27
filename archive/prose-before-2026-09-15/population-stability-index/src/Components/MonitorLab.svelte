<script>
  /*
    The hook. Two knobs and a button:

      how far the population REALLY moved     (a location shift, in score points)
      how many applications the month had     (log, 50 to 100,000)
      draw another month                      (a fresh sample at the same settings)

    and one thing to watch: the reading, against the band it would have sat in
    if nothing had moved at all. Those two move independently, which is the
    entire article.

    The PSI axis is logarithmic, and that is not a stylistic choice. The
    quantities of interest here run from 0.0002 (the floor at 44,000
    applications) to 0.5 (a small window on a moved population), three and a
    half orders of magnitude. On a linear axis the null band at large N is
    thinner than its own stroke, which is precisely the regime the article
    needs the reader to see.
  */
  import { onMount } from "svelte";
  import {
    EDGES, FINE, M, B, makePool, readWindow, psiOf, baselineDensity,
    nullBand, floorOf, adjusted, psiFmt, num, int, pct, POP, AMBER, RED,
    pointsForPsi, amberPoints, PRE,
  } from "../experiments.js";
  import * as D from "../datasets.js";
  import { mulberry32 } from "../rng.js";
  import { linear, log as logScale, pathOf, areaOf } from "../chart.js";
  import { SIGNAL, SIGNAL_WASH, FLOOR, FLOOR_WASH, MARK, INK, RULE, LABEL, AXIS, TICK, ZONE, ZONE_LABEL, ACCENT } from "../palette.js";

  const POOL_MAX = 100000;
  const N_MIN = 50, N_MAX = POOL_MAX;

  let seed = 4711;
  let pool = null;
  let shift = 0;         // score points the population really moved, downward
  let logN = Math.log(2000);
  let history = [];

  $: N = Math.round(Math.exp(logN));
  $: delta = -shift;

  onMount(() => { pool = makePool(mulberry32(seed), POOL_MAX); });
  function redraw() {
    seed += 1;
    pool = makePool(mulberry32(seed), POOL_MAX);
    history = [...history, reading].slice(-44);
  }

  const baseFine = baselineDensity(FINE);
  $: win = pool ? readWindow(pool, N, delta, EDGES, FINE) : null;
  $: reading = win ? psiOf(win.counts) : 0;
  $: band = nullBand(N);
  $: floor = floorOf(N);
  $: adj = reading - floor;
  /* The population divergence at this shift - the thing the corrected reading
     is an estimate of. Taken from the exact curve, measured against the true
     baseline population rather than against e = 1/B, so at zero drift it is
     zero rather than the development sample's frozen error. */
  $: truePsi = PRE.shiftCurve[Math.min(PRE.shiftCurve.length - 1, Math.round(shift))].psiPop;
  /* Four decimals everywhere in the readout, so that the subtraction on screen
     reads as a subtraction. Three rounds 0.0047 - 0.0045 = 0.0002 into
     "0.005 - 0.005 = 0.0002", which looks like an arithmetic error. */
  const r4 = (x) => (Math.abs(x) < 0.00005 ? "0.0000" : num(x, 4));

  /* ------------------------------------------------------------- layout */
  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  $: wide = BW > 620;
  const HH = 176;   // the distribution panel
  const AH = 104;   // the PSI axis panel
  const mg = { l: 12, r: 12, t: 12, b: 26 };

  $: pw = Math.max(60, BW - mg.l - mg.r);
  $: xs = linear(FINE.lo, FINE.hi, mg.l, mg.l + pw);
  $: maxDens = Math.max(...baseFine, ...(win ? win.fine.map((c) => c / N) : [0])) * 1.12;
  $: ys = linear(0, maxDens || 1, HH - mg.b, mg.t);
  $: step = (FINE.hi - FINE.lo) / FINE.count;
  /* Reactive, never const: each of these reads xs / ys / step. */
  $: binLeft = (k) => xs(FINE.lo + k * step);
  $: binW = () => Math.max(1, xs(FINE.lo + step) - xs(FINE.lo) - 1);
  $: basePath = pathOf(baseFine.map((d, k) => [xs(FINE.lo + (k + 0.5) * step), ys(d)]));

  $: ax = logScale(1e-4, 1, mg.l, mg.l + pw);
  const AXT = [1e-4, 1e-3, 1e-2, 1e-1, 1];
  const AXL = ["0.0001", "0.001", "0.01", "0.1", "1"];
  $: axClamp = (v) => Math.max(mg.l, Math.min(mg.l + pw, ax(Math.max(1.05e-4, v))));
  /* The zone words are drawn inside the svg, where text does not wrap and does
     not shrink, so each one is dropped when its own band is narrower than the
     words are wide. On a phone that leaves "no action", which is the one the
     reader needs. */
  $: ZONES = [
    { label: ZONE_LABEL[0], lo: mg.l, hi: ax(AMBER), need: 52 },
    { label: "investigate", lo: ax(AMBER), hi: ax(RED), need: 58 },
    { label: "review", lo: ax(RED), hi: mg.l + pw, need: 38 },
  ].map((z) => ({ ...z, w: z.hi - z.lo, mid: (z.lo + z.hi) / 2 }));

  $: shiftLabel = shift === 0
    ? "nothing moved"
    : "the population moved " + num(shift, 0) + " points down  ·  " + num(shift / POP.sd, 2) + " sd";
  $: verdict = reading < AMBER ? ZONE_LABEL[0] : reading < RED ? ZONE_LABEL[1] : ZONE_LABEL[2];
  $: zoneIdx = reading < AMBER ? 0 : reading < RED ? 1 : 2;
  $: nLabel = int(N) + " applications";
  $: pAmberLabel = band.pAmber < 0.0005 ? "under 0.1%" : pct(band.pAmber, 1);
  const smallN = PRE.nullGrid.find((g) => g.N === 170);
  const tinyN = PRE.nullGrid.find((g) => g.N === 50);
  const bigN = PRE.nullGrid.find((g) => g.N === 60000);
</script>

<h1 class="body-header">Two knobs</h1>

<p class="body-text">
  One says how far the population really moved. The other says how many
  applications happened to come through the door. The reading responds to both,
  and only one of them is about the model.
</p>

<div class="lab">
  <div class="measure" bind:clientWidth={boxWidth} />

  <div class="panel">
    <div class="ptitle">Score distribution — development sample against this month</div>
    <svg class="dist" width={BW} height={HH} viewBox="0 0 {BW} {HH}" role="img"
         aria-label="the development score distribution as an outline, with this month's applications as bars">
      <!-- the deciles that define the bins -->
      {#each EDGES as e}
        <line class="edge" x1={xs(e)} y1={mg.t} x2={xs(e)} y2={HH - mg.b} stroke={LABEL} stroke-width="1" stroke-dasharray="2 4" opacity="0.42" />
      {/each}
      {#if win}
        {#each win.fine as c, k}
          <rect class="bar" x={binLeft(k)} y={ys(c / N)} width={binW()} height={Math.max(0, ys(0) - ys(c / N))}
                fill={SIGNAL} opacity="0.62" />
        {/each}
      {/if}
      <path d={basePath} fill="none" stroke={INK} stroke-width="2" stroke-linejoin="round" />
      <line x1={mg.l} y1={HH - mg.b} x2={mg.l + pw} y2={HH - mg.b} stroke={AXIS} stroke-width="1" />
      {#each [400, 500, 600, 700, 800] as t}
        <text class="stick" data-v={t} x={xs(t)} y={HH - mg.b + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{t}</text>
      {/each}
      <text x={mg.l + pw / 2} y={HH - 3} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">application score</text>
    </svg>
    <div class="legend">
      <span class="key"><i class="ln ink" />development sample, {int(M)} applications</span>
      <span class="key"><i class="sw sig" />this month, {nLabel}</span>
      <span class="key"><i class="ln dash" />the nine decile edges that define the bins</span>
    </div>
  </div>

  <div class="panel">
    <div class="ptitle">What the pack prints, and where it would have printed with no drift at all</div>
    <svg class="axis" width={BW} height={AH} viewBox="0 0 {BW} {AH}" role="img"
         aria-label="a logarithmic PSI axis showing the reading against the range it would take if nothing had moved">
      <!-- verdict zones -->
      <rect x={mg.l} y="8" width={Math.max(0, ax(AMBER) - mg.l)} height="30" fill={ZONE[0]} />
      <rect x={ax(AMBER)} y="8" width={Math.max(0, ax(RED) - ax(AMBER))} height="30" fill={ZONE[1]} />
      <rect x={ax(RED)} y="8" width={Math.max(0, mg.l + pw - ax(RED))} height="30" fill={ZONE[2]} />
      {#each ZONES as z}
        {#if z.w > z.need}
          <text x={z.mid} y="27" text-anchor="middle" font-size="9.5" fill="#5b6675" font-family="var(--font-main)">{z.label}</text>
        {/if}
      {/each}
      <line x1={ax(AMBER)} y1="8" x2={ax(AMBER)} y2="46" stroke={MARK} stroke-width="1.4" />
      <line x1={ax(RED)} y1="8" x2={ax(RED)} y2="46" stroke={MARK} stroke-width="1.4" />

      <!-- the band a reading would occupy with no drift, at this N -->
      <rect class="nullband" x={axClamp(band.q05)} y="50" width={Math.max(1.5, axClamp(band.q95) - axClamp(band.q05))} height="16" fill={FLOOR_WASH} />
      <line x1={axClamp(band.q50)} y1="50" x2={axClamp(band.q50)} y2="66" stroke={FLOOR} stroke-width="1.6" />

      <!-- previous months at these settings -->
      {#each history as h}
        <circle cx={axClamp(h)} cy="58" r="2.1" fill={SIGNAL} opacity="0.3" />
      {/each}

      <!-- this month -->
      <line class="readmark" x1={axClamp(reading)} y1="46" x2={axClamp(reading)} y2="72" stroke={SIGNAL} stroke-width="2.4" />
      <circle cx={axClamp(reading)} cy="58" r="4.6" fill={SIGNAL} stroke="#fff" stroke-width="1.5" />

      <line x1={mg.l} y1="78" x2={mg.l + pw} y2="78" stroke={AXIS} stroke-width="1" />
      {#each AXT as t, i}
        <line class="atick" data-v={t} x1={ax(t)} y1="78" x2={ax(t)} y2="82" stroke={AXIS} stroke-width="1" />
        <text x={ax(t)} y="93" text-anchor={i === 0 ? "start" : i === AXT.length - 1 ? "end" : "middle"}
              font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{AXL[i]}</text>
      {/each}
      <text x={mg.l + pw / 2} y={AH - 1} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">PSI, logarithmic</text>
    </svg>
    <div class="legend">
      <span class="key"><i class="dot sig" />this month's reading</span>
      <span class="key"><i class="sw fl" />where it would land with no drift, 90% of months</span>
      <span class="key"><i class="ln mark" />0.10 and 0.25</span>
    </div>
  </div>

  <div class="readout" class:stack={!wide}>
    <div class="ro">
      <div class="rk">the pack prints</div>
      <div class="rv big reading" data-v={reading}>{r4(reading)}</div>
      <div class="rs">{verdict}</div>
    </div>
    {#if wide}<div class="op">−</div>{/if}
    <div class="ro">
      <div class="rk">{(wide ? "" : "minus the ") + "noise floor at " + int(N)}</div>
      <div class="rv floorval" data-v={floor}>{r4(floor)}</div>
      <div class="rs">(B−1)(1/N + 1/M)</div>
    </div>
    {#if wide}<div class="op">=</div>{/if}
    <div class="ro">
      <div class="rk">{wide ? "what actually moved" : "equals what actually moved"}</div>
      <div class="rv" data-v={adj} style="color: {SIGNAL}">{r4(adj)}</div>
      <div class="rs">true value {r4(truePsi)}</div>
    </div>
  </div>

  <div class="controls">
    <label class="ctl">
      <span class="cl">how far the population really moved</span>
      <input class="shift" aria-label="how far the population really moved, in score points" type="range" min="0" max="45" step="1" bind:value={shift} />
      <span class="cv">{shiftLabel}</span>
    </label>
    <label class="ctl">
      <span class="cl">applications this month</span>
      <input class="vol" aria-label="applications this month" type="range" min={Math.log(N_MIN)} max={Math.log(N_MAX)} step="0.01" bind:value={logN} />
      <span class="cv volcv" data-n={N}>{nLabel}</span>
    </label>
    <div class="ctl btns">
      <button class="pill" on:click={redraw}>draw another month</button>
      <button class="pill ghost" on:click={() => { history = []; shift = 0; logN = Math.log(2000); }}>reset</button>
    </div>
  </div>

  <p class="note">
    With no drift at all, {int(N)} applications and ten bins, a reading crosses
    0.10 in {pAmberLabel} of months.
  </p>
</div>

<p class="body-text">
  Set the drift to zero and pull the second slider down. At
  {int(smallN.N)} applications the top of the grey band is already at
  {psiFmt(smallN.q95)} — the amber line — on a population that is by
  construction identical to the one the model was built on. Keep going: at
  {int(tinyN.N)} the <em>median</em> month reads {psiFmt(tinyN.q50)} and
  {pct(tinyN.pRed, 0)} of them are red. Then push it the other way: past
  {int(bigN.N)} the whole band has slid off to the left and sits around
  {psiFmt(bigN.q50)}, and you can drag the top slider
  {num(amberPoints.points, 0)} points — {num(amberPoints.sd, 2)} standard
  deviations of the entire population — before the blue marker leaves the green.
</p>

<p class="body-text">
  Notice what the band does <em>not</em> do on the way: it slides without
  getting any narrower. That is the chi-square law made visible. The whole
  distribution of a no-drift reading is the same shape at every sample size,
  rescaled by {@html "(1/N + 1/M)"} — so on a logarithmic axis it keeps its
  width and simply moves. Ten times the applications does not make the reading
  ten times more certain about <em>how much moved</em>; it moves the entire
  question down a decade.
</p>

<style>
  .lab {
    max-width: 860px; margin: 1.5rem auto; padding: 0.85rem 0.75rem 0.6rem 0.75rem;
    background: var(--white); border: 1px solid #e2e8f0; border-radius: 6px;
  }
  .measure { width: 100%; height: 0; }
  .panel { margin-bottom: 0.5rem; }
  .ptitle {
    font-family: var(--font-main); font-size: 0.74rem; color: #718096;
    margin-bottom: 0.15rem; line-height: 1.3;
  }

  .legend {
    display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem;
    font-family: var(--font-main); font-size: 0.7rem; color: #4a5568; margin-top: 0.1rem;
  }
  .key { display: inline-flex; align-items: center; gap: 0.3rem; }
  .ln { width: 15px; height: 0; border-top: 2.2px solid; display: inline-block; }
  .ln.ink { border-color: #232f3e; }
  .ln.dash { border-top-style: dashed; border-color: #cbd5e0; }
  .ln.mark { border-color: #df2a5d; }
  .sw { width: 13px; height: 9px; display: inline-block; }
  .sw.sig { background: rgba(32, 116, 213, 0.62); }
  .sw.fl { background: rgba(138, 148, 162, 0.34); }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .dot.sig { background: #2074d5; }

  .readout {
    display: flex; align-items: stretch; gap: 0.6rem; margin: 0.7rem 0 0.2rem 0;
    padding: 0.6rem 0; border-top: 1px solid #eef1f5; border-bottom: 1px solid #eef1f5;
  }
  .readout.stack { flex-wrap: wrap; }
  .ro { flex: 1 1 120px; min-width: 110px; }
  .op { align-self: center; color: #a0aec0; font-size: 1.1rem; font-family: var(--font-mono, monospace); }
  .rk { font-family: var(--font-main); font-size: 0.68rem; color: #718096; line-height: 1.25; }
  .rv { font-family: var(--font-heavy); font-size: 1.2rem; color: var(--squid-ink); line-height: 1.25; }
  .rv.big { font-size: 1.5rem; }
  .rs { font-family: var(--font-mono, monospace); font-size: 0.66rem; color: #8a94a2; }

  .controls { display: flex; flex-wrap: wrap; gap: 0.5rem 1.1rem; margin-top: 0.6rem; }
  .ctl { flex: 1 1 230px; display: block; }
  .ctl.btns { display: flex; align-items: flex-end; gap: 0.4rem; flex: 0 1 auto; }
  .cl { display: block; font-family: var(--font-main); font-size: 0.72rem; color: #718096; }
  .cv { display: block; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: var(--squid-ink); }
  input[type="range"] { width: 100%; accent-color: var(--primary); margin: 0.2rem 0 0.1rem 0; }

  .pill {
    font-family: var(--font-main); font-size: 0.76rem; padding: 0.32rem 0.68rem;
    border: 1px solid var(--primary); background: var(--white); border-radius: 999px;
    color: var(--primary); cursor: pointer; white-space: nowrap;
  }
  .pill.ghost { border-color: #cbd5e0; color: #718096; }
  .note { font-family: var(--font-main); font-size: 0.72rem; color: #718096; margin: 0.5rem 0 0 0; }

  @media screen and (max-width: 950px) {
    .lab { padding: 0.75rem 0.5rem 0.5rem 0.5rem; margin-left: 0.5rem; margin-right: 0.5rem; }
  }
</style>
