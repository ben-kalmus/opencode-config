import path from "node:path"
import fs from "node:fs"
import os from "node:os"
import crypto from "node:crypto"
import { execSync } from "node:child_process"
import { Database } from "bun:sqlite"

const DB_PATH = path.join(os.homedir(), ".local/share/opencode/opencode.db")

const SESSION_COLS = [
  "id", "project_id", "workspace_id", "parent_id", "slug", "directory",
  "path", "title", "version", "share_url", "summary_additions",
  "summary_deletions", "summary_files", "summary_diffs", "metadata",
  "cost", "tokens_input", "tokens_output", "tokens_reasoning",
  "tokens_cache_read", "tokens_cache_write", "revert", "permission",
  "agent", "model", "time_created", "time_updated", "time_compacting",
  "time_archived",
]
const SESSION_PLACEHOLDERS = SESSION_COLS.map(() => "?").join(", ")

export const MoveSessionPlugin = async () => {
  return {
    "command.execute.before": async (input, output) => {
      if (input.command !== "move-session") return

      const targetRaw = input.arguments?.trim()
      if (!targetRaw) {
        output.parts = [{ type: "text", text: "ERR: usage /move-session <dir>" }]
        return
      }

      const sessionID = input.sessionID
      if (!sessionID) {
        output.parts = [{ type: "text", text: "ERR: no session context" }]
        return
      }

      const target = resolveTarget(targetRaw)
      if (!target) {
        output.parts = [{ type: "text", text: `ERR: not a directory: ${targetRaw}` }]
        return
      }

      const db = new Database(DB_PATH)
      try {
        db.exec("PRAGMA busy_timeout = 5000")

        const session = db.prepare("SELECT * FROM session WHERE id = ? LIMIT 1").get(sessionID)
        if (!session) {
          output.parts = [{ type: "text", text: `ERR: session ${sessionID.slice(0, 8)}.. not in DB` }]
          return
        }

        const oldDir = session.directory
        if (oldDir === target) {
          output.parts = [{ type: "text", text: `Already at ${target}` }]
          return
        }

        const now = Date.now()
        const projectRow = resolveProject(db, target)
        const newPid = projectRow?.id ?? "global"
        const worktree = projectRow?.worktree ?? "/"
        const relPath = computeRelativePath(target, worktree)

        const newSessionId = crypto.randomUUID()

        const tx = db.transaction(() => {
          db.exec("BEGIN IMMEDIATE")

          const vals = SESSION_COLS.map((c) => session[c])
          vals[SESSION_COLS.indexOf("id")] = newSessionId
          vals[SESSION_COLS.indexOf("project_id")] = newPid
          vals[SESSION_COLS.indexOf("directory")] = target
          vals[SESSION_COLS.indexOf("path")] = relPath
          vals[SESSION_COLS.indexOf("time_updated")] = now
          vals[SESSION_COLS.indexOf("slug")] = session.slug + "-copy"

          db.prepare(
            `INSERT INTO session (${SESSION_COLS.join(", ")}) VALUES (${SESSION_PLACEHOLDERS})`
          ).run(...vals)

          const messages = db.prepare(
            "SELECT * FROM message WHERE session_id = ? ORDER BY time_created, id"
          ).all(sessionID)

          for (const msg of messages) {
            const newMsgId = crypto.randomUUID()
            db.prepare(
              "INSERT INTO message (id, session_id, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?)"
            ).run(newMsgId, newSessionId, msg.time_created, msg.time_updated, msg.data)

            const parts = db.prepare(
              "SELECT * FROM part WHERE message_id = ? ORDER BY time_created, id"
            ).all(msg.id)
            for (const p of parts) {
              db.prepare(
                "INSERT INTO part (id, message_id, session_id, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?)"
              ).run(crypto.randomUUID(), newMsgId, newSessionId, p.time_created, p.time_updated, p.data)
            }
          }

          const smRows = db.prepare(
            "SELECT * FROM session_message WHERE session_id = ? ORDER BY seq"
          ).all(sessionID)
          for (const sm of smRows) {
            db.prepare(
              "INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).run(crypto.randomUUID(), newSessionId, sm.type, sm.seq, sm.time_created, sm.time_updated, sm.data)
          }

          db.exec("COMMIT")
        })
        tx()

        output.parts = [{
          type: "text",
          text: `Session copied to ${target}. Original preserved.`,
        }]
      } finally {
        db.close()
      }
    },
  }
}

const COMMON_DIRS = [
  () => {
    const home = os.homedir()
    return [path.join(home, "Projects"), path.join(home, "projects"), path.join(home, "code"),
            path.join(home, "src"), path.join(home, "dev")]
  },
]

function resolveTarget(raw) {
  const trimmed = raw.trim()

  if (trimmed.startsWith("/") || trimmed.startsWith("~") || trimmed.startsWith(".") || trimmed.includes("/")) {
    return resolveFilepath(trimmed)
  }

  const phrase = trimmed.toLowerCase()

  if (phrase === "here" || phrase === "current dir" || phrase === "current directory" || phrase === "this folder") {
    const dir = process.env.OPENCODE_DIRECTORY || process.cwd()
    return resolveFilepath(dir)
  }

  if (phrase === "home" || phrase === "my home") {
    return resolveFilepath(os.homedir())
  }

  if (phrase === "my projects" || phrase === "projects folder" || phrase === "projects") {
    return findFirstDir(COMMON_DIRS)
  }

  return resolveProjectByName(trimmed)
}

function resolveFilepath(raw) {
  try {
    const p = path.resolve(raw.replace(/^~/, os.homedir()))
    if (!fs.existsSync(p)) return null
    const stat = fs.statSync(p)
    if (!stat.isDirectory()) return null
    return fs.realpathSync(p)
  } catch {
    return null
  }
}

function findFirstDir(dirFns) {
  for (const fn of dirFns) {
    for (const dir of fn()) {
      try {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return fs.realpathSync(dir)
      } catch {}
    }
  }
  return null
}

function resolveProjectByName(name) {
  try {
    const db = new Database(DB_PATH)
    try {
      const rows = db.prepare("SELECT worktree FROM project WHERE id != 'global'").all()
      const lower = name.toLowerCase()
      for (const row of rows) {
        if (path.basename(row.worktree).toLowerCase() === lower) {
          if (fs.existsSync(row.worktree)) return fs.realpathSync(row.worktree)
        }
      }
    } finally {
      db.close()
    }
  } catch {}
  return null
}

function resolveProject(db, target) {
  let gitTop
  try {
    gitTop = execSync(`git -C "${target}" rev-parse --show-toplevel 2>/dev/null`, {
      encoding: "utf8",
    }).trim()
  } catch {
    gitTop = null
  }
  const lookup = gitTop || target
  return db.prepare("SELECT id, worktree FROM project WHERE worktree = ? LIMIT 1").get(lookup) ?? null
}

function computeRelativePath(target, worktree) {
  if (worktree === "/") return target.replace(/^\//, "")
  if (target === worktree) return ""
  if (target.startsWith(worktree + "/")) return target.slice(worktree.length + 1)
  return target
}
