# Agent Hierarchy: TDD-First Go Development

Three-agent system for test-driven Go development.
## Architecture

```
User ──► Coordinator ──► Tester (write failing tests)
               │               │
               │               └──► reports back to coordinator
               │
               └───────────► Producer (make tests pass)
                               │
                               └──► reports back to coordinator
                                   
Coordinator verifies with `go test ./...` then reports to user.
```

## Agents

| Agent | Mode | Access | Job |
|---|---|---|---|
| **coordinator** | primary | Read, Grep, Bash, Task | Breaks down tasks, spawns subagents, verifies |
| **tester** | subagent | Read, Grep, Edit, Bash | Writes `*_test.go` files that fail |
| **producer** | subagent | Read, Grep, Edit, Write, Bash | Implements to make tests pass |

## Permissions

| Agent | Edit | Test Edit | Bash | Task |
|---|---|---|---|---|
| coordinator | deny | deny | git/go only | allow |
| tester | deny | allow | allow | deny |
| producer | allow | deny | allow | deny |

## Setup

Global install (stowed to `~/.config/opencode/`):
- `agents/coordinator.md`, `agents/tester.md`, `agents/producer.md` → agent definitions
- `opencode.json` → per-agent permission rules

Per-project setup:
- Copy `AGENTS.md` to your Go project root for project-level rules

## Usage

Invoke the coordinator in your Go project:

```
/coordinator implement the user registration endpoint
```

The coordinator handles the full TDD cycle: tests → implementation → verification.

## Agent Prompt Design

Each agent's `prompt` field replaces the default opencode system prompt (e.g., `anthropic.txt`). The prompts are designed to:

1. Be role-specific and minimal — no generic bloat
2. Include explicit tool usage guidance (since the default tool rules are lost)
3. Encode strict boundaries for each agent's scope
4. Use simple, direct language — no fluff

The [default system prompts](https://github.com/anomalyco/opencode/tree/main/packages/opencode/src/session/prompt) were used as reference for tool-usage patterns but rewritten for each agent's narrow role.
