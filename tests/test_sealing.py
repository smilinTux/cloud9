"""Tests for the additive sealing scaffold (cloud9.sealing).

These assert the scaffold is *additive and honest*:
  - the classical sealer reproduces generator.py's checksum bit-for-bit,
  - the default resolver is always classical (no behaviour change),
  - the sk_pgp PQC backend is inert without a configured key and falls back,
  - a legacy FEB never reports as broken (signature_ok is tri-state None).
"""

import pytest

from cloud9.generator import generate_feb
from cloud9 import sealing


def _feb():
    return generate_feb(emotion="love", intensity=0.95, subject="Chef")


def test_classical_checksum_matches_generator():
    feb = _feb()
    assert feb.integrity.checksum == sealing.content_checksum(feb)


def test_default_sealer_is_classical():
    assert sealing.get_sealer().scheme == sealing.SCHEME_CLASSICAL


def test_classical_sign_returns_none_honest():
    # The legacy cloud9-sig tag is provenance, not a content signature.
    assert sealing.ClassicalSealer().sign(_feb()) is None


def test_legacy_feb_verifies_and_is_not_broken():
    feb = _feb()
    s = sealing.get_sealer()
    v = s.verify(feb, feb.integrity.signature, expected_checksum=feb.integrity.checksum)
    assert v.checksum_ok is True
    assert v.signature_ok is None      # tri-state: no crypto signature to check
    assert v.ok is True                # legacy is valid, never "broken"


def test_tampered_feb_fails_checksum():
    feb = _feb()
    good = feb.integrity.checksum
    feb.emotional_payload.intensity = 0.10  # mutate content after sealing
    v = sealing.get_sealer().verify(feb, feb.integrity.signature, expected_checksum=good)
    assert v.checksum_ok is False
    assert v.ok is False


def test_skpgp_backend_inert_without_key():
    assert sealing.SkPgpSealer().available() is False


def test_resolver_falls_back_when_pqc_not_ready():
    # Requesting sk_pgp without a key must not break generation -> classical.
    s = sealing.get_sealer({"backend": "sk_pgp"})
    assert s.scheme == sealing.SCHEME_CLASSICAL


def test_seal_status_is_honest():
    st = sealing.seal_status()
    assert st["classical_available"] is True
    assert "quantum-proof" not in st["note"].lower().replace("not quantum-proof", "")
    # never claims quantum-proof; uses post-quantum / quantum-resistant framing
    assert "post-quantum" in st["note"].lower()


def test_legacy_provenance_tag_matches_generator_format():
    tag = sealing.ClassicalSealer.legacy_provenance_tag("sess-1", "2026-06-28T00:00:00Z", 0.95)
    assert tag.startswith("cloud9-sig-")
    assert len(tag) == len("cloud9-sig-") + 32  # md5 hex
