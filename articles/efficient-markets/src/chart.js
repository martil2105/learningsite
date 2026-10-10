/*
  Small chart helpers. Fourteen figures share them, which is the point: the
  alternative is fourteen copies of the same off-by-one.

  Nothing here closes over a Svelte reactive variable - the transforms are
  built from arguments and returned, so a component can declare
  `$: x = linear(...)` and dirty tracking works. A helper defined as a `const`
  that reads a `$:` value is invisible to Svelte and is the worst bug this
  project has found; see reference/house-idioms.md.
*/

export function linear(d0, d1, r0, r1) {
  const span = d1 - d0 || 1;
  const f = (v) => r0 + ((v - d0) / span) * (r1 - r0);
  f.invert = (p) => d0 + ((p - r0) / (r1 - r0)) * span;
  f.domain = [d0, d1];
  f.range = [r0, r1];
  return f;
}

export function log(d0, d1, r0, r1) {
  const l0 = Math.log(d0), l1 = Math.log(d1);
  const f = (v) => r0 + ((Math.log(Math.max(1e-12, v)) - l0) / (l1 - l0)) * (r1 - r0);
  f.invert = (p) => Math.exp(l0 + ((p - r0) / (r1 - r0)) * (l1 - l0));
  f.domain = [d0, d1];
  f.range = [r0, r1];
  return f;
}

/* Round decimal ticks inside [d0, d1], at most `count` of them. */
export function ticks(d0, d1, count = 5) {
  const span = d1 - d0;
  if (!(span > 0)) return [d0];
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const out = [];
  for (let v = Math.ceil(d0 / step) * step; v <= d1 + step * 1e-9; v += step) {
    out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  }
  return out;
}

/* Powers of ten, and their 2s and 5s, inside a log range. */
export function logTicks(d0, d1, dense = false) {
  const out = [];
  const mults = dense ? [1, 2, 5] : [1];
  for (let e = Math.floor(Math.log10(d0)); e <= Math.ceil(Math.log10(d1)); e++) {
    for (const m of mults) {
      const v = m * Math.pow(10, e);
      if (v >= d0 * 0.999 && v <= d1 * 1.001) out.push(v);
    }
  }
  return out;
}

/* A compact axis label: 180, 2.6k, 44k, 1M. */
export function shortN(v) {
  if (v >= 1e6) return (v / 1e6 === Math.round(v / 1e6) ? v / 1e6 : (v / 1e6).toFixed(1)) + "M";
  if (v >= 1000) return (v / 1000 === Math.round(v / 1000) ? v / 1000 : (v / 1000).toFixed(1)) + "k";
  return String(Math.round(v));
}

/* A path through points already in screen units. */
export const pathOf = (pts) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");

/* A closed area between a curve and a baseline y. */
export const areaOf = (pts, y0) =>
  pts.length ? pathOf(pts) + ` L ${pts[pts.length - 1][0].toFixed(2)} ${y0.toFixed(2)} L ${pts[0][0].toFixed(2)} ${y0.toFixed(2)} Z` : "";

/* A band between two curves sharing x. */
export function bandOf(xs, los, his) {
  const up = xs.map((x, i) => [x, his[i]]);
  const dn = xs.map((x, i) => [x, los[i]]).reverse();
  return pathOf(up) + " " + pathOf(dn).replace(/^M/, "L") + " Z";
}

export const clampW = (w, min = 260) => Math.max(min, w);
