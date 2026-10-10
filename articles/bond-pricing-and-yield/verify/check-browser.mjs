/*
  Browser checks for bond-pricing-and-yield at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8797 SHOTS=/tmp/bond-pricing-and-yield-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back through their axes.
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

  // ------------------------------------------- bond-pricing-and-yield checks
  const logAxis = (t) => { const a = t[0], b = t[t.length - 1]; const k = (b.p - a.p) / (Math.log10(b.v) - Math.log10(a.v)); return { px: (v) => a.p + (Math.log10(v) - Math.log10(a.v)) * k, val: (p) => Math.pow(10, Math.log10(a.v) + (p - a.p) / k) }; };
  const rects = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((r) => ({ x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"), h: +r.getAttribute("height"), cls: r.getAttribute("class") })), sel);

  // ---- one rate for every payment
  const PP = ".price-panel";
  check(`at 4%: $108.11, above par @${width}`, (await R("pf-price")) === "$108.11" && (await R("pf-kind")) === "above par");
  {
    const Y = lin((await scales(PP)).ys);
    const sum = (await rects(`${PP} rect.pv`)).reduce((s, r) => s + (Y.val(r.y + r.h) - Y.val(r.y)) * -1, 0);
    check(`the blue bars add up to the price @${width}`, Math.abs(sum - 108.11) < 0.6, sum.toFixed(2));
    const last = (await rects(`${PP} rect.cf.t10`))[0];
    check(`the last payment's outline reads $105 @${width}`, Math.abs(Y.val(last.y) - 105) < 0.6);
  }
  await setRange(page, "#pf-y", 0.05);
  check(`at 5%: $100.00, at par @${width}`, (await R("pf-price")) === "$100.00" && (await R("pf-kind")) === "at par");
  await setRange(page, "#pf-y", 0.06);
  check(`at 6%: $92.64, below par @${width}`, (await R("pf-price")) === "$92.64" && (await R("pf-kind")) === "below par");
  await setRange(page, "#pf-y", 0.04);

  // ---- the guess card
  await click('#guess button[data-g="8"]');
  check(`a wrong guess is told about 6%, 5.84% @${width}`, /^It's about 6%\. We earn 5\.84% a year/.test((await txt("#guess-answer")).replace(/\s+/g, " ")));
  await click('#guess button[data-g="6"]');
  check(`the right one is confirmed @${width}`, (await txt("#guess-answer")).startsWith("That's right, about 6%."));

  // ---- three bonds at the same yield
  const UP = ".pull-panel", SP = ".split-panel";
  check(`the 8% bond: $132.44, 6.04%, 4.00% @${width}`, (await R("pu-price")) === "$132.44" && (await R("pu-cy")) === "6.04%" && (await R("pu-ret")) === "4.00%");
  {
    const sc = await scales(UP), X = lin(sc.xs), Y = lin(sc.ys);
    const p8 = await pts(`${UP} path.price.c8`), p0 = await pts(`${UP} path.price.c0`);
    check(`the 8% line runs from $132.44 to $100, the zero's from $67.56 @${width}`, Math.abs(Y.val(p8[0][1]) - 132.44) < 0.4 && Math.abs(Y.val(p8[p8.length - 1][1]) - 100) < 0.4 && Math.abs(Y.val(p0[0][1]) - 67.56) < 0.4 && Math.abs(Y.val(p0[p0.length - 1][1]) - 100) < 0.4);
    const Y2 = lin((await scales(SP)).ys);
    const inc = await rects(`${SP} rect.inc`), chg = await rects(`${SP} rect.chg`);
    const tot = inc.map((r, i) => { const top = Y2.val(r.y), c = chg[i]; const v = c.cls.includes("neg") ? Y2.val(c.y + c.h) : Y2.val(c.y) - top; return c.cls.includes("neg") ? top + v : Y2.val(c.y); });
    check(`every year's coupon and price change meet at 4% @${width}`, tot.every((v) => Math.abs(v - 4) < 0.1), tot.map((v) => v.toFixed(2)).join(" "));
  }
  await clickSeg("pu-c", "0");
  check(`the zero: $67.56, 0.00%, 4.00% @${width}`, (await R("pu-price")) === "$67.56" && (await R("pu-cy")) === "0.00%" && (await R("pu-ret")) === "4.00%");
  {
    const Y2 = lin((await scales(SP)).ys);
    const chg = await rects(`${SP} rect.chg`);
    check(`and all its return is price: the pink bars reach 4% @${width}`, chg.every((c) => Math.abs(Y2.val(c.y) - 4) < 0.1));
  }
  await clickSeg("pu-c", "0.08");

  // ---- holding to maturity
  const WP = ".worth-panel", BP = ".parts-panel";
  check(`the starting lab: 5.84%, 12.2 years, 41% @${width}`, (await R("rl-real")) === "5.84%" && (await R("rl-d")) === "12.2 years" && (await R("rl-share")) === "41%");
  {
    const sc = await scales(WP), X = lin(sc.xs), Y = logAxis(sc.ys.map((t) => ({ v: t.v, p: t.p })));
    const pr = await pts(`${WP} path.promised`), ac = await pts(`${WP} path.actual`);
    check(`the promise starts at $100 and ends at $1,006 @${width}`, Math.abs(Y.val(pr[0][1]) / 100 - 1) < 0.01 && Math.abs(Y.val(pr[pr.length - 1][1]) / 1006.27 - 1) < 0.01);
    check(`the blue line jumps to $169.17 and ends at $549 @${width}`, Math.abs(Y.val(ac[0][1]) / 169.17 - 1) < 0.01 && Math.abs(Y.val(ac[ac.length - 1][1]) / 548.68 - 1) < 0.01);
    check(`the circle sits where they cross, at about 14 years @${width}`, Math.abs(X.val(await nattr(`${WP} circle.cross`, "cx")) - 13.93) < 0.15 && Math.abs(yAt(pr, await nattr(`${WP} circle.cross`, "cx")) - (await nattr(`${WP} circle.cross`, "cy"))) < 0.8);
    const labels = await page.evaluate((sel) => [...document.querySelectorAll(`${sel} .row-label`)].map((t) => t.textContent), BP);
    check(`the bars say $1,006 and $549 @${width}`, labels[0].endsWith("$1,006") && labels[1].endsWith("$549"), labels.join(" | "));
  }
  await setRange(page, "#rl-t", 10);
  {
    const parts = await rects(`${BP} rect.part.promised`);
    const total = parts.reduce((s, r) => s + r.w, 0), interest = parts.find((r) => r.cls.includes("interest")).w;
    check(`at 10 years, interest on coupons is a sixth of the promised money @${width}`, Math.abs(interest / total - 1 / 6) < 0.01, (interest / total).toFixed(3));
  }
  await setRange(page, "#rl-t", 30);
  await setRange(page, "#rl-r", 0.12);
  check(`a rise to 12%: 10.56%, and $2,031 at the end @${width}`, (await R("rl-real")) === "10.56%" && (await page.locator(`${BP} .row-label`).nth(1).textContent()).includes("$2,031"));
  await setRange(page, "#rl-c", 0);
  check(`no coupon: 8.00% and no crossing before the end @${width}`, (await R("rl-real")) === "8.00%" && (await has(`${WP} circle.cross`)) === 0);
  await setRange(page, "#rl-c", 0.08);
  await setRange(page, "#rl-r", 0.04);

  // ---- the rule
  const RP = ".rule-panel";
  check(`the 30-year bond: 12.2 years, 41%, 5.84% @${width}`, (await R("rf-d")) === "12.2 years" && (await R("rf-share")) === "41%" && (await R("rf-4")) === "5.84%");
  {
    const sc = await scales(RP), X = lin(sc.xs), Y = lin(sc.ys);
    const cur = await pts(`${RP} path.earned`), rule = await pts(`${RP} path.rule`);
    check(`the rule touches the curve at 8% @${width}`, Math.abs(yAt(cur, X.px(8)) - yAt(rule, X.px(8))) < 0.3);
    check(`and the curve is never below it @${width}`, cur.every(([x, y]) => y <= yAt(rule, x) + 0.3));
    check(`the dot reads 5.84% at 4% @${width}`, Math.abs(X.val(await nattr(`${RP} circle.at4`, "cx")) - 4) < 0.05 && Math.abs(Y.val(await nattr(`${RP} circle.at4`, "cy")) - 5.84) < 0.05);
  }
  await clickSeg("rf-bond", "zero30");
  {
    const cur = await pts(`${RP} path.earned`);
    const Y = lin((await scales(RP)).ys);
    check(`a zero's curve is flat at 8% @${width}`, cur.every(([, y]) => Math.abs(Y.val(y) - 8) < 0.02));
  }
  await clickSeg("rf-bond", "c10");
  check(`ten years: 7.2 years, 72%, 6.96% @${width}`, (await R("rf-d")) === "7.2 years" && (await R("rf-share")) === "72%" && (await R("rf-4")) === "6.96%");
  await clickSeg("rf-bond", "c100");
  check(`a hundred years: 13.5 years, 4.71% @${width}`, (await R("rf-d")) === "13.5 years" && (await R("rf-4")) === "4.71%");
  await clickSeg("rf-bond", "c30");

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
