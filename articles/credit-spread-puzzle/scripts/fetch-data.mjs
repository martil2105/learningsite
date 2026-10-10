/*
  Fetch the pinned data files listed in data/sources.json and check them.

    node scripts/fetch-data.mjs           # download, and fail if a hash moved
    node scripts/fetch-data.mjs --bump    # accept new vintages and record them

  FRED appends a month to each series and can revise past months, so a
  published number can change under us. The hash is the vintage: a file that no
  longer matches is a deliberate bump or nothing.
*/
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { download, sha256 } from "./data-lib.mjs";

const bump = process.argv.includes("--bump");
const path = new URL("../data/sources.json", import.meta.url);
const sources = JSON.parse(readFileSync(path, "utf8"));
let changed = 0;
for (const s of sources) {
  const body = download(s.url);
  const h = sha256(body);
  const out = new URL(`../data/${s.file}`, import.meta.url);
  if (s.sha256 && h !== s.sha256) {
    if (!bump) { console.error(`✗ ${s.file}: hash moved (${s.sha256.slice(0, 12)} → ${h.slice(0, 12)}). Re-run with --bump to accept the new vintage.`); process.exitCode = 1; continue; }
    changed++;
  }
  if (!existsSync(out) || bump || !s.sha256) writeFileSync(out, body);
  if (!s.sha256 || bump) { s.sha256 = h; s.retrieved = new Date().toISOString().slice(0, 10); }
  console.log(`✓ ${s.file}  ${h.slice(0, 16)}…  ${body.length} bytes`);
}
writeFileSync(path, JSON.stringify(sources, null, 2) + "\n");
if (changed) console.log(`${changed} file(s) bumped: run node scripts/build-data.mjs and the checks, and re-read every number in the prose.`);
