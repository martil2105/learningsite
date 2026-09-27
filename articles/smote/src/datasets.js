/*
  The data.

  One domain for the whole article - card transactions, two features - because
  a scenario that changes its units halfway through is a scenario the reader
  stops trusting. Every figure on this page is drawn from the same generative
  model; only the fraud side changes shape.

  Raw features:
    amount   euros, roughly log-normal over four orders of magnitude
    hour     time of day, 0-24

  Model features: both standardised. That is not decoration. SMOTE runs on
  nearest neighbours, nearest neighbours run on a distance, and a distance
  between "euros" and "hours" is only meaningful once somebody has decided what
  one hour is worth in euros. Standardising is that decision, made once and
  applied everywhere, exactly as a fitted scaler does in a real pipeline.

  Working in standardised coordinates also lets every chart use an equal aspect
  ratio, so a circle in the reader's eye is a circle in the metric SMOTE uses.
*/
import { mulberry32, gaussian } from "./rng.js";

/* The scaler. Fixed constants, taken from the generative legitimate
   distribution rather than from any one sample, so that every scenario, every
   figure and every check share one coordinate system. */
export const SCALER = {
  logAmount: { center: 1.85, scale: 0.75 },
  hour: { center: 12, scale: 6 },
};

export const toAmount = (x) => 10 ** (SCALER.logAmount.center + x * SCALER.logAmount.scale);
export const fromAmount = (a) => (Math.log10(a) - SCALER.logAmount.center) / SCALER.logAmount.scale;
export const toHour = (y) => SCALER.hour.center + y * SCALER.hour.scale;
export const fromHour = (h) => (h - SCALER.hour.center) / SCALER.hour.scale;

export const euros = (x) => {
  const a = toAmount(x);
  if (a >= 1000) return "€" + Math.round(a / 10) * 10;
  if (a >= 100) return "€" + Math.round(a);
  if (a >= 10) return "€" + a.toFixed(0);
  return "€" + a.toFixed(2);
};

export const clock = (y) => {
  let h = toHour(y);
  h = ((h % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return String(mm === 60 ? hh + 1 : hh).padStart(2, "0") + ":" + String(mm === 60 ? 0 : mm).padStart(2, "0");
};

/* ------------------------------------------------------------------ mixtures

   Axis-aligned Gaussians with a rotation, so the legitimate cloud has the mild
   correlation real spend has (bigger purchases skew earlier in the day) without
   needing a general covariance anywhere.
*/
/*
  The window, and it is part of the data rather than a drawing choice: one day,
  midnight to midnight, and amounts from about sixty cents to eight thousand
  euros. Every sample is drawn inside it by rejection.

  That is not cosmetic. Time of day is circular and this article treats it as a
  straight line, which is only defensible while every point is inside one turn
  of the circle - a Gaussian tail reaching hour -3.4 is not an early-morning
  transaction, it is a coordinate system quietly breaking. It also guarantees
  that nothing drawn can escape the chart, which is a whole family of layout
  bugs that never gets a chance to happen.
*/
export const EXTENT = { x0: -2.75, x1: 2.75, y0: -2, y1: 2 };
const inWindow = (p) => p[0] > EXTENT.x0 && p[0] < EXTENT.x1 && p[1] > EXTENT.y0 && p[1] < EXTENT.y1;

function componentPdf(p, c) {
  const dx = p[0] - c.mu[0];
  const dy = p[1] - c.mu[1];
  const co = Math.cos(-c.rot);
  const si = Math.sin(-c.rot);
  const u = (co * dx - si * dy) / c.sd[0];
  const v = (si * dx + co * dy) / c.sd[1];
  return Math.exp(-0.5 * (u * u + v * v)) / (2 * Math.PI * c.sd[0] * c.sd[1]);
}

export function mixturePdf(p, comps) {
  let s = 0;
  let w = 0;
  for (const c of comps) {
    s += c.w * componentPdf(p, c);
    w += c.w;
  }
  return s / w;
}

function sampleComponent(c, rand) {
  const a = gaussian(rand) * c.sd[0];
  const b = gaussian(rand) * c.sd[1];
  const co = Math.cos(c.rot);
  const si = Math.sin(c.rot);
  return [c.mu[0] + co * a - si * b, c.mu[1] + si * a + co * b];
}

function sampleMixture(comps, n, rand) {
  const total = comps.reduce((s, c) => s + c.w, 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    let u = rand() * total;
    let pick = comps[comps.length - 1];
    for (const c of comps) {
      if (u < c.w) {
        pick = c;
        break;
      }
      u -= c.w;
    }
    out.push(draw(pick, rand));
  }
  return out;
}

/* One sample inside the window. The guard is a real guard, not decoration: a
   component whose mass is mostly outside would otherwise spin here forever, and
   the loud way to find that out is better than the quiet one. */
function draw(c, rand) {
  for (let tries = 0; tries < 500; tries++) {
    const p = sampleComponent(c, rand);
    if (inWindow(p)) return p;
  }
  throw new Error("component at [" + c.mu + "] cannot be sampled inside the window");
}

/* Fixed counts per component rather than multinomial draws. With twenty-odd
   minority points a multinomial sample sometimes hands a mode zero rows, and
   every figure downstream would then be describing a different picture than the
   prose does. */
function sampleFixed(spec, rand) {
  const out = [];
  for (const { comp, n } of spec) {
    for (let i = 0; i < n; i++) out.push(draw(comp, rand));
  }
  return out;
}

/* --------------------------------------------------------------- the classes

   Legitimate spend: a daytime bulk of small purchases, a second lobe of larger
   ones, and a thin overnight tail. The tail matters - without it the small
   hours would be empty, fraud there would be trivially separable, and the
   article would be demonstrating its point on a problem nobody has.
*/
export const LEGIT = [
  { w: 0.5, mu: [-0.62, 0.2], sd: [0.62, 0.7], rot: 0.15 },
  { w: 0.34, mu: [0.62, -0.02], sd: [0.52, 0.72], rot: -0.25 },
  { w: 0.16, mu: [-0.35, -1.24], sd: [0.58, 0.38], rot: 0.0 },
];

/* Fraud, by kind. Each is a mode of the same class - they are all labelled 1
   and a classifier is asked to find all of them at once. */
export const KINDS = {
  // A stolen number tested with a string of tiny charges, overnight.
  testing: { w: 1, mu: [-1.7, -1.2], sd: [0.26, 0.3], rot: 0.0 },
  // The card then spent on something expensive, in the evening, before anyone
  // notices.
  bigTicket: { w: 1, mu: [1.52, 1.46], sd: [0.25, 0.33], rot: 0.0 },
  // Account takeover cashed out at a mid-size amount in the small hours.
  cashout: { w: 1, mu: [0.3, -1.36], sd: [0.22, 0.24], rot: 0.0 },
  // And the ones that look like nothing at all: an ordinary afternoon purchase
  // that happened to be fraud. Every real label set has a few.
  oneOff: { w: 1, mu: [0.55, 0.35], sd: [0.3, 0.28], rot: 0.0 },
};

export const N_LEGIT = 900;

/*
  Three scenarios, one story: the same bank, told what fraud looks like by three
  different label sets.

  The counts are small on purpose. That is the whole situation SMOTE exists for
  - if you had four hundred fraud rows you would not be synthesising any - and
  it is also, as the article argues, the reason the method's central assumption
  is under the most strain exactly where it is used.
*/
export const SCENARIOS = [
  {
    id: "one-kind",
    name: "One kind of fraud",
    short: "one kind",
    blurb: "Every labelled fraud is the same thing: a stolen number being tested with tiny overnight charges.",
    seed: 20260907,
    spec: [{ kind: "testing", n: 22 }],
  },
  {
    id: "two-kinds",
    name: "Two kinds",
    short: "two kinds",
    blurb: "The same tested cards, plus the expensive evening purchases they get spent on. Two clusters, far apart.",
    seed: 20260908,
    spec: [
      { kind: "testing", n: 13 },
      { kind: "bigTicket", n: 9 },
    ],
  },
  {
    id: "as-it-arrives",
    name: "Fraud as it actually arrives",
    short: "as it arrives",
    blurb:
      "Three kinds in unequal numbers, and two one-offs that look like ordinary afternoon spending. This is the shape a real label set has.",
    seed: 20260909,
    spec: [
      { kind: "testing", n: 10 },
      { kind: "bigTicket", n: 6 },
      { kind: "cashout", n: 4 },
      { kind: "oneOff", n: 2 },
    ],
  },
];

export function buildScenario(sc) {
  const rand = mulberry32(sc.seed);
  const majority = sampleMixture(LEGIT, N_LEGIT, rand);
  const minority = sampleFixed(
    sc.spec.map(({ kind, n }) => ({ comp: KINDS[kind], n })),
    rand
  );
  const fraudComps = sc.spec.map(({ kind, n }) => ({ ...KINDS[kind], w: n }));
  return {
    ...sc,
    majority,
    minority,
    fraudComps,
    // The two class-conditional densities, which is all the "is this point in
    // normal territory" test needs.
    pMin: (p) => mixturePdf(p, fraudComps),
    pMaj: (p) => mixturePdf(p, LEGIT),
  };
}

export const DATA = SCENARIOS.map(buildScenario);
export const byId = (id) => DATA.find((d) => d.id === id);

/* Axis ticks, in the raw units, placed at their standardised positions. */
export const AMOUNT_TICKS = [1, 10, 100, 1000].map((a) => ({ v: fromAmount(a), t: "€" + a }));
export const HOUR_TICKS = [0, 6, 12, 18, 24].map((h) => ({
  v: fromHour(h),
  t: String(h).padStart(2, "0") + ":00",
}));
