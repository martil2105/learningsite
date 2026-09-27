<script>
  /*
    App.svelte for supply-and-demand
  */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import TwoCurves from "./Components/TwoCurves.svelte";
  import TheQuestion from "./Components/TheQuestion.svelte";
  import CloudLab from "./Components/CloudLab.svelte";
  import MixFigure from "./Components/MixFigure.svelte";
  import R2Figure from "./Components/R2Figure.svelte";
  import BracketFigure from "./Components/BracketFigure.svelte";
  import ShifterFigure from "./Components/ShifterFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";

  const demandEq = katexify(`\\text{demand: } q = 120 - 3p + u, \\quad u \\sim \\mathcal{N}(0, \\tau_d^2)`, true);
  const supplyEq = katexify(`\\text{supply: } q = 20 + 2p + v, \\quad v \\sim \\mathcal{N}(0, \\tau_s^2)`, true);
  const bracketEq = katexify(`\\frac{B_{\\text{hi}}}{B_{\\text{lo}}} = \\frac{-\\text{Var}(q)/\\text{Cov}(p,q)}{-\\text{Cov}(p,q)/\\text{Var}(p)} = \\frac{\\text{Var}(p)\\,\\text{Var}(q)}{\\text{Cov}(p,q)^2} = \\frac{1}{R^2}`, true);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's start with the most familiar picture in economics. A
        <span class="bold">demand curve</span> slopes down, and it shows how
        much buyers are willing to pay at each quantity. A
        <span class="bold">supply curve</span> slopes up, and it shows what it
        costs sellers to produce each quantity. Where the two curves cross, we
        get the price and quantity at which the market clears.
      </p>
      <p>
        The picture is clean, but a real market doesn't hand us its curves.
        What we actually get is a record of prices and quantities, one point a
        month, scattered in a noisy cloud. The natural next step is to fit a
        straight line through that cloud with
        <span class="bold">ordinary least squares</span> (OLS), the standard
        line of best fit, and call it the demand curve.
      </p>
      <p>
        As we'll see, that line is almost never the demand curve. It's a
        weighted mix of demand and supply, and the <span class="bold">R²</span>
        we'd normally read as a sign of a good fit, which measures how much of
        the scatter the line explains, turns out to measure exactly how badly
        the data pins down the demand curve.
      </p>
    </section>

    <TwoCurves />

    <section class="body-text">
      <h3 class="body-header">What moves the crossing?</h3>
      <p>
        To see why a cloud of transactions can mislead us, let's look at what
        moves the crossing in the first place. When something we don't
        observe, such as tastes or household incomes, shifts the demand curve,
        sellers respond by moving along their supply curve. So as demand moves
        back and forth, the crossings trace out the <em>supply</em> curve.
      </p>
      <p>
        It works the other way round, too. When input costs or the weather
        shift supply, buyers respond by moving along their demand curve, so the
        crossings trace out the <em>demand</em> curve. In other words, the data
        reveals a curve only when that curve stands still while the other one
        does all the moving.
      </p>
      <p>
        Now let's see what happens when both curves move at once.
      </p>
    </section>

    <TheQuestion />

    <section class="body-text">
      <h3 class="body-header">Why the line slopes the wrong way</h3>
      <p>
        In the eighteen months above, a straight line fitted through the prices
        and quantities slopes upwards. Taken at face value, that would make
        this commodity a rare curiosity whose buyers want more of it when it's
        dearer.
      </p>
      <p>
        In fact, demand in this market is perfectly ordinary: people buy
        substantially less when the price rises, and the true slope is −3.0.
        The fitted line slopes up because the shocks to demand were bigger than
        the shocks to supply over those eighteen months, so the data mostly
        records sellers responding to shifts in demand, rather than demand
        itself. The lab below lets you control that mix.
      </p>
    </section>

    <CloudLab />

    <section class="body-text">
      <h3 class="body-header">A straight line in the shock mix</h3>
      <p>
        Let's make this precise. In our market, demand and supply are
      </p>

      <div class="math-card">
        {@html demandEq}
        {@html supplyEq}
      </div>

      <p>
        where u and v are independent random shocks that hit the two sides of
        the market. We'll write
        {@html katexify("w = \\tau_d^2 / (\\tau_d^2 + \\tau_s^2)")} for the
        <span class="bold">demand-shock share</span>, which is the fraction of
        the total shock variance that comes from shifts in demand.
      </p>
      <p>
        When w = 0, only supply moves, and the fitted line recovers the exact
        demand slope of −3.00. When w = 1, only demand moves, and it recovers
        the exact supply slope of +2.00. In between, the fitted slope isn't
        just some number between the two: as the next chart shows, it moves
        along a straight line from one to the other.
      </p>
    </section>

    <MixFigure />

    <section class="body-text">
      <h3 class="body-header">The flat cloud</h3>
      <p>
        As the shock mix moves from w = 0 to w = 1, the least-squares slope
        follows the straight line
        {@html katexify("\\text{slope} = w\\,S - (1 - w)\\,B")}, where B and
        S are the slopes of demand and supply without their signs, 3 and 2 in
        our market. Equivalently, the fitted slope divides the interval
        [−B, S] in exactly the ratio of the two shock variances,
        {@html katexify("\\tau_d^2 / \\tau_s^2")}.
      </p>
      <p>
        That sets a trap at {@html katexify("w^* = B / (B + S) = 0.60")}. At that
        mix, the covariance between price and quantity is zero, so the cloud is
        completely flat. At a glance, it looks as if demand is perfectly
        inelastic, with buyers who don't respond to price at all. In reality,
        demand is highly sensitive to price, but in the covariance its downward
        slope is cancelled exactly by the upward slope of supply.
      </p>
    </section>

    <R2Figure />

    <section class="body-text">
      <h3 class="body-header">What R² can't tell us</h3>
      <p>
        This is the <span class="bold">identification problem</span>, which
        Elmer Working set out in 1927: the data alone can't tell us which curve
        we're looking at. The usual statistics can't rescue us either, because
        R² = 1.0 at both ends of the range, when the cloud fits demand perfectly
        and when it fits supply perfectly. At the flat cloud, where w* = 0.60,
        R² = 0.
      </p>
      <p>
        So a high R² only tells us that one curve was much more stable than the
        other. It gives us no evidence at all about <em>which</em> curve stood
        still.
      </p>
    </section>

    <BracketFigure />

    <section class="body-text">
      <h3 class="body-header">A bracket around the demand slope</h3>
      <p>
        If we can't pin down the demand curve, what can the data tell us?
        Edward Leamer showed in 1981 that when the cloud slopes downwards and
        the two kinds of shock are uncorrelated, the data still puts firm bounds
        on the demand slope.
      </p>
      <p>
        The ordinary regression of quantity on price gives the lower bound,
        {@html katexify("B_{\\text{lo}} = -\\text{Cov}(p, q) / \\text{Var}(p)")}.
        The reverse regression, of price on quantity, turned around to read as
        a demand slope, gives the upper bound,
        {@html katexify("B_{\\text{hi}} = -\\text{Var}(q) / \\text{Cov}(p, q)")}.
        Their ratio is an exact identity:
      </p>

      <div class="math-card">
        {@html bracketEq}
      </div>

      <p>
        This is the key result. R² still measures how well the line fits, but
        it also tells us exactly how wide the range of possible demand slopes
        is, because the top of the range is 1/R² times the bottom. When
        R² = 0.22, for example, the true demand elasticity could be anywhere in
        a range whose ends differ by a factor of 4.64.
      </p>
    </section>

    <ShifterFigure />

    <section class="body-text">
      <h3 class="body-header">How to break out of the bracket</h3>
      <p>
        So how do economists get out of this bracket? More data won't do it. A
        bigger sample only estimates the same mixed-up moments more precisely,
        and the 1/R² bracket stays exactly as wide.
      </p>
      <p>
        What we need instead is an <span class="bold">instrumental
        variable</span>, which is an outside shock Z that shifts supply without
        affecting demand. If we compare the average price and quantity when the
        instrument is high with when it's low, the slope between those two
        points comes only from supply moving, so it traces out the demand
        curve. That's what the figure above does, and you can switch it back to
        the ordinary fitted line to compare the two.
      </p>
    </section>

    <Conclusion />
    <Resources />
  </main>
</div>

<style>
  .page-wrap {
    width: 100%;
    min-height: 100vh;
    background: var(--paper, #f1f3f3);
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  .math-card {
    max-width: 600px;
    box-sizing: border-box;
    background: #ffffff;
    border: 1px solid #d4dada;
    border-left: 4px solid var(--violet, #7c5aed);
    padding: 1rem 1.25rem;
    margin: 1.5rem auto;
    overflow-x: auto;
  }
</style>
