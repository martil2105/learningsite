/*
  Browser checks for capm-and-beta at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8795 SHOTS=/tmp/capm-and-beta-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8795";
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

  const barVals = async (svg) => page.evaluate((svg) => {
    const el = document.querySelector(svg);
    const t = [...el.querySelectorAll(".axis-y text.tick-label")].map((e) => ({ v: parseFloat(e.textContent.replace("−", "-").replace("$", "")), p: +e.getAttribute("y") - 4 }));
    const a = t[0], b = t[t.length - 1], k = (b.p - a.p) / (b.v - a.v), val = (p) => a.v + (p - a.p) / k;
    const zero = [...el.querySelectorAll(".axis-y text.tick-label")].find((e) => /^\$?0$/.test(e.textContent.replace("−", "")));
    const y0 = zero ? +zero.getAttribute("y") - 4 : null;
    return [...el.querySelectorAll("rect.bar")].map((r) => { const y = +r.getAttribute("y"), h = +r.getAttribute("height"); const top = val(y), bottom = val(y + h); return { cls: r.getAttribute("class"), v: Math.abs(top) > Math.abs(bottom) ? top : bottom, h }; });
  }, svg);
  const segPts = async (sel) => pts(sel);
  // ---- a beta is a slope
  const SP = "#fig-scatter svg.scatter-panel";
  check(`the scatter opens on the highest group: had 1.60, sorted at 2.66, 758 months @${width}`, (await R("bs-r-had")) === "1.60" && (await R("bs-r-sorted")) === "2.66" && (await R("bs-r-n")) === "758");
  check(`every month is drawn @${width}`, (await page.locator(`${SP} circle.month`).count()) === 758);
  {
    const sc = await scales(SP), X = lin(sc.xs), Y = lin(sc.ys);
    const p = await segPts(`${SP} path.fit`);
    const slope = (Y.val(p[1][1]) - Y.val(p[0][1])) / (X.val(p[1][0]) - X.val(p[0][0]));
    check(`the blue line's drawn slope is 1.60 @${width}`, Math.abs(slope - 1.6) < 0.01, slope.toFixed(3));
    const o = await segPts(`${SP} path.one`);
    const s1 = (Y.val(o[1][1]) - Y.val(o[0][1])) / (X.val(o[1][0]) - X.val(o[0][0]));
    check(`the dashed line's slope is 1 @${width}`, Math.abs(s1 - 1) < 0.01);
  }
  await setRange(page, "#bs-k", 1);
  check(`the lowest group had 0.59 after being sorted at 0.22 @${width}`, (await R("bs-r-had")) === "0.59" && (await R("bs-r-sorted")) === "0.22");
  await setRange(page, "#bs-k", 10);

  // ---- the CAPM world
  const WP = "#fig-world svg.sml-panel";
  const dots = async (svg) => { const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys); return page.evaluate((svg) => [...document.querySelectorAll(`${svg} circle.dec`)].map((c) => [+c.getAttribute("cx"), +c.getAttribute("cy")]), svg).then((a) => a.map(([x, y]) => ({ px: x, py: y, x: X.val(x), y: Y.val(y) }))); };
  const offLine = async (svg, sel) => { const d = await dots(svg); const p = await segPts(`${svg} ${sel}`); return Math.max(...d.map((q) => Math.abs(yAt(p, q.px) - q.py))); };
  check(`the world opens on sorting betas: slope 3.0 against the CAPM's 7.2 @${width}`, (await R("wl-r-slope")) === "3.0 pts" && (await R("wl-r-capm")) === "7.2 pts");
  check(`its dots lie on the blue line @${width}`, (await offLine(WP, "path.fit")) < 0.6);
  await clickSeg("wl-axis", "had");
  {
    const off = await offLine(WP, "path.capm");
    check(`against the betas they then had, every dot sits on the dashed CAPM line @${width}`, off < 0.6 && (await R("wl-r-slope")) === "7.2 pts" && (await R("wl-r-int")) === "0.0%", off.toFixed(2));
  }
  await clickSeg("wl-axis", "sorted");
  await setRange(page, "#wl-noise", 0);
  check(`with no noise the line through sorting betas is the CAPM's @${width}`, (await R("wl-r-slope")) === "7.2 pts" && (await offLine(WP, "path.capm")) < 0.6);
  await setRange(page, "#wl-noise", 0.8);
  check(`at the most noise everything still draws inside the chart @${width}`, (await geom()).length === 0);
  await setRange(page, "#wl-noise", 0.54);

  // ---- US data
  const UP = "#fig-us svg.sml-panel";
  check(`the US chart opens on sorting betas: slope 1.3 @${width}`, (await R("us-r-slope")) === "1.3 pts" && (await R("us-r-capm")) === "7.2 pts" && (await R("us-r-spread")) === "0.22 to 2.66");
  await clickSeg("us-axis", "had");
  {
    const d = await dots(UP);
    check(`on the betas they had: slope 3.4, crossing zero beta at 4.6% @${width}`, (await R("us-r-slope")) === "3.4 pts" && (await R("us-r-int")) === "4.6%" && (await R("us-r-spread")) === "0.59 to 1.60");
    check(`the highest group is drawn at a beta of 1.60 and 8.7% @${width}`, Math.abs(d[9].x - 1.6) < 0.01 && Math.abs(d[9].y - 8.67) < 0.06, JSON.stringify(d[9]));
    // the blue line passes below the CAPM line at the top group and above it at the bottom
    const f = await segPts(`${UP} path.fit`), c = await segPts(`${UP} path.capm`);
    check(`the blue line is flatter than the CAPM's: above it at the lowest group, below it at the highest @${width}`, yAt(f, d[0].px) < yAt(c, d[0].px) && yAt(f, d[9].px) > yAt(c, d[9].px));
  }
  await clickSeg("us-axis", "sorted");

  // ---- alphas
  const AP = "#fig-alpha svg.alpha-panel";
  check(`the alpha readouts: +2.5%, −2.9%, +5.4%, t 2.2 @${width}`, (await R("ab-r-lo")) === "+2.5%" && (await R("ab-r-hi")) === "−2.9%" && (await R("ab-r-lmh")) === "+5.4%" && (await R("ab-r-t")) === "2.2");
  {
    const v = await barVals(AP);
    check(`the bars read back +2.5 for the lowest group and −2.9 for the highest @${width}`, v.length === 10 && Math.abs(v[0].v - 2.51) < 0.05 && Math.abs(v[9].v + 2.92) < 0.05, v.map((b) => b.v.toFixed(2)).join(" "));
  }

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
