/*
  Browser checks for fundamental-law at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8794 SHOTS=/tmp/fundamental-law-shots node verify/check-browser.mjs

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

  // ---- the guess card
  await click('#guess button[data-g="A"]');
  check(`the guess card gives the textbook answer, B, 2.2 against 1.5 @${width}`, (await txt("#guess-answer")).startsWith("The textbook answer is B.") && /2\.2 a year against A's 1\.5/.test((await txt("#guess-answer")).replace(/\s+/g, " ")));
  await click('#guess button[data-g="B"]');
  check(`and agrees with B @${width}`, (await txt("#guess-answer")).startsWith("That's the textbook answer, B."));

  // ---- one month of forecasts
  const IP = "#fig-ic svg.ic-panel";
  check(`the scatter opens at 0.02: 500 dots, 50.6% on average, 53.0% this month, slope 0.05 @${width}`,
    (await has(`${IP} circle.dot`)) === 500 && (await R("ic-r-hit")) === "50.6%" && (await R("ic-r-sample")) === "53.0%" && (await R("ic-r-slope")) === "0.05");
  await setRange(page, "#ic-ic", 0.3);
  {
    const sc = await scales(IP), X = lin(sc.xs), Y = lin(sc.ys);
    const [x1, y1, x2, y2] = await page.evaluate((IP) => { const l = document.querySelector(`${IP} line.fit`); return ["x1", "y1", "x2", "y2"].map((a) => +l.getAttribute(a)); }, IP);
    const slope = (Y.val(y2) - Y.val(y1)) / (X.val(x2) - X.val(x1));
    check(`at 0.3: 59.7%, 61.6%, and the drawn line's slope reads 0.33 @${width}`, (await R("ic-r-hit")) === "59.7%" && (await R("ic-r-sample")) === "61.6%" && Math.abs(slope - 0.33) < 0.01, slope.toFixed(3));
  }
  await setRange(page, "#ic-ic", 0.02);

  // ---- the hook: breadth with a swing (log x axis)
  const BP = "#fig-breadth svg.breadth-panel";
  // the x axis is logarithmic and labelled 10, 100, 1k, 10k, so read it here rather than with scales()
  const xTicks = () => page.evaluate((BP) => [...document.querySelectorAll(`${BP} .axis-x g[transform]`)].map((g) => { const t = g.querySelector("text").textContent; return { v: parseFloat(t) * (/k$/.test(t) ? 1000 : 1), p: +g.getAttribute("transform").match(/translate\(([-\d.]+)/)[1] }; }), BP);
  const logX = async () => { const xs = await xTicks(); const a = xs[0], b = xs[xs.length - 1]; const k = (b.p - a.p) / Math.log10(b.v / a.v); const f = (p) => a.v * Math.pow(10, (p - a.p) / k); f.px = (v) => a.p + k * Math.log10(v / a.v); return f; };
  check(`the lab opens on IC 0.02, swing 0.05, 500 stocks: 1.55, 1.03, 222 bets, ceiling 1.39 (400) @${width}`,
    (await R("bl-r-g")) === "1.55" && (await R("bl-r-s")) === "1.03" && (await R("bl-r-bets")) === "222" && (await R("bl-r-cap")) === "1.39 (400 bets)");
  {
    const sc = await scales(BP), Y = lin(sc.ys), xv = await logX();
    const sx = xv(await nattr(`${BP} circle.sdot`, "cx")), sy = Y.val(await nattr(`${BP} circle.sdot`, "cy")), gy = Y.val(await nattr(`${BP} circle.gdot`, "cy"));
    const cap = Y.val(await nattr(`${BP} line.cap`, "y1"));
    check(`the dots sit at 500 stocks, 1.03 and 1.55, under a ceiling drawn at 1.39 @${width}`, Math.abs(sx / 500 - 1) < 0.02 && Math.abs(sy - 1.03) < 0.02 && Math.abs(gy - 1.55) < 0.02 && Math.abs(cap - 1.386) < 0.02, `${sx.toFixed(1)} ${sy.toFixed(3)} ${gy.toFixed(3)} ${cap.toFixed(3)}`);
    // the swing curve read back at 2,000 stocks, through the path itself
    const poly = await pts(`${BP} path.swing`);
    const at2000 = Y.val(yAt(poly, xv.px(2000)));
    check(`the blue curve reads 1.26 at 2,000 stocks @${width}`, Math.abs(at2000 - 1.264) < 0.02, at2000.toFixed(3));
  }
  await setRange(page, "#bl-n", 7);
  check(`2,000 stocks: Grinold 3.10, with the swing 1.26, 333 bets @${width}`, (await R("bl-r-g")) === "3.10" && (await R("bl-r-s")) === "1.26" && (await R("bl-r-bets")) === "333");
  await setRange(page, "#bl-swing", 0);
  check(`with no swing the two ratios agree and there's no ceiling @${width}`, (await R("bl-r-s")) === (await R("bl-r-g")) && (await R("bl-r-cap")) === "none" && (await has(`${BP} line.cap`)) === 0);
  await setRange(page, "#bl-ic", 0.1);
  {
    const sc = await scales(BP), Y = lin(sc.ys);
    const top = Math.min(...(await pts(`${BP} path.grinold`)).map((p) => p[1]));
    check(`a steep Grinold curve is cut at the top of the chart @${width}`, Y.val(top) <= 4.001 && (await has(`${BP} circle.gdot`)) === 0, Y.val(top).toFixed(3));
  }
  await setRange(page, "#bl-ic", 0.02);
  await setRange(page, "#bl-swing", 0.05);
  await setRange(page, "#bl-n", 5);

  // ---- the two managers
  const MP = "#fig-managers svg.mgr-panel";
  const barTop = async (id) => { const sc = await scales(MP), Y = lin(sc.ys); return Y.val(await nattr(`${MP} rect.bar-${id}`, "y")); };
  check(`no swing: A 1.47, B 2.19, B ahead @${width}`, (await R("mb-r-a")) === "1.47" && (await R("mb-r-b")) === "2.19" && (await R("mb-r-lead")) === "B");
  await setRange(page, "#mb-swing", 0.03);
  check(`at 0.03 B still leads @${width}`, (await R("mb-r-lead")) === "B");
  await setRange(page, "#mb-swing", 0.04);
  check(`at 0.04 A leads @${width}`, (await R("mb-r-lead")) === "A");
  await setRange(page, "#mb-swing", 0.05);
  {
    const a = await barTop("A"), b = await barTop("B");
    const gb = (await scales(MP)).ys; const Y = lin(gb); const tickB = Y.val(await nattr(`${MP} line.g-B`, "y1"));
    check(`at 0.05: 1.38 against 1.17, bars read back, B's Grinold tick still at 2.19 @${width}`, (await R("mb-r-a")) === "1.38" && (await R("mb-r-b")) === "1.17" && Math.abs(a - 1.382) < 0.02 && Math.abs(b - 1.171) < 0.02 && Math.abs(tickB - 2.19) < 0.02, `${a.toFixed(3)} ${b.toFixed(3)} ${tickB.toFixed(3)}`);
  }

  // ---- where the risk hides
  const RP = "#fig-risk svg.risk-panel";
  check(`ten years of B with no swing: 120 bars, model 4.0%, run 4.1%, long run 4.0%, 3 months outside @${width}`,
    (await has(`${RP} rect.bar`)) === 120 && (await R("rl-r-model")) === "4.0%" && (await R("rl-r-run")) === "4.1%" && (await R("rl-r-long")) === "4.0%" && (await R("rl-r-out")) === "3");
  {
    const sc = await scales(RP), Y = lin(sc.ys);
    const mu = Y.val(await nattr(`${RP} line.expected`, "y1")), hi = Y.val(await nattr(`${RP} line.band-hi`, "y1")), lo = Y.val(await nattr(`${RP} line.band-lo`, "y1"));
    check(`the green line at 0.73% and the dashed lines 2.31 either side @${width}`, Math.abs(mu - 0.73) < 0.03 && Math.abs(hi - mu - 2.309) < 0.03 && Math.abs(mu - lo - 2.309) < 0.03, `${mu.toFixed(3)} ${hi.toFixed(3)} ${lo.toFixed(3)}`);
  }
  await setRange(page, "#rl-swing", 0.05);
  check(`a swing of 0.05: run 7.1%, long run 7.5%, 32 months outside @${width}`, (await R("rl-r-run")) === "7.1%" && (await R("rl-r-long")) === "7.5%" && (await R("rl-r-out")) === "32");
  await clickSeg("rl-mgr", "A");
  check(`A with the same swing: long run 4.2%, run 4.3% @${width}`, (await R("rl-r-long")) === "4.2%" && (await R("rl-r-run")) === "4.3%");
  await setRange(page, "#rl-swing", 0);
  await clickSeg("rl-mgr", "B");
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
