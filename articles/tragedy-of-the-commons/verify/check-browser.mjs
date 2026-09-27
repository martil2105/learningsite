/*
  Browser checks for tragedy-of-the-commons at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/tragedy-of-the-commons-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8790";
const SHOTS = process.env.SHOTS || "";
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
];

let pass = 0;
const fails = [];
const ok = (claim, cond, detail = "") =>
  cond ? pass++ : fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const num = async (page, sel) =>
  parseFloat(((await page.locator(sel).first().textContent()) || "").replace(/[−–]/g, "-").replace(/[^\d.\-]/g, ""));
const settle = (page) => page.waitForTimeout(80);
async function setRange(page, sel, value) {
  await page.locator(sel).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await settle(page);
}

if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const noise = [];
  page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") noise.push(`console: ${m.text()}`); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const at = (claim) => `${vp.name}: ${claim}`;

  // ---------------------------------------------------------- common checks
  const textLen = await page.evaluate(() => document.body.innerText.trim().length);
  ok(at("the page renders its text"), textLen > 2000, `${textLen} characters`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(at("the page does not scroll horizontally"), overflow <= 0, `${overflow}px too wide`);

  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].filter((s) => !s.closest(".katex")).map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return { cls: String(s.parentElement.className || "svg").slice(0, 30), over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)), vb: s.hasAttribute("viewBox") };
    })
  );
  ok(at("every chart svg fits inside its parent"), svgs.every((s) => s.over <= 1), svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));
  ok(at("every chart svg has a viewBox"), svgs.every((s) => s.vb), `${svgs.filter((s) => !s.vb).length} without`);

  const geom = async () => page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("svg [d], svg circle, svg rect, svg line, svg text")) {
      const d = el.getAttribute("d");
      if (d && /NaN|undefined|Infinity/.test(d)) bad.push(`d=${d.slice(0, 30)}`);
      for (const a of ["cx", "cy", "x1", "y1", "x2", "y2", "x", "y", "r", "width", "height"]) {
        const v = el.getAttribute(a);
        if (v !== null && v !== "" && !/%$/.test(v) && !Number.isFinite(+v)) bad.push(`${el.tagName} ${a}=${v}`);
      }
    }
    return bad;
  });
  const g0 = await geom();
  ok(at("no NaN/undefined/Infinity in SVG geometry on load"), g0.length === 0, g0.slice(0, 3).join("; "));

  const hygiene = await page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll(".katex, svg, script, style").forEach((e) => e.remove());
    const t = clone.innerText;
    return {
      dollars: (t.match(/\$[^$\n]{0,40}[\\^_=][^$\n]{0,40}\$/) || [""])[0],
      backslash: (t.match(/\\[a-zA-Z]{3,}/) || [""])[0],
      bad: (t.match(/\bNaN\b|\bundefined\b|\bnull\b|\bInfinity\b/) || [""])[0],
      katex: document.querySelectorAll(".katex").length,
      katexErr: document.querySelectorAll(".katex-error").length,
      thanks: [...document.querySelectorAll("p")].some((p) => p.textContent.trim() === "Thanks for reading!"),
      title: (() => { const h = document.querySelector("#intro-hed"); if (!h) return -1; const r = h.getBoundingClientRect(); return Math.round(r.right - window.innerWidth); })(),
    };
  });
  ok(at("no raw $…$ LaTeX in the text"), !hygiene.dollars, hygiene.dollars);
  ok(at("no raw LaTeX commands in the text"), !hygiene.backslash, hygiene.backslash);
  ok(at("no NaN/undefined/null in the text"), !hygiene.bad, hygiene.bad);
  ok(at("KaTeX rendered, with no errors"), hygiene.katex > 0 && hygiene.katexErr === 0, `${hygiene.katex} rendered, ${hygiene.katexErr} errors`);
  ok(at('"Thanks for reading!" is a paragraph'), hygiene.thanks);
  ok(at("the title fits the viewport"), hygiene.title <= 0, `${hygiene.title}px over`);

  // ---------------------------------------------------- this article's checks
  const M = await import("../src/commons.js");
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) || "").replace(/\s+/g, " ").trim();
  const money = async (sel) => parseFloat((await txt(sel)).replace(/[£,]/g, ""));
  const inSvg = async (sel) => page.locator(sel).evaluate((el) => {
    const svg = el.querySelector("svg").getBoundingClientRect();
    return [...el.querySelectorAll("svg text")].filter((t) => {
      const r = t.getBoundingClientRect();
      return r.width > 0 && (r.left < svg.left - 1 || r.right > svg.right + 1 || r.top < svg.top - 1 || r.bottom > svg.bottom + 1);
    }).map((t) => t.textContent.trim());
  });

  // TheLake: the model's efficient hours and rent, curves drawn at the measured width, legend clear of the curves
  ok(at("the one-owner card reads 2,500 hours and £2,500 of rent"), (await txt("#lake-hours")) === "2,500" && (await money("#lake-rent")) === M.effRent());
  const lake = await page.locator("#lake-figure").evaluate((el) => {
    const svg = el.querySelector("svg").getBoundingClientRect();
    const ap = el.querySelector("path.ap-curve").getBoundingClientRect();
    const mp = el.querySelector("path.mp-curve").getBoundingClientRect();
    const dot = el.querySelector("circle.e-star").getBoundingClientRect();
    const wage = el.querySelector("line.wage").getBoundingClientRect();
    return { apRight: ap.right - svg.right, mpRight: mp.right - svg.right, dotOnWage: Math.abs(dot.top + dot.height / 2 - wage.top), svgW: svg.width };
  });
  ok(at("the lake's curves end inside the chart, drawn at the measured width"), lake.apRight <= 1 && lake.mpRight <= 1, `${lake.apRight.toFixed(1)}, ${lake.mpRight.toFixed(1)}`);
  ok(at("the E* dot sits on the wage line"), lake.dotOnWage < 2, lake.dotOnWage.toFixed(2));
  ok(at("every label in the lake chart is inside the svg"), (await inSvg("#lake-figure")).length === 0, (await inSvg("#lake-figure")).join(" | "));

  // TheSecondBoat: two boats, from the model
  const sb = await page.locator("#second-boat .sb-rent").allTextContents();
  ok(at("the second-boat card reads rents of £2,500.00 and £1,875.00"), sb.map((t) => parseFloat(t.replace(/[£,]/g, ""))).join(",") === `${M.effRent()},${M.rent(M.closedEffort(2))}`, sb.join(","));
  ok(at("and 5,625 hours with 25.0% of the rent lost"), (await txt("#second-boat .sb-hours")) === "5,625" && (await txt("#second-boat .sb-loss")).includes("(25.0%)"), await txt("#second-boat .sb-loss"));

  // WedgeFigure: the weights follow n
  for (const [n, apW, mpW] of [[1, null, "100%"], [2, "50%", "50%"], [4, "75%", "25%"], [20, "95%", null]]) {
    await setRange(page, "#wedge-n-slider", n);
    const a = (await page.locator("#wedge-ap").count()) ? await txt("#wedge-ap") : null;
    const m = (await page.locator("#wedge-mp").count()) ? await txt("#wedge-mp") : null;
    ok(at(`the wedge at n = ${n} reads AP ${apW ?? "hidden"} and MP ${mpW ?? "hidden"}`), (a === (apW && `AP ${apW}`)) && (m === (mpW && `MP ${mpW}`)), `${a} | ${m}`);
  }
  await page.waitForTimeout(350); // the segments animate their width over 0.2s
  const bar = await page.locator("#wedge-figure .bar-container").evaluate((el) => [...el.children].map((c) => c.getBoundingClientRect().width / el.getBoundingClientRect().width));
  ok(at("at n = 20 the MP segment is 5% of the bar"), near(bar[1], 0.05, 0.01), bar.map((v) => v.toFixed(3)).join(","));

  // LakeLab: every readout against the module, the fee for n boats, and the theta slider
  const lab = async (n, th) => { await setRange(page, "#lab-n-slider", n); if (th !== undefined) await setRange(page, "#lab-theta-slider", th); };
  await lab(4, 0.5);
  ok(at("lab at n = 4 reads 7,656 hours against 2,500"), (await txt("#lab-hours")) === "7,656" && (await txt("#lab-hours-eff")) === "2,500", await txt("#lab-hours"));
  ok(at("lab at n = 4 reads £1,093.8 left and 56.3% lost"), near(await money("#lab-rent"), M.rent(M.closedEffort(4)), 0.05) && (await txt("#lab-lost")) === "56.3%", `${await txt("#lab-rent")} ${await txt("#lab-lost")}`);
  ok(at("lab at n = 4: the fee for four boats is £0.75, and £1.00 for open access"), (await txt("#lab-fee-n")) === "£0.75" && (await txt("#lab-fee-open")) === "£1.00");
  const feeN = await money("#lab-fee-n");
  ok(at("the lab's fee for four boats, fed back to the model, restores E*"), near(M.closedEffort(4, 0.5, M.A_DEFAULT, M.W_DEFAULT + feeN), M.effEffort(), 1e-6));
  ok(at("lab at n = 4 shows the square-root formulas"), (await page.locator("#lake-lab .math-sub").count()) === 2);
  await lab(1);
  ok(at("lab at n = 1: nothing lost, no fee"), (await txt("#lab-lost")) === "0.0%" && (await txt("#lab-fee-n")) === "£0.00");
  await lab(20);
  ok(at("lab at n = 20 reads 90.3% lost"), (await txt("#lab-lost")) === "90.3%", await txt("#lab-lost"));
  await lab(4, 0.3);
  ok(at("theta = 0.3 moves the rent lost to the model's value, and hides the square-root formulas"),
     (await txt("#lab-lost")) === (100 * M.dissipatedRent(4, 0.3)).toFixed(1) + "%" && (await page.locator("#lake-lab .math-sub").count()) === 0, await txt("#lab-lost"));
  ok(at("theta = 0.3: the open-access fee is AP(E*) − MP(E*) from the model"), (await txt("#lab-fee-open")) === "£" + M.pigouvianTax(0.3).toFixed(2), await txt("#lab-fee-open"));
  await lab(20, 0.8);
  const panelsOver = await page.locator("#lake-lab").evaluate((el) => {
    const c = el.getBoundingClientRect();
    return [...el.querySelectorAll(".p-num")].filter((p) => p.getBoundingClientRect().right > c.right + 1).length;
  });
  ok(at("at theta = 0.8 and n = 20 the long readouts stay inside the lab"), panelsOver === 0, `${panelsOver} over`);
  const labText = await txt("#lake-lab");
  ok(at("no exclamation mark, 'exactly' or upper-case tag in the lab"), !labText.includes("!") && !/exactly/i.test(labText));
  await lab(4, 0.5);

  // DissipationFigure: the table is the model's
  const rows = await page.locator("#dissipation-table tbody tr").evaluateAll((trs) => trs.map((r) => [...r.querySelectorAll("td")].map((td) => td.textContent.trim())));
  const ns = [1, 2, 3, 4, 5, 10, 20, 100];
  ok(at("the table's rent lost matches ((n − 1)/n)² for every row"),
     rows.length === ns.length && rows.every((c, i) => c[1] === (100 * M.dissipatedRent(ns[i])).toFixed(2) + "%"), rows.map((c) => c[1]).join(","));
  ok(at("the table's hours ratio matches ((2n − 1)/n)² for every row"),
     rows.every((c, i) => c[4] === M.effortRatio(ns[i]).toFixed(2) + "×"), rows.map((c) => c[4]).join(","));

  // MarginalUserFigure: the second boat's bar is the tallest, each is shorter than the one before, labels stay inside
  const bars = await page.locator("#marginal-figure rect.bar").evaluateAll((rs) => rs.map((r) => r.getBoundingClientRect().height));
  ok(at("eleven bars, the first the tallest, each shorter than the one before"), bars.length === 11 && bars.every((h, i) => i === 0 || h < bars[i - 1]), bars.map((h) => h.toFixed(0)).join(","));
  ok(at("the second boat's bar reads 25.0"), (await txt("#marginal-figure text.bar-label")) === "25.0");
  const barW = await page.locator("#marginal-figure").evaluate((el) => {
    const svg = el.querySelector("svg").getBoundingClientRect();
    return [...el.querySelectorAll("rect.bar")].filter((r) => r.getBoundingClientRect().right > svg.right + 1).length;
  });
  ok(at("every bar is inside the chart"), barW === 0);
  const ml = await inSvg("#marginal-figure");
  ok(at("every label in the bar chart is inside the svg"), ml.length === 0, ml.join(" | "));
  const overlap = await page.locator("#marginal-figure").evaluate((el) => {
    const r = [...el.querySelectorAll("text.bar-label")].map((t) => t.getBoundingClientRect());
    let n = 0;
    for (let i = 1; i < r.length; i++) if (r[i].left < r[i - 1].right - 1 && Math.abs(r[i].top - r[i - 1].top) < r[i].height) n++;
    return n;
  });
  ok(at("no two bar labels overlap"), overlap === 0, `${overlap} overlaps`);

  // furniture
  const furn = await page.evaluate(() => ({
    heads: [...document.querySelectorAll("h3.body-header, h3.card-title")].map((h) => h.textContent.trim()),
    upper: [...document.querySelectorAll("th, .metric-label, .panel-tag, .col-head, h3")].filter((e) => getComputedStyle(e).textTransform === "uppercase").length,
    fig: /Figure \d+\./.test(document.body.innerText),
  }));
  ok(at("no heading is typed in capitals"), furn.heads.every((h) => h !== h.toUpperCase()));
  ok(at("no label, table header or heading is upper-cased by CSS"), furn.upper === 0, `${furn.upper} upper-cased`);
  ok(at("no 'Figure N.' captions"), !furn.fig);

  if (SHOTS) {
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
    await page.locator("#lake-figure").screenshot({ path: `${SHOTS}/${vp.name}-lake.png` });
    await page.locator("#second-boat").screenshot({ path: `${SHOTS}/${vp.name}-second-boat.png` });
    await page.locator("#wedge-figure").screenshot({ path: `${SHOTS}/${vp.name}-wedge.png` });
    await page.locator("#lake-lab").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
    await page.locator("#marginal-figure").screenshot({ path: `${SHOTS}/${vp.name}-marginal.png` });
    await page.locator("#conclusion").screenshot({ path: `${SHOTS}/${vp.name}-end.png` });
  }

  const g1 = await geom();
  ok(at("no NaN/undefined/Infinity in SVG geometry after the interactions"), g1.length === 0, g1.slice(0, 3).join("; "));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${vp.name}-full.png`, fullPage: true });
  ok(at("no page errors or console errors"), noise.length === 0, noise.slice(0, 3).join(" | "));
  await page.close();
}

await browser.close();
if (fails.length) {
  console.log(`\n${fails.length} FAILED of ${pass + fails.length}:`);
  for (const f of fails) console.log("  FAIL " + f);
  process.exit(1);
}
console.log(`\nALL ${pass} CHECKS PASS`);
