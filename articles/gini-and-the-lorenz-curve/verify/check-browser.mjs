/*
  Browser checks for gini-and-the-lorenz-curve at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/gini-and-the-lorenz-curve-shots node verify/check-browser.mjs

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
  // The model, so the expected values below are the module's, not typed in.
  const G = await import("../src/inequality.js");
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) || "").replace(/\s+/g, " ").trim();
  // Distance in screen pixels from a point to a polyline, both through the element's own CTM.
  const onPath = async (pathSel, circleSel) => page.evaluate(([ps, cs]) => {
    const path = document.querySelector(ps), c = document.querySelector(cs);
    const toScreen = (el, x, y) => { const m = el.getScreenCTM(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };
    const len = path.getTotalLength();
    const ctr = toScreen(c, +c.getAttribute("cx"), +c.getAttribute("cy"));
    let best = Infinity;
    for (let i = 0; i <= 2000; i++) {
      const p = path.getPointAtLength((len * i) / 2000);
      const s = toScreen(path, p.x, p.y);
      best = Math.min(best, Math.hypot(s.x - ctr.x, s.y - ctr.y));
    }
    return best;
  }, [pathSel, circleSel]);

  // ThreeRoutes: the three routes agree on the default list and on a typed one
  const routes = async () => [await num(page, "#route-pairs"), await num(page, "#route-cov"), await num(page, "#route-lorenz")];
  const r0 = await routes();
  const g0v = G.giniPairs([3, 5, 8, 14, 30]);
  ok(at("the three routes read the module's Gini for the default incomes"), r0.every((v) => near(v, g0v, 5e-5)), r0.join(", "));
  const typed = [1, 2, 2, 7, 40, 120];
  await page.locator("#income-input").fill(typed.join(", ")); await settle(page);
  const r1 = await routes();
  const g1v = G.giniPairs(typed);
  ok(at("typing new incomes moves all three routes to the module's Gini"), r1.every((v) => near(v, g1v, 5e-5)) && !near(r1[0], r0[0], 0.01), `${r1.join(", ")} vs ${g1v.toFixed(4)}`);
  const desc = await txt("#route-pairs-desc");
  const mu1 = typed.reduce((a, b) => a + b, 0) / typed.length;
  ok(at("the pairwise box reads the average gap as 2G of the mean"), desc.includes(`${(2 * g1v * mu1).toFixed(1)} on average`) && desc.includes(`${(200 * g1v).toFixed(1)}%`), desc);
  await page.locator("#income-input").fill("5, 5, 5, 5"); await settle(page);
  ok(at("equal incomes give a Gini of zero on every route"), (await routes()).every((v) => near(v, 0, 5e-5)));

  // TwoPopulations: the shares, and the red dot on both curves in screen pixels
  const shares = [await num(page, "#bottom-p"), await num(page, "#bottom-q"), await num(page, "#top-p"), await num(page, "#top-q")];
  const want = [G.lorenzTwo(0.3, G.SOC_P), G.lorenzTwo(0.3, G.SOC_Q), 1 - G.lorenzTwo(0.85, G.SOC_P), 1 - G.lorenzTwo(0.85, G.SOC_Q)].map((v) => +(100 * v).toFixed(1));
  ok(at(`the society boxes read ${want.join(", ")}`), shares.every((v, i) => v === want[i]), shares.join(", "));
  await page.locator("#two-populations").scrollIntoViewIfNeeded();
  const dP = await onPath("#two-populations path.lorenz-p", "#two-populations circle.cross-dot");
  const dQ = await onPath("#two-populations path.lorenz-q", "#two-populations circle.cross-dot");
  ok(at("the red dot sits on both Lorenz curves"), dP < 0.6 && dQ < 0.6, `${dP.toFixed(2)}px, ${dQ.toFixed(2)}px`);

  // AtkinsonFigure: readouts follow the closed form, and the verdict flips at the tie
  for (const e of [0.1, 0.45, 2, 8]) {
    await setRange(page, "#atk-eps-slider", e);
    const aP = await num(page, "#atk-p"), aQ = await num(page, "#atk-q");
    const eP = G.atkinsonTwo(e, G.SOC_P), eQ = G.atkinsonTwo(e, G.SOC_Q);
    ok(at(`at eps = ${e} the Atkinson readouts are ${eP.toFixed(4)} and ${eQ.toFixed(4)}`), near(aP, eP, 6e-5) && near(aQ, eQ, 6e-5), `${aP}, ${aQ}`);
    const v = await txt("#atk-verdict");
    const r = eP / eQ;
    const expect = Math.abs(r - 1) < 0.01 ? "About even" : r > 1 ? `P is ${r.toFixed(2)}× Q` : `Q is ${(1 / r).toFixed(2)}× P`;
    ok(at(`at eps = ${e} the verdict reads "${expect}"`), v === expect, v);
  }
  ok(at("the verdict at eps = 8 is the 2.61 the prose rounds to 2.6"), (await txt("#atk-verdict")) === "P is 2.61× Q");
  await setRange(page, "#atk-eps-slider", 0.1);
  ok(at("at low eps the banner says Q is more unequal"), /Q is judged more unequal/.test(await txt("#atk-banner")));
  await setRange(page, "#atk-eps-slider", 1);
  ok(at("above the tie the banner says P is more unequal"), /P is judged more unequal/.test(await txt("#atk-banner")));

  // TopShareFigure: every cell against the module
  const cells = await page.locator("#top-share-figure tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent.trim())));
  const alpha = G.paretoAlpha(G.TOP_G), sig = G.lognormalSigma(G.TOP_G);
  const topOk = [0.1, 0.05, 0.01, 0.001].every((p, i) => {
    const a = 100 * G.topPareto(p, alpha), b = 100 * G.topLognormalExact(p, sig);
    return cells[i][1] === a.toFixed(2) + "%" && cells[i][2] === b.toFixed(2) + "%" && cells[i][3] === (a / b).toFixed(2) + "×";
  });
  ok(at("the top-share table matches the module"), topOk, cells.map((r) => r.join(" ")).join(" | "));

  // CapFigure: table against the module, the cut-off dots on their curves, and B's kink
  const capRows = await page.locator("#cap-figure tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent.trim())));
  const capOk = [0.01, 0.05, 0.1, 0.2, 0.5].every((f, i) => {
    const a = G.captureShift(f), b = G.captureSlice(f);
    return capRows[i][1] === (100 * a).toFixed(1) + "%" && capRows[i][2] === (100 * b).toFixed(1) + "%" && capRows[i][3] === (b > a ? "B" : "A");
  });
  ok(at("the capture table matches the module, with B ahead at the top and A at 50%"), capOk && capRows[0][3] === "B" && capRows[4][3] === "A", capRows.map((r) => r.join(" ")).join(" | "));
  ok(at("the 10% row reads 25.5% for A and 40.0% for B"), capRows[2][1] === "25.5%" && capRows[2][2] === "40.0%", capRows[2].join(" "));
  await page.locator("#cap-figure").scrollIntoViewIfNeeded();
  const dA = await onPath("#cap-figure path.cap-a", "#cap-figure circle.cut-a");
  const dB = await onPath("#cap-figure path.cap-b", "#cap-figure circle.cut-b");
  ok(at("each 10% dot sits on its own CAP curve"), dA < 0.8 && dB < 0.8, `${dA.toFixed(2)}px, ${dB.toFixed(2)}px`);
  const dBwrong = await onPath("#cap-figure path.cap-a", "#cap-figure circle.cut-b");
  ok(at("and B's dot is well off A's curve"), dBwrong > 10, `${dBwrong.toFixed(1)}px`);
  const kink = await page.evaluate(() => {
    const p = document.querySelector("#cap-figure path.cap-b"), q = document.querySelector("#cap-figure path.cap-perfect");
    const pts = (el) => el.getAttribute("d").replace(/[ML]/g, " ").trim().split(/\s+/).map(Number);
    const b = pts(p), c = pts(q);
    // B's first leg lies along the perfect scorecard's first leg: same slope
    return { sB: (b[3] - b[1]) / (b[2] - b[0]), sP: (c[3] - c[1]) / (c[2] - c[0]) };
  });
  ok(at("B's curve starts along the perfect scorecard's line"), near(kink.sB, kink.sP, 1e-6), `${kink.sB} vs ${kink.sP}`);

  // Prose numbers that come from the module
  const body = await page.evaluate(() => document.querySelector("main").innerText.replace(/\s+/g, " "));
  const gap = (100 * (G.captureSlice(0.1) - G.captureShift(0.1))).toFixed(1);
  ok(at(`the prose gives the 10% gap as ${gap} percentage points`), body.includes(`a gap of ${gap} percentage points`));
  ok(at("the prose gives the tie at eps = 0.4633 and both Ginis"), body.includes(`ε = ${G.epsTie.toFixed(4)} the two`) && body.includes(`same Gini, ${G.giniPQ.toFixed(4)}`));
  ok(at("no text glued to a number"), !/\d[a-z]{3,}/.test(body.replace(/\d+(st|nd|rd|th)\b/g, "")), (body.match(/.{0,20}\d[a-z]{3,}.{0,10}/) || [""])[0]);

  if (SHOTS) {
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
    await page.locator("#two-populations").screenshot({ path: `${SHOTS}/${vp.name}-lorenz.png` });
    await page.locator("#atkinson-figure").screenshot({ path: `${SHOTS}/${vp.name}-atkinson.png` });
    await page.locator("#cap-figure").screenshot({ path: `${SHOTS}/${vp.name}-cap.png` });
    await page.locator("#three-routes").screenshot({ path: `${SHOTS}/${vp.name}-routes.png` });
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
