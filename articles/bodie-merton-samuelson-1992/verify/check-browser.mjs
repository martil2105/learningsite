/*
  Browser checks for bodie-merton-samuelson-1992 at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/bodie-merton-samuelson-1992-shots node verify/check-browser.mjs

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
  const cx = (sel) => page.evaluate((sel) => { const c = document.querySelector(sel); return [+c.getAttribute("cx"), +c.getAttribute("cy")]; }, sel);
  // the y of a drawn polyline at a pixel x, by interpolation
  const yAt = (poly, px) => { for (let i = 1; i < poly.length; i++) { const [x0, y0] = poly[i - 1], [x1, y1] = poly[i]; if (px >= x0 - 1e-6 && px <= x1 + 1e-6) return y0 + ((px - x0) / (x1 - x0 || 1)) * (y1 - y0); } return NaN; };
  const slopeOf = (poly, X, Y) => { const a = poly[0], b = poly[poly.length - 1]; return (Y.val(b[1]) - Y.val(a[1])) / (X.val(b[0]) - X.val(a[0])); };

  // the guess card
  await page.click('#guess button[data-g="fixed"]'); await settle(page);
  check(`the guess card answers @${width}`, (await txt("#guess-answer")).includes("For the workers in the paper"));
  await page.click('#guess button[data-g="flex"]'); await settle(page);
  check(`and says right for the flexible worker @${width}`, (await txt("#guess-answer")).startsWith("Right"));

  // ---- figure 1: two workers, one bad year (defaults: a 0.5, gamma 2, market -20%)
  check(`at a bad year: stocks 18.1 and 12.0 years of pay, gap 1.50 @${width}`, (await txt("#fl-r-flex .value")) === "18.1" && (await txt("#fl-r-fixed .value")) === "12.0" && (await txt("#fl-r-ratio .value")) === "1.50");
  check(`consumption falls 15.4% and 20.6% @${width}`, (await txt("#fl-r-cf .value")) === "−15.4%" && (await txt("#fl-r-cx .value")) === "−20.6%");
  check(`hours: 56% for the flexible worker, 48% for the fixed one @${width}`, (await txt("#fl-r-hf .value")) === "56%" && (await txt("#fl-r-hx .value")) === "48%");
  {
    const sc = await scales("#fig-flex svg.cons-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const fl = await pts("#fig-flex path.cons.flex"), fx = await pts("#fig-flex path.cons.fixed");
    const sF = slopeOf(fl, X, Y), sX = slopeOf(fx, X, Y);
    check(`the flexible worker's consumption line has slope 0.772, the Merton share, in drawn pixels @${width}`, Math.abs(sF - 0.7716) < 0.01, sF.toFixed(4));
    check(`the fixed worker's is steeper, 1.029, though she holds fewer stocks @${width}`, Math.abs(sX - 1.0288) < 0.012 && sX > sF, sX.toFixed(4));
    const zero = Y.px(0);
    check(`both lines pass through zero at a market year of zero @${width}`, Math.abs(yAt(fl, X.px(0)) - zero) < 0.6 && Math.abs(yAt(fx, X.px(0)) - zero) < 0.6);
    const df = await cx("#fig-flex circle.dot.cons-flex"), dx = await cx("#fig-flex circle.dot.cons-fixed");
    check(`each dot sits on its own line at the marked year @${width}`, Math.abs(df[1] - yAt(fl, df[0])) < 0.6 && Math.abs(dx[1] - yAt(fx, dx[0])) < 0.6, `${(df[1] - yAt(fl, df[0])).toFixed(2)} / ${(dx[1] - yAt(fx, dx[0])).toFixed(2)}`);
    check(`the dots are at the market year, minus 20% @${width}`, Math.abs(X.val(df[0]) + 20) < 0.3, X.val(df[0]).toFixed(2));
  }
  {
    const sc = await scales("#fig-flex svg.hours-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const fl = await pts("#fig-flex path.hours.flex"), fx = await pts("#fig-flex path.hours.fixed");
    const sF = slopeOf(fl, X, Y) * 100 / 1; // per unit of return: x ticks are in percent, y in percent
    check(`the flexible worker's hours fall as the market rises, slope -0.403 @${width}`, Math.abs(slopeOf(fl, X, Y) + 0.4031) < 0.01, slopeOf(fl, X, Y).toFixed(4));
    check(`the fixed worker's hours are a flat line at 48% @${width}`, Math.abs(slopeOf(fx, X, Y)) < 1e-6 && Math.abs(Y.val(fx[0][1]) - 47.77) < 0.2, Y.val(fx[0][1]).toFixed(2));
    check(`the two lines cross at a market year of zero @${width}`, Math.abs(yAt(fl, X.px(0)) - yAt(fx, X.px(0))) < 0.6);
    const hf = await cx("#fig-flex circle.dot.hours-flex");
    check(`in a bad year the flexible dot is above the fixed one @${width}`, hf[1] < (await cx("#fig-flex circle.dot.hours-fixed"))[1] - 5);
  }
  await setRange(page, "#fl-ret", 0.2);
  check(`in a good year she works less: 40% and consumption up 15.4% @${width}`, (await txt("#fl-r-hf .value")) === "40%" && (await txt("#fl-r-cf .value")) === "+15.4%");
  {
    const a = await cx("#fig-flex circle.dot.hours-flex"), b = await cx("#fig-flex circle.dot.hours-fixed");
    check(`and the flexible dot is now below the fixed one @${width}`, a[1] > b[1] + 5);
  }
  await setRange(page, "#fl-ret", -0.2);
  await setRange(page, "#fl-g", 10);
  check(`at risk aversion 10 the gap is 1.10 @${width}`, (await txt("#fl-r-ratio .value")) === "1.10");
  {
    const sc = await scales("#fig-flex svg.cons-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const r = slopeOf(await pts("#fig-flex path.cons.fixed"), X, Y) / slopeOf(await pts("#fig-flex path.cons.flex"), X, Y);
    check(`and the fixed worker's consumption still swings 1.82 times as much, in pixels @${width}`, Math.abs(r - 1.818) < 0.02, r.toFixed(3));
  }
  await setRange(page, "#fl-g", 2);
  await setRange(page, "#fl-a", 0.4);
  check(`at a weight of 0.4 on consumption the gap is 1.75 @${width}`, (await txt("#fl-r-ratio .value")) === "1.75");
  await setRange(page, "#fl-a", 0.5);
  // the controls are shared with the second figure
  check(`the second figure's controls follow the first's @${width}`, (await page.locator("#ac-a").inputValue()) === "0.5" && (await page.locator("#ac-g").inputValue()) === "2");

  // ---- figure 2: the same gap at every level of savings
  check(`at one year's pay saved: gap 1.50 and 48% hours @${width}`, (await txt("#ac-r-ratio .value")) === "1.50" && (await txt("#ac-r-hours .value")) === "48%");
  for (const w of [10, 20]) {
    await setRange(page, "#ac-w", w);
    check(`at ${w} years of pay saved the gap is still 1.50 @${width}`, (await txt("#ac-r-ratio .value")) === "1.50", await txt("#ac-r-ratio .value"));
  }
  await setRange(page, "#ac-w", 22);
  check(`at 22 years of pay hours are 1% and it is still 1.50 @${width}`, (await txt("#ac-r-hours .value")) === "1%" && (await txt("#ac-r-ratio .value")) === "1.50");
  await setRange(page, "#ac-w", 23);
  check(`at 23 she has retired and the readouts say so @${width}`, (await txt("#ac-r-ratio .value")) === "retired" && (await txt("#ac-r-hours .value")) === "0%");
  {
    const gone = await page.evaluate(() => document.querySelectorAll("#fig-across circle.dot").length);
    check(`and the dots are gone @${width}`, gone === 0, `${gone}`);
  }
  await setRange(page, "#ac-w", 1);
  {
    // the drawn stock lines: their heights above zero are in the ratio 1.5 at every savings
    const sc = await scales("#fig-across svg.stock-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const fl = await pts("#fig-across path.stock.flex"), fx = await pts("#fig-across path.stock.fixed");
    const ratios = [2, 8, 15, 21].map((w) => (Y.px(0) - yAt(fl, X.px(w))) / (Y.px(0) - yAt(fx, X.px(w))));
    check(`the drawn lines are in the ratio 1.5 at every savings, 2 to 21 @${width}`, ratios.every((r) => Math.abs(r - 1.5) < 0.01), ratios.map((r) => r.toFixed(3)).join(" "));
    const topTick = Math.max(...sc.ys.map((t) => t.v));
    check(`the window holds the blue line in steps of ten: top tick 40 at the defaults @${width}`, topTick === 40, `${topTick}`);
    const corner = await page.evaluate(() => document.querySelector("#fig-across svg.stock-panel line.corner"));
    check(`the retirement corner is drawn at 22.4 years of pay @${width}`, !!corner);
    const cxp = await page.evaluate(() => +document.querySelector("#fig-across svg.stock-panel line.corner").getAttribute("x1"));
    check(`at the right place on the axis @${width}`, Math.abs(X.val(cxp) - 22.4) < 0.1, X.val(cxp).toFixed(2));
    const last = fl[fl.length - 1][0];
    check(`the lines stop at the corner @${width}`, Math.abs(last - cxp) < 3, `${last.toFixed(1)} vs ${cxp.toFixed(1)}`);
  }
  await clickSeg("ac-n", 10);
  {
    const sc = await scales("#fig-across svg.hours-panel"), X = lin(sc.xs);
    const cxp = await page.evaluate(() => +document.querySelector("#fig-across svg.hours-panel line.corner").getAttribute("x1"));
    check(`with ten years left the corner moves to about 9 years of pay @${width}`, Math.abs(X.val(cxp) - 8.98) < 0.1, X.val(cxp).toFixed(2));
    check(`and the gap is still 1.50 @${width}`, (await txt("#ac-r-ratio .value")) === "1.50");
    const hp = await pts("#fig-across path.hours.both");
    check(`hours start at 50% and fall to zero at the corner, read from the path @${width}`, (() => { const Y = lin(sc.ys); return Math.abs(Y.val(hp[0][1]) - 50) < 0.3 && Y.val(hp[hp.length - 1][1]) < 2; })());
  }
  await clickSeg("ac-n", 30);
  await setRange(page, "#ac-a", 0.8);
  check(`at 0.8 on consumption the gap is 1.13 @${width}`, (await txt("#ac-r-ratio .value")) === "1.13");
  await setRange(page, "#ac-a", 0.5);

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
