/*
  Browser checks for peer-group-outliers, at 390px and 1280px, against a build
  that ./verify/ship.sh has proved is current.

  The generic block (overflow, svg containment, NaN geometry, KaTeX, title
  width) is the house's. The article-specific block drives each interaction and
  checks that what is drawn agrees with the claim beside it. The geometry check
  that pays for the file is in the ring lab: in rendered pixels, every circled
  alert is at least as far from its nearest drawn centroid as every customer who
  isn't circled, which runs the model's verdict, both scales and the equal
  aspect ratio through one assertion.

  Usage (in the container, after extracting the tarball ship.sh produced):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/shots node verify/check-browser.mjs
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

if (SHOTS) mkdirSync(SHOTS, { recursive: true });

// Runs inside the page: a point in an element's user units, in screen pixels.
const GEOMETRY_HELPERS = `
  window.__scr = (el, x, y) => {
    const m = el.getScreenCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };
  window.__lineEnds = (el) => [
    __scr(el, +el.getAttribute("x1"), +el.getAttribute("y1")),
    __scr(el, +el.getAttribute("x2"), +el.getAttribute("y2")),
  ];
  window.__distToLine = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    return Math.abs(dy * (p.x - a.x) - dx * (p.y - a.y)) / Math.hypot(dx, dy);
  };
  window.__pathPoints = (el) => {
    const nums = (el.getAttribute("d").match(/-?\\d+(\\.\\d+)?/g) || []).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push(__scr(el, nums[i], nums[i + 1]));
    return pts;
  };
  window.__distToPolyline = (p, pts) => {
    let best = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const L = dx * dx + dy * dy;
      let t = L ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / L : 0;
      t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
    }
    return best;
  };
`;

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const noise = [];
  page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") noise.push(`console ${m.type()}: ${m.text()}`);
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: GEOMETRY_HELPERS });
  const at = (claim) => `${vp.name}: ${claim}`;
  const text = async (sel) => ((await page.locator(sel).first().textContent()) || "").replace(/\s+/g, " ").trim();

  // ------------------------------------------------------------ generic
  const overflow = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - window.innerWidth;
    if (over <= 0) return { over };
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.left < -1 || r.right > window.innerWidth + 1)) {
        bad.push(`${el.tagName.toLowerCase()}.${el.className || "-"} [${Math.round(r.left)},${Math.round(r.right)}]`);
      }
      if (bad.length > 4) break;
    }
    return { over, bad };
  });
  ok(at("the page does not scroll horizontally"), overflow.over <= 0,
     overflow.over > 0 ? `${overflow.over}px too wide: ${(overflow.bad || []).join("; ")}` : "");

  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].filter((s) => !s.closest("#site-mark") && !s.closest(".katex")).map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return { cls: s.getAttribute("class") || s.parentElement.className, over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)) };
    })
  );
  ok(at("every svg fits inside its parent"), svgs.every((s) => s.over <= 1),
     svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));
  ok(at("the article draws a sensible number of charts"), svgs.length >= 20, `${svgs.length} svgs`);

  const tables = await page.evaluate(() =>
    [...document.querySelectorAll("table")].map((t) => Math.round(t.getBoundingClientRect().right - window.innerWidth))
  );
  ok(at("no table runs off the screen"), tables.every((o) => o <= 0), tables.join(", "));

  // Nothing drawn outside its own svg (an outer svg clips visually while still
  // widening the document).
  const escapes = await page.evaluate(() => {
    const bad = [];
    for (const s of document.querySelectorAll("svg")) {
      // KaTeX draws radicals and big delimiters as stretched svgs that overhang
      // their own box on purpose; they are not our charts.
      if (s.closest("#site-mark") || s.closest(".katex")) continue;
      const box = s.getBoundingClientRect();
      for (const el of s.querySelectorAll("line, circle, rect, path")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.left < box.left - 1.5 || r.right > box.right + 1.5 || r.top < box.top - 1.5 || r.bottom > box.bottom + 1.5) {
          bad.push(`${el.tagName}.${el.getAttribute("class")} in ${s.getAttribute("aria-label")?.slice(0, 30)}`);
        }
      }
    }
    return bad.slice(0, 4);
  });
  ok(at("nothing is drawn outside the svg that contains it"), escapes.length === 0, escapes.join("; "));

  const sweep = await page.evaluate(async () => {
    const bad = [];
    const H = document.documentElement.scrollHeight;
    for (let i = 0; i <= 20; i++) {
      window.scrollTo(0, (H * i) / 20);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (const el of document.querySelectorAll("svg [d], svg circle, svg rect, svg line")) {
        const d = el.getAttribute("d");
        if (d && /NaN|undefined|Infinity/.test(d)) bad.push(`d=${d.slice(0, 40)}`);
        for (const a of ["width", "height", "r"]) {
          const v = el.getAttribute(a);
          if (v !== null && (Number.isNaN(+v) || +v < 0)) bad.push(`${el.getAttribute("class")} ${a}=${v}`);
        }
        for (const a of ["cx", "cy", "x1", "y1", "x2", "y2", "x", "y"]) {
          const v = el.getAttribute(a);
          if (v !== null && !Number.isFinite(+v)) bad.push(`${el.getAttribute("class")} ${a}=${v}`);
        }
      }
      if (bad.length) break;
    }
    window.scrollTo(0, 0);
    return bad.slice(0, 3);
  });
  ok(at("no NaN, undefined or negative geometry at any scroll position"), sweep.length === 0, sweep.join("; "));

  const math = await page.evaluate(() => ({
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 3),
    rendered: document.querySelectorAll(".katex").length,
    display: document.querySelectorAll(".katex-display").length,
  }));
  ok(at("no unrendered LaTeX in the text"), math.raw.length === 0, math.raw.join(" "));
  ok(at("KaTeX rendered the maths"), math.rendered >= 20 && math.display >= 10,
     `${math.rendered} .katex, ${math.display} display`);

  const title = await page.evaluate(() => {
    const h = document.querySelector("#intro-hed");
    const range = document.createRange();
    range.selectNodeContents(h);
    return Math.max(...[...range.getClientRects()].map((r) => r.width));
  });
  ok(at("the title's widest rendered line fits the viewport"), title <= vp.width - 2,
     `widest line ${Math.round(title)}px in ${vp.width}px`);

  const glued = await page.evaluate(() =>
    (document.body.innerText.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/g) || []).slice(0, 3)
  );
  ok(at("no text glued to a separator or a word"), glued.length === 0, glued.join(" "));

  const oldName = await page.evaluate(() =>
    /nash|scaffold|comparative advantage|economic rent/i.test(document.title + document.querySelector("#intro").innerText)
  );
  ok(at("no other article's name in the title or masthead"), !oldName);


  const strip = async (fig) => page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const chips = [...el.querySelectorAll(".catch-strip .chip")];
    return chips.map((c) => +c.dataset.n);
  }, fig);
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(60); };

  // ------------------------------------------------ the starting model
  ok(at("the starting model's strip reads 13 / 0 / 5"), (await strip("#baseline")).slice(0, 3).join() === "13,0,5", (await strip("#baseline")).join());

  // ------------------------------------------------ I.1 scope
  {
    await click('#scope .pill.kpill[data-k="3"]');
    await click('#scope .pill.opt[data-key="with"]');
    const s = await strip("#scope");
    ok(at("with dormant accounts, no house sale is flagged at k = 3"), s[2] === 0, s.join());
    ok(at("the note says the dormant accounts form a cluster of 400"), /cluster of 400/.test(await text("#scope .switch-note")));
    ok(at("the selected row of the table matches the strip"), (await text("#scope tr.sel")).includes("plus 400 dormant"));
  }
  // ------------------------------------------------ I.2 feature shape
  {
    await click("#feature-shape .pill.feat >> nth=3");
    ok(at("cash is 89.1% zeros"), /zeros 89\.1%/.test(await text("#feature-shape .shape-facts")), await text("#feature-shape .shape-facts"));
    const bars = await page.locator("#feature-shape rect.hbar").count();
    ok(at("the histogram draws 40 bars"), bars === 40, `${bars}`);
    await click("#feature-shape .pill.view >> nth=1");
    ok(at("the log view shows the log skew"), /skew 2\.56/.test(await text("#feature-shape .shape-facts")));
  }
  // ------------------------------------------------ I.4 missing
  {
    for (const key of ["median", "mean", "zero", "indicator", "drop"]) {
      await click(`#missing .pill.opt[data-key="${key}"]`);
      for (const mech of ["mcar", "ring"]) {
        await click(`#missing .pill.kpill[data-k="${mech}"]`);
        const note = await text("#missing .switch-note");
        ok(at(`missing ring members are never caught (${key}, ${mech})`), /: 0 of (3|10)$/.test(note), note);
      }
    }
  }
  // ------------------------------------------------ II.1 transforms
  {
    await click('#transforms .pill.kpill[data-k="3"]');
    await click('#transforms .pill.opt[data-key="rawZ"]');
    ok(at("raw values at k = 3 catch 9 structurers"), (await strip("#transforms"))[1] === 9);
    await click('#transforms .pill.opt[data-key="logZ"]');
    ok(at("log at k = 3 catches 20 / 0 / 5"), (await strip("#transforms")).slice(0, 3).join() === "20,0,5");
    await click('#transforms .pill.opt[data-key="log10k"]');
    ok(at("log(x + 10,000) at k = 3 catches all 10 structurers"), (await strip("#transforms"))[1] === 10);
    ok(at("the transforms table has five rows"), (await page.locator("#transforms tbody tr").count()) === 5);
  }
  // ------------------------------------------------ II.7 ratio
  {
    const s = await strip("#ratio");
    ok(at("the ratio figure opens with the ratio at k = 5: ring 3"), s[0] === 3, s.join());
    ok(at("and says the ring shares a cluster of 168"), /cluster of 168/.test(await text("#ratio .switch-note")));
  }
  // ------------------------------------------------ matrices
  ok(at("the correlation matrix has 36 cells"), (await page.locator("#correlation rect.cell").count()) === 36);
  ok(at("the correlation matrix prints 0.99 for money in and out"), (await page.locator("#correlation text.cell-value >> nth=1").textContent()) === "0.99");
  // ------------------------------------------------ III seeds
  {
    await click("#seed-strip .pill.kpill >> nth=1");
    await click('#seed-strip .pill.ninit[data-n="1"]');
    const xs1 = await page.$$eval("#seed-strip circle.seed-dot", (cs) => cs.map((c) => +c.getAttribute("cx")));
    ok(at("40 seed dots"), xs1.length === 40);
    ok(at("with one start at k = 8 the dots spread across 0 to 20"), Math.max(...xs1) - Math.min(...xs1) > 100, `${Math.min(...xs1)}..${Math.max(...xs1)}`);
    await click("#seed-strip .pill.kpill >> nth=0");
    await click('#seed-strip .pill.ninit[data-n="10"]');
    const xs10 = await page.$$eval("#seed-strip circle.seed-dot", (cs) => cs.map((c) => +c.getAttribute("cx")));
    ok(at("with ten starts at k = 5 every seed lands in one place"), new Set(xs10.map((v) => v.toFixed(2))).size === 1);
  }
  // ------------------------------------------------ III k criteria
  {
    await page.locator("#k-criteria input[type=range]").fill("4");
    await page.waitForTimeout(80);
    ok(at("at k = 4 the strip shows 12 of the ring"), (await strip("#k-criteria"))[0] === 12);
    const picks = await page.$$eval("#k-criteria circle.pt.pick", (cs) => cs.length);
    ok(at("five criteria each ring their favourite k"), picks === 5, `${picks}`);
    await page.locator("#k-criteria input[type=range]").fill("3");
    await page.waitForTimeout(80);
    ok(at("at k = 3 the strip shows the whole ring"), (await strip("#k-criteria"))[0] === 20);
  }
  // ------------------------------------------------ IV ring lab: the geometry check
  {
    const lab = "#ring-lab";
    await page.locator(lab).scrollIntoViewIfNeeded();
    const geom = async () => page.evaluate(() => {
      const svg = document.querySelector("#ring-lab svg");
      const cents = [...svg.querySelectorAll("g.centroid")].map((g) => { const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      const pts = [...svg.querySelectorAll("circle.cust, circle.mule")].map((c) => {
        const m = c.getScreenCTM(); const x = +c.getAttribute("cx"), y = +c.getAttribute("cy");
        const p = { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
        const d = Math.min(...cents.map((q) => Math.hypot(p.x - q.x, p.y - q.y)));
        return { alert: c.classList.contains("alert"), mule: c.classList.contains("mule"), d };
      });
      const al = pts.filter((p) => p.alert).map((p) => p.d), rest = pts.filter((p) => !p.alert).map((p) => p.d);
      return { minAlert: Math.min(...al), maxRest: Math.max(...rest), nAlert: al.length, nMuleAlert: pts.filter((p) => p.alert && p.mule).length, cents: cents.length };
    });
    const readCaught = async () => { const t = await text(`${lab} .ring-caught`); return t.split("/").map(Number); };
    // default: ring of 20, k = 5
    let g = await geom();
    ok(at("ring lab: every circled alert is at least as far from its centroid as every other customer (pixels)"), g.minAlert >= g.maxRest - 0.75, `${g.minAlert.toFixed(2)} vs ${g.maxRest.toFixed(2)}`);
    const [c20] = await readCaught();
    ok(at("ring lab: the readout counts the circled mules"), c20 === g.nMuleAlert, `${c20} vs ${g.nMuleAlert}`);
    // grow the ring and raise k: the ring should lose its alerts
    await page.locator(`${lab} input[type=range] >> nth=0`).fill("7");
    await page.locator(`${lab} input[type=range] >> nth=1`).fill("12");
    await page.waitForTimeout(300);
    g = await geom();
    const [c80, m80] = await readCaught();
    ok(at("ring lab: a ring of 80 at k = 12 is mostly hidden"), m80 === 80 && c80 <= 10, `${c80}/${m80}`);
    ok(at("ring lab: geometry still agrees at k = 12"), g.minAlert >= g.maxRest - 0.75, `${g.minAlert.toFixed(2)} vs ${g.maxRest.toFixed(2)}`);
    ok(at("ring lab: the verdict mentions the ring's centroid or its cluster"), /centroid|cluster/.test(await text(`${lab} .verdict`)));
    await page.locator(`${lab} input[type=range] >> nth=0`).fill("0");
    await page.waitForTimeout(250);
    const [c1] = await readCaught();
    ok(at("ring lab: a lone mule is caught"), c1 === 1);
    if (vp.name === "mobile") {
      await page.evaluate(() => { const r = document.querySelector("#ring-lab svg").getBoundingClientRect(); window.scrollBy(0, r.bottom - window.innerHeight + 20); });
      await page.waitForTimeout(100);
      const bar = await page.locator(`${lab} .controls-bar`).boundingBox();
      ok(at("ring lab: on a phone the sliders stay on screen while the chart scrolls"), bar && bar.y >= -1 && bar.y + bar.height <= 844, bar ? `${bar.y}` : "none");
    }
  }
  // ------------------------------------------------ IV rules and distances
  {
    await click('#rules .pill.opt[data-key="perCluster"]');
    ok(at("per-cluster rule at k = 5 catches 3 of the ring and lists 54 alerts"), (await strip("#rules"))[0] === 3 && /54 alerts/.test(await text("#rules .switch-note")));
    await click('#distances .pill.kpill[data-k="5"]');
    await click('#distances .pill.opt[data-key="mahalCluster"]');
    ok(at("per-cluster Mahalanobis is undefined for 65% at k = 5"), /undefined for 65%/.test(await text("#distances .switch-note")));
    await click('#distances .pill.opt[data-key="chebyshev"]');
    ok(at("Chebyshev at k = 5 catches the whole ring"), (await strip("#distances"))[0] === 20);
  }
  // ------------------------------------------------ V series figures and benchmarks
  {
    await page.locator("#dose-cash input[type=range]").fill("5");
    await page.waitForTimeout(60);
    const leg = await text("#dose-cash .legend");
    ok(at("dose chart at 160k: log(1 + x) still 0"), /log\(1 \+ x\) 0/.test(leg), leg);
    ok(at("benchmarks open on the one-feature rules: 20 / 9 / 5"), (await strip("#benchmarks")).slice(0, 3).join() === "20,9,5");
    await click('#benchmarks .pill.opt[data-key="knn5"]');
    ok(at("5th neighbour catches none of the ring"), (await strip("#benchmarks"))[0] === 0);
    const hen = await page.$$eval("#hennig rect.bar", (rs) => rs.map((r) => +r.dataset.v));
    ok(at("Hennig bars: one of eight below 0.75"), hen.length === 8 && hen.filter((v) => v < 0.75).length === 1);
  }
  // ------------------------------------------------ VI explainer
  {
    const fig = "#why-customer";
    await click(`${fig} .pill.ex[data-tag="ring"]`);
    const sum = await page.$$eval(`${fig} .tbar`, (bs) => bs.reduce((s, b) => s + +b.dataset.v, 0));
    const head = await text(`${fig} .why-head`);
    const d2 = +head.match(/squared distance ([\d.]+)/)[1];
    ok(at("the bars add up to the squared distance in the readout"), Math.abs(sum - d2) < 0.02, `${sum} vs ${d2}`);
    ok(at("the ring member's counterfactual is 22.8 senders"), /from 41 to 22\.8/.test(await text(`${fig} .why-cf`)));
    await click(`${fig} .pill.ex[data-tag="cash"]`);
    const before = await page.$$eval(`${fig} .tbar`, (bs) => bs.map((b) => +b.dataset.v));
    await click(`${fig} .pill.mode[data-mode="shap"]`);
    const after = await page.$$eval(`${fig} .tbar`, (bs) => bs.map((b) => +b.dataset.v));
    ok(at("with re-assignment the cash user's biggest bar moves from cash to money in"), before.indexOf(Math.max(...before)) === 3 && after.indexOf(Math.max(...after)) === 0, `${before} / ${after}`);
    await click(`${fig} .pill.ex[data-tag="sale"]`);
    ok(at("the house sale can't be cleared by one feature"), /No single feature/.test(await text(`${fig} .why-cf`)));
  }
  {
    await click("#surrogate-tree .pill.depth >> nth=1");
    ok(at("a depth-2 tree has four rules and misses one group"), (await page.locator("#surrogate-tree li").count()) === 4 && /never predicts group 5/.test(await text("#surrogate-tree .tree-fid")));
    await click("#importance .pill >> nth=2");
    const perm = await page.$$eval("#importance rect.bar", (rs) => rs.map((r) => +r.dataset.v));
    ok(at("permutation importance puts senders first"), perm.indexOf(Math.max(...perm)) === 5);
  }
  ok(at("the conclusion ends with Thanks for reading!"), (await page.locator("p", { hasText: /^Thanks for reading!$/ }).count()) === 1);

  // ------------------------------------------------ screenshots
  if (SHOTS) {
    for (const id of ["baseline", "scope", "feature-shape", "transforms", "offset", "correlation", "seed-strip", "k-criteria", "ring-lab", "ring-size", "segments", "dose-cash", "benchmarks", "similarity", "why-customer", "surrogate-tree", "importance", "checklist"]) {
      const el = page.locator(`#${id}`);
      if (await el.count()) { await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: `${SHOTS}/${vp.name}-${id}.png` }); }
    }
  }
  ok(at("no page errors or console warnings"), noise.length === 0, noise.slice(0, 3).join(" | "));
  await page.close();
}
await browser.close();
if (fails.length) { console.log(fails.map((f) => `  FAIL ${f}`).join("\n")); console.log(`\n${fails.length} FAILED, ${pass} passed`); process.exit(1); }
console.log(`ALL ${pass} BROWSER CHECKS PASS`);
