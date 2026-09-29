/*
  Browser checks for dividends-and-buybacks at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/dividends-and-buybacks-shots node verify/check-browser.mjs

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

  // the guess card
  await click('#guess button[data-g="same"]');
  check(`the guess card says right for neither @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await click('#guess button[data-g="buyback"]');
  check(`and says neither for the buyback @${width}`, (await txt("#guess-answer")).startsWith("Neither."));

  // ---- the same $10, paid two ways
  const GP = "#fig-payout svg.gain-panel", EP = "#fig-payout svg.eps-panel";
  check(`the defaults: a fair buyback at $100.00, every share worth $100, EPS $6.30 and $7.00, P/E 14.3, 10.0% bought @${width}`,
    (await R("pl-r-price")) === "$100.00" && (await R("pl-r-stay")) === "$100.00" && (await R("pl-r-sold")) === "$0.00" && (await R("pl-r-div")) === "$100.00" &&
    (await R("pl-r-epsd")) === "$6.30" && (await R("pl-r-epsb")) === "$7.00" && (await R("pl-r-pe")) === "14.3" && (await R("pl-r-q")) === "10.0%");
  const barVals = async (svg) => page.evaluate((svg) => {
    const el = document.querySelector(svg);
    const t = [...el.querySelectorAll(".axis-y text.tick-label")].map((e) => ({ v: parseFloat(e.textContent.replace("−", "-").replace("$", "")), p: +e.getAttribute("y") - 4 }));
    const a = t[0], b = t[t.length - 1], k = (b.p - a.p) / (b.v - a.v), val = (p) => a.v + (p - a.p) / k;
    const zero = [...el.querySelectorAll(".axis-y text.tick-label")].find((e) => /^\$?0$/.test(e.textContent.replace("−", "")));
    const y0 = zero ? +zero.getAttribute("y") - 4 : null;
    return [...el.querySelectorAll("rect.bar")].map((r) => { const y = +r.getAttribute("y"), h = +r.getAttribute("height"); const top = val(y), bottom = val(y + h); return { cls: r.getAttribute("class"), v: Math.abs(top) > Math.abs(bottom) ? top : bottom, h }; });
  }, svg);
  {
    const g = await barVals(GP), e = await barVals(EP);
    check(`at a fair price every gain bar is empty @${width}`, g.length === 3 && g.every((b) => b.h < 0.01));
    check(`the EPS bars read $6.60, $6.30 and $7.00 @${width}`, [6.6, 6.3, 7].every((v, i) => Math.abs(e[i].v - v) < 0.03), e.map((b) => b.v.toFixed(2)).join(" "));
    const tops = await page.evaluate(([a, b]) => [document.querySelector(a).getBoundingClientRect().top, document.querySelector(b).getBoundingClientRect().top], [GP, EP]);
    check(width > 700 ? `the two panels sit side by side @${width}` : `the two panels stack on a phone @${width}`, width > 700 ? Math.abs(tops[0] - tops[1]) < 1 : tops[1] > tops[0] + 100);
  }
  await setRange(page, "#pl-prem", 0.1);
  check(`at 10% over: $110.00, a kept share worth $99.00, a sold share +$10.00, 9.1% bought @${width}`,
    (await R("pl-r-price")) === "$110.00" && (await R("pl-r-stay")) === "$99.00" && (await R("pl-r-sold")) === "+$10.00" && (await R("pl-r-q")) === "9.1%");
  {
    const g = await barVals(GP);
    check(`the bars read $0, −$1.00 and +$10.00 @${width}`, Math.abs(g[0].v) < 0.05 && Math.abs(g[1].v + 1) < 0.1 && Math.abs(g[2].v - 10) < 0.1, g.map((b) => b.v.toFixed(2)).join(" "));
  }
  await setRange(page, "#pl-prem", -0.1);
  check(`at 10% under: a kept share is worth $101.25 and a sold share loses $10.00 @${width}`, (await R("pl-r-stay")) === "$101.25" && (await R("pl-r-sold")) === "−$10.00");
  {
    const g = await barVals(GP);
    check(`and the bars flip: +$1.25 and −$10.00 @${width}`, Math.abs(g[1].v - 1.25) < 0.1 && Math.abs(g[2].v + 10) < 0.1, g.map((b) => b.v.toFixed(2)).join(" "));
  }
  await setRange(page, "#pl-prem", 0);
  await setRange(page, "#pl-d", 20);
  check(`a $20 payout at a fair price: EPS $6.00 and $7.50, still $100 a share @${width}`, (await R("pl-r-epsd")) === "$6.00" && (await R("pl-r-epsb")) === "$7.50" && (await R("pl-r-stay")) === "$100.00" && (await R("pl-r-div")) === "$100.00");
  await setRange(page, "#pl-prem", -0.2);
  {
    const g = await barVals(GP), e = await barVals(EP);
    check(`the extreme corner (a $20 payout at 20% under) stays inside both charts @${width}`, Math.abs(g[2].v + 20) < 0.2 && Math.abs(e[2].v - 8) < 0.05, `${g[2].v.toFixed(2)} ${e[2].v.toFixed(2)}`);
  }
  await setRange(page, "#pl-prem", 0);
  await setRange(page, "#pl-d", 10);

  // ---- where a buyback raises EPS
  const MP = "#fig-map svg.map-panel";
  check(`the map opens on our firm: P/E 15.2, 6.6%, $6.60 to $7.00, +6.1% @${width}`,
    (await R("am-r-pe")) === "15.2" && (await R("am-r-ey")) === "6.6%" && (await R("am-r-eps")) === "$6.60" && (await R("am-r-after")) === "$7.00" && (await R("am-r-change")) === "+6.1%");
  const dotAt = async () => {
    const sc = await scales(MP), X = lin(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${MP} circle.firm`, "cx"), cy = await nattr(`${MP} circle.firm`, "cy");
    const where = await page.evaluate(([MP, cx, cy]) => {
      const a = document.querySelector(`${MP} path.accretive`), d = document.querySelector(`${MP} path.dilutive`);
      const pt = new DOMPoint(cx, cy);
      return { green: a.isPointInFill(pt), pink: d.isPointInFill(pt) };
    }, [MP, cx, cy]);
    return { pe: X.val(cx), r: Y.val(cy), ...where };
  };
  {
    const d = await dotAt();
    check(`the dot sits at P/E 15.2 and 3%, inside the green region @${width}`, Math.abs(d.pe - 15.15) < 0.1 && Math.abs(d.r - 3) < 0.05 && d.green && !d.pink, JSON.stringify(d));
    const v = await readAt(MP, `${MP} path.edge`, 20);
    check(`the curve reads 5% at a P/E of 20 @${width}`, Math.abs(v - 5) < 0.05, v.toFixed(3));
  }
  await setRange(page, "#am-r", 0.08);
  {
    const d = await dotAt();
    check(`at 8% the buyback lowers EPS, and the dot is in the pink region @${width}`, (await R("am-r-change")) === "−0.6%" && d.pink && !d.green, JSON.stringify(d));
  }
  await setRange(page, "#am-r", 0.075);
  check(`at 7.5% EPS doesn't move @${width}`, (await R("am-r-change")) === "0.0%" && (await R("am-r-pe")) === "13.3");
  await setRange(page, "#am-e", 10);
  await setRange(page, "#am-r", 0.005);
  {
    const d = await dotAt();
    check(`a strong business with cash earning 0.5%: well inside the green @${width}`, d.green && d.pe > 5 && d.pe < 40);
  }
  await setRange(page, "#am-e", 2.5);
  await setRange(page, "#am-r", 0.08);
  {
    const d = await dotAt();
    check(`a weak business with cash earning 8%: in the pink, inside the map @${width}`, d.pink && d.pe < 40, JSON.stringify(d));
  }
  await setRange(page, "#am-e", 6);
  await setRange(page, "#am-r", 0.03);

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
