// A path through [t, v] points, cut exactly where it leaves [lo, hi] in v and
// resumed where it comes back, never clamped along the edge (house rule: draw
// only inside the window). x and y map t and v to pixels.
export function clippedPath(pts, x, y, lo, hi) {
  let d = "", pen = false;
  const P = (t, v) => `${x(t).toFixed(2)} ${y(v).toFixed(2)}`;
  for (let i = 0; i < pts.length; i++) {
    const [t, v] = pts[i];
    const inside = Number.isFinite(v) && v >= lo && v <= hi;
    if (i > 0) {
      const [t0, v0] = pts[i - 1];
      const wasInside = Number.isFinite(v0) && v0 >= lo && v0 <= hi;
      if (inside !== wasInside && Number.isFinite(v0) && Number.isFinite(v)) {
        const edge = (inside ? v0 : v) > hi ? hi : lo;
        const f = (edge - v0) / (v - v0);
        d += `${inside ? "M" : "L"} ${P(t0 + f * (t - t0), edge)} `;
        pen = inside;
      }
    }
    if (inside) {
      d += `${pen ? "L" : "M"} ${P(t, v)} `;
      pen = true;
    } else pen = false;
  }
  return d.trim();
}
