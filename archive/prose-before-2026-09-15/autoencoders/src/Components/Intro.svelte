<script>
  import { PLANE, PLANE_PCA, PC1_ANGLE, num, deg, pct } from "../experiments.js";
</script>

<p class="body-text">
  An autoencoder is a network asked to copy its input to its output, through a
  layer too small to carry it. Nothing about that sounds useful — you already
  have the input — and the usefulness is entirely in the narrow layer. Whatever
  survives the squeeze is what the network judged worth keeping.
</p>

<p class="body-text">
  Take the simplest possible one. Two numbers in, <em>one</em> number in the
  middle, two numbers out, and no activation functions anywhere: just a matrix
  down and a matrix back up. Train it to minimise the squared distance between
  what went in and what came out.
</p>

<p class="body-text">
  There is a shape to that problem before any training happens. The code is a
  single number, so every reconstruction is that number times a fixed vector —
  which means every reconstruction the network can possibly produce lies on
  <span class="bold">one line through the origin</span>. Training cannot change
  that. All it can do is choose the line, and then choose how to land each point
  on it.
</p>

<p class="body-text">
  So the whole question is which line. Below are {PLANE.length} points and a
  decoder you can point wherever you like. The hollow circles are what comes back
  out; the short segments are what was lost. The number underneath is the only
  thing the network is trying to make small.
</p>
