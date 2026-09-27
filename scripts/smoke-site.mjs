#!/usr/bin/env node
/*
  smoke-site.mjs — load every published page and refuse a blank one.

  usage:  node scripts/smoke-site.mjs [slug ...]

  Serves site/ on a local port, opens each article listed in site/articles.json
  (or only the slugs given) in headless Chromium at 390px and 1280px, and fails if
  the page throws on load or renders less than 400 characters of text.

  It exists because two articles, cost-curves and monopolistic-competition,
  were published as blank pages. Each passed its own ship.sh, because ship.sh
  never loads the page, and nothing between the build and the push did either.
  build-site.sh runs this after assembling site/, so a page that crashes on
  load stops the publish instead of reaching a reader.

  Needs Playwright with Chromium. If it is missing:
    npm i -g playwright && npx playwright install chromium
*/
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");
const manifest = JSON.parse(readFileSync(join(SITE, "articles.json"), "utf8"));
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : manifest.map((a) => a.slug);

async function loadPlaywright() {
  try { return await import("playwright"); } catch {}
  try {
    const g = execSync("npm root -g", { encoding: "utf8" }).trim();
    return await import(pathToFileURL(join(g, "playwright", "index.mjs")).href);
  } catch {}
  console.error("\x1b[31m  smoke test: Playwright not found.\x1b[0m  npm i -g playwright && npx playwright install chromium");
  console.error("  (set SKIP_SMOKE=1 to publish without it, and say so in the handover)");
  process.exit(2);
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer((req, res) => {
  let p = join(SITE, decodeURIComponent(req.url.split("?")[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const fails = [];
for (const slug of slugs) {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await page.goto(`${base}/${slug}/`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(500);
      const n = await page.evaluate(() => document.body.innerText.trim().length);
      if (errors.length) fails.push(`${slug} @${width}px throws on load: ${errors[0]}`);
      else if (n < 400) fails.push(`${slug} @${width}px renders only ${n} characters of text`);
    } catch (e) {
      fails.push(`${slug} @${width}px did not load: ${e.message.split("\n")[0]}`);
    }
    await page.close();
  }
}
await browser.close();
server.close();

if (fails.length) {
  for (const f of fails) console.log(`\x1b[31m  FAIL \x1b[0m${f}`);
  console.log(`\x1b[31m  smoke test: ${fails.length} failure(s) across ${slugs.length} page(s)\x1b[0m`);
  process.exit(1);
}
console.log(`\x1b[32m  smoke test: all ${slugs.length} page(s) render at 390px and 1280px with no errors\x1b[0m`);
