<script>
  /* Title.svelte */
</script>

<section id="intro">
  <h1 id="intro-hed">Put–call parity</h1>
  <h1 class="intro-sub">
    A call minus a put is a forward, whatever model of the share we believe. Let's see what that lets us read off option prices, and what
    Palm's options said in March 2000.
  </h1>
  <h3 id="intro__date">Martin Le, October 2026</h3>
</section>

<style>
  #intro {
    max-width: 680px;
    margin: 1rem auto;
    text-align: center;
    padding: 1rem 1rem 0 1rem;
  }
  #intro-hed {
    font-size: clamp(1.4rem, 6vw, 2.8rem);
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
    #intro-hed { letter-spacing: 0.6px; }
    .intro-sub { font-size: 1.08rem; }
  }
</style>
