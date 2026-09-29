/*
  Browser checks for cost-of-leverage at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/cost-of-leverage-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
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
  const R = (id) => txt(`#${id} .value`);
  const has = (sel) => page.locator(sel).count();

  // helpers that read a drawn chart back: tick labels give the scales, paths and rects give the marks
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
  // the path's numbers are printed to two decimals, so clamp to its ends
  const yAt = (poly, px) => { const x = Math.min(Math.max(px, poly[0][0]), poly[poly.length - 1][0]); for (let i = 1; i < poly.length; i++) { const [x0, y0] = poly[i - 1], [x1, y1] = poly[i]; if (x >= x0 - 1e-6 && x <= x1 + 1e-6) return y0 + ((x - x0) / (x1 - x0 || 1)) * (y1 - y0); } return NaN; };
  const attr = (sel, a) => page.locator(sel).first().getAttribute(a);
  const nattr = async (sel, a) => +(await attr(sel, a));
  // a drawn line read at an x value, in the units of the y axis (percent, or points a year)
  const readAt = async (svg, sel, xv) => { const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys); return Y.val(yAt(await pts(sel), X.px(xv))); };
  const bandVals = async (svg) => { const sc = await scales(svg), X = lin(sc.xs); const x = await nattr(`${svg} rect.band`, "x"), w = await nattr(`${svg} rect.band`, "width"); return [X.val(x), X.val(x + w)]; };
  const markerVal = async (svg) => { const sc = await scales(svg), X = lin(sc.xs); return X.val(await nattr(`${svg} line.g-marker`, "x1")); };
  const dotVal = async (svg, cls = "dot") => { const sc = await scales(svg), Y = lin(sc.ys); return Y.val(await nattr(`${svg} circle.${cls}`, "cy")); };
  const fin = (n) => Number.isFinite(n);

  // the guess card
  await page.click('#guess button[data-g="exact"]'); await settle(page);
  check(`the guess card says right for "exactly 100%" @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await page.click('#guess button[data-g="same"]'); await settle(page);
  check(`and says what it is for "still about 154%" @${width}`, (await txt("#guess-answer")).startsWith("It's exactly 100%"));

  // ---- figure 1 at its defaults: spread 2 points, risk aversion 1
  const K1 = "#fig-kink svg.kink-panel";
  check(`the defaults are a spread of 2 points and a risk aversion of 1 @${width}`, (await val("#kl-s")) === "2" && (await val("#kl-g")) === "1");
  check(`readouts: 154% at the safe rate, 93% at the borrower's rate, 100% with the spread, she stays at exactly 100% @${width}`,
    (await R("kl-r-lend")) === "154%" && (await R("kl-r-borrow")) === "93%" && (await R("kl-r-share")) === "100%" && (await R("kl-r-regime")) === "Stays at exactly 100%");
  check(`and the strip is 0.93 to 1.54, with 0.48 points a year given up @${width}`, (await R("kl-r-band")) === "0.93 to 1.54" && (await R("kl-r-given")) === "0.48");
  {
    const p = [0.5, 1, 1.25, 1.5, 2, 4], want = [185.2, 100, 100, 100, 77.2, 38.6];
    const got = []; for (const g of p) got.push(await readAt(K1, `${K1} path.plan`, g));
    check(`the blue line reads 185% at 0.5, exactly 100% from 1 to 1.5, 77% at 2 and 39% at 4 @${width}`, got.every((v, i) => near(v, want[i], 1.2)), got.map((v) => v.toFixed(1)).join(" "));
    const lw = [308.6, 154.3, 77.2, 38.6], lg = []; for (const g of [0.5, 1, 2, 4]) lg.push(await readAt(K1, `${K1} path.lender`, g));
    check(`the dashed line reads 309% at 0.5, 154% at 1, 77% at 2 and 39% at 4 @${width}`, lg.every((v, i) => near(v, lw[i], 1.5)), lg.map((v) => v.toFixed(1)).join(" "));
    const [b0, b1] = await bandVals(K1);
    check(`the shaded strip runs from 0.93 to 1.54 @${width}`, near(b0, 0.926, 0.02) && near(b1, 1.543, 0.02), `${b0.toFixed(3)} ${b1.toFixed(3)}`);
    check(`the marker is at a risk aversion of 1, the blue dot at 100% and the ring at 154% @${width}`, near(await markerVal(K1), 1, 0.02) && near(await dotVal(K1), 100, 1.2) && near(await dotVal(K1, "lender-dot"), 154.3, 1.5));
    const P = await pts(`${K1} path.plan`);
    check(`the blue line never rises with risk aversion (the pixel height never falls) @${width}`, P.every((q, i) => i === 0 || q[1] >= P[i - 1][1] - 0.02));
  }
  // no spread: no strip, she borrows
  await setRange(page, "#kl-s", 0);
  check(`no spread: she borrows, holds 154%, gives up nothing, and no strip is drawn @${width}`,
    (await R("kl-r-regime")) === "Borrows" && (await R("kl-r-share")) === "154%" && (await R("kl-r-band")) === "none" && (await R("kl-r-given")) === "0.00" && (await has(`${K1} rect.band`)) === 0);
  {
    const a = await readAt(K1, `${K1} path.plan`, 1), b = await readAt(K1, `${K1} path.lender`, 1);
    check(`and the two lines are the same line @${width}`, near(a, b, 0.5) && near(a, 154.3, 1.5), `${a.toFixed(1)} ${b.toFixed(1)}`);
  }
  await setRange(page, "#kl-s", 1);
  check(`one point: the strip is 1.23 to 1.54, and at a risk aversion of 1 she borrows 123% @${width}`, (await R("kl-r-band")) === "1.23 to 1.54" && (await R("kl-r-share")) === "123%" && (await R("kl-r-regime")) === "Borrows");
  await setRange(page, "#kl-s", 5);
  check(`five points: the strip is 0.00 to 1.54 and the borrower's share is 0% @${width}`, (await R("kl-r-band")) === "0.00 to 1.54" && (await R("kl-r-borrow")) === "0%" && (await R("kl-r-share")) === "100%");
  {
    const [b0, b1] = await bandVals(K1);
    check(`and the strip is drawn from the left edge of the chart to 1.54 @${width}`, near(b0, 0.5, 0.02) && near(b1, 1.543, 0.02), `${b0.toFixed(3)} ${b1.toFixed(3)}`);
    const at05 = await readAt(K1, `${K1} path.plan`, 0.5);
    check(`and the blue line is flat at 100% from 0.5 @${width}`, near(at05, 100, 1.2), at05.toFixed(1));
  }
  await setRange(page, "#kl-s", 2);
  await setRange(page, "#kl-g", 0.5);
  check(`risk aversion 0.5: she borrows 185% instead of 309%, and gives up 2.94 points a year @${width}`, (await R("kl-r-share")) === "185%" && (await R("kl-r-lend")) === "309%" && (await R("kl-r-regime")) === "Borrows" && (await R("kl-r-given")) === "2.94");
  check(`the marker moved to 0.5 and the dot reads 185% @${width}`, near(await markerVal(K1), 0.5, 0.02) && near(await dotVal(K1), 185.2, 1.5), `${await markerVal(K1)} ${await dotVal(K1)}`);
  await setRange(page, "#kl-g", 2);
  check(`risk aversion 2: she lends 77% and gives up nothing @${width}`, (await R("kl-r-share")) === "77%" && (await R("kl-r-regime")) === "Lends" && (await R("kl-r-given")) === "0.00");
  await setRange(page, "#kl-g", 0.9);
  check(`risk aversion 0.9: she still borrows, a little, 103% @${width}`, (await R("kl-r-share")) === "103%" && (await R("kl-r-regime")) === "Borrows");
  await setRange(page, "#kl-g", 1);
  check(`the sliders in the other figures follow: spread 2 and risk aversion 1 in the cost chart @${width}`, (await val("#cs-s")) === "2" && (await val("#cs-g")) === "1" && (await val("#lf-s")) === "2");

  // ---- figure 2: a working life
  const L1 = "#fig-life svg.life-panel";
  check(`the working life starts at risk aversion 2 @${width}`, (await on("lf-g", 2)) === "true");
  check(`readouts: 1,879% at 25 against 4,299% at the safe rate, 201% at 45, 77% at 65 @${width}`,
    (await R("lf-r-25")) === "1,879%" && (await R("lf-r-25-free")) === "4,299%" && (await R("lf-r-45")) === "201%" && (await R("lf-r-65")) === "77%");
  check(`she borrows until about 55 and lends from about 62 @${width}`, (await R("lf-r-lever")) === "55" && (await R("lf-r-lend")) === "62", `${await R("lf-r-lever")} ${await R("lf-r-lend")}`);
  {
    const want = { 45: 200.8, 50: 139.9, 55: 100, 60: 100, 65: 77.2 }, got = {};
    for (const a of Object.keys(want)) got[a] = await readAt(L1, `${L1} path.plan`, +a);
    check(`the blue line reads 201% at 45, 140% at 50, 100% at 55 and 60, 77% at 65 @${width}`, Object.keys(want).every((a) => near(got[a], want[a], 4)), JSON.stringify(got));
    const gw = { 45: 386.9, 50: 257.5, 55: 173, 60: 116.1, 65: 77.2 };
    // the dashed line leaves the window at 300%, so only the ages inside it are read
    const gg = {}; for (const a of [50, 55, 60, 65]) gg[a] = await readAt(L1, `${L1} path.ghost`, a);
    check(`the dashed line reads 258% at 50, 173% at 55, 116% at 60, 77% at 65 @${width}`, [50, 55, 60, 65].every((a) => near(gg[a], gw[a], 4)), JSON.stringify(gg));
    const Pp = await pts(`${L1} path.plan`), sc = await scales(L1), Y = lin(sc.ys), X = lin(sc.xs);
    check(`the blue line enters the window at 320% around age 39 and is drawn only inside it @${width}`, near(Y.val(Pp[0][1]), 320, 1) && X.val(Pp[0][0]) > 37 && X.val(Pp[0][0]) < 41, `${Y.val(Pp[0][1]).toFixed(1)} at ${X.val(Pp[0][0]).toFixed(1)}`);
    check(`the blue line never rises with age @${width}`, Pp.every((q, i) => i === 0 || q[1] >= Pp[i - 1][1] - 0.02));
    const [b0, b1] = await bandVals(L1);
    check(`the shaded strip runs from about 55 to about 62 @${width}`, near(b0, 54.75, 0.3) && near(b1, 61.85, 0.3), `${b0.toFixed(2)} ${b1.toFixed(2)}`);
  }
  await setRange(page, "#lf-s", 4);
  check(`4 points: 480% at 25, she borrows until about 38, holds 100% at 45 @${width}`, (await R("lf-r-25")) === "480%" && (await R("lf-r-lever")) === "38" && (await R("lf-r-45")) === "100%", `${await R("lf-r-lever")}`);
  await setRange(page, "#lf-s", 5);
  check(`5 points: 100% at 25, she never borrows, and the strip starts at 25 @${width}`, (await R("lf-r-25")) === "100%" && (await R("lf-r-lever")) === "never");
  {
    const [b0] = await bandVals(L1);
    check(`the strip starts at the left edge, age 25 @${width}`, near(b0, 25, 0.1), b0.toFixed(2));
  }
  await setRange(page, "#lf-s", 0);
  check(`0 points: 4,299% at 25, she borrows until about 62, and no strip is drawn @${width}`, (await R("lf-r-25")) === "4,299%" && (await R("lf-r-lever")) === "62" && (await has(`${L1} rect.band`)) === 0);
  await setRange(page, "#lf-s", 3);
  check(`3 points: 1,090% at 25, and she borrows until about 48 @${width}`, (await R("lf-r-25")) === "1,090%" && (await R("lf-r-lever")) === "48", await R("lf-r-lever"));
  await setRange(page, "#lf-s", 2);
  await clickSeg("lf-g", 4);
  check(`risk aversion 4: 939% at 25, 100% at 45 and 39% at 65 @${width}`, (await R("lf-r-25")) === "939%" && (await R("lf-r-45")) === "100%" && (await R("lf-r-65")) === "39%");
  await clickSeg("lf-g", 1);
  check(`risk aversion 1: 3,758% at 25, and she never lends before 65 @${width}`, (await R("lf-r-25")) === "3,758%" && (await R("lf-r-lend")) === "never");
  await clickSeg("lf-g", 2);
  check(`the spread slider here moves the one in the first figure @${width}`, (await val("#kl-s")) === "2");
  await setRange(page, "#lf-s", 3);
  check(`and the sliders elsewhere follow it (3 points) @${width}`, (await val("#kl-s")) === "3" && (await val("#cs-s")) === "3");
  await setRange(page, "#lf-s", 2);

  // ---- figure 3: the return given up
  const C1 = "#fig-cost svg.cost-panel";
  check(`readouts at 2 points and a risk aversion of 1: 0.48 points a year, Sharpe ratio 0.17, 36% of the reward @${width}`, (await R("cs-r-given")) === "0.48" && (await R("cs-r-sharpe")) === "0.17" && (await R("cs-r-kept")) === "36%");
  {
    const p = [0.5, 0.75, 1, 1.25, 1.75, 3], want = [2.94, 1.29, 0.48, 0.11, 0, 0], got = [];
    for (const g of p) got.push(await readAt(C1, `${C1} path.given`, g));
    check(`the red line reads 2.9 points at 0.5, 1.3 at 0.75, 0.5 at 1, 0.1 at 1.25 and 0 beyond 1.54 @${width}`, got.every((v, i) => near(v, want[i], 0.12)), got.map((v) => v.toFixed(2)).join(" "));
    const [b0, b1] = await bandVals(C1);
    check(`the strip is the same as in the first figure @${width}`, near(b0, 0.926, 0.02) && near(b1, 1.543, 0.02));
    check(`the marker is at 1 and the dot at 0.48 @${width}`, near(await markerVal(C1), 1, 0.02) && near(await dotVal(C1), 0.48, 0.1), `${await dotVal(C1)}`);
  }
  await setRange(page, "#cs-g", 0.5);
  check(`risk aversion 0.5: 2.94 points a year, and the dot at the same height @${width}`, (await R("cs-r-given")) === "2.94" && near(await dotVal(C1), 2.94, 0.12), `${await dotVal(C1)}`);
  await setRange(page, "#cs-s", 0);
  check(`no spread: nothing given up, Sharpe ratio 0.28, all of the reward @${width}`, (await R("cs-r-given")) === "0.00" && (await R("cs-r-sharpe")) === "0.28" && (await R("cs-r-kept")) === "100%" && (await has(`${C1} rect.band`)) === 0);
  await setRange(page, "#cs-s", 4);
  check(`4 points: Sharpe ratio 0.06 and 4% of the reward @${width}`, (await R("cs-r-sharpe")) === "0.06" && (await R("cs-r-kept")) === "4%");
  await setRange(page, "#cs-s", 5);
  {
    const v = await readAt(C1, `${C1} path.given`, 0.5);
    check(`5 points at risk aversion 0.5: 3.53 points, inside the window @${width}`, (await R("cs-r-given")) === "3.53" && near(v, 3.53, 0.12), v.toFixed(2));
  }
  await setRange(page, "#cs-s", 2);
  await setRange(page, "#cs-g", 1);
  check(`the sliders in figure 1 follow (spread 2, risk aversion 1) @${width}`, (await val("#kl-s")) === "2" && (await val("#kl-g")) === "1");

  if (SHOTS) {
    for (const id of await page.evaluate(() => [...document.querySelectorAll(".fin-card, #guess")].map((c) => c.id))) {
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
