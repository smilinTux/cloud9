"""Shared test fixtures for cloud9.

The important one is `_sandbox_fleet`, which keeps the suite from writing into
the developer's real ~/.skcapstone.
"""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _sandbox_fleet(tmp_path, monkeypatch):
    """Force standalone mode and a throwaway skcapstone home for every test.

    `cloud9.cli.main` is a click group whose callback calls
    `integration.ensure_schedule()` and `integration.register_self()` on ANY
    CLI invocation. On a machine where skcapstone is actually installed (every
    sovereign node) that meant each CliRunner test registered a REAL fleet job
    in ~/.skcapstone/config/jobs.d/ and a real registry entry. Running the
    suite locally silently added `cloud9_rehydration_check` to the live
    scheduler at nodes=all.

    SK_STANDALONE=1 makes `integration.is_present()` return False, so the
    adapter takes its native no-op path. SKCAPSTONE_HOME is redirected as well
    so that anything bypassing the flag still cannot reach the real home.

    Integrated-mode tests opt back in via the `home` fixture in
    test_integration.py, which deletes SK_STANDALONE and points
    SKCAPSTONE_HOME at its own tmp_path.
    """
    monkeypatch.setenv("SK_STANDALONE", "1")
    monkeypatch.setenv("SKCAPSTONE_HOME", str(tmp_path / "skcapstone-home"))
