<section id="intro">
  <h1 id="intro-hed">Economic rent</h1>
  <h1 class="intro-sub">
    Seven technologies can do the same job. The rectangle test from first
    courses in economics rules out two of them and leaves a sensible-looking
    middle option standing, and yet there's no price at which that option is
    the cheapest way to do the job. Along the way, we'll meet economic rent, the
    reward for being temporarily different, and see why the competition that
    competes it away is also what spreads the innovation.
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
    Viewport-relative, sized for THIS title: "Economic rent" is fourteen
    characters in uppercase Inter Heavy, so it holds one line down to a phone,
    and text-wrap: balance keeps any wrapped lines even. check-browser.mjs
    measures the widest rendered line with a Range at 390px.
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