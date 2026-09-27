<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import WhoMakesWhat from "./Components/WhoMakesWhat.svelte";
  import PriceTest from "./Components/PriceTest.svelte";
  import MarketReveal from "./Components/MarketReveal.svelte";
  import WorldFrontier from "./Components/WorldFrontier.svelte";
  import SizeLab from "./Components/SizeLab.svelte";
  import BandFigure from "./Components/BandFigure.svelte";
  import CatchUpFigure from "./Components/CatchUpFigure.svelte";
  import GoodsFigure from "./Components/GoodsFigure.svelte";
  import katexify from "./katexify.js";

  const costs = katexify(`\\pi_V = \\frac{g_V}{t_V} = \\frac{18}{9} = 2, \\qquad \\pi_C = \\frac{g_C}{t_C} = \\frac{9}{2} = 4.5`, true);
  const price = katexify(`p = \\min\\!\\Big(\\pi_C,\\ \\max\\!\\Big(\\pi_V,\\ \\frac{s}{1-s}\\cdot\\frac{k\\,g_C}{t_V}\\Big)\\Big)`, true);
  const priceHere = katexify(`p = \\min\\big(4.5,\\ \\max(2,\\ k)\\big)`, true);
  const gains = katexify(`G_V = \\Big(\\frac{p}{\\pi_V}\\Big)^{1-s}, \\qquad G_C = \\Big(\\frac{\\pi_C}{p}\\Big)^{s}`, true);
  const pie = katexify(`G_V^{\\,s}\\, G_C^{\\,1-s} = \\Big(\\frac{\\pi_C}{\\pi_V}\\Big)^{s(1-s)}`, true);
  const test = katexify(`\\text{Valley gains} \\iff k\\,g_C > g_V, \\qquad \\text{Coast gains} \\iff t_V > k\\,t_C`, true);
  const wage = katexify(`\\frac{w_V}{w_C} = p\\,\\frac{t_V}{g_C}`, true);
  const many = katexify(`k \\le \\frac{\\min_j a_j}{N-1} \\quad\\text{and}\\quad k \\ge (N-1)\\max_j a_j`, true);
  const sHalf = katexify(`s = \\tfrac12`);
  const pieHalf = katexify(`G_V\\,G_C = \\sqrt{\\pi_C/\\pi_V} = 1.5`);
  const sigma = katexify(`\\sigma`);
  const bandSigma = katexify(`(\\pi_C/\\pi_V)^{\\sigma}`);
  const aj = katexify(`a_j`);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Let's imagine two small economies that make only two things: tools and
      grain. In the Valley, one worker can make 9 tools in a day, or grow 18
      sacks of grain instead. On the Coast, where the soil is thinner and the
      workshops are older, a worker can make 2 tools or grow 9 sacks. So the
      Valley is better at both, and by a wide margin.
    </p>
    <p>
      Most first courses in economics have a lesson about a pair like this, and
      it's one of the most useful ideas in the subject: the two economies should
      still trade, and both of them will come out ahead. The lesson comes with a
      two-step procedure for showing it, and it's worth running that procedure
      before we start poking at it. The first step is deciding who should make
      what.
    </p>
  </section>

  <WhoMakesWhat />

  <section class="body-text">
    <h3 class="body-header">What a tool really costs</h3>
    <p>
      The number that matters is what each worker gives up. A Valley worker who
      spends time making a tool loses the 2 sacks of grain they could have grown
      instead, while a Coast worker loses 4.5 sacks. Economists call that
      sacrifice the <span class="bold">opportunity cost</span> of a tool, and
      it's the only thing this decision depends on. Turned around, a sack of
      grain costs a Valley worker half a tool and a Coast worker only two-ninths
      of one.
    </p>
    <p>
      So the Valley has an <span class="bold">absolute advantage</span> in both
      goods, which means it makes more of each per worker, but a
      <span class="bold">comparative advantage</span>, which means a lower
      opportunity cost, only in tools. The Coast has the comparative advantage
      in grain, even though it grows less of it. If the Valley makes the tools
      and the Coast grows the grain, each good is made by the economy that gives
      up the least to make it.
    </p>
    <p>
      We can draw each economy's choices as a straight line. A Valley worker can
      end the day anywhere between 18 sacks with no tools and 9 tools with no
      sacks, and the line joining those two points is called the
      <span class="bold">production possibility frontier</span>. Its slope is
      the opportunity cost, which is why the Valley's frontier is flatter than
      the Coast's in the figure below. Both are drawn on the same scale, so the
      Coast's is smaller as well.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Any price in between</h3>
    <p>
      The second step is the price. Suppose the Valley makes only tools, the
      Coast grows only grain, and they swap some of each. The Valley won't sell
      a tool for fewer than 2 sacks, because it could grow 2 sacks with the same
      time. The Coast won't pay more than 4.5 sacks, because that's what a tool
      costs it to make. So a deal can only happen at a price between the two
      opportunity costs.
    </p>
    <p>
      To keep score, we'll assume that everybody spends half of their income on
      each good, which we'll stick with for the whole article, and we'll measure
      a worker's basket by the geometric mean of their tools and their sacks,
      which is the natural score when spending is split evenly. Drag the price
      and watch what trade does for each economy.
    </p>
  </section>

  <PriceTest />

  <section class="body-text">
    <p>
      The dashed line through each economy's output shows every basket a worker
      can end up with by trading at that price, and inside the range it lies
      outside the worker's own frontier. That's what gaining from trade means:
      reaching baskets you couldn't make yourself. At 3 sacks per tool, for
      example, a worker's basket is 22.5% bigger in both economies. We'll also
      write that as a <span class="bold">gain factor</span> of 1.225, which is
      the new basket's score divided by the old one.
    </p>
    <p>
      At the two ends of the range, something specific happens. At exactly 2
      sacks per tool, the Valley's dashed line lies on top of its own frontier,
      so trade offers it nothing it couldn't already make, and its gain is
      exactly zero. At exactly 4.5, the same is true of the Coast. That's the
      textbook result, and so far it's airtight: pick any price strictly between
      the two opportunity costs, and both economies gain, even though one of
      them is better at everything.
    </p>
    <p>
      There's only one thing missing, which is that nobody gets to pick the
      price.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Let the market choose</h3>
    <p>
      In a real economy, thousands of workers and buyers trade at whatever price
      clears the market, so the price is an outcome rather than a choice. So
      let's give each economy 1,000 workers, open the border between them, and
      see where the price settles.
    </p>
  </section>

  <MarketReveal />

  <section class="body-text">
    <p>
      The price settles at 2 sacks per tool, which is the Valley's own
      opportunity cost. As we saw a moment ago, that's the one price at which
      the Valley gains nothing, and indeed a Valley worker ends up with 4.5
      tools and 9 sacks, which is exactly the basket they had before. The Coast,
      on the other hand, gains 50%, which is the most it could gain at any price
      in the range. So the economy that's better at everything, trading with a
      partner of the same size, gets none of the gain.
    </p>
    <p>
      This isn't a quirk of our numbers. In a two-good world with spending split
      evenly, it happens to every pair of equal-sized economies in which one is
      better at both goods. The checks behind this page try 100,000 random pairs
      like that, and the more productive economy gains exactly nothing in every
      one of them.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Why the price sticks at 2</h3>
    <p>
      The reason is capacity. At any price above 2 sacks, every Valley worker
      would rather make tools, so the world's grain would have to come from the
      Coast alone. But the Coast can grow at most 9,000 sacks a day, and at
      those prices buyers want a good deal more grain than that. So some Valley
      workers have to keep farming, and they'll only do it if a tool sells for
      no more than the 2 sacks they could grow instead. In other words, an
      economy that keeps making both goods pins the price at its own opportunity
      cost.
    </p>
    <p>
      It helps to look at the world as a whole. The figure below draws every mix
      of tools and grain the two economies can make together, which is their
      combined frontier. It has two straight pieces: along the flatter one, the
      Valley is moving workers between tools and grain, and along the steeper
      one, the Coast is. The corner between them is the point where each economy
      makes only its own good.
    </p>
  </section>

  <WorldFrontier />

  <section class="body-text">
    <p>
      With equal workforces, world production sits on the Valley's piece, and
      the price is that piece's slope. The accounting shows where the gain goes.
      The world grows the same 13,500 sacks as before and makes 6,750 tools
      instead of 5,500, and every one of those 1,250 extra tools ends up on the
      Coast. If you give the Coast three times as many workers, production moves
      to the corner, where each economy makes only its own good and the world
      makes 20% more of both. With six times as many, it slides onto the Coast's
      piece, and the same thing happens the other way round.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">A test for who gains</h3>
    <p>
      There's a simple test for which of those cases you're in, and it compares
      whole economies rather than single workers. With spending split evenly,
      the Valley gains exactly when the Coast can grow more grain in total than
      the Valley could, and the Coast gains exactly when the Valley can make
      more tools in total than the Coast could. Put together, both economies
      gain exactly when each one is the bigger producer of the good it sells.
    </p>
    <p>
      With 1,000 workers each, the Valley could make 9,000 tools a day against
      the Coast's 2,000, so that half of the test passes and the Coast gains.
      But the Coast could grow only 9,000 sacks against the Valley's 18,000, so
      the other half fails, and the Valley gains nothing. The checks behind this
      page run the test on 100,000 random pairs of economies of all sizes, and
      it agrees with the full market calculation every time.
    </p>
    <p>
      Now it's your turn. The slider sets how many workers the Coast has for
      each Valley worker.
    </p>
  </section>

  <SizeLab />

  <section class="body-text">
    <p>
      As you drag the Coast past twice the Valley's size, it becomes the bigger
      grain producer, and the Valley starts to gain. Past four and a half times,
      the Valley stops being the bigger tool producer, and now it's the Coast
      that gains nothing. Only between those two sizes do both economies
      specialise completely, and only there do both of them gain. So the
      textbook picture, with each economy making its own good and both coming
      out ahead, is one regime out of three, and it needs the two economies to
      be sized just right.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">How wide is the band?</h3>
    <p>
      If we plot the market price against the size ratio on logarithmic axes, we
      get a straight line with a slope of exactly 1 and a flat stretch at each
      end. With our numbers the middle part is especially simple, because a
      Valley worker's 9 tools and a Coast worker's 9 sacks cancel, which leaves
      the price inside the band equal to the size ratio itself. The flat
      stretches sit at the two opportunity costs, so the band runs from 2 to
      4.5, a factor of exactly 2.25, which is the ratio of the two opportunity
      costs.
    </p>
  </section>

  <BandFigure />

  <section class="body-text">
    <p>
      That's the identity worth remembering. Two economies whose opportunity
      costs differ by a factor of 2.25 both gain only if their relative size
      lands inside a window that is also a factor of 2.25 wide. If their
      opportunity costs differed by 10%, the window would be only 10% wide. In
      other words, the more alike two economies are in what they're good at, the
      more precisely matched in size they have to be for both of them to come
      out ahead.
    </p>
    <p>
      The gain panel holds a second identity. As the Coast grows, the Valley's
      gain rises and the Coast's falls, but if you multiply the two gain factors
      together, you get 1.5 at every size, inside the band and outside it. At
      2.7 Coast workers per Valley worker, for instance, the Valley gains 16.2%
      and the Coast 29.1%, and 1.162 × 1.291 comes to 1.500. So size never
      changes the total, only the split, and neither economy can ever gain more
      than 50%. It also turns out that each economy keeps consuming exactly as
      much of its own export as it did without trade, which means the whole gain
      arrives as extra imports.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What absolute advantage does decide</h3>
    <p>
      None of this makes the Valley's productivity irrelevant, because it
      decides wages. A tool costs a Valley wage divided by 9, and a sack costs a
      Coast wage divided by 9, so with our numbers a Valley wage is worth
      exactly as many Coast wages as a tool is worth sacks. That keeps a Valley
      wage between 2 and 4.5 Coast wages, which is between the Valley's
      productivity edge in grain and its edge in tools. At equal size it's
      exactly twice a Coast wage, because both economies are still growing
      grain, and at grain the Valley is exactly twice as productive. You can
      watch the wage move with size in the lab above.
    </p>
    <p>
      This is also the honest answer to a common worry about trading with a
      poorer economy. The Coast can sell grain to the Valley only because its
      wages are lower, and its wages are lower because its workers are less
      productive, not because trade made them so. Trade doesn't equalise wages
      in this model, and it doesn't leave anybody worse off either.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">When the Coast catches up</h3>
    <p>
      Here's a question with a less comfortable answer. Suppose the Coast gets
      better at something. Is that good news for the Valley? It sounds as if it
      should be, since the Valley buys from the Coast, but Paul Samuelson argued
      in 2004 that it depends on which good the Coast gets better at, and this
      model shows why. Let's hold the Coast at three times the Valley's size,
      where both economies gain 22.5%, and raise its productivity in one good.
    </p>
  </section>

  <CatchUpFigure />

  <section class="body-text">
    <p>
      If the Coast gets better at grain, which is what the Valley buys, the
      Valley's gain rises all the way, reaching 73.2% once a Coast worker grows
      twice as much. But if the Coast gets better at tools, which is what the
      Valley sells, the Valley's gain doesn't move at all until a Coast worker
      can make 3 tools a day. That's the point where the Coast's total tool
      capacity matches the Valley's. From there the Valley's gain falls, and at
      4.5 tools a day it's exactly zero, because the two economies now have the
      same opportunity cost and nothing to trade. Past that point the Coast has
      the comparative advantage in tools, trade starts again in the other
      direction, and the Valley gains once more, reaching 41.4% at 9 tools a
      day.
    </p>
    <p>
      The Coast's own gain has a surprise in it too. Before the Valley notices
      anything, the Coast's gain from trade falls from 22.5% to exactly zero,
      even though a Coast worker's basket doesn't change at all: it stays at 4.5
      sacks and 1.5 tools a day. What changes is the basket the same worker
      could make without trade, which catches up until, at 3 tools a day, trade
      adds nothing to it.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">More goods, a wider band</h3>
    <p>
      It's fair to ask whether the exact zero survives in a world with more than
      two goods, and the answer is mostly no, which is good news for the
      textbook. Suppose there are <i>N</i> goods with spending split evenly
      between them, and that the Valley's productivity edge over the Coast is
      spread evenly, on a log scale, from 2 to 4.5 across them. Then the Valley
      gains nothing exactly when the Coast has at most
      2&#8202;/&#8202;(<i>N</i>&nbsp;&minus;&nbsp;1) workers for each of its
      own, and the Coast gains nothing exactly when it has
      4.5&nbsp;&times;&nbsp;(<i>N</i>&nbsp;&minus;&nbsp;1) or more. With two
      goods, that's our band from 2 to 4.5 again.
    </p>
  </section>

  <GoodsFigure />

  <section class="body-text">
    <p>
      With ten goods, the Valley gains something as long as the Coast has more
      than 222 workers for every 1,000 of its own, and the Coast gains something
      until it has 40,500. So when there are many goods, both economies gain
      across a very wide range of sizes, and the exact zero needs a partner that
      is tiny by comparison. The checks behind this page confirm those two edges
      on 48,000 random many-good economies.
    </p>
    <p>
      What does survive is the lopsided split. With ten goods and equal
      workforces, the Valley gains 2.7% and the Coast 28.7%, so the Coast, the
      smaller of the two in output, still takes most of the gain. The fixed pie
      doesn't survive, though. With ten goods, the two gain factors multiply to
      1.5 only when one economy takes everything, and to about 1.25 when the
      Coast has two or three times the Valley's workforce.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The maths</h3>
    <p>
      Let's write <i>t</i> and <i>g</i> for what one worker makes in a day,
      tools and sacks, with <i>V</i> for the Valley and <i>C</i> for the Coast.
      We'll also write <i>k</i> for the number of Coast workers per Valley
      worker and <i>s</i> for the share of income spent on tools. The
      opportunity costs of a tool are then
    </p>
    <p class="eq">{@html costs}</p>
    <p>
      If both economies specialise, the Valley makes <i>t<sub>V</sub></i> tools
      per Valley worker and the Coast grows <i>k&thinsp;g<sub>C</sub></i> sacks,
      and spending clears the market at a price of
      <i>s</i>&#8202;/&#8202;(1&nbsp;&minus;&nbsp;<i>s</i>) times
      <i>k&thinsp;g<sub>C</sub></i>&#8202;/&#8202;<i>t<sub>V</sub></i>. That
      price can't fall below <i>&pi;<sub>V</sub></i>, because Valley workers
      would start growing grain, and it can't rise above
      <i>&pi;<sub>C</sub></i>, because Coast workers would start making tools.
      So the market price is
    </p>
    <p class="eq">{@html price}</p>
    <p>which with our numbers is simply</p>
    <p class="eq">{@html priceHere}</p>
    <p>
      If we score a basket of <i>a</i> tools and <i>b</i> sacks as
      <i>a</i><sup><i>s</i></sup><i>b</i><sup>1&minus;<i>s</i></sup>, which is
      the geometric mean we've used throughout when {@html sHalf}, the two gains
      are
    </p>
    <p class="eq">{@html gains}</p>
    <p>and weighting them by the spending shares removes the price entirely:</p>
    <p class="eq">{@html pie}</p>
    <p>
      With {@html sHalf} that's {@html pieHalf}, the fixed pie. The band is the
      range of <i>k</i> over which the unclamped price lies strictly between the
      two opportunity costs, so its two ends differ by exactly
      <i>&pi;<sub>C</sub></i>&#8202;/&#8202;<i>&pi;<sub>V</sub></i>. If the two
      goods could be swapped for one another more or less easily, which
      economists describe with an elasticity of substitution {@html sigma} (it's
      1 in the case we've used), the ends would differ by {@html bandSigma}
      instead. With spending split evenly, the test for who gains is
    </p>
    <p class="eq">{@html test}</p>
    <p>and the relative wage is</p>
    <p class="eq">{@html wage}</p>
    <p>
      With <i>N</i> goods, spending split evenly, and a Valley productivity edge
      of {@html aj} on good <i>j</i>, the Valley gains nothing exactly when the
      first of these holds, and the Coast exactly when the second does:
    </p>
    <p class="eq">{@html many}</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      A model this small is useful because of what it leaves out, and a few of
      the omissions matter here.
    </p>
    <p>
      First, there's only one kind of worker, so everybody inside an economy
      gains by the same amount. Real trade creates losers inside each country,
      and the models that show it, with land or machines that can't move between
      industries, tell a different story from this one. Second, workers switch
      between tools and grain instantly and at no cost, and nobody is ever out
      of work along the way. Third, there are no transport costs, which in
      reality open up a range of prices at which nobody trades at all. Fourth,
      everybody spends a fixed share of their income on each good, which is the
      case economists call Cobb–Douglas. The fixed pie and the unchanged grain
      output are properties of that case, and if the two goods were easier to
      swap for one another, the band would be wider.
    </p>
    <p>
      And finally, there are only two economies. With three or more, even the
      first step of the procedure stops being reliable, because a way of
      dividing up production can pass every comparison between two economies and
      still waste output. In a quick experiment behind this page, that happened
      in about 12% of random worlds with three economies and three goods. The
      general test, due to Ronald Jones, looks for the assignment of goods to
      economies that makes the product of their labour requirements as small as
      possible, and comparing pairs can miss it.
    </p>
    <p>
      So how often does the bad regime turn up? In a world of two goods, often,
      because the band is only as wide as the gap between the opportunity costs,
      while real economies differ enormously in size. In a world of many goods,
      much less often, since the exact zero needs a very small partner. What
      doesn't depend on the number of goods is the direction of the effect: as
      an economy shrinks relative to its partner, it trades at prices closer to
      the partner's costs, and its share of the gain grows.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the procedure</h3>
    <p>
      The procedure most courses teach is correct as far as it goes. Comparative
      advantage really does decide who makes what, and any price strictly
      between the two opportunity costs really does leave both economies better
      off. What the procedure quietly assumes is the part that decides who
      gains, namely that the price lands somewhere in the middle. In a market it
      lands wherever relative size puts it, and for an economy that's better at
      everything, trading with a partner of its own size, that's the one price
      at which trade gives it nothing at all.
    </p>
    <p>
      That's a useful thing to carry into any argument about trade. The
      statement that trade is good for both sides is really a statement about a
      range of prices, so the question worth asking is always where in that
      range the actual price sits, and why.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      The ideas in the first half of this article are standard: absolute and
      comparative advantage, opportunity cost as a ratio of what a worker can
      make, specialisation, and an agreement between two producers at a price
      between their two opportunity costs. CORE Econ's <i>The Economy 2.0:
      Microeconomics</i> (2023), Unit 2, section 2.3, is an excellent free
      introduction to all of them. Its worked example is an agreement between
      two people rather than a market, which is a sensible way to teach the
      idea. If a competitive market set the price in that example instead, with
      equal numbers of each kind of producer and spending split evenly, the
      price would land on the more productive producer's own opportunity cost,
      which is this article's point in the book's own setting.
    </p>
    <p>
      That a two-good model like this one can put the world price on one
      country's own opportunity cost is well known in trade theory. Krugman,
      Obstfeld and Melitz's <i>International Economics</i>, chapter 3, builds
      the relative supply curve whose flat stretches produce it, and shows the
      relative wage lying between the two productivity ratios. The catch-up
      section follows Paul Samuelson, "Where Ricardo and Mill rebut and confirm
      arguments of mainstream economists supporting globalization", <i>Journal
      of Economic Perspectives</i> 18(3), 2004, pages 135–146. The many-goods
      section is a discrete version of Dornbusch, Fischer and Samuelson,
      <i>American Economic Review</i> 67(5), 1977, pages 823–839, and the
      many-country test is Ronald Jones, <i>Review of Economic Studies</i>
      28(3), 1961, pages 161–175.
    </p>
    <p>
      The Valley and the Coast, their numbers, the capacity test, the band and
      fixed-pie identities, the world-output accounting, the catch-up numbers
      and the many-goods thresholds as stated here are mine. Every number in
      this article is re-derived by
      <span class="mono">verify/check-numbers.mjs</span> from the same modules
      the page draws from, every equilibrium is computed by two routes that
      share no code, and the figures are checked in rendered pixels at 390px and
      1280px. The page is built on the scaffold and design system of Amazon's
      <a href="https://mlu-explain.github.io/">MLU-Explain</a>, used under CC
      BY-SA 4.0.
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
