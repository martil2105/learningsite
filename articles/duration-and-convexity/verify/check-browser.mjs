/*
  Browser checks for duration-and-convexity at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8798 SHOTS=/tmp/duration-and-convexity-shots node verify/check-browser.mjs

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

  // -------------------------------------------- duration-and-convexity checks
  const rects = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((r) => ({ x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"), h: +r.getAttribute("height") })), sel);
  const firstX = (sel) => page.evaluate((sel) => +document.querySelector(sel).getAttribute("d").match(/-?\d+(\.\d+)?/)[0], sel);

  // ---- the guess card
  await click('#guess button[data-g="fall"]');
  check(`a wrong guess is told both, +6.91% and +5.47% @${width}`, /^Both of them\. A fall to 4% leaves us \+6\.91% against the promise, and a rise to 12% leaves us \+5\.47%\.$/.test((await txt("#guess-answer")).replace(/\s+/g, " ")), await txt("#guess-answer"));
  await click('#guess button[data-g="both"]');
  check(`the right one is confirmed @${width}`, (await txt("#guess-answer")).startsWith("That's right, both of them."));

  // ---- the seesaw
  const SS = ".seesaw-panel";
  const torque = async () => { const fx = await firstX(`${SS} path.fulcrum`); const bars = await rects(`${SS} rect.pv`); const t = bars.reduce((s, b) => s + (b.x + b.w / 2 - fx) * b.h, 0), m = bars.reduce((s, b) => s + b.h, 0) * width; return t / m; };
  check(`the beam balances at 12.2 years, price $100.00, last payment 11% @${width}`, (await R("ss-d")) === "12.2 years" && (await R("ss-p")) === "$100.00" && (await R("ss-last")) === "11%");
  {
    const X = lin((await scales(SS)).xs);
    check(`the triangle sits at 12.16 years @${width}`, Math.abs(X.val(await firstX(`${SS} path.fulcrum`)) - 12.158) < 0.05);
    check(`and the bars' turning forces about it cancel @${width}`, Math.abs(await torque()) < 1e-4, (await torque()).toExponential(2));
  }
  await setRange(page, "#ss-c", 0);
  check(`no coupon: it balances at the maturity @${width}`, (await R("ss-d")) === "30.0 years" && Math.abs(await torque()) < 1e-4);
  await setRange(page, "#ss-c", 0.08);
  await setRange(page, "#ss-t", 10);
  check(`ten years: 7.2 years, still balanced @${width}`, (await R("ss-d")) === "7.2 years" && Math.abs(await torque()) < 1e-4);
  await setRange(page, "#ss-t", 30);

  // ---- the price curve
  const PC = ".curve-panel";
  check(`four points down: +69.17%, +45.03%, +62.03% @${width}`, (await R("pc-exact")) === "+69.17%" && (await R("pc-dur")) === "+45.03%" && (await R("pc-conv")) === "+62.03%", [await R("pc-exact"), await R("pc-dur"), await R("pc-conv")].join(" "));
  {
    const cur = await pts(`${PC} path.price`), tan = await pts(`${PC} path.tangent`);
    const cx = await nattr(`${PC} circle.on-curve`, "cx");
    check(`the blue dot is on the price curve and the grey dot on the line @${width}`, Math.abs(yAt(cur, cx) - (await nattr(`${PC} circle.on-curve`, "cy"))) < 0.5 && Math.abs(yAt(tan, cx) - (await nattr(`${PC} circle.on-tangent`, "cy"))) < 0.5);
    check(`the curve never dips below the line @${width}`, cur.every(([x, y]) => y <= yAt(tan, x) + 0.3));
    const Y = lin((await scales(PC)).ys);
    check(`the dots read $169.17 and $145.03 @${width}`, Math.abs(Y.val(await nattr(`${PC} circle.on-curve`, "cy")) - 169.17) < 0.6 && Math.abs(Y.val(await nattr(`${PC} circle.on-tangent`, "cy")) - 145.03) < 0.6);
  }
  await setRange(page, "#pc-dy", -0.01);
  check(`one point down: +12.41%, +11.26%, +12.32% @${width}`, (await R("pc-exact")) === "+12.41%" && (await R("pc-dur")) === "+11.26%" && (await R("pc-conv")) === "+12.32%");
  await setRange(page, "#pc-dy", 0.04);
  check(`four points up: −32.22% against −45.03% @${width}`, (await R("pc-exact")) === "−32.22%" && (await R("pc-dur")) === "−45.03%");
  await setRange(page, "#pc-dy", -0.04);

  // ---- the horizon lab
  const HP = ".horizon-panel";
  check(`five years: +40.08%, −18.70% @${width}`, (await R("hl-4")) === "+40.08%" && (await R("hl-12")) === "−18.70%" && (await R("hl-worst")) === "−18.70%");
  await click("#hl-d");
  check(`at the average wait: +6.91%, +5.47%, worst 0.00% @${width}`, (await R("hl-4")) === "+6.91%" && (await R("hl-12")) === "+5.47%" && (await R("hl-worst")) === "0.00%", [await R("hl-4"), await R("hl-12"), await R("hl-worst")].join(" "));
  {
    const sc = await scales(HP), X = lin(sc.xs);
    const g = await pts(`${HP} path.gain`), zy = await nattr(`${HP} line.zero`, "y1");
    const bottom = g.reduce((a, p) => (p[1] > a[1] ? p : a), g[0]);
    check(`the valley's floor touches the promise at 8% @${width}`, Math.abs(bottom[1] - zy) < 0.5 && Math.abs(X.val(bottom[0]) - 8) < 0.1, `${(bottom[1] - zy).toFixed(2)}px at ${X.val(bottom[0]).toFixed(2)}%`);
    check(`and no point of the curve is below it @${width}`, g.every(([, y]) => y <= zy + 0.5));
  }
  await setRange(page, "#hl-h", 25);
  check(`25 years: −34.15%, +68.25% @${width}`, (await R("hl-4")) === "−34.15%" && (await R("hl-12")) === "+68.25%");

  // ---- three ways to wait 12.2 years
  const SP = ".spread-panel";
  check(`the barbell: 13.5 years of spread, +14.57% @${width}`, (await R("sp-sd")) === "13.5 years" && (await R("sp-4")) === "+14.57%");
  {
    const Y = lin((await scales(SP)).ys);
    const bu = await pts(`${SP} path.gain.bullet`), cp = await pts(`${SP} path.gain.coupon`), bb = await pts(`${SP} path.gain.barbell`);
    check(`the single zero lies on 0% @${width}`, bu.every(([, y]) => Math.abs(Y.val(y)) < 0.05));
    check(`the barbell's curve is above the coupon bond's, which is above the zero's @${width}`, bb.every(([x, y]) => y <= yAt(cp, x) + 0.3) && cp.every(([x, y]) => y <= yAt(bu, x) + 0.3));
  }
  await clickSeg("sp-set", "coupon");
  check(`the coupon bond: 9.4 years, +6.91%, +5.47% @${width}`, (await R("sp-sd")) === "9.4 years" && (await R("sp-4")) === "+6.91%" && (await R("sp-12")) === "+5.47%");
  await clickSeg("sp-set", "bullet");
  check(`one zero: 0.0 years, 0.00% either way @${width}`, (await R("sp-sd")) === "0.0 years" && (await R("sp-4")) === "0.00%" && (await R("sp-12")) === "0.00%");
  await clickSeg("sp-set", "barbell");

  // ---- the hump
  const HF = ".hump-panel";
  check(`the 2% bond: longest wait 16.4 years at 34, 13.6 at 100 @${width}`, (await R("hf-peak")) === "16.4 years, at 34 years to maturity" && (await R("hf-100")) === "13.6 years");
  {
    const sc = await scales(HF), X = lin(sc.xs), Y = lin(sc.ys);
    check(`the dot reads 16.4 at 34 years @${width}`, Math.abs(X.val(await nattr(`${HF} circle.peak`, "cx")) - 34) < 0.2 && Math.abs(Y.val(await nattr(`${HF} circle.peak`, "cy")) - 16.38) < 0.1);
    check(`the dashed line reads 13.5 @${width}`, Math.abs(Y.val(await nattr(`${HF} line.perp`, "y1")) - 13.5) < 0.05);
    const c8 = await pts(`${HF} path.wait.c8`), perpY = await nattr(`${HF} line.perp`, "y1");
    check(`the 8% bond's line stays under it @${width}`, c8.every(([, y]) => y >= perpY - 0.3));
  }
  await clickSeg("hf-c", "0.08");
  check(`the 8% bond keeps growing, to 13.5 at 100 @${width}`, (await R("hf-peak")) === "keeps growing" && (await R("hf-100")) === "13.5 years" && (await has(`${HF} circle.peak`)) === 0);
  await clickSeg("hf-c", "0.02");

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
