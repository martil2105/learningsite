<script>
  /*
    PaperCard.svelte: the citation block that opens every paper explainer,
    directly under the title. The citation, then three short paragraphs in
    the house voice: what the paper claims, what the article rebuilds, and
    what later work made of it. The words live in App.svelte as snippets so
    the prose gate reads them with the rest of the page.
  */
  let { cite, claims, rebuild, later, link = "" } = $props();
</script>

<aside class="paper-card" id="paper">
  <p class="paper-label">The paper</p>
  <p class="paper-cite">{@render cite()}</p>
  <p><span class="bold">What it claims.</span> {@render claims()}</p>
  <p><span class="bold">What we rebuild.</span> {@render rebuild()}</p>
  <p><span class="bold">What came later.</span> {@render later()}</p>
  {#if link}<p class="paper-link"><a href={link}>Where to find the paper</a></p>{/if}
</aside>

<style>
  .paper-card {
    max-width: 640px;
    margin: 1.5rem auto 2.5rem auto;
    padding: 1.1rem 1.3rem;
    border-left: 4px solid var(--ink);
    background: var(--panel);
  }
  .paper-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 0.4rem 0;
  }
  .paper-cite { font-size: 1rem; line-height: 1.5; margin: 0 0 0.8rem 0; }
  .paper-card p { font-size: 0.95rem; line-height: 1.55; margin: 0 0 0.6rem 0; }
  .paper-card p:last-child { margin-bottom: 0; }
  .paper-link { font-size: 0.85rem; }
  @media screen and (max-width: 620px) {
    .paper-card { margin: 1rem 1rem 2rem 1rem; padding: 0.9rem 1rem; }
  }
</style>
