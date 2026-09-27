/*
  The rendering checks for the LightGBM article. Same shape as the k-means one:
  everything here is a thing check-numbers.mjs cannot see, because it is about
  pixels rather than arithmetic.

  The geometry check specific to this article is the cross-panel one. The hook
  draws candidate splits in an upper panel and bin edges in a lower panel from
  the SAME x scale, and every candidate sits exactly on an edge. If the two ever
  disagree, one of the scales has gone stale - which is the failure mode this
  project has hit twice now and which nothing else catches.

  Run against a served production build:

      npm run build
      python3 -m http.server 8765 -d public &
      node verify/check-browser.mjs

  SHOTS=<dir> also writes screenshots. Look at them.
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

  const t0 = Date.now();
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('.lab svg', { timeout: 10000 });
  const paint = Date.now() - t0;
  await page.waitForTimeout(600);

  ok('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('no console warnings', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  ok('the hook is on screen quickly', paint < 4000, paint + ' ms to first chart');

  // The masthead is set in vw units for a reason: a fixed size that suited a
  // seven-letter title gave a twelve-letter one a horizontally scrolling page,
  // and nothing else notices, because the heading overflows the SCREEN rather
  // than any box.
  const hed = await page.evaluate(() => {
    const h = document.querySelector('#intro-hed');
    if (!h) return null;
    // The heading is a block, so its BOX is the container width whatever the
    // text does. Measure the text itself with a Range.
    const range = document.createRange();
    range.selectNodeContents(h);
    const r = range.getBoundingClientRect();
    return { text: h.textContent.trim(), w: Math.round(r.width), vw: window.innerWidth };
  });
  ok('the title text fits the screen', hed && hed.w <= hed.vw - 8,
     hed ? '"' + hed.text + '" renders ' + hed.w + 'px in ' + hed.vw : 'no #intro-hed');

  const katex = await page.evaluate(() => ({
    count: document.querySelectorAll('.katex').length,
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 8),
  }));
  ok('KaTeX rendered', katex.count > 15, katex.count + ' nodes');
  ok('no raw LaTeX reached the DOM', katex.raw.length === 0, katex.raw.join(' '));

  const of = await page.evaluate(() => {
    const bad = [];
    for (const svg of document.querySelectorAll('svg')) {
      const s = svg.getBoundingClientRect();
      const p = svg.parentElement.getBoundingClientRect();
      if (s.width < 2) continue;
      if (s.right > p.right + 1.5 || s.left < p.left - 1.5) {
        bad.push({ w: Math.round(s.width), pw: Math.round(p.width), over: Math.round(s.right - p.right) });
      }
    }
    const spill = [];
    for (const el of document.querySelectorAll('.math-display, .panels, .pair, table.bins')) {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 1) spill.push(el.className + ' right=' + Math.round(r.right));
    }
    return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, bad, spill };
  });
  ok('page does not scroll horizontally', of.sw <= of.iw, of.sw + ' vs ' + of.iw);
  ok('no svg escapes its parent box', of.bad.length === 0, JSON.stringify(of.bad.slice(0, 3)));
  ok('nothing spills past the viewport', of.spill.length === 0, of.spill.slice(0, 3).join(' | '));

  const rows = await page.evaluate(() => {
    const rowOf = (sel, childSel) => [...document.querySelectorAll(sel)].map(c => {
      const kids = [...c.querySelectorAll(childSel)];
      return { n: kids.length, tops: kids.map(k => Math.round(k.getBoundingClientRect().top)),
               parentW: Math.round(c.getBoundingClientRect().width) };
    });
    return { panels: rowOf('.panels', 'svg'), pairs: rowOf('.pair', '.mini') };
  });
  const sameRow = g => g.n >= 2 && Math.max(...g.tops) - Math.min(...g.tops) < 3;
  ok('sweep panels sit side by side', vp.w < 950 || rows.panels.every(sameRow), JSON.stringify(rows.panels));
  ok('needle panels sit side by side', vp.w < 950 || rows.pairs.every(sameRow), JSON.stringify(rows.pairs));
  ok('panels stack on mobile', vp.w > 950 || [...rows.panels, ...rows.pairs].every(g => !sameRow(g)));

  const glued = await page.evaluate(() =>
    [...document.querySelectorAll('.card-foot, .foot, .chart-sub, .stat-note, .table-note, .lab-sub')]
      .map(e => e.textContent).filter(t => /[\d%a-z]·|·[\dA-Za-z]/.test(t)));
  ok('no text glued to a middot separator', glued.length === 0, JSON.stringify(glued.slice(0, 3)));

  // ---- the hook
  await page.locator('.lab').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const readout = async () => page.evaluate(() =>
    [...document.querySelectorAll('.lab .stat')].map(s => ({
      label: s.querySelector('.stat-label').textContent.trim(),
      value: s.querySelector('.stat-value').textContent.trim(),
      note: s.querySelector('.stat-note').textContent.trim(),
    })));

  const at255 = await readout();
  ok('the slider starts at max_bin = 255',
     (await page.locator('.binval').innerText()).trim() === '255');
  ok('254 candidates at 255 bins', at255[0].value === '254', JSON.stringify(at255[0]));
  ok('99.90% of the best gain', at255[1].value === '99.90%', JSON.stringify(at255[1]));

  // CROSS-PANEL GEOMETRY: every candidate dot must sit on a bin-edge line.
  const geom = await page.evaluate(() => {
    const svg = document.querySelector('.lab svg');
    const cands = [...svg.querySelectorAll('circle')].map(c => +c.getAttribute('cx'));
    const edges = [...svg.querySelectorAll('line.edge')].map(l => +l.getAttribute('x1'));
    const missed = cands.filter(cx => !edges.some(e => Math.abs(e - cx) < 0.02));
    return { cands: cands.length, edges: edges.length, missed: missed.length };
  });
  ok('every candidate dot sits on a bin edge in the panel below',
     geom.cands > 100 && geom.missed <= 1, JSON.stringify(geom));

  await page.locator('#binslider').fill('0');
  await page.waitForTimeout(200);
  const at2 = await readout();
  ok('one candidate at 2 bins', at2[0].value === '1', JSON.stringify(at2[0]));
  ok('and only 68.30% of the gain', at2[1].value === '68.30%', JSON.stringify(at2[1]));
  ok('the gain readout warns when it is bad',
     await page.locator('.stat-value.warn').count() === 1);
  await page.locator('#binslider').fill('7');
  await page.waitForTimeout(200);

  // ---- the leaf-floor selector
  await page.locator('.card').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const foot20 = await page.locator('.card-foot').innerText();
  ok('the sweep card starts at min_data_in_leaf = 20', /min_data_in_leaf = 20/.test(foot20), foot20.trim());
  ok('...and names 255 bins as the answer there', /\b255\b/.test(foot20));
  await page.locator('.card .toggle .pill', { hasText: '250' }).click();
  await page.waitForTimeout(200);
  const foot250 = await page.locator('.card-foot').innerText();
  ok('a looser floor names a smaller bin count', /min_data_in_leaf = 250/.test(foot250) && /\b64\b/.test(foot250),
     foot250.trim());
  await page.locator('.card .toggle .pill', { hasText: '20' }).first().click();

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
    for (const [i, f] of [0, 0.09, 0.20, 0.31, 0.42, 0.53, 0.64, 0.75, 0.88].entries()) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${SHOTS}/lgbm-${vp.name}-${String(i).padStart(2, '0')}.png` });
    }
    await page.locator('.lab').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.locator('.lab').screenshot({ path: `${SHOTS}/lgbm-hook-${vp.name}.png` });
    await page.locator('.card').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.locator('.card').screenshot({ path: `${SHOTS}/lgbm-sweep-${vp.name}.png` });
  }

  ok('still no page errors after interaction', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('still no console warnings after interaction', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
console.log('\n' + (failures ? failures + ' BROWSER CHECK(S) FAILED' : 'all browser checks passed') + '\n');
process.exit(failures ? 1 : 0);
