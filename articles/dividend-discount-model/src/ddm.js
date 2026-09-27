// A share as a stream of dividends: next year's dividend D1, growing at g a
// year for ever, discounted at r. Everything here needs r > g.

export function gordon(D1, r, g) {
  return D1 / (r - g);
}

// Present value of the dividend paid at the end of year t (t = 1, 2, ...).
export function pvDividend(D1, r, g, t) {
  return (D1 * Math.pow(1 + g, t - 1)) / Math.pow(1 + r, t);
}

// Share of the price that comes from dividends paid after year T.
export function shareAfter(r, g, T) {
  return Math.pow((1 + g) / (1 + r), T);
}

// Year by which half the value has been paid out.
export function halfLife(r, g) {
  return Math.log(2) / Math.log((1 + r) / (1 + g));
}

// Sensitivity of price to the discount rate: -dlnP/dr = 1/(r - g).
export function modifiedDuration(r, g) {
  return 1 / (r - g);
}
// Weighted-average wait for the dividends: (1 + r)/(r - g).
export function macaulayDuration(r, g) {
  return (1 + r) / (r - g);
}

// Two stages: growth g1 for N years, then g2 for ever after, discounted at r.
export function twoStage(D1, r, g1, N, g2) {
  let explicit = 0;
  for (let t = 1; t <= N; t++) explicit += (D1 * Math.pow(1 + g1, t - 1)) / Math.pow(1 + r, t);
  const DN1 = D1 * Math.pow(1 + g1, N - 1) * (1 + g2); // dividend in year N + 1
  const terminal = DN1 / (r - g2) / Math.pow(1 + r, N);
  return { explicit, terminal, price: explicit + terminal, terminalShare: terminal / (explicit + terminal) };
}
