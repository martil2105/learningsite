<script>
  /* Conclusion.svelte */
</script>

<section class="conclusion-section">
  <h2>Conclusion</h2>

  <p>
    The Gini coefficient is the world's most widely cited measure of inequality. Yet treating a rich multi-dimensional distribution as a single scalar summary number carries profound risks:
  </p>

  <ol class="takeaways-list">
    <li>
      <strong>An Intuitive Physical Meaning:</strong> The Gini is literally the expected income difference between any two randomly drawn citizens, divided by twice the society's average income.
    </li>
    <li>
      <strong>The Crossing Trap:</strong> Two economies can share the exact same Gini coefficient while experiencing completely different realities. A society with extreme poverty at the bottom and a society with extreme billionaire wealth at the top can produce identical Gini scores whose Lorenz curves cross.
    </li>
    <li>
      <strong>The Moral Tradeoff:</strong> When curves cross, rankings invert. Under the Atkinson index, varying inequality aversion <em>&epsilon;</em> from low (curbing top fortunes) to high (eradicating poverty) flips which society is judged more unequal.
    </li>
    <li>
      <strong>The Machine Learning Bridge:</strong> In data science and credit risk, the Accuracy Ratio <code>AR = 2&middot;AUC &minus; 1</code> is the exact same Gini construction. Evaluating classification models purely by overall Gini blinds practitioners to massive differences at specific decision thresholds.
    </li>
  </ol>

  <p class="final-word">Thanks for reading!</p>
</section>

<style>
  .conclusion-section {
    margin: 3.5rem 0 2rem 0;
    padding-top: 2rem;
    border-top: 1px solid var(--stone, #d4dada);
  }
  h2 {
    font-size: 1.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 1.25rem 0;
  }
  p {
    font-size: 1.05rem;
    line-height: 1.65;
    margin: 0 0 1.25rem 0;
  }
  .takeaways-list {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }
  .takeaways-list li {
    font-size: 1rem;
    line-height: 1.65;
    margin-bottom: 1rem;
  }
  code {
    background: var(--paper, #f1f3f3);
    padding: 1px 5px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }
  .final-word {
    font-weight: 700;
    margin-top: 2rem;
  }
</style>
