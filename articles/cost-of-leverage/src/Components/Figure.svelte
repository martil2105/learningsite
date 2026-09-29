<script>
  /*
    Figure.svelte: the house card around every figure in the finance articles.
    A sentence-case title, an optional one-line instruction, the figure itself
    at a clamped measured width, and a caption snippet (a <p class="caption">
    written in App.svelte, so the prose gate reads it).
  */
  import { clampW } from "../chart.js";
  let { id = "", title = "", sub = "", children, caption } = $props();
  let box = $state(0);
  let w = $derived(clampW(Math.floor(box)));
</script>

<div class="card fin-card" {id}>
  {#if title}
    <div class="card-header">
      <h3 class="card-title">{title}</h3>
      {#if sub}<p class="card-sub">{sub}</p>{/if}
    </div>
  {/if}
  <div class="measure-box" bind:clientWidth={box}>
    <div class="zero"></div>
    {#if box > 0}{@render children(w)}{/if}
  </div>
  {#if caption}{@render caption()}{/if}
</div>

<style>
  .card {
    border: 2px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2rem 0;
    background: #fff;
  }
  .card-header { margin-bottom: 1rem; }
  .card-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 0.4rem 0; line-height: 1.3; }
  .card-sub { font-size: 0.95rem; line-height: 1.5; margin: 0; opacity: 0.85; }
  .measure-box { width: 100%; }
  .zero { height: 0; }
  :global(.fin-card .caption) { font-size: 0.85rem; line-height: 1.5; opacity: 0.8; margin: 0.8rem 0 0 0; }
  @media screen and (max-width: 620px) {
    .card { padding: 1rem; }
  }
</style>
