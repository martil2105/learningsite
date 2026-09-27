<script>
  /*
    The hook. One manipulable object: the decoder vector.

    Everything on screen is a consequence of where it points. The reconstructions
    are its multiples, the residuals are what is left over, and the number
    underneath is the loss. Two things are meant to land, in this order:

      - the loss depends on the DIRECTION of the decoder and not on its length,
        which the reader can confirm by pressing a button that doubles it and
        watching nothing happen;
      - the direction that minimises the loss is the first principal direction,
        which is not a coincidence and is the whole article.

    The encoder is solved in closed form by default, because with it solved the
    picture becomes the picture of PCA - perpendicular drops onto a line - and
    the reader can see the two subjects are the same subject. Turning it off, or
    training it, tilts the residuals and raises the loss, which is the honest
    picture of what an untrained encoder costs.
  */
  import { onDestroy } from "svelte";
  import { scaleLinear } from "d3-scale";
  import { PLANE, PLANE_PCA, PLANE_EXT, PC1_ANGLE, ANGLE_CURVE, WORST_ANGLE_LOSS, num, deg } from "../experiments.js";
  import { optimalEncoder, loss as aeLoss, step as aeStep } from "../autoencoder.js";
  import { norm, matVec, angleBetween } from "../linalg.js";
  import { fitEqual, clipRayThroughOrigin } from "../plot.js";
  import { PCA, AE, ACCENT, SMILE, MUTED, FAINT, INK } from "../palette.js";

  const START_DEG = 74;
  const start = () => [2.4 * Math.cos((START_DEG * Math.PI) / 180), 2.4 * Math.sin((START_DEG * Math.PI) / 180)];

  let w2 = start();
  let w1 = [0.3, 0.1];
  let solveEncoder = true;
  let running = null;
  let dragging = false;
  let trainedSteps = 0;

  $: W2 = [[w2[0]], [w2[1]]];
  $: W1 = solveEncoder ? optimalEncoder(W2) : [w1];
  $: current = aeLoss(PLANE, W1, W2);
  $: recon = PLANE.map((x) => matVec(W2, matVec(W1, x)));
  $: len = norm(w2);
  $: product = norm(W1[0]) * len;
  $: angleDeg = ((Math.atan2(w2[1], w2[0]) * 180) / Math.PI + 360) % 180;
  $: offPC1 = Math.min(angleBetween(w2, PLANE_PCA.pc1), 180 - angleBetween(w2, PLANE_PCA.pc1));
  $: excess = current / PLANE_PCA.bestError - 1;

  /*
    Gradient descent with a backtracking step, and the reason is a bug worth
    recording. The curvature of this loss in the encoder scales with the SQUARE
    of the decoder's length, so a step size that is comfortable at |w2| = 1 is
    unstable at |w2| = 4.8 - which is exactly the state the reader is in after
    pressing "double the decoder" twice. With a fixed step the whole chart went
    to NaN and stayed there.

    Halving the step until the loss actually falls fixes it, costs nothing when
    the step was fine to begin with, and has the pleasant side effect of making
    the descent monotone, which is what the article claims is happening.
  */
  const BASE_LR = 0.03;
  function trainStep() {
    solveEncoder = false;
    const before = aeLoss(PLANE, [w1], W2);
    let lr = BASE_LR;
    for (let tries = 0; tries < 16; tries++) {
      const r = aeStep(PLANE, [w1], W2, lr);
      const n1 = [...r.W1[0]];
      const n2 = [r.W2[0][0], r.W2[1][0]];
      const after = aeLoss(PLANE, [n1], [[n2[0]], [n2[1]]]);
      if (Number.isFinite(after) && after <= before + 1e-12) {
        w1 = n1;
        w2 = n2;
        trainedSteps += 1;
        return;
      }
      lr /= 2;
    }
    stop(); // already at a point no step improves on
  }
  /*
    Rebalance the two factors before training, using the very invariance this
    article is about: scaling the encoder by `a` and the decoder by 1/a leaves
    the product, and therefore the loss, exactly unchanged. It is free.

    It is also necessary. The curvature of the loss in the encoder scales with
    the SQUARE of the decoder's length, so after the reader has stretched the
    decoder the problem is badly conditioned and gradient descent crawls -
    forty-five degrees of rotation in twelve seconds, measured. Balancing the
    two norms first fixes the conditioning at zero cost to the objective, which
    is a fair use of a symmetry the loss cannot see.
  */
  function rebalance() {
    const n1 = Math.hypot(w1[0], w1[1]);
    const n2 = Math.hypot(w2[0], w2[1]);
    if (n1 < 1e-9 || n2 < 1e-9) return;
    const a = Math.sqrt(n2 / n1);
    w1 = [w1[0] * a, w1[1] * a];
    w2 = [w2[0] / a, w2[1] / a];
  }

  function toggleRun() {
    if (running) {
      clearInterval(running);
      running = null;
      return;
    }
    solveEncoder = false;
    rebalance();
    running = setInterval(() => {
      for (let i = 0; i < 4; i++) trainStep();
      if (offPC1 < 0.02 && trainedSteps > 200) {
        clearInterval(running);
        running = null;
      }
    }, 40);
  }
  const stop = () => {
    if (running) clearInterval(running);
    running = null;
  };
  onDestroy(stop);

  function reset() {
    stop();
    w2 = start();
    w1 = [0.3, 0.1];
    solveEncoder = true;
    trainedSteps = 0;
  }
  function doubleDecoder() {
    stop();
    w2 = [w2[0] * 2, w2[1] * 2];
  }

  // ------------------------------------------------------------- layout
  let width = 320;
  $: W = Math.max(260, width);
  $: narrow = W < 520;
  $: H = narrow ? Math.max(250, Math.round(W * 0.82)) : 340;
  $: margin = { top: 10, right: 10, bottom: 10, left: 10 };
  $: p = fitEqual(PLANE_EXT, W, H, margin);
  $: r = narrow ? 2.3 : 2.9;

  // Both lines stop at the edge of the plot rather than running off into the
  // document; see the note on clipRayThroughOrigin in plot.js.
  $: lineEnds = clipRayThroughOrigin([w2[0] / len, w2[1] / len], PLANE_EXT);
  $: pc1Ends = clipRayThroughOrigin(PLANE_PCA.pc1, PLANE_EXT);

  // ------------------------------------------------------------- dragging
  let svgNode;
  function toData(event) {
    const rect = svgNode.getBoundingClientRect();
    const k = rect.width > 0 && W > 0 ? rect.width / W : 1;
    return { x: p.invX((event.clientX - rect.left) / k), y: p.invY((event.clientY - rect.top) / k) };
  }
  function onDown(event) {
    stop();
    dragging = true;
    event.target.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function onMove(event) {
    if (!dragging) return;
    const d = toData(event);
    if (Math.hypot(d.x, d.y) < 0.2) return; // a zero decoder has no direction
    w2 = [d.x, d.y];
  }
  const onUp = () => (dragging = false);
  function onKey(event) {
    const s = event.shiftKey ? 5 : 1;
    const map = { ArrowLeft: -s, ArrowRight: s, ArrowUp: s, ArrowDown: -s };
    const d = map[event.key];
    if (d === undefined) return;
    event.preventDefault();
    stop();
    const th = Math.atan2(w2[1], w2[0]) + (d * Math.PI) / 180;
    w2 = [len * Math.cos(th), len * Math.sin(th)];
  }

  // ------------------------------------------------------ the loss dial
  const DH = 62;
  $: dialW = Math.max(140, W - 8);
  $: xDeg = scaleLinear().domain([0, 180]).range([26, dialW - 6]);
  $: yLoss = scaleLinear().domain([0, WORST_ANGLE_LOSS * 1.05]).range([DH - 16, 12]);
  // Reactive: closes over the scales, which move with the measured width.
  $: dialPath = ANGLE_CURVE.map((q, i) => (i ? "L" : "M") + " " + xDeg(q.deg).toFixed(1) + " " + yLoss(q.loss).toFixed(1)).join(" ");
</script>

<div class="lab">
  <div class="measure" bind:clientWidth={width} />

  <div class="lab-head">
    <span class="lab-title">A two-to-one-to-two autoencoder</span>
    <span class="lab-sub">
      {#if running}training…{:else if trainedSteps}{trainedSteps} gradient steps{:else}drag the arrow{/if}
    </span>
  </div>

  <svg
    bind:this={svgNode}
    viewBox="0 0 {W} {H}"
    width={W}
    height={H}
    on:pointermove={onMove}
    on:pointerup={onUp}
    on:pointercancel={onUp}
  >
    <rect x={p.box.x} y={p.box.y} width={p.box.w} height={p.box.h} fill="#fbfcfd" stroke={FAINT} />

    <!-- the first principal direction, as a target the reader can aim at -->
    <line
      class="pc1"
      x1={p.X(pc1Ends[0][0])}
      y1={p.Y(pc1Ends[0][1])}
      x2={p.X(pc1Ends[1][0])}
      y2={p.Y(pc1Ends[1][1])}
    />

    <!-- the line every reconstruction must lie on -->
    <line
      class="span"
      x1={p.X(lineEnds[0][0])}
      y1={p.Y(lineEnds[0][1])}
      x2={p.X(lineEnds[1][0])}
      y2={p.Y(lineEnds[1][1])}
    />

    {#each PLANE as x, i}
      <line class="resid" x1={p.X(x[0])} y1={p.Y(x[1])} x2={p.X(recon[i][0])} y2={p.Y(recon[i][1])} />
    {/each}
    {#each PLANE as x}
      <circle cx={p.X(x[0])} cy={p.Y(x[1])} {r} fill={INK} fill-opacity="0.55" />
    {/each}
    {#each recon as q}
      <circle cx={p.X(q[0])} cy={p.Y(q[1])} r={r * 0.9} fill="none" stroke={AE} stroke-width="1.3" />
    {/each}

    <!-- the decoder itself -->
    <line class="w2" x1={p.X(0)} y1={p.Y(0)} x2={p.X(w2[0])} y2={p.Y(w2[1])} />
    <g
      class="handle"
      class:active={dragging}
      role="button"
      tabindex="0"
      aria-label="The decoder vector. Drag to point it, or use the arrow keys."
      on:pointerdown={onDown}
      on:keydown={onKey}
    >
      <circle cx={p.X(w2[0])} cy={p.Y(w2[1])} r="18" fill="transparent" />
      <circle cx={p.X(w2[0])} cy={p.Y(w2[1])} r="7" fill={ACCENT} stroke={dragging ? SMILE : "#ffffff"} stroke-width={dragging ? 3 : 2.2} />
    </g>
    <circle cx={p.X(0)} cy={p.Y(0)} r="2.6" fill={INK} />
  </svg>

  <svg class="dial" viewBox="0 0 {dialW} {DH}" width={dialW} height={DH}>
    <text class="dial-label" x="4" y="9">loss</text>
    <path class="dial-curve" d={dialPath} />
    <line class="dial-best" x1={xDeg(PC1_ANGLE)} x2={xDeg(PC1_ANGLE)} y1={yLoss(0)} y2="10" />
    <circle cx={xDeg(angleDeg)} cy={yLoss(Math.min(current, WORST_ANGLE_LOSS * 1.05))} r="4.2" fill={SMILE} stroke="#fff" stroke-width="1.4" />
    <line class="dial-axis" x1="26" x2={dialW - 6} y1={yLoss(0)} y2={yLoss(0)} />
    {#each [0, 45, 90, 135, 180] as t}
      <text
        class="dial-tick"
        x={xDeg(t)}
        y={DH - 3}
        text-anchor={t === 0 ? "start" : t === 180 ? "end" : "middle"}
      >{t}°</text>
    {/each}
    <text class="dial-tick best" x={xDeg(PC1_ANGLE)} y="8" text-anchor="middle">{deg(PC1_ANGLE)}</text>
  </svg>

  <div class="readout">
    <div class="stat">
      <span class="stat-label">reconstruction error</span>
      <span class="stat-value">{num(current, 3)}</span>
      <span class="stat-note">best possible {num(PLANE_PCA.bestError, 3)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">off the first principal direction</span>
      <span class="stat-value" class:good={offPC1 < 0.6}>{deg(offPC1)}</span>
      <span class="stat-note">{excess < 0.002 ? "at the optimum" : "+" + (100 * excess).toFixed(1) + "% error"}</span>
    </div>
    <div class="stat">
      <span class="stat-label">decoder length</span>
      <span class="stat-value muted">{num(len, 2)}</span>
      <span class="stat-note">changes nothing{solveEncoder ? "" : " once the encoder catches up"}</span>
    </div>
  </div>

  <div class="controls">
    <button class="primary" on:click={toggleRun}>{running ? "Stop" : "Train both by gradient descent"}</button>
    <button class="ghost" on:click={doubleDecoder}>Double the decoder</button>
    <button class="ghost" on:click={reset}>Reset</button>
  </div>

  <label class="check">
    <input type="checkbox" bind:checked={solveEncoder} on:change={stop} />
    solve the encoder exactly for whatever the decoder is
  </label>

  <p class="caption">
    {#if solveEncoder}
      With the encoder solved, every point drops onto the line at a right angle
      and the error depends on the line's <em>direction</em> alone — press
      <em>double the decoder</em> and watch every digit stay where it is.
    {:else}
      The encoder is now a free parameter and no longer matched to the decoder,
      so the drops are slanted and the error is above the curve. Training brings
      the two back into agreement.
    {/if}
  </p>
</div>

<style>
  .lab {
    max-width: 620px;
    margin: 2rem auto 1rem auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1rem 1rem 0.9rem 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  }

  .measure {
    width: 100%;
    height: 0;
  }

  svg {
    max-width: 100%;
    display: block;
    touch-action: none;
  }

  .lab-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }

  .lab-title {
    font-family: var(--font-main);
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--squidink);
  }

  .lab-sub {
    font-family: var(--font-mono, monospace);
    font-size: 0.73rem;
    color: #718096;
  }

  .pc1 {
    stroke: #df2a5d;
    stroke-width: 1.6;
    stroke-dasharray: 5 4;
    opacity: 0.55;
  }

  .span {
    stroke: #7c5aed;
    stroke-width: 1.4;
    opacity: 0.6;
  }

  .resid {
    stroke: #9aa5b1;
    stroke-width: 1;
    opacity: 0.6;
  }

  .w2 {
    stroke: #7c5aed;
    stroke-width: 3;
  }

  .handle {
    cursor: grab;
  }

  .handle.active {
    cursor: grabbing;
  }

  .handle:focus {
    outline: none;
  }

  .handle:focus-visible > circle:last-child {
    stroke: #ff9900;
    stroke-width: 3.2;
  }

  .dial {
    margin-top: 0.3rem;
  }

  .dial-curve {
    fill: none;
    stroke: #232f3e;
    stroke-width: 1.4;
    opacity: 0.5;
  }

  .dial-best {
    stroke: #df2a5d;
    stroke-width: 1.2;
    stroke-dasharray: 3 3;
  }

  .dial-axis {
    stroke: #b6bfcc;
  }

  .dial-label,
  .dial-tick {
    font-family: var(--font-main);
    font-size: 9.5px;
    fill: #9aa5b1;
  }

  .dial-tick.best {
    fill: #df2a5d;
    font-weight: 700;
  }

  .readout {
    display: flex;
    flex-wrap: wrap;
    gap: 1.1rem;
    margin: 0.5rem 0 0.6rem 0;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .stat-label {
    font-family: var(--font-main);
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: #9aa5b1;
  }

  .stat-value {
    font-family: var(--font-mono, monospace);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--squidink);
    font-variant-numeric: tabular-nums;
  }

  .stat-value.good {
    color: #2f7d32;
  }

  .stat-value.muted {
    color: #718096;
  }

  .stat-note {
    font-family: var(--font-main);
    font-size: 0.7rem;
    color: #9aa5b1;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  button {
    font-family: var(--font-main);
    font-size: 0.82rem;
    border-radius: 6px;
    cursor: pointer;
    padding: 0.42rem 0.8rem;
    border: 1px solid #cbd5e0;
    background: #ffffff;
    color: var(--squidink);
  }

  button:hover {
    border-color: var(--violet);
  }

  .primary {
    background: var(--violet);
    border-color: var(--violet);
    color: #ffffff;
    font-weight: 700;
  }

  .primary:hover {
    background: #6a49dd;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.55rem;
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #4a5568;
    cursor: pointer;
  }

  .check input {
    accent-color: var(--violet);
  }

  .caption {
    font-family: var(--font-main);
    font-size: 0.8rem;
    line-height: 1.5;
    color: #718096;
    margin: 0.6rem 0 0.2rem 0;
  }

  @media screen and (max-width: 950px) {
    .lab {
      max-width: 92%;
      padding: 0.75rem;
    }

    .stat-value {
      font-size: 1rem;
    }

    .readout {
      gap: 0.8rem;
    }
  }
</style>
