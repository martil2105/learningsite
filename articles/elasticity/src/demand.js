/*
  src/demand.js for elasticity
  Five pinned demand curves through (25, 45):
    - lin: linear
    - ces: constant elasticity of substitution (iso-elastic)
    - exp: negative exponential
    - quad: quadratic
    - logit: logistic
  Along with tangent ruler helpers, arc/log formulas, and revenue properties.
*/

export const P0 = 25;
export const Q0 = 45;

export const families = {
  lin: (() => {
    const b = 1.2;
    const a = Q0 + b * P0; // 75
    return {
      id: "lin",
      name: "Linear: 75 − 1.2p",
      q: (p) => Math.max(0, a - b * p),
      dq: (p) => (p <= a / b ? -b : 0),
      pmax: a / b, // 62.5
      qmax: a, // 75
      pinEps: 2 / 3,
    };
  })(),

  ces: (() => {
    const e = 1.6;
    const k = Q0 * Math.pow(P0, e);
    return {
      id: "ces",
      name: "Constant Elasticity: k·p^(−1.6)",
      q: (p) => (p > 0 ? k * Math.pow(p, -e) : Infinity),
      dq: (p) => (p > 0 ? -e * k * Math.pow(p, -e - 1) : 0),
      pmax: null,
      qmax: null,
      pinEps: 1.6,
    };
  })(),

  exp: (() => {
    const a = 0.05;
    const k = Q0 * Math.exp(a * P0);
    return {
      id: "exp",
      name: "Exponential: k·e^(−0.05p)",
      q: (p) => k * Math.exp(-a * p),
      dq: (p) => -a * k * Math.exp(-a * p),
      pmax: null,
      qmax: k,
      pinEps: 1.25,
    };
  })(),

  quad: (() => {
    const Pm = 80;
    const k = Q0 / Math.pow(Pm - P0, 2);
    return {
      id: "quad",
      name: "Quadratic: k·(80 − p)²",
      q: (p) => (p <= Pm ? k * Math.pow(Pm - p, 2) : 0),
      dq: (p) => (p <= Pm ? -2 * k * (Pm - p) : 0),
      pmax: Pm,
      qmax: k * Pm * Pm,
      pinEps: 10 / 11,
    };
  })(),

  logit: (() => {
    const p50 = 30;
    const s = 12;
    const M = Q0 * (1 + Math.exp((P0 - p50) / s));
    return {
      id: "logit",
      name: "Logistic: M / (1 + e^((p−30)/12))",
      q: (p) => M / (1 + Math.exp((p - p50) / s)),
      dq: (p) => {
        const z = Math.exp((p - p50) / s);
        return (-M * z) / (s * Math.pow(1 + z, 2));
      },
      pmax: null,
      qmax: M,
      pinEps: (P0 * Math.exp((P0 - p50) / s)) / (s * (1 + Math.exp((P0 - p50) / s))),
    };
  })(),
};

/* Point elasticity |ε| = |q'(p) · p / q(p)| */
export function pointElasticity(fam, p) {
  const qVal = fam.q(p);
  if (qVal <= 1e-12) return Infinity;
  const dqVal = fam.dq(p);
  return Math.abs((dqVal * p) / qVal);
}

/*
  The Ruler: tangent line at (p, q) cut into two segments by the point.
  Returns coordinates of both intercepts and lengths of upper and lower segments.
*/
export function rulerSegments(fam, p) {
  const q = fam.q(p);
  const d = fam.dq(p);
  if (q <= 1e-9 || d >= -1e-9) {
    return { qIntercept: 0, pIntercept: 0, lenUpper: 0, lenLower: 0, ratio: 0 };
  }

  // Intercepts:
  // Tangent line: Q(P) = q + d*(P - p)
  // At P = 0: Q_int = q - p*d (meets quantity axis)
  // At Q = 0: P_int = p - q/d (meets price axis)
  const qIntercept = q - p * d;
  const pIntercept = p - q / d;

  // Segment from (p, q) to quantity axis (0, q - p*d) -> Upper segment
  // Vector: (0 - p, -p*d) -> dx = -p, dy = -p*d
  const lenUpper = Math.hypot(p, p * d);

  // Segment from (p, q) to price axis (p - q/d, 0) -> Lower segment
  // Vector: (-q/d, -q) -> dx = -q/d, dy = -q
  const lenLower = Math.hypot(q / d, q);

  const ratio = lenLower > 0 ? lenUpper / lenLower : 0;
  return {
    p,
    q,
    d,
    qIntercept,
    pIntercept,
    lenUpper,
    lenLower,
    ratio,
  };
}

/* Midpoint (arc) formula between two observations (p1, q1) and (p2, q2) */
export function midpointFormula(p1, q1, p2, q2) {
  const avgQ = (q1 + q2) / 2;
  const avgP = (p1 + p2) / 2;
  if (avgQ <= 0 || avgP <= 0 || Math.abs(p2 - p1) < 1e-9) return 0;
  return Math.abs(((q2 - q1) / avgQ) / ((p2 - p1) / avgP));
}

/* Log-difference formula between two observations (p1, q1) and (p2, q2) */
export function logDifferenceFormula(p1, q1, p2, q2) {
  if (p1 <= 0 || p2 <= 0 || q1 <= 0 || q2 <= 0 || Math.abs(p2 - p1) < 1e-9) return 0;
  return Math.abs((Math.log(q2) - Math.log(q1)) / (Math.log(p2) - Math.log(p1)));
}

/* Revenue at price p: R(p) = p * q(p) */
export const revenue = (fam, p) => p * fam.q(p);

/* Golden section search for revenue peak */
export function peakPrice(fam) {
  if (fam.id === "ces") return null; // No revenue peak
  const hi = fam.pmax ? fam.pmax * 0.99 : 300;
  const lo = 0.01;
  const g = (Math.sqrt(5) - 1) / 2;
  let a = lo, z = hi;
  for (let i = 0; i < 200; i++) {
    const x1 = z - g * (z - a);
    const x2 = a + g * (z - a);
    if (revenue(fam, x1) > revenue(fam, x2)) z = x2;
    else a = x1;
  }
  return (a + z) / 2;
}
