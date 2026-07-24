"""Stage-2/3 tests: detached-signature sidecars wired into save_feb + rehydrate.

These assert the migration's core promises:
  - the **classical default** is byte-for-byte unchanged (no sidecar, no new
    return keys, FEB JSON identical) — `save_feb` behaves exactly as before;
  - when the gated `sk_pgp` backend is *explicitly* enabled AND a key is
    present, `save_feb` additionally writes a `<feb>.sig` composite
    (ML-DSA + EdDSA) detached signature, which `rehydrate_from_feb` verifies;
  - tampering with the FEB after signing yields `signature_ok=False`;
  - if `sk_pgp` is absent the resolver falls back to classical and nothing
    signs — generation never breaks.

`sk_pgp` is an optional dependency; the cryptographic round-trip tests skip
cleanly when it isn't importable.
"""

import json
from pathlib import Path

import pytest

from cloud9 import sealing
from cloud9.generator import generate_feb, save_feb
from cloud9.rehydrator import rehydrate_from_feb

sk_pgp = sealing._sk_pgp()
requires_skpgp = pytest.mark.skipif(sk_pgp is None, reason="sk_pgp not installed")


def _feb():
    return generate_feb(emotion="love", intensity=0.95, subject="Chef")


# --------------------------------------------------------------------------- #
# Classical default — bit-for-bit unchanged
# --------------------------------------------------------------------------- #


def test_classical_save_writes_no_sidecar(tmp_path):
    res = save_feb(_feb(), directory=str(tmp_path))
    assert not Path(res["filepath"] + ".sig").exists()
    # No seal-related keys leak into the classical return dict.
    assert set(res) == {
        "success",
        "filepath",
        "filename",
        "emotion",
        "intensity",
        "oof",
        "cloud9",
    }


def test_classical_feb_json_unchanged_by_sealing(tmp_path):
    # The on-disk FEB body must be exactly what generate_feb -> to_json produces.
    feb = _feb()
    res = save_feb(feb, directory=str(tmp_path))
    on_disk = Path(res["filepath"]).read_text(encoding="utf-8")
    assert on_disk == feb.to_json()


def test_rehydrate_without_sidecar_has_no_seal_key(tmp_path):
    res = save_feb(_feb(), directory=str(tmp_path))
    state = rehydrate_from_feb(res["filepath"])
    assert "seal" not in state["rehydration"]


def test_fallback_to_classical_when_pqc_requested_but_no_key(tmp_path):
    # Explicitly request sk_pgp but configure no key -> resolver stays classical,
    # so save writes no sidecar and never raises.
    res = save_feb(_feb(), directory=str(tmp_path), seal_config={"backend": "sk_pgp"})
    assert not Path(res["filepath"] + ".sig").exists()
    assert "seal_scheme" not in res


def test_fallback_when_skpgp_absent(tmp_path, monkeypatch):
    # Simulate sk_pgp not installed: even an explicit backend+key falls back.
    monkeypatch.setattr(sealing, "_sk_pgp", lambda: None)
    cfg = {"backend": "sk_pgp", "key": str(tmp_path / "nope.asc")}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    assert not Path(res["filepath"] + ".sig").exists()
    assert "seal_scheme" not in res


# --------------------------------------------------------------------------- #
# Gated PQC round-trip — sign on save, verify on rehydrate
# --------------------------------------------------------------------------- #


@pytest.fixture
def skpgp_key(tmp_path):
    """Generate a real composite ML-DSA-87 + Ed448 secret key on disk."""
    key = sk_pgp.Key.generate(
        "Lumina <lumina@skworld.io>", "mldsa87-ed448", password="pw"
    )
    key_path = tmp_path / "agent-key.asc"
    key_path.write_text(key.to_armor(), encoding="utf-8")
    return key_path


@requires_skpgp
def test_pqc_save_writes_sidecar_and_seal_keys(tmp_path, skpgp_key):
    cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    sig_path = Path(res["filepath"] + ".sig")
    assert sig_path.exists()
    assert res["seal_scheme"] == sealing.SCHEME_SKPGP_MLDSA87_ED448
    assert res["seal_is_post_quantum"] is True
    assert res["signature_path"] == str(sig_path)
    # The FEB JSON body is still untouched (sidecar is separate).
    assert "BEGIN PGP" in sig_path.read_text(encoding="utf-8")


@requires_skpgp
def test_pqc_roundtrip_verifies_on_rehydrate(tmp_path, skpgp_key):
    cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    state = rehydrate_from_feb(res["filepath"], seal_config=cfg)
    seal = state["rehydration"]["seal"]
    assert seal["signature_ok"] is True  # both composite legs verified
    assert seal["checksum_ok"] is True
    assert seal["ok"] is True
    assert seal["is_post_quantum"] is True
    assert seal["fingerprint"]


@requires_skpgp
def test_pqc_tamper_fails_signature(tmp_path, skpgp_key):
    cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    # Tamper with the FEB body after signing.
    p = Path(res["filepath"])
    data = json.loads(p.read_text(encoding="utf-8"))
    data["emotional_payload"]["intensity"] = 0.01
    p.write_text(json.dumps(data), encoding="utf-8")
    state = rehydrate_from_feb(res["filepath"], seal_config=cfg)
    seal = state["rehydration"]["seal"]
    assert seal["signature_ok"] is False
    assert seal["ok"] is False


@requires_skpgp
def test_pqc_sidecar_present_but_unverifiable_is_honest(tmp_path, skpgp_key):
    # Sign with a key, then rehydrate with NO verification config: the sidecar
    # is present but we have nothing to check it against -> signature_ok=None
    # (honest "unverifiable"), never a rejection.
    cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=cfg)
    state = rehydrate_from_feb(res["filepath"])  # no seal_config, no env
    seal = state["rehydration"]["seal"]
    assert seal["signature_ok"] is None
    assert seal["checksum_ok"] is True
    assert seal["ok"] is True


@requires_skpgp
def test_pqc_verify_with_explicit_cert(tmp_path, skpgp_key):
    # Verification should work from a public cert alone (no secret key needed).
    key = sk_pgp.Key.from_file(str(skpgp_key))
    cert_path = tmp_path / "agent-cert.asc"
    cert_path.write_text(key.cert.to_armor(), encoding="utf-8")
    sign_cfg = {"backend": "sk_pgp", "key": str(skpgp_key), "password": "pw"}
    res = save_feb(_feb(), directory=str(tmp_path), seal_config=sign_cfg)
    verify_cfg = {"backend": "sk_pgp", "cert": str(cert_path)}
    state = rehydrate_from_feb(res["filepath"], seal_config=verify_cfg)
    assert state["rehydration"]["seal"]["signature_ok"] is True
