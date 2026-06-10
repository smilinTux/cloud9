"""Tri-mode tests for the cloud9 ⇄ skcapstone integration adapter.

Contract per skcapstone/docs/ADR-optional-integration-backbone.md:
  * standalone  (SK_STANDALONE=1)         → native fallback (log only)
  * absent      (_sdk = None)             → native fallback (log only)
  * integrated  (skcapstone present,
                 SKCAPSTONE_HOME sandboxed) → sk-alert / skscheduler / registry

skcapstone is installed in the dev venv, so "integrated" mode is exercised
against a sandboxed temp SKCAPSTONE_HOME — writes never leak to
~/.skcapstone/config/jobs.d/ or ~/.skcapstone/registry/.
"""

from __future__ import annotations

import json

import pytest

from cloud9_protocol import integration


@pytest.fixture
def home(tmp_path, monkeypatch):
    """Sandbox skcapstone's shared home at a temp dir for each test.

    Both SKCAPSTONE_HOME (used by the scheduler_jobs writer) and the
    skcapstone.AGENT_HOME module attribute (captured at import-time) are
    redirected to tmp_path so no fragment ever escapes to the real home.
    """
    monkeypatch.setenv("SKCAPSTONE_HOME", str(tmp_path))
    monkeypatch.delenv("SK_STANDALONE", raising=False)
    import skcapstone

    monkeypatch.setattr(skcapstone, "AGENT_HOME", str(tmp_path))
    return tmp_path


# ---------------------------------------------------------------------------
# Standalone mode — SK_STANDALONE=1
# ---------------------------------------------------------------------------


def test_standalone_flag_disables_integration(monkeypatch):
    """SK_STANDALONE=1 forces native mode regardless of skcapstone presence."""
    monkeypatch.setenv("SK_STANDALONE", "1")
    assert integration.is_present() is False
    assert integration.alert("feb_load_failed", {"filepath": "/x.feb"}, level="error") is False
    assert integration.ensure_schedule() is False
    assert integration.register_self() is False
    assert integration.unregister_schedule() is False


# ---------------------------------------------------------------------------
# Absent mode — skcapstone package not importable
# ---------------------------------------------------------------------------


def test_absent_skcapstone_falls_back_to_log(monkeypatch):
    """When _sdk is None (skcapstone absent), every call returns False gracefully."""
    monkeypatch.delenv("SK_STANDALONE", raising=False)
    monkeypatch.setattr(integration, "_sdk", None)
    assert integration.is_present() is False
    assert integration.alert("rehydration_failed", {"filepath": "/tmp/x.feb"}) is False
    assert integration.ensure_schedule() is False
    assert integration.register_self() is False
    assert integration.unregister_schedule() is False


def test_absent_sdk_alert_returns_false_for_all_levels(monkeypatch):
    """Native fallback: alert() always returns False for any level."""
    monkeypatch.setattr(integration, "_sdk", None)
    for level in ("info", "warn", "error", "critical"):
        assert integration.alert("oof_triggered", {"oof": True}, level=level) is False


# ---------------------------------------------------------------------------
# Integrated mode — skcapstone present, SKCAPSTONE_HOME sandboxed
# ---------------------------------------------------------------------------


def test_is_present_true_when_skcapstone_available(home):
    """With skcapstone installed and no SK_STANDALONE, is_present() is True."""
    assert integration.is_present() is True


def test_alert_publishes_to_correct_severity_topic(home):
    """alert() writes a pubsub message at topic cloud9.<level>."""
    assert integration.alert("feb_load_failed", {"filepath": "/tmp/test.feb", "error": "no file"}, level="error") is True
    topic_dir = home / "pubsub" / "topics" / "cloud9.error"
    assert topic_dir.is_dir(), f"expected topic dir {topic_dir} to exist"
    msg_files = list(topic_dir.glob("msg-*.json"))
    assert msg_files, "expected at least one pubsub message file"
    data = json.loads(msg_files[0].read_text())
    assert data["topic"] == "cloud9.error"
    # CRITICAL: event name must be in payload, NOT in topic suffix
    assert data["payload"]["event"] == "feb_load_failed"
    assert data["payload"]["filepath"] == "/tmp/test.feb"


def test_alert_warn_level_publishes(home):
    """warn-level alert lands on cloud9.warn topic."""
    assert integration.alert("rehydration_incomplete", {"score": 0.4}, level="warn") is True
    topic_dir = home / "pubsub" / "topics" / "cloud9.warn"
    assert topic_dir.is_dir()
    data = json.loads(next(topic_dir.glob("msg-*.json")).read_text())
    assert data["payload"]["event"] == "rehydration_incomplete"


def test_alert_info_level_publishes(home):
    """info-level alert lands on cloud9.info topic (OOF/Cloud9 achievement)."""
    assert integration.alert("cloud9_achieved", {"score": 0.95, "emotion": "love"}, level="info") is True
    topic_dir = home / "pubsub" / "topics" / "cloud9.info"
    assert topic_dir.is_dir()
    data = json.loads(next(topic_dir.glob("msg-*.json")).read_text())
    assert data["payload"]["event"] == "cloud9_achieved"
    assert data["payload"]["score"] == 0.95


def test_ensure_schedule_registers_rehydration_check(home):
    """ensure_schedule() writes a jobs.d drop-in for cloud9_rehydration_check."""
    assert integration.ensure_schedule(interval_hours=6) is True
    from skcapstone.scheduler_jobs import load_jobs_with_dropins

    jobs = {j.name: j for j in load_jobs_with_dropins(home / "config" / "jobs.yaml")}
    assert integration.REHYDRATION_JOB in jobs, f"expected {integration.REHYDRATION_JOB} in {list(jobs)}"
    assert jobs[integration.REHYDRATION_JOB].command == "cloud9 validate --latest"
    assert jobs[integration.REHYDRATION_JOB].every_seconds == 6 * 3600


def test_ensure_schedule_idempotent(home):
    """Calling ensure_schedule() twice does not raise."""
    assert integration.ensure_schedule() is True
    assert integration.ensure_schedule() is True


def test_unregister_schedule_removes_job(home):
    """unregister_schedule() removes the rehydration-check drop-in."""
    integration.ensure_schedule()
    assert integration.unregister_schedule() is True
    from skcapstone.scheduler_jobs import load_jobs_with_dropins

    jobs = {j.name: j for j in load_jobs_with_dropins(home / "config" / "jobs.yaml")}
    assert integration.REHYDRATION_JOB not in jobs


def test_register_self_writes_registry_entry(home):
    """register_self() writes a service registry JSON file."""
    assert integration.register_self(pid_file="/tmp/cloud9-test.pid") is True
    registry_file = home / "registry" / "cloud9.json"
    assert registry_file.exists(), f"expected registry file {registry_file}"
    entry = json.loads(registry_file.read_text())
    assert entry["name"] == "cloud9"


def test_no_leak_to_real_home(home):
    """All integrated operations use the sandboxed home, not ~/.skcapstone."""
    import os
    from pathlib import Path

    integration.ensure_schedule()
    integration.register_self(pid_file="/tmp/cloud9-leak-test.pid")

    # Verify writes went to sandboxed home
    assert (home / "registry" / "cloud9.json").exists()

    # Verify real home is clean (if it exists, the job file must not be there)
    real_jobs_d = Path(os.path.expanduser("~/.skcapstone/config/jobs.d"))
    if real_jobs_d.exists():
        assert not (real_jobs_d / f"{integration.REHYDRATION_JOB}.yaml").exists()


# ---------------------------------------------------------------------------
# Wiring smoke: rehydrator integration wired correctly
# ---------------------------------------------------------------------------


def test_rehydrator_imports_integration_without_error():
    """cloud9_protocol.rehydrator can be imported without errors."""
    import cloud9_protocol.rehydrator  # noqa: F401


def test_cli_imports_integration_without_error():
    """cloud9_protocol.cli can be imported without errors."""
    import cloud9_protocol.cli  # noqa: F401


def test_integration_module_constants():
    """Check module-level constants are correct."""
    assert integration.SERVICE == "cloud9"
    assert integration.REHYDRATION_JOB == "cloud9_rehydration_check"


def test_rehydrator_feb_load_failure_fires_alert(home, tmp_path):
    """When rehydrate_from_feb() fails to load a file, an alert is sent."""
    from cloud9_protocol.rehydrator import rehydrate_from_feb

    bad_path = tmp_path / "nonexistent.feb"
    with pytest.raises(RuntimeError, match="Failed to load FEB file"):
        rehydrate_from_feb(str(bad_path))

    # The alert should have been published to cloud9.error
    topic_dir = home / "pubsub" / "topics" / "cloud9.error"
    assert topic_dir.is_dir(), "expected cloud9.error topic dir after FEB load failure"
    data = json.loads(next(topic_dir.glob("msg-*.json")).read_text())
    assert data["payload"]["event"] == "feb_load_failed"
