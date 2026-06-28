"""Stage-3 follow-up: `validate_feb` sidecar verification (tri-state, additive).

These assert that the *validation* read-path — not just rehydrate — can verify a
`<feb>.sig` detached-signature sidecar when asked, while staying byte-for-byte
behaviour-compatible by default:

  - `validate_feb(feb)` with **no** `feb_path` is unchanged: no `seal` key, every
    FEB valid today stays valid;
  - `validate_feb(feb, feb_path=...)` with **no sidecar** is likewise unchanged
    (no `seal` key) — verification is purely opt-in by the presence of a sidecar;
  - when a sidecar is present and verifies, the result gains an honest `seal`
    block (`signature_ok=True`) and an info line, and the FEB stays valid;
  - a present-but-failing signature is `signature_ok=False` **and** marks the FEB
    invalid (real tamper-evidence — only ever for FEBs that opted into a sidecar);
  - a present-but-unverifiable signature (no cert/key) is `signature_ok=None`
    (honest "unverifiable"), surfaced as a warning, never a rejection.

`sk_pgp` is optional; the cryptographic round-trip tests skip when it is absent.
"""

import json
from pathlib import Path

import pytest

from cloud9 import sealing
from cloud9.generator import generate_feb, save_feb
from cloud9.validator import validate_feb, get_validation_report

sk_pgp = sealing._sk_pgp()
requires_skpgp = pytest.mark.skipif(sk_pgp is None, reason="sk_pgp not installed")


def _feb():
    return generate_feb(emotion="love", intensity=0.95, subject="Chef")


# --------------------------------------------------------------------------- #
# Default / classical — unchanged shape, never a `seal` key
# --------------------------------------------------------------------------- #


def test_validate_without_path_has_no_seal_key():
    result = validate_feb(_feb().model_dump())
    assert "seal" not in result
    assert result["is_valid"]


def test_validate_with_path_but_no_sidecar_has_no_seal_key(tmp_path):
    res = save_feb(_feb(), directory=str(tmp_path))
    data = json.loads(Path(res["filepath"]).read_text(encoding="utf-8"))
    result = validate_feb(data, feb_path=res["filepath"])
    assert "seal" not in result          # no sidecar => no change at all
    assert result["is_valid"]


# --------------------------------------------------------------------------- #
# Gated PQC sidecar verification through the validate path
# --------------------------------------------------------------------------- #


@pytest.fixture
def skpgp_key(tmp_path):
    key = sk_pgp.Key.generate("Lumina <lumina@skworld.io>", "mldsa87-ed448", password="pw")
    key_path = tmp_path / "agent-key.asc"
    key_path.write_text(key.to_armor(), encoding="utf-8")
    return key_path


@requires_skpgp
def test_validate_verifies_present_sidecar(tmp_path, skpgp_key):
    cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    data = json.loads(Path(res["filepath"]).read_text(encoding="utf-8"))
    result = validate_feb(data, feb_path=res["filepath"], seal_config=cfg)
    assert result["seal"]["signature_ok"] is True
    assert result["seal"]["checksum_ok"] is True
    assert result["seal"]["is_post_quantum"] is True
    assert result["seal"]["fingerprint"]
    assert result["is_valid"]            # still valid, now cryptographically too
    assert any("sidecar signature verified" in i.lower() for i in result["info"])


@requires_skpgp
def test_validate_tamper_marks_invalid(tmp_path, skpgp_key):
    cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    p = Path(res["filepath"])
    data = json.loads(p.read_text(encoding="utf-8"))
    data["emotional_payload"]["intensity"] = 0.01     # tamper after signing
    result = validate_feb(data, feb_path=res["filepath"], seal_config=cfg)
    assert result["seal"]["signature_ok"] is False
    assert not result["is_valid"]                     # failed sig => invalid
    assert any("FAILED" in e for e in result["errors"])


@requires_skpgp
def test_validate_unverifiable_sidecar_is_warning_not_error(tmp_path, skpgp_key):
    # Sign, then validate with NO verification config: sidecar present but nothing
    # to check it against -> signature_ok=None, a warning, still valid.
    cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    data = json.loads(Path(res["filepath"]).read_text(encoding="utf-8"))
    result = validate_feb(data, feb_path=res["filepath"])  # no seal_config
    assert result["seal"]["signature_ok"] is None
    assert result["is_valid"]
    assert any("unverifiable" in w.lower() for w in result["warnings"])


@requires_skpgp
def test_validation_report_includes_seal_section(tmp_path, skpgp_key):
    cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    data = json.loads(Path(res["filepath"]).read_text(encoding="utf-8"))
    report = get_validation_report(data, feb_path=res["filepath"], seal_config=cfg)
    assert "PQC SEAL" in report.upper()
    assert "mldsa87-ed448" in report
