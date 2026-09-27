<script>
  /* Conclusion.svelte */
</script>

<section class="conclusion-section">
  <h2>Conclusion</h2>

  <p>
    The standard competitive story states that free entry drives economic profits completely to zero, forcing market price down to the absolute minimum of average cost. This elegant benchmark is approximately true at scale, but exactly false in reality:
  </p>

  <ol class="takeaways-list">
    <li>
      <strong>Firms enter as integers, not fractions.</strong> The market can only sustain a whole number of firms. Because entry is an all-or-nothing private gamble, entry ceases at <em>n*</em> = &lfloor;<em>n̄</em>&rfloor; — the last whole firm that can cover its fixed overhead.
    </li>
    <li>
      <strong>Surviving profit never vanishes.</strong> Every firm inside the market earns a positive residual profit equal to ((1 + <em>x</em>)<sup>2</sup> &minus; 1) fixed costs, where <em>x</em> = frac(<em>n̄</em>) / (<em>Bd</em> + <em>n*</em>). In a market of 50 firms, this profit is over 2% of a firm's fixed investment, and no prospective entrant can afford to enter to compete it away.
    </li>
    <li>
      <strong>The long-run supply curve is a sawtooth.</strong> Across market sizes, the long-run price line repeatedly dips down to minimum average cost at discrete integer thresholds, rising above it in between. While the sawtooth flattens like 1/<em>n</em> as the market expands, free entry under price taking remains strictly non-excessive — always within one firm of the social optimum.
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
  .final-word {
    font-weight: 700;
    margin-top: 2rem;
  }
</style>
