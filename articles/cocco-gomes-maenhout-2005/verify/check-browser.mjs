/*
  Browser checks for cocco-gomes-maenhout-2005 at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/cocco-gomes-maenhout-2005-shots node verify/check-browser.mjs

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
  const on = (id, v) => page.locator(`#${id} button[data-value="${v}"]`).getAttribute("aria-pressed");

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
  const yAt = (poly, px) => { for (let i = 1; i < poly.length; i++) { const [x0, y0] = poly[i - 1], [x1, y1] = poly[i]; if (px >= x0 - 1e-6 && px <= x1 + 1e-6) return y0 + ((px - x0) / (x1 - x0 || 1)) * (y1 - y0); } return NaN; };
  const attr = (sel, a) => page.locator(sel).first().getAttribute(a);
  // the drawn median share at an age, read back in percent, and the drawn limit line
  const medianDrawn = async (age) => {
    const sc = await scales("#fig-policy svg.share-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const poly = await pts("#fig-policy path.median");
    return Y.val(yAt(poly, X.px(age)));
  };
  const limitDrawn = async () => {
    const sc = await scales("#fig-policy svg.share-panel"), Y = lin(sc.ys);
    return Y.val(+(await attr("#fig-policy line.limit-line", "y1")));
  };

  // the guess card
  await page.click('#guess button[data-g="all"]'); await settle(page);
  check(`the guess card says right for "all of it" @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await page.click('#guess button[data-g="third"]'); await settle(page);
  check(`and explains itself for "a third" @${width}`, (await txt("#guess-answer")).includes("as much as the limit lets her hold"));

  // ---- figure 1 at its defaults: risk aversion 5, no borrowing, pay unrelated to stocks
  check(`the defaults are risk aversion 5, no borrowing, unrelated @${width}`, (await on("pl-g", 5)) === "true" && (await on("pl-cap", 1)) === "true" && (await on("pl-rho", 0)) === "true");
  check(`readouts: 100% at 25 and 45, 78% at 65 @${width}`, (await txt("#pl-r-25 .value")) === "100%" && (await txt("#pl-r-45 .value")) === "100%" && (await txt("#pl-r-65 .value")) === "78%");
  check(`88% of workers at the limit at 45, the median leaves it at 55, and has saved 8.5 years of pay by 65 @${width}`,
    (await txt("#pl-r-cap45 .value")) === "88%" && (await txt("#pl-r-leave .value")) === "55" && (await txt("#pl-r-w65 .value")) === "8.5");
  {
    const lim = await limitDrawn();
    check(`the dashed limit is drawn at 100% @${width}`, near(lim, 100, 0.6), lim.toFixed(2));
    const m25 = await medianDrawn(25), m45 = await medianDrawn(45), m60 = await medianDrawn(60), m65 = await medianDrawn(65);
    check(`the drawn median sits on the limit at 25 and 45 @${width}`, near(m25, 100, 0.8) && near(m45, 100, 0.8), `${m25.toFixed(1)} ${m45.toFixed(1)}`);
    check(`and reads back 85% at 60 and 78% at 65 @${width}`, near(m60, 85.4, 1.2) && near(m65, 77.9, 1.2), `${m60.toFixed(1)} ${m65.toFixed(1)}`);
    const sc = await scales("#fig-policy svg.share-panel"), X = lin(sc.xs);
    check(`the retirement line is drawn at 65 @${width}`, near(+(await attr("#fig-policy .share-panel line.retire-line", "x1")), X.px(65), 1));
    const sw = await scales("#fig-policy svg.wealth-panel"), Xw = lin(sw.xs), Yw = lin(sw.ys);
    const wp = await pts("#fig-policy path.wealth");
    const w65 = Yw.val(yAt(wp, Xw.px(65))), w25 = Yw.val(yAt(wp, Xw.px(25)));
    check(`the savings chart reads 8.5 years of pay at 65 and 0.6 at 25 @${width}`, near(w65, 8.47, 0.15) && near(w25, 0.61, 0.15), `${w65.toFixed(2)} ${w25.toFixed(2)}`);
    check(`the band is drawn (a closed path with 1,000+ characters) @${width}`, ((await attr("#fig-policy path.band", "d")) || "").length > 1000);
  }

  // a 2 to 1 limit
  await clickSeg("pl-cap", 2);
  check(`with a 2 to 1 limit: 200% at 25, 134% at 45, off the limit at 38 @${width}`,
    (await txt("#pl-r-25 .value")) === "200%" && (await txt("#pl-r-45 .value")) === "134%" && (await txt("#pl-r-leave .value")) === "38");
  {
    const lim = await limitDrawn(), m25 = await medianDrawn(25), m45 = await medianDrawn(45);
    check(`the dashed limit moves to 200% and the median with it @${width}`, near(lim, 200, 1) && near(m25, 200, 1.2) && near(m45, 134.5, 1.5), `${lim.toFixed(1)} ${m25.toFixed(1)} ${m45.toFixed(1)}`);
  }
  await clickSeg("pl-cap", 1);

  // risk aversion 3 and 10
  await clickSeg("pl-g", 3);
  check(`at risk aversion 3 the median never leaves the limit @${width}`, (await txt("#pl-r-leave .value")) === "never" && (await txt("#pl-r-cap45 .value")) === "100%" && (await txt("#pl-r-65 .value")) === "100%");
  await clickSeg("pl-g", 10);
  check(`at 10: 100% at 25, 44% at 45, 34% at 65, off the limit at 30 @${width}`,
    (await txt("#pl-r-25 .value")) === "100%" && (await txt("#pl-r-45 .value")) === "44%" && (await txt("#pl-r-65 .value")) === "34%" && (await txt("#pl-r-leave .value")) === "30");
  check(`and the savings chart's axis grows to fit her 11 years of pay @${width}`, (await txt("#pl-r-w65 .value")) === "11.1" && (await scales("#fig-policy svg.wealth-panel")).ys.at(-1).v >= 15);
  {
    const m35 = await medianDrawn(35), m65 = await medianDrawn(65);
    check(`the drawn median reads 65% at 35 and 34% at 65 @${width}`, near(m35, 64.6, 1.2) && near(m65, 34.0, 1.2), `${m35.toFixed(1)} ${m65.toFixed(1)}`);
  }

  // pay that moves with stocks
  await clickSeg("pl-g", 5);
  await clickSeg("pl-rho", 0.3);
  check(`with a correlation of 0.3 at risk aversion 5: 73% at 45, 80% at 65, off the limit at 38 @${width}`,
    (await txt("#pl-r-45 .value")) === "73%" && (await txt("#pl-r-65 .value")) === "80%" && (await txt("#pl-r-leave .value")) === "38");
  {
    const m64 = await medianDrawn(64), m65 = await medianDrawn(65);
    check(`the drawn median jumps at 65, from 50% to 80% @${width}`, near(m64, 49.6, 1.3) && near(m65, 80.4, 1.3) && m65 - m64 > 25, `${m64.toFixed(1)} ${m65.toFixed(1)}`);
  }
  await clickSeg("pl-g", 10);
  check(`at risk aversion 10 the median holds nothing at 25 @${width}`, (await txt("#pl-r-25 .value")) === "0%");
  await clickSeg("pl-g", 5);

  // ---- figure 2: what the limit costs. The settings are shared with figure 1.
  check(`the cost figure shares the settings: risk aversion 5 and correlation 0.3 are on @${width}`, (await on("cl-g", 5)) === "true" && (await on("cl-rho", 0.3)) === "true");
  await clickSeg("cl-rho", 0);
  check(`switching it back also switches figure 1 @${width}`, (await on("pl-rho", 0)) === "true");
  {
    const labels = await page.locator("#fig-cost text.bar-label").allTextContents();
    check(`unrelated pay: 3.0%, 1.6% and 0.16% @${width}`, labels.length === 3 && labels[0].endsWith("3.0%") && labels[1].endsWith("1.6%") && labels[2].endsWith("0.16%"), labels.join(" | "));
    const svgW = +(await page.locator("#fig-cost svg.cost-panel").getAttribute("width"));
    const bars = await page.evaluate(() => [...document.querySelectorAll("#fig-cost rect.cost-bar")].map((r) => ({ g: +r.dataset.g, w: +r.getAttribute("width"), fill: r.getAttribute("fill") })));
    const full = svgW - 32; // the axis runs from 0 to 3.5% across the plot
    check(`the bars' drawn widths are 3.0/3.5, 1.55/3.5 and 0.16/3.5 of the plot @${width}`,
      near(bars[0].w, (0.03 / 0.035) * full, 1.2) && near(bars[1].w, (0.01552 / 0.035) * full, 1.2) && near(bars[2].w, (0.00163 / 0.035) * full, 1.2), bars.map((b) => b.w.toFixed(1)).join(" "));
    check(`the chosen risk aversion is the blue bar @${width}`, bars.filter((b) => b.fill === "var(--c1)").length === 1 && bars.find((b) => b.g === 5).fill === "var(--c1)");
  }
  await clickSeg("cl-g", 3);
  check(`choosing 3 here re-colours the bar and moves figure 1 to 3 @${width}`, (await on("pl-g", 3)) === "true" && (await page.evaluate(() => document.querySelector('#fig-cost rect.cost-bar[data-g="3"]').getAttribute("fill"))) === "var(--c1)");
  await clickSeg("cl-rho", 0.3);
  {
    const labels = await page.locator("#fig-cost text.bar-label").allTextContents();
    check(`correlated pay: 1.5%, 0.17% and 0.00% @${width}`, labels[0].endsWith("1.5%") && labels[1].endsWith("0.17%") && labels[2].endsWith("0.00%"), labels.join(" | "));
    const w10 = await page.evaluate(() => +document.querySelector('#fig-cost rect.cost-bar[data-g="10"]').getAttribute("width"));
    check(`and the last bar has no width @${width}`, w10 === 0, `${w10}`);
  }
  await clickSeg("cl-g", 5);
  await clickSeg("cl-rho", 0);

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
