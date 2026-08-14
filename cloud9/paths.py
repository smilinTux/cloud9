"""Where Cloud 9 keeps FEBs and seeds: one resolver, sovereign by default.

The CLI defaulted to ``~/.openclaw/feb``, the home of a runtime evicted on
2026-04-23. Two things followed from that, and the second is the harmful one:

* Cloud 9 state was being written outside the sovereign tree, so it was not
  covered by the per-agent layout, the backups, or Syncthing.
* ``tests/test_cli.py::test_seed_plant`` invoked ``seed plant`` with **no**
  ``--directory``, so it fell through to that default and planted a real seed
  into the live store on every test run. 24 accumulated, every one carrying
  the same payload ("Built Cloud 9" / "First test"). Tests were writing to the
  operator's data directory.

Resolution order, matching ``skos.gogbin`` for gogcli:

1. ``CLOUD9_FEB_DIR`` explicit override,
2. the sovereign per-agent path ``~/.skcapstone/agents/<agent>/trust/febs``,
   with the agent from the standard ``SKAGENT`` precedence,
3. never the legacy path as a *write* target.

Legacy data is not silently adopted: :func:`legacy_feb_directory` exists so a
migration can find it deliberately, and nothing writes there.
"""

from __future__ import annotations

import os
from pathlib import Path

#: The evicted runtime's directory. Read-only, for migration only.
LEGACY_FEB_DIR = "~/.openclaw/feb"

_AGENT_ENV_VARS = ("SKAGENT", "SKCAPSTONE_AGENT", "SKMEMORY_AGENT")
_DEFAULT_AGENT = "lumina"


def acting_agent() -> str:
    """The active agent, per the standard SKAGENT precedence."""
    for var in _AGENT_ENV_VARS:
        value = (os.environ.get(var) or "").strip()
        if value:
            return value
    return _DEFAULT_AGENT


def sovereign_root() -> Path:
    """The skcapstone root, honouring ``SKCAPSTONE_HOME``."""
    return Path(
        os.environ.get("SKCAPSTONE_HOME") or (Path.home() / ".skcapstone")
    ).expanduser()


def default_feb_directory() -> str:
    """The directory FEBs and seeds are written to.

    ``CLOUD9_FEB_DIR`` wins, so an operator (or a test) can always redirect
    writes without touching code.
    """
    override = (os.environ.get("CLOUD9_FEB_DIR") or "").strip()
    if override:
        return str(Path(override).expanduser())
    return str(sovereign_root() / "agents" / acting_agent() / "trust" / "febs")


def default_seed_directory() -> str:
    """Where seeds live. Kept beside FEBs, one level down, as today."""
    return str(Path(default_feb_directory()) / "seeds")


def legacy_feb_directory() -> str:
    """The pre-eviction location, for migration tooling only. Never written."""
    return str(Path(LEGACY_FEB_DIR).expanduser())
