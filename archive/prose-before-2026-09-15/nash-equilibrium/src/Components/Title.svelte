<section id="intro">
  <h1 id="intro-hed">Nash equilibrium</h1>
  <h1 class="intro-sub">
    You were taught to find it by checking each cell of a payoff matrix. One
    game in eight has no cell that survives — and in those games your own
    behaviour is decided entirely by the other player's payoffs, which is why
    raising a penalty does not reduce the thing it punishes.
  </h1>
  <h3 id="intro__date">Martin Le, September 2026</h3>
</section>

<style>
  #intro {
    max-width: 680px;
    margin: 1rem auto;
    text-align: center;
    padding-top: 1rem;
  }

  /*
    Viewport-relative, and the coefficient is for THIS title. "Nash equilibrium"
    is sixteen characters including the space; the house default of 9.2vw was
    sized for seven, and a heading overflows the SCREEN rather than any box, so
    nothing else would catch it. check-browser.mjs measures the rendered text
    with a Range at 390px.
  */
  #intro-hed {
    font-size: clamp(1.4rem, 5.9vw, 3.2rem);
    margin-top: 5px;
    margin-bottom: 0;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    max-width: 100%;
    margin: auto;
    color: var(--squid-ink);
  }

  .intro-sub {
    text-wrap: balance;
    font-size: 1.35rem;
    line-height: 1.55;
    font-weight: 400;
    max-width: 620px;
    margin: 1.1rem auto 0 auto;
  }

  #intro__date {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 0.9rem;
    color: #8a94a2;
    margin-top: 1.2rem;
  }

  @media screen and (max-width: 620px) {
    .intro-sub {
      font-size: 1.1rem;
      padding: 0 1rem;
    }
  }
</style>
