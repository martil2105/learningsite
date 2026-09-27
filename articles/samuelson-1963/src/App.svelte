<script>
  /* App.svelte for samuelson-1963 */
  import "./finance.css";
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import PaperCard from "./Components/PaperCard.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import Figure from "./Components/Figure.svelte";
  import BetsLab from "./Components/BetsLab.svelte";
  import CaraLab from "./Components/CaraLab.svelte";
  import KinkFig from "./Components/KinkFig.svelte";
  import katexify from "./katexify.js";

  let n = $state(1);
  let hold = $state("all");
  let a = $state(0.006);
  let lambda = $state(2.25);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <PaperCard>
    {#snippet cite()}
      Samuelson, P. A. (1963), "Risk and uncertainty: a fallacy of large numbers", <em>Scientia</em>, 98, 108–113.
    {/snippet}
    {#snippet claims()}
      If we'd turn a bet down at every level of wealth we could reach, then no run of such bets is worth taking either, however long it is.
      The law of large numbers doesn't rescue a bet we wouldn't take once.
    {/snippet}
    {#snippet rebuild()}
      The colleague's reasoning with every outcome of a hundred bets on screen, the proof in one step, and a cautious person for whom a
      hundred bets are worth exactly a hundred times one.
    {/snippet}
    {#snippet later()}
      Rabin showed how strong the premise is, Ross showed that ordinary preferences needn't satisfy it, and Benartzi and Thaler showed
      that loss aversion explains the colleague well.
    {/snippet}
  </PaperCard>

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's start with the story, because the paper does. Samuelson offered a colleague a bet on the toss of a coin. If the colleague called it
        right he'd win $200, and if he called it wrong he'd lose $100. That's a generous bet, worth $50 on average. The colleague turned it down.
        He said he'd feel the $100 loss more than the $200 gain. Then he added that he'd take the bet if he could make a hundred of them, because
        over a hundred tosses the law of large numbers would make it a very good bet.
      </p>
      <p>
        Most of us would say something similar. One toss is a gamble, and a hundred tosses sound like a sure thing. Samuelson's paper argues that
        this pair of answers doesn't hang together, and it's an early, careful statement of an idea we met in the
        <a href="../time-diversification/">time diversification</a> article: repeating a risk doesn't make it go away.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">One bet, then a hundred</h3>
      <p>
        Let's look at what the colleague was asking for. The lab below shows every possible result of our bets, with its exact chance. It opens on
        a single bet, where we either win $200 or lose $100, each half the time. If you drag the number of bets up to a hundred, you'll see the
        picture change a lot.
      </p>
    </section>

    <Figure id="fig-bets" title="Every result of n coin-toss bets" sub="Drag the number of bets. Later, try sharing them.">
      {#snippet children(w)}
        <BetsLab width={w} bind:n bind:hold />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Each bar is one possible number of winning tosses. Blue bars come out ahead and pink bars lose money. The black dot on the axis is the
          average.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        At a hundred bets the colleague's intuition looks right. We win $5,000 on average, and the chance of losing any money at all is about 1 in
        2,300, since we'd need 67 or more losing tosses out of a hundred. That really is a very good bet in the sense of being likely to pay.
      </p>
      <p>
        But if you look at the other readouts, you'll see what else changed. The worst case has grown from losing $100 to losing $10,000. The typical swing around the average has grown
        too, from $150 to $1,500. Samuelson's point starts here. If losing $100 hurts enough to refuse one bet, then losing $10,000 has to hurt
        too, and the hundred bets make that loss possible. The chance of that is tiny, and Samuelson's argument shows why a tiny chance isn't enough.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What Samuelson proved</h3>
      <p>
        Samuelson's theorem is about choosing by <span class="bold">expected utility</span>. Let's say we value each possible amount of our
        wealth {@html katexify("w")} at {@html katexify("u(w)")}, with {@html katexify("u")} increasing, and we pick whatever gives us the highest
        average {@html katexify("u")}. His premise is that the colleague turns down one bet not just at today's wealth, but at every level of wealth he could
        pass through during the hundred tosses. His conclusion is that the colleague must then turn down the hundred bets as well.
      </p>
      <p>
        The proof is one step, repeated. Let's write {@html katexify("X_i")} for the result of the {@html katexify("i")}-th toss and
        {@html katexify("S_{n}")} for the total of the first {@html katexify("n")}. Whatever the first {@html katexify("n-1")} tosses did, we end up
        at some wealth where, by the premise, one more bet is worse than none:
      </p>
      <div class="math-display">{@html katexify("\\mathbb{E}\\,u(w + S_n) = \\mathbb{E}\\Big[\\,\\mathbb{E}\\big[u(w + S_{n-1} + X_n) \\mid S_{n-1}\\big]\\Big] < \\mathbb{E}\\,u(w + S_{n-1})", true)}</div>
      <p>
        So a hundred bets are worse than ninety-nine, which are worse than ninety-eight, and so on down to no bets at all. We peel off the last bet,
        and each time things get better, never worse. Nowhere does the argument need the chance of losing money, which is why the law of large
        numbers never gets a say.
      </p>
      <p>
        The cleanest case is someone with <span class="bold">constant absolute risk aversion</span>, whose utility is
        {@html katexify("u(w) = -e^{-aw}")}. For them, how much they dislike a risk doesn't depend on how rich they are, so if they turn the bet
        down once, they turn it down at every wealth, and the premise holds automatically. Their bets also add up in a simple way. The
        <span class="bold">certainty equivalent</span> of a gamble, the sure sum they'd swap it for, is {@html katexify("n")} times as large for
        {@html katexify("n")} independent bets as for one.
      </p>
    </section>

    <Figure id="fig-cara" title="What n bets are worth to a cautious person" sub="Drag the risk aversion, or pick a preset.">
      {#snippet children(w)}
        <CaraLab width={w} bind:a />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          The solid line is the certainty equivalent of n bets. The circles work the same number out from every possible result, and they sit on the
          line. The dashed line is what the bets pay on average.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        The lab opens on a cautious person who values one bet at about −$10, so a hundred bets are worth about −$1,000 to them. If you drag the
        risk aversion down to the keen preset, one bet is worth about $17 and a hundred are worth about $1,700. Either way the line goes through
        zero, so its direction is decided by the very first bet. There's no number of bets at which it turns around.
      </p>
      <p>
        The boundary between the two has a surprising value. One bet is worth exactly nothing when
        {@html katexify("\\tfrac12 e^{-200a} + \\tfrac12 e^{100a} = 1")}. If we write {@html katexify("x = e^{100a}")}, that's
        {@html katexify("x^3 - 2x^2 + 1 = 0")}, which factors as {@html katexify("(x - 1)(x^2 - x - 1) = 0")}. The root above 1 is the golden ratio,
        {@html katexify("\\varphi \\approx 1.618")}, so the "on the fence" preset is {@html katexify("a = \\ln\\varphi / 100")}, about 4.81 per
        $1,000.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Where the law of large numbers does help</h3>
      <p>
        So what was the colleague half remembering? The law of large numbers says that the average result per bet settles down as the number of bets
        grows. It doesn't say that the total settles down. The total's swings grow like the square root of the number of bets, and the total is
        what we'd have to pay.
      </p>
      <p>
        Samuelson makes the same point about insurance. People say an insurance company reduces its risk by insuring more ships, but adding ships
        adds dollars at risk. The law of large numbers helps when a risk is split up rather than piled up. If you go back to the bets lab, set it to a hundred bets and switch to <span class="bold">shared equally</span>, you'll see the other version. Now a hundred of us each hold a hundredth of every bet. Each of us
        still makes $50 on average, like one whole bet, but the worst case is losing $100 and the typical swing is only $15. That's the bet the
        colleague was imagining, and it isn't the bet he asked for.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What came later</h3>
      <p>
        Nobody disputes the theorem itself. What later work questioned is its premise, and whether the colleague was
        really making a mistake.
      </p>
      <p>
        First, the premise is stronger than it looks. Rabin showed in 2000 that turning down a small favourable bet at every level of wealth
        implies turning down some very large, very favourable bets. Our cautious person shows it in miniature. If you click the "on the
        fence" preset and read the last box, you'll see that they'd turn down any 50-50 bet that risks more than about $144, even for a prize of a million dollars.
        Few people are like that, which suggests few people refuse the $100 bet at every wealth level.
      </p>
      <p>
        Second, Ross pointed out in 1999 that for utility functions whose risk aversion changes with wealth, accepting a long run of favourable bets can be consistent with expected utility. The premise fails, and so the theorem doesn't apply.
      </p>
      <p>
        And finally, Benartzi and Thaler argued in 1999 that the colleague is better described by <span class="bold">loss aversion</span>, where
        a loss of a given size hurts more than a gain of the same size helps. Their experiments found that many people who turn down several plays
        of a gamble accept them when shown the distribution of the combined result, which is the picture in our first lab. The chart below counts
        losses a number of times more heavily than gains, measured from the wealth we started with.
      </p>
    </section>

    <Figure id="fig-kink" title="One bet at a time, or a hundred at once" sub="Drag how much more a loss hurts than a gain helps.">
      {#snippet children(w)}
        <KinkFig width={w} bind:lambda />
      {/snippet}
      {#snippet caption()}
        <p class="caption">
          Both lines are per bet. The pink line judges each toss on its own and the blue line judges the hundred tosses together.
        </p>
      {/snippet}
    </Figure>

    <section class="body-text">
      <p>
        With losses weighted 2.25 times, a figure Tversky and Kahneman estimated in 1992, one bet is worth −$12.50, because a loss must count
        less than twice a gain for it to be worth taking. If you drag the weight below 2, you'll see the pink line cross into positive
        territory. Judged one at a time, a hundred bets are worth a hundred times that, −$1,250. Judged as a
        package, they're worth about $5,000, since the package almost never loses. For the package to look bad, losses would have to count about
        32,900 times as much as gains.
      </p>
      <p>
        So the colleague's two answers fit together if he judges the hundred tosses as one package and the single toss on its own. That's still
        expected utility, just with a kink at the wealth he walked in with, and it doesn't meet Samuelson's premise, since after a single win he'd take
        the next bet. The trouble comes if he agrees to the hundred and then judges each toss as it happens. Benartzi and Thaler called that
        <span class="bold">myopic loss aversion</span> in an earlier paper, and used it to explain why investors who check their portfolios
        often ask for a large premium to hold stocks.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>Our rebuild is narrower than the debate in three ways.</p>
      <p>
        First, we've assumed the tosses are independent and the coin is fair. Samuelson's argument needs independence at the step where we
        condition on the earlier tosses, and our lab needs a fair coin for its exact chances.
      </p>
      <p>
        Second, the theorem is a statement about expected utility. If we don't accept expected utility as the standard, the colleague isn't
        making an error at all, only choosing differently, and loss aversion is a description rather than a mistake.
      </p>
      <p>
        And finally, years in the stock market aren't a fixed bet repeated. We choose how much to hold each year, and our wealth outside the market
        changes too. Samuelson took that up in 1969, showing that for a common family of utility functions the horizon doesn't change the share
        we should hold in stocks. That's where the case for more stocks when young has to find a different reason.
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
  :global(sub), :global(sup) {
    text-transform: none;
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
