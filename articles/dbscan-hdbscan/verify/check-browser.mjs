/*
  The rendering checks. Everything here is something check-numbers.mjs cannot
  see, because it is about pixels rather than algebra.

  The article-specific geometry checks are the point of the file:

    1. Every ping the model put in cluster c must be drawn INSIDE the region
       path for cluster c, tested with isPointInFill on the real path geometry,
       and inside no other cluster's. That is the algorithm's central object -
       a cluster is everywhere within eps of a core ping - and checking it on
       screen runs the labels, the core distances, the region construction and
       the plot transform through one assertion.

    2. Both axes are metres and both are drawn at the same scale. Fifty metres
       east and fifty metres north must be the same number of pixels. Stretch
       one and the picture is showing a geometry the algorithm is not using.

    3. The tree and the map beside it must agree: the number of branches the
       cut line crosses is the number of regions drawn. Two panels, two code
       paths, one number.

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
  await page.waitForSelector('.lab svg', { timeout: 20000 });
  const paint = Date.now() - t0;
  await page.waitForTimeout(700);

  ok('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('no console warnings', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  ok('the hook is on screen quickly', paint < 9000, paint + ' ms');

  // The masthead is sized in vw for a reason: a fixed size chosen for a short
  // title gives a long one a horizontally scrolling page, and nothing else
  // notices, because the heading overflows the SCREEN rather than any box.
  const hed = await page.evaluate(() => {
    const h = document.querySelector('#intro-hed');
    if (!h) return null;
    const r = document.createRange();
    r.selectNodeContents(h);
    const b = r.getBoundingClientRect();
    return { text: h.textContent.trim(), w: Math.round(b.width), vw: window.innerWidth };
  });
  ok('the title text fits the screen', hed && hed.w <= hed.vw - 8,
     hed ? '"' + hed.text + '" renders ' + hed.w + 'px in ' + hed.vw : 'no #intro-hed');

  const katex = await page.evaluate(() => ({
    count: document.querySelectorAll('.katex').length,
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 8),
  }));
  ok('KaTeX rendered', katex.count > 5, katex.count + ' nodes');
  ok('no raw LaTeX reached the DOM', katex.raw.length === 0, katex.raw.join(' '));

  const of = await page.evaluate(() => {
    const bad = [];
    for (const svg of document.querySelectorAll('svg')) {
      const s = svg.getBoundingClientRect();
      const p = svg.parentElement.getBoundingClientRect();
      if (s.width < 2) continue;
      if (s.right > p.right + 1.5 || s.left < p.left - 1.5) bad.push(svg.getAttribute('class') + ' by ' + Math.round(s.right - p.right));
    }
    const spill = [];
    for (const el of document.querySelectorAll('.eq, .card, .chart-box, .legend, .tablewrap, .grid-row, .panes')) {
      if (el.getBoundingClientRect().right > window.innerWidth + 1) spill.push(el.className);
    }
    // Name the offenders. "the page is 93px too wide" is a fact; "this element
    // is 93px too wide" is a fix.
    const over = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1) continue;
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        over.push(el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className : '?').split(' ')[0] +
                  ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      }
    }
    return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, bad, spill, over: [...new Set(over)].slice(0, 8) };
  });
  ok('page does not scroll horizontally', of.sw <= of.iw, of.sw + ' vs ' + of.iw + (of.over.length ? '  offenders: ' + of.over.join(' | ') : ''));
  ok('no svg escapes its parent box', of.bad.length === 0, JSON.stringify(of.bad.slice(0, 3)));
  ok('nothing spills past the viewport', of.spill.length === 0, of.spill.slice(0, 3).join(' | '));

  const glued = await page.evaluate(() =>
    [...document.querySelectorAll('.readout, .sub, .cap, .foot, .chart-sub, .blurb, .note, .tnote, .crossed, .sublabel, .ptitle, .title')]
      .map(e => e.textContent).filter(t => /[\d%]·|·[\dA-Za-z]|\d[a-z]{4,}/.test(t)));
  ok('no text glued to a separator or a word', glued.length === 0, JSON.stringify(glued.slice(0, 3)));

  /* ================= the hook ================= */
  await page.locator('.lab').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // Both axes are metres. Fifty metres east and fifty metres north have to be
  // the same number of pixels or the map is lying about distance.
  const aspect = await page.evaluate(() => {
    const svg = document.querySelector('.lab .wrap svg');
    const ts = [...svg.querySelectorAll('text.tick')];
    const xs = ts.filter(t => t.getAttribute('text-anchor') === 'middle').map(t => +t.getAttribute('x'));
    const ys = ts.filter(t => t.getAttribute('text-anchor') === 'end').map(t => +t.getAttribute('y'));
    xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
    return { dx: xs[1] - xs[0], dy: ys[1] - ys[0] };
  });
  ok('fifty metres east is the same length as fifty metres north',
     Math.abs(aspect.dx / aspect.dy - 1) < 0.01, aspect.dx.toFixed(2) + 'px vs ' + aspect.dy.toFixed(2) + 'px');

  /*
    The check that pays for this file. Every drawn ping that is in a cluster
    must fall inside that cluster's region path and outside every other one.
  */
  const membership = (root) => page.evaluate((sel) => {
    const svg = document.querySelector(sel);
    const regions = [...svg.querySelectorAll('path.region')];
    const pings = [...svg.querySelectorAll('circle.ping')];
    if (!regions.length) return { regions: 0, tested: 0, outside: -1, wrong: -1, noise: 0 };
    const pt = svg.createSVGPoint();
    const inside = (path, c) => { pt.x = +c.getAttribute('cx'); pt.y = +c.getAttribute('cy'); return path.isPointInFill(pt); };
    let tested = 0, outside = 0, wrong = 0, noise = 0;
    for (const c of pings) {
      const isNoise = c.classList.contains('noise');
      if (isNoise) { noise++; continue; }
      tested++;
      const hits = regions.filter(r => inside(r, c));
      if (hits.length === 0) outside++;
      else if (hits.length > 1) wrong++;
    }
    return { regions: regions.length, tested, outside, wrong, noise };
  }, root);

  const m0 = await membership('.lab .wrap svg');
  ok('every clustered ping is drawn inside a cluster region', m0.outside === 0,
     m0.outside + ' of ' + m0.tested + ' outside, over ' + m0.regions + ' regions');
  ok('...and inside exactly one of them', m0.wrong === 0, m0.wrong + ' in two regions at once');
  ok('the noise pings are drawn too', m0.noise > 0, m0.noise + ' noise pings');

  const strip = () => page.evaluate(() => {
    const svg = document.querySelector('.lab svg.strip');
    const cursor = svg.querySelector('line.cursor');
    const dot = svg.querySelector('circle.cursordot');
    const steps = svg.querySelector('path.steps').getAttribute('d');
    /* One continuous staircase: a single M followed by a run of L. The treads
       are the consecutive pairs with equal y; the risers are the pairs with
       equal x. Find the tread the cursor is standing on. */
    const nums = steps.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      if (Math.abs(pts[i].y - pts[i - 1].y) < 1e-6 && pts[i].x > pts[i - 1].x)
        segs.push({ x1: pts[i - 1].x, y1: pts[i - 1].y, x2: pts[i].x, y2: pts[i].y });
    }
    const cx = +cursor.getAttribute('x1');
    const hit = segs.find(s => cx >= s.x1 - 0.6 && cx <= s.x2 + 0.6);
    return {
      bands: svg.querySelectorAll('rect.band').length,
      bandW: [...svg.querySelectorAll('rect.band')].reduce((a, r) => a + +r.getAttribute('width'), 0),
      dotY: +dot.getAttribute('cy'), segY: hit ? hit.y1 : null,
      readout: document.querySelector('.lab .readout').textContent.trim(),
      good: document.querySelector('.lab .readout').classList.contains('good'),
      nseg: segs.length, badD: /undefined|NaN/.test(steps),
    };
  });

  const s0 = await strip();
  ok('the sweep strip draws a tread per distinct clustering', s0.nseg > 100, s0.nseg + ' treads');
  ok('the strip path has no NaN or undefined in it', !s0.badD);
  ok('the cursor dot sits on the step the cursor is over', s0.segY !== null && Math.abs(s0.dotY - s0.segY) < 0.6,
     'dot ' + s0.dotY.toFixed(1) + ' vs step ' + (s0.segY === null ? 'none' : s0.segY.toFixed(1)));
  ok('the first day has a band where every stop is found', s0.bandW > 5, s0.bandW.toFixed(0) + 'px over ' + s0.bands + ' bands');

  // Switch to the café day. The band must vanish - that is the article.
  await page.locator('.lab .pill', { hasText: 'Café' }).click();
  await page.waitForTimeout(400);
  const s1 = await strip();
  ok('on the café day the band is EMPTY, at the default minPts', s1.bandW === 0,
     s1.bandW + 'px — "' + s1.readout + '"');
  ok('...and the readout says so', !s1.good, s1.readout);

  // And at every other minPts the lab offers.
  let anyBand = 0;
  for (const m of ['4', '12', '20']) {
    await page.locator('.lab .pills.small .pill', { hasText: new RegExp('^' + m + '$') }).click();
    await page.waitForTimeout(300);
    const s = await strip();
    if (s.bandW > 0) anyBand++;
  }
  ok('nor at any minPts the lab offers', anyBand === 0, anyBand + ' values of minPts with a band');

  await page.locator('.lab .reset').click();
  await page.waitForTimeout(350);
  const s2 = await strip();
  ok('reset puts the lab back where it started, dataset and minPts included',
     s2.bandW > 5 && s2.readout === s0.readout, '"' + s2.readout + '"');

  // Drag the strip: the readout has to change, and the geometry has to hold.
  const box = await page.locator('.lab svg.strip').boundingBox();
  await page.mouse.move(box.x + box.width * 0.12, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.5, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(350);
  const s3 = await strip();
  const m1 = await membership('.lab .wrap svg');
  ok('dragging the strip changes the answer', s3.readout !== s2.readout, s3.readout);
  ok('and the regions still contain their own pings and nobody else\'s',
     m1.outside === 0 && m1.wrong === 0, m1.outside + ' outside, ' + m1.wrong + ' shared');

  /* ================= the tree ================= */
  const treeCard = page.locator('.body-header', { hasText: 'The sweep is a tree' });
  await treeCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  const tree = () => page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')];
    const card = cards.find(c => c.querySelector('svg .branch'));
    if (!card) return null;
    const hits = card.querySelectorAll('circle.hit').length;
    const regions = card.querySelectorAll('path.region').length;
    const branches = [...card.querySelectorAll('line.branch')];
    const on = branches.filter(b => b.classList.contains('on')).length;
    const cut = card.querySelector('line.cut');
    const cy = +cut.getAttribute('y1');
    // Every "on" branch must actually span the cut line - with a dead zone,
    // because the class is decided in metres and this is decided in pixels,
    // and within a pixel of a branch's end the two cannot be expected to
    // agree. Half a pixel is well below anything a reader can see.
    let bad = 0, skipped = 0;
    for (const b of branches) {
      const y1 = Math.min(+b.getAttribute('y1'), +b.getAttribute('y2'));
      const y2 = Math.max(+b.getAttribute('y1'), +b.getAttribute('y2'));
      if (Math.abs(cy - y1) < 0.75 || Math.abs(cy - y2) < 0.75) { skipped++; continue; }
      const spans = cy > y1 && cy < y2;
      if (spans !== b.classList.contains('on')) bad++;
    }
    return { hits, regions, on, bad, skipped, branches: branches.length, readout: card.querySelector('.readout').textContent.trim() };
  });
  const t1 = await tree();
  ok('the tree figure is on the page', t1 !== null && t1.branches > 3, t1 ? t1.branches + ' branches' : 'missing');
  ok('a branch is highlighted exactly when the cut line crosses it', t1.bad === 0,
     t1.bad + ' disagreements, ' + t1.skipped + ' within half a pixel of the cut');
  ok('the branches crossed and the regions on the map beside it are the same number',
     t1.hits === t1.regions, t1.hits + ' crossed, ' + t1.regions + ' regions');
  ok('and the marker dots sit on the crossed branches', t1.hits === t1.on, t1.hits + ' dots, ' + t1.on + ' highlighted');

  // Drag the cut and re-check the agreement.
  const tbox = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')];
    const card = cards.find(c => c.querySelector('svg .branch'));
    const svg = card.querySelector('svg');
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y0: r.top + r.height * 0.35, y1: r.top + r.height * 0.72 };
  });
  await page.mouse.move(tbox.x, tbox.y0);
  await page.mouse.down();
  await page.mouse.move(tbox.x, tbox.y1, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(350);
  const t2 = await tree();
  ok('dragging the cut keeps the two panels agreeing', t2.hits === t2.regions && t2.bad === 0,
     t2.hits + ' crossed, ' + t2.regions + ' regions, ' + t2.bad + ' mismatched branches');

  /* ================= the condensed tree ================= */
  await page.locator('.body-header', { hasText: 'Cut every branch' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const cond = () => page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')];
    const card = cards.find(c => c.querySelector('path.rib'));
    if (!card) return null;
    const sel = [...card.querySelectorAll('path.rib.sel')];
    const cuts = [...card.querySelectorAll('line.cut')];
    const ribs = [...card.querySelectorAll('path.rib')];
    const pts = [...card.querySelectorAll('circle.ping')];
    const fills = new Set(pts.map(p => p.getAttribute('fill')).filter(f => f !== '#8a94a2'));
    const cutYs = cuts.map(c => +c.getAttribute('y1'));
    return {
      sel: sel.length, cuts: cuts.length, ribs: ribs.length,
      spread: cuts.length > 1 ? Math.max(...cutYs) - Math.min(...cutYs) : 0,
      pointColours: fills.size,
      badD: ribs.some(r => /undefined|NaN/.test(r.getAttribute('d'))),
      closed: ribs.every(r => /Z\s*$/.test(r.getAttribute('d'))),
      readout: card.querySelector('.readout').textContent.trim(),
    };
  });
  const c1 = await cond();
  ok('the condensed tree draws a ribbon per branch and fills the selected ones',
     c1 && c1.ribs > 3 && c1.sel >= 2, c1 ? c1.ribs + ' ribbons, ' + c1.sel + ' selected' : 'missing');
  ok('one cut marker per selected branch', c1.cuts === c1.sel, c1.cuts + ' cuts, ' + c1.sel + ' selected');
  ok('the cuts are NOT at one height — which is the entire point of the figure', c1.spread > 4,
     c1.spread.toFixed(1) + 'px apart');
  ok('the map beside it colours the pings by cluster', c1.pointColours === c1.sel,
     c1.pointColours + ' colours for ' + c1.sel + ' clusters');
  ok('every ribbon path is closed and free of NaN', c1.closed && !c1.badD);

  /*
    Moving min_cluster_size has to do something to the tree and, on this day,
    nothing to the answer - that IS the claim the verdict section makes, so it
    is the claim to check rather than "the widget responds".
  */
  const slider = page.locator('input[aria-label="min_cluster_size, in pings"]');
  await slider.focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  const c2 = await cond();
  ok('doubling min_cluster_size leaves the answer alone, which is what the verdict section claims',
     c2.readout === c1.readout, '"' + c2.readout + '"');
  for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  const c3 = await cond();
  ok('...but pushing it to the top of the range does prune the tree', c3.ribs < c1.ribs,
     c1.ribs + ' ribbons -> ' + c3.ribs + ', ' + c1.sel + ' clusters -> ' + c3.sel);
  ok('...and the ribbons stay well formed throughout',
     c2.closed && !c2.badD && c2.cuts === c2.sel && c3.closed && !c3.badD && c3.cuts === c3.sel);

  /* ================= the shuffle ================= */
  await page.locator('.sub-header', { hasText: "isn't deterministic" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => document.querySelector('.card .go').parentElement.querySelector('.readout').textContent.trim());
  let moved = false;
  for (let i = 0; i < 8 && !moved; i++) {
    await page.locator('.card .go', { hasText: 'shuffle' }).click();
    await page.waitForTimeout(160);
    const now = await page.evaluate(() => document.querySelector('.card .go').parentElement.querySelector('.readout').textContent.trim());
    if (/different cluster/.test(now)) moved = true;
  }
  ok('shuffling the rows really does move pings between clusters, in the browser', moved,
     await page.evaluate(() => document.querySelector('.card .go').parentElement.querySelector('.readout').textContent.trim()));
  ok('it started from the unshuffled run', /Press the button/.test(before), before);

  /* ================= small multiples ================= */
  const cells = await page.evaluate(() => {
    const row = document.querySelector('.grid-row');
    if (!row) return null;
    const cs = [...row.querySelectorAll('.cell')];
    return { n: cs.length, tops: cs.map(c => Math.round(c.getBoundingClientRect().top)),
             titles: cs.map(c => c.querySelector('.ptitle').textContent.trim()),
             paths: cs.map(c => c.querySelector('path.band').getAttribute('d')) };
  });
  ok('the window chart draws one panel per day', cells && cells.n === 3, cells ? cells.titles.join(' | ') : 'missing');
  ok('the three panels sit on one row at desktop',
     vp.w < 950 || (Math.max(...cells.tops) - Math.min(...cells.tops) < 3), JSON.stringify(cells.tops));
  ok('...and stack on mobile',
     vp.w > 950 || (Math.max(...cells.tops) - Math.min(...cells.tops) > 40), JSON.stringify(cells.tops));
  ok('no panel path has NaN in it', cells.paths.every(d => !/undefined|NaN/.test(d)));

  /* ================= the modes figure ================= */
  await page.locator('.sub-header', { hasText: 'split a single hill' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const modes = () => page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')];
    const card = cards.find(c => c.querySelector('path.prof'));
    if (!card) return null;
    const t = card.querySelector('.ptitle').textContent.trim();
    const dip = card.querySelector('circle.dip');
    const prof = card.querySelector('path.prof').getAttribute('d');
    return { title: t, dipY: +dip.getAttribute('cy'), badD: /undefined|NaN/.test(prof),
             pts: card.querySelectorAll('circle.pt').length };
  });
  const md1 = await modes();
  ok('the modes figure draws its cloud and its profile', md1 && md1.pts > 100 && !md1.badD,
     md1 ? md1.pts + ' points, "' + md1.title + '"' : 'missing');
  const sep = page.locator('input[aria-label*="separation"]');
  await sep.focus();
  for (let i = 0; i < 15; i++) await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  const md2 = await modes();
  ok('sliding the separation down turns two modes back into one',
     /one mode/.test(md2.title) && md2.dipY <= md1.dipY, '"' + md2.title + '" (was "' + md1.title + '")');

  /* ============= nothing drawn outside its own svg, anywhere ============= */
  const spilled = await page.evaluate(() => {
    const out = [];
    for (const svg of document.querySelectorAll('svg')) {
      const b = svg.getBoundingClientRect();
      if (b.width < 40) continue;
      for (const el of svg.querySelectorAll('line, circle, rect, path, text')) {
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
  ok('nothing is drawn outside its own svg', spilled.length === 0, spilled.slice(0, 5).join(' | '));

  /* ============= no negative geometry, anywhere, at any scroll ============= */
  {
    const H = await page.evaluate(() => document.body.scrollHeight);
    let bad = [];
    for (let f = 0; f <= 1.0001; f += 0.04) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(70);
      bad = bad.concat(await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('rect, circle, line, path')) {
          for (const a of ['width', 'height', 'r']) {
            const v = el.getAttribute(a);
            if (v !== null && Number(v) < 0) out.push(el.tagName + '.' + a + '=' + v);
          }
          const d = el.getAttribute('d');
          if (d && /undefined|NaN/.test(d)) out.push(el.tagName + '.d has ' + (d.match(/undefined|NaN/) || [])[0]);
        }
        return out;
      }));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    ok('no negative width, height or radius, and no NaN path, anywhere', bad.length === 0,
       [...new Set(bad)].slice(0, 4).join(' | '));
  }

  /*
    The walkthrough's chart is sticky. On a phone the steps and the chart are
    in one column, and if the chart is laid out after them it is below the
    viewport for the whole section and the reader scrolls through five steps of
    prose about a picture they cannot see. Nothing else here would catch that.
  */
  {
    const box = await page.evaluate(() => {
      const sec = document.querySelector('.side-section');
      const r = sec.getBoundingClientRect();
      return { top: r.top + window.scrollY, h: r.height };
    });
    let unseen = 0, tried = 0;
    const over = [];
    for (const f of [0.2, 0.4, 0.6, 0.8]) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(box.top + box.h * f));
      await page.waitForTimeout(220);
      tried++;
      const vis = await page.evaluate(() => {
        const svg = document.querySelector('.sticky-container svg');
        if (!svg) return false;
        const r = svg.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight && r.height > 80;
      });
      if (!vis) unseen++;
      /* And nothing may be PAINTED over it. Getting the chart on screen by
         putting it first in the column is half the fix; the other half is that
         the step cards have to pass behind it rather than across it, which no
         geometric test would notice because they are supposed to overlap. */
      const covered = await page.evaluate(() => {
        const svg = document.querySelector('.sticky-container svg');
        if (!svg) return 'no chart';
        const r = svg.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= window.innerHeight) return null;
        for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.35], [0.75, 0.65]]) {
          const x = r.left + r.width * fx;
          const y = Math.min(window.innerHeight - 2, Math.max(2, r.top + r.height * fy));
          const el = document.elementFromPoint(x, y);
          if (el && !el.closest('.sticky-container')) return el.className || el.tagName;
        }
        return null;
      });
      if (covered) over.push(covered);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    ok('the walkthrough chart is on screen throughout the walkthrough', unseen === 0,
       unseen + ' of ' + tried + ' scroll positions with the chart off screen');
    ok('...and nothing is painted over it', over.length === 0,
       [...new Set(over)].slice(0, 3).join(' | '));
    // Its opaque backing has to reach both edges, or a strip of the card
    // behind shows down the side of the chart.
    const band = await page.evaluate(() => {
      const r = document.querySelector('.sticky-container').getBoundingClientRect();
      return { w: Math.round(r.width), vw: window.innerWidth };
    });
    ok('the chart\'s backing spans the column', vp.w > 950 || band.w >= band.vw - 2,
       band.w + 'px of ' + band.vw);
  }

  if (SHOTS) {
    // Reload first: the shots are the record of what the page LOOKS like, and
    // by this point the checks have dragged half of it somewhere else.
    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('.lab svg', { timeout: 20000 });
    await page.waitForTimeout(700);
    const H = await page.evaluate(() => document.body.scrollHeight);
    const fs = [0, 0.05, 0.10, 0.16, 0.22, 0.28, 0.34, 0.40, 0.46, 0.52, 0.58, 0.64, 0.70, 0.76, 0.82, 0.88, 0.94];
    for (const [i, f] of fs.entries()) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${SHOTS}/db-${vp.name}-${String(i).padStart(2, '0')}.png` });
    }
    for (const [name, sel] of [
      ['hook', '.lab .card'],
      ['tree', '.card:has(svg .branch)'],
      ['cond', '.card:has(path.rib)'],
      ['modes', '.card:has(path.prof)'],
      ['elbow', '.card:has(path.curve)'],
      ['gaps', '.rowwrap'],
      ['verdict', '.card:has(rect.track)'],
    ]) {
      try {
        const el = page.locator(sel).first();
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(320);
        await el.screenshot({ path: `${SHOTS}/db-${name}-${vp.name}.png` });
      } catch (e) { console.log('       (no shot for ' + name + ': ' + e.message.split('\n')[0] + ')'); }
    }
  }

  ok('still no page errors after interaction', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('still no console warnings after interaction', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
console.log('\n' + (failures ? failures + ' BROWSER CHECK(S) FAILED' : 'all browser checks passed') + '\n');
process.exit(failures ? 1 : 0);
