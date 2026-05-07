#!/usr/bin/env sh
# Node reads NODE_OPTIONS before any JS runs, so a broken --localstorage-file on the
# *parent* `node scripts/dev.mjs` process still prints a warning. Strip it here (no Node)
# before exec.
ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT" || exit 1

if [ -n "$NODE_OPTIONS" ] && [ "$MULA_KEEP_NODE_OPTIONS" != "1" ]; then
  # sed: remove --localstorage-file[=value] and --localstorage-file <path>
  CO=$(printf %s "$NODE_OPTIONS" | sed -E \
    -e 's/[[:space:]]*--localstorage-file=[^[:space:]]*//g' \
    -e 's/[[:space:]]*--localstorage-file([[:space:]]+[^[:space:]-][^[:space:]]*)?//g' \
    -e 's/[[:space:]]{2,}/ /g' -e 's/^[[:space:]]*//;s/[[:space:]]*$//')
  if [ -n "$CO" ]; then
    export NODE_OPTIONS="$CO"
  else
    unset NODE_OPTIONS
  fi
fi

# Node 25+: experimental Web Storage + code touching localStorage without a valid
# --localstorage-file produces "(node) Warning: --localstorage-file was provided...".
# Disable it for dev (parent + child via dev.mjs).
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
if [ "$NODE_MAJOR" -ge 25 ] 2>/dev/null; then
  case " ${NODE_OPTIONS:-} " in
    *" --no-experimental-webstorage "* ) ;;
    *)
      if [ -n "${NODE_OPTIONS:-}" ]; then
        export NODE_OPTIONS="--no-experimental-webstorage $NODE_OPTIONS"
      else
        export NODE_OPTIONS="--no-experimental-webstorage"
      fi
      ;;
  esac
fi

exec node scripts/dev.mjs
