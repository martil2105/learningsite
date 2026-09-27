<script>
  import katexify from "../katexify";
</script>

<section>
  <p class="body-text">
    A single decision tree is like an over-eager student. Given a training set, it
    carves the feature space into narrower and narrower boxes until it gets almost
    every training example right. But when we show it fresh, unseen data, it often
    trips over its own complexity. In other words, it suffers from high variance.
  </p>

  <p class="body-text">
    The standard remedy is to assemble a crowd. In a
    <a href="https://mlu-explain.github.io/random-forest/">Random Forest</a>, we
    train hundreds of deep trees independently on randomized bootstrap samples of
    the data, and then average their predictions. It's the wisdom of the crowd:
    individual errors cancel out, and the ensemble stabilizes.
  </p>

  <p class="body-text">
    <span class="bold">Gradient boosting</span> takes the opposite approach.
    Instead of training a committee of independent trees and hoping their mistakes
    cancel, what if we trained a sequence of humble, shallow trees, and gave each
    newcomer a single, specific job:
    <span class="highlight">predict the mistakes made by the team so far?</span>
  </p>

  <p class="body-text">
    In 2016, researchers Tianqi Chen and Carlos Guestrin published
    <span class="bold">XGBoost</span> (short for <em>eXtreme Gradient Boosting</em>).
    It took competitive machine learning by storm, claiming dozens of victories across
    Kaggle competitions and becoming the workhorse of real-world tabular data pipelines.
    XGBoost isn't just "fast boosting", though. It's a mathematically elegant
    framework that unifies loss functions, leaf regularization, and tree growth into
    a single closed-form objective.
  </p>

  <p class="body-text">
    To see how it works, we'll follow a concrete example: predicting daily
    household electricity demand (in kilowatt-hours) from the outdoor temperature
    ({@html katexify("^{\\circ}\\text{C}")}). The relationship is thoroughly
    non-linear. Sub-zero cold drives heavy heating demand, mild spring days sit at
    an efficient refrigeration baseline, and scorching heat waves send
    air-conditioning use soaring. Let's see how trees and gradients handle this
    curve.
  </p>
</section>

<style>
  .highlight {
    background-color: rgba(255, 153, 0, 0.15);
    padding: 0 4px;
    border-radius: 2px;
    font-weight: 500;
  }
</style>