<script>
  /*
    The limit both methods share, stated as sharply as it can be: an equal
    mixture of two isotropic Gaussians is unimodal exactly below 2 sigma, so
    below that no density method finds two clusters at any parameter. And the
    interesting half - the mode exists long before it is findable.
  */
  import ModesFig from "./ModesFig.svelte";
  import katexify from "../katexify.js";
  import { PRE, num, pct } from "../experiments.js";

  const M = PRE.modes;
  let sep = 3.0;
  const at = (s) => M.reduce((a, b) => (Math.abs(b.sep - s) < Math.abs(a.sep - s) ? b : a));
  const three = at(3);
  const two = at(2);
  /* Where the best density clustering finally gets within a tenth of what a
     perfect split would score. Read off the sweep rather than asserted. */
  const caught = M.find((r) => r.best >= 0.9 * r.bayes) || M[M.length - 1];
  const eqMix = katexify(
    "p(x) \\;\\propto\\; e^{-(x-\\mu)^2/2\\sigma^2} + e^{-(x+\\mu)^2/2\\sigma^2}",
    true
  );
  const eqCond = katexify("p''(0) < 0 \\iff \\mu < \\sigma \\iff \\text{separation} < 2\\sigma", true);
  $: h = at(sep);
</script>

<h2 class="sub-header">Neither of them can split one hill</h2>

<p class="body-text">
  DBSCAN and HDBSCAN are both level-set methods: a cluster is a connected piece
  of the region where the density is above some threshold. That is the source of
  the good property everybody quotes — clusters can be any shape — and of a
  limit almost nobody does. If two groups are not separated by a
  <em>valley</em>, there is nothing to find, at any parameter, ever.
</p>

<p class="body-text">
  How much of a valley? For the simplest case there is an exact answer. Take an
  equal mixture of two isotropic Gaussians and look along the axis joining their
  centres:
</p>

<div class="eq">{@html eqMix}</div>

<p class="body-text">
  The midpoint is always a stationary point. Differentiate twice and it is a
  <em>maximum</em> — one hill, not two — for anything closer than two standard
  deviations:
</p>

<div class="eq">{@html eqCond}</div>

<div class="figwrap">
  <div class="card">
    <ModesFig {sep} />
    <div class="controls">
      <label class="slider">
        <span class="clabel">separation</span>
        <input type="range" min="1" max="7" step="0.2" bind:value={sep} aria-label="separation between the two centres, in standard deviations" />
        <span class="cvalue">{num(sep, 1)}σ</span>
      </label>
      <span class="readout">
        best possible {num(h.bayes, 2)} · best density clustering {num(h.best, 2)}
      </span>
    </div>
    <p class="cap">
      Left: {PRE.config.MODE_N} points and the mixture density along the axis
      between the centres, with the midpoint marked. Right: the dashed red line
      is 2σ, where the second mode appears. Grey is what a perfect split at the
      midpoint would score; blue is the best any DBSCAN* over every
      <span class="mono">eps</span> and five values of
      <span class="mono">minPts</span> manages.
    </p>
  </div>
</div>

<p class="body-text">
  Below 2σ the blue line is flat on the floor, and it should be — there is one
  hill and finding two clusters in it would be a bug. What is worth staring at
  is the stretch just above 2σ. At <span class="bold">3σ</span> the density is
  genuinely bimodal, the valley is real, and a perfect split scores
  {num(three.bayes, 3)} while the best density clustering in existence scores
  <span class="bold">{num(three.best, 3)}</span>. The two do not come within a
  tenth of each other until about <span class="bold">{num(caught.sep, 1)}σ</span>.
</p>

<p class="body-text">
  So the mode appears at 2σ and becomes <em>findable</em> somewhere past 5σ, and
  the {num(caught.sep - 2, 1)}σ in between is a region where the structure is
  really there, a density method really cannot get it, and nothing about your
  parameters is at fault. Every textbook picture of density-based clustering is
  drawn well to the right of that gap.
</p>

<p class="body-text">
  k-means, meanwhile, will cheerfully cut one hill down the middle, and for
  plenty of purposes that is what you wanted. Neither answer is wrong. They are
  answers to different questions: <em>where are the separated
  concentrations</em>, and <em>if I have to have {@html katexify("k")} groups,
  which {@html katexify("k")}</em>. Choosing between the methods is choosing
  which question you are asking, and it is a decision to make before you look at
  any output, because both will give you something that looks like an answer.
</p>

<p class="body-text">
  One practical note while we are here. When HDBSCAN decides your data is one
  hill, what it returns is <span class="bold">everything labelled noise</span> —
  the root is not an eligible cluster, so if nothing below it wins, nothing
  wins. An empty result from <span class="mono">hdbscan</span> usually means "I
  see one thing", not "I see nothing", and the two are easy to confuse when what
  you are looking at is an array of minus ones.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2.2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .eq { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; overflow-y: hidden; padding: 0.15rem 0; }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }

  .figwrap { display: flex; justify-content: center; margin: 1.4rem auto; padding: 0 0.75rem; }
  .card {
    width: 100%; max-width: 760px; background: #fff; border-radius: 10px;
    padding: 1rem 1.1rem 0.9rem 1.1rem; border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }
  .controls { display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; margin-top: 0.6rem; }
  .slider { display: flex; align-items: center; gap: 0.5rem; flex: 1 1 240px; min-width: 210px; }
  .slider input { flex: 1 1 auto; min-width: 0; accent-color: var(--violet); }
  .clabel { font-family: var(--font-mono, monospace); font-size: 0.75rem; color: #718096; }
  .cvalue { font-family: var(--font-mono, monospace); font-size: 0.76rem; color: var(--squidink); font-weight: 700; min-width: 2.6rem; }
  .readout { font-family: var(--font-main); font-size: 0.76rem; color: #4a5568; }
  .cap { font-family: var(--font-main); font-size: 0.73rem; line-height: 1.5; color: #9aa5b1; margin: 0.5rem 0 0 0; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .eq { max-width: 80%; }
    .card { padding: 0.8rem 0.7rem 0.7rem 0.7rem; }
  }
</style>
