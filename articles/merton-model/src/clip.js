/*
  Cut a polyline at the top of a chart window, so nothing is drawn above it.
  Points are [x, y] in data units with y rising upwards; the line stops where
  it first crosses ymax, at the interpolated crossing.
*/
export function clipTop(points, ymax) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (!Number.isFinite(y)) break;
    if (y <= ymax) { out.push([x, y]); continue; }
    if (i > 0) {
      const [x0, y0] = points[i - 1];
      if (y0 <= ymax) out.push([x0 + ((ymax - y0) / (y - y0)) * (x - x0), ymax]);
    }
    break;
  }
  return out;
}

/*
  A polyline in screen units cut to a horizontal band [top, bottom]: the
  parts outside are left out and each crossing is interpolated, so the path
  string never reaches outside the plot (a clipPath would hide the overhang
  but still widen the path's box).
*/
export function bandPath(points, top, bottom) {
  let d = "", open = false;
  const inside = (y) => y >= top && y <= bottom;
    for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (!Number.isFinite(y)) { open = false; continue; }
    if (i > 0) {
      const [x0, y0] = points[i - 1];
      if (inside(y0) !== inside(y)) {
        const e = inside(y0) ? (y < top ? top : bottom) : (y0 < top ? top : bottom);
        const xe = x0 + ((e - y0) / (y - y0)) * (x - x0);
        if (inside(y0)) { d += `L${xe.toFixed(1)},${e.toFixed(1)}`; open = false; }
        else { d += `M${xe.toFixed(1)},${e.toFixed(1)}`; open = true; }
      } else if (!inside(y0) && !inside(y) && (y0 < top) !== (y < top)) {
        // jumps straight across the band in one step: draw the chord inside
        const xa = x0 + ((top - y0) / (y - y0)) * (x - x0), xb = x0 + ((bottom - y0) / (y - y0)) * (x - x0);
        const [p, q] = y0 < top ? [[xa, top], [xb, bottom]] : [[xb, bottom], [xa, top]];
        d += `M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`;
        open = false;
      }
    }
    if (inside(y)) { d += `${open ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; open = true; }
  }
  return d;
}
