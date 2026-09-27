<script>
  /*
    Scrollytelling container, after Russell Goldenberg's original
    (https://twitter.com/codenberg/status/1432774653139984387), ported to runes.

    It reports which of its direct children is most in view:

      <Scrolly bind:value={stepIndex}>
        <div>step 0</div>
        <div>step 1</div>
      </Scrolly>

    Svelte 5 notes: `value` is $bindable so the parent can bind to it, children
    arrive as a snippet rather than a <slot>, and the observers are rebuilt in an
    $effect keyed on top/bottom instead of `$: top, bottom, update()`.
  */
  import { onMount } from "svelte";

  let {
    root = null,
    top = 0,
    bottom = 0,
    increments = 100,
    value = $bindable(undefined),
    children,
  } = $props();

  const steps = [];
  const threshold = [];

  let nodes = [];
  let observers = [];
  let container;

  const mostInView = () => {
    let maxRatio = 0;
    let maxIndex = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i] > maxRatio) {
        maxRatio = steps[i];
        maxIndex = i;
      }
    }
    value = maxRatio > 0 ? maxIndex : undefined;
  };

  const createObserver = (node, index) => {
    const handleIntersect = (e) => {
      steps[index] = e[0].intersectionRatio;
      mostInView();
    };

    const rootMargin = `${top ? -top : 0}px 0px ${bottom ? -bottom : 0}px 0px`;
    if (observers[index]) observers[index].disconnect();
    const io = new IntersectionObserver(handleIntersect, { root, rootMargin, threshold });
    io.observe(node);
    observers[index] = io;
  };

  const update = () => {
    if (!nodes.length) return;
    nodes.forEach(createObserver);
  };

  onMount(() => {
    for (let i = 0; i < increments + 1; i++) threshold.push(i / increments);
    nodes = container.querySelectorAll(":scope > *");
    update();
    return () => observers.forEach((io) => io && io.disconnect());
  });

  $effect(() => {
    top;
    bottom;
    update();
  });
</script>

<div bind:this={container}>
  {@render children?.()}
</div>
