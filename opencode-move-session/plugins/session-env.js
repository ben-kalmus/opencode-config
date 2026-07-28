/**
 * Injects OPENCODE_SESSION_ID and OPENCODE_PROJECT_ID into every shell command
 * spawned by opencode (Bash tool, pty, etc.). This enables deterministic
 * identification of the current session from inside shell scripts and
 * slash-command bash invocations made via the LLM's Bash tool.
 *
 * Note: opencode's own `!`...`` template expansion in slash command markdown
 * files does NOT pass through this hook (it uses Process.text directly), so
 * commands that need the session ID must run their bash through the LLM's
 * Bash tool, not via template substitution.
 */
export const SessionEnvPlugin = async ({ project, directory, worktree }) => {
  return {
    "shell.env": async (input, output) => {
      if (input.sessionID) {
        output.env.OPENCODE_SESSION_ID = input.sessionID
      }
      if (input.callID) {
        output.env.OPENCODE_CALL_ID = input.callID
      }
      if (project?.id) {
        output.env.OPENCODE_PROJECT_ID = project.id
      }
      if (worktree) {
        output.env.OPENCODE_WORKTREE = worktree
      }
      if (directory) {
        output.env.OPENCODE_DIRECTORY = directory
      }
    },
  }
}
