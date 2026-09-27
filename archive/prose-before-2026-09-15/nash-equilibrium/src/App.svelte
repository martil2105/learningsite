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
      A trader on a bank's desk can stay inside their position limit or quietly
      breach it. A risk officer down the corridor can audit the book or spend the
      afternoon on something else. Neither can see what the other is doing when
      they decide.
    </p>
    <p>
      This is the shape of interaction game theory was built for, and you have
      almost certainly been shown how to solve it. You draw the payoff matrix,
      you go cell by cell, and for each one you ask whether either player —
      knowing what the other just did — would rather have done something else.
      The cells where nobody would move are the Nash equilibria. It is a lovely
      procedure. It takes about thirty seconds and it needs no calculus.
    </p>
    <p>
      So do it. The numbers below are in thousands of kroner, the trader's payoff
      first.
    </p>
  </section>

  <CellHunt />

  <section class="body-text">
    <p>
      Nothing survives. If the risk desk is auditing, the trader would rather
      comply; if the trader is complying, the desk would rather save the cost of
      the audit; if the desk is skipping, the trader would rather breach; and if
      the trader is breaching, the desk would rather audit. The best replies
      chase each other round the four cells and never land on the same one.
    </p>
    <p>
      The natural reaction is that this is a trick example. It is not. It is a
      game in a category that the procedure simply cannot handle, and the size of
      that category is not something most courses mention.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">How often the procedure comes up empty</h3>
    <p>
      For counting purposes only the <em>order</em> of each player's payoffs
      matters, because every question the procedure asks is a comparison. That
      makes a generic two-by-two game one of 24 × 24 = 576 equally likely
      orderings, and the answer an exact fraction rather than a simulation.
    </p>
  </section>

  <CountFigure />

  <section class="body-text">
    <p>
      One game in eight has nothing to find. Three in four have exactly one, and
      one in eight have two — which is its own problem, because a model that
      offers two answers and no way to choose between them has not finished
      predicting. Push the game past two actions each and the empty share climbs
      towards 1&#8202;/&#8202;<i>e</i>, about 37%, while the average number of
      surviving cells stays pinned at exactly one at every size. That is not a
      coincidence worth hiding: there are <i>n</i>² cells, a cell needs to be the
      best in its column for one player and the best in its row for the other,
      each has chance 1&#8202;/&#8202;<i>n</i>, and the product is one however
      big you make it.
    </p>
    <p>
      The marks laid over the bars are Poisson(1). Nothing is fitted to the bars
      underneath them.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What the answer looks like instead</h3>
    <p>
      In a game with no cell to stop at, neither player can afford to be
      predictable — anything you do reliably, the other can exploit. So the
      equilibrium is not a cell but a pair of frequencies: how often the trader
      breaches, and how often the desk audits.
    </p>
    <p>
      There is exactly one pair that holds. If auditing were even slightly too
      rare, breaching would be strictly better and the trader would breach every
      time, which would make auditing worth it — so the frequencies have to sit
      precisely where each player has been made <em>indifferent</em>. That is the
      whole derivation, and it is worth noticing how strange it is: your job is
      not to do well, it is to leave the other person with nothing to prefer.
    </p>
    <p>
      Write <i>q</i> for how often the desk audits. The trader breaches for a
      gain of <i>G</i> when nobody looks and pays a fine of <i>F</i> when
      somebody does, and complying is worth zero, so the trader is indifferent
      when
    </p>
    <p class="eq">{@html indiffRow}</p>
    <p>which rearranges to</p>
    <p class="eq">{@html qStar}</p>
    <p>
      Now write <i>p</i> for how often the trader breaches. The desk pays
      <i>C</i> to run an audit, is worth <i>V</i> to itself when it catches
      something, and takes damage <i>L</i> when a breach gets through unseen.
      Auditing and skipping are worth the same when
    </p>
    <p class="eq">{@html indiffCol}</p>
    <p>which rearranges to</p>
    <p class="eq">{@html pStar}</p>
    <p>
      At the numbers in the matrix above that is a breach rate of 15% and an
      audit rate of 30%. Both are exact.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Read the two formulas again</h3>
    <p>
      Put them side by side and look at which letters are in which.
    </p>
    <p class="eq">{@html both}</p>
    <p>
      The <em>audit</em> rate — the risk desk's behaviour — is built out of
      <i>G</i> and <i>F</i>, which are the trader's gain and the trader's fine.
      The <em>breach</em> rate — the trader's behaviour — is built out of
      <i>C</i>, <i>V</i> and <i>L</i>, which are the risk desk's costs and
      damages. Neither player's own payoffs appear anywhere in their own
      equilibrium behaviour.
    </p>
    <p>
      This is not an artefact of the numbers chosen. It falls straight out of
      what the equilibrium condition <em>is</em>: your mix is the thing that has
      to leave the other player indifferent, so it is determined by the equation
      of their indifference, which is made of their payoffs. Your own payoffs
      have only one job, which is to determine what makes <em>them</em> willing
      to mix.
    </p>
    <p>
      It sounds like a piece of algebraic trivia. It is the reason a great deal
      of enforcement policy does not work.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Turn the fine up</h3>
    <p>
      Here is the whole game, live. The top slider is the fine — the lever every
      regulator, every compliance function and every parent reaches for first.
      Drag it as far as you like. It moves through a factor of five hundred.
    </p>
  </section>

  <DeterrenceLab />

  <section class="body-text">
    <p>
      The breach rate does not move. Not a little, not slowly, not by an amount
      too small to see on the bar: the equilibrium breach rate at a fine of
      10,000 is the same floating-point number as the equilibrium breach rate at
      a fine of 20. Five hundred thousand random redraws of the trader's gain and
      fine, in the checks behind this page, move it by exactly zero.
    </p>
    <p>
      What the fine does move is the audit rate, and it moves it
      <em>down</em>. That is the mechanism, and once you see it the result stops
      being paradoxical. A harsher fine makes the trader more frightened of an
      audit, so it takes less auditing to keep them honest. The desk, which was
      never auditing out of principle, notices that it can now get the same
      restraint for less and audits less. It cuts back exactly far enough to put
      the trader back on the knife-edge — which is to say, exactly far enough to
      restore the original breach rate.
    </p>
    <p>
      The trader's expected payoff does not move either. It is zero at every
      fine, because the trader is indifferent and complying is worth zero. Nor
      does the risk desk's, which sits at &minus;4.5 throughout. The fine changes
      nobody's welfare and nobody's misconduct. It changes only how much
      monitoring gets bought.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The substitution, drawn</h3>
    <p>
      One over the audit rate is exactly linear in the fine — intercept exactly
      1, slope exactly 1&#8202;/&#8202;<i>G</i>.
    </p>
    <p class="eq">{@html linear}</p>
  </section>

  <ReadoutFigure />

  <section class="body-text">
    <p>
      The left panel is the claim. The right panel is the one with the
      uncomfortable implication: if the relationship between the fine and the
      audit rate is a straight line with slope 1&#8202;/&#8202;<i>G</i>, then
      watching how the monitoring budget responds to penalties tells you
      <i>G</i> — the private value of the breach, a number that exists only
      inside the trader's head and appears in none of the desk's own accounts.
      In this model the watcher's behaviour is a readout of the watched
      person's temptations.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">It is not a two-by-two curiosity</h3>
    <p>
      A reasonable suspicion at this point is that all of this is an accident of
      a game with two actions and a hand-picked payoff matrix. It is not, and
      the table below runs the test in your browser while you read it: solve a
      random game, replace every single one of the row player's payoffs with
      fresh values on a hundred times the scale, solve it again, and measure how
      far the row player's own mixing frequencies moved.
    </p>
  </section>

  <SizeFigure />

  <section class="body-text">
    <p>
      It was worth being careful here, because the obvious way to run this test
      proves nothing. If you compute the row player's mix from the column
      player's matrix and then check that it did not change when the row player's
      matrix changed, you have measured your own code. The solver above is handed
      both matrices and is free to come back with anything; the exploitability
      column is there to confirm the answers really are equilibria rather than
      near-misses.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">When the intuition is right</h3>
    <p>
      Deterrence is not a foolish idea, and it deserves its best case. The reason
      it fails above is specific and it is worth naming: the risk desk is a
      <em>player</em>. It has its own payoffs, it re-optimises when conditions
      change, and its re-optimisation is what eats the fine.
    </p>
    <p>
      Take that away and the intuition is not merely defensible, it is exactly
      right. Suppose the audit rate is not chosen by anyone but fixed at some
      <i>q̄</i> — a supervisory examination cycle, a sampling rule in a
      procedures manual, a smoke alarm. The trader now faces a known probability
      and simply compares: breach is better when
      <i>G</i>(1 &minus; <i>q̄</i>) &gt; <i>Fq̄</i>. Rearranged, the trader
      complies when
    </p>
    <p class="eq">{@html threshold}</p>
    <p>
      and now the fine works perfectly. Raise it past that threshold and
      misconduct does not fall a bit, it stops. Everything the deterrence
      intuition promises is delivered — by a monitor who cannot respond.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Both at once</h3>
    <p>
      Real institutions sit between the two. A bank's risk function chooses how
      much to look, but not freely: a regulator sets a floor under it. So let the
      desk audit as much as it likes, but never less than a mandated minimum
      <i>q̄</i>, and sweep the fine again.
    </p>
  </section>

  <FloorLab />

  <section class="body-text">
    <p>
      The picture is a flat line and then a cliff. While the floor is slack the
      desk is still choosing, still substituting, and the fine does nothing at
      all. Once the fine is large enough that the desk's own preferred audit rate
      would fall <em>below</em> the floor, the floor starts binding, the desk is
      held above what the trader will tolerate, and misconduct stops outright.
    </p>
    <p>
      The threshold is the same expression as before, and at a 25% floor with
      these payoffs it is a fine of exactly 180. Below 180 the fine is worth
      nothing; above it the fine is worth everything. Drag the floor to zero and
      the cliff goes to infinity — which is the earlier result, stated as a
      special case.
    </p>
    <p>
      The policy reading is not that penalties are useless. It is that penalties
      and monitoring are <em>complements</em>, and that a penalty raised without
      a floor under the monitoring is spent buying less monitoring. Which is
      awkward, because a penalty is cheap to legislate and monitoring is
      expensive to fund, so the instrument that does nothing on its own is
      reliably the one that is easier to reach for.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What does move it</h3>
    <p>
      If the fine is the wrong lever, something else must be the right one. The
      breach rate is <i>C</i>&#8202;/&#8202;(<i>V</i> + <i>L</i>), so there are
      exactly three, and all three belong to the risk desk.
    </p>
  </section>

  <LeverFigure />

  <section class="body-text">
    <p>
      Make auditing cheaper and misconduct falls in proportion: halve the cost of
      looking and the breach rate halves, from 15% to 7.5%. Make catching
      somebody worth more to the desk, or make a missed breach hurt the desk
      more, and it falls too. Every one of these is a statement about the
      monitor's budget and the monitor's incentives, and not one of them is a
      statement about the punishment.
    </p>
    <p>
      That is the practical content of the inversion, and it is why it is worth
      more than an algebraic curiosity. If you want less of something in a
      setting like this, you do not change the payoff of the person doing it.
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
      It is one period. Nobody has a reputation, a career, a promotion to lose or
      a colleague to warn, and repetition is exactly the setting where fines
      recover some of their power, because a large penalty can support
      cooperation that a small one cannot. It assumes both players are risk
      neutral, which for a fine large enough to end somebody's career is a poor
      assumption, and the risk-averse version does give the penalty back some
      grip. It assumes the trader knows the desk's costs and the desk knows the
      trader's gain, which is the common-knowledge assumption doing a great deal
      of quiet work — in particular, the readout result in the identity figure
      leans on it entirely. It treats the risk desk as a single agent with one
      objective, where a real one has a budget set elsewhere, a headcount, and
      more to do than this. And it assumes the fine is a pure transfer, when in
      practice a fine large enough to matter also destroys value.
    </p>
    <p>
      It is also worth saying what the empirical literature on deterrence broadly
      finds, because it is not a bad match: the <em>certainty</em> of being
      caught does more work than the <em>severity</em> of the consequence. This
      model gives one mechanism for why that might be, and it is a mechanism that
      requires nobody to be irrational or to misjudge probabilities. It requires
      only that the person doing the catching also gets to decide how hard to
      look.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the procedure</h3>
    <p>
      Checking cells is not wrong, and for three games in four it is the whole
      answer. What it hides is that it is a search over a restricted set — the
      outcomes where both players are predictable — and that the search comes up
      empty often enough to matter. When it does, the equilibrium is still there;
      it is a pair of frequencies rather than a cell, and it has a property the
      cell version never shows you, which is that each player's behaviour is
      written in the other player's numbers.
    </p>
    <p>
      Which is a reasonable thing to carry out of an equilibrium concept in
      general. An equilibrium is a statement about a <em>system</em>, not a sum
      of statements about the people in it, and the tempting move — work out what
      each person wants, then add it up — is exactly the one the arithmetic above
      refuses.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      The framing of Nash equilibrium as best responses on a payoff matrix, the
      dots-and-circles procedure, and the Pareto criterion are standard and are
      taken from CORE Econ's <i>The Economy 2.0: Microeconomics</i> (2023),
      Unit 4, sections 4.2, 4.3 and 4.5, which is an excellent free introduction
      and is where the reader of this page most plausibly met the topic. That
      text does not cover mixed strategies at all, which is a defensible choice
      for a first course and is the gap this article is written into.
    </p>
    <p>
      The trading-desk game, its payoffs, the 576-game enumeration, the
      Poisson(1) picture, the invariance results, the
      1&#8202;/&#8202;<i>q</i>&#8202;=&#8202;1&#8202;+&#8202;<i>F</i>&#8202;/&#8202;<i>G</i>
      identity, the audit-floor model and its threshold are mine. Nash's
      existence theorem is Nash (1950), <i>Equilibrium points in n-person
      games</i>; the observation that the expected number of pure equilibria in a
      random game is one, with a Poisson limit, is a standard result in the
      literature on random games. The certainty-versus-severity finding is a
      long-running theme in the empirical crime literature and the summary above
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
