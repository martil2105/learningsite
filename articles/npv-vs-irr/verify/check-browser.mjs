/*
  Browser checks for npv-vs-irr at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8793 SHOTS=/tmp/npv-vs-irr-shots node verify/check-browser.mjs

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

  // the guess card
  await click('#guess button[data-g="slow"]');
  check(`the guess card says right for Slow @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await click('#guess button[data-g="quick"]');
  check(`and corrects Quick @${width}`, (await txt("#guess-answer")).startsWith("Slow."));

  const dotOn = async (svg, dotSel, lineSel) => {
    const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${svg} ${dotSel}`, "cx"), cy = await nattr(`${svg} ${dotSel}`, "cy");
    const poly = await pts(`${svg} ${lineSel}`);
    return { x: X.val(cx), y: Y.val(cy), off: Math.abs(yAt(poly, cx) - cy) };
  };
  const money = async (id) => parseFloat((await R(id)).replace("−", "-").replace("$", ""));
  const area = async (svg, sel) => {
    const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys);
    const x0 = await nattr(`${svg} ${sel}`, "x"), w = await nattr(`${svg} ${sel}`, "width"), y0 = await nattr(`${svg} ${sel}`, "y"), h = await nattr(`${svg} ${sel}`, "height");
    const width_ = X.val(x0 + w) - X.val(x0);
    const top = Y.val(y0), bottom = Y.val(y0 + h);
    const height_ = Math.abs(top) > Math.abs(bottom) ? top : bottom;
    return { w: width_, h: height_, a: (width_ * height_) / 100 };
  };

  // ---- the lab
  const PP = "#fig-rate svg.profile-panel", BP = "#fig-rate svg.rect-panel";
  check(`the lab opens at 10%: Quick $36.36 at 50.0%, Slow $86.28 at 24.6%, 90.9 and 592.0 dollar-years, crossing at 18.9% @${width}`,
    (await R("rl-r-npva")) === "$36.36" && (await R("rl-r-npvb")) === "$86.28" && (await R("rl-r-irra")) === "50.0%" && (await R("rl-r-irrb")) === "24.6%" &&
    (await R("rl-r-capa")) === "90.9" && (await R("rl-r-capb")) === "592.0" && (await R("rl-r-mara")) === "+40.0 pts" && (await R("rl-r-marb")) === "+14.6 pts" && (await R("rl-r-cross")) === "18.9%");
  {
    const a = await area(BP, "rect.box.a"), b = await area(BP, "rect.box.b");
    check(`each rectangle's drawn area is its NPV @${width}`, Math.abs(a.a - 36.36) < 0.6 && Math.abs(b.a - 86.28) < 1.2, `${a.a.toFixed(2)} ${b.a.toFixed(2)}`);
    const sc = await scales(PP), X = lin(sc.xs), Y = lin(sc.ys);
    const ia = X.val(await nattr(`${PP} circle.irr.a`, "cx")), ib = X.val(await nattr(`${PP} circle.irr.b`, "cx"));
    check(`the IRR dots sit at 50% and 24.6% on the zero line @${width}`, Math.abs(ia - 50) < 0.1 && Math.abs(ib - 24.57) < 0.1 && Math.abs(Y.val(await nattr(`${PP} circle.irr.a`, "cy"))) < 0.5);
    const ca = await dotOn(PP, "circle.cross", "path.prof.a"), cb = await dotOn(PP, "circle.cross", "path.prof.b");
    check(`the crossover dot is on both curves at 18.9% @${width}`, Math.abs(ca.x - 18.92) < 0.1 && ca.off < 0.8 && cb.off < 0.8, JSON.stringify([ca, cb]));
    const da = await dotOn(PP, "circle.at.a", "path.prof.a"), db = await dotOn(PP, "circle.at.b", "path.prof.b");
    check(`the dots at 10% are on their curves @${width}`, da.off < 0.8 && db.off < 0.8 && Math.abs(da.y - 36.36) < 0.6 && Math.abs(db.y - 86.28) < 0.6);
  }
  await setRange(page, "#rl-r", 0.19);
  check(`just past the crossover Quick's NPV is higher @${width}`, (await money("rl-r-npva")) > (await money("rl-r-npvb")) && Math.abs((await money("rl-r-npva")) - (await money("rl-r-npvb"))) < 0.5);
  await setRange(page, "#rl-r", 0.3);
  {
    const b = await area(BP, "rect.box.b");
    const zeroY = await nattr(`${BP} line.zero`, "y1");
    check(`at 30% Slow's rectangle hangs below zero and its area is its negative NPV @${width}`, (await nattr(`${BP} rect.box.b`, "y")) === zeroY && b.h < 0 && Math.abs(b.a - (await money("rl-r-npvb"))) < 0.8, `${b.a.toFixed(2)} vs ${await R("rl-r-npvb")}`);
  }
  await setRange(page, "#rl-r", 0.1);
  await clickSeg("rl-pair", "scale");
  check(`the second pair at 10%: Small $36.36, Large $181.82, margins +40.0 and +20.0, crossing at 27.8% @${width}`,
    (await R("rl-r-npva")) === "$36.36" && (await R("rl-r-npvb")) === "$181.82" && (await R("rl-r-mara")) === "+40.0 pts" && (await R("rl-r-marb")) === "+20.0 pts" &&
    (await R("rl-r-cross")) === "27.8%" && (await R("rl-r-capa")) === "90.9" && (await R("rl-r-capb")) === "909.1");
  {
    const a = await area(BP, "rect.box.a"), b = await area(BP, "rect.box.b");
    check(`and the rectangles' areas are the NPVs again @${width}`, Math.abs(a.a - 36.36) < 0.8 && Math.abs(b.a - 181.82) < 2, `${a.a.toFixed(2)} ${b.a.toFixed(2)}`);
  }
  for (const r of [0, 0.4]) {
    await setRange(page, "#rl-r", r);
    const g2 = await geom();
    check(`the lab draws cleanly at ${r * 100}% @${width}`, g2.length === 0);
  }
  await clickSeg("rl-pair", "timing");
  await setRange(page, "#rl-r", 0.1);

  // ---- reinvestment
  const RIP = "#fig-reinvest svg.reinvest-panel";
  check(`at 10% Quick's $150 grows to $219.62 @${width}`, (await R("rf-r-q")) === "$219.62" && (await R("rf-r-even")) === "18.9%");
  await setRange(page, "#rf-r", 0.19);
  {
    const hq = await nattr(`${RIP} rect.bar.quick`, "height"), hs = await nattr(`${RIP} rect.bar.slow`, "height");
    check(`at 19% the two bars are the same height to within 1% @${width}`, Math.abs(hq / hs - 1) < 0.01, `${hq.toFixed(1)} ${hs.toFixed(1)}`);
  }
  await setRange(page, "#rf-r", 0.3);
  check(`at 30% the bar stays inside the chart @${width}`, (await nattr(`${RIP} rect.bar.quick`, "y")) > 0 && (await R("rf-r-q")) === "$" + (150 * 1.3 ** 4).toFixed(2));
  await setRange(page, "#rf-r", 0.1);

  // ---- the mine
  const MP = "#fig-mine svg.mine-panel";
  check(`the mine at 10% loses $23.97; at 20%: −239.67 × +10 pts; at 300%: −8.26 × +290 pts; both −$23.97 @${width}`,
    (await R("mf-r-npv")) === "−$23.97" && (await R("mf-r-cap0")) === "−239.67" && (await R("mf-r-mar0")) === "+10 pts" && (await R("mf-r-pro0")) === "−$23.97" &&
    (await R("mf-r-cap1")) === "−8.26" && (await R("mf-r-mar1")) === "+290 pts" && (await R("mf-r-pro1")) === "−$23.97");
  {
    const sc = await scales(MP), X = lin(sc.xs), Y = lin(sc.ys);
    const k0 = X.val(await nattr(`${MP} circle.irr.k0`, "cx")), k1 = X.val(await nattr(`${MP} circle.irr.k1`, "cx"));
    check(`the two IRR dots are at 20% and 300% on the zero line @${width}`, Math.abs(k0 - 20) < 0.3 && Math.abs(k1 - 300) < 0.3 && Math.abs(Y.val(await nattr(`${MP} circle.irr.k1`, "cy"))) < 0.5);
    const d = await dotOn(MP, "circle.at", "path.prof.mine");
    check(`the dot at 10% is on the curve, below zero @${width}`, d.off < 0.8 && Math.abs(d.y + 23.97) < 0.5);
  }
  await setRange(page, "#mf-r", 0.85);
  check(`near its peak (85%) the mine is worth $40.83, and the two products agree @${width}`, (await R("mf-r-npv")) === "$40.83" && (await R("mf-r-pro0")) === "$40.83" && (await R("mf-r-pro1")) === "$40.83");
  await setRange(page, "#mf-r", 3.5);
  check(`at 350% it loses $8.15 @${width}`, (await R("mf-r-npv")) === "−$8.15" && (await geom()).length === 0);
  await setRange(page, "#mf-r", 0.1);

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
