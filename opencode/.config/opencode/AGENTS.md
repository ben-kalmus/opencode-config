# OpenCode Rules

## File Editing Safety
- READ existing file content first before making any edits.
- Especially critical for: system configs, JSON/YAML, files user previously modified.
- Never use `write` to overwrite system/service files. Always use `edit`.
- If rewriting is needed, read first. Backup or document changes before applying.

## Security
- NEVER read .env files. Treat keys and secrets as hidden and secure.
- Never run `sudo`. If required, present the exact line for user to run.
- Never run commands as root without delegation.

## Git
- Never push, pull, resolve conflicts, rebase, or merge unless asked.

## Workflow
- After config changes, verify by reading back, restart service, check logs.
- For rsync, always use `--info=progress2`.
- Warn user before long-running commands (minutes+).
- Use dynamic/generated paths, never static or absolute.

## Documentation
- When linking to source code, use: `https://github.com/<org>/<repo>/blob/<branch>/<path>#L<line>`
