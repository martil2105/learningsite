/*
  Browser checks for short-selling-and-margin at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/short-selling-and-margin-shots node verify/check-browser.mjs

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
  await click('#guess button[data-g="third"]');
  check(`the guess card says right for a third @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await click('#guess button[data-g="half"]');
  check(`and says what it is for a half @${width}`, (await txt("#guess-answer")).startsWith("It's a third"));

  // ---- one margin account
  const A = "#fig-account svg.account-panel";
  check(`the lab opens long at $100: $10,000 of shares, a $5,000 loan, $5,000 of equity, 50.0%, 2.00× @${width}`,
    (await on("al-side", "long")) === "true" && (await R("al-r-shares")) === "$10,000" && (await R("al-r-other")) === "$5,000" && (await R("al-r-equity")) === "$5,000" && (await R("al-r-ratio")) === "50.0%" && (await R("al-r-lev")) === "2.00×");
  check(`fine, with the call at $66.67 and nothing lost @${width}`, (await R("al-r-status")) === "Fine" && (await R("al-r-call")) === "$66.67" && (await R("al-r-lost")) === "0.0%" && (await has("#al-r-add")) === 0);
  // the call dot is where the two drawn lines cross, and the band runs to it
  const crossing = async () => {
    const sc = await scales(A), X = lin(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${A} circle.call-dot`, "cx"), cy = await nattr(`${A} circle.call-dot`, "cy");
    const eqP = await pts(`${A} path.equity`), rqP = await pts(`${A} path.req`);
    const bx = await nattr(`${A} rect.called`, "x"), bw = await nattr(`${A} rect.called`, "width");
    return { price: X.val(cx), onEq: Math.abs(yAt(eqP, cx) - cy), onReq: Math.abs(yAt(rqP, cx) - cy), dollars: Y.val(cy), band: [X.val(bx), X.val(bx + bw)] };
  };
  {
    const c = await crossing();
    check(`the call dot sits at $66.67 on both lines @${width}`, Math.abs(c.price - 66.667) < 0.2 && c.onEq < 1 && c.onReq < 1, JSON.stringify(c));
    check(`the requirement there is $1,667, a quarter of the shares @${width}`, Math.abs(c.dollars - 1666.7) < 40, c.dollars.toFixed(0));
    check(`the shaded call zone runs from $40 to $66.67 @${width}`, Math.abs(c.band[0] - 40) < 0.2 && Math.abs(c.band[1] - 66.667) < 0.2, c.band.map((v) => v.toFixed(2)).join(" "));
  }
  await setRange(page, "#al-p", 67);
  check(`at $67 it's still fine @${width}`, (await R("al-r-status")) === "Fine");
  await setRange(page, "#al-p", 66);
  check(`at $66 the broker calls @${width}`, (await R("al-r-status")) === "Margin call");
  await setRange(page, "#al-p", 60);
  check(`at $60: equity $1,000, add $500 or sell $2,000, leverage 6.00×, 80.0% lost @${width}`,
    (await R("al-r-equity")) === "$1,000" && (await R("al-r-add")) === "$500" && (await R("al-r-trade")) === "$2,000" && (await R("al-r-lev")) === "6.00×" && (await R("al-r-lost")) === "80.0%");
  {
    const sc = await scales(A), X = lin(sc.xs), Y = lin(sc.ys);
    const px = X.val(await nattr(`${A} line.p-marker`, "x1")), ey = Y.val(await nattr(`${A} circle.eq-dot`, "cy"));
    check(`the marker is at $60 and the green dot at $1,000 @${width}`, Math.abs(px - 60) < 0.2 && Math.abs(ey - 1000) < 40, `${px.toFixed(2)} ${ey.toFixed(0)}`);
  }
  await setRange(page, "#al-p", 45);
  check(`at $45 the account is wiped out and there's no leverage left @${width}`, (await R("al-r-status")) === "Wiped out" && (await R("al-r-lev")) === "none left" && (await R("al-r-lost")) === "100.0%");
  await setRange(page, "#al-k", 0.3);
  check(`a 30% maintenance margin moves the long's call to $71.43 @${width}`, (await R("al-r-call")) === "$71.43");
  await setRange(page, "#al-m", 1);
  check(`with no loan there is no call and no shaded zone @${width}`, (await R("al-r-call")) === "never" && (await has(`${A} rect.called`)) === 0);
  await setRange(page, "#al-m", 0.5);

  await clickSeg("al-side", "short");
  await setRange(page, "#al-p", 100);
  check(`short at $100: $10,000 owed, $15,000 cash, $5,000 equity, the call at $115.38, maintenance 30% @${width}`,
    (await R("al-r-shares")) === "$10,000" && (await R("al-r-other")) === "$15,000" && (await R("al-r-equity")) === "$5,000" && (await R("al-r-call")) === "$115.38" && (await val("#al-k")) === "0.3");
  {
    const c = await crossing();
    check(`the short's call dot sits at $115.38 on both lines, and the zone runs to $160 @${width}`, Math.abs(c.price - 115.385) < 0.2 && c.onEq < 1 && c.onReq < 1 && Math.abs(c.band[0] - 115.385) < 0.2 && Math.abs(c.band[1] - 160) < 0.2, JSON.stringify(c));
  }
  await setRange(page, "#al-p", 115);
  check(`at $115 the short is fine @${width}`, (await R("al-r-status")) === "Fine");
  await setRange(page, "#al-p", 116);
  check(`at $116 the short is called @${width}`, (await R("al-r-status")) === "Margin call");
  await setRange(page, "#al-p", 125);
  check(`at $125: add $1,250 or buy back $4,167 @${width}`, (await R("al-r-add")) === "$1,250" && (await R("al-r-trade")) === "$4,167" && (await R("al-r-lost")) === "50.0%");
  await setRange(page, "#al-p", 150);
  check(`at $150 the short is wiped out @${width}`, (await R("al-r-status")) === "Wiped out");
  await setRange(page, "#al-k", 0.25);
  check(`with a 25% rule the short's call is at $120.00, a rise of 20% @${width}`, (await R("al-r-call")) === "$120.00");
  await clickSeg("al-side", "long");
  check(`back to the long, its own maintenance margin (30%) is kept @${width}`, (await val("#al-k")) === "0.3" && (await R("al-r-call")) === "$71.43");
  await setRange(page, "#al-k", 0.25);
  await setRange(page, "#al-p", 100);

  // ---- forty possible years
  const Pp = "#fig-paths svg.paths-panel", Cc = "#fig-paths svg.chance-panel";
  check(`at 30%: 25 years call the short and 7 the long; chances 63.3% and 17.7% @${width}`,
    (await R("pl-r-nshort")) === "25" && (await R("pl-r-nlong")) === "7" && (await R("pl-r-cshort")) === "63.3%" && (await R("pl-r-clong")) === "17.7%");
  check(`and the chart draws 25 pink dots and 7 blue ones @${width}`, (await has(`${Pp} circle.touch.short`)) === 25 && (await has(`${Pp} circle.touch.long`)) === 7);
  check(`40 grey years are drawn @${width}`, (await has(`${Pp} path.price`)) === 40);
  {
    const dotsOn = await page.evaluate((Pp) => {
      const yS = +document.querySelector(`${Pp} line.short-call`).getAttribute("y1"), yL = +document.querySelector(`${Pp} line.long-call`).getAttribute("y1");
      const s = [...document.querySelectorAll(`${Pp} circle.touch.short`)].every((c) => Math.abs(+c.getAttribute("cy") - yS) < 0.01);
      const l = [...document.querySelectorAll(`${Pp} circle.touch.long`)].every((c) => Math.abs(+c.getAttribute("cy") - yL) < 0.01);
      return s && l;
    }, Pp);
    check(`every dot sits on its own line @${width}`, dotsOn);
    // the lines are at $115.38 and $66.67 on the log axis
    const lg = await page.evaluate((Pp) => {
      const t = [...document.querySelectorAll(`${Pp} .axis-y text.tick-label`)].map((e) => ({ v: Math.log10(parseFloat(e.textContent.replace("$", ""))), p: +e.getAttribute("y") - 4 }));
      const a = t[0], b = t[t.length - 1], k = (b.p - a.p) / (b.v - a.v);
      const v = (p) => Math.pow(10, a.v + (p - a.p) / k);
      return [v(+document.querySelector(`${Pp} line.short-call`).getAttribute("y1")), v(+document.querySelector(`${Pp} line.long-call`).getAttribute("y1"))];
    }, Pp);
    check(`the two lines are at $115.38 and $66.67 on the log axis @${width}`, Math.abs(lg[0] - 115.38) < 0.5 && Math.abs(lg[1] - 66.67) < 0.5, lg.map((v) => v.toFixed(2)).join(" "));
  }
  {
    const s = await readAt(Cc, `${Cc} path.chance.short`, 30), l = await readAt(Cc, `${Cc} path.chance.long`, 30);
    check(`the small chart reads 63% and 18% at 30% @${width}`, Math.abs(s - 63.3) < 1 && Math.abs(l - 17.7) < 1, `${s.toFixed(1)} ${l.toFixed(1)}`);
    const sc = await scales(Cc), X = lin(sc.xs), Y = lin(sc.ys);
    check(`its dots and marker sit at 30% @${width}`, Math.abs(X.val(await nattr(`${Cc} line.s-marker`, "x1")) - 30) < 0.2 && Math.abs(Y.val(await nattr(`${Cc} circle.dot.short`, "cy")) - 63.3) < 0.8);
    const S = await pts(`${Cc} path.chance.short`), L = await pts(`${Cc} path.chance.long`);
    check(`the short's curve is above the long's everywhere @${width}`, S.every((q, i) => q[1] <= L[i][1] + 0.01));
  }
  await setRange(page, "#pl-s", 0.2);
  check(`at 20%: 47.4% and 4.3% @${width}`, (await R("pl-r-cshort")) === "47.4%" && (await R("pl-r-clong")) === "4.3%");
  check(`and the drawn dots follow the readout counts @${width}`, (await has(`${Pp} circle.touch.short`)) === +(await R("pl-r-nshort")) && (await has(`${Pp} circle.touch.long`)) === +(await R("pl-r-nlong")));
  await setRange(page, "#pl-s", 0.3);

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
