#!/usr/bin/env bash
#
# Build this article and hand a verified tarball to whoever runs the browser
# checks.
#
set -uo pipefail

MARKER=""
RUN_NUMBERS=1
while getopts ":m:nh" opt; do
  case $opt in
    m) MARKER="$OPTARG" ;;
    n) RUN_NUMBERS=0 ;;
    h) sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    \?) echo "unknown option -$OPTARG" >&2; exit 2 ;;
  esac
done

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ART="$(dirname "$HERE")"
cd "$ART" || exit 1
SLUG="$(basename "$ART")"
TARBALL="verify/_browser-check-bundle.tgz"
BUNDLE="public/build/bundle.js"

green() { printf '\033[32m  ok  \033[0m%s\n' "$1"; }
red()   { printf '\033[31m FAIL \033[0m%s\n' "$1"; }
note()  { printf '       %s\n' "$1"; }
die()   { red "$1"; [ $# -gt 1 ] && note "$2"; exit 1; }

hash_of() {
  if command -v md5sum >/dev/null 2>&1; then md5sum "$1" | cut -d' ' -f1
  elif command -v md5 >/dev/null 2>&1;    then md5 -q "$1"
  else shasum -a 256 "$1" | cut -d' ' -f1; fi
}

echo "=== $SLUG ==="

# 0. hygiene
if [ -d public/assets/mlu-fonts ]; then
  die "Amazon Ember is still here (public/assets/mlu-fonts/)"
fi
for f in public/assets/mlu_robot.png public/favicon.png; do
  [ -e "$f" ] && die "$f should not be in a derived article"
done
green "no proprietary fonts or MLU branding in public/"

OTHERS=$(ls -1 "$ART/.." 2>/dev/null | grep -v "^${SLUG}\$" | grep -v '^\.')
STRAY=""
for name in $OTHERS; do
  if grep -qil -- "$name" public/index.html src/Components/Meta.svelte src/Components/Title.svelte 2>/dev/null; then
    STRAY="$STRAY $name"
  fi
done
[ -n "$STRAY" ] && die "another article's name is in the page furniture:$STRAY"
green "no other article's name in the title, meta or masthead"

# 1. build
BUILD_LOG=$(mktemp)
if ! npm run build >"$BUILD_LOG" 2>&1; then
  red "npm run build failed"
  tail -30 "$BUILD_LOG"
  rm -f "$BUILD_LOG"
  exit 1
fi
WARN=$(grep -aiE '\(!\)|\[vite-plugin-svelte\]|(^|[^[:alnum:]])warn|a11y' "$BUILD_LOG" \
        | grep -aviE 'circular dependencies|^npm (notice|warn)|npm warn|deprecated|browserslist' \
        | head -5)
rm -f "$BUILD_LOG"
if [ -n "$WARN" ]; then
  red "the build emitted warnings — fix them, they are the cheap ones"
  echo "$WARN" | sed 's/^/       /'
  exit 1
fi
green "npm run build, no warnings"

sync; sleep 1

# 2. the build really ran
[ -f "$BUNDLE" ] || die "$BUNDLE does not exist"
STALE=$(find src -type f -newer "$BUNDLE" 2>/dev/null | head -5)
if [ -n "$STALE" ]; then
  red "source is newer than the bundle — the build did not pick it up"
  echo "$STALE" | sed 's/^/       /'
  exit 1
fi
green "every file in src/ is older than the bundle"

if [ -n "$MARKER" ]; then
  N=$(grep -o -- "$MARKER" "$BUNDLE" | wc -l | tr -d ' ')
  [ "$N" -gt 0 ] || die "marker not found in the built bundle: $MARKER"
  green "marker present in the bundle ($N occurrence(s))"
fi

# 3. numbers
if [ "$RUN_NUMBERS" -eq 1 ]; then
  if [ -f verify/check-numbers.mjs ]; then
    NUMLOG="$(mktemp "${TMPDIR:-/tmp}/${SLUG}-numbers.XXXXXX")"
    if ! node verify/check-numbers.mjs >$NUMLOG 2>&1; then
      red "check-numbers failed"
      grep -E 'FAIL|CHECKS FAILED' $NUMLOG | head -20 | sed 's/^/       /'
      note "full log: $NUMLOG"
      exit 1
    fi
    green "check-numbers passed"
  fi
fi

# 4. tarball
tar -cf - public verify/check-browser.mjs 2>/dev/null | gzip -n > "$TARBALL" || die "tar failed"
sync; sleep 1

DISK_HASH=$(hash_of "$BUNDLE")
TMPB=$(mktemp)
tar -xzOf "$TARBALL" "$BUNDLE" > "$TMPB" 2>/dev/null || die "the tarball has no $BUNDLE"
TAR_HASH=$(hash_of "$TMPB")
rm -f "$TMPB"
[ "$DISK_HASH" = "$TAR_HASH" ] || die "the tarball packed a DIFFERENT bundle than the one on disk"
green "tarball bundle is byte-identical to the built one"

TARBALL_HASH=$(hash_of "$TARBALL")
SIZE=$(du -h "$TARBALL" | cut -f1)

echo "  bundle   $DISK_HASH"
echo "  tarball  $TARBALL_HASH  ($SIZE)"
