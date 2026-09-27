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
