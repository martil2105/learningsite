<script>
  import { PSI, N_TREES } from "../forest.js";
</script>

<h1 class="body-header">What it buys, and what it costs</h1>
<p class="body-text">
  Two details in the original paper are easy to skip past and matter more than
  they look. The first is the subsample. Every tree here saw {PSI} accounts, not
  all of them, and the paper's default is 256 — a number that does not grow with
  your dataset. Smaller samples are not a concession to speed; they improve the
  result. A dense cluster crowded into a small sample stops looking dense, so
  genuine anomalies sitting near it stop being buried by their neighbours, and a
  small tight clump of anomalies stops hiding itself. Those two failures have
  names in the paper: <span class="bold">swamping</span> and
  <span class="bold">masking</span>.
</p>
<p class="body-text">
  The second is what the algorithm never does. It computes no distances, fits no
  density, and inverts no matrices. Building a tree costs a pass over a fixed
  sample regardless of how much data you have, so training is linear in the
  number of rows with a small constant, and memory is bounded by
  {N_TREES} × {PSI} points. On a table wide enough to make a nearest-neighbour
  method uncomfortable, that difference stops being an optimisation and starts
  being the reason the job finishes.
</p>
<p class="body-text">
  The price is visible in the last chart. Every cut is parallel to an axis, so
  the score surface is built from rectangles, and it leaks: extend a region of
  low score along an axis and you get bands of artificially normal-looking space
  where no data lives at all. If your anomalies are defined by a relationship
  between two features rather than by either one — a transfer size that is only
  strange <em>given</em> its frequency — axis-aligned cuts will find them
  slowly, or not at all. That is the problem the
  <span class="bold">extended isolation forest</span> addresses, by drawing cuts
  at random angles instead of along the axes.
</p>
<p class="body-text">
  It is also worth remembering that the model hands you a ranking, not a
  decision. Every point gets a score; nothing in the method tells you where to
  draw the line. That choice is yours, and it belongs with the people who will
  have to act on whatever crosses it.
</p>
<br />
<p class="body-text">
  Thanks for reading. This article is built in the style of
  <a class="on-end" href="https://mlu-explain.github.io/">MLU-Explain</a>,
  Amazon's collection of visual essays on machine learning, whose article
  scaffold and design system it borrows; the explanations, code and data here
  are its own. If isolation forests were new to you, the two papers linked below
  are unusually readable for the genre and worth the hour.
</p>

<style>
</style>
