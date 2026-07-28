#!/usr/bin/env bash
# Install opencode-move-session into ~/.config/opencode/.
# Idempotent: re-running upgrades existing files in place.
set -euo pipefail

REPO="${REPO:-https://raw.githubusercontent.com/benkalmus/opencode-config/master/opencode-move-session}"
DEST="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

mkdir -p "$DEST/plugins" "$DEST/commands"

fetch() {
  local src="$1" dst="$2"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
  else
    curl -fsSL "$REPO/$src" -o "$dst"
  fi
}

# Detect: are we running from a clone (./install.sh) or piped (curl | bash)?
if [ -f "plugins/session-env.js" ]; then
  SRCROOT="."
else
  SRCROOT=""
fi

if [ -n "$SRCROOT" ]; then
  cp "$SRCROOT/plugins/session-env.js"            "$DEST/plugins/"
  cp "$SRCROOT/plugins/move-session-auto-undo.js" "$DEST/plugins/"
  cp "$SRCROOT/commands/move-session.md"          "$DEST/commands/"
  cp "$SRCROOT/commands/move-session.sh"          "$DEST/commands/"
  chmod +x "$DEST/commands/move-session.sh"
else
  curl -fsSL "$REPO/plugins/session-env.js"            -o "$DEST/plugins/session-env.js"
  curl -fsSL "$REPO/plugins/move-session-auto-undo.js" -o "$DEST/plugins/move-session-auto-undo.js"
  curl -fsSL "$REPO/commands/move-session.md"          -o "$DEST/commands/move-session.md"
  curl -fsSL "$REPO/commands/move-session.sh"          -o "$DEST/commands/move-session.sh"
  chmod +x "$DEST/commands/move-session.sh"
fi

cat <<MSG
opencode-move-session installed:
  $DEST/plugins/session-env.js
  $DEST/plugins/move-session-auto-undo.js
  $DEST/commands/move-session.md
  $DEST/commands/move-session.sh

Restart opencode for the plugins to load. Then try:
  /move-session ~/Projects/some-repo
MSG
