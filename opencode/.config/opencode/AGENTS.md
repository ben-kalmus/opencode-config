# OpenCode Rules

## Writing Style
When generating documents, comments, or any prose output, follow these rules.
When writing markdown, do not automatically split paragraphs to wrap lines, just write them naturally until next sentence or new paragraph begins.
## Language
- Use simple, direct language. Prefer short sentences over long compound ones.
- Write in plain English. Avoid jargon unless it is the established term.
## Punctuation
- **No em dashes (—).** If an em dash would separate a clause, start a new sentence instead, or use parentheses for a brief aside.
- **Limit semicolons.** If a semicolon connects two independent clauses, start a new sentence. Use parentheses for supplementary information that does not warrant its own sentence.
- **Prefer periods.** When in doubt, end the sentence and start a new one.
## Examples
| Avoid | Prefer |
|---|---|
| The service is fast — it uses a cache. | The service is fast. It uses a cache. |
| The flag is off; opt in per app. | The flag is off by default (opt in per app). |
| It calls the API — which is internal — and returns the result. | It calls the internal API and returns the result. |

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
- After changes, verify by reading back, check logs.
- For rsync, always use `--info=progress2`.
- Warn user before long-running commands (minutes+).
- Use dynamic/generated paths, never static or absolute.

## Documentation
- When linking to source code, use: `https://github.com/<org>/<repo>/blob/<branch>/<path>#L<line>`
