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

## Product Research with Playwright Browser

When researching products for the user, use the Playwright browser to verify real prices. Web search snippets often show outdated or incorrect pricing. Always open the actual product page before quoting a price.

### Site Compatibility (verified June 2026)
- **Amazon UK** (`amazon.co.uk`): Works. Accept cookie consent first, then search.
- **AliExpress** (`aliexpress.com`): Works. No cookie wall. Direct search URLs with price filters work well.
- **eBay UK** (`ebay.co.uk`): Works, but ONLY with the homepage-first pattern. See below.
- **Official brand stores**: Usually work cleanly. Best source for current retail price and sale status.

### eBay UK: Homepage-First Pattern (IMPORTANT)

**Direct navigation to eBay search URLs always triggers Akamai CAPTCHA.** This is the single most common mistake. The workaround is simple and mandatory:

1. Navigate to `https://www.ebay.co.uk/` first (the homepage).
2. Accept cookie consent: click `button:has-text("Accept all")`.
3. Wait 3 seconds (`playwright_browser_wait_for` with `time: 3`).
4. Then navigate to the search URL (e.g. `https://www.ebay.co.uk/sch/i.html?_nkw=...`).

The homepage visit establishes a session cookie that bypasses Akamai's challenge on subsequent page loads. Without this step, every eBay search URL returns "Error Page" or "Pardon our interruption". This pattern was verified working June 2026. If it stops working in future, the dedicated scraper at `~/projects/ebay-tracker/scraper_local.py` has additional anti-bot measures (Firefox, playwright_stealth, device rotation).

### Research Order
1. Official brand store for current retail price, sale status, and exact specs.
2. AliExpress for budget alternatives and cross-check pricing.
3. Amazon UK for availability, reviews, and Prime delivery options.
4. eBay UK (homepage-first pattern) for second-hand deals and price comparison.

### Key Lesson: Always Verify Prices Live
Web search results can be months out of date. A live browser check can find prices significantly different from what search snippets report. Always open the product page in the browser to confirm the current price before advising the user.

### Playwright MCP Snapshot Mode

The Playwright MCP server runs with `--snapshot-mode none`. This disables automatic page snapshots after every action (click, navigate, type). Without this, each action returns a 50-500KB accessibility tree that fills agent context within 3-4 interactions.

How to work with `--snapshot-mode none`:
- After `browser_navigate`, call `browser_snapshot` to see the page.
- After `browser_click` or `browser_type` that changes the page significantly, call `browser_snapshot` again.
- For simple actions (clicking a cookie accept button), skip the snapshot and proceed.
- Use `browser_snapshot` with `filename` parameter to save large snapshots to a file, then grep/read specific parts.

The `browser_snapshot` tool returns a YAML accessibility tree with `ref` IDs on interactive elements. Use these refs as `target` parameters in `browser_click`, `browser_type`, etc.

### Playwright MCP Token Optimization (tontoko fork)

The Playwright MCP server uses the tontoko/fast-playwright-mcp fork with built-in token optimization:

- **`expectation` parameter**: All tools accept `expectation: {includeSnapshot: false}` to skip the page snapshot in the response (70-80% token savings per action).
- **`browser_batch_execute`**: Run multiple actions in a single MCP call. Saves 90% tokens vs individual calls.
- **Diff detection**: Automatically detects changes between snapshots, showing only what changed.
- **`--isolated` mode**: Each session gets its own browser instance. Multiple chats and OpenCode sessions can use the browser concurrently without conflicts.
- **Browser cleanup**: A sidecar process kills orphaned Chromium processes older than 20 minutes (configurable via `CLEANUP_TIMEOUT_MINUTES` env var).

The server runs on `http://localhost:8931/mcp` (Streamable HTTP). OpenWebUI connects directly without MCPO.
