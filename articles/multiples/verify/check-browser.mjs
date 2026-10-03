/*
  Browser checks for multiples at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8791 SHOTS=/tmp/multiples-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8791";
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

  // the guess card
  await click('#guess button[data-g="same"]');
  check(`the guess card says right for the same @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await click('#guess button[data-g="b"]');
  check(`and corrects Firm B @${width}`, (await txt("#guess-answer")).startsWith("They're the same."));

  // ---- the lab: P/E against growth
  const GP = "#fig-growth svg.pe-panel";
  check(`the lab opens on ROE 12% and growth 6%: P/E 25.0, P/B 3.00, half paid out, growth worth +$12.50 @${width}`,
    (await R("gl-r-pe")) === "25.0" && (await R("gl-r-pb")) === "3.00" && (await R("gl-r-pay")) === "50%" &&
    (await R("gl-r-nog")) === "$12.50" && (await R("gl-r-pvgo")) === "+$12.50" && (await R("gl-r-ey")) === "4.0%");
  const dotOn = async (svg, dotSel, lineSel) => {
    const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${svg} ${dotSel}`, "cx"), cy = await nattr(`${svg} ${dotSel}`, "cy");
    const poly = await pts(`${svg} ${lineSel}`);
    return { x: X.val(cx), y: Y.val(cy), off: Math.abs(yAt(poly, cx) - cy) };
  };
  {
    const d = await dotOn(GP, "circle.firm", "path.curve.sel");
    check(`the dot sits at 6% growth and a P/E of 25, on the blue curve @${width}`, Math.abs(d.x - 6) < 0.05 && Math.abs(d.y - 25) < 0.1 && d.off < 0.6, JSON.stringify(d));
    const starts = await page.evaluate((GP) => [...document.querySelectorAll(`${GP} path.fam, ${GP} path.curve.sel`)].map((p) => { const n = p.getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number); return [n[0], n[1]]; }), GP);
    const flatY = await nattr(`${GP} line.flat`, "y1");
    check(`every curve starts at the flat line, at zero growth @${width}`, starts.length === 7 && starts.every(([, yy]) => Math.abs(yy - flatY) < 0.6), starts.map((s) => s[1].toFixed(1)).join(" "));
    const sc = await scales(GP), Y = lin(sc.ys);
    check(`the flat line is at a P/E of 12.5 @${width}`, Math.abs(Y.val(flatY) - 12.5) < 0.05);
  }
  await setRange(page, "#gl-roe", 0.08);
  {
    const flatY = await nattr(`${GP} line.flat`, "y1");
    const poly = await pts(`${GP} path.curve.sel`);
    check(`at ROE 8% the blue curve lies on the dashed line @${width}`, poly.length > 50 && poly.every(([, yy]) => Math.abs(yy - flatY) < 0.6) && (await R("gl-r-pe")) === "12.5" && (await R("gl-r-pb")) === "1.00");
    await setRange(page, "#gl-g", 0.02);
    const a = await R("gl-r-pe");
    await setRange(page, "#gl-g", 0.06);
    check(`and dragging the growth leaves the P/E at 12.5 @${width}`, a === "12.5" && (await R("gl-r-pe")) === "12.5" && (await R("gl-r-pvgo")) === "$0.00");
  }
  await setRange(page, "#gl-roe", 0.06);
  await setRange(page, "#gl-g", 0.03);
  {
    const d = await dotOn(GP, "circle.firm", "path.curve.sel");
    check(`at ROE 6% and 3% growth the P/E is 10.0 and growth is worth −$2.50 @${width}`, (await R("gl-r-pe")) === "10.0" && (await R("gl-r-pvgo")) === "−$2.50" && Math.abs(d.y - 10) < 0.1 && d.off < 0.6, JSON.stringify(d));
  }
  await setRange(page, "#gl-roe", 0.04);
  await setRange(page, "#gl-g", 0.06);
  check(`growth is capped at the return on equity, with a note @${width}`, (await has("#gl-cap")) === 1 && (await R("gl-r-pay")) === "0%" && (await R("gl-r-pe")) === "0.0");
  await setRange(page, "#gl-roe", 0.2);
  await setRange(page, "#gl-g", 0.065);
  {
    const d = await dotOn(GP, "circle.firm", "path.curve.sel");
    check(`the far corner (ROE 20%, growth 6.5%) reads 45.0, inside the chart @${width}`, (await R("gl-r-pe")) === "45.0" && Math.abs(d.y - 45) < 0.2 && (await has("#gl-cap")) === 0, JSON.stringify(d));
  }
  await setRange(page, "#gl-roe", 0.12);
  await setRange(page, "#gl-g", 0.06);

  // ---- how long the margin lasts
  const FP = "#fig-fade svg.fade-panel";
  check(`the fade chart opens at ten years: P/E 14.6, half by year 37 @${width}`, (await R("fc-r-pe")) === "14.6" && (await R("fc-r-half")) === "year 37" && (await R("fc-r-share")) === "17%");
  {
    const d = await dotOn(FP, "circle.pt", "path.curve.fade");
    check(`the dot is on the curve at 10 years and 14.6 @${width}`, Math.abs(d.x - 10) < 0.3 && Math.abs(d.y - 14.63) < 0.08 && d.off < 0.6, JSON.stringify(d));
    const sc = await scales(FP), X = lin(sc.xs), Y = lin(sc.ys);
    const hx = await nattr(`${FP} circle.half-pt`, "cx"), hy = await nattr(`${FP} circle.half-pt`, "cy");
    const poly = await pts(`${FP} path.curve.fade`);
    check(`the pink marker is on the curve at about year 37, half-way to 25 @${width}`, Math.abs(X.val(hx) - 37.08) < 0.3 && Math.abs(Y.val(hy) - 18.75) < 0.05 && Math.abs(yAt(poly, hx) - hy) < 0.8);
  }
  await setRange(page, "#fc-n", 30);
  check(`thirty years give 17.9 @${width}`, (await R("fc-r-pe")) === "17.9");
  await setRange(page, "#fc-n", 10);
  await clickSeg("fc-firm", "b");
  check(`the second firm: 15.6 at ten years, half by year 25 @${width}`, (await R("fc-r-pe")) === "15.6" && (await R("fc-r-half")) === "year 25");
  await setRange(page, "#fc-n", 150);
  {
    const d = await dotOn(FP, "circle.pt", "path.curve.fade");
    check(`at 150 years the dot stays inside the chart, just under 25 @${width}`, d.y < 25 && d.y > 24.5 && d.off < 0.6, JSON.stringify(d));
  }
  await setRange(page, "#fc-n", 10);
  await clickSeg("fc-firm", "a");

  // ---- one P/E, a line of stories
  const SP = "#fig-story svg.story-panel";
  check(`the map opens at P/E 20, P/B 3, 3% growth: ROE 15.0%, a 7.0% return, a 5.0% earnings yield @${width}`,
    (await R("sm-r-roe")) === "15.0%" && (await R("sm-r-r")) === "7.0%" && (await R("sm-r-ey")) === "5.0%");
  {
    const d = await dotOn(SP, "circle.pt", "path.story");
    check(`the dot sits on the line at 3% and 7% @${width}`, Math.abs(d.x - 3) < 0.05 && Math.abs(d.y - 7) < 0.05 && d.off < 0.6, JSON.stringify(d));
  }
  await setRange(page, "#sm-g", 0);
  const at0 = await R("sm-r-r");
  await setRange(page, "#sm-g", 0.06);
  check(`no growth needs 5.0%, 6% growth needs 9.0% @${width}`, at0 === "5.0%" && (await R("sm-r-r")) === "9.0%");
  await click('button[data-p="book"]');
  {
    const poly = await pts(`${SP} path.story`);
    const ys = poly.map((p) => p[1]);
    const sc = await scales(SP), Y = lin(sc.ys);
    check(`at book the line is flat at 8% @${width}`, Math.max(...ys) - Math.min(...ys) < 0.6 && Math.abs(Y.val(ys[0]) - 8) < 0.05 && (await R("sm-r-r")) === "8.0%");
  }
  await click('button[data-p="below"]');
  {
    const poly = await pts(`${SP} path.story`);
    check(`below book the line slopes down and the growth beyond 4.8% has a note @${width}`, poly[poly.length - 1][1] > poly[0][1] + 5 && (await has("#sm-cap")) === 1 && (await has(`${SP} circle.pt`)) === 0);
  }
  await setRange(page, "#sm-pe", 40);
  await setRange(page, "#sm-pb", 6);
  await setRange(page, "#sm-g", 0.07);
  {
    const g2 = await geom();
    check(`the far corner of the map draws cleanly @${width}`, g2.length === 0 && (await has("#sm-cap")) === 0);
  }
  await click('button[data-p="base"]');
  await setRange(page, "#sm-g", 0.03);

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
