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
  import katexify from "./katexify.js";

  const indiffRow = katexify(`-F\\,q + G\\,(1-q) = 0`, true);
  const qStar = katexify(`q^{\\ast} = \\frac{G}{G + F}`, true);
  const indiffCol = katexify(`(V - C)\\,p - C\\,(1-p) = -L\\,p`, true);
  const pStar = katexify(`p^{\\ast} = \\frac{C}{V + L}`, true);
  const both = katexify(`p^{\\ast} = \\frac{C}{V+L}, \\qquad q^{\\ast} = \\frac{G}{G+F}`, true);
  const linear = katexify(`\\frac{1}{q^{\\ast}} = 1 + \\frac{F}{G}`, true);
  const threshold = katexify(`\\bar q > \\frac{G}{G+F} \\quad \\Longleftrightarrow \\quad F > \\frac{G(1-\\bar q)}{\\bar q}`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Imagine a trader on a bank's desk who can either stay inside their position
      limit or quietly breach it. Down the corridor, a risk officer can either
      audit the trader's book or spend the afternoon on something else. When they
      make their decisions, neither of them can see what the other is doing.
    </p>
    <p>
      This is exactly the kind of interaction that game theory was built for, and
      you've almost certainly been shown how to solve it. You draw the payoff
      matrix and go through it cell by cell. For each cell, you ask whether either
      player, knowing what the other just did, would rather have done something
      else. The cells where nobody would want to move are the
      <span class="bold">Nash equilibria</span>. It's a lovely procedure that
      takes about thirty seconds and needs no calculus.
    </p>
    <p>
      So let's try it. The numbers below are in thousands of kroner, with the
      trader's payoff listed first. Click each cell to check it.
    </p>
  </section>

  <CellHunt />

  <section class="body-text">
    <p>
      As you can see, no cell survives. If the risk desk is auditing, the trader
      would rather comply. If the trader is complying, the desk would rather save
      the cost of the audit. If the desk is skipping, the trader would rather
      breach. And if the trader is breaching, the desk would rather audit. So the
      best replies chase each other round the four cells and never land on the
      same one.
    </p>
    <p>
      The natural reaction is to assume this is a trick example, but it isn't. It
      belongs to a category of games that the procedure simply can't handle, and
      most courses don't mention how big that category is.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">How often the procedure comes up empty</h3>
    <p>
      For counting purposes, only the <em>order</em> of each player's payoffs
      matters, because every question the procedure asks is a comparison. This
      means a generic two-by-two game is one of 24 × 24 = 576 equally likely
      orderings, so the answer is an exact fraction rather than a simulation.
    </p>
  </section>

  <CountFigure />

  <section class="body-text">
    <p>
      One game in eight has nothing to find. Three in four have exactly one
      surviving cell, and one in eight have two, which is a problem of its own,
      because a model that offers two answers and no way to choose between them
      hasn't finished predicting. If we give each player more than two actions,
      the empty share climbs towards 1&#8202;/&#8202;<i>e</i>, about 37%, while the average number of
      surviving cells stays pinned at exactly one at every size. That isn't a
      coincidence, and the reason is simple. There are <i>n</i>² cells, and a cell
      needs to be the best in its column for one player and the best in its row
      for the other. Each of those has a chance of 1&#8202;/&#8202;<i>n</i>, so
      multiplying everything together gives exactly one, however big we make the
      game.
    </p>
    <p>
      The marks laid over the bars show a Poisson(1) distribution, and nothing
      about them is fitted to the bars underneath.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What the answer looks like instead</h3>
    <p>
      In a game with no cell to stop at, neither player can afford to be
      predictable, because the other player can exploit anything you do
      reliably. So the equilibrium isn't a cell but a pair of frequencies: how
      often the trader breaches, and how often the desk audits. Game theorists
      call this a <span class="bold">mixed-strategy equilibrium</span>.
    </p>
    <p>
      Exactly one pair of frequencies holds up. If auditing were even slightly
      too rare, breaching would be strictly better, so the trader would breach
      every time, and that would make auditing worth it. So the frequencies have
      to sit precisely where each player has been made <em>indifferent</em>.
      That's the whole derivation, and it's worth noticing how strange it is. Your
      job isn't to do well. It's to leave the other person with nothing to
      prefer.
    </p>
    <p>
      Let's write <i>q</i> for how often the desk audits. If the trader breaches,
      they gain <i>G</i> when nobody looks and pay a fine of <i>F</i> when
      somebody does, while complying is worth zero. So the trader is indifferent
      when
    </p>
    <p class="eq">{@html indiffRow}</p>
    <p>which rearranges to</p>
    <p class="eq">{@html qStar}</p>
    <p>
      Now let's write <i>p</i> for how often the trader breaches. The desk pays
      <i>C</i> to run an audit, gains <i>V</i> when an audit catches something,
      and takes damage <i>L</i> when a breach gets through unseen. For the desk,
      auditing and skipping are worth the same when
    </p>
    <p class="eq">{@html indiffCol}</p>
    <p>which rearranges to</p>
    <p class="eq">{@html pStar}</p>
    <p>
      With the numbers in the matrix above, that gives a breach rate of 15% and an
      audit rate of 30%, and both of those are exact.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Read the two formulas again</h3>
    <p>
      Let's put the two formulas side by side and look at which letters appear in
      which.
    </p>
    <p class="eq">{@html both}</p>
    <p>
      The <em>audit</em> rate, which describes the risk desk's behaviour, is built
      out of <i>G</i> and <i>F</i>, the trader's gain and the trader's fine.
      Meanwhile, the <em>breach</em> rate, which describes the trader's
      behaviour, is built out of <i>C</i>, <i>V</i> and <i>L</i>, the risk desk's
      costs and damages. In other words, neither player's own payoffs appear
      anywhere in their own equilibrium behaviour.
    </p>
    <p>
      This isn't an artefact of the numbers we chose. It falls straight out of
      what the equilibrium condition <em>is</em>. Your mix is the thing that has
      to leave the other player indifferent, so it's determined by the equation
      of their indifference, which is made of their payoffs. Your own payoffs
      have only one job: they pin down the mix the <em>other</em> player has to
      use to keep you willing to mix.
    </p>
    <p>
      This might sound like a piece of algebraic trivia, but it's the reason a
      great deal of enforcement policy doesn't work.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Turn the fine up</h3>
    <p>
      Here's the whole game, live. The top slider sets the fine, which is the
      lever every regulator, every compliance function and every parent reaches
      for first. Drag it as far as you like; its range spans a factor of five
      hundred.
    </p>
  </section>

  <DeterrenceLab />

  <section class="body-text">
    <p>
      The breach rate doesn't move. It doesn't move a little, or slowly, or by an
      amount too small to see on the bar. The equilibrium breach rate at a fine
      of 10,000 is the same floating-point number as the equilibrium breach rate
      at a fine of 20. In the checks behind this page, five hundred thousand
      random redraws of the trader's gain and fine move it by exactly zero.
    </p>
    <p>
      What the fine does move is the audit rate, and it moves it
      <em>down</em>. That's the mechanism, and once you see it, the result stops
      being paradoxical. A harsher fine makes the trader more frightened of an
      audit, so it takes less auditing to keep them honest. The desk, which was
      never auditing out of principle, notices that it can now get the same
      restraint for less, so it audits less. It cuts back exactly far enough to
      put the trader back on the knife-edge, which is to say, exactly far enough
      to restore the original breach rate.
    </p>
    <p>
      The trader's expected payoff doesn't move either. It's zero at every fine,
      because the trader is indifferent and complying is worth zero. Neither does
      the risk desk's, which stays at &minus;4.5 throughout. So the fine changes
      nobody's welfare and nobody's misconduct. The only thing it changes is how
      much monitoring gets bought.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The substitution, drawn</h3>
    <p>
      If we plot one over the audit rate against the fine, we get an exact
      straight line, with an intercept of exactly 1 and a slope of exactly
      1&#8202;/&#8202;<i>G</i>.
    </p>
    <p class="eq">{@html linear}</p>
  </section>

  <ReadoutFigure />

  <section class="body-text">
    <p>
      The left panel shows the claim itself. The right panel is the one with the
      uncomfortable implication. If the relationship between the fine and the
      audit rate is a straight line with slope 1&#8202;/&#8202;<i>G</i>, then
      watching how the monitoring budget responds to penalties tells you
      <i>G</i>. That's the private value of the breach, a number that exists
      only inside the trader's head and appears nowhere in the desk's own
      accounts. So in this model, the watcher's behaviour is a readout of the
      watched person's temptations.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">It isn't a two-by-two curiosity</h3>
    <p>
      At this point, you might reasonably suspect that all of this is an accident
      of a game with two actions and a hand-picked payoff matrix. It isn't, and
      the table below runs the test in your browser while you read. It solves a
      random game, replaces every single one of the row player's payoffs with
      fresh values on a hundred times the scale, solves the game again, and
      measures how far the row player's own mixing frequencies moved.
    </p>
  </section>

  <SizeFigure />

  <section class="body-text">
    <p>
      We had to be careful here, because the obvious way to run this test proves
      nothing. If you compute the row player's mix from the column player's
      matrix and then check that it didn't change when the row player's matrix
      changed, all you've measured is your own code. Instead, the solver above is
      handed both matrices and is free to come back with anything, and the
      exploitability column is there to confirm that the answers really are
      equilibria rather than near-misses.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">When the intuition is right</h3>
    <p>
      Deterrence isn't a foolish idea, and it deserves to be seen at its best. The
      reason it fails above is specific, and it's worth naming: the risk desk is
      a <em>player</em>. It has its own payoffs, it re-optimises when conditions
      change, and its re-optimisation is what eats up the effect of the fine.
    </p>
    <p>
      If we take that away, the intuition isn't merely defensible. It's exactly
      right. Suppose the audit rate isn't chosen by anyone but is fixed at some
      <i>q̄</i>, like a supervisory examination cycle, a sampling rule in a
      procedures manual or a smoke alarm. The trader now faces a known
      probability and simply compares the options: breaching is better when
      <i>G</i>(1 &minus; <i>q̄</i>) &gt; <i>Fq̄</i>. Rearranging that, the
      trader complies when
    </p>
    <p class="eq">{@html threshold}</p>
    <p>
      and now the fine works perfectly. Raise it past that threshold, and
      misconduct doesn't just fall a bit. It stops. Everything the deterrence
      intuition promises is delivered, but only by a monitor who can't respond.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Both at once</h3>
    <p>
      Real institutions sit somewhere between the two. A bank's risk function
      chooses how much to look, but not freely, because a regulator sets a floor
      under it. So let's allow the desk to audit as much as it likes, but never
      less than a mandated minimum <i>q̄</i>, and then sweep the fine again.
    </p>
  </section>

  <FloorLab />

  <section class="body-text">
    <p>
      The picture is a flat line followed by a cliff. While the floor is slack,
      the desk is still choosing and still substituting, so the fine does nothing
      at all. But once the fine is large enough that the desk's own preferred
      audit rate would fall <em>below</em> the floor, the floor starts to bind.
      The desk is then held above the audit rate at which the trader is still
      willing to breach, so misconduct stops outright.
    </p>
    <p>
      The threshold is the same expression as before, and with a 25% floor and
      these payoffs, it's a fine of exactly 180. Below 180, the fine is worth
      nothing, and above it, the fine is worth everything. If you drag the floor
      to zero, the cliff moves off to infinity, which is just the earlier result
      stated as a special case.
    </p>
    <p>
      So the lesson for policy isn't that penalties are useless. It's that
      penalties and monitoring are <em>complements</em>, and that a penalty raised
      without a floor under the monitoring just ends up buying less monitoring.
      That's awkward, because a penalty is cheap to legislate and monitoring is
      expensive to fund, so the instrument that does nothing on its own is
      reliably the easier one to reach for.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">So what does move it?</h3>
    <p>
      If the fine is the wrong lever, something else must be the right one. The
      breach rate is <i>C</i>&#8202;/&#8202;(<i>V</i> + <i>L</i>), so there are
      exactly three levers, and all three belong to the risk desk.
    </p>
  </section>

  <LeverFigure />

  <section class="body-text">
    <p>
      If we make auditing cheaper, misconduct falls in proportion. For example,
      halving the cost of looking halves the breach rate, from 15% to 7.5%.
      Making a catch worth more to the desk, or making a missed breach hurt the
      desk more, lowers it too. Every one of these is a statement about the
      monitor's budget and the monitor's incentives, and not one of them is a
      statement about the punishment.
    </p>
    <p>
      That's the practical content of the inversion, and it's why the inversion
      is more than an algebraic curiosity. If you want less of something in a
      setting like this, you don't change the payoff of the person doing it.
      You change the payoff of the person watching.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      A model this sharp is sharp because of what it leaves out, and the
      omissions here are real ones.
    </p>
    <p>
      First, the model covers a single period. Nobody has a reputation, a career,
      a promotion to lose or a colleague to warn. Yet repetition is exactly the
      setting where fines recover some of their power, because a large penalty
      can support cooperation that a small one can't. Second, it assumes both
      players are risk neutral, which is a poor assumption for a fine large
      enough to end somebody's career, and the risk-averse version does give the
      penalty back some grip. Third, it assumes the trader knows the desk's costs
      and the desk knows the trader's gain. This common-knowledge assumption does
      a great deal of quiet work, and the readout result in the identity figure
      leans on it entirely. Fourth, it treats the risk desk as a single agent
      with one objective, whereas a real one has a budget set elsewhere, a
      headcount, and more to do than this. And finally, it assumes the fine is a
      pure transfer, when in practice a fine large enough to matter also destroys
      value.
    </p>
    <p>
      It's also worth mentioning what the empirical literature on deterrence
      broadly finds, because it's not a bad match. The <em>certainty</em> of
      being caught does more work than the <em>severity</em> of the consequence.
      This model offers one mechanism for why that might be, and it's a
      mechanism that doesn't need anybody to be irrational or to misjudge
      probabilities. All it needs is for the person doing the catching to also
      get to decide how hard to look.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the procedure</h3>
    <p>
      Checking cells isn't wrong, and for three games in four, it gives the whole
      answer. What it hides is that it's a search over a restricted set, namely
      the outcomes where both players are predictable, and that the search comes
      up empty often enough to matter. When it does, the equilibrium is still
      there. It's just a pair of frequencies rather than a cell, and it has a
      property the cell version never shows you: each player's behaviour is
      written in the other player's numbers.
    </p>
    <p>
      That's a reasonable lesson to take away about equilibrium in general. An
      equilibrium is a statement about a <em>system</em>, not a sum of statements
      about the people in it. The tempting move is to work out what each person
      wants and then add it all up, but that's exactly the move the arithmetic
      above refuses.
    </p>
    <p>
      Thanks for reading!
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      The framing of Nash equilibrium as best responses on a payoff matrix, the
      dots-and-circles procedure, and the Pareto criterion are standard and are
      taken from CORE Econ's <i>The Economy 2.0: Microeconomics</i> (2023),
      Unit 4, sections 4.2, 4.3 and 4.5, which is an excellent free introduction,
      and it's where readers of this page most plausibly met the topic. That text
      doesn't cover mixed strategies at all, which is a defensible choice for a
      first course, and it's the gap this article is written into.
    </p>
    <p>
      The trading-desk game, its payoffs, the 576-game enumeration, the
      Poisson(1) picture, the invariance results, the
      1&#8202;/&#8202;<i>q</i>&#8202;=&#8202;1&#8202;+&#8202;<i>F</i>&#8202;/&#8202;<i>G</i>
      identity, the audit-floor model and its threshold are mine. Nash's
      existence theorem is Nash (1950), <i>Equilibrium points in n-person
      games</i>. The observation that the expected number of pure equilibria in a
      random game is one, with a Poisson limit, is a standard result in the
      literature on random games. The certainty-versus-severity finding is a
      long-running theme in the empirical crime literature, and the summary above
      is deliberately a broad one.
    </p>
    <p>
      Every number in this article is re-derived by
      <span class="mono">verify/check-numbers.mjs</span> from the same modules
      the page draws from, and the figures are checked in rendered pixels at
      390px and 1280px.
    </p>
  </section>
</main>

<style>
  main {
    padding-bottom: 4rem;
  }

  .eq {
    margin: 0.6rem 0;
  }

  .mono {
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
</style>
