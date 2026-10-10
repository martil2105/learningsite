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

  // ------------------------------------------------ forwards-and-futures checks
  const near1 = (a, b, tol) => Math.abs(a - b) <= tol;
  // ---- the oil bars
  {
    const OP = ".oil-panel";
    check(`oil on Monday: −$37.63, $20.43, $58.06 @${width}`, (await R("of-may")) === "−$37.63" && (await R("of-june")) === "$20.43" && (await R("of-gap")) === "$58.06", `${await R("of-may")} ${await R("of-june")} ${await R("of-gap")}`);
    const Y = lin((await scales(OP)).ys);
    const top = await nattr(`${OP} rect.may`, "y"), h = await nattr(`${OP} rect.may`, "height");
    check(`the May bar hangs from zero down to −37.63 @${width}`, near1(Y.val(top), 0, 0.05) && near1(Y.val(top + h), -37.63, 0.1), `${Y.val(top).toFixed(2)} ${Y.val(top + h).toFixed(2)}`);
    const jt = await nattr(`${OP} rect.june`, "y"), jh = await nattr(`${OP} rect.june`, "height");
    check(`the June bar rises to 20.43 @${width}`, near1(Y.val(jt), 20.43, 0.1) && near1(Y.val(jt + jh), 0, 0.05));
    await clickSeg("of-day", "fri");
    check(`the Friday before: $18.27, $25.03, $6.76 @${width}`, (await R("of-may")) === "$18.27" && (await R("of-june")) === "$25.03" && (await R("of-gap")) === "$6.76", `${await R("of-may")} ${await R("of-june")} ${await R("of-gap")}`);
    await clickSeg("of-day", "mon");
  }
  // ---- the carry lab
  {
    check(`carry readouts at $104 @${width}`, (await R("cl-fair")) === "$102.53" && (await R("cl-locked")) === "$1.47" && (await R("cl-side")) === "Buy the index, sell forward", `${await R("cl-fair")} ${await R("cl-locked")} ${await R("cl-side")}`);
    const Y1 = lin((await scales(".fan-panel")).ys);
    check(`the carry line ends at $102.53 and the quoted ring sits at $104 @${width}`, near1(Y1.val(await nattr(".fan-panel circle.fair", "cy")), 102.53, 0.15) && near1(Y1.val(await nattr(".fan-panel circle.quoted", "cy")), 104, 0.15));
    const carry = await pts(".fan-panel path.carry");
    check(`the carry line starts at $100 @${width}`, near1(Y1.val(carry[0][1]), 100, 0.15));
    check(`forty years are drawn @${width}`, (await has(".fan-panel path.path")) === 40);
    const sc = await scales(".pay-panel"), X2 = lin(sc.xs), Y2 = lin(sc.ys);
    const ys = await page.evaluate(() => [...document.querySelectorAll(".pay-panel circle.end")].map((c) => +c.getAttribute("cy")));
    check(`all forty years end on the flat line at $1.47 @${width}`, ys.length === 40 && ys.every((y) => near1(Y2.val(y), 1.468, 0.15)), `${ys.length}`);
    const share = await pts(".pay-panel path.share-line"), fwd = await pts(".pay-panel path.fwd-line");
    check(`the share line crosses zero at $102.53 and the forward line at $104 @${width}`, near1(Y2.val(yAt(share, X2.px(102.53))), 0, 0.3) && near1(Y2.val(yAt(fwd, X2.px(104))), 0, 0.3));
    await setRange(page, "#cl-quoted", 100);
    check(`at $100 the trade turns around, locking in $2.53 @${width}`, (await R("cl-side")) === "Sell the index, buy forward" && (await R("cl-locked")) === "$2.53", `${await R("cl-side")} ${await R("cl-locked")}`);
    await setRange(page, "#cl-r", 0.015);
    check(`with the safe rate equal to the dividend yield the cost of carrying is $100 @${width}`, (await R("cl-fair")) === "$100.00");
    await setRange(page, "#cl-r", 0.04);
    await setRange(page, "#cl-quoted", 104);
  }
  // ---- guess
  await click('#guess button[data-g="same"]');
  check(`guess card: both accept $102.53 @${width}`, (await txt("#guess-answer")).startsWith("That's right.") && (await txt("#guess-answer")).includes("$102.53"), await txt("#guess-answer"));
  // ---- forecast
  {
    check(`forecast at 8%: $106.72, $102.53, $4.18 @${width}`, (await R("ff-exp")) === "$106.72" && (await R("ff-fwd")) === "$102.53" && (await R("ff-gain")) === "$4.18", `${await R("ff-exp")} ${await R("ff-fwd")} ${await R("ff-gain")}`);
    const Y = lin((await scales(".forecast-panel")).ys);
    check(`the pink dot sits at $106.72 @${width}`, near1(Y.val(await nattr(".forecast-panel circle.exp-end", "cy")), 106.72, 0.15));
    await setRange(page, "#ff-mu", 0.04);
    check(`at 4% the two dots meet @${width}`, near1(await nattr(".forecast-panel circle.exp-end", "cy"), await nattr(".forecast-panel circle.fwd", "cy"), 0.05) && (await R("ff-gain")) === "$0.00", await R("ff-gain"));
    await setRange(page, "#ff-mu", 0.15);
    check(`the forward price doesn't move with the forecast @${width}`, (await R("ff-fwd")) === "$102.53");
    await setRange(page, "#ff-mu", 0.08);
  }
  // ---- the ceiling
  {
    check(`index: only $102.53 survives; $100 locks in $2.53 @${width}`, (await R("cf-cap")) === "$102.53" && (await R("cf-verdict")) === "locks in $2.53", `${await R("cf-cap")} ${await R("cf-verdict")}`);
    await setRange(page, "#cf-qi", 110);
    check(`index at $110 locks in $7.47 @${width}`, (await R("cf-verdict")) === "locks in $7.47", await R("cf-verdict"));
    await clickSeg("cf-asset", "oil");
    check(`oil: the ceiling is $68.56, $64 is allowed and holding oil is worth $4.56 @${width}`, (await R("cf-cap")) === "$68.56" && (await R("cf-verdict")) === "isn't possible" && (await R("cf-conv")) === "$4.56", `${await R("cf-cap")} ${await R("cf-verdict")} ${await R("cf-conv")}`);
    const X = lin((await scales(".ceiling-panel")).xs);
    check(`the ceiling line sits at $68.56 and the quoted line at $64 @${width}`, near1(X.val(await nattr(".ceiling-panel line.cap", "x1")), 68.56, 0.05) && near1(X.val(await nattr(".ceiling-panel line.quoted", "x1")), 64, 0.05));
    check(`below the ceiling is allowed, above it is ruled out @${width}`, (await has(".ceiling-panel rect.allowed")) === 1 && near1(X.val(await nattr(".ceiling-panel rect.ruled.above", "x")), 68.56, 0.05));
    await setRange(page, "#cf-qo", 70);
    check(`oil at $70 locks in $1.44 @${width}`, (await R("cf-verdict")) === "locks in $1.44" && (await R("cf-conv")) === "$0.00", `${await R("cf-verdict")} ${await R("cf-conv")}`);
    await clickSeg("cf-asset", "index");
  }
  // ---- margin
  {
    const MP = ".margin-panel";
    check(`the year that rises: $21.39, $21.39, $21.83 @${width}`, (await R("mg-fwd")) === "$21.39" && (await R("mg-tailed")) === "$21.39" && (await R("mg-untailed")) === "$21.83", `${await R("mg-fwd")} ${await R("mg-tailed")} ${await R("mg-untailed")}`);
    const t = await pts(`${MP} path.tailed`);
    check(`the tailed account ends in the forward's circle @${width}`, near1(t[t.length - 1][1], await nattr(`${MP} circle.fwd`, "cy"), 0.3) && t.length === 251);
    const fut = await pts(".price-panel path.futures"), idx = await pts(".price-panel path.index");
    check(`the futures price meets the index on the last day @${width}`, near1(fut[fut.length - 1][1], idx[idx.length - 1][1], 0.02) && fut[0][1] < idx[0][1]);
    {
      const Y3 = lin((await scales(".diff-panel")).ys), d = await pts(".diff-panel path.untailed");
      check(`one contract ends $0.44 above the tailed position @${width}`, near1(Y3.val(d[d.length - 1][1]), 0.44, 0.02) && near1(Y3.val(d[0][1]), 0, 0.01), Y3.val(d[d.length - 1][1]).toFixed(3));
    }
    await clickSeg("mg-run", "back");
    check(`rises, then falls back: −$9.27 and −$8.94 @${width}`, (await R("mg-fwd")) === "−$9.27" && (await R("mg-tailed")) === "−$9.27" && (await R("mg-untailed")) === "−$8.94", `${await R("mg-fwd")} ${await R("mg-untailed")}`);
    await clickSeg("mg-run", "down");
    check(`falls: −$27.24 and −$27.88 @${width}`, (await R("mg-fwd")) === "−$27.24" && (await R("mg-untailed")) === "−$27.88", `${await R("mg-fwd")} ${await R("mg-untailed")}`);
    await clickSeg("mg-run", "up");
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
