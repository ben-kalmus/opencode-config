"""Exercise the explicit Claude sync in an isolated home directory."""

import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from verify import REPO


class TestClaudeSync(unittest.TestCase):
    def test_sync_claude(self):
        with tempfile.TemporaryDirectory(prefix="claude-sync-") as directory:
            home = Path(directory)
            claude = home / ".claude"
            agents = claude / "agents"
            agents.mkdir(parents=True)
            (claude / "hooks").mkdir()
            (claude / "settings.json").write_text('{"model":"opus"}\n')
            (claude / "hooks/local.sh").write_text("exit 0\n")
            (agents / "local.md").write_text("Keep this local agent.\n")
            source = home / "shared.md"
            source.write_text("Do not overwrite this symlink target.\n")
            (claude / "CLAUDE.md").symlink_to(source)
            subprocess.run(["git", "init", "-q", str(claude)], check=True)
            subprocess.run(
                ["git", "-C", str(claude), "add", "CLAUDE.md", "settings.json", "hooks", "agents"],
                check=True,
            )
            index = (claude / ".git/index").read_bytes()
            head = (claude / ".git/HEAD").read_bytes()
            expected = {
                "settings.json": b'{"model":"opus"}\n',
                "hooks/local.sh": b"exit 0\n",
                "agents/local.md": b"Keep this local agent.\n",
                "CLAUDE.md": (REPO / "opencode/.config/opencode/AGENTS.md").read_bytes(),
            }
            for name, harness in {
                "auditor": "agent-hierarchy",
                "coordinator": "agent-hierarchy",
                "producer": "agent-hierarchy",
                "tester": "agent-hierarchy",
                "critic-behavior": "author-critic",
                "critic-structure": "author-critic",
                "implementer": "author-critic",
                "subtractor": "author-critic",
            }.items():
                root = REPO / "opencode/.config/opencode" / harness
                body = (root / "agents" / f"{name}.md").read_text().split("---\n", 2)[2]
                body = body.replace("~/.config/opencode/AGENTS.md", "~/.claude/CLAUDE.md")
                body = body.replace("AGENTS.md", "~/.claude/CLAUDE.md")
                metadata = (root / "claude" / f"{name}.yml").read_text()
                expected[f"agents/{name}.md"] = f"---\n{metadata}---\n{body}".encode()

            for target in ["sync-claude", "sync-claude", "stow"]:
                with self.subTest(target=target):
                    result = subprocess.run(
                        ["make", target, f"HOME={home}"],
                        cwd=REPO,
                        env={**os.environ, "HOME": str(home)},
                        capture_output=True,
                        text=True,
                    )

                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    actual = {
                        str(path.relative_to(claude)): path.read_bytes()
                        for path in claude.rglob("*")
                        if path.is_file() and ".git" not in path.relative_to(claude).parts
                    }
                    self.assertEqual(actual, expected)
                    self.assertFalse((claude / "CLAUDE.md").is_symlink())
                    self.assertEqual(source.read_text(), "Do not overwrite this symlink target.\n")
                    self.assertEqual((claude / ".git/index").read_bytes(), index)
                    self.assertEqual((claude / ".git/HEAD").read_bytes(), head)


if __name__ == "__main__":
    unittest.main()
