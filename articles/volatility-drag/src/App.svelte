<script>
  /* App.svelte for volatility-drag */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import ZigzagFig from "./Components/ZigzagFig.svelte";
  import PathLab from "./Components/PathLab.svelte";
  import RegionMap from "./Components/RegionMap.svelte";
  import DragParabola from "./Components/DragParabola.svelte";
  import katexify from "./katexify.js";
  import { pinEnd, simulate, realisedVariance } from "./drag.js";

  let L = $state(3);
  let target = $state(0);
  let vol = $state(0.2);
  let seed = $state(7);
  let point = $derived({ R: target, vol: Math.sqrt(realisedVariance(pinEnd(simulate(seed, 0, vol), target))) });
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Leveraged funds make a simple promise. If we buy a 3× fund on a stock index, it aims to give us three times the index's return, and an inverse fund
        aims to give us the opposite. The small print adds two words: <em>each day</em>. At the close the fund resets its borrowing so that tomorrow we're
        again three times the index, whatever happened today.
      </p>
      <p>
        Those two words change a lot. Suppose the index ends the year where it started. What did our 3× fund do? It's tempting to say "nothing, three times
        nothing", and it's wrong. In a year when the index moved around at 20% volatility, we'd typically have lost about a tenth of our money. We'll see
        where that loss comes from. We'll also see that our result over any period depends on only two numbers: what the index returned and how much it
        moved along the way.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Two days</h3>
      <p>
        Let's start with the smallest example we can. The index rises 10% one day and falls 10% the next. It ends at 1.1 × 0.9 = 0.99 of where it started, a
        loss of 1%. Our 3× fund rises 30% and then falls 30%, so we end at 1.3 × 0.7 = 0.91, a loss of 9%. That's nine times the index's loss, not three.
      </p>
      <p>
        Nothing unusual happened. The fall came after a rise, so it took 30% of a bigger balance than we started with. Every up day followed by a down day of the same size costs
        a little, and the cost grows with the square of the move. For the index a ±10% pair costs 1%. For the 3× fund the moves are three times as big, so the
        pair costs nine times as much. Three of those nine points are just three times the index's own loss. The other six are the extra cost of leverage, and
        that extra is what we'll call the <span class="bold">drag</span>.
      </p>
    </section>

    <Figure id="fig-zigzag" title="An index that zigzags" sub="Drag the daily move and switch between funds.">
      {#snippet children(w)}
        <ZigzagFig width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The index goes up by the daily move one day and down by the same amount the next. Notice how slowly the index drifts down, and how much faster the leveraged and inverse funds fall.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        If you set the daily move to ±2%, you'll see that after 60 days the index is down a little over 1%, and three times that would be under 4%. The 3× fund is down more than 10%.
        Switch to the −3× fund and you'll see it land in exactly the same place, even though it's betting the other way: each pair of days multiplies both funds by
        1.06 × 0.94. We'll come back to that.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The rule</h3>
      <p>
        We can turn the two-day story into a formula. On a day when the index returns {@html katexify("r")}, the log of its growth is about
        {@html katexify("r - r^2/2")}. The log of our fund's growth is about {@html katexify("Lr - L^2 r^2 / 2")}. If we take {@html katexify("L")} times
        the index's line away from the fund's, the {@html katexify("Lr")} terms cancel and we're left with {@html katexify("-(L^2 - L)\\, r^2 / 2")}. Adding
        that up over every day in the period gives us the rule:
      </p>
      <div class="math-display">{@html katexify("\\text{fund} \\approx \\text{index}^{\\,L} \\times \\exp\\!\\left(-\\frac{L^2 - L}{2} \\sum_t r_t^2\\right)", true)}</div>
      <p>
        Here "fund" and "index" mean each one's value at the end of the period over its value at the start. The sum {@html katexify("\\sum_t r_t^2")} is the
        <span class="bold">realised variance</span>, the sum of the squared daily returns. For a one-year period it's the square of the realised volatility. The
        first factor is what we'd get if the index went up in a straight line. The second is the drag. For any leverage above 1 or below 0 it only ever pulls
        us down.
      </p>
      <p>
        The lab below lets us set the two numbers ourselves. You pick what the index returns over the year and how volatile it is, and the lab draws a year
        of daily moves that fits. The dark circle is the rule's prediction and the pink line is our fund.
      </p>
    </section>

    <Figure id="fig-lab" title="A year in a leveraged fund" sub="Pick the index's return and volatility, then draw another year.">
      {#snippet children(w)}
        <PathLab width={w} bind:L bind:target bind:vol bind:seed />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The grey line is the index and the pink line is our fund. The blue dashed line is L times the index's return for the year, and the dark circle is where the two-number rule puts the fund.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With the index flat at 20% volatility, our 3× fund is down about 10% and the rule says the same, within a tenth of a point. If you press "Draw another year" a
        few times, the path changes shape, sometimes a lot. As long as the index's return and volatility stay put, our fund keeps ending up near the dark circle. The order of the days doesn't matter at all. If we reversed the year, the index and the fund would both end at the same values, because
        multiplying the same daily growth factors in a different order gives the same product.
      </p>
      <p>
        The rule isn't perfect with daily resets, because we dropped the cubes and higher powers of each day's return. Those only matter when single days are
        large. When we simulate a thousand flat years for the 3× fund, the rule is within a tenth of a percentage point on 95% of them at 20% volatility, and
        within about a point at 60%. If the fund could rebalance continuously, the rule would hold with no error at all. That's the form Avellaneda and
        Zhang derived in 2010.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">When the fund wins</h3>
      <p>
        Drag isn't the whole story, because the first factor, {@html katexify("\\text{index}^L")}, compounds. If the index rises 30% in a calm year with 15%
        volatility, three times its return would be 90%, but our 3× fund makes about 105%. Each day's gain is reinvested at three times leverage, so in a
        steady trend we do better than three times the index's return. The drag takes some of that back, but not all of it.
      </p>
      <p>
        So we have two regimes, and the rule tells us where the border sits. The map below takes every combination of the index's yearly return and its
        realised volatility and asks whether our fund beats {@html katexify("L")} times the index's return. Near a flat year it trails, and more so the more
        volatile the year. In a strong trend in either direction it wins. The dot is the year we've drawn in the lab.
      </p>
    </section>

    <Figure id="fig-map" title="Where the fund beats L times the index" sub="The dot is the year drawn in the lab above.">
      {#snippet children(w)}
        <RegionMap width={w} {L} {point} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Pink marks the years where the fund ends behind L times the index's return, and green the years where it ends ahead. The border comes from the rule alone, so every path with the same two numbers lands in the same place.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The pink wedge widens as volatility rises. At 20% volatility, a flat year costs us about 11% in the 3× fund, and at 40% it costs about 38%. The same
        flat years cost a 2× fund about 4% and 15%. If you switch the lab to an inverse fund, the wedge tilts, because an inverse fund wants the index to
        fall.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Inverse funds bleed faster</h3>
      <p>
        The drag coefficient {@html katexify("(L^2 - L)/2")} has a pattern we should pause on. It's a parabola with its lowest point at
        {@html katexify("L = \\tfrac12")}, so leverage {@html katexify("L")} and leverage {@html katexify("1 - L")} carry the same drag. A −1× fund bleeds at
        the same rate as a +2× fund. A −2× fund bleeds at the same rate as a +3× fund. And a −3× fund, with a coefficient of 6, bleeds twice as fast as a +3×
        one.
      </p>
    </section>

    <Figure id="fig-parabola" title="Drag against leverage">
      {#snippet children(w)}
        <DragParabola width={w} />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The curve is symmetric about L = ½, so the two funds joined by each dashed line bleed at the same rate. Notice that it dips below zero between 0 and 1.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        Now we can see why the ±2% zigzag took the 3× and −3× funds to the same place. The index ended near where it started, so the first factor was close to
        1 for both. The −3× fund's larger drag was balanced by the index's small fall, which it gains from. Over a flat year at 20% volatility, a −3× fund
        loses about 21%, nearly twice what the +3× fund loses. If we buy an inverse fund to bet on a fall, we need the fall to come quickly.
      </p>
      <p>
        The part of the parabola between 0 and 1 is worth a look too. If we hold half our money in the index and half in cash, and rebalance every day, the
        coefficient is negative: we gain a little from volatility. That's the same effect running the other way, and it's what the
        <a href="../diversification/">diversification</a> article in this section builds on.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our funds are simpler than real ones in three ways that matter.</p>
      <p>
        First, they borrow for free and charge nothing. A real 3× fund borrows twice its assets, usually through swaps, and pays interest on that, while an
        inverse fund earns interest on the cash it holds. Many leveraged funds also charge close to 1% a year. Both effects are steady, so we could add them to
        the rule as a yearly cost.
      </p>
      <p>
        Second, a daily move large enough to wipe out the fund, a fall of a third for a 3× fund, is outside the rule. The fund would be worth nothing and
        would stay there.
      </p>
      <p>
        And finally, the rule is about holding a fund for a while, which isn't what these funds are built for. Regulators in the United States have warned
        since 2009 that they're designed for single-day bets and can drift far from L times the index over longer holding periods.
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
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
