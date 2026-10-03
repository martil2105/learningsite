/*
  How well do we know the equity premium?

  Part 1 uses Kenneth French's market return above one-month bills: yearly
  from 1927 and monthly from July 1926. A window's average premium has a
  standard error of sd / sqrt(n), and its 95% band is the mean plus and minus
  1.96 standard errors.

  Part 2 uses Shiller's S&P composite, after inflation, from January to
  January. A year's real return splits exactly into a dividend yield and the
  real growth of the price,

      R = dividends paid / P0 x CPI0/CPI1  +  (P1/P0 x CPI0/CPI1 - 1),

  and Fama and French (2002) replace the price growth with the real growth of
  dividends to get an estimate that doesn't count changes in the price paid
  per dollar of dividends. The two averages differ by the average price growth
  minus the average dividend growth.

  Everything is in percent a year.
*/
import DATA from "./data.js";

export const VINTAGE = DATA.vintage;
export const YEARS = DATA.annual.year;
export const PREMIUM = DATA.annual.mktrf;
export const FIRST_YEAR = YEARS[0], LAST_YEAR = YEARS[YEARS.length - 1];
export const Z95 = 1.959963984540054;

export const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
export const sd = (v) => { const m = mean(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };

export function band(from = FIRST_YEAR, to = LAST_YEAR, freq = "yearly") {
  let m, se, n;
  if (freq === "yearly") {
    const v = PREMIUM.filter((_, i) => YEARS[i] >= from && YEARS[i] <= to);
    n = v.length; m = mean(v); se = sd(v) / Math.sqrt(n);
  } else {
    const v = DATA.monthly.mktrf.filter((_, i) => DATA.monthly.date[i] >= from * 100 + 1 && DATA.monthly.date[i] <= to * 100 + 12);
    n = v.length; m = 12 * mean(v); se = (12 * sd(v)) / Math.sqrt(n);
  }
  return { mean: m, se, lo: m - Z95 * se, hi: m + Z95 * se, n, years: to - from + 1 };
}

export function rolling(window = 30) {
  const out = [];
  for (let i = 0; i + window <= YEARS.length; i++) {
    const v = PREMIUM.slice(i, i + window);
    out.push({ end: YEARS[i + window - 1], start: YEARS[i], mean: mean(v), se: sd(v) / Math.sqrt(window) });
  }
  return out;
}

// Shiller's years, January to January, after inflation.
export const SHILLER = (() => {
  const s = DATA.shiller, rows = [];
  for (let i = 0; i + 1 < s.year.length; i++) {
    if (s.year[i + 1] !== s.year[i] + 1 || s.paid[i] === null) continue;
    const c = s.CPI[i] / s.CPI[i + 1];
    const dp = (s.paid[i] / s.P[i]) * c, gP = (s.P[i + 1] / s.P[i]) * c - 1, gD = (s.D[i + 1] / s.D[i]) * c - 1;
    rows.push({ year: s.year[i], R: 100 * (dp + gP), dp: 100 * dp, gP: 100 * gP, gD: 100 * gD, PD: s.P[i] / s.D[i], PDnext: s.P[i + 1] / s.D[i + 1] });
  }
  return rows;
})();
export const SHILLER_FIRST = SHILLER[0].year, SHILLER_LAST = SHILLER[SHILLER.length - 1].year;

export function split(from, to) {
  const r = SHILLER.filter((x) => x.year >= from && x.year <= to), n = r.length;
  const R = r.map((x) => x.R), RD = r.map((x) => x.dp + x.gD);
  return {
    from, to, n,
    realised: mean(R), realisedSE: sd(R) / Math.sqrt(n),
    dividends: mean(RD), dividendsSE: sd(RD) / Math.sqrt(n),
    dp: mean(r.map((x) => x.dp)), gP: mean(r.map((x) => x.gP)), gD: mean(r.map((x) => x.gD)),
    pdStart: r[0].PD, pdEnd: r[n - 1].PDnext,
  };
}
export const PERIODS = [
  { id: "early", label: "1871 to 1950", from: 1871, to: 1950 },
  { id: "fifty", label: "1951 to 2000", from: 1951, to: 2000 },
  { id: "late", label: "1951 to 2022", from: 1951, to: 2022 },
  { id: "all", label: "1871 to 2022", from: 1871, to: 2022 },
];

// The average log premium, ln(1 + market) - ln(1 + bills), for the cost section.
export function logPremium(from = FIRST_YEAR, to = LAST_YEAR) {
  const v = [];
  for (let i = 0; i < YEARS.length; i++) {
    if (YEARS[i] < from || YEARS[i] > to) continue;
    const rf = DATA.annual.rf[i] / 100, m = PREMIUM[i] / 100 + rf;
    v.push(100 * (Math.log(1 + m) - Math.log(1 + rf)));
  }
  return mean(v);
}

export function extremes(window = 30) {
  const r = rolling(window);
  let lo = r[0], hi = r[0];
  for (const x of r) { if (x.mean < lo.mean) lo = x; if (x.mean > hi.mean) hi = x; }
  return { lo, hi, n: r.length };
}

// How many times the price paid per dollar of dividends rose over a period.
export const pdRise = (s) => s.pdEnd / s.pdStart;
