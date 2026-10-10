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

  // ---------------------------------------------------- binomial-pricing checks
  const near1 = (a, b, tol) => Math.abs(a - b) <= tol;
  await click('#guess button[data-g="same"]');
  check(`guess card: the same, $9.52 @${width}`, (await txt("#guess-answer")).startsWith("That's right.") && (await txt("#guess-answer")).includes("$9.52"), await txt("#guess-answer"));
  // ---- the copy
  check(`copy lab at the start: $20.00, $5.00, $11.90, not yet @${width}`, (await R("cl-up")) === "$20.00" && (await R("cl-down")) === "$5.00" && (await R("cl-cost")) === "$11.90" && (await R("cl-match")) === "Not yet", `${await R("cl-up")} ${await R("cl-down")} ${await R("cl-cost")} ${await R("cl-match")}`);
  await setRange(page, "#cl-shares", 2 / 3);
  await setRange(page, "#cl-owe", 60);
  check(`two thirds of a share and $60 owed copy the call for $9.52 @${width}`, (await R("cl-up")) === "$20.00" && (await R("cl-down")) === "$0.00" && (await R("cl-cost")) === "$9.52" && (await R("cl-match")) === "Yes", `${await R("cl-up")} ${await R("cl-down")} ${await R("cl-cost")} ${await R("cl-match")}`);
  check(`the tree's labels follow @${width}`, (await txt(".copy-panel text.mine")).includes("$20.00"));
  // ---- returns
  {
    const RP = ".return-panel";
    check(`returns at 90%: +17% and +89%, price $9.52 @${width}`, (await R("rf-share")) === "+17%" && (await R("rf-call")) === "+89%" && (await R("rf-price")) === "$9.52", `${await R("rf-share")} ${await R("rf-call")}`);
    const sc = await scales(RP), X = lin(sc.xs), Y = lin(sc.ys);
    check(`the call's dot reads 89% @${width}`, near1(Y.val(await nattr(`${RP} circle.dot-call`, "cy")), 89, 0.5));
    const sh = await pts(`${RP} path.share`), ca = await pts(`${RP} path.call`);
    check(`the lines cross at 50% and the safe 5% @${width}`, near1(Y.val(yAt(sh, X.px(50))), 5, 0.3) && near1(Y.val(yAt(ca, X.px(50))), 5, 0.3));
    const slope = (l) => (Y.val(yAt(l, X.px(100))) - Y.val(yAt(l, X.px(0)))) / 100;
    check(`the call's line is seven times as steep @${width}`, near1(slope(ca) / slope(sh), 7, 0.05), (slope(ca) / slope(sh)).toFixed(3));
    await setRange(page, "#rf-p", 0.1);
    check(`at 10%: −7% and −79%, still $9.52 @${width}`, (await R("rf-share")) === "−7%" && (await R("rf-call")) === "−79%" && (await R("rf-price")) === "$9.52", `${await R("rf-share")} ${await R("rf-call")}`);
    await setRange(page, "#rf-p", 0.5);
    check(`at 50% both earn 5% @${width}`, (await R("rf-share")) === "+5%" && (await R("rf-call")) === "+5%" && near1(await nattr(`${RP} circle.dot-call`, "cy"), await nattr(`${RP} circle.dot-share`, "cy"), 0.1));
    await setRange(page, "#rf-p", 0.9);
  }
  // ---- the tree
  {
    check(`the tree starts with the payoffs only @${width}`, (await has(".tree-panel text.value")) === 5 && (await R("tl-price")) === "step back to see" && (await page.locator("#tl-reset").isDisabled()));
    for (let i = 0; i < 4; i++) await click("#tl-back");
    check(`four presses fill all fifteen nodes @${width}`, (await has(".tree-panel text.value")) === 15 && (await page.locator("#tl-back").isDisabled()));
    check(`the call today is $9.97, the copy 0.629 shares @${width}`, (await R("tl-price")) === "$9.97" && (await R("tl-delta")) === "0.629" && (await R("tl-q")) === "0.5378" && (await R("tl-bs")) === "$10.45", `${await R("tl-price")} ${await R("tl-delta")}`);
    check(`the top node after three steps reads 36.23 @${width}`, (await txt(".tree-panel text.v3-3")) === "36.23" && (await txt(".tree-panel text.v0-0")) === "9.97");
    await click("#tl-reset");
    check(`start again empties the tree @${width}`, (await has(".tree-panel text.value")) === 5);
  }
  // ---- convergence
  {
    const CP = ".converge-panel";
    check(`4 steps: $9.97, gap −0.480 @${width}`, (await R("cf-tree")) === "$9.97" && (await R("cf-bs")) === "$10.45" && (await R("cf-gap")) === "−0.480", `${await R("cf-tree")} ${await R("cf-gap")}`);
    await setRange(page, "#cf-n", 51);
    check(`51 steps: $10.49, gap +0.034 @${width}`, (await R("cf-tree")) === "$10.49" && (await R("cf-gap")) === "+0.034", `${await R("cf-tree")} ${await R("cf-gap")}`);
    const Y = lin((await scales(CP)).ys), bsY = await nattr(`${CP} line.bs`, "y1");
    const even = await page.evaluate((s) => [...document.querySelectorAll(`${s} circle.even`)].map((c) => +c.getAttribute("cy")), CP);
    const odd = await page.evaluate((s) => [...document.querySelectorAll(`${s} circle.odd`)].map((c) => +c.getAttribute("cy")), CP);
    check(`even steps sit below the pink line and odd steps above @${width}`, even.length === 50 && odd.length === 50 && even.every((y) => y > bsY) && odd.every((y) => y < bsY));
    check(`the pink line is at $10.45 @${width}`, near1(Y.val(bsY), 10.4506, 0.01));
    await setRange(page, "#cf-n", 4);
  }
  // ---- three branches
  {
    const TP = ".tri-panel";
    check(`three branches: $4.76 to $9.52, she pays $8.09 at 1.41 @${width}`, (await R("tr-band")) === "$4.76 to $9.52" && (await R("tr-price")) === "$8.09" && (await R("tr-gamma")) === "1.41", `${await R("tr-band")} ${await R("tr-price")} ${await R("tr-gamma")}`);
    const X = lin((await scales(TP)).xs);
    const bx = await nattr(`${TP} rect.band`, "x"), bw = await nattr(`${TP} rect.band`, "width");
    check(`the band runs from $4.76 to $9.52 on the axis @${width}`, near1(X.val(bx), 4.762, 0.01) && near1(X.val(bx + bw), 9.524, 0.01));
    check(`her dot sits at $8.09 @${width}`, near1(X.val(await nattr(`${TP} circle.inv`, "cx")), 8.089, 0.01));
    await setRange(page, "#tr-pm", 0);
    check(`no middle branch: $9.52, on the blue line @${width}`, (await R("tr-price")) === "$9.52" && near1(await nattr(`${TP} circle.inv`, "cx"), await nattr(`${TP} line.binomial`, "x1"), 0.05));
    await setRange(page, "#tr-pm", 0.9);
    check(`a 90% middle branch: $5.24 @${width}`, (await R("tr-price")) === "$5.24", await R("tr-price"));
    await setRange(page, "#tr-pm", 0.3);
    await setRange(page, "#tr-up", 0.75);
    check(`a 75% split: risk aversion 3.82, price $7.99 @${width}`, (await R("tr-gamma")) === "3.82" && (await R("tr-price")) === "$7.99", `${await R("tr-gamma")} ${await R("tr-price")}`);
    await setRange(page, "#tr-up", 0.6);
  }
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
