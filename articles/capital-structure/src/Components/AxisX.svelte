<script>
  // Bottom axis: tick values, a scale, a y position and an optional title.
  let { scale, ticks, y, format = (v) => v, title = "", height = 0 } = $props();
</script>

<g class="axis axis-x">
  <line x1={scale.range[0]} x2={scale.range[1]} y1={y} y2={y} />
  {#each ticks as t (t)}
    <g transform="translate({scale(t)},{y})">
      <line y2="5" />
      <text class="tick-label" y="18" text-anchor="middle">{format(t)}</text>
    </g>
  {/each}
  {#if title}
    <text class="axis-title" x={(scale.range[0] + scale.range[1]) / 2} y={y + 36} text-anchor="middle">{title}</text>
  {/if}
</g>
