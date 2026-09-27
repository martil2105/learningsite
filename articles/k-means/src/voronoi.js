/*
  The regions the assignment step carves out.

  A point is assigned to centroid i rather than j exactly when it is nearer to
  i, and "nearer" for squared Euclidean distance reduces to a linear condition:
  the boundary is the perpendicular bisector of the segment joining them. So
  cell i is an intersection of half-planes - a convex polygon - and the whole
  picture is a Voronoi diagram.

  That single fact is the article's second half. Every shape k-means cannot
  find is a shape you cannot cut out with straight lines through the midpoints
  between k centres.

  Built by clipping the plot rectangle against one bisector at a time
  (Sutherland-Hodgman). O(k^2) in the number of centroids, which for k <= 8 is
  not worth a smarter algorithm.
*/

// Keep the half-plane a*x + b*y <= c.
function clipHalfPlane(poly, a, b, c) {
  if (poly.length === 0) return poly;
  const out = [];
  const inside = (p) => a * p.x + b * p.y <= c + 1e-12;
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn !== prevIn) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const denom = a * dx + b * dy;
      if (Math.abs(denom) > 1e-12) {
        const t = (c - (a * prev.x + b * prev.y)) / denom;
        out.push({ x: prev.x + t * dx, y: prev.y + t * dy });
      }
    }
    if (curIn) out.push(cur);
  }
  return out;
}

/*
  One convex polygon per site, clipped to `bounds` = {x0, y0, x1, y1}.
  Coincident sites produce an empty polygon for the later one, which is correct:
  it owns nothing.
*/
export function voronoiCells(sites, bounds) {
  const rect = [
    { x: bounds.x0, y: bounds.y0 },
    { x: bounds.x1, y: bounds.y0 },
    { x: bounds.x1, y: bounds.y1 },
    { x: bounds.x0, y: bounds.y1 },
  ];
  return sites.map((s, i) => {
    let poly = rect;
    for (let j = 0; j < sites.length; j++) {
      if (j === i) continue;
      const o = sites[j];
      // |p - s|^2 <= |p - o|^2  <=>  2(o-s).p <= |o|^2 - |s|^2
      const a = 2 * (o.x - s.x);
      const b = 2 * (o.y - s.y);
      const c = o.x * o.x + o.y * o.y - (s.x * s.x + s.y * s.y);
      if (a === 0 && b === 0) {
        // Coincident with another site: the lower index keeps everything.
        if (j < i) poly = [];
        continue;
      }
      poly = clipHalfPlane(poly, a, b, c);
      if (poly.length === 0) break;
    }
    return poly;
  });
}

/*
  Cells come back in DATA coordinates, like the points they partition. Passing
  them to an <svg> without the plot transform draws a correct Voronoi diagram in
  the wrong place - and because data here runs 0-100 and the charts are 300-600px
  wide, "the wrong place" is a small tidy diagram in the top-left corner that
  looks like a deliberate inset. The `plot` argument is therefore required in
  practice; it is optional only so the function stays usable on screen-space
  polygons in tests.
*/
export const polygonPath = (poly, plot) => {
  if (!poly || poly.length === 0) return "";
  const X = plot ? plot.X : (v) => v;
  const Y = plot ? plot.Y : (v) => v;
  return "M " + poly.map((q) => X(q.x).toFixed(2) + " " + Y(q.y).toFixed(2)).join(" L ") + " Z";
};
