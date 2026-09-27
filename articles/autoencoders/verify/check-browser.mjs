/*
  The rendering checks for the autoencoders article. Everything here is a thing
  check-numbers.mjs cannot see, because it is about pixels rather than algebra.

  The geometry check specific to this article is the strongest one in the
  project so far: EVERY reconstruction circle must lie on the line through the
  origin and the decoder handle, because that is the article's opening claim -
  a one-unit bottleneck can only produce multiples of one vector. It is checked
  in rendered pixels, so it exercises the plot transform, the reactivity of the
  encoder solve, and the drag handler all at once.

  Run against a served production build:

      npm run build
      python3 -m http.server 8767 -d public &
      node verify/check-browser.mjs

  Needs Playwright. SHOTS=<dir> also writes screenshots. Look at them.
*/
import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const BASE = process.env.BASE || 'http://127.0.0.1:8767';
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
  await page.waitForTimeout(500);

  ok('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('no console warnings', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  ok('the hook is on screen quickly', paint < 4000, paint + ' ms');

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
      if (s.right > p.right + 1.5 || s.left < p.left - 1.5) bad.push(Math.round(s.right - p.right));
    }
    const spill = [];
    for (const el of document.querySelectorAll('.math-display, .pair, .losses')) {
      if (el.getBoundingClientRect().right > window.innerWidth + 1) spill.push(el.className);
    }
    return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, bad, spill };
  });
  ok('page does not scroll horizontally', of.sw <= of.iw, of.sw + ' vs ' + of.iw);
  ok('no svg escapes its parent box', of.bad.length === 0, JSON.stringify(of.bad.slice(0, 3)));
  ok('nothing spills past the viewport', of.spill.length === 0, of.spill.slice(0, 3).join(' | '));

  // Nothing may be DRAWN outside the svg that contains it. An outer <svg> clips
  // visually, so a line running off the chart looks fine and still widens the
  // document - which is how a 41px horizontal scroll appeared on mobile here.
  const spilled = await page.evaluate(() => {
    const out = [];
    for (const svg of document.querySelectorAll('svg')) {
      const b = svg.getBoundingClientRect();
      if (b.width < 40) continue;
      for (const el of svg.querySelectorAll('line, circle, rect, path')) {
        const r = el.getBoundingClientRect();
        if (r.width < 0.5 && r.height < 0.5) continue;
        if (r.right > b.right + 2 || r.left < b.left - 2 || r.bottom > b.bottom + 2 || r.top < b.top - 2) {
          out.push(el.tagName + '.' + (el.getAttribute('class') || '?') + ' by ' +
                   Math.round(Math.max(r.right - b.right, b.left - r.left, r.bottom - b.bottom, b.top - r.top)) + 'px');
        }
      }
    }
    return [...new Set(out)];
  });
  ok('nothing is drawn outside its own svg', spilled.length === 0, spilled.slice(0, 4).join(' | '));

  const rows = await page.evaluate(() => {
    const rowOf = (sel, kid) => [...document.querySelectorAll(sel)].map(c => {
      const k = [...c.querySelectorAll(kid)];
      return { n: k.length, tops: k.map(x => Math.round(x.getBoundingClientRect().top)) };
    });
    return { pairs: rowOf('.pair', '.mini'), losses: rowOf('.losses', '.loss-item') };
  });
  const sameRow = g => g.n >= 2 && Math.max(...g.tops) - Math.min(...g.tops) < 3;
  ok('latent panels sit side by side', vp.w < 950 || rows.pairs.every(sameRow), JSON.stringify(rows.pairs));
  ok('latent panels stack on mobile', vp.w > 950 || rows.pairs.every(g => !sameRow(g)));

  const glued = await page.evaluate(() =>
    [...document.querySelectorAll('.stat-note, .foot, .chip, .lab-sub, .chart-sub, .mini-label')]
      .map(e => e.textContent).filter(t => /[\d%°]·|·[\dA-Za-z]|\d[a-z]{3,}/.test(t)));
  ok('no text glued to a separator', glued.length === 0, JSON.stringify(glued.slice(0, 3)));

  // ---- the hook
  await page.locator('.lab').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const readout = () => page.evaluate(() =>
    [...document.querySelectorAll('.lab .stat')].map(s => s.querySelector('.stat-value').textContent.trim()));

  const before = await readout();
  ok('the error readout starts above the optimum', Number(before[0]) > 0.9, JSON.stringify(before));

  // THE GEOMETRY CHECK: every reconstruction must lie on the decoder's line.
  const online = await page.evaluate(() => {
    const svg = document.querySelector('.lab svg');
    const w2 = svg.querySelector('line.w2');
    const ox = +w2.getAttribute('x1'), oy = +w2.getAttribute('y1');
    const hx = +w2.getAttribute('x2'), hy = +w2.getAttribute('y2');
    const ux = hx - ox, uy = hy - oy;
    const L = Math.hypot(ux, uy);
    const recon = [...svg.querySelectorAll('circle')].filter(c => c.getAttribute('fill') === 'none');
    let worst = 0;
    for (const c of recon) {
      const dx = +c.getAttribute('cx') - ox, dy = +c.getAttribute('cy') - oy;
      worst = Math.max(worst, Math.abs(dx * uy - dy * ux) / L);
    }
    return { n: recon.length, worst };
  });
  ok('every reconstruction lies on the decoder line', online.n > 100 && online.worst < 0.5,
     online.n + ' points, worst off-line distance ' + online.worst.toFixed(4) + 'px');

  // doubling the decoder must not move any displayed digit of the error
  await page.getByRole('button', { name: 'Double the decoder' }).click();
  await page.waitForTimeout(150);
  const after = await readout();
  ok('doubling the decoder leaves the error readout identical', after[0] === before[0],
     before[0] + ' -> ' + after[0]);
  ok('...and does change the reported decoder length', after[2] !== before[2],
     before[2] + ' -> ' + after[2]);

  /*
    Train from the DOUBLED decoder on purpose. The curvature of this loss in the
    encoder scales with |w2|^2, and with a fixed step size this exact sequence -
    double, then train - sent every readout to NaN and left it there. The step
    is backtracked now; this is the check that says so.
  */
  // train to the optimum and check it lands on PCA's answer
  await page.getByRole('button', { name: 'Train both by gradient descent' }).click();
  await page.waitForFunction(() => {
    const v = document.querySelectorAll('.lab .stat-value')[1];
    return v && parseFloat(v.textContent) < 0.5;
  }, null, { timeout: 40000 });
  await page.waitForTimeout(400);
  const trained = await readout();
  ok('training from a doubled decoder does not diverge', trained.every(v => !/NaN/.test(v)), JSON.stringify(trained));
  ok('training lands on the best possible error', Math.abs(Number(trained[0]) - 0.874) < 0.002, trained[0]);
  ok('...pointing along the first principal direction', parseFloat(trained[1]) < 0.6, trained[1]);

  await page.getByRole('button', { name: 'Reset' }).click();
  await page.waitForTimeout(150);

  // ---- the latent comparison
  await page.locator('.card').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const readPanels = () => page.evaluate(() =>
    [...document.querySelectorAll('.card .mini')].map(m => ({
      label: m.querySelector('.mini-label').textContent.trim(),
      first: m.querySelector('svg circle') ? m.querySelector('svg circle').getAttribute('cx') : null,
      n: m.querySelectorAll('svg circle').length,
    })));
  const p11 = await readPanels();
  await page.locator('.card .controls .pill', { hasText: '12' }).click();
  await page.waitForTimeout(200);
  const p12 = await readPanels();
  ok('changing the seed changes the autoencoder panel', p11[1].first !== p12[1].first,
     p11[1].first + ' -> ' + p12[1].first);
  ok('...and leaves the PCA panel exactly where it was', p11[0].first === p12[0].first);
  ok('both panels draw all the rows', p11[0].n > 300 && p11[1].n > 300, p11.map(p => p.n).join('/'));
  await page.locator('.card .controls .pill', { hasText: '+ L2' }).click();
  await page.waitForTimeout(200);
  const pL2 = await readPanels();
  ok('the L2 toggle relabels the autoencoder panel', /L2/.test(pL2[1].label), pL2[1].label);

  // ---- no negative geometry anywhere, at any scroll position
  {
    const H = await page.evaluate(() => document.body.scrollHeight);
    let bad = [];
    for (let f = 0; f <= 1.0001; f += 0.08) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(90);
      bad = bad.concat(await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('rect, circle, line, path')) {
          for (const a of ['width', 'height', 'r']) {
            const v = el.getAttribute(a);
            if (v !== null && Number(v) < 0) out.push(el.tagName + '.' + a + '=' + v);
          }
        }
        return out;
      }));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    ok('no negative width, height or radius anywhere on the page', bad.length === 0,
       [...new Set(bad)].slice(0, 4).join(' | '));
  }

  if (SHOTS) {
    const H = await page.evaluate(() => document.body.scrollHeight);
    for (const [i, f] of [0, 0.09, 0.19, 0.30, 0.41, 0.52, 0.63, 0.75, 0.88].entries()) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${SHOTS}/ae-${vp.name}-${String(i).padStart(2, '0')}.png` });
    }
    await page.locator('.lab').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.locator('.lab').screenshot({ path: `${SHOTS}/ae-hook-${vp.name}.png` });
    await page.locator('.card').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.locator('.card').screenshot({ path: `${SHOTS}/ae-latent-${vp.name}.png` });
  }

  ok('still no page errors after interaction', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('still no console warnings after interaction', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
console.log('\n' + (failures ? failures + ' BROWSER CHECK(S) FAILED' : 'all browser checks passed') + '\n');
process.exit(failures ? 1 : 0);
