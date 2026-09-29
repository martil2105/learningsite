// Tiny scale and tick helpers, dependency-free.
export function linear([d0, d1], [r0, r1]) {
  const k = (r1 - r0) / (d1 - d0 || 1);
  const f = (x) => r0 + (x - d0) * k;
  f.invert = (y) => d0 + (y - r0) / k;
  f.domain = [d0, d1];
  f.range = [r0, r1];
  return f;
}

export function log10Scale([d0, d1], [r0, r1]) {
  const l0 = Math.log10(d0), l1 = Math.log10(d1);
  const k = (r1 - r0) / (l1 - l0);
  const f = (x) => r0 + (Math.log10(x) - l0) * k;
  f.invert = (y) => Math.pow(10, l0 + (y - r0) / k);
  f.domain = [d0, d1];
  f.range = [r0, r1];
  return f;
}

export function niceStep(span, count) {
  const raw = span / Math.max(1, count);
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
}

export function ticks(d0, d1, count = 5) {
  const lo = Math.min(d0, d1), hi = Math.max(d0, d1);
  const step = niceStep(hi - lo, count);
  const out = [];
  const start = Math.ceil(lo / step - 1e-9) * step;
  for (let v = start; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(12));
  return out;
}

export function logTicks(d0, d1) {
  const out = [];
  for (let e = Math.floor(Math.log10(d0)); e <= Math.ceil(Math.log10(d1)); e++) {
    const v = Math.pow(10, e);
    if (v >= d0 * 0.999 && v <= d1 * 1.001) out.push(v);
  }
  return out;
}

export function path(points) {
  let d = "";
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    d += (d ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
  }
  return d;
}
