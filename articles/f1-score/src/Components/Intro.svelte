<script>
  import precomputed from "../precomputed.js";
  const { n, totalPositives } = precomputed.hook;
</script>

<p class="body-text">
  Imagine you've trained a machine learning model to monitor industrial coolant
  pumps across a refinery fleet. For each pump, the model outputs a score: the probability
  that the pump will suffer a catastrophic mechanical failure within the next 48 hours.
</p>

<p class="body-text">
  A score alone doesn't run a plant, though. To take action, someone has to choose a
  <span class="bold">decision threshold</span>. Every pump that scores above the
  threshold gets an emergency maintenance dispatch, and every pump below it is left
  running.
</p>

<p class="body-text">
  The operations team can name two very real costs. An inspection is quick and
  relatively cheap, but sending a technician to a healthy pump is a wasted false
  alarm. An unplanned breakdown, on the other hand, can halt a production line for
  days.
</p>

<p class="body-text">
  So how do practitioners choose that threshold? In machine learning textbooks, Kaggle
  competitions and production teams around the world, almost everyone follows the same
  recipe:
  <span class="bold">evaluate the model on a validation set and pick the threshold that maximises the F1 score</span>.
</p>

<p class="body-text">
  Below is your validation set, made up of {n.toLocaleString()} scored pump-days held
  back from training, of which {totalPositives} were followed by a real failure within
  48 hours. The precision-recall curve traces out every threshold your model could
  adopt.
</p>

<p class="body-text">
  Before we examine the recipe, let's do what everyone does.
  <span class="bold">Drag the slider below to hunt for the highest F1 score you can find</span>.
</p>
