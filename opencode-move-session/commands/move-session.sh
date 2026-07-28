#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
DB="$HOME/.local/share/opencode/opencode.db"

[ -n "$TARGET" ] || { echo "ERR: usage: move-session.sh <directory>"; exit 1; }
[ -n "${OPENCODE_SESSION_ID:-}" ] || { echo "ERR: OPENCODE_SESSION_ID unset (plugin not loaded -- restart opencode)"; exit 2; }
[ -d "$TARGET" ] || { echo "ERR: not a directory: $TARGET"; exit 2; }
TARGET="$(cd "$TARGET" && pwd -P)"

PARENT="$(sqlite3 "$DB" "SELECT COALESCE(parent_id,'') FROM session WHERE id='$OPENCODE_SESSION_ID';")"
ROOT_SESSION="${PARENT:-$OPENCODE_SESSION_ID}"

read -r OLD_DIR OLD_PROJECT < <(sqlite3 -separator ' ' "$DB" \
  "SELECT directory, project_id FROM session WHERE id='$ROOT_SESSION' LIMIT 1;")
[ -n "${OLD_DIR:-}" ] || { echo "ERR: root session $ROOT_SESSION not in DB"; exit 2; }
[ "$OLD_DIR" != "$TARGET" ] || { echo "noop: already at $TARGET"; exit 0; }

NOW=$(($(date +%s)*1000))
ESC_T="$(printf %s "$TARGET" | sed "s/'/''/g")"

GIT_TOP="$(git -C "$TARGET" rev-parse --show-toplevel 2>/dev/null || true)"
LOOKUP="${GIT_TOP:-$TARGET}"
ESC_LOOKUP="$(printf %s "$LOOKUP" | sed "s/'/''/g")"
NEW_PID="$(sqlite3 "$DB" "SELECT id FROM project WHERE worktree='$ESC_LOOKUP' LIMIT 1;")"
NEW_PID="${NEW_PID:-global}"

if [ "$NEW_PID" = "global" ]; then
  WORKTREE="/"
else
  WORKTREE="$(sqlite3 "$DB" "SELECT worktree FROM project WHERE id='$NEW_PID' LIMIT 1;")"
fi
if [ "$WORKTREE" = "/" ]; then
  REL_PATH="${TARGET#/}"
elif [ "$TARGET" = "$WORKTREE" ]; then
  REL_PATH=""
else
  case "$TARGET" in
    "$WORKTREE/"*) REL_PATH="${TARGET#"$WORKTREE"/}" ;;
    *)             REL_PATH="$TARGET" ;;
  esac
fi
ESC_REL="$(printf %s "$REL_PATH" | sed "s/'/''/g")"

sqlite3 -bail "$DB" >/dev/null <<SQL
.timeout 5000
BEGIN IMMEDIATE;
WITH RECURSIVE descendants(id) AS (
  SELECT id FROM session WHERE id='$ROOT_SESSION'
  UNION ALL
  SELECT s.id FROM session s INNER JOIN descendants d ON s.parent_id = d.id
)
UPDATE session
   SET project_id   = '$NEW_PID',
       directory    = '$ESC_T',
       path         = '$ESC_REL',
       workspace_id = NULL,
       time_updated = $NOW
 WHERE id IN (SELECT id FROM descendants);
COMMIT;
SQL

COUNT="$(sqlite3 "$DB" "SELECT count(*) FROM session WHERE project_id='$NEW_PID' AND time_updated=$NOW;")"

USER_MSG_ID="$(sqlite3 "$DB" "SELECT id FROM message
                                WHERE session_id='$ROOT_SESSION'
                                  AND json_extract(data,'\$.role')='user'
                                ORDER BY time_created DESC LIMIT 1;")"
if [ -n "$USER_MSG_ID" ]; then
  PENDING_DIR="$HOME/.local/share/opencode"
  PENDING_FILE="$PENDING_DIR/move-session-pending.jsonl"
  mkdir -p "$PENDING_DIR"
  printf '{"sessionID":"%s","messageID":"%s","subagentID":"%s","ts":%d}\n' \
    "$ROOT_SESSION" "$USER_MSG_ID" "$OPENCODE_SESSION_ID" "$NOW" >> "$PENDING_FILE"
fi

echo "moved: $OLD_DIR -> $TARGET ($COUNT session(s); project $OLD_PROJECT -> $NEW_PID)"
