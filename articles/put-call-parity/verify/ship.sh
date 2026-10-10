#!/usr/bin/env bash
#
# Build this article and hand a verified tarball to whoever runs the browser
# checks.
#
# It exists because of one specific bug that cost about ten round trips: the
# build ran, the tar ran after it, and the tar still packed the PREVIOUS
# bundle. Everything downstream then tested stale code, the screenshots looked
# identical, and the obvious conclusion — "my fix didn't work" — was wrong.
#
# So this script never trusts a step; it proves each one:
#
#   1. nothing in src/ is newer than the built bundle   (the build really ran)
#   2. the tarball's bundle is byte-identical to disk    (the tar really packed it)
#   3. the marker string you just added is in both       (optional, -m)
#   4. the prose passes the voice gate                   (scripts/check-prose.mjs)
#
# and it prints hashes so the same claim can be re-checked on the far side.
#
# Usage, from the article directory or anywhere:
#
#   ./verify/ship.sh
#   ./verify/ship.sh -m 'a string I just added to the source'
#   ./verify/ship.sh -n            # skip check-numbers (layout-only iteration)
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

# ---------------------------------------------------------------- 0. hygiene
# Two documented ways an article has shipped something it should not have.
if [ -d public/assets/mlu-fonts ]; then
  die "Amazon Ember is still here (public/assets/mlu-fonts/)" \
      "It is licensed for local viewing only. scripts/build-site.sh refuses it too."
fi
for f in public/assets/mlu_robot.png public/favicon.png; do
  [ -e "$f" ] && die "$f should not be in a derived article"
done
green "no proprietary fonts or MLU branding in public/"

# The previous article's name left in a <title> nobody renders is invisible
# until the page is scraped or opened with JS off. It has happened.
# A multi-word slug is looked for as the slug or as its words ("cost-curves",
# "cost curves") anywhere in the furniture. A one-word slug ("elasticity") is an
# ordinary word too, so it is only looked for in the <title>; and a name that is
# part of this article's own slug (elasticity in markup-and-elasticity) is skipped.
FURNITURE="public/index.html src/Meta.svelte src/Components/Meta.svelte src/Components/Title.svelte"
OTHERS=$(ls -1 "$ART/.." 2>/dev/null | grep -v "^${SLUG}\$" | grep -v '^[._]')
STRAY=""
for name in $OTHERS; do
  case "-$SLUG-" in *"-$name-"*) continue ;; esac
  if [[ "$name" == *-* ]]; then
    words="${name//-/ }"
    if grep -qiE -- "(^|[^a-z-])($name|$words)([^a-z-]|$)" $FURNITURE 2>/dev/null; then STRAY="$STRAY $name"; fi
  else
    if grep -qiE -- "<title>[^<]*\b$name\b" public/index.html 2>/dev/null; then STRAY="$STRAY $name"; fi
  fi
done
[ -n "$STRAY" ] && die "another article's name is in the page furniture:$STRAY" \
                       "Check $FURNITURE"
green "no other article's name in the title, meta or masthead"

# ---------------------------------------------------------------- 1. build
BUILD_LOG=$(mktemp)
if ! npm run build >"$BUILD_LOG" 2>&1; then
  red "npm run build failed"
  tail -30 "$BUILD_LOG"
  rm -f "$BUILD_LOG"
  exit 1
fi
# Two stacks print warnings differently and this has to catch both: Rollup 2
# emitted "(!) Plugin svelte" and "A11y:", while Vite emits "(!)" for rollup
# warnings and routes svelte compiler warnings through [vite-plugin-svelte].
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

# Writes to this mount are not always visible to the next command immediately,
# which is half of how the stale tarball happened.
sync; sleep 1

# ------------------------------------------------- 2. the build really ran
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
  [ "$N" -gt 0 ] || die "marker not found in the built bundle: $MARKER" \
                        "The build ran but your edit is not in it."
  green "marker present in the bundle ($N occurrence(s))"
fi

# ---------------------------------------------------------------- 3. numbers
if [ "$RUN_NUMBERS" -eq 1 ]; then
  if [ -f verify/check-numbers.mjs ]; then
    # A fresh file every run: a log left in /tmp by an earlier session can belong
    # to another user, and writing over it then fails as "Permission denied".
    NUMLOG="$(mktemp "${TMPDIR:-/tmp}/${SLUG}-numbers.XXXXXX")"
    if ! node verify/check-numbers.mjs >$NUMLOG 2>&1; then
      red "check-numbers failed"
      grep -E 'FAIL|CHECKS FAILED' $NUMLOG | head -20 | sed 's/^/       /'
      note "full log: $NUMLOG"
      exit 1
    fi
    green "$(grep -oE 'ALL [0-9]+ CHECKS PASS' $NUMLOG || echo 'check-numbers passed')"
  else
    note "no verify/check-numbers.mjs — every article should have one"
  fi
fi

# ---------------------------------------------------------------- 3b. prose
# The voice gate, scripts/check-prose.mjs. It runs on every build, -n included,
# because prose that breaks the house voice is as much a reason not to ship as a
# wrong number. Exemptions go in verify/prose.json, with the reason in README.md.
PROSE_GATE="$ART/../../scripts/check-prose.mjs"
[ -f "$PROSE_GATE" ] || die "scripts/check-prose.mjs not found, so the prose gate did not run"
if ! node "$PROSE_GATE" "$ART"; then
  red "the prose gate failed; reference/writing-the-prose.md has the rules and the fixes"
  exit 1
fi

# ---------------------------------------------------------------- 4. tarball
# gzip -n: no timestamp in the header, so an unchanged build produces a
# byte-identical tarball and "the hash is the same" means "nothing changed"
# rather than "you ran it twice".
tar -cf - public verify/check-browser.mjs 2>/dev/null | gzip -n > "$TARBALL" || die "tar failed"
sync; sleep 1

# The claim that actually matters: what is in the tarball IS what is on disk.
DISK_HASH=$(hash_of "$BUNDLE")
TMPB=$(mktemp)
tar -xzOf "$TARBALL" "$BUNDLE" > "$TMPB" 2>/dev/null || die "the tarball has no $BUNDLE"
TAR_HASH=$(hash_of "$TMPB")
rm -f "$TMPB"
[ "$DISK_HASH" = "$TAR_HASH" ] || die "the tarball packed a DIFFERENT bundle than the one on disk" \
                                      "disk $DISK_HASH  vs  tar $TAR_HASH — this is the bug this script exists for"
green "tarball bundle is byte-identical to the built one"

TARBALL_HASH=$(hash_of "$TARBALL")
SIZE=$(du -h "$TARBALL" | cut -f1)

# ---------------------------------------------------------------- 5. handoff
# Print the ~/mnt/ spelling, not the raw expansion. The staging tools accept
# "~/mnt/<folder>/..." and resolve it; a hand-built /sessions/... path is
# unpredictable and the guidance says not to construct one.
DEVPATH="$(pwd)/$TARBALL"
case "$DEVPATH" in
  "$HOME"/mnt/*) DEVPATH="~/mnt/${DEVPATH#"$HOME"/mnt/}" ;;
esac
cat <<EOF

  bundle   $DISK_HASH
             the identity of the CODE. Unchanged between runs means your edit
             did not land; changed means it did. This is the number to watch.
  tarball  $TARBALL_HASH  ($SIZE)
             the identity of THIS FILE. It differs every run (the archive
             stores mtimes), so only compare it against the copy you staged.
  path     $DEVPATH

Next, on a machine with a browser:

  1. stage $DEVPATH
  2. verify it arrived intact:
       [ "\$(md5sum <staged>/_browser-check-bundle.tgz | cut -d' ' -f1)" = "$TARBALL_HASH" ] \\
         && echo same || echo STALE
  3. Extract it, serve it, run the checks. Playwright is a GLOBAL install in the
     container and an ESM \`import\` does not consult global module paths, so
     check-browser.mjs needs a node_modules link beside it or it dies with
     ERR_MODULE_NOT_FOUND:

       D=~/_check-$SLUG
       rm -rf \$D && mkdir -p \$D /tmp/$SLUG-shots
       tar -xzf <staged>/_browser-check-bundle.tgz -C \$D
       ln -sfn "\$(npm root -g)" \$D/node_modules
       cd \$D && (nohup python3 -m http.server 8790 -d public >/dev/null 2>&1 &) && sleep 2
       BASE=http://127.0.0.1:8790 SHOTS=/tmp/$SLUG-shots node verify/check-browser.mjs

Then look at the screenshots. Every bug that mattered in this project so far
was invisible to every assertion and obvious in a picture.
EOF
