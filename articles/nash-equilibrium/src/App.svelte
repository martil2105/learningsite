<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import CellHunt from "./Components/CellHunt.svelte";
  import CountFigure from "./Components/CountFigure.svelte";
  import DeterrenceLab from "./Components/DeterrenceLab.svelte";
  import ReadoutFigure from "./Components/ReadoutFigure.svelte";
  import SizeFigure from "./Components/SizeFigure.svelte";
  import FloorLab from "./Components/FloorLab.svelte";
  import LeverFigure from "./Components/LeverFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { BASE, mixed, values } from "./game.js";
  import { enumerateAll } from "./enumerate.js";
  import { FINE_PRESETS } from "./datasets.js";

  const indiffRow = katexify(`-F\\,q + G\\,(1-q) = 0`, true);
  const qStar = katexify(`q^{\\ast} = \\frac{G}{G + F}`, true);
  const indiffCol = katexify(`(V - C)\\,p - C\\,(1-p) = -L\\,p`, true);
  const pStar = katexify(`p^{\\ast} = \\frac{C}{V + L}`, true);
  const both = katexify(`p^{\\ast} = \\frac{C}{V+L}, \\qquad q^{\\ast} = \\frac{G}{G+F}`, true);
  const linear = katexify(`\\frac{1}{q^{\\ast}} = 1 + \\frac{F}{G}`, true);
  const threshold = katexify(`\\bar q > \\frac{G}{G+F} \\quad \\Longleftrightarrow \\quad F > \\frac{G(1-\\bar q)}{\\bar q}`, true);

  // Every figure in a sentence comes from the model the checks re-derive.
  const pct = (v, d = 0) => (100 * v).toFixed(d);
  const all2x2 = enumerateAll();
  const orderings = Math.sqrt(all2x2.games); // a player's four payoffs, in order
  const base = mixed(BASE);
  const deskValue = values(BASE).col.toFixed(1).replace("-", "−");
  const fLow = FINE_PRESETS[0].toLocaleString("en-GB");
  const fHigh = FINE_PRESETS[FINE_PRESETS.length - 1].toLocaleString("en-GB");
  
  const cheaper = mixed({ ...BASE, C: BASE.C / 2 }).p;
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's start on a bank's trading floor, with two people and one decision
        each. Our trader can either stay inside their position limit or quietly
        breach it. Down the corridor, our risk officer can either audit the
        trader's book or spend the afternoon on something else. When they
        decide, neither of them can see what the other is doing.
      </p>
      <p>
        This is the kind of situation game theory was built for, and most of us
        have been shown how to solve it. We draw the payoff matrix and go
        through it one cell at a time. For each cell, we ask whether either
        player, knowing what the other just did, would rather have done
        something else. The cells where nobody wants to move are called the
        <span class="bold">Nash equilibria</span> of the game. It's a tidy
        procedure that takes about thirty seconds and needs no calculus.
      </p>
      <p>
        So let's try it on our game. The payoffs below are in thousands of
        kroner, with the trader's payoff first in each cell. Click each cell to
        check it, and see whether you can find one where nobody wants to move.
      </p>
    </section>

    <CellHunt />

    <section class="body-text">
      <p>
        As you'll have found, no cell survives. If the risk desk audits, the
        trader would rather comply. If the trader complies, the desk would
        rather save the cost of the audit. If the desk skips, the trader would
        rather breach, and if the trader breaches, the desk would rather audit.
        So the best replies chase each other round the four cells and never
        settle.
      </p>
      <p>
        It's natural to suspect that we've picked a trick example, but we
        haven't. Our game belongs to a family that the cell-checking procedure
        can't solve, and most courses don't say how big that family is.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How often the procedure comes up empty</h3>
      <p>
        Let's count. Every question we ask of a cell is a comparison, so only
        the <em>order</em> of each player's payoffs matters. A player's four
        payoffs can be put in order in {orderings} ways, which means a
        two-by-two game with no ties is one of {orderings} × {orderings} =
        {all2x2.games} equally likely orderings. That's few enough for us to
        check every one, so the answer is an exact fraction rather than an
        estimate from a simulation.
      </p>
    </section>

    <CountFigure />

    <section class="body-text">
      <p>
        One game in eight has nothing for us to find. Three in four have a
        single surviving cell, and one in eight have two. Two isn't a clean
        answer either, because a model that offers two outcomes and no way to
        choose between them hasn't finished its prediction.
      </p>
      <p>
        If you click through the bigger games, you'll see the empty bar grow,
        and the bars settle onto the dark marks of a Poisson(1) distribution. As
        the game grows, the share with no surviving cell climbs towards
        1 / <i>e</i>, about {pct(Math.exp(-1))}%. The average number of
        surviving cells, though, stays at one for every size, and there's a short
        reason for that. With <i>n</i> actions each, there are <i>n</i>² cells,
        and a cell survives when it's the best in its column for one player and
        the best in its row for the other. Each of those has a chance of
        1 / <i>n</i>, so on average we expect
        <i>n</i>² × 1 / <i>n</i> × 1 / <i>n</i> surviving cells. That's
        exactly one, however big we make the game.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the answer looks like instead</h3>
      <p>
        So what does an equilibrium look like when there's no cell to stop at?
        Neither player can afford to be predictable, because the other can
        exploit anything they do reliably. So the equilibrium isn't a cell but a
        pair of frequencies: how often our trader breaches, and how often our
        risk desk audits. This is called a
        <span class="bold">mixed-strategy equilibrium</span>, because each player
        mixes their two actions at random in fixed proportions.
      </p>
      <p>
        Only one pair of frequencies holds up. Suppose auditing were even
        slightly too rare. Then breaching would be strictly better, so the trader
        would breach every time, and that would make auditing worth it after
        all. So the frequencies have to sit precisely where each player is
        <em>indifferent</em> between their two actions. That's the whole
        derivation, and it's worth noticing how odd it is. Nobody mixes in order
        to do well for themselves. Each player's mix is there to leave the other
        player with nothing to prefer.
      </p>
      <p>
        Let's write <i>q</i> for how often the desk audits. If the trader
        breaches, they gain <i>G</i> when nobody looks and pay a fine of
        <i>F</i> when somebody does, while complying is worth zero. So the
        trader is indifferent when
      </p>
      {@html indiffRow}
      <p>which rearranges to</p>
      {@html qStar}
      <p>
        Now let's write <i>p</i> for how often the trader breaches. The desk
        pays <i>C</i> to run an audit, gains <i>V</i> when an audit catches
        something and loses <i>L</i> when a breach gets through unseen. For the
        desk, auditing and skipping are worth the same when
      </p>
      {@html indiffCol}
      <p>which rearranges to</p>
      {@html pStar}
      <p>
        With the payoffs in our matrix, that gives a breach rate of
        {pct(base.p)}% and an audit rate of {pct(base.q)}%, and neither of those
        is rounded.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Read the two formulas again</h3>
      <p>
        Now let's put our two formulas side by side and look at which letters
        appear in which.
      </p>
      {@html both}
      <p>
        The <em>audit</em> rate describes what the risk desk does, but it's
        built out of <i>G</i> and <i>F</i>, the trader's gain and the trader's
        fine. The <em>breach</em> rate describes what the trader does, but it's
        built out of <i>C</i>, <i>V</i> and <i>L</i>, the risk desk's cost of
        looking, its gain from a catch and its damage from a miss. In other
        words, neither player's own payoffs appear anywhere in their own
        equilibrium behaviour.
      </p>
      <p>
        This isn't a quirk of the numbers we chose. It follows from what the
        equilibrium condition <em>is</em>. Each player's mix has to leave the
        other player indifferent, so it's set by the other player's
        indifference condition, and that condition is made of the other
        player's payoffs. Our own payoffs still matter, but only in one way:
        they pin down the mix the <em>other</em> player has to use to keep
        <em>us</em> willing to mix.
      </p>
      <p>
        That might sound like a piece of algebraic trivia, but as we're about to
        see, it's why raising a penalty can leave misconduct untouched.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Turn the fine up</h3>
      <p>
        Here's our whole game, live. The first slider sets the fine, which is
        the lever that regulators, compliance teams and parents tend to reach
        for first. Drag it as far as you like, anywhere from {fLow} to {fHigh},
        and keep an eye on the breach rate. We'll come back to the second
        slider, the cost of an audit, a little later.
      </p>
    </section>

    <DeterrenceLab />

    <section class="body-text">
      <p>
        However far you drag the fine, the breach rate doesn't move. It doesn't move a little, or slowly, or by
        too little to see on the bar. At a fine of {fHigh}, it's exactly the
        same number as at a fine of {fLow}. In fact, we could try any values we
        like for the trader's gain and the fine, and the breach rate would stay
        where it is, because neither of them appears in its formula.
      </p>
      <p>
        What the fine does move, as you can see on the second bar, is the audit
        rate, and it moves it <em>down</em>. That's the mechanism, and once we see it, the result
        stops looking like a paradox. A harsher fine makes the trader more
        afraid of an audit, so it takes less auditing to keep them honest. The
        desk was never auditing out of principle, so when it can get the same
        restraint for less, it audits less. It cuts back exactly far enough to
        put the trader back on the knife-edge, where breaching and complying are
        worth the same. And once the trader is there, the only breach rate that
        leaves the desk indifferent about auditing is the one we started with.
      </p>
      <p>
        The trader's expected payoff doesn't move either. It's zero at every
        fine, because the trader is indifferent and complying is worth zero.
        The risk desk's stays at {deskValue} at every fine, too. So the fine
        changes nobody's payoff and nobody's misconduct. The only thing it
        changes is how much monitoring gets bought.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The substitution, drawn</h3>
      <p>
        Let's draw that substitution. If we plot one over the audit rate against
        the fine, we get a straight line with an intercept of 1 and a slope of
        1 / <i>G</i>. It's exact, not an approximation:
      </p>
      {@html linear}
    </section>

    <ReadoutFigure />

    <section class="body-text">
      <p>
        The flat line in the first chart is the result we've already met, so
        let's look at the second, because it has an uncomfortable implication.
        Its slope is
        1 / <i>G</i>, so if you watch how the audit rate responds to
        the fine, you can invert that slope and get <i>G</i> back, which with
        our payoffs is {BASE.G}. That's the trader's private gain from a
        breach. It exists only inside the trader's head and appears nowhere in
        the desk's own accounts. So in this model, the watcher's behaviour is a
        readout of the watched person's temptation.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">It isn't a two-by-two curiosity</h3>
      <p>
        At this point, you might reasonably suspect that all of this is an
        accident of a game with two actions and a payoff matrix we picked by
        hand. So let's test it on bigger games. The table below runs in your
        browser as the page loads. For each size, we solve a random game and then
        replace every payoff of the row player, the role our trader plays in our
        matrix, with new ones on a hundred times the scale. Then we solve the game again and measure how far the
        row player's own mix moved.
      </p>
    </section>

    <SizeFigure />

    <section class="body-text">
      <p>
        We had to be careful with this test, because the obvious version of it
        proves nothing. If we worked out the row player's mix from the column
        player's payoffs alone, we'd only be measuring our own code. So our
        solver is handed both players' payoffs and is free to come back with
        anything.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When the intuition is right</h3>
      <p>
        Deterrence isn't a foolish idea, and it deserves to be seen at its best.
        It fails in our game for a specific reason: the risk desk is a
        <em>player</em>. It has its own payoffs, it re-optimises when conditions
        change, and that re-optimising is what eats up the effect of the fine.
      </p>
      <p>
        If we take that away, the intuition turns out to be completely right.
        Suppose nobody chooses the audit rate, and it's fixed at some <i>q̄</i>
        instead, like a supervisory examination cycle, a sampling rule in a
        procedures manual or a smoke alarm. Our trader now faces a known chance
        of an audit and simply compares the two options. Breaching is better
        when <i>G</i>(1 &minus; <i>q̄</i>) &gt; <i>Fq̄</i>, so the trader
        complies when
      </p>
      {@html threshold}
      <p>
        and now the fine does what we'd hope. If we raise it past that
        threshold, misconduct doesn't just fall a bit. It stops. Everything the
        deterrence intuition promises is delivered, but only by a monitor who
        can't respond.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Both at once</h3>
      <p>
        Real institutions sit somewhere between these two cases. A bank's risk
        function chooses how much to look, but not freely, because a regulator
        sets a floor under it. So let's allow our desk to audit as much as it
        likes, but never less than a required minimum <i>q̄</i>, and sweep the
        fine again. Drag the floor below, or pick one of the presets, and watch
        where the line drops.
      </p>
    </section>

    <FloorLab />

    <section class="body-text">
      <p>
        The picture is a flat line followed by a cliff. While the floor is
        slack, the desk is still choosing and still substituting, so the fine
        does nothing at all. But once the fine is big enough that the desk's own
        preferred audit rate would fall <em>below</em> the floor, the floor
        starts to bind. The desk is then held above the audit rate at which the
        trader is still willing to breach, so the breaching stops outright.
      </p>
      <p>
        The cliff sits at the same threshold we found for the fixed monitor, and
        the dashed line marks it. If you drag the floor down to zero, the cliff moves off to infinity, and
        we're back to our earlier result as a special case.
      </p>
      <p>
        So the lesson for policy isn't that penalties are useless. It's that
        penalties and monitoring are <span class="bold">complements</span>,
        meaning each needs the other to work, and a penalty raised without a
        floor under the monitoring just ends up buying less monitoring. That's
        awkward, because a penalty is cheap to legislate and monitoring is
        expensive to fund, so the lever that does nothing on its own tends to be
        the easier one to reach for.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">So what does move it?</h3>
      <p>
        If the fine is the wrong lever, what's the right one? Our breach rate is
        <i>C</i> / (<i>V</i> + <i>L</i>), so there are three levers,
        and all three belong to the risk desk. Pick a lever below, and you'll see
        how far each one moves the breach rate compared with the fine.
      </p>
    </section>

    <LeverFigure />

    <section class="body-text">
      <p>
        If we make auditing cheaper, misconduct falls in proportion, so halving
        the cost of an audit halves the breach rate, from {pct(base.p)}% to
        {pct(cheaper, 1)}%. Making a catch worth more to the desk, or making a
        missed breach hurt the desk more, lowers it too. Every one of these
        changes the monitor's budget or the monitor's incentives, and none of
        them touches the punishment.
      </p>
      <p>
        That's the practical side of our two odd-looking formulas. If we want
        less of something in a setting like this, the payoff to change isn't
        that of the person doing it. It's the payoff of the person watching.
      </p>
      <p>
        It's also a reasonable match for what the empirical literature on
        deterrence broadly finds, which is that the <em>certainty</em> of being
        caught does more work than the <em>severity</em> of the punishment. Our
        model offers one mechanism for why that might be, and it doesn't need
        anybody to be irrational or to misjudge probabilities. All it needs is
        for the person doing the catching to also decide how hard to look.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our model gets its sharp answer by leaving things out, and five of the
        things it leaves out matter here.
      </p>
      <p>
        First, it covers a single period, so nobody has a reputation, a career
        or a promotion to lose, or a colleague to warn. Repeated play is where
        fines recover some of their power, because a large penalty can support
        cooperation that a small one can't.
      </p>
      <p>
        Second, it assumes both players are risk neutral. That's a poor
        assumption for a fine big enough to end somebody's career, and a
        risk-averse version of the model does give the penalty back some grip.
      </p>
      <p>
        Third, it assumes the trader knows the desk's costs and the desk knows
        the trader's gain. This common-knowledge assumption does a lot of quiet
        work, and reading the trader's gain off the audit rate depends on it
        entirely.
      </p>
      <p>
        Fourth, it treats the risk desk as a single agent with one objective. A
        real one has a budget set elsewhere, a headcount and more to do than
        watch one trader.
      </p>
      <p>
        And finally, it treats the fine as a pure transfer, money that simply
        changes hands, when in practice a fine large enough to matter also uses
        up some value along the way.
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
  /* cost-curves' container, without its side padding: this article's figures
     carry their own 1rem gutter, and a second one would take 32px off every
     chart on a phone. */
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 0 4rem 0;
  }
</style>
