<script>
  /*
    The same subspace, drawn as coordinates.

    Two scatters of the SAME 400 rows: PCA's code on the left, the
    autoencoder's on the right, with a selector for which run. The
    reconstructions from the two are identical to machine precision - the number
    under the card - and the pictures do not look remotely alike.

    Both panels share one scale, deliberately. Rescaling each to fit its own box
    would hide the thing that matters most: the autoencoder's codes are not on
    the same scale as anybody's, including its own from a different seed.
  */
  import { scaleLinear } from "d3-scale";
  import { UNREG, REG, PCA_LATENT, WIDE_PCA, DATA_SCALE, CONFIG, num, deg } from "../experiments.js";
  import { PCA as PCA_C, AE, ACCENT, MUTED, FAINT, INK } from "../palette.js";

  // PCA's code correlation is exactly zero by construction, and -0.000 on the
  // chart reads like a rounding artefact rather than a guarantee.
  const corr = (x) => (Math.abs(x) < 5e-4 ? "0.000" : x.toFixed(3));

  let seedIdx = 0;
  let reg = false;
  $: pool = reg ? REG : UNREG;
  $: fit = pool[seedIdx];

  // One scale for both panels, covering every code either method produces in
  // any of the runs, so the panels are directly comparable to each other and
  // across seeds.
  const LIM = (() => {
    let m = 0;
    for (const z of PCA_LATENT) m = Math.max(m, Math.abs(z[0]), Math.abs(z[1]));
    for (const f of [...UNREG, ...REG]) for (const z of f.Z) m = Math.max(m, Math.abs(z[0]), Math.abs(z[1]));
    return m * 1.05;
  })();

  let boxWidth = 320;
  $: BW = Math.max(260, boxWidth);
  $: narrow = BW < 560;
  $: mw = narrow ? BW : Math.floor((BW - 14) / 2);
  $: mh = narrow ? Math.round(mw * 0.85) : 230;
  $: sx = scaleLinear().domain([-LIM, LIM]).range([26, mw - 8]);
  $: sy = scaleLinear().domain([-LIM, LIM]).range([mh - 22, 8]);
  $: r = narrow ? 1.8 : 2.1;
</script>

<h1 class="body-header">The same answer, in unrecognisable coordinates</h1>

<p class="body-text">
  Here is what that costs in practice. Both panels below show the codes the
  bottleneck assigns to the same {CONFIG.n} rows — principal components on the
  left, the autoencoder's two latent units on the right, on one shared scale.
  Their reconstructions of the original {CONFIG.d} columns agree to
  {fit.reconGap.toExponential(0)} on data that runs to ±{num(DATA_SCALE, 1)}.
  They are, for every purpose that involves the output, the same model.
</p>

<div class="card">
  <div class="measure" bind:clientWidth={boxWidth} />

  <div class="card-head">
    <span class="card-title">Latent coordinates of the same {CONFIG.n} rows</span>
    <div class="controls">
      <span class="ctl-label">seed</span>
      {#each pool as f, i}
        <button class="pill" class:on={seedIdx === i} on:click={() => (seedIdx = i)}>{f.seed}</button>
      {/each}
      <button class="pill wide" class:on={reg} on:click={() => (reg = !reg)}>+ L2</button>
    </div>
  </div>

  <div class="pair">
    <div class="mini">
      <span class="mini-label" style="color:{PCA_C}">principal components</span>
      <svg viewBox="0 0 {mw} {mh}" width={mw} height={mh}>
        <line class="ax" x1={sx(-LIM)} x2={sx(LIM)} y1={sy(0)} y2={sy(0)} />
        <line class="ax" x1={sx(0)} x2={sx(0)} y1={sy(-LIM)} y2={sy(LIM)} />
        {#each PCA_LATENT as z}
          <circle cx={sx(z[0])} cy={sy(z[1])} {r} fill={PCA_C} fill-opacity="0.5" />
        {/each}
        <text class="note" x="4" y="10">variance {num(WIDE_PCA.latent.variance[0], 1)} / {num(WIDE_PCA.latent.variance[1], 1)}</text>
        <text class="note" x="4" y={mh - 6}>correlation {corr(WIDE_PCA.latent.correlation)}</text>
      </svg>
    </div>

    <div class="mini">
      <span class="mini-label" style="color:{AE}">the autoencoder, seed {fit.seed}{reg ? " + L2" : ""}</span>
      <svg viewBox="0 0 {mw} {mh}" width={mw} height={mh}>
        <line class="ax" x1={sx(-LIM)} x2={sx(LIM)} y1={sy(0)} y2={sy(0)} />
        <line class="ax" x1={sx(0)} x2={sx(0)} y1={sy(-LIM)} y2={sy(LIM)} />
        {#each fit.Z as z}
          <circle cx={sx(z[0])} cy={sy(z[1])} {r} fill={AE} fill-opacity="0.5" />
        {/each}
        <text class="note" x="4" y="10">variance {num(fit.latent.variance[0], 1)} / {num(fit.latent.variance[1], 1)}</text>
        <text class="note warn" x="4" y={mh - 6}>correlation {corr(fit.latent.correlation)}</text>
      </svg>
    </div>
  </div>

  <div class="foot">
    <span class="chip">reconstructions differ by {fit.reconGap.toExponential(0)}</span>
    <span class="chip">encoder rows {deg(fit.encoderRows, 1)} apart</span>
    <span class="chip">decoder columns {num(fit.decoderNorms[0], 2)} / {num(fit.decoderNorms[1], 2)} long</span>
    {#if fit.latent.variance[1] > fit.latent.variance[0]}
      <span class="chip bad">the second unit carries more variance than the first</span>
    {/if}
  </div>
</div>

<p class="body-text">
  Click through the three seeds. The left panel never changes — it cannot, there
  is only one answer. The right one is a different shape every time: sheared one
  way, sheared the other, sometimes with the larger spread on the horizontal axis
  and sometimes on the vertical. The two coordinates are correlated at
  {num(Math.abs(UNREG[1].latent.correlation), 2)} in one run and
  {num(Math.abs(UNREG[2].latent.correlation), 2)} in another, where principal
  components are uncorrelated by construction and always will be.
</p>

<p class="body-text">
  Turn on the L2 penalty and the panels come into line — the same shape, the same
  scale, and the axes square to each other. Not identical, note: the latent
  coordinates are still a rotation of PCA's, with correlations of
  {num(Math.abs(REG[0].latent.correlation), 2)} and up. What the penalty fixed is
  the <em>decoder</em>, whose singular vectors are now the principal directions.
  If you want the components themselves you still have to take that
  decomposition; reading the encoder's rows will not give them to you.
</p>

<style>
  .card {
    max-width: 640px;
    margin: 1.6rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
    display: block;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .card-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 0.28rem;
  }

  .ctl-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
    color: #9aa5b1;
    margin-right: 0.1rem;
  }

  .pill {
    font-family: var(--font-mono, monospace);
    font-size: 0.74rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    border: 1px solid #cbd5e0;
    background: #ffffff;
    color: #4a5568;
    cursor: pointer;
  }

  .pill:hover {
    border-color: var(--violet);
  }

  .pill.on {
    background: #efeafe;
    border-color: var(--violet);
    color: #4a3592;
    font-weight: 700;
  }

  .pill.wide {
    margin-left: 0.3rem;
  }

  .pair {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .mini-label {
    display: block;
    font-family: var(--font-main);
    font-size: 0.72rem;
    font-weight: 700;
    margin-bottom: 0.2rem;
  }

  .ax {
    stroke: #e2e8f0;
  }

  .note {
    font-family: var(--font-mono, monospace);
    font-size: 9.5px;
    fill: #9aa5b1;
  }

  .note.warn {
    fill: #df2a5d;
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.55rem;
  }

  .chip {
    font-family: var(--font-main);
    font-size: 0.72rem;
    color: #4a5568;
    background: #f4f6f8;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 2px 9px;
  }

  .chip.bad {
    color: #8f1c3c;
    background: #fdeaf0;
    border-color: #f6cdd8;
    font-weight: 700;
  }

  @media screen and (max-width: 950px) {
    .card {
      max-width: 92%;
      padding: 0.75rem;
    }
  }
</style>
