/*
  Marching squares, for one threshold.

  Two things on this page are regions rather than points - "where is fraud the
  denser class" and "where does the classifier say fraud" - and a region drawn
  as a few thousand little rectangles is both slow and ugly. This turns a
  scalar field into closed polylines instead.

  Returns polylines in GRID coordinates: i in [0, nx-1], j in [0, ny-1],
  fractional. Callers map them into data or screen units themselves - the
  transform is never applied here, because a helper that silently defaults to
  the identity is how the k-means article ended up drawing a Voronoi diagram in
  data units inside a chart measured in pixels.
*/

// Where along the edge from value a to value b the field crosses t.
const cut = (a, b, t) => (Math.abs(b - a) < 1e-30 ? 0.5 : (t - a) / (b - a));

export function marchingSquares(field, nx, ny, t) {
  const at = (i, j) => field[j * nx + i];
  const segs = [];

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const v00 = at(i, j);
      const v10 = at(i + 1, j);
      const v11 = at(i + 1, j + 1);
      const v01 = at(i, j + 1);
      let code = 0;
      if (v00 > t) code |= 1;
      if (v10 > t) code |= 2;
      if (v11 > t) code |= 4;
      if (v01 > t) code |= 8;
      if (code === 0 || code === 15) continue;

      // Crossing points on the four edges, in grid coordinates.
      const B = [i + cut(v00, v10, t), j];
      const R = [i + 1, j + cut(v10, v11, t)];
      const T = [i + cut(v01, v11, t), j + 1];
      const L = [i, j + cut(v00, v01, t)];

      // Segments oriented so the region above the threshold is on the left,
      // which is what lets the stitched rings be filled with a nonzero rule.
      const push = (a, b) => segs.push([a, b]);
      switch (code) {
        case 1: push(L, B); break;
        case 2: push(B, R); break;
        case 3: push(L, R); break;
        case 4: push(R, T); break;
        case 6: push(B, T); break;
        case 7: push(L, T); break;
        case 8: push(T, L); break;
        case 9: push(T, B); break;
        case 11: push(T, R); break;
        case 12: push(R, L); break;
        case 13: push(R, B); break;
        case 14: push(B, L); break;
        // The two saddles. Resolved with the cell's mean, which is the usual
        // choice and the only one that keeps the rings from crossing.
        case 5: {
          const mid = (v00 + v10 + v11 + v01) / 4;
          if (mid > t) { push(L, T); push(R, B); } else { push(L, B); push(R, T); }
          break;
        }
        case 10: {
          const mid = (v00 + v10 + v11 + v01) / 4;
          if (mid > t) { push(T, R); push(B, L); } else { push(T, L); push(B, R); }
          break;
        }
      }
    }
  }
  return stitch(segs);
}

/* Chain the segments into polylines, joining on shared endpoints. */
function stitch(segs) {
  const key = (p) => p[0].toFixed(6) + "," + p[1].toFixed(6);
  const starts = new Map();
  for (const s of segs) {
    const k = key(s[0]);
    if (!starts.has(k)) starts.set(k, []);
    starts.get(k).push(s);
  }
  const used = new Set();
  const lines = [];

  for (const s0 of segs) {
    if (used.has(s0)) continue;
    used.add(s0);
    const line = [s0[0], s0[1]];
    let cur = s0[1];
    // Follow forwards until the ring closes or the chain runs into the border.
    for (let guard = 0; guard < segs.length + 2; guard++) {
      const next = (starts.get(key(cur)) || []).find((s) => !used.has(s));
      if (!next) break;
      used.add(next);
      line.push(next[1]);
      cur = next[1];
      if (key(cur) === key(line[0])) break;
    }
    /*
      Fragments. A ring that a saddle cell split, or a two-segment sliver where
      the field grazes the threshold, is not a feature of the data at this grid
      resolution - it is an artefact of resolving it. Anything under a handful
      of points AND smaller than a couple of cells goes.
    */
    if (line.length <= 2) continue;
    const xs = line.map((p) => p[0]);
    const ys = line.map((p) => p[1]);
    const span = Math.max(...xs) - Math.min(...xs) + (Math.max(...ys) - Math.min(...ys));
    if (line.length < 6 && span < 2.5) continue;
    lines.push(line);
  }
  return lines;
}

/*
  Sample a scalar function on a regular grid over a data extent, and return the
  contour at `t` already mapped back into DATA coordinates.
*/
export function contourOf(fn, ext, n, t, { closeAtBorder = true } = {}) {
  const field = new Float64Array(n * n);
  const gx = (i) => ext.x0 + ((ext.x1 - ext.x0) * i) / (n - 1);
  const gy = (j) => ext.y0 + ((ext.y1 - ext.y0) * j) / (n - 1);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) field[j * n + i] = fn([gx(i), gy(j)]);

  /*
    A region that runs off the edge of the grid produces an OPEN chain, and an
    open chain drawn as a filled path gets closed by a straight chord back to
    its start - which can cut clean across the chart. Holding the outermost ring
    of samples below the threshold makes every contour close just inside the
    window instead, which is also what the picture should show: the region is
    clipped by the window, not ended by it.
  */
  if (closeAtBorder) {
    let lo = Infinity;
    for (let i = 0; i < field.length; i++) if (field[i] < lo) lo = field[i];
    const off = Math.min(lo, t) - Math.max(1, Math.abs(t)) * 1e3 - 1e3;
    for (let i = 0; i < n; i++) {
      field[i] = off;
      field[(n - 1) * n + i] = off;
      field[i * n] = off;
      field[i * n + (n - 1)] = off;
    }
  }
  return marchingSquares(field, n, n, t).map((line) =>
    line.map(([i, j]) => [
      ext.x0 + ((ext.x1 - ext.x0) * i) / (n - 1),
      ext.y0 + ((ext.y1 - ext.y0) * j) / (n - 1),
    ])
  );
}
