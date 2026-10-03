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
