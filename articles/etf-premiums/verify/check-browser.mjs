/*
  Browser checks for etf-premiums at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/etf-premiums-shots node verify/check-browser.mjs

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
  // read a drawn chart back: tick labels give the scales, paths and circles give the marks
  const scales = (svg) => page.evaluate((svg) => {
    const el = document.querySelector(svg);
    const num = (t) => parseFloat(t.replace("−", "-").replace(/[%,$¢]/g, ""));
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
  const readAt = async (svg, sel, xv) => { const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys); return Y.val(yAt(await pts(sel), X.px(xv))); };
  const click = async (sel) => { await page.click(sel); await settle(page); };

  // ---- when an AP steps in
  const AP = "#fig-arb svg.arb-panel";
  check(`the defaults, 0.8% over with a 0.3% cost: creates, $0.50, pushed back to +0.30% @${width}`,
    (await R("af-r-act")) === "creates" && (await R("af-r-profit")) === "$0.50" && (await R("af-r-after")) === "+0.30%");
  {
    const sc = await scales(AP), X = lin(sc.xs), Y = lin(sc.ys);
    const bx = await nattr(`${AP} rect.band`, "x"), bw = await nattr(`${AP} rect.band`, "width");
    check(`the grey band runs from −0.3% to +0.3% @${width}`, Math.abs(X.val(bx) + 0.3) < 0.02 && Math.abs(X.val(bx + bw) - 0.3) < 0.02, `${X.val(bx).toFixed(3)} ${X.val(bx + bw).toFixed(3)}`);
    const cx = await nattr(`${AP} circle.dot`, "cx"), cy = await nattr(`${AP} circle.dot`, "cy");
    const P = await pts(`${AP} path.create`);
    check(`the dot is on the pink line at 0.8%, 50 cents @${width}`, Math.abs(X.val(cx) - 0.8) < 0.02 && Math.abs(yAt(P, cx) - cy) < 0.5 && Math.abs(Y.val(cy) - 0.5) < 0.03, `${X.val(cx).toFixed(3)} ${Y.val(cy).toFixed(3)}`);
    const zc = await readAt(AP, `${AP} path.create`, 0.3), zr = await readAt(AP, `${AP} path.redeem`, -0.3);
    check(`both lines cross zero at the band's edges @${width}`, Math.abs(zc) < 0.02 && Math.abs(zr) < 0.02, `${zc.toFixed(3)} ${zr.toFixed(3)}`);
  }
  await setRange(page, "#af-x", -0.008);
  check(`at −0.8%: redeems, $0.50, back to −0.30% @${width}`, (await R("af-r-act")) === "redeems" && (await R("af-r-profit")) === "$0.50" && (await R("af-r-after")) === "−0.30%");
  await setRange(page, "#af-x", 0.001);
  check(`at +0.1% nobody acts @${width}`, (await R("af-r-act")) === "does nothing" && (await R("af-r-profit")) === "$0.00" && (await R("af-r-after")) === "+0.10%" && (await has(`${AP} circle.dot`)) === 0);
  await setRange(page, "#af-x", 0.008);
  await setRange(page, "#af-c", 0.01);
  check(`with a 1% cost, 0.8% is inside the band @${width}`, (await R("af-r-act")) === "does nothing");
  await setRange(page, "#af-c", 0.003);

  // ---- the sell-off
  const PP = "#fig-selloff svg.price-panel", QP = "#fig-selloff svg.prem-panel";
  check(`the defaults, a 10% fall with a fifth trading: deepest −5.6% on day 5, −1.9% on day 10, prices 4.0 days old @${width}`,
    (await R("so-r-worst")) === "−5.6%" && (await R("so-r-day")) === "5" && (await R("so-r-d10")) === "−1.9%" && (await R("so-r-lag")) === "4.0 days");
  {
    const p5 = await readAt(PP, `${PP} path.price`, 5), n5 = await readAt(PP, `${PP} path.nav`, 5);
    check(`on day 5 the price line is at $90.00 and the NAV at $95.33 @${width}`, Math.abs(p5 - 90) < 0.15 && Math.abs(n5 - 95.33) < 0.15, `${p5.toFixed(2)} ${n5.toFixed(2)}`);
    const bars = await page.evaluate((QP) => [...document.querySelectorAll(`${QP} rect.prem-bar`)].map((b) => ({ t: +b.dataset.t, y: +b.getAttribute("y"), h: +b.getAttribute("height") })), QP);
    const sc = await scales(QP), Y = lin(sc.ys);
    const b5 = bars.find((b) => b.t === 5), b10 = bars.find((b) => b.t === 10);
    check(`20 bars, and the fifth reaches −5.6% and the tenth −1.9% @${width}`, bars.length === 20 && Math.abs(Y.val(b5.y + b5.h) + 5.59) < 0.1 && Math.abs(Y.val(b10.y + b10.h) + 1.9) < 0.1, `${Y.val(b5.y + b5.h).toFixed(2)} ${Y.val(b10.y + b10.h).toFixed(2)}`);
    const bd = await page.evaluate((QP) => { const r = document.querySelector(`${QP} rect.band`); return [+r.getAttribute("y"), +r.getAttribute("height")]; }, QP);
    check(`the grey band is ±0.3% @${width}`, Math.abs(Y.val(bd[0]) - 0.3) < 0.05 && Math.abs(Y.val(bd[0] + bd[1]) + 0.3) < 0.05);
    check(`the fifth bar reaches well outside the band @${width}`, b5.y + b5.h > bd[0] + bd[1] + 20);
  }
  await setRange(page, "#so-p", 1);
  check(`with every bond trading, no discount @${width}`, (await R("so-r-worst")) === "0.0%" && (await R("so-r-lag")) === "0.0 days");
  await setRange(page, "#so-p", 0.1);
  await setRange(page, "#so-fall", 0.2);
  check(`a 20% fall with a tenth trading still fits the window @${width}`, (await R("so-r-worst")) === "−15.4%");
  await setRange(page, "#so-fall", 0.1);
  await setRange(page, "#so-p", 0.2);

  // ---- who moves after a premium
  const GN = "#fig-gap svg.reg-panel.nav", GPr = "#fig-gap svg.reg-panel.price";
  check(`the defaults: NAV slope 0.19, price slope −0.04 @${width}`, (await R("gr-r-nav")) === "0.19" && (await R("gr-r-price")) === "−0.04");
  const fitSlope = async (svg) => { const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys); const P = await pts(`${svg} path.fit`); return (Y.val(P[1][1]) - Y.val(P[0][1])) / (X.val(P[1][0]) - X.val(P[0][0])); };
  {
    const a = await fitSlope(GN), b = await fitSlope(GPr);
    check(`the drawn lines have those slopes @${width}`, Math.abs(a - 0.192) < 0.01 && Math.abs(b + 0.036) < 0.01, `${a.toFixed(3)} ${b.toFixed(3)}`);
    check(`a thousand days in each panel @${width}`, (await has(`${GN} circle.day`)) === 1000 && (await has(`${GPr} circle.day`)) === 1000);
    const tops = await page.evaluate(([a, b]) => [document.querySelector(a).getBoundingClientRect().top, document.querySelector(b).getBoundingClientRect().top], [GN, GPr]);
    check(width > 700 ? `the two panels sit side by side @${width}` : `the two panels stack on a phone @${width}`, width > 700 ? Math.abs(tops[0] - tops[1]) < 1 : tops[1] > tops[0] + 100);
  }
  await setRange(page, "#gr-p", 0.5);
  check(`at half the bonds trading: NAV slope 0.44, price slope −0.09 @${width}`, (await R("gr-r-nav")) === "0.44" && (await R("gr-r-price")) === "−0.09");
  {
    const a = await fitSlope(GN);
    check(`and the drawn NAV line steepens with it @${width}`, Math.abs(a - 0.444) < 0.015, a.toFixed(3));
  }
  check(`the sell-off lab keeps its own share @${width}`, (await val("#so-p")) === "0.2");
  await setRange(page, "#gr-p", 0.2);

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
