#!/usr/bin/env bash
#
# Build every article under articles/ and assemble site/ for GitHub Pages.
#
#   ./scripts/build-site.sh
#
# site/ is a self-contained static site. It lives in the learningsite
# repository with the generator, and .github/workflows/pages.yml publishes it;
# the 243MB reference clone, sources/ and node_modules are git-ignored.
# Articles are listed in site/articles.json; the landing page is generated
# from that file, so adding an article means adding one entry there.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/site"
MANIFEST="$SITE/articles.json"

[ -f "$MANIFEST" ] || { echo "missing $MANIFEST"; exit 1; }

# Only what the manifest lists gets published — articles still being written
# stay out of the site until they are added to site/articles.json.
SLUGS="$(python3 -c 'import json,sys; print(" ".join(a["slug"] for a in json.load(open(sys.argv[1]))))' "$MANIFEST")"

# The house voice is a publishing rule, not a suggestion. Every published
# article must pass the prose gate (reference/writing-the-prose.md), checked here
# before anything is built so a failure costs seconds. ship.sh runs the same gate,
# but an article built without it, or edited after it, would otherwise go live.
#
# VOICE_LEGACY lists the ten machine-learning articles written before the voice
# rules of 22 September 2026. Their failures are printed but don't stop the build
# until each one has had its voice pass; then take it off the list. Never add a
# new article to it.
VOICE_LEGACY="isolation-forest xgboost lightgbm k-means autoencoders shapley-values smote f1-score dbscan-hdbscan population-stability-index"
VOICE_FAIL=""
for slug in $SLUGS; do
  if node "$ROOT/scripts/check-prose.mjs" "$ROOT/articles/$slug" >/dev/null 2>&1; then
    continue
  fi
  case " $VOICE_LEGACY " in
    *" $slug "*) echo "! $slug fails the prose gate (grandfathered in VOICE_LEGACY until its voice pass)" ;;
    *) VOICE_FAIL="$VOICE_FAIL $slug" ;;
  esac
done
if [ -n "$VOICE_FAIL" ]; then
  echo "✗ these articles fail the prose gate and can't be published:$VOICE_FAIL"
  echo "  Run: node scripts/check-prose.mjs articles/<slug> --report"
  echo "  and fix the prose per reference/writing-the-prose.md."
  exit 1
fi

for slug in $SLUGS; do
  dir="$ROOT/articles/$slug"
  [ -f "$dir/package.json" ] || { echo "✗ no article at articles/$slug"; exit 1; }

  # The starter ships Amazon Ember, whose licence forbids use on another
  # website. Refuse to publish an article that still carries it.
  if [ -d "$dir/public/assets/mlu-fonts" ]; then
    echo "✗ $slug still has public/assets/mlu-fonts/ — Amazon Ember cannot be published."
    echo "  Swap it for a free family; articles/isolation-forest is the worked example:"
    echo "    npm i -D @fontsource/inter @fontsource/ibm-plex-mono"
    echo "    then copy its public/assets/styles/font.css and the --font-* tokens in global.css"
    exit 1
  fi

  echo "→ building $slug"
  ( cd "$dir" && npm install --silent --no-audit --no-fund && npm run build >/dev/null 2>&1 )

  # device_bash cannot delete files on the mounted folder, and a hard `rm -rf`
  # here aborts the whole build under `set -e` before a single article is
  # copied. Copying over the top is enough in practice - every file an article
  # produces is regenerated on each build - so the removal is best-effort and
  # the build carries on without it. On a machine where deletion works this
  # behaves exactly as before.
  rm -rf "${SITE:?}/$slug" 2>/dev/null || true
  mkdir -p "$SITE/$slug"
  # Source maps are 1.3MB apiece and nobody debugging this needs them shipped.
  ( cd "$dir/public" && find . -type f ! -name '*.map' -print0       | while IFS= read -r -d '' f; do
          mkdir -p "$SITE/$slug/$(dirname "$f")"
          cp "$f" "$SITE/$slug/$f"
        done )
done

# The landing page uses the same self-hosted fonts as the articles.
mkdir -p "$SITE/assets/fonts"
for slug in $SLUGS; do for f in "$ROOT/articles/$slug"/public/assets/fonts/*.woff2; do
  [ -e "$f" ] && cp "$f" "$SITE/assets/fonts/"
done; done

python3 "$ROOT/scripts/render-index.py"

# Load every page before calling the site assembled. Two articles were once
# published blank: each passed its own ship.sh, which never opens the page.
if [ "${SKIP_SMOKE:-0}" = "1" ]; then
  echo "! SKIP_SMOKE=1: the pages were not loaded. Say so in the handover."
else
  node "$ROOT/scripts/smoke-site.mjs" $SLUGS || { echo "✗ a page failed to render; site/ is assembled but must not be pushed"; exit 1; }
fi

echo
echo "✓ site/ assembled"
du -sh "$SITE"
