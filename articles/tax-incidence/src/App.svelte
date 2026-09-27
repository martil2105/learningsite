<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import WedgeLab from "./Components/WedgeLab.svelte";
  import DriftFigure from "./Components/DriftFigure.svelte";
  import LafferFigure from "./Components/LafferFigure.svelte";
  import katexify from "./katexify.js";

  const wedgeEq = katexify(`p_c - p_p = t, \\qquad q = A - B\\,p_c = C + S\\,p_p`, true);
  const shareEq = katexify(`\\text{consumer share} = \\frac{S}{B + S}`, true);
  const dwlEq = katexify(`\\text{DWL} = \\tfrac{1}{2}\\,t^2\\,\\frac{B\\,S}{B + S}`, true);
  const peakEq = katexify(`t^* = \\frac{q_0\\,(B + S)}{2\\,B\\,S}`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Let's say a government wants to raise a pound on every unit sold in some
      market. It has a practical choice to make: it can collect the money from
      sellers as they ship, or from buyers as they buy. The two options mean
      different paperwork, and most of us would expect them to mean different
      prices as well. As we'll see, in the simplest market they don't.
    </p>
    <p>
      We'll use a market with straight-line demand and supply and a tax of t on
      every unit sold. The tax opens a gap, called a
      <span class="bold">wedge</span>, between the price buyers pay,
      p<sub>c</sub>, and the price sellers keep, p<sub>p</sub>:
    </p>
    <p class="eq">{@html wedgeEq}</p>
    <p>
      Here A and B describe demand, and C and S describe supply. Without a tax,
      buyers in our market pay 20 for each of 60 units. It's worth keeping that
      pair in mind, because the tax is going to move both of them. Drag the tax
      in the chart below, and then flip the toggle between taxing sellers and
      taxing buyers.
    </p>
  </section>

  <WedgeLab />

  <section class="body-text">
    <h3 class="body-header">Who hands over the money doesn't matter</h3>
    <p>
      When you flip the toggle, a different curve moves and the diagram looks
      different, but every number stays where it was. Buyers pay the same,
      sellers keep the same, and the same number of trades happen. That's
      because the law only decides who hands the money over. What sets the
      prices is the size of the wedge, and that's t either way.
    </p>
    <p>
      The law doesn't decide who bears the burden either. With our slopes,
      buyers bear 40% of the tax and sellers bear 60%, at every rate the slider
      reaches. In a straight-line market, the buyers' share is
    </p>
    <p class="eq">{@html shareEq}</p>
    <p>
      In other words, the side whose curve is flatter, which is the side that
      can more easily walk away, bears less of the tax. If one side can't
      respond at all, it bears the whole tax. This is what economists call
      <span class="bold">tax incidence</span>: who really pays, as opposed to
      who hands over the money.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">An exact rule, but only for straight lines</h3>
    <p>
      First courses usually give this rule in terms of elasticities. Buyers
      bear ε<sub>s</sub>/(ε<sub>s</sub> + ε<sub>d</sub>) of the tax, where
      ε<sub>s</sub> and ε<sub>d</sub> are the price elasticities of supply and
      demand. In a straight-line market, our share S/(B + S) is exact at every
      rate. In any other market, though, the elasticity rule is a
      <span class="bold">first-order approximation</span>, which means it's
      right for a very small tax and drifts away from the truth as the tax
      grows.
    </p>
    <p>
      Let's see how far it drifts. The chart below uses a market in which both
      curves have a constant elasticity. The dotted line is what the
      elasticity rule says, and the dots are the true share, which we get by
      solving for the two prices that open a wedge of t.
    </p>
  </section>

  <DriftFigure />

  <section class="body-text">
    <p>
      In this market the true share only grows as the rate rises, so the rule
      errs in one direction rather than at random. For small taxes it's very
      close: with a tax of 0.1% of the price, it's within a tenth of a
      percentage point. So the rule is a good guide to small taxes and a
      rougher one to large ones.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The rate that raises the most</h3>
    <p>
      Now let's look at how much money the tax raises. A zero rate raises
      nothing, and so does a rate high enough to stop all trade, so there's a
      peak somewhere in between. In a straight-line market, revenue against the
      rate is a parabola, and its peak is at
    </p>
    <p class="eq">{@html peakEq}</p>
    <p>
      where q<sub>0</sub> is the quantity traded without the tax. Two things
      happen at that rate. The quantity traded is half of what it was, so half
      the trades that would have happened don't. And the
      <span class="bold">deadweight loss</span>, which is the surplus lost on
      those missing trades, is half of the revenue the tax collects. Neither
      half depends on the slopes. If you switch between the markets in the
      chart below, you'll see both readouts stay at 50.0%.
    </p>
  </section>

  <LafferFigure />

  <section class="body-text">
    <p>
      This tells us that a large tax is an expensive way to raise money. The
      deadweight loss is
    </p>
    <p class="eq">{@html dwlEq}</p>
    <p>
      so it grows with the square of the rate, and doubling the rate
      quadruples the loss. At the peak, every pound the tax raises costs buyers
      and sellers another fifty pence in lost surplus.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      Our market is simple on purpose, and three of its simplifications matter
      here.
    </p>
    <p>
      First, we've assumed that buyers and sellers respond to the prices they
      face, whoever pays the tax. In practice, people respond more to taxes
      they can see, so where a tax is shown can change behaviour as well as
      paperwork.
    </p>
    <p>
      Second, our market is competitive. When a seller has some power over its
      price, incidence becomes a question of
      <span class="bold">pass-through</span>, how much of a cost change
      reaches the price, and pass-through can be more than 100%. The article on
      <a href="../markup-and-elasticity/">markup and elasticity</a> looks at
      that.
    </p>
    <p>
      And finally, how easily each side can walk away depends on the time
      horizon. A side that can't respond this year may respond a great deal
      over a decade, so the short-run incidence of a tax isn't its long-run
      incidence.
    </p>
  </section>

  <section class="body-text" id="conclusion">
    <h3 class="body-header">Where this leaves the tax</h3>
    <p>
      Who hands over the money doesn't change who pays. In a competitive
      market, the burden goes to whichever side finds it harder to walk away,
      and in a straight-line market the buyers' share is S/(B + S) at any
      rate. In other markets, the familiar elasticity rule is right for small
      taxes and drifts as they grow.
    </p>
    <p>
      And at the rate that raises the most money, half the trades are gone and
      the lost surplus is half the revenue, whatever the slopes. So the top of
      the revenue curve is an expensive place for a tax to be.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <ul class="resources-list">
      <li>
        CORE Econ (2023), <em>The Economy 2.0: Microeconomics</em>, Unit 8. A
        free introduction to competitive markets, taxes and who bears them.
      </li>
      <li>
        Harberger, A. C. (1964), "The Measurement of Waste",
        <em>The American Economic Review</em>, 54(3), 58–76. How to measure the
        deadweight loss of a tax.
      </li>
      <li>
        Chetty, R., Looney, A., and Kroft, K. (2009), "Salience and Taxation:
        Theory and Evidence", <em>The American Economic Review</em>, 99(4),
        1145–1177. Evidence that people respond more to taxes they can see.
      </li>
      <li>
        Weyl, E. G., and Fabinger, M. (2013), "Pass-Through as an Economic Tool:
        Principles of Incidence under Imperfect Competition",
        <em>Journal of Political Economy</em>, 121(3), 528–583. Incidence when
        firms have market power.
      </li>
    </ul>
    <p>
      The markets, the worked examples and every number on this page are ours.
      The page is built on the scaffold and design system of Amazon's
      MLU-Explain, used under CC BY-SA 4.0.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
  /* global.css gives .body-text and .body-header 80% each on a phone, so a
     heading inside a section was indented to 64%. Inside a section it should
     line up with the paragraphs. */
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  .resources-list {
    padding-left: 1.1rem;
    margin: 0 0 1.2rem 0;
  }
  .resources-list li {
    font-size: 0.95rem;
    line-height: 1.55;
    margin-bottom: 0.6rem;
  }
  #resources {
    margin-bottom: 4rem;
  }
</style>