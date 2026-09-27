<script>
  import katexify from "../katexify";
</script>

<h1 class="body-header">Writing it down</h1>

<p class="body-text">
  The table you just explored is the whole definition. Let
  {@html katexify("N")} be the set of all {@html katexify("n")} players, and let
  {@html katexify("v(S)")} be the payoff that a subset {@html katexify("S")}
  could get on its own. For an ordering {@html katexify("\\pi")}, we write
  {@html katexify("P_i^{\\pi}")} for the set of players who arrive before
  {@html katexify("i")}. The Shapley value of player {@html katexify("i")} is
  then:
</p>

<div class="math-display">
  {@html katexify(
    "\\phi_i(v) \\;=\\; \\frac{1}{n!} \\sum_{\\pi \\in \\Pi(N)} \\Big[\\, v\\big(P_i^{\\pi} \\cup \\{i\\}\\big) - v\\big(P_i^{\\pi}\\big) \\Big]",
    true
  )}
</div>

<p class="body-text">
  If we read it from right to left, it says exactly what the table showed: what
  {@html katexify("i")} adds to whoever is already there, averaged over all the
  ways the room could have filled up.
</p>

<p class="body-text">
  In practice, nobody enumerates orderings. Many orderings put the same people
  ahead of {@html katexify("i")} and differ only in how everyone is shuffled
  around it, and those orderings all produce the same marginal contribution. If
  we count the duplicates ({@html katexify("|S|!")} ways to arrange the people
  before, and {@html katexify("(n - |S| - 1)!")} ways to arrange the people
  after), the sum collapses from {@html katexify("n!")} terms to
  {@html katexify("2^{n-1}")}:
</p>

<div class="math-display">
  {@html katexify(
    "\\phi_i(v) \\;=\\; \\sum_{S \\subseteq N \\setminus \\{i\\}} \\frac{|S|!\\,(n - |S| - 1)!}{n!} \\Big[\\, v(S \\cup \\{i\\}) - v(S) \\Big]",
    true
  )}
</div>

<p class="body-text">
  That fraction isn't a mysterious weight. It's simply the fraction of orderings
  in which exactly the people in {@html katexify("S")} got there first. With
  three players, it says that a marginal contribution to the empty set counts for
  {@html katexify("\\tfrac{1}{3}")}, a contribution to a single colleague counts
  for {@html katexify("\\tfrac{1}{6}")}, and a contribution to the pair counts for
  {@html katexify("\\tfrac{1}{3}")}. That's because arriving first and arriving
  last each happen in a third of the orderings, while the middle third is split
  between the two colleagues who could have arrived first.
</p>

<h1 class="body-header">Why this average and not another?</h1>

<p class="body-text">
  Averaging over orderings sounds reasonable, but so did the two answers it
  replaced. The reason to prefer it is a theorem, and that theorem is about four
  properties.
</p>

<div class="axioms">
  <div class="axiom">
    <h4>Efficiency</h4>
    <div class="ax-math">{@html katexify("\\sum_{i \\in N} \\phi_i(v) = v(N)")}</div>
    <p>
      The payouts add up to exactly what there is to share. Nothing is invented
      and nothing is left unclaimed, which is where both of our first attempts
      failed.
    </p>
  </div>

  <div class="axiom">
    <h4>Symmetry</h4>
    <div class="ax-math">
      {@html katexify("v(S \\cup \\{i\\}) = v(S \\cup \\{j\\}) \\;\\Rightarrow\\; \\phi_i = \\phi_j")}
    </div>
    <p>
      If swapping two players never changes what a group is worth, they get paid
      the same. Names carry no information; only the value function does.
    </p>
  </div>

  <div class="axiom">
    <h4>Null player</h4>
    <div class="ax-math">
      {@html katexify("v(S \\cup \\{i\\}) = v(S)\\;\\forall S \\;\\Rightarrow\\; \\phi_i = 0")}
    </div>
    <p>
      Someone who adds nothing to any group gets nothing. Notice how strong this
      condition is: it applies to <em>every</em> group, not just the full one.
    </p>
  </div>

  <div class="axiom">
    <h4>Additivity</h4>
    <div class="ax-math">{@html katexify("\\phi_i(v + w) = \\phi_i(v) + \\phi_i(w)")}</div>
    <p>
      Whether you run two projects and settle up once, or settle each one
      separately, you get the same answer. It's the least intuitive of the four,
      but it's the one that will do the most work later.
    </p>
  </div>
</div>

<p class="body-text">
  Shapley's result is that <span class="bold">exactly one</span> way of dividing
  the payoff satisfies all four properties at once, and it's the average over
  orderings. It isn't one of a family, or the best of several candidates; it's
  the only one. Any other rule you can invent breaks at least one of the four,
  and each of them is hard to argue with on its own.
</p>

<p class="body-text">
  You can watch two of them happen. In the game above, switch to
  <span class="bold">A free rider</span>. Cleo now adds nothing to anybody, so
  her column fills with zeros and her average is zero. That's the null player
  axiom, arrived at rather than imposed. Now switch to
  <span class="bold">Two of a kind</span>, and Ada and Bo, who are
  interchangeable by construction, come out with the same number. Efficiency is
  on screen the whole time, since the three averages always sum to the value of
  the grand coalition, whatever you drag.
</p>

<p class="body-text">
  The last axiom is the quiet one. Additivity says the value is linear in the
  game, which means that if you can break a complicated game into simple ones,
  you can attribute each piece separately and add up the results. Keep that in
  mind, because it's the reason any of this is computable for a model with a
  thousand trees in it.
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
