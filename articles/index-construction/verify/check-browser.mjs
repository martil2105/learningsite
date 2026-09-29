/*
  Browser checks for index-construction at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/index-construction-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
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

  // ---- three stocks, one month
  const D1 = "#fig-drift";
  check(`the default move is 20%: sells A 6.7%, buys C 6.7%, 6.7% traded, the cap-weighted index trades nothing @${width}`,
    (await R("df-r-sell")) === "6.7%" && (await R("df-r-buy")) === "6.7%" && (await R("df-r-turn")) === "6.7%" && (await R("df-r-cap")) === "none");
  const bars = (kind) => page.evaluate(([D1, kind]) => {
    const svg = document.querySelector(`${D1} svg.drift-panel.${kind}`);
    const t = [...svg.querySelectorAll("text.tick-label")].map((e) => ({ v: parseFloat(e.textContent), p: +e.getAttribute("y") - 4 }));
    const a = t[0], b = t[t.length - 1], k = (b.p - a.p) / (b.v - a.v), val = (p) => a.v + (p - a.p) / k;
    const h = [...svg.querySelectorAll("rect.bar")].map((e) => val(+e.getAttribute("y")));
    const tg = [...svg.querySelectorAll("rect.target")].map((e) => val(+e.getAttribute("y")));
    return { h, tg, arrows: svg.querySelectorAll("line.arrow").length, top: svg.getBoundingClientRect().top };
  }, [D1, kind]);
  {
    const c = await bars("cap"), e = await bars("equal");
    check(`the bars read 40%, 33.3% and 26.7% in both panels @${width}`, [40, 33.33, 26.67].every((v, i) => Math.abs(c.h[i] - v) < 0.3 && Math.abs(e.h[i] - v) < 0.3), c.h.map((v) => v.toFixed(1)).join(" "));
    check(`the equal-weighted panel has outlines at 33.3% and two arrows; the cap-weighted panel none @${width}`, e.tg.every((v) => Math.abs(v - 33.33) < 0.3) && e.arrows === 2 && c.arrows === 0 && c.tg.length === 0);
    check(width > 700 ? `the two panels sit side by side @${width}` : `the two panels stack on a phone @${width}`, width > 700 ? Math.abs(c.top - e.top) < 1 : e.top > c.top + 50);
  }
  await setRange(page, "#df-d", 0);
  {
    const e = await bars("equal");
    check(`with no moves: no arrows and nothing traded @${width}`, e.arrows === 0 && (await R("df-r-turn")) === "0.0%");
  }
  await setRange(page, "#df-d", 0.4);
  check(`at 40% the trade is 13.3% of the fund @${width}`, (await R("df-r-turn")) === "13.3%");
  await setRange(page, "#df-d", 0.2);

  // ---- trading more, gaining the same (log x axis)
  const TP = "#fig-turnover svg.turn-panel", GP = "#fig-turnover svg.gain-panel";
  check(`readouts at 30%: 24% quarterly, 189% daily, 4.5% gain @${width}`, (await R("tc-r-q")) === "24%" && (await R("tc-r-d")) === "189%" && (await R("tc-r-g")) === "4.5%");
  const dotsVsLine = async (svg, dotCls, lineCls) => page.evaluate(([svg, dotCls, lineCls]) => {
    const el = document.querySelector(svg);
    const t = [...el.querySelectorAll(".axis-y text.tick-label")].map((e) => ({ v: parseFloat(e.textContent), p: +e.getAttribute("y") - 4 }));
    const a = t[0], b = t[t.length - 1], k = (b.p - a.p) / (b.v - a.v), val = (p) => a.v + (p - a.p) / k;
    const d = el.querySelector(`path.${lineCls}`).getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number); const P = []; for (let i = 0; i + 1 < d.length; i += 2) P.push([d[i], d[i + 1]]);
    const yAt = (x) => { for (let i = 1; i < P.length; i++) if (x >= P[i - 1][0] - 1e-6 && x <= P[i][0] + 1e-6) return P[i - 1][1] + ((x - P[i - 1][0]) / (P[i][0] - P[i - 1][0] || 1)) * (P[i][1] - P[i - 1][1]); return NaN; };
    return [...el.querySelectorAll(`circle.${dotCls}`)].map((c) => ({ f: c.dataset.f, dot: val(+c.getAttribute("cy")), line: val(yAt(+c.getAttribute("cx"))) }));
  }, [svg, dotCls, lineCls]);
  {
    const T1 = await dotsVsLine(TP, "turn-dot", "turn-line");
    check(`every turnover ring is within 3% of the line @${width}`, T1.length === 5 && T1.every((q) => Math.abs(q.dot / q.line - 1) < 0.035), T1.map((q) => `${q.f} ${q.dot.toFixed(1)}/${q.line.toFixed(1)}`).join(", "));
    check(`the line reads 24% at quarterly and 189% at daily @${width}`, Math.abs(T1.find((q) => q.f === "quarterly").line - 23.8) < 1 && Math.abs(T1.find((q) => q.f === "daily").line - 189) < 2);
    const G1 = await dotsVsLine(GP, "gain-dot", "gain-line");
    check(`every gain ring is within 0.3 points of the flat 4.5% line @${width}`, G1.length === 5 && G1.every((q) => Math.abs(q.dot - q.line) < 0.3 && Math.abs(q.line - 4.455) < 0.1), G1.map((q) => q.dot.toFixed(2)).join(" "));
    const xs = await page.evaluate((TP) => [...document.querySelectorAll(`${TP} circle.turn-dot`)].map((c) => +c.getAttribute("cx")), TP);
    const gaps = xs.slice(1).map((v, i) => v - xs[i]);
    check(`the frequencies are placed on a log axis (quarterly to monthly is 0.79 of yearly to quarterly) @${width}`, Math.abs(gaps[1] / gaps[0] - Math.log(3) / Math.log(4)) < 0.01, (gaps[1] / gaps[0]).toFixed(3));
  }
  await setRange(page, "#tc-s", 0.5);
  check(`at 50%: 40% quarterly, 315% daily, 12.4% gain @${width}`, (await R("tc-r-q")) === "40%" && (await R("tc-r-d")) === "315%" && (await R("tc-r-g")) === "12.4%");
  await setRange(page, "#tc-s", 0.3);

  // ---- thirty years of two indices
  const VP = "#fig-index svg.value-panel", SP = "#fig-index svg.split-panel";
  check(`the first market: 9.9× and 9.3×, +1.33, −1.27, +0.06, 18.8 effective stocks @${width}`,
    (await R("il-r-ew")) === "9.9×" && (await R("il-r-cw")) === "9.3×" && (await R("il-r-gain")) === "+1.33" && (await R("il-r-conc")) === "−1.27" && (await R("il-r-gap")) === "+0.06" && (await R("il-r-neff")) === "18.8");
  // the identity, read back from the drawn lines at every tenth vertex
  const identity = async () => {
    const sc = await scales(SP), Y = lin(sc.ys);
    const g = await pts(`${SP} path.gain`), c = await pts(`${SP} path.conc`), d = await pts(`${SP} path.gap`);
    let worst = 0; for (let i = 0; i < d.length; i += 10) worst = Math.max(worst, Math.abs(Y.val(d[i][1]) - (Y.val(g[i][1]) + Y.val(c[i][1]))));
    return { worst, end: [Y.val(g[g.length - 1][1]), Y.val(c[c.length - 1][1]), Y.val(d[d.length - 1][1])], n: d.length };
  };
  {
    const idt = await identity();
    check(`the blue line is the green plus the pink at every date, read from the pixels @${width}`, idt.worst < 0.02 && idt.n === 361, `${idt.worst.toFixed(4)} over ${idt.n} points`);
    check(`and they end at 1.33, −1.27 and 0.06 @${width}`, Math.abs(idt.end[0] - 1.334) < 0.02 && Math.abs(idt.end[1] + 1.271) < 0.02 && Math.abs(idt.end[2] - 0.064) < 0.02, idt.end.map((v) => v.toFixed(3)).join(" "));
    const vv = await page.evaluate((VP) => {
      const el = document.querySelector(VP);
      const t = [...el.querySelectorAll(".axis-y text.tick-label")].map((e) => ({ v: Math.log10(parseFloat(e.textContent.replace("$", ""))), p: +e.getAttribute("y") - 4 }));
      const a = t[0], b = t[t.length - 1], k = (b.p - a.p) / (b.v - a.v), val = (p) => Math.pow(10, a.v + (p - a.p) / k);
      const last = (sel) => { const d = el.querySelector(sel).getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number); return val(d[d.length - 1]); };
      return [last("path.ew"), last("path.cw")];
    }, VP);
    check(`the dollar lines end at $9.92 and $9.30 on the log axis @${width}`, Math.abs(vv[0] - 9.92) < 0.1 && Math.abs(vv[1] - 9.3) < 0.1, vv.map((v) => v.toFixed(2)).join(" "));
  }
  await click("#il-another");
  {
    const idt = await identity();
    check(`another market: the readouts change and the identity still holds in the pixels @${width}`, (await R("il-r-gain")) !== "" && (await R("il-r-ew")) !== "9.9×" && idt.worst < 0.02);
  }
  await click("#il-another"); await click("#il-another"); await click("#il-another"); await click("#il-another");
  await click("#il-another"); await click("#il-another"); await click("#il-another");
  check(`after eight clicks the markets continue (a ninth market) @${width}`, Number.isFinite(parseFloat((await R("il-r-gain")).replace("−", "-"))));
  await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(300);
  await clickSeg("il-world", "pull");
  check(`big firms slow down: +0.89, 9.9× against 4.1×, 48.9 effective stocks @${width}`,
    (await R("il-r-gap")) === "+0.89" && (await R("il-r-ew")) === "9.9×" && (await R("il-r-cw")) === "4.1×" && (await R("il-r-neff")) === "48.9");
  {
    const idt = await identity();
    check(`the identity holds in the pixels there too, and the pink line ends at −0.44 @${width}`, idt.worst < 0.02 && Math.abs(idt.end[1] + 0.443) < 0.02, idt.end[1].toFixed(3));
  }
  await clickSeg("il-n", 500);
  {
    const idt = await identity();
    check(`with 500 stocks the lab still draws a finite, consistent split @${width}`, idt.worst < 0.02 && idt.end.every(Number.isFinite));
  }
  await clickSeg("il-n", 30);
  await clickSeg("il-world", "same");
  {
    const idt = await identity();
    check(`with 30 stocks too @${width}`, idt.worst < 0.03);
  }
  await clickSeg("il-n", 100);

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
