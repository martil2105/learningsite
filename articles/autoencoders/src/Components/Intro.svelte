<script>
  import { PLANE, PLANE_PCA, PC1_ANGLE, num, deg, pct } from "../experiments.js";
</script>

<p class="body-text">
  An autoencoder is a network that's asked to copy its input to its output,
  through a layer that's too small to carry it. At first, that doesn't sound
  useful, since we already have the input. The usefulness lies entirely in the
  narrow layer: whatever survives the squeeze is what the network judged worth
  keeping.
</p>

<p class="body-text">
  Let's start with the simplest possible one. It takes two numbers in, squeezes
  them into <em>one</em> number in the middle, and puts two numbers back out,
  with no activation functions anywhere. It's just one matrix going down and
  another coming back up. We train it to minimise the squared distance between
  what went in and what came out.
</p>

<p class="body-text">
  This problem has a shape even before any training happens. The code is a
  single number, so every reconstruction is that number times a fixed vector.
  This means every reconstruction the network can possibly produce lies on
  <span class="bold">one line through the origin</span>. Training can't change
  that; all it can do is choose the line, and then choose how to land each point
  on it.
</p>

<p class="body-text">
  So the whole question is which line to choose. Below are {PLANE.length} points
  and a decoder that you can point wherever you like. The hollow circles show
  what comes back out, and the short segments show what was lost. The number
  underneath the chart is the only thing the network is trying to make small.
</p>
