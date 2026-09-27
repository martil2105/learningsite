<script>
  /* Title.svelte */
</script>

<section id="intro">
  <h1 id="intro-hed">Gini and the Lorenz curve</h1>
  <h1 class="intro-sub">
    The Gini coefficient squeezes a whole distribution into one number. As
    we'll see, two societies, or two credit scorecards, can share that number
    and still differ in the places we care about most.
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
    Viewport-relative, sized for THIS title: "Gini and the Lorenz curve" is 25
    characters in uppercase Inter Heavy. It holds one line on a desktop and
    breaks into two balanced lines on a phone, where one line would need a
    font smaller than the body text. check-browser.mjs measures it at 390px.
  */
  #intro-hed {
    font-size: clamp(1.5rem, 6.4vw, 2.4rem);
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
