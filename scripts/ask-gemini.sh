#!/usr/bin/env bash
#
# Send a prompt, and optionally files and images, to Gemini 3.8 Flash.
#
# This exists so the expensive model can hand off the bulk passes described in
# reference/hybrid-workflow.md — screenshot triage, reference reconnaissance,
# consistency sweeps — without those tokens ever entering its own context.
#
#   ./scripts/ask-gemini.sh --check
#   ./scripts/ask-gemini.sh -p "which of these has a draggable scatter point?" \
#                           -f a/src/Components/Lab.svelte -f b/src/Components/Lab.svelte
#   ./scripts/ask-gemini.sh -p "$(cat prompts/shot-triage.txt)" -i shots/*.png
#
# Needs GEMINI_API_KEY and a route to generativelanguage.googleapis.com.
# Run --check first; it tells you which of those is missing.
#
set -uo pipefail

MODEL="${GEMINI_MODEL:-gemini-3.8-flash}"
HOST="https://generativelanguage.googleapis.com"
PROMPT=""
FILES=()
IMAGES=()
CHECK=0

while [ $# -gt 0 ]; do
  case "$1" in
    -p|--prompt) PROMPT="$2"; shift 2 ;;
    -f|--file)   FILES+=("$2"); shift 2 ;;
    -i|--image)  IMAGES+=("$2"); shift 2 ;;
    -m|--model)  MODEL="$2"; shift 2 ;;
    --check)     CHECK=1; shift ;;
    -h|--help)   sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)           echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

preflight() {
  local ok=0
  if [ -z "${GEMINI_API_KEY:-}" ]; then
    echo "  ✗ GEMINI_API_KEY is not set"
    echo "      export GEMINI_API_KEY=... in the shell you run this from."
    ok=1
  else
    echo "  ✓ GEMINI_API_KEY is set"
  fi

  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$HOST/v1beta/models" 2>/dev/null)
  if [ "$code" = "000" ]; then
    echo "  ✗ no route to $HOST"
    echo "      Both the Cowork VM and the cloud container run behind an egress"
    echo "      allowlist that does not include Google's API host, so this script"
    echo "      cannot run from inside a Claude session as things stand."
    echo "      Two ways round it:"
    echo "        1. add generativelanguage.googleapis.com to the account's egress"
    echo "           allowlist, after which this works in-session;"
    echo "        2. run this script from your own terminal on the Mac, outside"
    echo "           the Cowork VM, and bring the output back."
    ok=1
  else
    echo "  ✓ $HOST reachable (HTTP $code)"
  fi
  return $ok
}

if [ "$CHECK" -eq 1 ]; then
  echo "ask-gemini preflight — model $MODEL"
  preflight && echo "  ready" || exit 1
  exit 0
fi

[ -n "$PROMPT" ] || { echo "nothing to ask: pass -p 'your prompt'" >&2; exit 2; }
preflight >/dev/null 2>&1 || { echo "preflight failed — run: $0 --check" >&2; exit 1; }

# Build the request with python so quoting, base64 and JSON escaping are not
# a shell problem. Files go in as text parts, images as inline base64.
# ${arr[@]} on an empty array is an unbound-variable error under `set -u` in
# bash 3.2, which is what macOS still ships — and running this by hand on the
# Mac is one of the two supported paths. The +"..." guard makes it expand to
# nothing instead.
REQ=$(python3 - "$PROMPT" "${#FILES[@]}" ${FILES[@]+"${FILES[@]}"} ${IMAGES[@]+"${IMAGES[@]}"} <<'PY'
import base64, json, mimetypes, os, sys
prompt = sys.argv[1]
nfiles = int(sys.argv[2])
rest = sys.argv[3:]
files, images = rest[:nfiles], rest[nfiles:]

parts = [{"text": prompt}]
for f in files:
    with open(f, "r", errors="replace") as fh:
        parts.append({"text": "\n\n===== %s =====\n%s" % (f, fh.read())})
for im in images:
    mt = mimetypes.guess_type(im)[0] or "image/png"
    with open(im, "rb") as fh:
        parts.append({"inline_data": {"mime_type": mt, "data": base64.b64encode(fh.read()).decode()}})

json.dump({"contents": [{"role": "user", "parts": parts}]}, sys.stdout)
PY
)

RESP=$(curl -s --max-time 300 \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -d "$REQ" \
  "$HOST/v1beta/models/$MODEL:generateContent")

python3 - "$RESP" <<'PY'
import json, sys
try:
    d = json.loads(sys.argv[1])
except Exception:
    print(sys.argv[1][:2000]); sys.exit(1)
if "error" in d:
    print("gemini error:", d["error"].get("message", d["error"]), file=sys.stderr); sys.exit(1)
for c in d.get("candidates", []):
    for p in c.get("content", {}).get("parts", []):
        if "text" in p: print(p["text"])
u = d.get("usageMetadata", {})
if u:
    print("\n--- %s in / %s out tokens ---" % (u.get("promptTokenCount","?"), u.get("candidatesTokenCount","?")), file=sys.stderr)
PY
