#!/usr/bin/env node
/*
  Palette validator.

  reference/house-idioms.md has cited this file for a while; this is it. It
  checks a set of chart colours against the four things that have actually gone
  wrong in these articles:

    lightness band    a mark much lighter or darker than its neighbours reads as
                      emphasis rather than as a different series
    chroma floor      a colour with almost no chroma is a neutral, and neutrals
                      belong to the background class, not to a series
    CVD separation    the red/green collapse - #00a86b against #df2a5d came out
                      at dE 4.0 under deuteranopia in one article
    contrast          a mark below 3:1 against its own card is not on the page
                      for a good proportion of readers

  Distances are OKLab dE x100. Colour-vision deficiency is simulated two ways:
  the Vienot-Brettel-Mollon dichromat matrices applied in LINEAR RGB, which is
  the version those matrices were derived for, and the harsher Machado 2009
  matrices at severity 1.0. A palette worth shipping clears both.

  The dE figures quoted in the older articles palette.js comments are the
  MACHADO ones: "#2f7d32 clears it at 8.3 deutan against #df2a5d" is deutan_m
  here, to the decimal, and the Vienot column for that pair reads 36.4. So when
  comparing against a number written down in an earlier article, use deutan_m.

  Usage:
    node scripts/validate_palette.js "#2074d5,#df2a5d,#2f7d32" \
        --mode light --surface "#ffffff" --pairs all
*/

const hex2rgb = (h) => {
  h = h.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lin = (rgb) => rgb.map(toLin);

function oklab([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

const CVD = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  deutan: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
  protan: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
  tritan: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
  // Machado, Oliveira & Fernandes (2009) at severity 1.0. A second, harsher
  // model, reported alongside the first because the two disagree by a lot and
  // a palette worth shipping should clear both.
  deutan_m: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protan_m: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
};
const apply = (M, v) => M.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
const dE = (a, b) => 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const contrast = (a, b) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const argv = process.argv.slice(2);
const colours = (argv[0] || "").split(",").map((s) => s.trim()).filter(Boolean);
const opt = (name, dflt) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const surfaces = opt("surface", "#ffffff,#f1f3f3").split(",");
const LBAND = [0.43, 0.77];
const CFLOOR = 0.03;
const MIN_CVD = 8;
const MIN_NORMAL = 12;
const MIN_CONTRAST = 3;

if (!colours.length) {
  console.error('usage: node scripts/validate_palette.js "#aabbcc,#ddeeff" [--surface "#ffffff,#f1f3f3"] [--pairs all]');
  process.exit(2);
}

let fails = 0;
const line = (ok, label, detail) => {
  if (!ok) fails++;
  console.log((ok ? "  ok   " : "  FAIL ") + label.padEnd(46) + detail);
};

console.log("\n" + colours.length + " colours\n");
console.log("  hex        OKLab L   chroma   " + surfaces.map((s) => ("vs " + s).padEnd(12)).join(""));
for (const c of colours) {
  const lab = oklab(lin(hex2rgb(c)));
  const chroma = Math.hypot(lab[1], lab[2]);
  console.log("  " + c.padEnd(10) + lab[0].toFixed(3).padStart(7) + chroma.toFixed(3).padStart(9) + "   " +
    surfaces.map((s) => (contrast(lin(hex2rgb(c)), lin(hex2rgb(s))).toFixed(2) + ":1").padEnd(12)).join(""));
}

console.log("\nchecks\n");
{
  const bad = colours.filter((c) => { const L = oklab(lin(hex2rgb(c)))[0]; return L < LBAND[0] || L > LBAND[1]; });
  line(bad.length === 0, "lightness band  L in [" + LBAND.join(", ") + "]", bad.length ? "outside: " + bad.join(" ") : "all inside");
}
{
  const bad = colours.filter((c) => { const l = oklab(lin(hex2rgb(c))); return Math.hypot(l[1], l[2]) < CFLOOR; });
  line(bad.length === 0, "chroma floor  >= " + CFLOOR, bad.length ? "below: " + bad.join(" ") + " (fine for ONE background class)" : "all above");
}
for (const mode of ["normal", "deutan", "protan", "tritan", "deutan_m", "protan_m"]) {
  let worst = Infinity, pair = "";
  for (let i = 0; i < colours.length; i++)
    for (let j = i + 1; j < colours.length; j++) {
      const a = oklab(apply(CVD[mode], lin(hex2rgb(colours[i]))));
      const b = oklab(apply(CVD[mode], lin(hex2rgb(colours[j]))));
      const d = dE(a, b);
      if (d < worst) { worst = d; pair = colours[i] + " <-> " + colours[j]; }
    }
  const floor = mode === "normal" ? MIN_NORMAL : MIN_CVD;
  line(worst >= floor, mode + " separation  >= " + floor, "worst " + worst.toFixed(1) + "   " + pair);
}
for (const s of surfaces) {
  let worst = Infinity, who = "";
  for (const c of colours) {
    const r = contrast(lin(hex2rgb(c)), lin(hex2rgb(s)));
    if (r < worst) { worst = r; who = c; }
  }
  line(worst >= MIN_CONTRAST, "contrast vs " + s + "  >= " + MIN_CONTRAST + ":1", worst.toFixed(2) + ":1   " + who);
}

if (argv.includes("--pairs") && argv[argv.indexOf("--pairs") + 1] === "all") {
  console.log("\nall pairs, OKLab dE\n");
  console.log("  " + "pair".padEnd(24) + ["normal", "deutan", "protan", "tritan", "deutan_m", "protan_m"].map((m) => m.padStart(10)).join(""));
  for (let i = 0; i < colours.length; i++)
    for (let j = i + 1; j < colours.length; j++) {
      const row = ["normal", "deutan", "protan", "tritan", "deutan_m", "protan_m"].map((m) =>
        dE(oklab(apply(CVD[m], lin(hex2rgb(colours[i])))), oklab(apply(CVD[m], lin(hex2rgb(colours[j]))))).toFixed(1).padStart(10));
      console.log("  " + (colours[i] + " " + colours[j]).padEnd(24) + row.join(""));
    }
}

console.log("\n" + (fails ? fails + " CHECK(S) FAILED" : "all checks pass") + "\n");
process.exit(fails ? 1 : 0);
