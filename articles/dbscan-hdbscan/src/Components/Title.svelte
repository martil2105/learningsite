<section id="intro">
  <h1 id="intro-hed">DBSCAN &amp; HDBSCAN</h1>
  <h1 class="intro-sub">
    A single <span class="mono">eps</span> is a horizontal line drawn across a
    tree. When the branches don't line up, no single line works, and as we'll
    see, no amount of tuning is going to produce one.
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
    Viewport-relative, and the coefficient is chosen for THIS title. The house
    default of 9.2vw was sized for a seven-letter word; sixteen characters at
    that rate overflow a 390px screen, and a heading overflows the SCREEN
    rather than any box, so nothing else catches it. verify/check-browser.mjs
    measures the rendered text with a Range.
  */
  #intro-hed {
    font-size: clamp(1.5rem, 6.4vw, 3.3rem);
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
    color: var(--squid-ink);
    text-align: center;
    margin: 1rem auto;
    opacity: 0.8;
    padding: 1.5rem 1rem;
    font-family: var(--font-main);
  }

  #intro__date {
    font-size: 1.05rem;
    margin: 0;
    margin-top: 5px;
    padding-bottom: 1rem;
    color: black;
    font-family: var(--font-main);
  }

  .mono { font-family: var(--font-mono, monospace); font-size: 0.92em; }

  @media screen and (max-width: 950px) {
    #intro-hed { letter-spacing: 0.5px; }
    .intro-sub { font-size: 1.12rem; padding: 1rem 0.5rem; }
  }
</style>
