/*
  Browser checks for equity-premium at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8793 SHOTS=/tmp/equity-premium-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8793";
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

  // ---- the hook: a century of premiums
  const BP = "#fig-band svg.bars-panel", RP = "#fig-band svg.ruler-panel";
  const ruler = async () => page.evaluate((RP) => {
    const el = document.querySelector(RP);
    const t = [...el.querySelectorAll("text.tick-label")].map((e) => ({ v: parseFloat(e.textContent.replace("−", "-")), p: +e.getAttribute("x") }));
    const a = t[0], b = t[t.length - 1], k = (b.p - a.p) / (b.v - a.v), val = (p) => a.v + (p - a.p) / k;
    const r = el.querySelector("rect.rband"), c = el.querySelector("circle.rmean");
    return { mean: val(+c.getAttribute("cx")), lo: val(+r.getAttribute("x")), hi: val(+r.getAttribute("x") + +r.getAttribute("width")) };
  }, RP);
  check(`the hook opens on 99 years: 8.9%, standard error 2.0, band 4.9% to 12.8% @${width}`,
    (await R("bl-r-mean")) === "8.9%" && (await R("bl-r-se")) === "2.0" && (await R("bl-r-band")) === "4.9% to 12.8%" && (await R("bl-r-n")) === "99");
  {
    const sc = await scales(BP), Y = lin(sc.ys);
    const meanY = Y.val(await nattr(`${BP} line.mean`, "y1"));
    const n = await has(`${BP} rect.bar`), nin = await has(`${BP} rect.bar.in`);
    const b31 = await page.evaluate((BP) => { const r = document.querySelector(`${BP} rect.bar[data-year="1931"]`); return [+r.getAttribute("y"), +r.getAttribute("height")]; }, BP);
    check(`99 bars, all in the window, the mean line drawn at 8.9 and 1931's bar reaching −44.8 @${width}`,
      n === 99 && nin === 99 && Math.abs(meanY - 8.86) < 0.3 && Math.abs(Y.val(b31[0] + b31[1]) + 44.84) < 0.4, `${meanY.toFixed(2)} ${Y.val(b31[0] + b31[1]).toFixed(2)}`);
    const r = await ruler();
    check(`the ruler draws the band from 4.9 to 12.8 around 8.9 @${width}`, Math.abs(r.mean - 8.86) < 0.1 && Math.abs(r.lo - 4.9) < 0.1 && Math.abs(r.hi - 12.83) < 0.1, `${r.lo.toFixed(2)} ${r.mean.toFixed(2)} ${r.hi.toFixed(2)}`);
  }
  await click('#bl-presets button[data-p="first"]');
  check(`the first-half preset: 1927 to 1975, 8.5%, band 1.9% to 15.0%, 49 bars in the window @${width}`,
    (await val("#bl-from")) === "1927" && (await val("#bl-to")) === "1975" && (await R("bl-r-mean")) === "8.5%" && (await R("bl-r-band")) === "1.9% to 15.0%" && (await has(`${BP} rect.bar.in`)) === 49);
  await click('#bl-presets button[data-p="second"]');
  check(`the second-half preset: 9.3%, band 4.7% to 13.8% @${width}`, (await R("bl-r-mean")) === "9.3%" && (await R("bl-r-band")) === "4.7% to 13.8%" && (await R("bl-r-n")) === "50");
  await click('#bl-presets button[data-p="all"]');
  await clickSeg("bl-freq", "monthly");
  {
    const r = await ruler();
    check(`monthly returns: 8.3%, standard error 1.9, 1188 months, and the ruler follows @${width}`,
      (await R("bl-r-mean")) === "8.3%" && (await R("bl-r-se")) === "1.9" && (await R("bl-r-n")) === "1188" && Math.abs(r.mean - 8.26) < 0.1);
  }
  await clickSeg("bl-freq", "yearly");
  await setRange(page, "#bl-from", 2000);
  await setRange(page, "#bl-to", 1950);
  check(`the window can't shrink below twenty years: 2000 to 2019 @${width}`, (await val("#bl-to")) === "2019" && (await R("bl-r-n")) === "20" && (await R("bl-r-mean")) === "6.4%" && (await R("bl-r-se")) === "4.3");
  await click('#bl-presets button[data-p="all"]');

  // ---- the guess card
  await click('#guess button[data-g="third"]');
  check(`the guess card corrects a third @${width}`, (await txt("#guess-answer")).startsWith("Only a little narrower.") && /2\.0 points .* 1\.9 .* 0\.6/.test((await txt("#guess-answer")).replace(/\s+/g, " ")));
  await click('#guess button[data-g="little"]');
  check(`and says right for a little @${width}`, (await txt("#guess-answer")).startsWith("Right"));

  // ---- frequency
  const FP = "#fig-freq svg.freq-panel";
  const rows = async () => page.evaluate((FP) => Object.fromEntries([...document.querySelectorAll(`${FP} g.row`)].map((g) => [g.getAttribute("class").split(" ")[1], +g.querySelector("rect").getAttribute("width")])), FP);
  check(`the frequency figure opens on 2.0, 1.9 and 1188 months @${width}`, (await R("fb-r-y")) === "2.0" && (await R("fb-r-m")) === "1.9" && (await R("fb-r-n")) === "1188");
  {
    const w = await rows();
    check(`the imagined band is one root-twelfth of the yearly one, the monthly one nearly as wide as yearly @${width}`,
      Math.abs(w["row-twelve"] / w["row-yearly"] - 1 / Math.sqrt(12)) < 0.01 && w["row-monthly"] / w["row-yearly"] > 0.85 && w["row-monthly"] / w["row-yearly"] < 0.97, JSON.stringify(w));
  }
  await setRange(page, "#fb-years", 30);
  check(`thirty years: 3.3 yearly, 2.9 monthly, 360 months @${width}`, (await R("fb-r-y")) === "3.3" && (await R("fb-r-m")) === "2.9" && (await R("fb-r-n")) === "360");

  // ---- rolling windows
  const RC = "#fig-rolling svg.rolling-panel";
  check(`thirty-year windows: lowest 4.7% (1965 to 1994), highest 14.2% (1932 to 1961) @${width}`,
    (await R("rc-r-lo")) === "4.7%, 1965 to 1994" && (await R("rc-r-hi")) === "14.2%, 1932 to 1961");
  {
    const v = await readAt(RC, "path.rmean", 1994), v2 = await readAt(RC, "path.rmean", 1961);
    const sc = await scales(RC), X = lin(sc.xs), Y = lin(sc.ys);
    const lo = [X.val(await nattr(`${RC} circle.lo`, "cx")), Y.val(await nattr(`${RC} circle.lo`, "cy"))];
    check(`the line reads 4.7 at 1994 and 14.2 at 1961, and the pink dot sits on 1994 @${width}`, Math.abs(v - 4.72) < 0.15 && Math.abs(v2 - 14.2) < 0.15 && Math.abs(lo[0] - 1994) < 0.2 && Math.abs(lo[1] - 4.72) < 0.15, `${v.toFixed(2)} ${v2.toFixed(2)} ${lo.map((x) => x.toFixed(2))}`);
  }
  await setRange(page, "#rc-end", 1994);
  check(`picking the window ending in 1994 gives 4.7% ± 6.1 @${width}`, (await txt("#rc-r-pick .label")) === "Window 1965 to 1994" && (await R("rc-r-pick")) === "4.7% ± 6.1");
  await clickSeg("rc-window", 20);
  check(`twenty-year windows: 2.5% to 16.1% @${width}`, (await R("rc-r-lo")) === "2.5%, 1962 to 1981" && (await R("rc-r-hi")) === "16.1%, 1942 to 1961");
  await clickSeg("rc-window", 50);
  check(`fifty-year windows: 5.4% to 10.0% @${width}`, (await R("rc-r-lo")) === "5.4%, 1959 to 2008" && (await R("rc-r-hi")) === "10.0%, 1933 to 1982");
  await setRange(page, "#rc-end", 1950);
  check(`a fifty-year window can't end before 1976 @${width}`, (await txt("#rc-r-pick .label")) === "Window 1927 to 1976" && (await R("rc-r-pick")) === "8.7% ± 6.5");
  await clickSeg("rc-window", 30);

  // ---- dividends
  const SP = "#fig-split svg.split-panel";
  const stack = async () => { const sc = await scales(SP), Y = lin(sc.ys); return page.evaluate((SP) => ["real", "div"].map((k) => { const g = document.querySelector(`${SP} g.bar-${k}`); const dp = g.querySelector("rect.dp"), gr = g.querySelector("rect.growth"); return { dpTop: +dp.getAttribute("y"), top: +gr.getAttribute("y") }; }), SP).then((a) => a.map((b) => ({ dp: Y.val(b.dpTop), top: Y.val(b.top) }))); };
  check(`1871 to 1950: 8.1% ± 4.1 against 7.6% ± 3.1, yield 5.3%, ratio 17 → 14 @${width}`,
    (await R("sl-r-real")) === "8.1% ± 4.1" && (await R("sl-r-div")) === "7.6% ± 3.1" && (await R("sl-r-dp")) === "5.3%" && (await R("sl-r-pd")) === "17 → 14");
  await clickSeg("sl-period", "fifty");
  {
    const s = await stack();
    check(`1951 to 2000: 9.3% ± 4.4 against 4.6% ± 1.1, ratio 14 → 83 @${width}`, (await R("sl-r-real")) === "9.3% ± 4.4" && (await R("sl-r-div")) === "4.6% ± 1.1" && (await R("sl-r-pd")) === "14 → 83");
    check(`the stacks read back 9.3 and 4.6 on a shared 3.6 yield @${width}`, Math.abs(s[0].top - 9.29) < 0.1 && Math.abs(s[1].top - 4.6) < 0.1 && Math.abs(s[0].dp - 3.6) < 0.1 && Math.abs(s[1].dp - s[0].dp) < 1e-6, JSON.stringify(s));
  }
  await clickSeg("sl-period", "late");
  check(`1951 to 2022: 8.3% against 5.1%, ratio 14 → 59 @${width}`, (await R("sl-r-real")) === "8.3% ± 3.7" && (await R("sl-r-div")) === "5.1% ± 1.3" && (await R("sl-r-pd")) === "14 → 59");
  await clickSeg("sl-period", "early");
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
