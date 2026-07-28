/**
 * Deferred chat cleanup for /move-session.
 *
 * The /move-session bash script appends one JSON line per successful
 * move to ~/.local/share/opencode/move-session-pending.jsonl with:
 *   { sessionID, messageID, subagentID, ts }
 *
 * This plugin runs ONCE at opencode startup. For each entry it:
 *   1. Targeted-deletes (via bun:sqlite, FKs ON) ONLY the user message
 *      that ran /move-session and its assistant reply. Any messages the
 *      user typed after the move are left intact.
 *      We use direct DELETE because session.revert is a transient cursor
 *      (auto-cleared when the user types again) — not a permanent
 *      message-removal mechanism.
 *   2. Deletes the subagent's session row entirely so it doesn't show
 *      under <leader>down navigation.
 *
 * Net behaviour: you see the "Moved to ..." reply in the session that
 * triggered the move; on the next opencode launch, that user/assistant
 * turn AND the background subagent are permanently gone.
 *
 * Disable: delete this file. Failed entries are kept in the queue for
 * retry next launch.
 */
import path from "node:path"
import fs from "node:fs/promises"
import os from "node:os"
import { Database } from "bun:sqlite"

const PENDING = path.join(os.homedir(), ".local/share/opencode/move-session-pending.jsonl")
const DB_PATH = path.join(os.homedir(), ".local/share/opencode/opencode.db")

/**
 * A /move-session turn that runs as a subtask produces FOUR messages, not 2:
 *
 *   1. user      — "/move-session ..."                                 (we delete)
 *   2. assistant — contains subtask part (subagent's run)              (we delete)
 *   3. user      — synthetic "Summarize the task tool output above..." (we delete)
 *      injected by prompt.ts:1734 after every subtask
 *   4. assistant — build agent's paraphrase ("The session was moved...") (we delete)
 *
 * After (4) opencode's turn ends. Any later message is real user content —
 * we stop there. A user message counts as "real" if it has at least one
 * non-synthetic part, so we keep typed-after content intact.
 */
function applyEntry({ sessionID, messageID, subagentID }) {
  const db = new Database(DB_PATH)
  try {
    db.exec("PRAGMA foreign_keys = ON;")
    db.exec("PRAGMA busy_timeout = 5000;")

    const start = db
      .prepare("SELECT time_created FROM message WHERE id = ?")
      .get(messageID)

    const toDelete = []

    if (start) {
      const candidates = db
        .prepare(
          `SELECT id, json_extract(data, '$.role') AS role
             FROM message
            WHERE session_id = ?
              AND time_created >= ?
            ORDER BY time_created, id`,
        )
        .all(sessionID, start.time_created)

      const partStmt = db.prepare(
        "SELECT data FROM part WHERE message_id = ? ORDER BY time_created, id",
      )

      for (const m of candidates) {
        if (m.id === messageID) {
          toDelete.push(m.id)
          continue
        }
        if (m.role === "assistant") {
          toDelete.push(m.id)
          continue
        }
        // user message: keep only if it has at least one non-synthetic part
        const parts = partStmt.all(m.id)
        if (parts.length === 0) {
          toDelete.push(m.id)
          continue
        }
        const realPart = parts.some((p) => {
          try {
            return JSON.parse(p.data)?.synthetic !== true
          } catch {
            return true // unparseable → assume real, stop
          }
        })
        if (realPart) break
        toDelete.push(m.id)
      }
    }

    const tx = db.transaction(() => {
      // FK CASCADE on part(message_id) wipes parts automatically.
      const stmt = db.prepare("DELETE FROM message WHERE id = ?")
      for (const id of toDelete) stmt.run(id)
      // FK CASCADE on session(id) cascades to message/part/session_message/todo.
      if (subagentID) {
        db.prepare("DELETE FROM session WHERE id = ?").run(subagentID)
      }
    })
    tx()
  } finally {
    db.close()
  }
}

export const MoveSessionAutoUndo = async ({ client }) => {
  let lines = []
  try {
    const content = await fs.readFile(PENDING, "utf8")
    lines = content.split("\n").filter(Boolean)
    // Atomically claim by truncating. Concurrent TUIs may double-process;
    // DELETE on a non-existent row is a no-op so duplicates are safe.
    await fs.writeFile(PENDING, "")
  } catch {
    return {}
  }

  const remaining = []

  for (const line of lines) {
    let entry
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (!entry?.sessionID || !entry?.messageID) continue

    try {
      applyEntry(entry)
    } catch (err) {
      remaining.push(line)
      try {
        await client?.app?.log?.({
          body: {
            service: "move-session-auto-undo",
            level: "error",
            message: "cleanup failed",
            extra: {
              sessionID: entry.sessionID,
              messageID: entry.messageID,
              subagentID: entry.subagentID,
              error: String(err?.message ?? err),
            },
          },
        })
      } catch {}
    }
  }

  if (remaining.length > 0) {
    try {
      await fs.appendFile(PENDING, remaining.join("\n") + "\n")
    } catch {}
  }

  return {}
}
