# opencode-move-session

A `/move-session` slash command for [opencode](https://opencode.ai) that
reassigns the current chat session to a different project directory — and
cleans up after itself so the move leaves no trace in your conversation.

```
/move-session ~/Projects/myrepo
/move-session ../sibling-repo
```

## What it does

opencode binds each session to a project (a `.git` ancestor + a row in
`opencode.db`). When you start a chat in `/tmp/scratch` and want it to
live in `~/Projects/myrepo`, there's no built-in way to move it — the
session list in `~/Projects/myrepo` won't show it because the
`project_id`/`directory`/`path` columns still point at `/tmp/scratch`.

This command:

1. Takes an exact directory path as the argument.
2. Atomically rewrites `project_id`, `directory`, and `path` for the
   session **and every nested subagent session** via a recursive CTE.
3. Reuses an existing project row if one already covers the target's git
   toplevel; otherwise leaves the session on `global` so opencode's own
   `migrateGlobal` logic adopts it the next time a TUI opens that path.
4. Schedules a deferred chat cleanup so the next time opencode launches,
   the slash-command turn (4 messages: user → subtask call → synthetic
   continuation → build agent paraphrase) and the background subagent
   session are removed permanently.

You see the "Moved to ..." reply in the current session. Restart, open
the session at the new place, and the move command itself is gone.

## How it's wired together

| File | Role |
|---|---|---|
| `plugins/session-env.js` | injects `OPENCODE_SESSION_ID` (and `OPENCODE_PROJECT_ID`, `OPENCODE_WORKTREE`, `OPENCODE_DIRECTORY`, `OPENCODE_CALL_ID`) into every shell command opencode spawns, via the `shell.env` plugin hook. This is the only deterministic way to identify the calling session from inside bash. |
| `commands/move-session.sh` | the core logic: resolves session via `parent_id`, atomically updates `project_id`/`directory`/`path` for the session tree via recursive CTE, and queues deferred cleanup. Pure bash, no LLM. |
| `commands/move-session.md` | minimal /move-session slash command wrapper. Runs as `agent: general` (subtask). Tells the LLM to execute `move-session.sh` with the argument and echo the output. |
| `plugins/move-session-auto-undo.js` | one-shot at opencode startup: reads `~/.local/share/opencode/move-session-pending.jsonl` and removes each queued move turn (4 messages) plus its subagent session via direct `bun:sqlite` `DELETE` (FKs cascade). Skips reverting if you typed real messages after the move. |

## Install

### One-liner

```sh
curl -fsSL https://raw.githubusercontent.com/benkalmus/opencode-config/master/opencode-move-session/install.sh | bash
```

### Manual

```sh
mkdir -p ~/.config/opencode/plugins ~/.config/opencode/commands
cp plugins/*.js   ~/.config/opencode/plugins/
cp commands/*     ~/.config/opencode/commands/
chmod +x ~/.config/opencode/commands/move-session.sh
```

Then **restart opencode** so the plugins load.

## Usage

```
/move-session <target>
```

`<target>` is a directory path:

- Absolute: `/Users/me/code/repo`
- `~`-prefixed: `~/Projects/foo`
- Relative: `../sibling`

The LLM runs `move-session.sh` with the path and echoes its output.
On the next opencode launch the move turn quietly disappears from
the chat.

## How determinism works

All logic lives in `move-session.sh` (pure bash, no LLM). The script
identifies the calling session via `OPENCODE_SESSION_ID`, which the
`session-env.js` plugin injects into every shell command opencode spawns
via the `shell.env` hook. The subagent's `parent_id` is used to find the
user's session; when not a subagent, `OPENCODE_SESSION_ID` itself is used.

## Caveats

- The bash script writes directly to `~/.local/share/opencode/opencode.db`
  via `sqlite3`. opencode's WAL mode permits concurrent writers; the move
  uses `BEGIN IMMEDIATE` to serialize against itself. If opencode changes
  the schema (drizzle migrations), this command will need adjusting.
- The plugin uses `bun:sqlite` (opencode is a Bun runtime). It runs once
  at startup; if you have multiple TUIs opening at the same time, they
  race-claim the queue file by truncating it — duplicate processing is
  idempotent (DELETE on a missing row is a no-op).
- Existing TUI sessions cache their project assignment in memory. After a
  move you have to restart opencode (or switch sessions) for the live
  TUI to pick up the change.
- The cleanup distinguishes synthetic vs. real user messages by checking
  the `synthetic` flag on each part. Anything you type after the move
  has no synthetic flag, so it's preserved.

## Disable

To stop auto-cleaning the chat: `rm ~/.config/opencode/plugins/move-session-auto-undo.js`.
The slash command itself will keep working; you'd just press `<leader>u`
manually if you want the turn gone.

To remove entirely: delete the four installed files.

## License

MIT — see [LICENSE](./LICENSE).
