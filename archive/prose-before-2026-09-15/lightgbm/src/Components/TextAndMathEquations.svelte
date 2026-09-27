<script>
  import katexify from "../katexify";
  import { BINNED, BIN_SETTINGS, EXACT_CURVE, int } from "../experiments.js";
  const at255 = BINNED[BIN_SETTINGS.length - 1];
</script>

<h1 class="body-header">Why a bucket is enough</h1>

<p class="body-text">
  Scoring a split means asking how much better the model gets by separating one
  set of rows from another. With gradients {@html katexify("g_i")} and hessians
  {@html katexify("h_i")}, and their sums {@html katexify("G")} and
  {@html katexify("H")} on each side, that is:
</p>

<div class="math-display">
  {@html katexify(
    "\\text{gain} \\;=\\; \\tfrac{1}{2}\\left[\\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda}\\right] - \\gamma",
    true
  )}
</div>

<p class="body-text">
  Look at what is in there and what is not. Four sums and two constants. No
  individual row appears anywhere, and nothing in the expression could tell you
  whether {@html katexify("G_L")} was accumulated from four million rows or
  handed over pre-added. That is the opening, and everything else follows from
  taking it.
</p>

<p class="body-text">
  So pre-add them. Assign every row a <span class="bold">bin</span> — an integer
  from {@html katexify("0")} to {@html katexify("B-1")} saying which slice of the
  column it falls in — and keep two arrays:
</p>

<div class="math-display">
  {@html katexify(
    "\\mathcal{G}_b \\;=\\; \\sum_{i \\,:\\, \\text{bin}(x_i) = b} g_i \\qquad\\quad \\mathcal{H}_b \\;=\\; \\sum_{i \\,:\\, \\text{bin}(x_i) = b} h_i",
    true
  )}
</div>

<p class="body-text">
  That is the histogram. Building it is one pass over the rows with two additions
  each — no sort, no comparison, no index to follow. And now every split you
  could take at a bin boundary is a running sum along {@html katexify("B")}
  numbers rather than a walk along {@html katexify("n")} rows:
</p>

<div class="math-display">
  {@html katexify(
    "G_L(b) \\;=\\; \\sum_{b' \\le b} \\mathcal{G}_{b'} \\qquad\\quad G_R(b) \\;=\\; G - G_L(b)",
    true
  )}
</div>

<p class="body-text">
  {@html katexify("B - 1")} boundaries, whatever {@html katexify("n")} is. In the
  chart above that is {int(at255.candidates.length)} candidates instead of
  {int(EXACT_CURVE.length)}, and the split it picks is worth
  99.9% of the best one available.
</p>

<h1 class="body-header">The identity that does the real work</h1>

<p class="body-text">
  Here is the part that turns a nice idea into a fast one, and it is a single
  line of arithmetic. A node's rows are exactly its two children's rows — every
  row goes left or right, none is lost and none is duplicated. So bin by bin:
</p>

<div class="math-display">
  {@html katexify(
    "\\mathcal{G}_b^{\\,\\text{parent}} \\;=\\; \\mathcal{G}_b^{\\,\\text{left}} + \\mathcal{G}_b^{\\,\\text{right}} \\qquad\\Longrightarrow\\qquad \\mathcal{G}_b^{\\,\\text{right}} = \\mathcal{G}_b^{\\,\\text{parent}} - \\mathcal{G}_b^{\\,\\text{left}}",
    true
  )}
</div>

<p class="body-text">
  Which means you never build both children. Build whichever holds fewer rows,
  and get its sibling by subtracting, at a cost of {@html katexify("B")}
  subtractions no matter how many rows that sibling holds. Splits are usually
  lopsided, so the cheap half is usually much the cheaper half.
</p>

<div class="callout">
  <h4>The pre-sorted algorithm cannot do this</h4>
  <p>
    Not because nobody thought of it. A pre-sorted node is a list of row indices
    in sorted order, and there is no operation on two such lists that yields the
    third without touching the rows — a list is not a sum, and you cannot
    subtract it. The histogram is a summary that happens to be additive, and
    additivity is the whole reason it is worth having. Keep hold of that: the
    next section measures how much of LightGBM's speed is the histogram itself
    and how much is this one identity, and the answer is not the one most
    explanations imply.
  </p>
</div>

<h1 class="body-header">And it fits in a byte</h1>

<p class="body-text">
  A second consequence, less discussed and not smaller. Once a column is a bin
  index rather than a number, it needs
  {@html katexify("\\lceil \\log_2 B \\rceil")} bits. LightGBM's documentation is
  explicit: at <span class="mono">max_bin = 255</span> it stores a feature value
  in a <span class="mono">uint8_t</span> — one byte, against the eight of a
  double — and there is no permutation index to keep beside it, because there is
  nothing to sort. That is the reason the default is 255 rather than 256: the
  byte has to hold a code for a missing value too.
</p>

<p class="body-text">
  A tenfold reduction in the memory the training data occupies is not a footnote.
  It decides whether the data fits in cache, whether it fits in memory, and — in
  the distributed setting — it means the thing you send across the network is a
  few hundred numbers per feature rather than the feature.
</p>

<style>
  .math-display {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 620px;
    margin: 1.2rem auto;
    padding: 0.4rem 0.6rem;
    text-align: center;
  }

  .callout {
    max-width: 600px;
    margin: 1.5rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 5px solid var(--violet);
    border-radius: 8px;
    padding: 0.9rem 1.1rem;
  }

  .callout h4 {
    margin: 0 0 0.4rem 0;
    font-family: var(--font-heavy);
    font-size: 1rem;
    color: var(--squidink);
  }

  .callout p {
    margin: 0;
    font-family: var(--font-main);
    font-size: 0.92rem;
    line-height: 1.55;
    color: #4a5568;
  }

  @media screen and (max-width: 950px) {
    .math-display {
      max-width: 92%;
    }

    .callout {
      max-width: 85%;
    }
  }
</style>
