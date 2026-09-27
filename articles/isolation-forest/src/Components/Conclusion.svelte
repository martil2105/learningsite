<script>
  import { PSI, N_TREES } from "../forest.js";
</script>

<h1 class="body-header">What it gives you, and what it costs</h1>
<p class="body-text">
  Two details in the original paper are easy to skip past, but they matter more
  than they seem. The first is the subsample. Every tree here saw {PSI} accounts
  rather than all of them, and the paper's default is 256, a number that doesn't
  grow with your dataset. Smaller samples aren't just a concession to speed,
  because they actually improve the result. When a dense cluster is thinned out
  into a small sample, it stops looking so dense. As a result, genuine anomalies
  sitting near it stop being buried by their neighbours, and a small, tight
  clump of anomalies stops hiding itself. The paper calls these two failures
  <span class="bold">swamping</span> and <span class="bold">masking</span>.
</p>
<p class="body-text">
  The second detail is what the algorithm never does. It computes no distances,
  fits no density and inverts no matrices. Building a tree costs a single pass
  over a fixed-size sample, no matter how much data you have, so training is
  linear in the number of rows with a small constant, and memory is bounded by
  {N_TREES} × {PSI} points. On a table wide enough to make a nearest-neighbour
  method struggle, that difference stops being a mere optimisation and becomes
  the reason the job finishes at all.
</p>
<p class="body-text">
  The price is visible in the last chart. Because every cut is parallel to an
  axis, the score surface is built from rectangles, and it leaks. Regions of low
  score stretch out along the axes, creating bands of artificially
  normal-looking space where no data lives at all. If your anomalies are defined
  by a relationship between two features rather than by either one alone (for
  example, a transfer size that's only strange <em>given</em> its frequency),
  axis-aligned cuts will find them slowly, or not at all. The
  <span class="bold">extended isolation forest</span> addresses this problem by
  drawing cuts at random angles instead of along the axes.
</p>
<p class="body-text">
  Finally, it's worth remembering that the model hands you a ranking, not a
  decision. Every point gets a score, but nothing in the method tells you where
  to draw the line. That choice is yours, and it belongs with the people who
  will have to act on whatever crosses it.
</p>
<br />
<p class="body-text">
  Thanks for reading! This article is built in the style of
  <a class="on-end" href="https://mlu-explain.github.io/">MLU-Explain</a>,
  Amazon's collection of visual essays on machine learning, and it borrows their
  article scaffold and design system. The explanations, code and data here are
  original. If isolation forests were new to you, the two papers linked below
  are unusually readable for academic papers and well worth an hour of your
  time.
</p>

<style>
</style>
