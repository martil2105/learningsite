/*
  The rendering checks. Everything here is a thing check-numbers.mjs cannot see,
  because it is about pixels rather than arithmetic: overflow, panels that
  silently wrapped, geometry drawn in the wrong coordinate system, text glued to
  a separator, a heading wider than a phone, and above all GEOMETRY CONSISTENCY -
  whether the parts of a chart drawn from a measured width agree with each other.

  Every check in here was written because something got past everything else.

  Run against a served production build:

      npm run build
      python3 -m http.server 8765 -d public &
      node verify/check-browser.mjs

  Needs Playwright. SHOTS=<dir> also writes screenshots - and the last step of any
  review is to LOOK at them, because a covered chart, a clipped label, a chart
  with three scales on one axis and an ugly layout all pass every assertion here.
*/
import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const SHOTS = process.env.SHOTS;

let failures = 0;
const ok = (label, cond, detail = '') => {
  console.log((cond ? '  PASS  ' : '  FAIL  ') + label + (detail ? '   ' + detail : ''));
  if (!cond) failures++;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

for (const vp of [{ w: 1280, h: 900, name: 'desktop' }, { w: 390, h: 780, name: 'mobile' }]) {
  console.log(`\n================ ${vp.name} (${vp.w}x${vp.h}) ================`);
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [], warnings = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
    if (m.type() === 'warning') warnings.push('console.warn: ' + m.text());
  });

  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  ok('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('no console warnings', warnings.length === 0, warnings.slice(0, 3).join(' | '));

  // ---- KaTeX
  const katex = await page.evaluate(() => ({
    count: document.querySelectorAll('.katex').length,
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 8),
  }));
  ok('KaTeX rendered', katex.count > 15, katex.count + ' nodes');
  ok('no raw LaTeX reached the DOM', katex.raw.length === 0, katex.raw.join(' '));

  // ---- overflow
  const of = await page.evaluate(() => {
    const doc = { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
    // body has overflow-x:hidden, so check every svg against its own parent box
    const bad = [];
    for (const svg of document.querySelectorAll('svg')) {
      const s = svg.getBoundingClientRect();
      const p = svg.parentElement.getBoundingClientRect();
      if (s.width < 2) continue;
      if (s.right > p.right + 1.5 || s.left < p.left - 1.5) {
        bad.push({ cls: svg.getAttribute('class') || svg.parentElement.className, sw: Math.round(s.width), pw: Math.round(p.width), over: Math.round(s.right - p.right) });
      }
    }
    // scrollable wrappers whose content is wider than the viewport but not scrollable
    const overflowing = [];
    for (const el of document.querySelectorAll('.math-display, .curves, .pair')) {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 1) overflowing.push(el.className + ' right=' + Math.round(r.right));
    }
    return { doc, bad, overflowing };
  });
  ok('page does not scroll horizontally', of.doc.scrollWidth <= of.doc.innerWidth,
     of.doc.scrollWidth + ' vs ' + of.doc.innerWidth);
  ok('no svg escapes its parent box', of.bad.length === 0, JSON.stringify(of.bad.slice(0, 4)));
  ok('no wrapper spills past the viewport', of.overflowing.length === 0, of.overflowing.slice(0, 3).join(' | '));

  // ---- CELLS MUST BE DRAWN IN THE PLOT, NOT IN DATA COORDINATES
  // The Voronoi polygons come back in data units; forgetting the plot transform
  // draws a correct diagram in the top-left corner of every chart. Nothing else
  // here catches it: the svg does not overflow and no error is thrown.
  const cellGeom = await page.evaluate(() => {
    const out = [];
    for (const svg of document.querySelectorAll('svg')) {
      const rect = svg.querySelector('rect');
      if (!rect) continue;
      const rb = rect.getBoundingClientRect();
      if (rb.width < 40) continue;
      const cells = [...svg.querySelectorAll('path')].filter(p => (p.getAttribute('d') || '').endsWith('Z'));
      if (!cells.length) continue;
      let area = 0, outside = 0;
      for (const c of cells) {
        const b = c.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) continue;
        area += b.width * b.height;
        // Any part of a cell more than 2px outside the plot rect is a bug.
        if (b.left < rb.left - 2 || b.right > rb.right + 2 || b.top < rb.top - 2 || b.bottom > rb.bottom + 2) outside++;
      }
      // The cells partition the plot rect, so together they must cover most of it.
      out.push({ cells: cells.length, outside, coverage: +(area / (rb.width * rb.height)).toFixed(2) });
    }
    return out;
  });
  ok('no cell is drawn outside its plot rect', cellGeom.every(g => g.outside === 0), JSON.stringify(cellGeom));
  ok('cells actually cover their plot rect', cellGeom.every(g => g.coverage > 0.5), JSON.stringify(cellGeom));

  // ---- multi-panel rows must stay on ONE row at desktop width
  const rows = await page.evaluate(() => {
    const rowOf = (sel, childSel) => [...document.querySelectorAll(sel)].map(c => {
      const kids = [...c.querySelectorAll(childSel)];
      const tops = kids.map(k => Math.round(k.getBoundingClientRect().top));
      const widths = kids.map(k => Math.round(k.getBoundingClientRect().width));
      return { n: kids.length, tops, widths, parentW: Math.round(c.getBoundingClientRect().width) };
    });
    return { pairs: rowOf('.pair', '.mini'), curves: rowOf('.curves', 'svg') };
  });
  const sameRow = g => g.n >= 2 && Math.max(...g.tops) - Math.min(...g.tops) < 3;
  ok('shape panels sit side by side', vp.w < 950 || rows.pairs.every(sameRow), JSON.stringify(rows.pairs));
  ok('the two k curves sit side by side', vp.w < 950 || rows.curves.every(sameRow), JSON.stringify(rows.curves));
  ok('panels stack on mobile', vp.w > 950 || rows.pairs.every(g => !sameRow(g)), JSON.stringify(rows.pairs.map(g => g.tops)));

  // ---- no digit glued to a separator by a trimmed {#if} block
  const glued = await page.evaluate(() =>
    [...document.querySelectorAll('.card-foot, .foot, .chip, .lab-phase, .metric-delta')]
      .map(e => e.textContent).filter(t => /[\d%a-z]\u00b7|\u00b7[\dA-Za-z]/.test(t)));
  ok('no text glued to a middot separator', glued.length === 0, JSON.stringify(glued.slice(0, 3)));

  // ---- the hook
  const lab = page.locator('.lab');
  await lab.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  const before = await page.locator('.metric-value').innerText();
  ok('inertia is blank before any assignment', before.trim() === '—', JSON.stringify(before));

  await page.getByRole('button', { name: 'Assign points' }).click();
  await page.waitForTimeout(120);
  const afterAssign = await page.locator('.metric-value').innerText();
  ok('assign produces a number', /^[\d,]+$/.test(afterAssign.trim()), afterAssign);

  await page.getByRole('button', { name: 'Move centroids' }).click();
  await page.waitForTimeout(120);
  const afterUpdate = await page.locator('.metric-value').innerText();
  const num = s => Number(s.replace(/[^\d]/g, ''));
  ok('the update step lowered it', num(afterUpdate) < num(afterAssign), afterAssign + ' -> ' + afterUpdate);

  // preset: trap -> run to end -> 48,720
  await page.getByRole('button', { name: 'Two in the big group' }).click();
  await page.getByRole('button', { name: 'Run to the end' }).click();
  await page.waitForFunction(() => document.querySelector('.lab-phase.done'), null, { timeout: 15000 });
  const trapVal = await page.locator('.metric-value').innerText();
  ok('the trap preset converges to 48,720', num(trapVal) === 48720, trapVal);

  // preset: spread -> run to end -> 26,231
  await page.getByRole('button', { name: 'Spread out' }).click();
  await page.getByRole('button', { name: 'Run to the end' }).click();
  await page.waitForFunction(() => document.querySelector('.lab-phase.done'), null, { timeout: 15000 });
  const goodVal = await page.locator('.metric-value').innerText();
  ok('the spread preset converges to 26,231', num(goodVal) === 26231, goodVal);

  // ---- GEOMETRY CONSISTENCY: rendered centroid == mean of its rendered points
  const geom = await page.evaluate(() => {
    const svg = document.querySelector('.lab svg:not(.strip)');
    const pts = [...svg.querySelectorAll('circle')].filter(c => !c.closest('g.centroid'));
    const groups = new Map();
    for (const c of pts) {
      const f = c.getAttribute('fill');
      if (!groups.has(f)) groups.set(f, []);
      groups.get(f).push({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy') });
    }
    const marks = [...svg.querySelectorAll('g.centroid')].map(g => {
      const dot = g.querySelector('circle[r="1.9"]');
      const path = g.querySelector('path');
      return { fill: path.getAttribute('fill'), x: +dot.getAttribute('cx'), y: +dot.getAttribute('cy') };
    });
    return marks.map(m => {
      const g = groups.get(m.fill) || [];
      const mx = g.reduce((a, p) => a + p.x, 0) / g.length;
      const my = g.reduce((a, p) => a + p.y, 0) / g.length;
      return { fill: m.fill, n: g.length, dx: m.x - mx, dy: m.y - my };
    });
  });
  const worst = Math.max(...geom.map(g => Math.hypot(g.dx, g.dy)));
  ok('rendered centroids sit on the mean of their rendered points', worst < 0.75,
     'worst offset ' + worst.toFixed(3) + 'px  ' + JSON.stringify(geom.map(g => g.n)));

  // The end-to-end version: a rendered point must sit in the cell of its own colour.
  const cellVsPoint = await page.evaluate(() => {
    const svg = document.querySelector('.lab svg:not(.strip)');
    const cells = [...svg.querySelectorAll('path')].filter(p => (p.getAttribute('d') || '').endsWith('Z') && p.getAttribute('stroke-opacity'));
    const pts = [...svg.querySelectorAll('circle')].filter(c => !c.closest('g.centroid'));
    let checked = 0, wrong = 0;
    for (const c of pts) {
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const k = r.width / vb.width;
      const px = r.left + (+c.getAttribute('cx')) * k;
      const py = r.top + (+c.getAttribute('cy')) * k;
      const hit = document.elementsFromPoint(px, py).find(e => cells.includes(e));
      if (!hit) continue;
      checked++;
      if (hit.getAttribute('stroke') !== c.getAttribute('fill')) wrong++;
    }
    return { checked, wrong };
  });
  ok('every point sits inside the cell of its own colour', cellVsPoint.checked > 100 && cellVsPoint.wrong === 0,
     JSON.stringify(cellVsPoint));


  // ---- dragging pushes the objective UP (the article's central claim)
  const box = await page.locator('.lab svg:not(.strip)').boundingBox();
  const cpos = await page.evaluate(() => {
    const svg = document.querySelector('.lab svg:not(.strip)');
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const k = r.width / vb.width;
    const dot = document.querySelectorAll('.lab g.centroid circle[r="1.9"]')[0];
    return { x: r.left + (+dot.getAttribute('cx')) * k, y: r.top + (+dot.getAttribute('cy')) * k };
  });
  const beforeDrag = num(await page.locator('.metric-value').innerText());
  await page.mouse.move(cpos.x, cpos.y);
  await page.mouse.down();
  await page.mouse.move(cpos.x + Math.min(90, box.width * 0.25), cpos.y - 40, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const afterDrag = num(await page.locator('.metric-value').innerText());
  ok('dragging a centroid raises the objective', afterDrag > beforeDrag, beforeDrag + ' -> ' + afterDrag);
  const dragDot = await page.evaluate(() =>
    [...document.querySelectorAll('.lab .strip circle')].slice(-1)[0]?.getAttribute('fill'));
  ok('the drag is recorded in orange on the trace', dragDot === '#ff9900', String(dragDot));

  // ---- choosing k toggle
  await page.locator('.card .pill', { hasText: 'Pure noise' }).click();
  await page.waitForTimeout(150);
  const noiseFoot = await page.locator('.card-foot').innerText();
  ok('the noise toggle reports a silhouette peak at k = 4', /peaks at k = 4/.test(noiseFoot), noiseFoot.trim());
  await page.locator('.card .pill', { hasText: 'Three real groups' }).click();
  await page.waitForTimeout(150);
  const structFoot = await page.locator('.card-foot').innerText();
  ok('the structure toggle reports a peak at k = 3', /peaks at k = 3/.test(structFoot), structFoot.trim());

  // ---- screenshots
  // ---- no negative geometry anywhere, at any scroll position.
  // A measured width arriving as 0 inverts a scale's range and the first
  // symptom is a <rect> with a negative width. Sticky panels do this on the
  // very first layout, so the whole page has to be walked, not just the top.
  {
    const H = await page.evaluate(() => document.body.scrollHeight);
    let bad = [];
    for (let f = 0; f <= 1.0001; f += 0.08) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(90);
      const found = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('rect, circle, line, path')) {
          for (const a of ['width', 'height', 'r']) {
            const v = el.getAttribute(a);
            if (v !== null && Number(v) < 0) out.push(el.tagName + '.' + a + '=' + v);
          }
        }
        return out;
      });
      bad = bad.concat(found);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    ok('no negative width, height or radius anywhere on the page', bad.length === 0,
       [...new Set(bad)].slice(0, 4).join(' | '));
  }

  if (SHOTS) {
    const H = await page.evaluate(() => document.body.scrollHeight);
    const marks = [0, 0.10, 0.22, 0.35, 0.46, 0.58, 0.70, 0.82, 0.93];
    for (let i = 0; i < marks.length; i++) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * marks[i]));
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${SHOTS}/${vp.name}-${String(i).padStart(2, '0')}.png` });
    }
  }

  ok('still no page errors after interaction', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('still no console warnings after interaction', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
console.log('\n' + (failures ? failures + ' BROWSER CHECK(S) FAILED' : 'all browser checks passed') + '\n');
process.exit(failures ? 1 : 0);
