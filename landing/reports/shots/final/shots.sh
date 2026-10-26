#!/usr/bin/env bash
# Morning evidence: fresh screenshots of the production build served on :3107, via the gstack browser.
set -euo pipefail
B="$HOME/.claude/skills/gstack/browse/dist/browse"
BASE="${BASE:-http://localhost:3107}"
OUT="${OUT:-C:/Users/chewo/Experii/landing/reports/shots/final}"
mkdir -p "$OUT"

nap() { "$B" js "new Promise((r) => setTimeout(() => r('ok'), $1))" > /dev/null; }
# Waits in the page itself (no command round trips) until the selector matches, then $2 ms more.
at() { "$B" js "new Promise((r) => { const t = () => (document.querySelector('$1') ? setTimeout(() => r('ok'), $2) : requestAnimationFrame(t)); t(); })" > /dev/null; }
shot() { "$B" screenshot --viewport "$OUT/$1.png" > /dev/null; echo "$1.png"; }
open_fresh() {
  "$B" viewport "$1" > /dev/null
  "$B" goto "$BASE/" > /dev/null
  local dev
  dev=$("$B" js "String(!!document.querySelector('nextjs-portal'))")
  if [[ "$dev" == *true* ]]; then echo "dev overlay present: not a production page" >&2; exit 1; fi
}

hero() {
  local name="hero-$1"
  open_fresh "$1"
  at '.hd-ask.typing' 700
  shot "$name-01-home"
  at '.hd-flow .task' 900
  shot "$name-02-task"
  at '.hd-flow .blank.is-right' 0
  shot "$name-03-left-join-press"
  at '.hd-flow .fake.save.done' 120
  shot "$name-04-card-saved"
  at '.hero-demo[data-remind="3"]' 500
  shot "$name-05-remind-30"
  at '.hero-demo[data-play="ended"]' 400
  shot "$name-06-reopened-card"
}

others() {
  open_fresh 1440x900
  "$B" click '#hero-cta [data-download="hero"]' > /dev/null
  at '#download-note:popover-open' 400
  shot "download-1440x900-notice"

  open_fresh 1440x900
  "$B" js "scrollTo({ top: document.querySelector('.ba figure.interview').getBoundingClientRect().top + scrollY - 200, behavior: 'instant' }); 'ok'" > /dev/null
  nap 600
  shot "before-after-1440x900"

  open_fresh 1440x900
  "$B" js "scrollTo({ top: document.getElementById('stage').getBoundingClientRect().top + scrollY - 72, behavior: 'instant' }); 'ok'" > /dev/null
  at '#stage[data-ready]' 700
  shot "s4-1440x900-1-chat"
  "$B" click '#loop-tab-2' > /dev/null
  at '#loop-panel-2 .opt' 900
  shot "s4-1440x900-2a-task-blank"
  "$B" click '#loop-panel-2 .opt:first-child' > /dev/null
  at '#loop-panel-2 .res-chip.bad' 700
  shot "s4-1440x900-2b-wrong-inner-join"
  "$B" click '#loop-panel-2 .opt:last-child' > /dev/null
  at '#loop-panel-2 .res-table' 900
  shot "s4-1440x900-2c-right-left-join"
  "$B" click '#loop-tab-3' > /dev/null
  at '#loop-panel-3 .save-btn' 900
  shot "s4-1440x900-3a-card"
  "$B" click '#loop-panel-3 .save-btn' > /dev/null
  at '#loop-panel-3 .l-list.shown' 700
  shot "s4-1440x900-3b-card-list"
  "$B" click '#loop-tab-4' > /dev/null
  at '#loop-panel-4 .notif[data-off="0"]' 900
  shot "s4-1440x900-4a-remind-1day"
  "$B" click '#loop-panel-4 .btn-notif' > /dev/null
  nap 700
  "$B" click '#loop-panel-4 .notif[data-off="0"] .n-hit:not([hidden])' > /dev/null
  nap 900
  shot "s4-1440x900-4b-remind-30day"
  "$B" click '#loop-panel-4 .notif[data-off="0"] .n-hit:not([hidden])' > /dev/null
  at '#loop-panel-4 .l-card.shown' 1000
  shot "s4-1440x900-4c-reopened-card"
}

if [ "${PART:-all}" != others ]; then for size in 1440x900 1280x800 1536x730; do hero "$size"; done; fi
others
