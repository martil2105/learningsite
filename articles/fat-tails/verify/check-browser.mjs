/*
  Browser checks for fat-tails at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8794 SHOTS=/tmp/fat-tails-shots node verify/check-browser.mjs

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

  const kParse = (t) => { t = t.replace("−", "-").trim(); let k = 1; if (/k$/.test(t)) k = 1e3; return parseFloat(t.replace(/[k%,]/g, "")) * k; };
  const logAxis = (svg, axis = "y") => page.evaluate(([svg, axis]) => {
    const el = document.querySelector(svg);
    if (axis === "y") return [...el.querySelectorAll(".axis-y text.tick-label")].map((t) => ({ t: t.textContent, p: +t.getAttribute("y") - 4 }));
    return [...el.querySelectorAll(".axis-x g[transform]")].map((g) => ({ t: g.querySelector("text").textContent, p: +g.getAttribute("transform").match(/translate\(([-\d.]+)/)[1] }));
  }, [svg, axis]);
  const logFit = (ticks, parse) => { const a = ticks[0], b = ticks[ticks.length - 1]; const va = Math.log10(parse(a.t)), vb = Math.log10(parse(b.t)); const k = (b.p - a.p) / (vb - va); return { px: (v) => a.p + (Math.log10(v) - va) * k, val: (p) => Math.pow(10, va + (p - a.p) / k) }; };

  // ---- counting the big days
  const CP = ".count-panel";
  check(`five sd: 101 days, the normal 0.015, one every 0.99 years against 6,639 @${width}`, (await R("cl-r-n")) === "101" && (await R("cl-r-norm")) === "0.015" && (await R("cl-r-data")) === "0.99 years" && (await R("cl-r-normal")) === "6,639 years", `${await R("cl-r-n")} ${await R("cl-r-norm")} ${await R("cl-r-data")} ${await R("cl-r-normal")}`);
  {
    const tails = await page.$$eval(`${CP} rect.bin.tail`, (rs) => rs.reduce((s, r) => s + +r.getAttribute("data-c"), 0));
    check(`the pink bars hold the 101 days @${width}`, tails === 101, String(tails));
    const all = await page.$$eval(`${CP} rect.bin`, (rs) => rs.reduce((s, r) => s + +r.getAttribute("data-c"), 0));
    check(`all the bars together hold every one of the 26,317 days @${width}`, all === 26317, String(all));
    const sc = await scales(CP), X = lin(sc.xs);
    check(`the threshold lines are at ±5 sd @${width}`, Math.abs(X.val(await nattr(`${CP} line.k-lo`, "x1")) + 5) < 0.05 && Math.abs(X.val(await nattr(`${CP} line.k-hi`, "x1")) - 5) < 0.05);
    const Y = logFit(await logAxis(CP), kParse);
    const np = await pts(`${CP} path.normal`);
    const peak = Math.min(...np.map((p) => p[1]));
    check(`the normal curve peaks at about 5,250 days a bin @${width}`, Math.abs(Y.val(peak) / 5249 - 1) < 0.02, Y.val(peak).toFixed(0));
    const ys = await page.$$eval(`${CP} rect.bin`, (rs) => rs.map((r) => [+r.getAttribute("data-c"), +r.getAttribute("y")]));
    check(`every bar's top reads its count on the log axis @${width}`, ys.every(([c, y]) => Math.abs(Y.val(y) / c - 1) < 0.02));
  }
  await setRange(page, "#cl-k", 10);
  check(`ten sd: 9 days, the normal's wait 2.5 × 10²⁰ years @${width}`, (await R("cl-r-n")) === "9" && (await R("cl-r-normal")) === "2.5 × 10²⁰ years", `${await R("cl-r-n")} ${await R("cl-r-normal")}`);
  await setRange(page, "#cl-k", 5);

  // ---- the tails on a log–log chart
  const TP = ".tail-panel";
  check(`falls, 200 largest: exponent 3.1 @${width}`, (await R("tf-r-alpha")) === "3.1" && (await R("tf-r-twice")) === "9 times", `${await R("tf-r-alpha")} ${await R("tf-r-twice")}`);
  {
    const pct = (t) => parseFloat(t.replace("%", "")) / 100;
    const Y = logFit(await logAxis(TP), pct), X = logFit(await logAxis(TP, "x"), (t) => parseFloat(t));
    const ax = await nattr(`${TP} circle.anchor`, "cx"), ay = await nattr(`${TP} circle.anchor`, "cy");
    check(`the fit's anchor is the 200th largest fall, at 1 day in 132 @${width}`, Math.abs(Y.val(ay) * 26317 - 200) < 3, (Y.val(ay) * 26317).toFixed(1));
    const fit = await pts(`${TP} path.fit`);
    check(`the fit line starts at the anchor @${width}`, Math.abs(fit[0][0] - ax) < 0.6 && Math.abs(fit[0][1] - ay) < 0.6);
    const slope = (Math.log10(Y.val(fit[1][1])) - Math.log10(Y.val(fit[0][1]))) / (Math.log10(X.val(fit[1][0])) - Math.log10(X.val(fit[0][0])));
    check(`and its slope on the chart is −3.1 @${width}`, Math.abs(slope + 3.12) < 0.05, slope.toFixed(3));
    const data = await pts(`${TP} path.data`);
    check(`the US line passes through the anchor @${width}`, Math.abs(yAt(data.slice().sort((a, b) => a[0] - b[0]), ax) - ay) < 2);
    const far = data.reduce((a, b) => (b[0] > a[0] ? b : a));
    check(`the US line reaches out to 1987, about 16 sd @${width}`, Math.abs(X.val(far[0]) - 16.2) < 0.3, X.val(far[0]).toFixed(2));
  }
  await clickSeg("tf-k", "50");
  check(`50 largest falls: 3.9 @${width}`, (await R("tf-r-alpha")) === "3.9");
  await clickSeg("tf-k", "800");
  check(`800 largest: 2.7 @${width}`, (await R("tf-r-alpha")) === "2.7");
  await clickSeg("tf-k", "200");
  await clickSeg("tf-side", "1");
  check(`rises: 3.1 @${width}`, (await R("tf-r-alpha")) === "3.1");
  await clickSeg("tf-side", "-1");

  // ---- kurtosis that settles, and kurtosis that doesn't
  const KS = ".kurt-sim", KU = ".kurt-us";
  check(`four samples of each kind are drawn @${width}`, (await has(`${KS} path.t3`)) === 4 && (await has(`${KS} path.t6`)) === 4);
  check(`at 100,000 days: exponent 3 from 45.9 to 99.8, exponent 6 near 6 @${width}`, (await R("kl-r-3")) === "45.9 to 99.8" && /^5\.\d to 6\.\d$/.test(await R("kl-r-6")), `${await R("kl-r-3")} | ${await R("kl-r-6")}`);
  {
    const Y = logFit(await logAxis(KS), (t) => parseFloat(t));
    check(`the dashed line is at 6 @${width}`, Math.abs(Y.val(await nattr(`${KS} line.six`, "y1")) - 6) < 0.05);
    const ends = await page.$$eval(`${KS} path.t6`, (ps) => ps.map((p) => { const n = p.getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number); return n[n.length - 1]; }));
    check(`every exponent-6 sample ends near the dashed line @${width}`, ends.every((y) => Math.abs(Y.val(y) - 6) < 0.7));
  }
  check(`ten-year windows: 1987–1996 highest at 73.3, 84% from 19 October 1987; lowest 1977–1986 at 5.2 @${width}`, (await R("kl-r-top")) === "1987–1996: 73.3" && (await R("kl-r-share")) === "84%, 19 October 1987" && (await R("kl-r-low")) === "1977–1986: 5.2", `${await R("kl-r-top")} ${await R("kl-r-share")} ${await R("kl-r-low")}`);
  {
    const Y = await (async () => lin((await scales(KU)).ys))();
    const yb = await nattr(`${KU} rect.biggest[data-i="6"]`, "y"), hb = await nattr(`${KU} rect.biggest[data-i="6"]`, "height"), yr = await nattr(`${KU} rect.rest[data-i="6"]`, "y");
    const total = Y.val(yb), slice = Y.val(yb) - Y.val(yb + hb);
    check(`the 1987 bar reaches 73.3 and its pink slice is 84% of it @${width}`, Math.abs(total - 73.3) < 0.4 && Math.abs(slice / total - 0.84) < 0.01 && Math.abs(yr - (yb + hb)) < 0.01, `${total.toFixed(1)} ${(slice / total).toFixed(3)}`);
  }
  await clickSeg("kl-L", "20");
  check(`twenty-year windows: five bars @${width}`, (await has(`${KU} rect.rest`)) === 5);
  await clickSeg("kl-L", "10");
  await setRange(page, "#kl-n", 40);
  check(`at 1,000 days the readouts move @${width}`, (await R("kl-r-3")) !== "45.9 to 99.8");
  await setRange(page, "#kl-n", 120);

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
