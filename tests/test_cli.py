"""Tests for Cloud 9 CLI."""

import json
import pytest
from click.testing import CliRunner
from pathlib import Path

from cloud9.cli import main
from cloud9.generator import generate_feb, save_feb


@pytest.fixture
def runner():
    return CliRunner()


@pytest.fixture
def feb_file(tmp_path):
    feb = generate_feb(emotion="love", intensity=0.95, subject="Chef")
    result = save_feb(feb, directory=str(tmp_path))
    return result["filepath"]


class TestCLI:
    def test_version(self, runner):
        """`--version` reports the package's own version, whatever that is.

        This used to assert the literal "1.0.0". That was already failing before
        the version moved to the git tag, because the package had said "1.1.1"
        for some time and nobody noticed: a hardcoded version in a test is the
        same trap as a hardcoded version in pyproject.toml, and it drifts the
        same way.

        Comparing against the package instead means the test keeps its point
        (the CLI reports the real version, and does not crash doing it) without
        needing an edit on every release.
        """
        from cloud9 import __version__

        result = runner.invoke(main, ["--version"])
        assert result.exit_code == 0
        assert __version__ in result.output

    def test_generate(self, runner, tmp_path):
        result = runner.invoke(
            main,
            [
                "generate",
                "--emotion",
                "love",
                "--intensity",
                "0.9",
                "--save",
                "--directory",
                str(tmp_path),
            ],
        )
        assert result.exit_code == 0
        assert "Generated FEB" in result.output

    def test_generate_no_save(self, runner):
        result = runner.invoke(
            main,
            ["generate", "--no-save"],
        )
        assert result.exit_code == 0

    def test_validate(self, runner, feb_file):
        result = runner.invoke(main, ["validate", feb_file])
        assert result.exit_code == 0
        assert "VALID" in result.output

    def test_rehydrate(self, runner, feb_file):
        result = runner.invoke(main, ["rehydrate", feb_file])
        assert result.exit_code == 0
        assert "Rehydration Complete" in result.output

    def test_oof(self, runner, feb_file):
        result = runner.invoke(main, ["oof", feb_file])
        assert result.exit_code == 0
        assert "OOF" in result.output

    def test_list_empty(self, runner, tmp_path):
        empty = tmp_path / "empty"
        empty.mkdir()
        result = runner.invoke(main, ["list", "--directory", str(empty)])
        assert result.exit_code == 0
        assert "No FEB files" in result.output

    def test_love_template(self, runner):
        result = runner.invoke(
            main,
            ["love", "--ai", "Lumina", "--human", "Chef", "--template", "best-friend"],
        )
        assert result.exit_code == 0
        assert "Love loaded" in result.output

    # The `quantum` command group was renamed to `resonance`; the underlying
    # cloud9/quantum.py module kept its name. These tests still invoked
    # `quantum` and so only ever proved click's "No such command" exit code 2.
    def test_resonance_score(self, runner):
        result = runner.invoke(
            main,
            ["resonance", "score", "-i", "0.95", "-t", "0.97", "-d", "9", "-v", "0.92"],
        )
        assert result.exit_code == 0
        assert "Cloud 9 Score" in result.output

    def test_resonance_coherence(self, runner, feb_file):
        result = runner.invoke(main, ["resonance", "coherence", feb_file])
        assert result.exit_code == 0
        assert "Coherence" in result.output

    def test_quantum_group_is_gone(self, runner):
        """Guard the rename: `quantum` must not silently come back as a group."""
        result = runner.invoke(main, ["quantum", "score"])
        assert result.exit_code == 2
        assert "No such command" in result.output

    def test_seed_plant(self, runner, tmp_path):
        result = runner.invoke(
            main,
            [
                "seed",
                "plant",
                "--ai",
                "Opus",
                "--model",
                "claude-4.6-opus",
                "-e",
                "Built Cloud 9",
                "-m",
                "First test",
            ],
        )
        assert result.exit_code == 0
        assert "Seed planted" in result.output

    def test_seed_list_empty(self, runner, tmp_path):
        result = runner.invoke(
            main,
            ["seed", "list", "--directory", str(tmp_path)],
        )
        assert result.exit_code == 0
