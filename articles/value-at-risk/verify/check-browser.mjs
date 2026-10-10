/*
  Browser checks for value-at-risk at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8794 SHOTS=/tmp/value-at-risk-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8794";
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

  const shoelace = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length]; a += x0 * y1 - x1 * y0; } return Math.abs(a) / 2; };
  const moneyVal = (t) => parseFloat(t.replace("−", "-").replace(/[$+,]/g, ""));

  // ---- the guess card
  await click('#guess button[data-g="zero"]');
  check(`a wrong guess is told $30, and why (7.84%) @${width}`, (await txt("#guess-answer")).startsWith("It's $30.") && /is 7\.84%, which is more than 5%/.test((await txt("#guess-answer")).replace(/\s+/g, " ")));
  await click('#guess button[data-g="30"]');
  check(`the right one is confirmed @${width}`, (await txt("#guess-answer")).startsWith("That's right, $30."));

  // ---- the lab
  const QP = ".quantile-panel", BP = ".bynumber-panel";
  const areaCheck = async (label) => {
    const poly = await pts(`${QP} path.area`);
    const rw = await nattr(`${QP} rect.es-rect`, "width"), rh = await nattr(`${QP} rect.es-rect`, "height");
    const a = shoelace(poly), b = rw * rh;
    check(`${label}: the dashed rectangle has the shaded area @${width}`, Math.abs(a / b - 1) < 0.01 || (b < 1 && a < 1), `${a.toFixed(1)} vs ${b.toFixed(1)}`);
  };
  check(`one bond at 95%: VaR $0.00, ES $48.00, any default 4.0%, average $2.40 @${width}`, (await R("bl-r-var")) === "$0.00" && (await R("bl-r-es")) === "$48.00" && (await R("bl-r-any")) === "4.0%" && (await R("bl-r-el")) === "$2.40");
  {
    const sc = await scales(QP), X = lin(sc.xs), Y = lin(sc.ys);
    check(`the pink dot is at 95% and zero @${width}`, Math.abs(X.val(await nattr(`${QP} circle.var-dot`, "cx")) - 95) < 0.05 && Math.abs(Y.val(await nattr(`${QP} circle.var-dot`, "cy"))) < 0.2);
    check(`the rectangle's top is at $48 @${width}`, Math.abs(Y.val(await nattr(`${QP} rect.es-rect`, "y")) - 48) < 0.3);
    const q = await pts(`${QP} path.quantile`);
    const jump = q.find((p, i) => i > 0 && Math.abs(p[1] - q[i - 1][1]) > 5);
    check(`the curve jumps at 96% to $60 @${width}`, jump && Math.abs(X.val(jump[0]) - 96) < 0.05 && Math.abs(Y.val(jump[1]) - 60) < 0.3);
  }
  await areaCheck("one bond");
  await setRange(page, "#bl-n", 2);
  check(`two bonds: VaR $30.00, ES $30.96, any default 7.8% @${width}`, (await R("bl-r-var")) === "$30.00" && (await R("bl-r-es")) === "$30.96" && (await R("bl-r-any")) === "7.8%");
  await areaCheck("two bonds");
  await setRange(page, "#bl-n", 100);
  check(`100 bonds: $4.20 and $5.12 @${width}`, (await R("bl-r-var")) === "$4.20" && (await R("bl-r-es")) === "$5.12");
  await areaCheck("100 bonds");
  {
    const Y = lin((await scales(BP)).ys);
    check(`the dots on the lower panel sit at $4.20 and $5.12 @${width}`, Math.abs(Y.val(await nattr(`${BP} circle.var-dot2`, "cy")) - 4.2) < 0.3 && Math.abs(Y.val(await nattr(`${BP} circle.es-dot`, "cy")) - 5.12) < 0.3);
    check(`the grey line is the $2.40 average @${width}`, Math.abs(Y.val(await nattr(`${BP} line.expected`, "y1")) - 2.4) < 0.2);
    const es = await pts(`${BP} path.es-curve`);
    check(`the blue curve only ever falls @${width}`, es.every((p, i) => i === 0 || p[1] >= es[i - 1][1] - 0.01));
    const vr = await pts(`${BP} path.var-curve`);
    check(`the pink curve starts at zero and rises @${width}`, Math.abs(Y.val(vr[0][1])) < 0.3 && vr.some((p) => Y.val(p[1]) > 25));
  }
  await setRange(page, "#bl-n", 1);
  await clickSeg("bl-a", "0.99");
  check(`one bond at 99%: $60.00 and $60.00 @${width}`, (await R("bl-r-var")) === "$60.00" && (await R("bl-r-es")) === "$60.00");
  await clickSeg("bl-a", "0.95");

  // ---- apart and together
  const PP = ".pair-panel";
  check(`two bonds: VaR together minus apart +$60.00, ES −$34.08 @${width}`, (await R("pf-r-var")) === "+$60.00" && (await R("pf-r-es")) === "−$34.08", `${await R("pf-r-var")} ${await R("pf-r-es")}`);
  {
    const Y = lin((await scales(PP)).ys);
    const top = async (cls) => Y.val(await nattr(`${PP} rect.${cls}`, "y"));
    check(`the bars read $0, $60, $96 and $61.92 @${width}`, Math.abs(await top("var-parts")) < 0.5 && Math.abs((await top("var-whole")) - 60) < 0.5 && Math.abs((await top("es-parts")) - 96) < 0.5 && Math.abs((await top("es-whole")) - 61.92) < 0.5);
  }
  await clickSeg("pf-kind", "normal");
  check(`two normal losses at zero correlation: VaR −$19.27 @${width}`, (await R("pf-r-var")) === "−$19.27", await R("pf-r-var"));
  await setRange(page, "#pf-rho", 1);
  check(`at a correlation of 1 the two VaR bars meet @${width}`, (await R("pf-r-var")) === "$0.00" && (await R("pf-r-es")) === "$0.00");
  await setRange(page, "#pf-rho", 0);
  await clickSeg("pf-kind", "bonds");

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
