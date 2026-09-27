# K-Means

An interactive visual essay on k-means clustering, in the MLU-Explain format.

**The hook:** three draggable centroids over 150 points, with the assign and
update steps split onto separate buttons so the reader can watch the objective
fall twice per round for two different reasons — and watch it rise when they
drag a centroid themselves, which is the fastest way to understand what the two
buttons are actually doing.

**The argument, in order:**

1. The search space is absurd and the problem is NP-hard, so nobody solves it.
2. Lloyd's algorithm is two exact minimisations of one objective, alternated.
   It always terminates. It is under no obligation to be right.
3. Where you start decides where you end — ~23% of random starts on this data
   converge to a fixed point 86% worse. k-means++ helps a little; restarts fix
   it; scikit-learn's default since 1.4 is one run.
4. Neither the elbow nor the silhouette can decline to answer: on 150 points of
   uniform noise the silhouette still names a best k.
5. Four shapes k-means cannot see — and in all four the grouping the data was
   generated from scores *worse* by the objective. It is not stuck; the optimum
   is not the structure.

## Running it

```
npm install
npm run dev        # http://localhost:5000, with livereload
npm run build      # production build into public/
npm run check      # re-derive every number in the prose
```

## Verifying

`verify/check-numbers.mjs` (`npm run check`) re-derives every figure the prose
quotes from the same modules the page imports, and asserts the *sentences* too:
that the trap preset converges sooner than the good one, that the silhouette
peaks where the text says, that the generated grouping scores worse than the
clustering in all four shapes. It runs on `src/*.js` directly with no build step.

`verify/check-browser.mjs` drives a served build with Playwright at 1280 and 390:
overflow, panel layout, unrendered LaTeX, console errors, and geometry
consistency — including that every rendered point sits inside the rendered cell
of its own colour. See the header of that file for how to run it.

`verify/_browser-check-bundle.tgz` is a disposable tarball of `public/`, used to
move a build to a machine that has Playwright. Safe to delete.

## Notes specific to this article

- **Every chart uses an equal aspect ratio** (`src/plot.js`). The whole article
  is an argument about Euclidean distance and perpendicular bisectors; stretching
  one axis would show the reader a geometry the algorithm is not using.
- **`voronoiCells` returns data coordinates.** `polygonPath(poly, plot)` needs
  the plot transform. Without it you get a correct Voronoi diagram drawn in the
  top-left corner of the chart, which looks deliberate and is not.
- k = 3 throughout the coloured figures, because the project has exactly three
  validated categorical colours. The choosing-k figure runs to k = 8 and so does
  not colour by cluster at all — the cells carry the clustering there.

Design system and article format from [MLU-Explain](https://mlu-explain.github.io/),
used under CC BY-SA 4.0. Writing, code and data are original.
