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

  // ------------------------------------------------ credit-spread-puzzle checks
  const near1 = (a, b, tol) => Math.abs(a - b) <= tol;
  // ---- history
  const HP = ".history-panel";
  check(`history readouts over the century @${width}`, (await R("hf-mean")) === "1.16 points" && (await R("hf-max")) === "5.64, May 1932" && (await R("hf-loss")) === "0.24 points" && (await R("hf-mult")) === "4.9×", `${await R("hf-mean")} | ${await R("hf-max")} | ${await R("hf-loss")} | ${await R("hf-mult")}`);
  {
    const sc = await scales(HP), X = lin(sc.xs), Y = lin(sc.ys);
    const line = await pts(`${HP} path.spread`);
    check(`1,293 months are drawn @${width}`, line.length === 1293, String(line.length));
    check(`May 1932 reads 5.64 on the axis @${width}`, near1(Y.val(yAt(line, X.px(1932 + 4 / 12 + 1 / 24))), 5.64, 0.03), Y.val(yAt(line, X.px(1932 + 4 / 12 + 1 / 24))).toFixed(3));
    check(`January 1919 reads 1.77 @${width}`, near1(Y.val(line[0][1]), 1.77, 0.02));
    check(`the dashed line sits at 0.24 points @${width}`, near1(Y.val(await nattr(`${HP} line.loss`, "y1")), 0.238, 0.01));
    check(`the blue average sits at 1.16 @${width}`, near1(Y.val(await nattr(`${HP} line.mean`, "y1")), 1.1566, 0.01));
    await clickSeg("hf-period", "ccdg");
    check(`1970 to 2001: 1.09 points, widest September 1982, 4.6× @${width}`, (await R("hf-mean")) === "1.09 points" && (await R("hf-max")) === "2.69, September 1982" && (await R("hf-mult")) === "4.6×", `${await R("hf-mean")} | ${await R("hf-max")} | ${await R("hf-mult")}`);
    const x0 = await nattr(`${HP} rect.window`, "x"), w0 = await nattr(`${HP} rect.window`, "width");
    check(`the shaded stretch runs from 1970 to 2002 on the axis @${width}`, near1(X.val(x0), 1970, 0.05) && near1(X.val(x0 + w0), 2002, 0.05), `${X.val(x0).toFixed(2)} ${X.val(x0 + w0).toFixed(2)}`);
    check(`and the average line covers it at 1.09 @${width}`, near1(Y.val(await nattr(`${HP} line.mean`, "y1")), 1.0921, 0.01) && near1(await nattr(`${HP} line.mean`, "x1"), x0, 0.5));
    await clickSeg("hf-period", "late");
    check(`2002 to 2026: 1.01 points, widest December 2008 @${width}`, (await R("hf-mean")) === "1.01 points" && (await R("hf-max")) === "3.38, December 2008", `${await R("hf-mean")} | ${await R("hf-max")}`);
    await clickSeg("hf-period", "all");
  }
  // ---- guess
  await click('#guess button[data-g="aaa"]');
  check(`guess card: Aaa's, 5.6 against 3.5 @${width}`, (await txt("#guess-answer")).startsWith("That's right, Aaa's.") && (await txt("#guess-answer")).includes("5.6 times") && (await txt("#guess-answer")).includes("3.5 times"), await txt("#guess-answer"));
  // ---- the model lab
  const MP = ".model-panel";
  check(`model readouts at the start @${width}`, (await R("ml-theta")) === "0.215" && (await R("ml-gap")) === "0.76 points" && (await R("ml-paid")) === "1.09 points" && (await R("ml-share")) === "69%", `${await R("ml-theta")} ${await R("ml-gap")} ${await R("ml-paid")} ${await R("ml-share")}`);
  {
    const X = lin((await scales(MP)).xs);
    const end = async (cls) => X.val((await nattr(`${MP} rect.${cls}`, "x")) + (await nattr(`${MP} rect.${cls}`, "width")));
    check(`the Baa bar ends at 0.95, its grey part at 0.27 @${width}`, near1(await end("premium.Baa"), 0.951, 0.01) && near1(await end("loss.Baa"), 0.273, 0.01), `${(await end("premium.Baa")).toFixed(3)} ${(await end("loss.Baa")).toFixed(3)}`);
    check(`the Aaa bar ends at 0.19 @${width}`, near1(await end("premium.Aaa"), 0.193, 0.01), (await end("premium.Aaa")).toFixed(3));
    check(`the gap bar ends at 0.76 and the pink line sits at 1.09 @${width}`, near1(await end("gap"), 0.757, 0.01) && near1(X.val(await nattr(`${MP} line.paid`, "x1")), 1.0921, 0.01));
    check(`the blue part starts where the grey ends @${width}`, near1(await nattr(`${MP} rect.premium.Baa`, "x"), (await nattr(`${MP} rect.loss.Baa`, "x")) + (await nattr(`${MP} rect.loss.Baa`, "width")), 0.01));
  }
  check(`the multiples below follow the lab: 5.56× and 3.48× @${width}`, (await R("mf-aaa")) === "5.56×" && (await R("mf-baa")) === "3.48×", `${await R("mf-aaa")} ${await R("mf-baa")}`);
  await setRange(page, "#ml-corr", 0.7);
  check(`correlation 0.7: the model explains 99% @${width}`, (await R("ml-share")) === "99%" && (await R("ml-theta")) === "0.301", `${await R("ml-share")} ${await R("ml-theta")}`);
  await setRange(page, "#ml-corr", 0);
  check(`correlation 0: back to 0.24 points, no blue @${width}`, (await R("ml-gap")) === "0.24 points" && (await nattr(`${MP} rect.premium.Baa`, "width")) < 0.01 && (await R("mf-baa")) === "1.00×", `${await R("ml-gap")} ${await R("mf-baa")}`);
  await setRange(page, "#ml-corr", 0.5);
  await setRange(page, "#ml-sharpe", 0.61);
  check(`a Sharpe ratio of 0.61 at correlation 0.5 explains 100% @${width}`, (await R("ml-share")) === "100%", await R("ml-share"));
  await setRange(page, "#ml-sharpe", 0.43);
  // ---- multiples
  {
    const FP = ".mult-panel";
    const sc = await scales(FP);
    const curve = await pts(`${FP} path.mult`);
    for (const k of ["aaa", "baa"]) {
      const cx = await nattr(`${FP} circle.dot-${k}`, "cx"), cy = await nattr(`${FP} circle.dot-${k}`, "cy");
      check(`the ${k} dot sits on the curve @${width}`, near1(yAt(curve, cx), cy, 1.5), `${yAt(curve, cx).toFixed(1)} vs ${cy}`);
    }
    // log y: 1×, 2×, 5×, 10×, 20×
    const ys = sc.ys, lg = Math.log10, a = ys[0], b = ys[ys.length - 1], k = (b.p - a.p) / (lg(b.v) - lg(a.v));
    const val = (p) => Math.pow(10, lg(a.v) + (p - a.p) / k);
    check(`the Aaa dot reads 5.56× on the log axis @${width}`, near1(val(await nattr(`${FP} circle.dot-aaa`, "cy")), 5.56, 0.05));
    check(`the Aaa dot is left of and above the Baa dot @${width}`, (await nattr(`${FP} circle.dot-aaa`, "cx")) < (await nattr(`${FP} circle.dot-baa`, "cx")) && (await nattr(`${FP} circle.dot-aaa`, "cy")) < (await nattr(`${FP} circle.dot-baa`, "cy")));
    await clickSeg("mf-t", "4");
    check(`four years: 4.34× and 2.73× @${width}`, (await R("mf-aaa")) === "4.34×" && (await R("mf-baa")) === "2.73×", `${await R("mf-aaa")} ${await R("mf-baa")}`);
    await clickSeg("mf-t", "10");
  }
  // ---- noise
  {
    const NP = ".noise-panel";
    check(`noise readouts at 0.15 @${width}`, (await R("nf-range")) === "1.7% to 10.1%" && (await R("nf-median")) === "4.39%" && (await R("nf-below")) === "59%" && (await R("nf-spread")) === "0.43 to 1.64 points", `${await R("nf-range")} | ${await R("nf-median")} | ${await R("nf-below")} | ${await R("nf-spread")}`);
    const sc = await scales(NP), X = lin(sc.xs), Y = lin(sc.ys);
    const x0 = await nattr(`${NP} rect.band`, "x"), w0 = await nattr(`${NP} rect.band`, "width");
    check(`the band runs from 1.7% to 10.1% on the axis @${width}`, near1(X.val(x0), 1.74, 0.05) && near1(X.val(x0 + w0), 10.08, 0.05), `${X.val(x0).toFixed(2)} ${X.val(x0 + w0).toFixed(2)}`);
    check(`the truth line is at 4.89% @${width}`, near1(X.val(await nattr(`${NP} line.truth`, "x1")), 4.89, 0.03));
    const bins = await page.evaluate((s) => [...document.querySelectorAll(`${s} rect.bin`)].map((r) => +r.getAttribute("height")), NP);
    const total = bins.reduce((a, h) => a + (Y.val(Y.px(0) - h) - 0), 0);
    check(`the bars add up to 2,000 records @${width}`, near1(total, 2000, 2), total.toFixed(1));
    await setRange(page, "#nf-rho", 0.05);
    check(`at 0.05: 2.9% to 7.6% @${width}`, (await R("nf-range")) === "2.9% to 7.6%", await R("nf-range"));
    await setRange(page, "#nf-rho", 0.3);
    check(`at 0.3: 0.9% to 13.0% @${width}`, (await R("nf-range")) === "0.9% to 13.0%", await R("nf-range"));
    await setRange(page, "#nf-rho", 0.15);
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
