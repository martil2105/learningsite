<script>
  /*
    Where the assumption holds and where it does not - same algorithm, same
    default k, three different label sets.

    The order matters. The first two steps are SMOTE working, because an article
    that opens on the failure is describing a straw man: the reader should see
    the method do its job on the shape it was designed for before being shown
    the shape it was not.
  */
  import Scrolly from "./Scrolly.svelte";
  import ScatterPanel from "./ScatterPanel.svelte";
  import { SCEN, scen, CROSS, K_DEFAULT, pct, int, num } from "../experiments.js";

  let value = 0;
  $: step = typeof value === "number" ? Math.min(4, Math.max(0, value)) : 0;

  const easy = scen("one-kind");
  const two = scen("two-kinds");
  const hard = scen("as-it-arrives");
  const rate = (s, k) => s.sweep.find((r) => r.k === k).contaminated;
  const cross = (s, k) => s.sweep.find((r) => r.k === k);

  const VIEWS = [
    { sc: easy, k: K_DEFAULT, title: "One kind of fraud", sub: "k = " + K_DEFAULT },
    { sc: two, k: K_DEFAULT, title: "Two kinds", sub: "k = " + K_DEFAULT },
    { sc: two, k: 15, title: "Two kinds", sub: "k = 15" },
    { sc: hard, k: K_DEFAULT, title: "Fraud as it actually arrives", sub: "k = " + K_DEFAULT },
    { sc: hard, k: K_DEFAULT, title: "Fraud as it actually arrives", sub: "balancing the classes" },
  ];
  $: view = VIEWS[step];

  // Every sentence assembled here. An {#if} block strips the leading whitespace
  // of its contents, so a figure next to one renders glued to the word after it.
  const steps = [
    "<h1 class='step-title'>Where it works</h1>" +
      "<p>In this first label set, every fraud row is the same kind of thing (a stolen card being " +
      "tested with tiny overnight charges), so all " + easy.minority.length + " of them sit in one blob. " +
      "Each point's five nearest fraud neighbours really are its neighbours, the segments between them " +
      "stay inside the blob, and the synthetic rows land where fraud really is the denser class.</p>" +
      "<p>Out of twenty thousand synthetic rows, only <span class='bold'>" + pct(rate(easy, K_DEFAULT), 1) +
      "</span> landed in normal territory, just a handful off the edge of the blob. This is SMOTE doing " +
      "exactly what it promises, on the kind of shape it was designed for.</p>",

    "<h1 class='step-title'>Two clusters, and still fine</h1>" +
      "<p>Now we add the expensive evening purchases that the tested cards get spent on. That gives us " +
      "two clusters of " + two.spec.map((s) => s.n).join(" points and ") + " points, far apart, with " +
      "the whole of ordinary daytime spending in between. The segment from one cluster to the other " +
      "passes straight through it.</p>" +
      "<p>Even so, almost nothing goes wrong: only <span class='bold'>" + pct(rate(two, K_DEFAULT), 1) +
      "</span> of the synthetic rows land in normal territory. With " + Math.max(...two.spec.map((s) => s.n)) +
      " and " + Math.min(...two.spec.map((s) => s.n)) + " points in the two clusters, the five nearest " +
      "neighbours never have to leave home.</p>",

    "<h1 class='step-title'>Turn k up and it breaks</h1>" +
      "<p>Now let's keep the same data and the same code, but set <span class='mono'>k = 15</span>. " +
      "Every point now has to reach past its own cluster to find fifteen neighbours, so the " +
      "cross-cluster segments appear all at once, and <span class='bold'>" + pct(rate(two, 15), 1) +
      "</span> of the synthetic fraud lands in the middle of normal spending.</p>" +
      "<p>This is the uncomfortable part of the previous step. The safety never came from the data. " +
      "It came from <span class='mono'>k = 5</span>, and only because that happened to be smaller than " +
      "the clusters. That was luck, and it wasn't even your luck; it was the default's.</p>",

    "<h1 class='step-title'>Fraud doesn't arrive in tidy clusters</h1>" +
      "<p>A real label set has several kinds of fraud in unequal numbers, plus a couple of rows that " +
      "don't look like anything in particular, such as an ordinary afternoon purchase that happened to " +
      "be fraudulent. Here, that's " + hard.spec.map((s) => s.n).join(", ") + " points across " +
      hard.spec.length + " kinds.</p>" +
      "<p>Let's go back to the default, <span class='mono'>k = " + K_DEFAULT + "</span>. This time, " +
      "<span class='bold'>" + pct(rate(hard, K_DEFAULT), 1) + "</span> of the synthetic fraud lands " +
      "where legitimate transactions are denser. That's because " + CROSS.points + " of the " +
      hard.minority.length + " fraud rows don't have " + K_DEFAULT + " neighbours of their own kind to " +
      "draw on, so " + CROSS.pairs + " of the " + CROSS.pairsTotal + " neighbour pairs that SMOTE works " +
      "from connect rows of two different kinds.</p>" +
      "<p>Turning <span class='mono'>k</span> down doesn't fix it, either. At " +
      "<span class='mono'>k = 1</span>, no pair crosses between kinds at all, but the rate is still " +
      "<span class='bold'>" + pct(rate(hard, 1), 1) + "</span>. The two one-off rows are each other's " +
      "nearest neighbours, and since both of them sit in ordinary spending, the line between them runs " +
      "through ordinary spending the whole way.</p>",

    "<h1 class='step-title'>Count what that actually costs</h1>" +
      "<p>To balance the classes, we need <span class='bold'>" + int(hard.balancing.need) + "</span> " +
      "synthetic rows. At that rate, <span class='bold'>" + int(hard.balancing.contaminated) + "</span> of " +
      "them end up where legitimate spending is denser, each one labelled as fraud and handed to the " +
      "classifier as evidence.</p>" +
      "<p>We started with " + hard.minority.length + " real fraud rows, and we've just written down " +
      num(hard.balancing.contaminated / hard.minority.length, 1) + " times as many misleading ones. " +
      "That isn't a rounding error in the training set. For this class, it's most of the training set.</p>",
  ];
</script>

<h1 class="body-header">The assumption is a claim about your data</h1>

<p class="body-text">
  Whether interpolation is safe isn't a property of SMOTE. It's a property of
  the shape your minority class happens to have, and of how that shape compares
  to <span class="mono">k</span>, which you almost certainly left at
  {K_DEFAULT}. Let's look at three label sets, with the same algorithm and the
  same default.
</p>

<section class="side-section">
  <div class="sticky-container">
    <div class="chart-box">
      <div class="chart-header">
        <span class="chart-title">{view.title}</span>
        <span class="chart-sub">{view.sub}</span>
      </div>
      <ScatterPanel
        sc={view.sc}
        k={view.k}
        showSegments={true}
        showChildren={true}
        nChildren={620}
        maxHeight={360}
        seed={step === 4 ? 55 : 91}
      />
      <div class="legend">
        <span class="key"><i class="dot legit" />legitimate</span>
        <span class="key"><i class="dot fraud" />labelled fraud</span>
        <span class="key"><i class="dot synth" />synthetic</span>
        <span class="key"><i class="dot synth ringed" />synthetic, in normal territory</span>
      </div>
    </div>
  </div>

  <div class="steps-container">
    <Scrolly bind:value>
      {#each steps as text, i}
        <div class="step" class:active={step === i}>
          <div class="step-content">{@html text}</div>
        </div>
      {/each}
    </Scrolly>
  </div>
</section>

<style>
  .side-section {
    position: relative;
    margin-top: 2rem;
    display: flex;
    align-items: flex-start;
  }

  .steps-container { flex: 1 1 38%; z-index: 10; }

  .sticky-container {
    position: sticky;
    top: 7vh;
    flex: 1 1 62%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 82vh;
  }

  .chart-box {
    width: 96%;
    max-width: 600px;
    background: #ffffff;
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.35rem;
  }

  .chart-title { font-family: var(--font-main); font-size: 0.9rem; font-weight: 700; color: var(--squidink); }
  .chart-sub { font-family: var(--font-mono, monospace); font-size: 0.74rem; color: #718096; }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.85rem;
    margin-top: 0.45rem;
    font-family: var(--font-main);
    font-size: 0.7rem;
    color: #4a5568;
  }

  .key { display: inline-flex; align-items: center; gap: 0.28rem; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .dot.legit { background: #8a94a2; }
  .dot.fraud { background: #df2a5d; }
  .dot.synth { background: #2074d5; }
  .dot.ringed { box-shadow: 0 0 0 1.4px #232f3e; }

  .step { height: 100vh; display: flex; justify-content: center; align-items: center; }

  .step-content {
    background: rgba(255, 255, 255, 0.97);
    color: #4a5568;
    border-radius: 8px;
    padding: 1.1rem 1.3rem;
    max-width: 440px;
    width: 88%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    line-height: 1.55;
    transition: all 250ms ease;
  }

  .step.active .step-content {
    color: var(--squidink);
    border-left: 5px solid var(--violet);
    box-shadow: 0 8px 24px rgba(124, 90, 237, 0.15);
  }

  @media screen and (max-width: 950px) {
    .side-section { flex-direction: column-reverse; }
    .steps-container { pointer-events: none; }
    .sticky-container { top: 3vh; min-height: 0; height: 58vh; }
    .chart-box { width: 96%; padding: 0.7rem; }
    .step { height: 112vh; }
    .step-content { width: 92%; max-width: 640px; font-size: 0.95rem; }
  }
</style>
