<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import GapFigure from "./Components/GapFigure.svelte";
  import InstrumentLab from "./Components/InstrumentLab.svelte";
  import SlopeFigure from "./Components/SlopeFigure.svelte";
  import katexify from "./katexify.js";

  const gapEq = katexify(`q_s = q_0 - e\\,\\frac{B\\,S}{B + S}`, true);
  const pigouEq = katexify(`t = e \\quad\\Longrightarrow\\quad q_t = q_s`, true);
  const weitzEq = katexify(`\\frac{\\text{loss}_{\\text{tax}}}{\\text{loss}_{\\text{quota}}} = \\left(\\frac{g}{b}\\right)^{2}`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Upstream there's a plant; downstream there's a town that drinks the
      river. Every unit the plant makes earns it money and costs the town
      twelve — the town never sees a penny of the revenue and every penny of
      the damage. The plant's own books show a private cost that stops at
      the plant gate, so the market sends its answer: make 40. The town's
      arithmetic says the answer should be 32. That gap — eight units, all
      of it dressed as profit on one side and damage on the other — is what
      an <span class="bold">externality</span> is.
    </p>
    <p>
      The question everyone agrees on is "make 32". The question that
      actually gets argued about is <em>how</em>: tax the plant, cap the
      plant, or have the town and the plant hammer out a deal. Let's first
      see exactly why the market picks 40, because the size of the gap has
      an exact address.
    </p>
  </section>

  <GapFigure />

  <section class="body-text">
    <h3 class="body-header">The gap, measured</h3>
    <p>
      Add the twelve to the plant's supply curve and you've drawn the cost
      the town already knows by heart. The two equilibria are
    </p>
    <p class="eq">{@html gapEq}</p>
    <p>
      and the difference is exactly eight units here, for the same reason it
      is always the uncounted cost scaled by the market's responsiveness.
      Nothing mysterious happens at the optimum, either: at 32 units the gap
      between what buyers pay and what sellers need is exactly twelve — the
      external cost, surfacing as a price wedge. Which is the clue to the
      tax.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Three instruments, one quantity</h3>
    <p>
      A tax set at the external cost makes the plant's own arithmetic see
      the town's cost: it chooses 32 by itself, and
    </p>
    <p class="eq">{@html pigouEq}</p>
    <p>
      A quota of 32 gets there by order. A bargain gets there by handshake —
      if the town and the plant can find each other, the deal they land on
      puts output at the optimum no matter who holds the rights; only the
      cheque's direction changes. Three different mechanisms, one number —
      and, as the lab below makes brutal, one amount of money. The choice
      looks purely distributional: same quantity, same 384, different
      pockets.
    </p>
  </section>

  <InstrumentLab />
  <section class="body-text">
    <h3 class="body-header">Now take the regulator's spreadsheet away</h3>
    <p>
      Everything above assumed the regulator <em>knows</em> the twelve —
      knows the damage curve, the benefit curve, the whole machine. In
      reality those are estimates with error bars, and the two instruments
      respond to being wrong in <em>different ways</em>. A quota pins the
      quantity and lets the price absorb the error. A tax pins the price and
      lets the quantity absorb it. When the private-benefit curve moves
      around — which it does, monthly — one of those is cheaper, and which
      one is a question with an exact answer.
    </p>
    <p>
      Weitzman asked it in 1974 and the answer fits in one line: set both
      instruments for the mean shock, shock the benefit curve, integrate the
      losses. The expected-loss ratio between the tax and the quota is
    </p>
    <p class="eq">{@html weitzEq}</p>
    <p>
      where b is the slope of the private benefit curve and g the slope of
      the damage curve. The price instrument wins when damage is FLAT —
      when being wrong about the quantity is not expensive. The quantity
      instrument wins when damage is STEEP — when letting the quantity wander
      is dangerous. Climate is the classic flat-damage case (a ton is a ton
      wherever it lands in the profile); a local threshold pollutant is the
      steep case. The intuition inverts the comfortable "it depends" into a
      slope comparison you can actually estimate.
    </p>
  </section>

  <SlopeFigure />

  <section class="body-text">
    <h3 class="body-header">What this diagram costs you</h3>
    <p>
      First, the equivalence result needs the regulator to know e; the
      moment they don't, the choice is an efficiency question with a
      closed-form answer — that's the whole turn of this article.
    </p>
    <p>
      Second, the bargain needs two parties who can find each other and
      split the money without burning it. With a thousand downstream
      households the handshake becomes a public-goods problem, and the
      instrument comparison quietly changes again.
    </p>
    <p>
      And third, the damage curve here is a line, so "steep versus flat" is
      a single number. Real damage curves bend — thresholds, tipping points
      — and bending is exactly what pushes the quantity instrument's case.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">In one sentence</h3>
    <p>
      With the cost curve known, the three instruments are one quantity and
      one pot of money wearing three costumes; with the cost curve
      uncertain, the choice between price and quantity is the square of a
      slope ratio, and the flat side loses. Thanks for reading!
    </p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      CORE Econ, <em>The Economy 2.0: Microeconomics</em> (2023), Unit 10
      §§10.2–10.7 — external effects, Pigouvian taxes, cap and trade.
      Theirs: the externality and the instruments. Pigou (1920), <em>The
      Economics of Welfare</em>; Coase (1960), <em>J. Law & Econ.</em>
      3:1–44; Weitzman (1974), <em>RES</em> 41(4):477–491 — prices versus
      quantities. <strong>Verify each before relying on it.</strong> Ours:
      the plant-and-river case, the revenue-equals-rent equality, the
      (g/b)² measurement and its corner, and every number, all computed
      from <span class="mono">src/externality.js</span> and asserted in
      <span class="mono">verify/check-numbers.mjs</span>.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
</style>