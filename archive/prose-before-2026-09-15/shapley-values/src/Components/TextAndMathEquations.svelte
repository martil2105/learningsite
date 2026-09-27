<script>
  import katexify from "../katexify";
</script>

<h1 class="body-header">Writing that down</h1>

<p class="body-text">
  What the table does is the whole definition. Let {@html katexify("N")} be the
  set of all {@html katexify("n")} players and {@html katexify("v(S)")} the payoff
  that a subset {@html katexify("S")} could get on its own. For an ordering
  {@html katexify("\\pi")}, write {@html katexify("P_i^{\\pi}")} for the set of
  players who arrive before {@html katexify("i")}. Then:
</p>

<div class="math-display">
  {@html katexify(
    "\\phi_i(v) \\;=\\; \\frac{1}{n!} \\sum_{\\pi \\in \\Pi(N)} \\Big[\\, v\\big(P_i^{\\pi} \\cup \\{i\\}\\big) - v\\big(P_i^{\\pi}\\big) \\Big]",
    true
  )}
</div>

<p class="body-text">
  Read it right to left and it is the sentence you just watched: what
  {@html katexify("i")} adds to whoever is already there, averaged over all the
  ways the room could have filled up.
</p>

<p class="body-text">
  In practice nobody enumerates orderings. Many orderings put the same people
  ahead of {@html katexify("i")} and differ only in the shuffling around it, and
  those all produce the same marginal contribution. Counting the duplicates —
  {@html katexify("|S|!")} ways to arrange the people before, and
  {@html katexify("(n - |S| - 1)!")} ways to arrange the people after — collapses
  the sum from {@html katexify("n!")} terms to {@html katexify("2^{n-1}")}:
</p>

<div class="math-display">
  {@html katexify(
    "\\phi_i(v) \\;=\\; \\sum_{S \\subseteq N \\setminus \\{i\\}} \\frac{|S|!\\,(n - |S| - 1)!}{n!} \\Big[\\, v(S \\cup \\{i\\}) - v(S) \\Big]",
    true
  )}
</div>

<p class="body-text">
  That fraction is not a mysterious weight. It is the fraction of orderings in
  which exactly the people in {@html katexify("S")} got there first. With three
  players it says a marginal contribution to the empty set counts for
  {@html katexify("\\tfrac{1}{3}")}, to a single colleague
  {@html katexify("\\tfrac{1}{6}")}, and to the pair
  {@html katexify("\\tfrac{1}{3}")} — first and last positions are each one of
  three, while the middle splits two ways.
</p>

<h1 class="body-header">Why this one and not some other average</h1>

<p class="body-text">
  Averaging over orderings is a reasonable-sounding idea, but so were the two
  answers it replaced. The reason to prefer it is a theorem, and the theorem is
  about four properties.
</p>

<div class="axioms">
  <div class="axiom">
    <h4>Efficiency</h4>
    <div class="ax-math">{@html katexify("\\sum_{i \\in N} \\phi_i(v) = v(N)")}</div>
    <p>
      The payouts add up to what there is. Nothing is invented and nothing is left
      unclaimed — the failure mode of both first attempts.
    </p>
  </div>

  <div class="axiom">
    <h4>Symmetry</h4>
    <div class="ax-math">
      {@html katexify("v(S \\cup \\{i\\}) = v(S \\cup \\{j\\}) \\;\\Rightarrow\\; \\phi_i = \\phi_j")}
    </div>
    <p>
      If swapping two players never changes what a group is worth, they are paid
      the same. Names carry no information; only the value function does.
    </p>
  </div>

  <div class="axiom">
    <h4>Null player</h4>
    <div class="ax-math">
      {@html katexify("v(S \\cup \\{i\\}) = v(S)\\;\\forall S \\;\\Rightarrow\\; \\phi_i = 0")}
    </div>
    <p>
      Someone who adds nothing to any group gets nothing. Note how strong the
      condition is: <em>every</em> group, not just the full one.
    </p>
  </div>

  <div class="axiom">
    <h4>Additivity</h4>
    <div class="ax-math">{@html katexify("\\phi_i(v + w) = \\phi_i(v) + \\phi_i(w)")}</div>
    <p>
      Run two projects and settle up once, or settle each separately: same
      answer. The least intuitive of the four, and the one that will do the most
      work later.
    </p>
  </div>
</div>

<p class="body-text">
  Shapley's result is that <span class="bold">exactly one</span> way of dividing
  the payoff satisfies all four at once, and it is the average over orderings. Not
  one of a family, not the best of several candidates — the only one. Any other
  rule you can invent breaks at least one of the four, and each of the four is
  hard to argue with on its own.
</p>

<p class="body-text">
  Two of them you can watch happen. In the game above, switch to
  <span class="bold">A free rider</span>: Cleo now adds nothing to anybody, her
  column fills with zeros, and her average is zero — that is the null player
  axiom, arrived at rather than imposed. Switch to
  <span class="bold">Two of a kind</span> and Ada and Bo, who are interchangeable
  by construction, come out on the same number. Efficiency is on screen the whole
  time: the three averages always sum to the value of the grand coalition, whatever
  you drag.
</p>

<p class="body-text">
  The last axiom is the quiet one. Additivity says the value is linear in the
  game, which means if you can decompose a complicated game into simple ones, you
  can attribute each piece separately and add up. Hold on to that. It is the
  reason any of this is computable for a model with a thousand trees in it.
</p>

<style>
  .math-display {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 620px;
    margin: 1.2rem auto;
    padding: 0.4rem 0.6rem;
    text-align: center;
  }

  .axioms {
    max-width: 640px;
    margin: 1.5rem auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
    padding: 0 0.5rem;
  }

  .axiom {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.85rem 0.95rem;
  }

  .axiom h4 {
    margin: 0 0 0.4rem 0;
    font-family: var(--font-main);
    font-size: 0.95rem;
    color: var(--squidink);
  }

  .ax-math {
    overflow-x: auto;
    overflow-y: hidden;
    font-size: 0.9rem;
    padding-bottom: 0.35rem;
    margin-bottom: 0.4rem;
    border-bottom: 1px solid #eef1f5;
  }

  .axiom p {
    margin: 0;
    font-family: var(--font-main);
    font-size: 0.83rem;
    line-height: 1.5;
    color: #4a5568;
  }

  @media screen and (max-width: 950px) {
    .math-display {
      max-width: 92%;
    }

    .axioms {
      grid-template-columns: 1fr;
      max-width: 92%;
    }
  }
</style>
