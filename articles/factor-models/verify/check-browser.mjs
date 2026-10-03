/*
  Browser checks for factor-models at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8796 SHOTS=/tmp/factor-models-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8796";
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
  // the guess card
  await click('#guess button[data-g="gone"]');
  check(`the guess card says right for disappears @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await click('#guess button[data-g="less"]');
  check(`and corrects shrinks a little @${width}`, (await txt("#guess-answer")).startsWith("It disappears."));

  // ---- prices
  {
    const v = await barVals("#fig-price svg.price-panel");
    check(`the price bars read back size 0.9 and momentum 8.3 @${width}`, v.length === 5 && Math.abs(v[0].v - 0.91) < 0.05 && Math.abs(v[4].v - 8.27) < 0.05, v.map((b) => b.v.toFixed(2)).join(" "));
  }

  // ---- the lab
  const LP = "#fig-alpha svg.fall-panel";
  const bars = async () => { const sc = await scales(LP), Y = lin(sc.ys); return page.evaluate((LP) => [...document.querySelectorAll(`${LP} rect.bar`)].map((r) => ({ cls: r.getAttribute("class"), y: +r.getAttribute("y"), h: +r.getAttribute("height") })), LP).then((a) => a.map((b) => ({ ...b, top: Y.val(b.y), bottom: Y.val(b.y + b.h) }))); };
  check(`the lab opens on value under the CAPM: +4.5% both ways, t 3.6, two bars @${width}`, (await R("al-r-capm")) === "+4.5%" && (await R("al-r-alpha")) === "+4.5%" && (await R("al-r-t")) === "3.6" && (await bars()).length === 2);
  await click('#al-presets button[data-p="ff5"]');
  {
    const b = await bars();
    check(`five factors: value's alpha is −0.3% (t −0.3), with the value button disabled @${width}`, (await R("al-r-alpha")) === "−0.3%" && (await R("al-r-t")) === "−0.3" && (await page.locator('#al-factors button[data-f="hml"]').isDisabled()) && (await R("al-r-b-cma")) === "1.00");
    // the waterfall chains: each step starts where the last ended, and the steps end at the last bar's top
    const steps = b.slice(1, -1), last = b.at(-1);
    let run = Math.max(b[0].top, b[0].bottom), chain = true;
    for (const s of steps) { const ends = [s.top, s.bottom]; const start = ends.find((e) => Math.abs(e - run) < 0.06); if (start === undefined) chain = false; run = ends.find((e) => e !== start) ?? run; }
    const lastVal = Math.abs(last.top) > Math.abs(last.bottom) ? last.top : last.bottom;
    check(`the steps chain from 4.5 down to the blue bar's −0.3 @${width}`, b.length === 5 && chain && Math.abs(run - lastVal) < 0.08 && Math.abs(lastVal + 0.27) < 0.06, `${run.toFixed(2)} ${lastVal.toFixed(2)}`);
    check(`the investment step is pink and 4.1 points long @${width}`, b.some((s) => /k-cma/.test(s.cls) && /down/.test(s.cls) && Math.abs(Math.abs(s.top - s.bottom) - 4.13) < 0.08));
  }
  await clickSeg("al-asset", "mom");
  await click('#al-presets button[data-p="capm"]');
  await click('#al-factors button[data-f="hml"]');
  {
    const b = await bars();
    check(`momentum with value: 8.3% to 9.8%, loading −0.33, a green step @${width}`, (await R("al-r-capm")) === "+8.3%" && (await R("al-r-alpha")) === "+9.8%" && (await R("al-r-b-hml")) === "−0.33" && b.some((s) => /k-hml/.test(s.cls) && /up/.test(s.cls)) && (await page.locator('#al-factors button[data-f="mom"]').isDisabled()));
  }
  await clickSeg("al-asset", "low");
  await click('#al-presets button[data-p="ff3"]');
  const ff3 = await R("al-r-alpha");
  await click('#al-presets button[data-p="ff5"]');
  check(`the lowest-beta tenth: +2.5% under the CAPM, +1.7% with three factors, +0.3% with five (t 0.4) @${width}`, (await R("al-r-capm")) === "+2.5%" && ff3 === "+1.7%" && (await R("al-r-alpha")) === "+0.3%" && (await R("al-r-t")) === "0.4");
  await click('#al-presets button[data-p="ff6"]');
  check(`all five factors draw seven bars cleanly @${width}`, (await bars()).length === 7 && (await geom()).length === 0);
  await clickSeg("al-asset", "hml");
  await click('#al-presets button[data-p="capm"]');

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
