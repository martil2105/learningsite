<section id="intro">
  <h1 id="intro-hed">SMOTE</h1>
  <h1 class="intro-sub">
    The whole algorithm fits on one line: put a new minority point somewhere on
    the segment between two existing ones. That line makes a claim about
    everything in between, and as we'll see, it's the only thing the method
    knows.
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

  #intro-hed {
    /* Viewport-relative rather than fixed: a title's width is a property of the
       title, and this is a generator. */
    font-size: clamp(1.85rem, 9.2vw, 4rem);
    margin-top: 5px;
    margin-bottom: 0;
    letter-spacing: 2px;
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

  @media screen and (max-width: 950px) {
    #intro-hed {
      letter-spacing: 0.5px;
    }

    .intro-sub {
      font-size: 1.12rem;
      padding: 1rem 0.5rem;
    }
  }
</style>
