/*
  Browser checks for benzoni-collin-dufresne-goldstein-2007 at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/benzoni-collin-dufresne-goldstein-2007-shots node verify/check-browser.mjs

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

  const outside = await page.evaluate(() => {
    const bad = [];
    for (const s of document.querySelectorAll("svg")) {
      if (s.closest(".katex")) continue;
      const r = s.getBoundingClientRect();
      for (const el of s.querySelectorAll("path, circle, rect, line, text")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        if (b.left < r.left - 1.5 || b.right > r.right + 1.5 || b.top < r.top - 1.5 || b.bottom > r.bottom + 1.5)
          bad.push(`${s.getAttribute("class") || "svg"} ${el.tagName}.${el.getAttribute("class") || ""}`);
      }
    }
    return bad;
  });
  ok(at("nothing is drawn outside its svg"), outside.length === 0, outside.slice(0, 4).join("; "));
  const glued = await page.evaluate(() => {
    // the rendered text, laid out (flex items are separate lines), with maths and charts hidden
    const hide = [...document.querySelectorAll(".katex, svg")].filter((e) => !e.closest(".katex") || e.classList.contains("katex"));
    const was = hide.map((e) => e.style.display);
    hide.forEach((e) => (e.style.display = "none"));
    const t = document.body.innerText;
    hide.forEach((e, i) => (e.style.display = was[i]));
    return (t.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/) || [""])[0];
  });
  ok(at("no text glued to a number"), !glued, glued);
  const semis = await page.evaluate(() => [...document.querySelectorAll(".katex annotation")].map((a) => a.textContent).filter((t) => /(^|[^\\]);/.test(t)));
  ok(at("no KaTeX spacing command lost its backslash"), semis.length === 0, semis.slice(0, 2).join(" | "));

  // ---------------------------------------------------- this article's checks
  const width = vp.width;
  const check = (claim, cond, detail = "") => ok(at(claim), cond, detail);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) || "").trim();
  const clickSeg = async (id, v) => { await page.click(`#${id} button[data-value="${v}"]`); await settle(page); };
  const on = (id, v) => page.locator(`#${id} button[data-value="${v}"]`).getAttribute("aria-pressed");
  const val = (sel) => page.locator(sel).first().inputValue();

  // helpers that read a drawn chart back: tick labels give the scales, paths give the marks
  const scales = (svg) => page.evaluate((svg) => {
    const el = document.querySelector(svg);
    const num = (t) => parseFloat(t.replace("−", "-").replace(/[%,]/g, ""));
    const xs = [...el.querySelectorAll(".axis-x g[transform]")].map((g) => ({ v: num(g.querySelector("text").textContent), p: +g.getAttribute("transform").match(/translate\(([-\d.]+)/)[1] }));
    const ys = [...el.querySelectorAll(".axis-y text.tick-label")].map((t) => ({ v: num(t.textContent), p: +t.getAttribute("y") - 4 }));
    return { xs, ys };
  }, svg);
  const lin = (t) => { const a = t[0], b = t[t.length - 1]; const k = (b.p - a.p) / (b.v - a.v); return { px: (v) => a.p + (v - a.v) * k, val: (p) => a.v + (p - a.p) / k }; };
  const pts = (sel) => page.evaluate((sel) => {
    const d = document.querySelector(sel).getAttribute("d");
    const n = d.match(/-?\d+(\.\d+)?/g).map(Number); const o = [];
    for (let i = 0; i + 1 < n.length; i += 2) o.push([n[i], n[i + 1]]);
    return o;
  }, sel);
  const yAt = (poly, px) => { for (let i = 1; i < poly.length; i++) { const [x0, y0] = poly[i - 1], [x1, y1] = poly[i]; if (px >= x0 - 1e-6 && px <= x1 + 1e-6) return y0 + ((px - x0) / (x1 - x0 || 1)) * (y1 - y0); } return NaN; };
  const attr = (sel, a) => page.locator(sel).first().getAttribute(a);
  // the drawn share (in percent) at an age, the drawn loading, from figure 1
  const shareDrawn = async (age, sel = "#fig-hump path.coint") => {
    const sc = await scales("#fig-hump svg.share-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    return Y.val(yAt(await pts(sel), X.px(age)));
  };
  const loadDrawn = async (age, sel = "#fig-hump path.load") => {
    const sc = await scales("#fig-hump svg.load-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    return Y.val(yAt(await pts(sel), X.px(age)));
  };

  // the guess card
  await page.click('#guess button[data-g="less"]'); await settle(page);
  check(`the guess card says right for "less" @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await page.click('#guess button[data-g="more"]'); await settle(page);
  check(`and explains itself for "more" @${width}`, (await txt("#guess-answer")).includes("it's less"));

  // ---- figure 1 at its defaults: half-life 5, risk aversion 2
  check(`the defaults are a half-life of 5 and risk aversion 2 @${width}`, (await val("#hl-h")) === "5" && (await on("hl-g", 2)) === "true");
  check(`readouts: -9% at 25, 122% at 45, 77% at 65, 4,299% for a bond, peak at 45, loading 79% @${width}`,
    (await txt("#hl-r-25 .value")) === "−9%" && (await txt("#hl-r-45 .value")) === "122%" && (await txt("#hl-r-65 .value")) === "77%" &&
    (await txt("#hl-r-bond .value")) === "4,299%" && (await txt("#hl-r-peak .value")) === "45" && (await txt("#hl-r-load .value")) === "79%");
  {
    const sc = await scales("#fig-hump svg.share-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const s25 = await shareDrawn(25), s30 = await shareDrawn(30), s45 = await shareDrawn(45), s60 = await shareDrawn(60), s65 = await shareDrawn(65);
    check(`the drawn share reads -9% at 25 and 85% at 30 @${width}`, near(s25, -9.5, 1.5) && near(s30, 85.2, 1.5), `${s25.toFixed(1)} ${s30.toFixed(1)}`);
    check(`and 122% at 45, 100% at 60 and 77% at 65 @${width}`, near(s45, 122.5, 1.5) && near(s60, 99.8, 1.5) && near(s65, 77.2, 1.5), `${s45.toFixed(1)} ${s60.toFixed(1)} ${s65.toFixed(1)}`);
    const bond = await pts("#fig-hump path.bond");
    check(`the bond rule enters the window at 300% around age 48 and falls from there @${width}`,
      near(Y.val(bond[0][1]), 300, 1) && near(X.val(bond[0][0]), 48.1, 0.5) && bond.every((p, i) => i === 0 || p[1] > bond[i - 1][1]), `${Y.val(bond[0][1]).toFixed(1)} at age ${X.val(bond[0][0]).toFixed(1)}`);
    check(`the zero line is drawn at 0% @${width}`, near(Y.val(+(await attr("#fig-hump .share-panel line.zero-line", "y1"))), 0, 0.6));
    const lo = await loadDrawn(25), th = await loadDrawn(25, "#fig-hump path.thresh"), l55 = await loadDrawn(55);
    check(`the lower chart: loading 78.7% at 25, just above the 78.6% level, and 48% at 55 @${width}`, near(lo, 78.7, 1) && lo > th && lo - th < 0.8 && near(l55, 48.5, 1), `${lo.toFixed(2)} ${th.toFixed(2)} ${l55.toFixed(2)}`);
    const L = await pts("#fig-hump path.load");
    check(`the loading falls at every age @${width}`, L.every((p, i) => i === 0 || p[1] > L[i - 1][1]));
  }

  // half-life 2: short 720%, the line enters the window late
  await setRange(page, "#hl-h", 2);
  check(`half-life 2: -720% at 25, loading 92%, peak at 61 @${width}`, (await txt("#hl-r-25 .value")) === "−720%" && (await txt("#hl-r-load .value")) === "92%" && (await txt("#hl-r-peak .value")) === "61");
  {
    const sc = await scales("#fig-hump svg.share-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const P = await pts("#fig-hump path.coint");
    check(`the drawn line starts at the bottom of the window (-200%), around age 30 @${width}`, near(Y.val(P[0][1]), -200, 1) && X.val(P[0][0]) > 29 && X.val(P[0][0]) < 33, `${Y.val(P[0][1]).toFixed(1)} at ${X.val(P[0][0]).toFixed(1)}`);
    const s60 = await shareDrawn(60);
    check(`and reads 86% at 60 @${width}`, near(s60, 86, 1.5), s60.toFixed(1));
  }
  // half-life 20: above the window at 25
  await setRange(page, "#hl-h", 20);
  check(`half-life 20: 1,996% at 25, peak at 25 @${width}`, (await txt("#hl-r-25 .value")) === "1,996%" && (await txt("#hl-r-peak .value")) === "25");
  {
    const sc = await scales("#fig-hump svg.share-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const P = await pts("#fig-hump path.coint");
    check(`the drawn line enters the window at 300% around age 43 @${width}`, near(Y.val(P[0][1]), 300, 1) && X.val(P[0][0]) > 41 && X.val(P[0][0]) < 45, `${Y.val(P[0][1]).toFixed(1)} at ${X.val(P[0][0]).toFixed(1)}`);
  }
  // risk aversion 4
  await setRange(page, "#hl-h", 5);
  await clickSeg("hl-g", 4);
  check(`risk aversion 4 at a half-life of 5: -2,159% at 25, 2,149% for a bond @${width}`, (await txt("#hl-r-25 .value")) === "−2,159%" && (await txt("#hl-r-bond .value")) === "2,149%");
  await clickSeg("hl-g", 2);

  // ---- shared settings
  await setRange(page, "#hl-h", 12);
  check(`figure 1's half-life carries to figures 2 and 3 @${width}`, (await val("#hz-h")) === "12" && (await val("#ed-h")) === "12");
  await setRange(page, "#hl-h", 5);

  // ---- figure 2: one age at a time (defaults: age 25, half-life 5, risk aversion 2)
  check(`at 25: 40 paydays, loading 78.7%, level 78.6%, share -9% @${width}`,
    (await txt("#hz-r-n .value")) === "40" && (await txt("#hz-r-load .value")) === "78.7%" && (await txt("#hz-r-thr .value")) === "78.6%" && (await txt("#hz-r-share .value")) === "−9%");
  {
    const sc = await scales("#fig-horizon svg.horizon-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const dots = await page.evaluate(() => [...document.querySelectorAll("#fig-horizon circle.dot")].map((c) => ({ cx: +c.getAttribute("cx"), cy: +c.getAttribute("cy"), r: +c.getAttribute("r") })));
    check(`40 dots, one for each payday, the fifth level with 50% at 5 years @${width}`, dots.length === 40 && near(X.val(dots[4].cx), 5, 0.05) && near(Y.val(dots[4].cy), 50, 0.6), `${dots.length} ${dots[4] && Y.val(dots[4].cy).toFixed(2)}`);
    check(`the dots shrink with distance and rise with it @${width}`, dots.every((d, i) => i === 0 || (d.r < dots[i - 1].r && d.cy < dots[i - 1].cy)));
    const avg = Y.val(+(await attr("#fig-horizon line.average", "y1"))), thr = Y.val(+(await attr("#fig-horizon line.thresh", "y1")));
    check(`the average is drawn at 78.7% and the level at 78.6% @${width}`, near(avg, 78.7, 0.3) && near(thr, 78.6, 0.3), `${avg.toFixed(2)} ${thr.toFixed(2)}`);
  }
  await setRange(page, "#hz-age", 45);
  check(`at 45: 20 paydays, loading 65.9%, level 96.4%, share 122% @${width}`,
    (await txt("#hz-r-n .value")) === "20" && (await txt("#hz-r-load .value")) === "65.9%" && (await txt("#hz-r-thr .value")) === "96.4%" && (await txt("#hz-r-share .value")) === "122%");
  await setRange(page, "#hz-age", 55);
  check(`at 55: 10 paydays, loading 48.5%, no level to draw (it is above 100%), share 113% @${width}`,
    (await txt("#hz-r-n .value")) === "10" && (await txt("#hz-r-load .value")) === "48.5%" && (await txt("#hz-r-thr .value")) === "never" && (await txt("#hz-r-share .value")) === "113%" && (await page.locator("#fig-horizon line.thresh").count()) === 0);
  {
    const sc = await scales("#fig-horizon svg.horizon-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const dots = await page.evaluate(() => [...document.querySelectorAll("#fig-horizon circle.dot")].length);
    const left = await pts("#fig-horizon path.curve-left"), all = await pts("#fig-horizon path.curve-all");
    check(`the blue curve stops at 10 years and the grey one runs to 40, with 10 dots @${width}`, dots === 10 && near(X.val(left[left.length - 1][0]), 10, 0.3) && near(X.val(all[all.length - 1][0]), 40, 0.3), `${dots}`);
    const avg = Y.val(+(await attr("#fig-horizon line.average", "y1")));
    check(`and the average line has dropped to 48.5% @${width}`, near(avg, 48.5, 0.4), avg.toFixed(2));
  }
  await setRange(page, "#hz-age", 25);
  check(`figure 2's age slider doesn't move figure 1 @${width}`, (await txt("#hl-r-25 .value")) === "−9%");

  // ---- figure 3: the knife-edge
  check(`at half-life 5: -9% (risk aversion 2), -1,442% (3), -2,159% (4), zero at 5.0 years @${width}`,
    (await txt("#ed-r-2 .value")) === "−9%" && (await txt("#ed-r-3 .value")) === "−1,442%" && (await txt("#ed-r-4 .value")) === "−2,159%" && (await txt("#ed-r-be .value")) === "5.0");
  {
    const sc = await scales("#fig-edge svg.edge-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const rings = await page.evaluate(() => [...document.querySelectorAll("#fig-edge circle.edge-ring")].map((c) => ({ g: +c.dataset.g, cx: +c.getAttribute("cx"), cy: +c.getAttribute("cy") })));
    const want = { 2: 5.04, 3: 13.94, 4: 22.16 };
    check(`the rings sit on the zero line at 5.04, 13.94 and 22.16 years @${width}`, rings.length === 3 && rings.every((r) => near(X.val(r.cx), want[r.g], 0.06) && near(Y.val(r.cy), 0, 20)), rings.map((r) => `${r.g}: ${X.val(r.cx).toFixed(2)}`).join(" "));
    for (const r of rings) {
      const P = await pts(`#fig-edge path.edge-line[data-g="${r.g}"]`);
      const yy = yAt(P, r.cx);
      check(`the line for risk aversion ${r.g} passes through its ring @${width}`, Math.abs(yy - r.cy) < 2.2, `${(yy - r.cy).toFixed(2)}px`);
    }
    const mk = +(await attr("#fig-edge line.h-marker", "x1"));
    check(`the vertical marker is at the half-life, 5 years @${width}`, near(X.val(mk), 5, 0.06), X.val(mk).toFixed(2));
  }
  await clickSeg("ed-g", 4);
  check(`choosing risk aversion 4: the zero is at 22.2 years, and its line is drawn thicker @${width}`,
    (await txt("#ed-r-be .value")) === "22.2" && +(await attr('#fig-edge path.edge-line[data-g="4"]', "stroke-width")) > +(await attr('#fig-edge path.edge-line[data-g="2"]', "stroke-width")) && (await on("hl-g", 4)) === "true");
  await setRange(page, "#ed-h", 12);
  check(`at half-life 12: 1,196%, -237% and -953% @${width}`, (await txt("#ed-r-2 .value")) === "1,196%" && (await txt("#ed-r-3 .value")) === "−237%" && (await txt("#ed-r-4 .value")) === "−953%");
  {
    const sc = await scales("#fig-edge svg.edge-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const mk = +(await attr("#fig-edge line.h-marker", "x1"));
    const P2 = await pts('#fig-edge path.edge-line[data-g="2"]');
    check(`the marker moved to 12 and the blue line reads 1,196% there @${width}`, near(X.val(mk), 12, 0.06) && near(Y.val(yAt(P2, mk)), 1196, 60), `${X.val(mk).toFixed(2)} ${Y.val(yAt(P2, mk)).toFixed(0)}`);
  }
  await clickSeg("ed-g", 2);
  await setRange(page, "#ed-h", 5);

  if (SHOTS) {
    for (const id of await page.evaluate(() => [...document.querySelectorAll(".fin-card, #guess, #paper")].map((c) => c.id))) {
      await page.locator("#" + id).screenshot({ path: `${SHOTS}/${vp.name}-${id}.png` });
    }
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
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
