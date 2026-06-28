"""Stage-1 diagnostics: the `cloud9 seal status` CLI subcommand (read-only).

Surfaces `sealing.seal_status()` so an operator can see, at a glance, the active
sealer, whether `sk_pgp` is importable, whether a key is configured, and that the
honest-claims note ("post-quantum / quantum-resistant ... NOT quantum-proof") is
front-and-centre. Read-only: it never signs and never mutates anything.
"""

import json

import pytest
from click.testing import CliRunner

from cloud9 import sealing
from cloud9.cli import main
from cloud9.generator import generate_feb, save_feb

sk_pgp = sealing._sk_pgp()
requires_skpgp = pytest.mark.skipif(sk_pgp is None, reason="sk_pgp not installed")


@pytest.fixture
def runner():
    return CliRunner()


def test_seal_status_default_classical(runner, monkeypatch):
    # No env, no flags -> classical is the active scheme.
    for var in ("CLOUD9_SEAL_BACKEND", "CLOUD9_SEAL_KEY", "CLOUD9_SEAL_CERT",
                "CLOUD9_SEAL_SCHEME", "CLOUD9_SEAL_PASSWORD"):
        monkeypatch.delenv(var, raising=False)
    result = runner.invoke(main, ["seal", "status"])
    assert result.exit_code == 0
    assert "classical" in result.output.lower()
    assert "quantum-proof" in result.output.lower()   # honest-claims note present


def test_seal_status_json(runner, monkeypatch):
    for var in ("CLOUD9_SEAL_BACKEND", "CLOUD9_SEAL_KEY", "CLOUD9_SEAL_CERT"):
        monkeypatch.delenv(var, raising=False)
    result = runner.invoke(main, ["seal", "status", "--json-output"])
    assert result.exit_code == 0
    data = json.loads(result.output)
    assert data["active_scheme"] == sealing.SCHEME_CLASSICAL
    assert data["classical_available"] is True
    assert "sk_pgp_importable" in data
    assert data["active_is_post_quantum"] is False


@requires_skpgp
def test_seal_status_pqc_when_key_supplied(runner, tmp_path):
    key = sk_pgp.Key.generate("Lumina <lumina@skworld.io>", "mldsa87-ed448", password="pw")
    key_path = tmp_path / "agent-key.asc"
    key_path.write_text(key.to_armor(), encoding="utf-8")
    result = runner.invoke(
        main,
        ["seal", "status", "--backend", "sk_pgp", "--key", str(key_path),
         "--json-output"],
    )
    assert result.exit_code == 0
    data = json.loads(result.output)
    assert data["active_scheme"] == sealing.SCHEME_SKPGP_MLDSA87_ED448
    assert data["active_is_post_quantum"] is True
    assert data["sk_pgp_ready"] is True


@requires_skpgp
def test_validate_cli_surfaces_sidecar_seal(runner, tmp_path):
    key = sk_pgp.Key.generate("Lumina <lumina@skworld.io>", "mldsa87-ed448", password="pw")
    key_path = tmp_path / "agent-key.asc"
    key_path.write_text(key.to_armor(), encoding="utf-8")
    feb = generate_feb(emotion="love", intensity=0.95, subject="Chef")
    cfg = {"backend": "sk_pgp", "key": str(key_path), "password": "pw"}
    res = save_feb(feb, directory=str(tmp_path), seal_config=cfg)
    result = runner.invoke(
        main,
        ["validate", res["filepath"], "--backend", "sk_pgp", "--key", str(key_path)],
    )
    assert result.exit_code == 0
    assert "PQC SEAL" in result.output.upper()
