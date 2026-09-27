<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import SplitPicker from "./Components/SplitPicker.svelte";
  import OfferLab from "./Components/OfferLab.svelte";
  import PatienceFigure from "./Components/PatienceFigure.svelte";
  import NashCheck from "./Components/NashCheck.svelte";
  import OptionLab from "./Components/OptionLab.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { R_A, R_B } from "./datasets.js";
  import { limitShare } from "./bargain.js";

  const limitEq = katexify(`x^* = \\frac{r_B}{r_A + r_B}`, true);
  const finiteEq = katexify(`x_T = \\frac{1 - (-\\delta)^T}{1 + \\delta}`, true);
  const rubinsteinEq = katexify(`x = \\frac{1 - \\delta_B}{1 - \\delta_A\\,\\delta_B}`, true);
  const nashEq = katexify(`\\max_x\\; x^{1/r_A}\\,(1-x)^{1/r_B}`, true);

  // Inline maths goes through KaTeX too: normalize.css lower-cases <sub> and
  // <sup>, so r<sub>A</sub> rendered as "ra" and e<sup>−rΔ</sup> as "e−rδ".
  const rA = katexify(`r_A`);
  const rB = katexify(`r_B`);
  const signFlip = katexify(`(-\\delta)^T`);
  const perRound = katexify(`\\delta = e^{-r\\Delta}`);
  const limitInline = katexify(`r_B/(r_A + r_B)`);

  const sharePct = (100 * limitShare(R_A, R_B)).toFixed(0);
  const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const howMuchMore = WORDS[Math.round(R_B / R_A)] ?? String(Math.round(R_B / R_A));
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's imagine two firms, A and B, that are talking about a merger.
        Together they'd be worth more than the two of them apart, and that
        extra value is the <span class="bold">surplus</span> from the deal. To
        keep our sums simple, we'll measure the surplus as one pot of size one.
        A deal is then just a split of the pot: A takes a share of it, and B
        takes the rest.
      </p>
      <p>
        First courses in economics draw the possible deals as a line called the
        <span class="bold">bargaining frontier</span>. Every point on it splits
        the whole pot, so every point is a deal that both firms prefer to walking
        away with nothing. It's a useful picture of what's possible, but it
        doesn't tell us which split our two firms will agree on. They usually
        say that bargaining power decides it, and leave the question there.
      </p>
      <p>
        In this article, we'll give the two firms a simple set of rules for
        making offers and see what those rules do. As we'll see, they pick
        exactly one point on the frontier, and that point is built from how
        impatient each firm is compared with the other. Before we add any rules,
        though, let's check that the frontier on its own really doesn't choose.
        Drag A's share in the chart below and see whether any point stands out.
      </p>
    </section>

    <SplitPicker />

    <section class="body-text">
      <p>
        None of them does. Wherever you put the dot, both firms are better off
        than with no deal, so the picture has no reason to prefer one point to
        another. To get an answer, we need to say how the bargaining actually
        happens.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Taking turns</h3>
      <p>
        Here's a simple version. A makes the first offer, and B either accepts
        it or turns it down and makes a counter-offer one round later. Then it's
        A's turn to accept or counter, and so on. Waiting isn't free, because
        each round of delay makes the deal worth a little less to both firms.
        We'll measure that with a <span class="bold">discount factor</span>, δ,
        which is what the whole pot is worth to a firm if it arrives one round
        late. Finally, let's add a deadline. If there's no deal after T rounds,
        both firms walk away with nothing.
      </p>
      <p>
        We can solve this by starting at the deadline and working backwards,
        which is called <span class="bold">backward induction</span>. In the last
        round, whoever makes the offer can take the whole pot, because the other
        firm gets nothing by saying no. One round earlier, the proposer knows
        that. So they only need to offer the other firm what the whole pot would
        be worth to it a round later, which is δ, and they can keep 1 − δ. If we
        keep stepping back like this, and both firms have the same δ, A's share
        from the opening offer works out to be
      </p>
      {@html finiteEq}
      <p>
        The term {@html signFlip} flips sign every time we add a round, so A's
        share bounces up and down. It's higher when A gets to make the last
        offer and lower when B does. Each extra pair of rounds makes the bounce
        smaller, so the further away the deadline is, the less it matters who
        gets the last word.
      </p>
      <p>
        Our two firms aren't equally patient, so the chart below gives each one
        its own δ and does the backward induction a round at a time. The pink
        dot is A's share with T rounds on the clock. If you drag the horizon T,
        you'll see the dot jump from one side of the dashed line to the other as
        the last word passes between the firms. The dashed line is where the
        shares end up when the deadline is far away and offers come quickly,
        which we'll work out next.
      </p>
      <p>
        The buttons change Δ, the time between offers. You'll notice that the
        shorter the gap, the more rounds it takes for the bounce to die down,
        because each round of waiting costs less.
      </p>
    </section>

    <OfferLab />

    <section class="body-text">
      <h3 class="body-header">So what decides the split?</h3>
      <p>
        Let's take the deadline away altogether, so the bargaining could in
        principle go on forever. With no last round, nobody gets the last word,
        and A's share from the opening offer settles at
      </p>
      {@html rubinsteinEq}
      <p>
        This is the answer Ariel Rubinstein found in 1982. He showed that it's
        the only split that holds up when both firms think ahead like this, and
        it's where the bouncing shares in the chart above were heading.
      </p>
      <p>
        Now let's make the offers come faster and faster. We'll describe each
        firm's impatience as an <span class="bold">impatience rate</span> per
        unit of time, {@html rA} for A and {@html rB} for B. If offers are
        Δ apart, a firm's discount factor for one round is {@html perRound}, so
        the shorter the gap between offers, the less a round of waiting costs. As Δ shrinks towards zero, A's share settles on
      </p>
      {@html limitEq}
      <p>
        Let's look at what's in it. A's share has B's impatience rate on top and
        both rates underneath. So the more impatient B is, the bigger A's share,
        and the more impatient A is, the smaller it gets. Our firms have
        {@html rA} = {R_A} and {@html rB} = {R_B}, which makes B
        {howMuchMore} times as impatient as A, and A ends up with {sharePct}% of
        the pot.
      </p>
      <p>
        Why should B's impatience help A? Because A's offer only has to be good
        enough that B would rather say yes now than wait a round and make a
        counter-offer. The more a round of waiting costs B, the less A needs to
        offer to get that yes. The same logic runs the other way for B's offers
        to A, which is why A's own patience matters too.
      </p>
      <p>
        The first chart below moves one rate at a time while the other stays
        put. The second looks at the difference between A's share with a real
        gap between offers and this limit. That difference is the edge A gets
        from making the first offer, because B has to wait a whole round before
        it can counter.
      </p>
    </section>

    <PatienceFigure />

    <section class="body-text">
      <p>
        On logarithmic scales, the second chart is very nearly a straight line
        with a slope of one. That means A's edge is proportional to Δ, so if we
        halve the time between offers, we halve the edge. Moving first is worth
        something only because offers take time, and the advantage disappears as
        offers speed up.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Two routes to the same split</h3>
      <p>
        So far, we've treated bargaining as a game with turns and deadlines.
        There's an older way in, from John Nash in 1950, that never mentions who
        moves when. Instead, Nash wrote down a few properties that a reasonable
        answer to a bargaining problem should have. He showed that they pick the
        split that makes the product of the two sides' gains as large as
        possible.
      </p>
      <p>
        A widely used version of Nash's solution gives each side a weight. If we
        weight each firm by one over its impatience rate, the split is the one
        that maximises
      </p>
      {@html nashEq}
      <p>
        If we take logs and set the slope to zero, the maximum turns out to be at
        {@html limitInline}, which is exactly the split
        that alternating offers gave us. The table below checks this for a few
        pairs of rates. It puts A's share from alternating offers, with a very
        short gap between offers, beside the split that maximises Nash's product,
        and you'll see the two columns agree.
      </p>
    </section>

    <NashCheck />

    <section class="body-text">
      <p>
        So two quite different ideas arrive at the same point. One is about how
        offers go back and forth, and the other is about what a reasonable split
        should look like. That's why economists often read the weights in Nash's
        formula as each side's <span class="bold">bargaining power</span>, its
        pull on where the split lands. In our model, those weights have a
        concrete meaning: they measure how patient each firm is.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What an outside option is worth</h3>
      <p>
        It seems natural that a better fallback should mean a better deal. If A
        could walk away and get something elsewhere, surely that ought to raise
        A's share? Let's test it. We'll give A an
        <span class="bold">outside option</span>, a payoff that A can take
        instead of carrying on whenever it turns down B's offer. We'll measure
        it as a share of the pot, just like the split.
      </p>
      <p>
        If you drag A's outside option in the chart below, you'll see that the
        blue dot doesn't move at first. As long as the option is worth less than the {sharePct}% A gets from
        bargaining, the split doesn't change at all. That's because A's threat to
        walk away isn't believable. B knows that A would rather take the deal
        than the outside option, so the threat adds nothing to A's share.
      </p>
      <p>
        Once the outside option is worth more than A's share, it starts to
        count. B now has to offer A at least what A could get by walking away,
        so A's payoff rises one for one with the option. In other words, an
        outside option works like a floor rather than a lever. It doesn't help
        until it's higher than the share A would get anyway, and after that,
        every extra point of it goes to A.
      </p>
    </section>

    <OptionLab />

    <section class="body-text">
      <p>
        The small pink dot inside the blue one solves the same bargain round by
        round, with a short but real gap between offers. It lands in almost the
        same place, and the tiny difference between them is A's edge from moving
        first again.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Alternating offers give us a sharp answer, but it comes from a small
        model. Before you lean on it, it's worth knowing which three of its
        assumptions do most of the work.
      </p>
      <p>
        First, the model says that the two sides agree straight away. A's first
        offer is always accepted, so strikes, holdouts and months of haggling
        can't happen here. Models that do produce delay need extra ingredients,
        and they're a topic of their own.
      </p>
      <p>
        Second, the surplus here is money and nothing else, so the frontier is a
        straight line. If the two sides dislike risk, the frontier drawn in terms
        of what each side actually values bends, and our tidy formula for A's
        share no longer holds as it stands.
      </p>
      <p>
        And finally, there are only two firms, and neither has anyone else to
        turn to. If A's outside option is really a deal with a third firm, then
        it comes out of another bargain, and it's no longer a fixed number we
        can slide along an axis.
      </p>
    </section>

    <Conclusion />
    <Resources />
  </main>
</div>

<style>
  .page-wrap {
    min-height: 100vh;
  }
  /* global.css gives .body-text and .body-header 80% each on a phone, so a
     heading inside a section was indented to 64%. Inside a section it should
     line up with the paragraphs. */
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
