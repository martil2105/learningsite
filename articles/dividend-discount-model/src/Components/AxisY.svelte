<script>
  // Left axis with light gridlines across to x1.
  let { scale, ticks, x0, x1, format = (v) => v, title = "" } = $props();
</script>

<g class="axis axis-y">
  {#each ticks as t (t)}
    <g class="grid"><line x1={x0} x2={x1} y1={scale(t)} y2={scale(t)} /></g>
    <text class="tick-label" x={x0 - 6} y={scale(t) + 4} text-anchor="end">{format(t)}</text>
  {/each}
  {#if title}
    <text class="axis-title" transform="translate({x0 - 44},{(scale.range[0] + scale.range[1]) / 2}) rotate(-90)" text-anchor="middle">{title}</text>
  {/if}
</g>
