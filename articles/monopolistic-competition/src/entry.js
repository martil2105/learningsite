/*
  src/entry.js
  Perfect competition, free entry, and the integer problem (Mi8, row 8).
  Exported for perfect-competition and imported by monopolistic-competition.
*/

export const F = 50;
export const c = 10;
export const d = 2;
export const s = Math.sqrt(2 * F * d); // 14.1421356...
export const acMin = c + s; // 24.1421356...
export const qEfficient = Math.sqrt((2 * F) / d); // 7.0710678...

// Cost function for a single competitive firm
export function costFirm(q) {
  return F + c * q + (d * q * q) / 2;
}

// Average cost for a single competitive firm
export function acFirm(q) {
  if (q <= 0) return Infinity;
  return costFirm(q) / q;
}

// Marginal cost for a single competitive firm
export function mcFirm(q) {
  return c + d * q;
}

// Creates market structure for demand Q = A - B*p
export function createMarket(A, B) {
  const nBar = (d * (A - B * acMin)) / s;

  function price(n) {
    if (n <= 0) return A / B;
    return (A * d + n * c) / (B * d + n);
  }

  function qFirm(n) {
    const p = price(n);
    return Math.max(0, (p - c) / d);
  }

  function profit(n) {
    const p = price(n);
    return Math.pow(p - c, 2) / (2 * d) - F;
  }

  function welfare(n) {
    const p = price(n);
    const Q = A - B * p;
    return (Q * Q) / (2 * B) + n * profit(n);
  }

  // Simulation: admit firms one at a time while profit >= 0
  function runSimulation() {
    let k = 0;
    while (profit(k + 1) >= 0) {
      k++;
    }
    return k;
  }

  return {
    A,
    B,
    nBar,
    nStar: Math.floor(nBar),
    price,
    qFirm,
    profit,
    welfare,
    runSimulation,
  };
}
