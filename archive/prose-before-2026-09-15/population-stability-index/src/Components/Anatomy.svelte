<script>
  /*
    What the formula is, before what it does.

    Three facts, all of which the rest of the article uses:
      - every term is non-negative, so no bin can offset another
      - the sum is exactly the Kullback-Leibler divergence J, from 1951
      - the term is asymmetric in the ratio, by exactly the ratio
  */
  import katexify from "../katexify.js";
  import { PRE, SEG, B, num, psiFmt, pct } from "../experiments.js";
  import { linear, log as logScale, pathOf, ticks } from "../chart.js";
  import { SIGNAL, MARK, FLOOR, INK, AXIS, TICK, LABEL, RULE, THEORY } from "../palette.js";

  const online = SEG.online;
  const M = PRE.mirror;

  let r = 2;
  $: cost = (x) => (x - 1) * Math.log(x);
  $: costR = cost(r);
  $: costInv = cost(1 / r);

  let boxWidth = 320;
  $: BW = Math.max(280, boxWidth);
  const H = 210;
  const mg = { l: 40, r: 14, t: 14, b: 34 };
  $: pw = Math.max(60, BW - mg.l - mg.r);
  $: ph = H - mg.t - mg.b;
  /* The x range and the y range have to agree: (r-1)ln r reaches 4.16 at r = 4,
     which is 105px above the top of a box scaled to 2.4 — drawn, clipped by the
     svg, and invisible to every check except "nothing outside its own svg". */
  const R_LO = 0.3, R_HI = 3.2, COST_MAX = 2.7;
  $: cx = logScale(R_LO, R_HI, mg.l, mg.l + pw);
  $: cy = linear(0, COST_MAX, H - mg.b, mg.t);
  $: curve = pathOf(
    Array.from({ length: 220 }, (_, i) => {
      const x = R_LO * Math.pow(R_HI / R_LO, i / 219);
      return [cx(x), cy(cost(x))];
    })
  );

  /* Reactive: reads cx / cy. A const here would never be recomputed. */
  $: pt = (x) => [cx(x), cy(cost(x))];

  const RT = [0.5, 1, 2, 3];
  $: ratioLine = "a bin holding " + num(r, 2) + "× its expected share costs " +
                 num(costR, 4) + "; one holding " + num(1 / r, 2) + "× costs " +
                 num(costInv, 4) + "  ·  ratio " + num(costR / costInv, 3);
</script>

<h1 class="body-header">What the sum is made of</h1>

<p class="body-text">
  Three properties of that formula do real work later, and none of them is
  usually stated. Take one bin, and write <span class="mono">r</span> for the
  ratio of what arrived to what was expected. The bin contributes
</p>

<div class="eq">{@html katexify("e_i\\,(r-1)\\ln r, \\qquad r = a_i / e_i", true)}</div>

<p class="body-text">
  <span class="bold">First: that is never negative.</span> When a bin fills up,
  both factors are positive; when it empties, both are negative. So no bin can
  cancel another, PSI is a sum of non-negative pieces, and it is zero only when
  every bin lands exactly on its expected share. Sampling noise cannot average
  out of it — it can only add. That single observation is the whole of the next
  two sections.
</p>

<p class="body-text">
  <span class="bold">Second: the cost is asymmetric, by exactly the ratio.</span>
  A bin that doubles costs twice what a bin that halves costs; one that goes ten
  times over costs ten times what one that drops to a tenth costs. It is an
  identity, not a tendency:
</p>

<div class="eq">{@html katexify("(r-1)\\ln r \\;=\\; r\\cdot\\Big(\\tfrac{1}{r}-1\\Big)\\ln\\tfrac{1}{r}", true)}</div>

<div class="fig">
  <div class="measure" bind:clientWidth={boxWidth} />
  <div class="ftitle">The cost of one bin, against how far off its expected share it is</div>
  <svg width={BW} height={H} viewBox="0 0 {BW} {H}" role="img"
       aria-label="the per-bin cost function, showing the two mirror points">
    {#each ticks(0, COST_MAX, 4) as t}
      <line x1={mg.l} y1={cy(t)} x2={mg.l + pw} y2={cy(t)} stroke="#eef1f5" stroke-width="1" />
      <text x={mg.l - 6} y={cy(t) + 3.2} text-anchor="end" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{num(t, 1)}</text>
    {/each}
    <line x1={cx(1)} y1={mg.t} x2={cx(1)} y2={H - mg.b} stroke={RULE} stroke-width="1" stroke-dasharray="2 4" />
    <path d={curve} fill="none" stroke={INK} stroke-width="2" />

    <line x1={pt(r)[0]} y1={pt(r)[1]} x2={pt(r)[0]} y2={H - mg.b} stroke={SIGNAL} stroke-width="1.2" stroke-dasharray="3 3" />
    <line x1={pt(1 / r)[0]} y1={pt(1 / r)[1]} x2={pt(1 / r)[0]} y2={H - mg.b} stroke={MARK} stroke-width="1.2" stroke-dasharray="3 3" />
    <circle cx={pt(r)[0]} cy={pt(r)[1]} r="5" fill={SIGNAL} stroke="#fff" stroke-width="1.5" />
    <circle cx={pt(1 / r)[0]} cy={pt(1 / r)[1]} r="5" fill={MARK} stroke="#fff" stroke-width="1.5" />

    <line x1={mg.l} y1={H - mg.b} x2={mg.l + pw} y2={H - mg.b} stroke={AXIS} stroke-width="1" />
    {#each RT as t}
      <text x={cx(t)} y={H - mg.b + 13} text-anchor="middle" font-size="9.5" fill={TICK} font-family="var(--font-mono, monospace)">{t}×</text>
    {/each}
    <text x={mg.l + pw / 2} y={H - 3} text-anchor="middle" font-size="9.5" fill={LABEL} font-family="var(--font-main)">actual share ÷ expected share</text>
  </svg>
  <label class="ctl">
    <input aria-label="how far the bin is from its expected share" type="range" min="1.05" max="3" step="0.05" bind:value={r} />
    <span class="cv">{ratioLine}</span>
  </label>
</div>

<p class="body-text">
  <span class="bold">Third: the sum is not a credit-scoring invention.</span>
  Multiply out the bracket and the two halves separate:
</p>

<div class="eq">{@html katexify("\\sum_i (a_i-e_i)\\ln\\frac{a_i}{e_i} \\;=\\; \\underbrace{\\sum_i a_i \\ln\\frac{a_i}{e_i}}_{\\mathrm{KL}(A\\,\\|\\,E)} \\;+\\; \\underbrace{\\sum_i e_i \\ln\\frac{e_i}{a_i}}_{\\mathrm{KL}(E\\,\\|\\,A)}", true)}</div>

<p class="body-text">
  PSI is the Kullback–Leibler divergence <span class="mono">J</span> — the
  symmetric one, defined in the same 1951 paper that gave us the directed
  version everyone quotes. That matters twice over. It means PSI is a sample
  estimate of a real population quantity rather than an index, which is why the
  correction later in this article works at all. And it means PSI inherits that
  quantity's properties, including the one that makes the bin count a free
  parameter.
</p>

<p class="body-text">
  It is tempting to think the split carries something — that a big
  <span class="mono">KL(A‖E)</span> means the population piled into somewhere new
  and a big <span class="mono">KL(E‖A)</span> means it vacated somewhere old.
  Measured across thirteen different shifts here, the forward half's share runs
  from {num(Math.min(...PRE.klSplit.map((k) => k.share)), 3)} to
  {num(Math.max(...PRE.klSplit.map((k) => k.share)), 3)} — it is a coin flip
  every time, and there is nothing in it.
</p>

<h2 class="sub-header">Where a reading comes from</h2>

<p class="body-text">
  The Online channel's population this month, bin by bin. Each bar is that bin's
  contribution; they add to {psiFmt(online.truePsi)}, which is what the pack
  would print if the month were infinitely long.
</p>

<div class="fig narrow">
  <table class="terms">
    <thead>
      <tr><th>decile of the development sample</th><th class="r">share this month</th><th class="r">ratio</th><th class="r">contribution</th></tr>
    </thead>
    <tbody>
      {#each M.termsDown as t, i}
        <tr>
          <td>{i + 1}{i === 0 ? " — lowest scores" : i === B - 1 ? " — highest scores" : ""}</td>
          <td class="r mono">{pct(online.binProbs[i], 1)}</td>
          <td class="r mono">{num(M.ratioDown[i], 2)}×</td>
          <td class="r"><span class="bar" style="width: {(t / Math.max(...M.termsDown)) * 58}px" /><span class="mono v">{num(t, 4)}</span></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p class="body-text">
  Two bins carry {pct((M.termsDown[0] + M.termsDown[1]) / M.psiDown, 0)} of it,
  and they are the two at the bottom of the score range. That is the useful part
  of PSI and the part a monitoring pack should always print: not the total, but
  which bins it came from and which way they went.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .eq { max-width: 600px; margin: 1.2rem auto; overflow-x: auto; overflow-y: hidden; padding: 0.2rem 0; text-align: center; }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .fig { max-width: 640px; margin: 1.4rem auto; padding: 0 0.75rem; }
  .fig.narrow { max-width: 600px; }
  .measure { width: 100%; height: 0; }
  .ftitle { font-family: var(--font-main); font-size: 0.74rem; color: #718096; margin-bottom: 0.15rem; }
  .ctl { display: block; margin-top: 0.2rem; }
  .cv { display: block; font-family: var(--font-mono, monospace); font-size: 0.72rem; color: var(--squid-ink); line-height: 1.4; }
  input[type="range"] { width: 100%; accent-color: var(--primary); margin: 0.1rem 0; }

  .terms { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.82rem; }
  .terms th {
    text-align: left; font-weight: 700; font-size: 0.7rem; color: #718096;
    border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.4rem 0.3rem 0;
  }
  .terms td { padding: 0.26rem 0.4rem 0.26rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .terms .r { text-align: right; padding-right: 0; }
  .terms .mono { font-family: var(--font-mono, monospace); font-size: 0.94em; }
  .bar { display: inline-block; height: 8px; background: rgba(32, 116, 213, 0.55); vertical-align: middle; margin-right: 6px; }
  .v { display: inline-block; min-width: 46px; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .eq { max-width: 84%; font-size: 0.86rem; }
    .fig { padding: 0 0.5rem; }
    .fig.narrow { max-width: 84%; }
    .terms { font-size: 0.76rem; }
  }
</style>
