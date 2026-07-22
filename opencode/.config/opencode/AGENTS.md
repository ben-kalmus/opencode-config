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
For example:
Org is `benkalmus` base branch is `master`, therefore link is:
[example](https://github.com/benkalmus/opencode-config/blob/master/README.md#L10-L12)
Line range is optional.
Do not use `` or quotes within [] when creating a source code link.
[example](https://github.com/algolia/metis/blob/main/modules/services/api/internal/compositions/schema/query_parameters.go#L96)
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
Two MCP servers. Pick by login need.
### browser-lite (tontoko fork, :8931)
Docker `playwright-mcp` Isolated headless Chromium. Stealth patches. Token-optimized.
- `expectation: {includeSnapshot: false}` = skip snapshot (70-80% token savings)
- `browser_batch_execute` = multi-action single call (90% token savings)
- Sidecar kills orphaned Chromium >20min
- Use: browsing, scraping, Amazon, AliExpress, brand stores, eBay search
### browser-auth (official MCP, :8932)
Systemd user service. Connects persistent headless Chromium via CDP :9222. Shares logged-in sessions.
- Official `@playwright/mcp`. No token optimization, no batch execute.
- Session synced from snap Chromium via `sync-browser-auth`
- Use: Facebook Marketplace, eBay bid history, any auth-required site
- **ask user to close browser-auth tabs.** Active searches may be running.
### Site Compatibility (verified June 2026)
- Amazon UK: accept cookies, then search
- AliExpress: direct search URLs, no cookie wall
- eBay UK: homepage-first pattern ONLY (see below)
- Brand stores: usually work clean
- Facebook Marketplace: browser-auth only
### eBay Homepage-First Pattern (MANDATORY)
Direct eBay search URL = Akamai CAPTCHA. Always:
1. Navigate `https://www.ebay.co.uk/`
2. Click "Accept all" cookies
3. Wait 3s
4. Navigate search URL
### Research Order
1. Brand store (retail price, sale status, specs)
2. AliExpress (budget alternatives)
3. Amazon UK (availability, reviews, Prime)
4. eBay UK (second-hand deals)
Always verify prices live. Web search snippets often stale.
### OpenWebUI Wiring

| Name | Type | URL |
|------|------|-----|
| browser-lite | MCP Streamable HTTP | `http://playwright-mcp:8931/mcp` |
| browser-auth | MCP Streamable HTTP | `http://host.docker.internal:8932/mcp` |

### Maintenance
- Start: `browser-auth-start [url]` (syncs session, starts services, opens URL)
- Stop: `browser-auth-stop` (stops services, disables so no CPU waste)
- Default URL: Facebook Marketplace UK
- Auto-restart daily 3AM: `chromium-cdp-restart.timer` (reclaims memory from tab bloat)
- Status: `systemctl --user status chromium-cdp.service playwright-mcp-auth.service`
- Logs: `journalctl --user -u chromium-cdp.service -f`
## Misc
- for rsync commands always provide progress information. --info=progress2
- For long running commands, minutes, always let user know about it before running.
- FOR ANY WORK, SCRIPTS, READMEs, BASH, CODE, ALWAYS MAKE PATHS DYNAMIC OR GENERATED, NEVER STATIC AND NEVER ABSOLUTE. EASY TO BREAK WHEN A FILE MOVES.
### Sudo rules
- Never run a `sudo` command. If a sudo command is required, halt and present the line/snippet to run for the user.
- Never run a command as root, if root access is required, delegate to the user as above.
