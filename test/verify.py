#!/usr/bin/env python3
"""Verify the deployed Magic Context setup."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
HOME = Path.home()

OPENCODE_CONFIG = REPO / "opencode/.config/opencode/opencode.json"
MAGIC_CONTEXT_CONFIG = REPO / "cortexkit/.config/cortexkit/magic-context.jsonc"
DEPLOYED_CONFIG = HOME / ".config/cortexkit/magic-context.jsonc"
REPO_DCP_CONFIG = REPO / "opencode/.config/opencode/dcp.jsonc"
HOME_DCP_CONFIG = HOME / ".config/opencode/dcp.jsonc"

DREAMER_MODEL = "openrouter/deepseek/deepseek-v4.1-flash"
MAGIC_CONTEXT_PLUGIN = "@cortexkit/opencode-magic-context"
HANDOFF_PLUGIN = "opencode-handoff"
DCP_PLUGIN = "@tarquinen/opencode-dcp"


def strip_jsonc(text: str) -> str:
    """Remove comments and trailing commas while preserving string contents."""
    out: list[str] = []
    i = 0
    in_string = False
    escape = False
    while i < len(text):
        char = text[i]
        if in_string:
            out.append(char)
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            i += 1
            continue
        if char == '"':
            in_string = True
            out.append(char)
            i += 1
            continue
        if char == "/" and i + 1 < len(text) and text[i + 1] == "/":
            i += 2
            while i < len(text) and text[i] not in "\r\n":
                i += 1
            continue
        if char == "/" and i + 1 < len(text) and text[i + 1] == "*":
            i += 2
            while i + 1 < len(text) and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i += 2
            continue
        out.append(char)
        i += 1
    stripped = "".join(out)
    return re.sub(r",(\s*[}\]])", r"\1", stripped)


def load_jsonc(path: Path) -> dict:
    return json.loads(strip_jsonc(path.read_text(encoding="utf-8")))


def plugin_names(config: dict) -> list[str]:
    names: list[str] = []
    for entry in config.get("plugins", []):
        if isinstance(entry, str):
            names.append(entry)
        elif isinstance(entry, dict) and isinstance(entry.get("package"), str):
            names.append(entry["package"])
    return names


def main() -> int:
    results: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        results.append((name, ok, detail))

    check(
        "deployed config resolves into the repo",
        DEPLOYED_CONFIG.exists() and DEPLOYED_CONFIG.resolve() == MAGIC_CONTEXT_CONFIG.resolve(),
        f"{DEPLOYED_CONFIG} -> {DEPLOYED_CONFIG.resolve()}",
    )

    try:
        opencode = load_jsonc(OPENCODE_CONFIG)
        magic = load_jsonc(DEPLOYED_CONFIG)
    except (OSError, ValueError) as error:
        print(f"FAIL could not load config: {error}")
        return 1

    names = plugin_names(opencode)
    check(
        f"{MAGIC_CONTEXT_PLUGIN} is registered",
        any(name == MAGIC_CONTEXT_PLUGIN or name.startswith(f"{MAGIC_CONTEXT_PLUGIN}@") for name in names),
        str(names),
    )
    check(
        f"{HANDOFF_PLUGIN} is registered",
        any(name == HANDOFF_PLUGIN or name.startswith(f"{HANDOFF_PLUGIN}@") for name in names),
        str(names),
    )
    check(
        f"{DCP_PLUGIN} is not registered",
        not any(name == DCP_PLUGIN or name.startswith(f"{DCP_PLUGIN}@") for name in names),
        str(names),
    )
    check(
        "native auto-compaction is off",
        opencode.get("compaction", {}).get("auto") is False,
        str(opencode.get("compaction")),
    )

    thresholds = magic.get("execute_threshold_tokens", {})
    check(
        "default execute threshold is 350000",
        thresholds.get("default") == 350000,
        str(thresholds.get("default")),
    )

    local_models = opencode.get("providers", {}).get("llama-cpp", {}).get("models", {})
    missing = [
        model for model in local_models
        if thresholds.get(f"llama-cpp/{model}") != 65000
    ]
    check(
        "every llama-cpp model has a 65000 threshold",
        not missing,
        f"missing or wrong: {missing}",
    )

    historian = magic.get("historian", {})
    check(
        "historian uses the dreamer model",
        historian.get("opencode", {}).get("model") == DREAMER_MODEL,
        str(historian.get("opencode", {})),
    )

    dreamer = magic.get("dreamer", {})
    check(
        "dreamer is enabled",
        dreamer.get("disable") is not True,
        str(dreamer.get("disable")),
    )
    check(
        f"dreamer model is {DREAMER_MODEL}",
        dreamer.get("opencode", {}).get("model") == DREAMER_MODEL,
        str(dreamer.get("opencode", {})),
    )

    check(
        "repo dcp config is gone",
        not REPO_DCP_CONFIG.exists(),
        str(REPO_DCP_CONFIG),
    )
    check(
        "home dcp config is gone",
        not HOME_DCP_CONFIG.exists(),
        str(HOME_DCP_CONFIG),
    )

    readme = (REPO / "README.md").read_text(encoding="utf-8").lower()
    makefile = (REPO / "Makefile").read_text(encoding="utf-8").lower()
    check(
        "README and Makefile no longer mention dcp",
        "dcp" not in readme and "dcp" not in makefile,
        "README or Makefile still mentions dcp",
    )

    try:
        listed = subprocess.run(
            ["opencode", "plugin", "list"],
            capture_output=True,
            text=True,
            check=False,
        )
        output = f"{listed.stdout}\n{listed.stderr}".lower()
        check(
            "opencode plugin list shows the new plugins",
            listed.returncode == 0
            and "magic-context" in output
            and "handoff" in output
            and "opencode-dcp" not in output,
            output.strip(),
        )
    except FileNotFoundError:
        check("opencode plugin list shows the new plugins", False, "opencode binary not found")

    failed = 0
    for name, ok, detail in results:
        if ok:
            print(f"PASS {name}")
        else:
            failed += 1
            print(f"FAIL {name}: {detail}")

    print(f"\n{len(results) - failed}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
