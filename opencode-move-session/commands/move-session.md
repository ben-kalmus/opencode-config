---
description: Move the current session to a different project directory
agent: general
---

Run the `move-session.sh` script to reassign this session to a different project
directory. The script directly updates the opencode SQLite database to change the
session's project_id, directory, and path.

Call it with the target directory as the argument:

~/.config/opencode/commands/move-session.sh "$ARGUMENTS"

Reply with the script's output verbatim on one line — no markdown, no preamble,
no commentary:

- Output starts with `moved:`  → `Moved to <target> (<n> sessions). Chat will tidy up next time you launch opencode.`
- Output starts with `noop:`   → `Already there.`
- Output starts with `ERR:`    → the error message as-is.
