<script>
  import katexify from "../katexify.js";
  import { PRE, POP, M, B, int, num, pct } from "../experiments.js";

  const dev = int(M);
  /* Built in the script block, not the template: {#if} and {#each} strip the
     leading whitespace of their bodies, which has glued a figure to the next
     word in three articles now. */
  const oddsLine = `odds of default that double every ${PRE.meta.pdo} points`;
</script>

<p class="body-text">
  Suppose a lender builds an application scorecard on {dev} applications and
  puts it live. From then on, the lender has to answer the same question every
  month for the rest of the model's life: <em>is this still the population we
  built it on?</em>
</p>

<p class="body-text">
  The answer has to arrive long before the outcomes do. It takes a year or two
  to find out whether a consumer loan was a good one, so for the first eighteen
  months of a scorecard's life, there's nothing to check its predictions
  against. What there is, on the first of every month, is a fresh set of scores.
  So the industry watches the shape of those scores instead, and the Population
  Stability Index (PSI) is how it does that.
</p>

<p class="body-text">
  Here's how it works. We cut the development sample into ten equal slices at
  its own deciles, so each slice holds exactly {pct(1 / B, 0)} of it by
  construction. Then we count what fraction of this month's applications land in
  each slice. If nothing has moved, each fraction should also come out near
  {pct(1 / B, 0)}. PSI adds up how far the fractions are from that:
</p>

<div class="eq">{@html katexify("\\mathrm{PSI} \\;=\\; \\sum_{i=1}^{B} \\left(a_i - e_i\\right)\\,\\ln\\!\\frac{a_i}{e_i}", true)}</div>

<p class="body-text">
  where <span class="mono">e</span> is the expected share of bin
  <span class="mono">i</span> and <span class="mono">a</span> is the actual
  share. The total is then compared against two numbers that have been in the
  credit literature since 1994: <span class="bold">below 0.10 means no
  significant change, 0.10 to 0.25 means a moderate shift worth investigating,
  and above 0.25 means a significant shift, so review the model.</span>
</p>

<p class="body-text">
  That's the whole procedure, and it's everywhere. It runs on the score, on
  every input characteristic and on every segment. It's in every monitoring pack
  and in a one-line function in every credit analytics library, and the results
  go into a table with those two thresholds as a colour rule. It needs no
  outcomes, which is exactly why it won.
</p>

<p class="body-text">
  The scorecard below is an ordinary one, with {oddsLine}, a cut-off at
  {PRE.meta.cutoff}, {pct(POP.approvalRate)} of applications approved and
  {pct(POP.badRate)} of them going bad. Here's one month of its monitoring
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
