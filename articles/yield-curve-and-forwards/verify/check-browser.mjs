/*
  Browser checks for yield-curve-and-forwards at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8799 SHOTS=/tmp/yield-curve-and-forwards-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn dots, steps and lines back through their axes.
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

  // ------------------------------------------ yield-curve-and-forwards checks
  const all = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => ({ cx: +e.getAttribute("cx"), cy: +e.getAttribute("cy"), x: +e.getAttribute("x"), y: +e.getAttribute("y"), h: +e.getAttribute("height") })), sel);

  // ---- the bootstrap
  const BP = ".boot-panel";
  check(`the first step prices the 1-year bond @${width}`, (await txt("#bl-step")).replace(/\s+/g, " ") === "The 1-year bond pays $102.00 in a year and costs $99.46, so the 1-year spot rate is 2.55%." && (await R("bl-s3")) === "not yet", await txt("#bl-step"));
  for (let i = 0; i < 4; i++) await click("#bl-next");
  check(`after four presses all five are in, and the button stops @${width}`, (await has(`${BP} circle.spot`)) === 5 && (await page.locator("#bl-next").isDisabled()) && (await txt("#bl-step")).replace(/\s+/g, " ").endsWith("so the 5-year spot rate is 3.78%."));
  {
    const Y = lin((await scales(BP)).ys);
    const dots = await all(`${BP} circle.spot`);
    const want = [2.553, 2.984, 3.319, 3.580, 3.784];
    check(`the blue dots read the five spot rates @${width}`, dots.every((d, i) => Math.abs(Y.val(d.cy) - want[i]) < 0.01), dots.map((d) => Y.val(d.cy).toFixed(3)).join(" "));
    check(`the 5-year ring reads 3.74% @${width}`, Math.abs(Y.val((await all(`${BP} circle.ytm.y5`))[0].cy) - 3.744) < 0.01);
    const f = await pts(`${BP} path.fwd`);
    check(`the fifth pink step reads 4.60% @${width}`, Math.abs(Y.val(f[f.length - 1][1]) - 4.601) < 0.01);
  }
  check(`the readouts: 3.32%, 3.99%, 4.37% @${width}`, (await R("bl-s3")) === "3.32%" && (await R("bl-f3")) === "3.99%" && (await R("bl-f4")) === "4.37%");
  {
    const Y = lin((await scales(BP)).ys);
    const before = await all(`${BP} circle.spot`);
    await setRange(page, "#bl-err", 0.25);
    const after = await all(`${BP} circle.spot`);
    check(`25 cents too high: 3.23%, 3.72%, 4.66% @${width}`, (await R("bl-s3")) === "3.23%" && (await R("bl-f3")) === "3.72%" && (await R("bl-f4")) === "4.66%", [await R("bl-s3"), await R("bl-f3"), await R("bl-f4")].join(" "));
    check(`the first two dots don't move and the third does @${width}`, Math.abs(before[0].cy - after[0].cy) < 0.01 && Math.abs(before[1].cy - after[1].cy) < 0.01 && Math.abs(Y.val(after[2].cy) - 3.227) < 0.01);
    await setRange(page, "#bl-err", 0);
  }
  await click("#bl-reset");
  check(`"Start again" goes back to one bond @${width}`, (await has(`${BP} circle.spot`)) === 1 && (await R("bl-s3")) === "not yet");

  // ---- the coupon effect
  const CP = ".coupon-panel", WP = ".weights-panel";
  check(`a 10% coupon: 4.152%, 4.295%, 4.151% @${width}`, (await R("cf-y")) === "4.152%" && (await R("cf-s")) === "4.295%" && (await R("cf-r")) === "4.151%");
  {
    const Y = lin((await scales(CP)).ys), YW = lin((await scales(WP)).ys);
    check(`the pink dot reads 4.15% and the blue 4.29% @${width}`, Math.abs(Y.val(await nattr(`${CP} circle.yield10`, "cy")) - 4.152) < 0.01 && Math.abs(Y.val(await nattr(`${CP} circle.spot10`, "cy")) - 4.295) < 0.01);
    const bars = await all(`${WP} rect.wbar`);
    const tot = bars.reduce((s, b) => s + (YW.val(b.y + b.h) - YW.val(b.y)) * -1, 0);
    check(`the weights add up to 100%, two thirds of it in year ten @${width}`, Math.abs(tot - 100) < 0.5 && Math.abs(-(YW.val(bars[9].y + bars[9].h) - YW.val(bars[9].y)) - 67.2) < 0.5, tot.toFixed(2));
  }
  await setRange(page, "#cf-c", 0);
  check(`no coupon: the yield is the spot rate, 4.295% @${width}`, (await R("cf-y")) === "4.295%" && Math.abs((await nattr(`${CP} circle.yield10`, "cy")) - (await nattr(`${CP} circle.spot10`, "cy"))) < 0.01);
  await setRange(page, "#cf-c", 0.1);

  // ---- the break-even
  const EP = ".be-panel";
  check(`$106.06 against $104.60 at 2%, break-even 3.42% @${width}`, (await R("be-fixed")) === "$106.06" && (await R("be-roll")) === "$104.60" && (await R("be-f")) === "3.42%");
  {
    const sc = await scales(EP), X = lin(sc.xs), Y = lin(sc.ys);
    check(`the circle sits at 3.42% and $106.06 @${width}`, Math.abs(X.val(await nattr(`${EP} circle.cross`, "cx")) - 3.416) < 0.01 && Math.abs(Y.val(await nattr(`${EP} circle.cross`, "cy")) - 106.056) < 0.02);
    const x1 = await nattr(`${EP} line.roll`, "x1"), y1 = await nattr(`${EP} line.roll`, "y1"), x2 = await nattr(`${EP} line.roll`, "x2"), y2 = await nattr(`${EP} line.roll`, "y2");
    const cx = await nattr(`${EP} circle.cross`, "cx"), cy = await nattr(`${EP} circle.cross`, "cy");
    check(`and the rising line passes through it @${width}`, Math.abs(y1 + ((cx - x1) / (x2 - x1)) * (y2 - y1) - cy) < 0.3);
  }
  await setRange(page, "#be-next", 0.05);
  check(`at 5% lending twice wins: $107.68 @${width}`, (await R("be-roll")) === "$107.68", await R("be-roll"));
  await setRange(page, "#be-next", 0.02);

  // ---- the forecast lab
  const FP = ".forecast-panel";
  check(`a point of volatility, no premium: 3.55%, −0.45%, 0.00%, 3.73% @${width}`, (await R("fl-f30")) === "3.55%" && (await R("fl-c30")) === "−0.45%" && (await R("fl-p30")) === "0.00%" && (await R("fl-y30")) === "3.73%", [await R("fl-f30"), await R("fl-c30"), await R("fl-p30"), await R("fl-y30")].join(" "));
  {
    const Y = lin((await scales(FP)).ys);
    const f = await pts(`${FP} path.forward`), e = await pts(`${FP} path.expected`);
    check(`the blue line ends at 3.55% and the dashed one is flat at 4% @${width}`, Math.abs(Y.val(f[f.length - 1][1]) - 3.549) < 0.01 && e.every(([, y]) => Math.abs(Y.val(y) - 4) < 0.005));
    check(`the forward line never rises above the expectation with no premium @${width}`, f.every(([x, y]) => y >= yAt(e, x) - 0.2));
  }
  await setRange(page, "#fl-sigma", 0);
  {
    const f = await pts(`${FP} path.forward`), e = await pts(`${FP} path.expected`);
    check(`no volatility: the forward line lies on the expectation @${width}`, f.every(([x, y]) => Math.abs(y - yAt(e, x)) < 0.2));
  }
  await setRange(page, "#fl-sigma", 0.015);
  check(`1.5 points: convexity −1.02% @${width}`, (await R("fl-c30")) === "−1.02%");
  await setRange(page, "#fl-sigma", 0.01);
  await setRange(page, "#fl-prem", 0.005);
  {
    check(`half a point of premium: 4.02% @${width}`, (await R("fl-f30")) === "4.02%" && (await R("fl-p30")) === "+0.48%", await R("fl-p30"));
    const f = await pts(`${FP} path.forward`);
    const top = f.reduce((a, p) => (p[1] < a[1] ? p : a), f[0]);
    check(`and the forward line has a hump in the middle @${width}`, top[0] > f[0][0] + 20 && top[0] < f[f.length - 1][0] - 20);
  }
  await setRange(page, "#fl-prem", 0);

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
