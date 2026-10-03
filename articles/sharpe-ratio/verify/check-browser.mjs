/*
  Browser checks for sharpe-ratio at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8794 SHOTS=/tmp/sharpe-ratio-shots node verify/check-browser.mjs

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

  // the guess card
  await click('#guess button[data-g="same"]');
  check(`the guess card says right for neither @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await click('#guess button[data-g="b"]');
  check(`and corrects Fund B @${width}`, (await txt("#guess-answer")).startsWith("Neither."));

  const dotOn = async (svg, dotSel, lineSel) => {
    const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${svg} ${dotSel}`, "cx"), cy = await nattr(`${svg} ${dotSel}`, "cy");
    const poly = await pts(`${svg} ${lineSel}`);
    return { x: X.val(cx), y: Y.val(cy), off: Math.abs(yAt(poly, cx) - cy) };
  };

  // ---- memory
  const MP = "#fig-memory svg.memory-panel";
  check(`the memory figure opens at 0.1: 14.4 months, +9.6% @${width}`, (await R("mf-r-v")) === "14.4 months" && (await R("mf-r-f")) === "+9.6%");
  {
    const d = await dotOn(MP, "circle.pt", "path.curve.mem");
    const s = await pts(`${MP} path.straight`);
    const sc = await scales(MP), Y = lin(sc.ys);
    check(`the dot is on the curve at 12 months and 14.4, above the dashed line's 12 @${width}`, Math.abs(d.x - 12) < 0.05 && Math.abs(d.y - 14.42) < 0.1 && d.off < 0.6 && Math.abs(Y.val(s[s.length - 1][1]) - 12) < 0.05);
  }
  await setRange(page, "#mf-rho", -0.1);
  {
    const d = await dotOn(MP, "circle.pt", "path.curve.mem");
    check(`at −0.1 the curve dips under the line and the rule is off by −8.8% @${width}`, (await R("mf-r-f")) === "−8.8%" && d.y < 12);
  }
  for (const v of [0.5, -0.5]) { await setRange(page, "#mf-rho", v); check(`the memory curve stays in its chart at ${v} @${width}`, (await geom()).length === 0); }
  await setRange(page, "#mf-rho", 0.1);

  // ---- the smoothing lab
  const SP = "#fig-smooth svg.path-panel";
  check(`the lab opens at 0.6: 15.0% and 7.5%, reported 0.80, Lo 0.44, true 0.40 @${width}`,
    (await R("sl-r-vt")) === "15.0%" && (await R("sl-r-vr")) === "7.5%" && (await R("sl-r-naive")) === "0.80" && (await R("sl-r-lo")) === "0.44" && (await R("sl-r-true")) === "0.40" && (await R("sl-r-ac")) === "0.60");
  const wiggle = (poly) => poly.reduce((s, p, i) => (i ? s + Math.abs(p[1] - poly[i - 1][1]) : 0), 0);
  {
    const t = await pts(`${SP} path.series.true`), r = await pts(`${SP} path.series.rep`);
    check(`the reported line is calmer than the true one @${width}`, t.length === 181 && r.length === 181 && wiggle(r) < 0.75 * wiggle(t), `${wiggle(r).toFixed(0)} vs ${wiggle(t).toFixed(0)}`);
    // the log axis, read back: $1 at the first point of both lines
    const ys = await page.evaluate((SP) => [...document.querySelectorAll(`${SP} .axis-y text.tick-label`)].map((e) => ({ v: parseFloat(e.textContent.replace("$", "")), p: +e.getAttribute("y") - 4 })), SP);
    const a0 = ys[0], a1 = ys[ys.length - 1], k = (a1.p - a0.p) / (Math.log10(a1.v) - Math.log10(a0.v));
    const val = (p) => Math.pow(10, Math.log10(a0.v) + (p - a0.p) / k);
    check(`both lines start at $1 on the log axis @${width}`, Math.abs(val(t[0][1]) - 1) < 0.01 && Math.abs(val(r[0][1]) - 1) < 0.01);
  }
  check(`the unsmoothed series is hidden at first @${width}`, (await has(`${SP} path.series.un`)) === 0);
  await clickSeg("sl-show", "on");
  {
    const t = await pts(`${SP} path.series.true`), u = await pts(`${SP} path.series.un`);
    const worst = Math.max(...u.map((p, i) => Math.abs(p[1] - t[i][1])));
    check(`shown, the unsmoothed series lands on the true line @${width}`, u.length === t.length && worst < 0.02, `${worst.toFixed(3)}px`);
  }
  await setRange(page, "#sl-a", 0.8);
  {
    const t = await pts(`${SP} path.series.true`), u = await pts(`${SP} path.series.un`);
    const worst = Math.max(...u.map((p, i) => Math.abs(p[1] - t[i][1])));
    check(`at 0.8: reported 1.20 at 5.0% volatility, and the unsmoothed line still lands on the true one @${width}`, (await R("sl-r-naive")) === "1.20" && (await R("sl-r-vr")) === "5.0%" && worst < 0.02);
  }
  await setRange(page, "#sl-a", 0);
  {
    const t = await pts(`${SP} path.series.true`), r = await pts(`${SP} path.series.rep`);
    const worst = Math.max(...r.map((p, i) => Math.abs(p[1] - t[i][1])));
    check(`with no smoothing the reported line is the true one, and both ratios read 0.40 @${width}`, worst < 0.02 && (await R("sl-r-naive")) === "0.40" && (await R("sl-r-lo")) === "0.40");
  }
  await setRange(page, "#sl-a", 0.85);
  check(`at the slider's end everything still draws inside the chart @${width}`, (await geom()).length === 0);
  await setRange(page, "#sl-a", 0.6);
  await clickSeg("sl-show", "off");

  // ---- the horizon chart
  const HP = "#fig-horizon svg.horizon-panel";
  check(`the horizon chart opens at 0.6: +100% for the rule, +9% at a year, +2% at five, 1.87 months hidden @${width}`,
    (await R("hc-r-naive")) === "+100%" && (await R("hc-r-12")) === "+9%" && (await R("hc-r-60")) === "+2%" && (await R("hc-r-h")) === "1.87");
  {
    const a = await dotOn(HP, "circle.pt12", "path.lo"), b = await dotOn(HP, "circle.pt60", "path.lo");
    const sc = await scales(HP), Y = lin(sc.ys);
    check(`the dots sit on Lo's curve at 1.09 and 1.02, and the rule's line is at 2 @${width}`, a.off < 0.6 && b.off < 0.6 && Math.abs(a.y - 1.088) < 0.01 && Math.abs(b.y - 1.016) < 0.01 && Math.abs(Y.val(await nattr(`${HP} line.naive`, "y1")) - 2) < 0.01, JSON.stringify([a, b]));
    const lo = await pts(`${HP} path.lo`);
    check(`Lo's curve starts on the rule's line and only falls @${width}`, Math.abs(Y.val(lo[0][1]) - 2) < 0.01 && lo.every((p, i) => i === 0 || p[1] >= lo[i - 1][1] - 0.01));
  }
  await setRange(page, "#hc-a", 0.8);
  check(`at 0.8: +200%, +24% and +4% @${width}`, (await R("hc-r-naive")) === "+200%" && (await R("hc-r-12")) === "+24%" && (await R("hc-r-60")) === "+4%");
  await setRange(page, "#hc-a", 0.85);
  check(`at the slider's end the rule's line is still inside the chart @${width}`, (await geom()).length === 0 && (await nattr(`${HP} line.naive`, "y1")) > 0);
  await setRange(page, "#hc-a", 0.6);

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
