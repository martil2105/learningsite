/*
  Browser checks for var-backtesting at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8794 SHOTS=/tmp/var-backtesting-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, curves and dots back through their axes.
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

  // --------------------------------------------------- var-backtesting checks
  const logAxis = (t) => { const a = t[0], b = t[t.length - 1]; const k = (b.p - a.p) / (Math.log10(b.v) - Math.log10(a.v)); return { px: (v) => a.p + (Math.log10(v) - Math.log10(a.v)) * k, val: (p) => Math.pow(10, Math.log10(a.v) + (p - a.p) / k) }; };
  const barTop = async (svg, sel) => { const Y = lin((await scales(svg)).ys); return Y.val(await nattr(`${svg} ${sel}`, "y")); };

  // ---- the guess card
  await click('#guess button[data-g="5"]');
  check(`a wrong guess is told almost half, with both shares @${width}`, /^It's almost half\. The model is green in 43\.9% of years\. A right model is green in 89\.2%\.$/.test((await txt("#guess-answer")).replace(/\s+/g, " ")), await txt("#guess-answer"));
  await click('#guess button[data-g="half"]');
  check(`the right one is confirmed @${width}`, (await txt("#guess-answer")).startsWith("That's right, almost half."));

  // ---- the count lab
  const ZP = ".zone-panel";
  check(`a right model: 89.2 / 10.8 / 0.03%, multiplier 3.05, capital 100% @${width}`, (await R("zl-green")) === "89.2%" && (await R("zl-yellow")) === "10.8%" && (await R("zl-red")) === "0.03%" && (await R("zl-mult")) === "3.05" && (await R("zl-cap")) === "100%", [await R("zl-green"), await R("zl-yellow"), await R("zl-red"), await R("zl-mult"), await R("zl-cap")].join(" "));
  {
    const t2 = await barTop(ZP, "rect.bar.k2"), c2 = await barTop(ZP, "line.cap.k2").catch(() => NaN);
    const Y = lin((await scales(ZP)).ys);
    check(`the bar for two exceptions reads 25.7% and its grey cap sits on it @${width}`, Math.abs(t2 - 25.74) < 0.3 && Math.abs(Y.val(await nattr(`${ZP} line.cap.k2`, "y1")) - 25.74) < 0.3, `${t2.toFixed(2)}`);
    const bx = async (k) => (await nattr(`${ZP} rect.bar.k${k}`, "x")) + (await nattr(`${ZP} rect.bar.k${k}`, "width")) / 2;
    const gx = await nattr(`${ZP} rect.band.green`, "x"), gw = await nattr(`${ZP} rect.band.green`, "width");
    const rx = await nattr(`${ZP} rect.band.red`, "x");
    check(`the green band covers 0 to 4 and the red band starts at 10 @${width}`, (await bx(4)) < gx + gw && (await bx(5)) > gx + gw && (await bx(10)) > rx && (await bx(9)) < rx);
  }
  await click('button[data-p="0.02"]');
  check(`twice too many: 43.9 / 53.1 / 3.0%, multiplier 3.32, capital 85% @${width}`, (await R("zl-green")) === "43.9%" && (await R("zl-yellow")) === "53.1%" && (await R("zl-red")) === "3.0%" && (await R("zl-mult")) === "3.32" && (await R("zl-cap")) === "85%", [await R("zl-green"), await R("zl-yellow"), await R("zl-red"), await R("zl-mult"), await R("zl-cap")].join(" "));
  check(`the bars moved right: five exceptions is now the tallest bar @${width}`, (await barTop(ZP, "rect.bar.k5")) > (await barTop(ZP, "rect.bar.k2")));
  await setRange(page, "#zl-p", 0.04);
  check(`at 4% the capital is 71% of a right model's @${width}`, (await R("zl-cap")) === "71%", await R("zl-cap"));
  await click('button[data-p="0.01"]');

  // ---- how many days
  const DP = ".days-panel";
  check(`2%: 1,015 days, 4.1 years, 38% in one year @${width}`, (await R("df-days")) === "1,015" && (await R("df-years")) === "4.1" && (await R("df-one")) === "38%", [await R("df-days"), await R("df-years"), await R("df-one")].join(" "));
  {
    const sc = await scales(DP), X = logAxis(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${DP} circle.caught`, "cx"), cy = await nattr(`${DP} circle.caught`, "cy");
    check(`the dot sits at 1,015 days on the 80% line @${width}`, Math.abs(X.val(cx) / 1015 - 1) < 0.01 && Math.abs(Y.val(cy) - 80) < 0.3, `${X.val(cx).toFixed(0)} ${Y.val(cy).toFixed(1)}`);
    const pts20 = await pts(`${DP} path.power.r20`);
    const after = pts20.filter(([x]) => x >= cx - 0.01), before = pts20.filter(([x]) => x < cx - 0.01);
    check(`the 2% curve stays above the line from the dot on, and was under it just before @${width}`, after.every(([, y]) => Y.val(y) >= 79.9) && Y.val(before[before.length - 1][1]) < 80);
    check(`the grey line marks one year @${width}`, Math.abs(X.val(await nattr(`${DP} line.one-year`, "x1")) - 250) < 2);
  }
  await clickSeg("df-rate", "0.015");
  check(`1.5%: 3,295 days, about 13 years @${width}`, (await R("df-days")) === "3,295" && (await R("df-years")) === "13.2");
  await clickSeg("df-rate", "0.03");
  check(`3%: 340 days @${width}`, (await R("df-days")) === "340");
  await clickSeg("df-rate", "0.02");

  // ---- four models on the US market
  const BP = ".blocks-panel", DY = ".days-of-block";
  check(`the century model: 260 exceptions, 1.00%; 86, 10, 8; 49 with none; the newest block has none @${width}`, (await R("cl-rate")) === "260, 1.00%" && (await R("cl-zones")) === "86, 10, 8" && (await R("cl-none")) === "49" && (await R("cl-this")) === "0, green", [await R("cl-rate"), await R("cl-zones"), await R("cl-none"), await R("cl-this")].join(" | "));
  check(`8 red bars and 10 yellow ones are drawn @${width}`, (await has(`${BP} rect.blk.red`)) === 8 && (await has(`${BP} rect.blk.yellow`)) === 10);
  {
    const Y = lin((await scales(BP)).ys);
    const tops = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((r) => +r.getAttribute("y")), `${BP} rect.blk`);
    check(`the tallest bar reads 24 @${width}`, Math.abs(Y.val(Math.min(...tops)) - 24) < 0.2);
  }
  const dotsBelow = async () => page.evaluate((sel) => {
    const svg = document.querySelector(sel);
    const d = svg.querySelector("path.var-line").getAttribute("d");
    const n = d.match(/-?\d+(\.\d+)?/g).map(Number); const P = []; for (let i = 0; i + 1 < n.length; i += 2) P.push([n[i], n[i + 1]]);
    const lineY = (x) => { for (let i = P.length - 1; i >= 0; i--) if (P[i][0] <= x + 0.005) return P[i][1]; return P[0][1]; };
    let bad = 0, ex = 0;
    for (const c of svg.querySelectorAll("circle.day")) {
      const x = +c.getAttribute("cx"), y = +c.getAttribute("cy"), isEx = c.classList.contains("ex");
      if (isEx) ex++;
      if (isEx !== y > lineY(x) + 0.01) bad++;
    }
    return { bad, ex, all: svg.querySelectorAll("circle.day").length };
  }, DY);
  await click('button[data-b="2008–09"]');
  {
    const r = await dotsBelow();
    check(`2008–09: 22 exceptions, red, and every pink dot is under the line and no grey one @${width}`, (await R("cl-this")) === "22, red" && r.ex === 22 && r.bad === 0 && r.all === 250, JSON.stringify(r));
  }
  await clickSeg("cl-model", "history");
  {
    const r = await dotsBelow();
    check(`historical simulation: 379, 1.46%; 71, 30, 3; 6 with none @${width}`, (await R("cl-rate")) === "379, 1.46%" && (await R("cl-zones")) === "71, 30, 3" && (await R("cl-none")) === "6", [await R("cl-rate"), await R("cl-zones")].join(" | "));
    check(`its line moves, and its dots agree with it too @${width}`, r.bad === 0 && (await page.locator(`${DY} path.var-line`).getAttribute("d")).split("L").map((s) => s.split(",")[1]).filter((v, i, a) => a.indexOf(v) === i).length > 1);
  }
  await click('button[data-b="1986–87"]');
  check(`the 1987 crash falls outside the chart and is drawn at its edge @${width}`, (await has("#cl-off")) === 1 && (await dotsBelow()).bad === 0);
  await clickSeg("cl-model", "riskmetrics");
  check(`RiskMetrics: 555, 2.13%, red in 9 @${width}`, (await R("cl-rate")) === "555, 2.13%" && (await R("cl-zones")).endsWith(", 9"));
  await clickSeg("cl-model", "filtered");
  check(`filtered: 279, 1.07%; no red, 15 yellow @${width}`, (await R("cl-rate")) === "279, 1.07%" && (await R("cl-zones")) === "89, 15, 0");
  await setRange(page, "#cl-block", 0);
  check(`the first block starts on 23 Jul 1927 @${width}`, (await txt("#cl-days-title")).includes("23 Jul 1927"));
  {
    // click the bar of block 60
    const box = await page.locator(`${BP}`).boundingBox();
    const sc = (await page.locator(BP).evaluate((s) => s.getBoundingClientRect().width)) / width;
    const m = { left: 40, right: 44 }, svgW = await nattr(BP, "width");
    const bw = (svgW - m.left - m.right) / 104;
    await page.mouse.click(box.x + (m.left + 60.5 * bw) * (box.width / svgW), box.y + box.height - 60);
    await settle(page);
    check(`clicking a bar picks its block @${width}`, (await val("#cl-block")) === "60", await val("#cl-block"));
  }
  await clickSeg("cl-model", "century");
  await click('button[data-b="Latest"]');

  // ---- the shuffle
  const SP = ".strips", HP = ".hist-panel";
  check(`as they happened: 8 red, 49 with none, 9.6% the day after, 10.4× @${width}`, (await R("sf-red")) === "8" && (await R("sf-none")) === "49" && (await R("sf-after")) === "9.6%" && (await R("sf-factor")) === "10.4×", [await R("sf-red"), await R("sf-none"), await R("sf-after"), await R("sf-factor")].join(" "));
  const ticks = (cls) => page.evaluate((sel) => (document.querySelector(sel).getAttribute("d").match(/M/g) || []).length, `${SP} path.strip.${cls}`);
  check(`both strips hold 260 ticks @${width}`, (await ticks("real")) === 260 && (await ticks("mixed")) === 260);
  const histSum = async () => { const Y = lin((await scales(HP)).ys); const ys = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((r) => [+r.getAttribute("y"), +r.getAttribute("height")]), `${HP} rect.hbar`); return ys.reduce((s, [y, h]) => s + (Y.val(y + h) - Y.val(y)) * -1, 0); };
  check(`the bars count all 104 blocks @${width}`, Math.abs((await histSum()) - 104) < 0.5, (await histSum()).toFixed(2));
  await clickSeg("sf-order", "mixed");
  check(`shuffled: no red, 8 with none, 1.2% the day after, 0.9× @${width}`, (await R("sf-red")) === "0" && (await R("sf-none")) === "8" && (await R("sf-after")) === "1.2%" && (await R("sf-factor")) === "0.9×", [await R("sf-red"), await R("sf-none"), await R("sf-after"), await R("sf-factor")].join(" "));
  check(`and still 104 blocks @${width}`, Math.abs((await histSum()) - 104) < 0.5);
  await click("#sf-again");
  check(`another shuffle is still never red @${width}`, (await R("sf-red")) === "0" && (await on("sf-order", "mixed")) === "true");
  await clickSeg("sf-model", "history");
  await clickSeg("sf-order", "real");
  check(`historical simulation as it happened: 3 red @${width}`, (await R("sf-red")) === "3");
  await clickSeg("sf-model", "century");

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
