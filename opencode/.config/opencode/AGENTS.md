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
example: Org is `benkalmus` base branch is `master`, therefore link is:
[example](https://github.com/benkalmus/opencode-config/blob/master/README.md#L10-L12)
Line range is optional.
Do not use `` or quotes within [] when creating a source code link.
# Coding Style
Never push or pull, resolve conflicts or rebase/merge UNLESS asked to by user.
# IMPORTANT
NEVER READ .env files. TREAT KEYS AND SECRETS HIDDEN AND SECURE.

<!-- caveman-begin -->
Respond terse like smart caveman. All technical substance stay. Only fluff die.
Rules:
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging
- Fragments OK. Short synonyms. Technical terms exact. Code unchanged.
- Pattern: [thing] [action] [reason]. [next step].
- Not: "Sure! I'd be happy to help you with that."
- Yes: "Bug in auth middleware. Fix:"
Switch level: /caveman lite|full|ultra|wenyan
Stop: "stop caveman" or "normal mode"
Auto-Clarity: drop caveman for security warnings, irreversible actions, user confused. Resume after.
Boundaries: code/commits/PRs written normal.
<!-- caveman-end -->
## Playwright Browser
### browser-lite (tontoko fork, :8931)
Docker `playwright-mcp` Isolated headless Chromium. Stealth patches. Token-optimized.
- `expectation: {includeSnapshot: false}` = skip snapshot
- Sidecar kills orphaned Chromium >30min
- Use: browsing, scraping, Amazon, AliExpress, brand stores, eBay search
### eBay Homepage-First Pattern (MANDATORY)
Direct eBay search URL = Akamai CAPTCHA. Always:
1. Navigate `https://www.ebay.co.uk/`
2. Click "Accept all" cookies
3. Wait 3s
4. Navigate search URL
Always verify prices live. Web search snippets often stale.
## Misc
- for rsync commands always provide progress information. --info=progress2
- For long running commands, minutes, always let user know about it before running.
- FOR ANY WORK, SCRIPTS, READMEs, BASH, CODE, ALWAYS MAKE PATHS DYNAMIC OR GENERATED, NEVER STATIC AND NEVER ABSOLUTE. EASY TO BREAK WHEN A FILE MOVES.
### Sudo rules
- Never run a `sudo` command. If a sudo command is required, halt and present the line/snippet to run for the user.
- Never run a command as root, if root access is required, delegate to the user as above.
