/*
  Browser checks for capital-structure at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8792 SHOTS=/tmp/capital-structure-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8792";
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

  // the guess card
  await click('#guess button[data-g="same"]');
  check(`the guess card says right for still 8% @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await click('#guess button[data-g="lower"]');
  check(`and corrects 5.5% @${width}`, (await txt("#guess-answer")).startsWith("It's still 8%."));

  const dotOn = async (svg, dotSel, lineSel) => {
    const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${svg} ${dotSel}`, "cx"), cy = await nattr(`${svg} ${dotSel}`, "cy");
    const poly = await pts(`${svg} ${lineSel}`);
    return { x: X.val(cx), y: Y.val(cy), off: Math.abs(yAt(poly, cx) - cy) };
  };

  // ---- the lab: expected returns against borrowing
  const RP = "#fig-returns svg.ret-panel";
  check(`the lab opens at a ratio of 1: 13.0% for shareholders on the 13.0% line, 3.0% for lenders, 8.0% overall @${width}`,
    (await R("rl-r-e")) === "13.0%" && (await R("rl-r-line")) === "13.0%" && (await R("rl-r-d")) === "3.0%" && (await R("rl-r-w")) === "8.0%" && (await R("rl-r-p")) === "0.2%");
  {
    const e = await dotOn(RP, "circle.pt-e", "path.line.equity"), d = await dotOn(RP, "circle.pt-d", "path.line.debt");
    check(`the blue dot is on the shareholders' curve at 13% and the pink one on the lenders' at 3% @${width}`, Math.abs(e.y - 13) < 0.1 && e.off < 0.6 && Math.abs(d.y - 3) < 0.1 && d.off < 0.6, JSON.stringify([e, d]));
    const sc = await scales(RP), Y = lin(sc.ys);
    check(`the cost of capital line is flat at 8% @${width}`, Math.abs(Y.val(await nattr(`${RP} line.wacc`, "y1")) - 8) < 0.05 && (await attr(`${RP} line.wacc`, "y1")) === (await attr(`${RP} line.wacc`, "y2")));
  }
  await setRange(page, "#rl-de", 3);
  {
    check(`at a ratio of 3: the line says 23.0%, shareholders expect 21.0%, lenders 3.7%, unpaid in 12.9% of years @${width}`,
      (await R("rl-r-line")) === "23.0%" && (await R("rl-r-e")) === "21.0%" && (await R("rl-r-d")) === "3.7%" && (await R("rl-r-p")) === "12.9%" && (await R("rl-r-w")) === "8.0%");
    const e = await dotOn(RP, "circle.pt-e", "path.line.equity");
    const linePts = await pts(`${RP} path.line.mm`), eqPts = await pts(`${RP} path.line.equity`);
    const sc = await scales(RP), X = lin(sc.xs), Y = lin(sc.ys);
    const gapPx = yAt(eqPts, X.px(3)) - yAt(linePts, X.px(3));
    check(`and the drawn curve sits 2 points below the dashed line there @${width}`, Math.abs(e.y - 21.01) < 0.1 && Math.abs(Y.val(yAt(linePts, X.px(3))) - Y.val(yAt(eqPts, X.px(3))) - 1.99) < 0.1 && gapPx > 3, `${gapPx.toFixed(1)}px`);
  }
  await setRange(page, "#rl-s", 0.1);
  {
    const linePts = await pts(`${RP} path.line.mm`), eqPts = await pts(`${RP} path.line.equity`);
    const sc = await scales(RP), X = lin(sc.xs);
    let worst = 0; for (let v = 0; v <= 3; v += 0.25) worst = Math.max(worst, Math.abs(yAt(eqPts, X.px(v)) - yAt(linePts, X.px(v))));
    check(`at 10% volatility the curve lies on the straight line up to a ratio of 3 @${width}`, worst < 0.6 && (await R("rl-r-e")) === "23.0%", `${worst.toFixed(2)}px`);
  }
  await setRange(page, "#rl-s", 0.45);
  await setRange(page, "#rl-de", 4);
  {
    const g2 = await geom();
    const e = await dotOn(RP, "circle.pt-e", "path.line.equity");
    check(`the far corner (45% volatility, a ratio of 4) draws cleanly and keeps the cost of capital at 8.0% @${width}`, g2.length === 0 && (await R("rl-r-w")) === "8.0%" && e.off < 0.6);
  }
  await setRange(page, "#rl-s", 0.25);
  await setRange(page, "#rl-de", 1);

  // ---- who gets what next year
  const SPl = "#fig-split svg.split-panel", DPl = "#fig-split svg.dens-panel";
  check(`the split opens at a ratio of 3: $78.89 owed, $100.00 together, 12.9% short @${width}`,
    (await R("sf-r-f")) === "$78.89" && (await R("sf-r-v")) === "$100.00" && (await R("sf-r-p")) === "12.9%");
  {
    const sc = await scales(SPl), Y = lin(sc.ys);
    const fy = await nattr(`${SPl} line.face`, "y1");
    check(`the face-value line is drawn at $78.89 @${width}`, Math.abs(Y.val(fy) - 78.89) < 0.3);
    // the pink tail ends where the face value is, on the shared x axis
    const tail = await pts(`${DPl} path.dens-below`);
    const sx = await scales(DPl), X = lin(sx.xs);
    const right = Math.max(...tail.map((p) => p[0]));
    check(`the pink tail of the second chart stops at $78.89 @${width}`, Math.abs(X.val(right) - 78.89) < 0.6, X.val(right).toFixed(2));
    const tops = await page.evaluate(([a, b]) => [document.querySelector(a).getBoundingClientRect(), document.querySelector(b).getBoundingClientRect()].map((r) => [r.left, r.width, r.top]), [SPl, DPl]);
    check(`the two charts share their x axis (same left edge and width, stacked) @${width}`, Math.abs(tops[0][0] - tops[1][0]) < 1 && Math.abs(tops[0][1] - tops[1][1]) < 1 && tops[1][2] > tops[0][2]);
  }
  const diag0 = await page.evaluate((s) => { const l = document.querySelector(`${s} line.diag`); return ["x1", "y1", "x2", "y2"].map((k) => l.getAttribute(k)).join(","); }, SPl);
  await setRange(page, "#sf-de", 0);
  const diag1 = await page.evaluate((s) => { const l = document.querySelector(`${s} line.diag`); return ["x1", "y1", "x2", "y2"].map((k) => l.getAttribute(k)).join(","); }, SPl);
  check(`the line along the top of the two areas doesn't move with the ratio @${width}`, diag0 === diag1);
  check(`with no loan, nothing is owed and nothing falls short @${width}`, (await R("sf-r-f")) === "$0.00" && (await R("sf-r-p")) === "0.0%" && (await has(`${DPl} path.dens-below`)) === 0 && (await R("sf-r-v")) === "$100.00");
  await setRange(page, "#sf-de", 4);
  check(`at a ratio of 4 the two claims still add to $100.00 @${width}`, (await R("sf-r-v")) === "$100.00" && (await R("sf-r-p")) === "20.9%");
  await setRange(page, "#sf-de", 3);

  // ---- the yield is a promise
  const YP = "#fig-yield svg.yield-panel";
  check(`the yield chart opens at a ratio of 3 and 25%: 5.2% promised, 3.7% expected, 9.15% against 8.00% @${width}`,
    (await R("yc-r-y")) === "5.2%" && (await R("yc-r-d")) === "3.7%" && (await R("yc-r-wy")) === "9.15%" && (await R("yc-r-w")) === "8.00%");
  {
    const d = await dotOn(YP, "circle.pt-y", "path.with-yield");
    check(`the pink dot is on the pink curve at 9.15% @${width}`, Math.abs(d.y - 9.15) < 0.05 && d.off < 0.6, JSON.stringify(d));
    const poly = await pts(`${YP} path.with-yield`);
    check(`the pink curve only rises @${width}`, poly.every((p, i) => i === 0 || p[1] <= poly[i - 1][1] + 0.01));
  }
  await clickSeg("yc-s", "0.4");
  check(`at 40% volatility the error is bigger: 14.30% @${width}`, (await R("yc-r-wy")) === "14.30%" && (await on("yc-s", "0.4")) === "true");
  await setRange(page, "#yc-de", 4);
  check(`at 40% and a ratio of 4 the dot leaves the chart and is hidden, with no broken geometry @${width}`, (await has(`${YP} circle.pt-y`)) === 0 && (await geom()).length === 0);
  await clickSeg("yc-s", "0.25");
  await setRange(page, "#yc-de", 3);

  // ---- taxes
  const TP = "#fig-tax svg.tax-panel";
  check(`at 22% a $50 loan adds $11.00 permanent and $4.13 kept at a fixed share @${width}`, (await R("tf-r-perm")) === "$11.00" && (await R("tf-r-reb")) === "$4.13");
  {
    const sc = await scales(TP), Y = lin(sc.ys);
    const a = Y.val(await nattr(`${TP} circle.pt-perm`, "cy")), b = Y.val(await nattr(`${TP} circle.pt-reb`, "cy"));
    check(`the dots sit at $111 and $104.13 @${width}`, Math.abs(a - 111) < 0.05 && Math.abs(b - 104.125) < 0.05);
  }
  await setRange(page, "#tf-tax", 0.4);
  await setRange(page, "#tf-d", 60);
  check(`the far corner (40%, $60) reads $24.00 and $9.00, inside the chart @${width}`, (await R("tf-r-perm")) === "$24.00" && (await R("tf-r-reb")) === "$9.00" && (await geom()).length === 0);
  await setRange(page, "#tf-tax", 0.22);
  await setRange(page, "#tf-d", 50);

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
