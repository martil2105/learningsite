<script>
  import katexify from "../katexify.js";
  import { PRE, POP, M, B, int, num, pct } from "../experiments.js";

  const dev = int(M);
  /* Built in the script block, not the template: {#if} and {#each} strip the
     leading whitespace of their bodies, which has glued a figure to the next
     word in three articles now. */
  const oddsLine = `odds of default double every ${PRE.meta.pdo} points`;
</script>

<p class="body-text">
  A lender builds an application scorecard on {dev} applications, puts it live,
  and then has to answer the same question every month for the rest of the
  model's life: <em>is this still the population we built it on?</em>
</p>

<p class="body-text">
  The answer has to arrive long before the outcomes do. A consumer loan takes a
  year or two to say whether it was a good one, so for the first eighteen months
  of a scorecard's life there is nothing to check its predictions against. What
  there is, on the first of every month, is a fresh set of scores. So the
  industry watches the shape of those instead — and the Population Stability
  Index is how.
</p>

<p class="body-text">
  Cut the development sample into ten equal slices at its own deciles, so each
  slice holds exactly {pct(1 / B, 0)} of it by construction. Count what fraction
  of this month's applications land in each slice. If nothing has moved, each
  fraction should come out near {pct(1 / B, 0)} as well. PSI adds up how far
  they are from it:
</p>

<div class="eq">{@html katexify("\\mathrm{PSI} \\;=\\; \\sum_{i=1}^{B} \\left(a_i - e_i\\right)\\,\\ln\\!\\frac{a_i}{e_i}", true)}</div>

<p class="body-text">
  with <span class="mono">e</span> the expected share of bin <span class="mono">i</span>
  and <span class="mono">a</span> the actual one. Then it compares the total
  against two numbers that have been in the credit literature since 1994:
  <span class="bold">below 0.10, no significant change; 0.10 to 0.25, a moderate
  shift worth investigating; above 0.25, a significant shift — review the
  model.</span>
</p>

<p class="body-text">
  That is the whole procedure, and it is everywhere. It runs on the score, on
  every input characteristic, on every segment, in every monitoring pack, in a
  one-line function in every credit analytics library, and the results go into a
  table with those two thresholds as a colour rule. It needs no outcomes, which
  is exactly why it won.
</p>

<p class="body-text">
  The scorecard below is an ordinary one: {oddsLine}, a cut-off at
  {PRE.meta.cutoff}, {pct(POP.approvalRate)} of applications approved, and
  {pct(POP.badRate)} of them going bad. Here is one month of its monitoring
  pack.
</p>

<style>
  .eq {
    max-width: 600px;
    margin: 1.2rem auto;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.2rem 0;
    text-align: center;
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  @media screen and (max-width: 950px) {
    .eq { max-width: 80%; font-size: 0.92rem; }
  }
</style>
