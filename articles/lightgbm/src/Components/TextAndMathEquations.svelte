<script>
  import katexify from "../katexify";
  import { BINNED, BIN_SETTINGS, EXACT_CURVE, int } from "../experiments.js";
  const at255 = BINNED[BIN_SETTINGS.length - 1];
</script>

<h1 class="body-header">Why a bucket is enough</h1>

<p class="body-text">
  Scoring a split means asking how much better the model gets when we separate
  one set of rows from another. With gradients {@html katexify("g_i")} and
  hessians {@html katexify("h_i")}, and their sums {@html katexify("G")} and
  {@html katexify("H")} on each side, the gain is:
</p>

<div class="math-display">
  {@html katexify(
    "\\text{gain} \\;=\\; \\tfrac{1}{2}\\left[\\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda}\\right] - \\gamma",
    true
  )}
</div>

<p class="body-text">
  Take a look at what's in there and what isn't. The formula contains four sums
  and two constants, but no individual row appears anywhere, and nothing in the
  expression could tell you whether {@html katexify("G_L")} was accumulated from
  four million rows or handed over already added up. That's the opening, and
  everything else follows from taking advantage of it.
</p>

<p class="body-text">
  So let's add them up in advance. We assign every row a
  <span class="bold">bin</span>, which is an integer from {@html katexify("0")}
  to {@html katexify("B-1")} saying which slice of the column the row falls in,
  and keep two arrays:
</p>

<div class="math-display">
  {@html katexify(
    "\\mathcal{G}_b \\;=\\; \\sum_{i \\,:\\, \\text{bin}(x_i) = b} g_i \\qquad\\quad \\mathcal{H}_b \\;=\\; \\sum_{i \\,:\\, \\text{bin}(x_i) = b} h_i",
    true
  )}
</div>

<p class="body-text">
  Together, these two arrays are the histogram. Building it takes one pass over
  the rows, with two additions per row and no sorting, comparisons or indexes to
  follow. And now every split we could take at a bin boundary is a running sum
  along {@html katexify("B")} numbers, rather than a walk along
  {@html katexify("n")} rows:
</p>

<div class="math-display">
  {@html katexify(
    "G_L(b) \\;=\\; \\sum_{b' \\le b} \\mathcal{G}_{b'} \\qquad\\quad G_R(b) \\;=\\; G - G_L(b)",
    true
  )}
</div>

<p class="body-text">
  That gives us {@html katexify("B - 1")} boundaries, whatever
  {@html katexify("n")} is. In the chart above, that means
  {int(at255.candidates.length)} candidates instead of
  {int(EXACT_CURVE.length)}, and the split the histogram picks is worth 99.9% of
  the best one available.
</p>

<h1 class="body-header">The identity that does the real work</h1>

<p class="body-text">
  Here's the part that turns a nice idea into a fast one, and it takes a single
  line of arithmetic. A node's rows are exactly its two children's rows, since
  every row goes either left or right, and none is lost or duplicated. So, bin by
  bin:
</p>

<div class="math-display">
  {@html katexify(
    "\\mathcal{G}_b^{\\,\\text{parent}} \\;=\\; \\mathcal{G}_b^{\\,\\text{left}} + \\mathcal{G}_b^{\\,\\text{right}} \\qquad\\Longrightarrow\\qquad \\mathcal{G}_b^{\\,\\text{right}} = \\mathcal{G}_b^{\\,\\text{parent}} - \\mathcal{G}_b^{\\,\\text{left}}",
    true
  )}
</div>

<p class="body-text">
  This means we never need to build both children. We build whichever child
  holds fewer rows and get its sibling by subtraction, at a cost of
  {@html katexify("B")} subtractions no matter how many rows that sibling holds.
  Since splits are usually lopsided, the cheaper half is usually much cheaper.
</p>

<div class="callout">
  <h4>The pre-sorted algorithm can't do this</h4>
  <p>
    This isn't because nobody thought of it. A pre-sorted node is a list of row
    indices in sorted order, and there's no operation on two such lists that
    yields the third without touching the rows, because a list isn't a sum and
    can't be subtracted. The histogram is a summary that happens to be additive,
    and additivity is the whole reason it's worth having. Keep that in mind,
    because the next section measures how much of LightGBM's speed comes from
    the histogram itself and how much comes from this one identity, and the
    answer isn't the one most explanations imply.
  </p>
</div>

<h1 class="body-header">And it fits in a byte</h1>

<p class="body-text">
  There's a second consequence that gets discussed less but matters just as
  much. Once a column is a bin index rather than a number, it only needs
  {@html katexify("\\lceil \\log_2 B \\rceil")} bits. LightGBM's documentation
  is explicit about this: at <span class="mono">max_bin = 255</span>, it stores
  a feature value in a <span class="mono">uint8_t</span>, which is one byte
  compared with the eight bytes of a double. There's also no permutation index
  to keep beside it, because there's nothing to sort. This is why the default is
  255 rather than 256, since the byte also has to hold a code for a missing
  value.
</p>

<p class="body-text">
  A tenfold reduction in the memory taken up by the training data isn't a
  footnote. It decides whether the data fits in cache and whether it fits in
  memory at all, and in the distributed setting, it means that what you send
  across the network is a few hundred numbers per feature rather than the whole
  feature.
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
