<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import SplitPicker from "./Components/SplitPicker.svelte";
  import OfferLab from "./Components/OfferLab.svelte";
  import PatienceFigure from "./Components/PatienceFigure.svelte";
  import NashCheck from "./Components/NashCheck.svelte";
  import OptionLab from "./Components/OptionLab.svelte";
  import katexify from "./katexify.js";

  const limitEq = katexify(`x^* = \\frac{r_B}{r_A + r_B}`, true);
  const finiteEq = katexify(`x_T = \\frac{1 - (-\\delta)^T}{1 + \\delta}`, true);
  const rubinsteinEq = katexify(`x^* = \\frac{1 - \\delta_B}{1 - \\delta_A\\,\\delta_B}`, true);
  const nashEq = katexify(`\\max_x\\; x^{1/r_A}\\,(1-x)^{1/r_B}`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Two firms can merge, and the merger is worth more than the two of them
      apart. Let's normalise the extra value to one pot and ask how they split
      it. The textbook picture is a line: every point on the line is a deal
      both sides prefer to walking away, and the line is called the
      <span class="bold">bargaining frontier</span>. Run your finger along it
      and try to find the point economics recommends. There isn't one, and
      that's where most courses stop.
    </p>
    <p>
      It's a strange place to stop, because the picture is missing the only
      thing that actually happens at a bargaining table: offers go back and
      forth, and every round of delay costs both sides something. Write that
      down and the picture stops being silent. Let's start, though, by
      confirming that the silence is real.
    </p>
  </section>

  <SplitPicker />

  <section class="body-text">
    <h3 class="body-header">A procedure that picks</h3>
    <p>
      Now suppose the two sides take turns. A opens with an offer, B accepts
      it or counters, and so on, one round each. Each round that passes burns
      a little of the surplus, which we'll write as a discount factor
      <span class="mono">δ</span> per round: what a promise of the whole pot
      is worth one round late. And suppose there's a deadline, T rounds away,
      after which both walk away with nothing.
    </p>
    <p>
      Work backwards from the deadline and the whole thing unrolls. At the
      last round whoever is holding the offer takes everything, because
      refusing leaves nothing. One round earlier, the responder must be
      promised δ of the pot to accept, so the proposer keeps 1 − δ. Keep
      going and you get a formula for the opening offer at any horizon:
    </p>
    <p class="eq">{@html finiteEq}</p>
    <p>
      It oscillates — proposer, responder, proposer — and the swings die away
      as the deadline recedes. The chart below computes that sequence by
      literal backward induction, one round at a time; the dashed line is the
      horizon nobody ever reaches.
    </p>
  </section>

  <OfferLab />

  <section class="body-text">
    <h3 class="body-header">So what decides it?</h3>
    <p>
      As the rounds get shorter, the opening offer settles onto a limit that
      has a remarkably clean form. Write each side's impatience as a rate per
      unit time — r_A and r_B — so that δ becomes
      <span class="mono">e^(−r·Δ)</span> with Δ the time between offers. In
      the limit as offers get continuous, the first mover's share is
    </p>
    <p class="eq">{@html limitEq}</p>
    <p>
      Look at what's in it. A's share has <em>B's</em> impatience in the
      numerator and both rates in the denominator; A's own rate appears only
      to dilute it. Patience is bargaining power, but it is the
      <em>other side's</em> patience that pays you: the slower B is to walk,
      the more A can hold out for, because B is the one who has to be kept
      willing to say yes.
    </p>
    <p>
      The first-mover advantage — the whole reason the oscillation exists —
      is worth the period length Δ and nothing deeper. Halve the time between
      offers and you halve the gap to the limit. The chart on the right draws
      that gap against Δ on log-log axes, and it is a straight line of slope
      exactly one: moving first is a discretisation artefact, not a fact
      about bargaining.
    </p>
  </section>

  <PatienceFigure />
  <section class="body-text">
    <h3 class="body-header">Two theories, one answer</h3>
    <p>
      The strategic route we've just walked treats bargaining as a game with
      moves and deadlines. There's an older, axiomatic route — Nash's — that
      never mentions an order of play at all: it writes down properties a
      fair split should have, and lands on the single point that maximises a
      weighted product,
    </p>
    <p class="eq">{@html nashEq}</p>
    <p>
      With weights proportional to the inverse impatience rates, that product
      is maximised at exactly r_B/(r_A + r_B). One theory derives the answer
      from how offers alternate; the other derives it from axioms about
      fairness, and they land on the same number to eight decimal places.
      Rubinstein proved the equivalence in 1982, and it's the reason
      "bargaining power" has an operational meaning: it is impatience,
      measured.
    </p>
  </section>

  <NashCheck />

  <section class="body-text">
    <h3 class="body-header">What your fallback is worth</h3>
    <p>
      Everyone "knows" a better outside option improves your deal. In this
      model, test that: give A an outside option — a walk-away value — as a
      share of the surplus, and slide it up from zero. While it sits anywhere
      below the equilibrium share, the split does not move by a decimal. The
      threat to walk is already priced in at exactly zero, because B knows A
      prefers the deal.
    </p>
    <p>
      Then A's fallback crosses the share, and the payoff snaps onto it:
      one for one, and no further. An outside option is a step function, not
      a lever — worthless until it binds, everything once it does. The small
      dot on the chart is the same computation done by brute-force fixed
      point at a finite period, and it sits a hair off the limit curve, which
      is the discretisation again and nothing more.
    </p>
  </section>

  <OptionLab />

  <section class="body-text">
    <h3 class="body-header">What this model costs you</h3>
    <p>
      First, it predicts that agreement is instant: the first offer is always
      accepted, so every observed strike, holdout and month of haggling is
      outside the model. The models that do produce delay make the pie shrink
      asymmetrically or the offers unobservable, and they are a literature of
      their own.
    </p>
    <p>
      Second, the surplus here is money and nothing else, so the frontier is
      a straight line and "efficient" means "on it". With risk aversion the
      frontier bends, efficiency and fairness genuinely come apart, and the
      axiomatic route stops pinning down a unique answer.
    </p>
    <p>
      And third, there are two parties who can find each other. The moment
      one side's alternative is another bargaining partner, the outside
      options become strategic, and the clean step function above is the
      best case, not the worst.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">In one sentence</h3>
    <p>
      The frontier says nothing chooses; the procedure says everything does —
      and what it chooses is built from the other side's impatience, with
      your outside option worth nothing until it crosses the line. Thanks for
      reading!
    </p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      CORE Econ, <em>The Economy 2.0: Microeconomics</em> (2023), Unit 5 —
      the surplus, the frontier, and institutions. Theirs: the frontier and
      the claim that institutions pick the point. Rubinstein (1982),
      <em>Econometrica</em> 50(1):97–109 — alternating offers; Nash (1950),
      <em>Econometrica</em> 18(2):155–162 — the axiomatic solution. Ours: the
      horizon sequence as drawn, the slope-one gap line, the two-route
      agreement table, the outside-option kink, and every number, all
      computed from <span class="mono">src/bargain.js</span> and asserted in
      <span class="mono">verify/check-numbers.mjs</span>.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
</style>