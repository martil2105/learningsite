/*
  Fitting a dataset into a chart box with EQUAL SCALE on both axes.

  This is not a stylistic preference. Every claim in this article is about
  Euclidean distance, and the picture is the argument: the boundary between two
  clusters is the perpendicular bisector of the segment joining their
  centroids. Stretch one axis relative to the other and that boundary stops
  looking perpendicular, circular clusters come out elliptical, and the reader
  is being shown a geometry the algorithm is not using.

  So the data extent is letterboxed into the box rather than stretched to fill
  it, and the leftover space is split evenly.
*/
export function fitEqual(ext, width, height, margin) {
  const plotW = Math.max(10, width - margin.left - margin.right);
  const plotH = Math.max(10, height - margin.top - margin.bottom);
  const dx = ext.x1 - ext.x0;
  const dy = ext.y1 - ext.y0;
  const s = Math.min(plotW / dx, plotH / dy);
  const offX = margin.left + (plotW - dx * s) / 2;
  const offY = margin.top + (plotH - dy * s) / 2;

  const X = (x) => offX + (x - ext.x0) * s;
  // Screen y grows downward; data y grows upward.
  const Y = (y) => offY + (ext.y1 - y) * s;

  return {
    X,
    Y,
    scale: s,
    // Data units back out of screen units, for pointer input.
    invX: (px) => ext.x0 + (px - offX) / s,
    invY: (py) => ext.y1 - (py - offY) / s,
    // The drawn area, for clipping and for the card border.
    box: { x: offX, y: offY, w: dx * s, h: dy * s },
    // A length in data units as a length on screen.
    len: (d) => d * s,
  };
}

/*
  Clip a line through the origin, in the direction u, to the data extent.

  Drawing it as "the origin plus or minus some large number times u" is the
  obvious thing and it is wrong: the endpoints land outside the chart, the SVG
  clips them visually so nothing looks amiss, and the geometry of the document
  quietly reports a page wider than the viewport. Solve for where the ray
  actually meets each face instead and stop there.

  Assumes the origin is inside `ext`, which is true wherever this is used: the
  data is centred and the extent is padded outwards from it.
*/
export function clipRayThroughOrigin(u, ext) {
  const ts = [];
  if (Math.abs(u[0]) > 1e-12) ts.push(ext.x1 / u[0], ext.x0 / u[0]);
  if (Math.abs(u[1]) > 1e-12) ts.push(ext.y1 / u[1], ext.y0 / u[1]);
  const pos = ts.filter((t) => t > 0);
  const neg = ts.filter((t) => t < 0);
  const a = neg.length ? Math.max(...neg) : 0;
  const b = pos.length ? Math.min(...pos) : 0;
  return [
    [u[0] * a, u[1] * a],
    [u[0] * b, u[1] * b],
  ];
}
