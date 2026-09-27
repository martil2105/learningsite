<section id="intro">
  <h1 id="intro-hed">Supply and demand</h1>
  <h1 class="intro-sub">
    A line fitted through a market's prices and quantities is almost never the
    demand curve. As we'll see, it's a mix of demand and supply, and the R²
    that seems to say how good the fit is also says, exactly, how little the
    data can tell us about demand.
  </h1>
  <h3 id="intro__date">Martin Le, September 2026</h3>
</section>

<style>
  #intro {
    max-width: 680px;
    margin: 1rem auto;
    text-align: center;
    padding: 1rem 1rem 0 1rem;
  }

  /*
    Viewport-relative, sized for THIS title: "Supply and demand" is seventeen
    characters in uppercase Inter Heavy, and text-wrap: balance keeps the
    lines even if it wraps on a phone. check-browser.mjs measures the widest
    rendered line with a Range at 390px.
  */
  #intro-hed {
    font-size: clamp(1.5rem, 6.4vw, 3rem);
    line-height: 1.12;
    margin: 5px auto 0 auto;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    max-width: 100%;
    text-wrap: balance;
    color: var(--squid-ink);
  }

  .intro-sub {
    text-wrap: balance;
    font-family: var(--font-main);
    font-size: 1.3rem;
    line-height: 1.55;
    font-weight: 400;
    max-width: 640px;
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
    #intro-hed {
      letter-spacing: 0.6px;
    }

    .intro-sub {
      font-size: 1.08rem;
    }
  }
</style>