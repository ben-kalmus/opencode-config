# OpenCode Rules
## Critical Rules for File Editing
### ALWAYS Read Before Editing
- **READ the existing file content first** before making any edits
- This is especially critical for:
  - System configuration files (systemd services, configs)
  - Files with complex structures (JSON, YAML)
  - Files the user has previously modified
### Never Overwrite System Files
- Never use `write` to completely overwrite system/service files
- Always use `edit` to make targeted changes
- If you need to rewrite a file, read it first to understand its current state
- Backup or document what you're changing before changing it
### Sudo rules
- Never run a `sudo` command. If a sudo command is required, halt and present the line/snippet to run for the user.
- Never run a command as root, if root access is required, delegate to the user as above.
## General Best Practices
### Use sshpass for Remote Commands
- When user provides password, use `sshpass -p <password> ssh ...`
- Use `-o StrictHostKeyChecking=no` to avoid host key prompts
### Configuration Files
- Always verify config changes by reading the file back
- Restart services after config changes
- Check logs after restarts to verify success
## Writing Style
When generating documents, comments, or any prose output, follow these rules.
When writing markdown, do not automatically split paragraphs to wrap lines, just write them naturally until next sentence or new paragraph begins.
## Language
- Use simple, direct language. Prefer short sentences over long compound ones.
- Write in plain English. Avoid jargon unless it is the established term for something.
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
## Github source code link 
When generating documents, always link to source code using github.com pattern:  
[example](https://github.com/<org>/<repo>/blob/<base-branch>/<path>#<line-range>)
For example:
Org is `benkalmus` base branch is `master`, therefore link is:
[example](https://github.com/benkalmus/opencode-config/blob/master/README.md#L10-L12)
Line range is optional.
Do not use `` or quotes within [] when creating a source code link.
[example](https://github.com/algolia/metis/blob/main/modules/services/api/internal/compositions/schema/query_parameters.go#L96)
# Coding Style
Never commit your own changes unless directly asked to by the user.
Never stage your changes unless directly asked to by the user.
Never push or pull, resolve conflicts or rebase/merge UNLESS asked to by user.
