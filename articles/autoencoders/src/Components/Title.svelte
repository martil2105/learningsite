<section id="intro">
  <h1 id="intro-hed">Autoencoders</h1>
  <h1 class="intro-sub">
    If we squeeze data through a narrow layer and ask for it back, a linear
    autoencoder rediscovers principal component analysis. But it does so in an
    arbitrary basis, and it will never fix that, because nothing in the loss can
    tell the difference.
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
    /*
      Viewport-relative, not fixed. At a fixed 3.1rem the word AUTOENCODERS is
      about 410px wide and a 390px phone gets a horizontally scrolling page -
      which nothing else catches, because the heading does not overflow any
      BOX, it overflows the screen. This is a generator: the next title could be
      longer still, so the size has to come from the viewport rather than from a
      guess about how many letters a title has.
    */
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
