# cloud9 — Post-Quantum Migration Path (classical → `sk_pgp` composite)

> **Status: SCAFFOLD / PLANNING — proven-but-gated.** The post-quantum path in
> this document is *designed and stubbed*, not active. Today cloud9 still seals
> FEBs exactly as it always has. The PQC backend is inert until explicitly
> configured. This doc + `cloud9/sealing.py` exist so the swap becomes a
> **configuration change**, never a rewrite — and so it can **never break
> verification of an existing FEB.**

This document inventories cloud9's *real* current integrity handling, defines
the `sk_pgp` composite **ML-DSA-87 + Ed448** target, and lays out a staged,
honestly-gated rollout.

---

## 0. Honest claims (read first)

- ML-DSA (FIPS 204) and ML-KEM (FIPS 203) are **post-quantum / quantum-resistant**
  algorithms. They are **NOT** "quantum-proof," "quantum-safe," or "unbreakable."
  Lattice cryptography is young; the defensible words are *post-quantum* and
  *quantum-resistant*.
- The signing target is a **hybrid composite**: lattice **ML-DSA-87** (FIPS 204)
  **+** classical **Ed448** (RFC 8032). A composite signature is valid **iff BOTH
  legs verify** — the AND is enforced inside `sequoia-openpgp`, not by cloud9.
  Hybrid means *if one leg's math falls, the other still stands* — it is belt-and-
  suspenders, not magic.
- cloud9 adds **no cryptography of its own.** All PQC assurance rests on
  [`sk_pgp`](https://github.com/smilinTux/sk_pgp) → sequoia-openpgp
  (`=2.2.0-pqc.1`) → OpenSSL 3.6 + liboqs 0.14. `sk_pgp` itself is pre-1.0 and
  **not independently security-audited** — treat it as experimental.
- Standards cited: **FIPS 203** (ML-KEM), **FIPS 204** (ML-DSA), **RFC 8032**
  (EdDSA / Ed448), **RFC 9580** (OpenPGP v6), **draft-ietf-openpgp-pqc**
  (composite PQC in OpenPGP).

---

## 1. Current classical usage — the honest inventory

cloud9's "integrity" today is **not** PGP and **not** an asymmetric signature.
It is two fields on `models.Integrity`, written in `generator.generate_feb`
(lines ~223–228) and checked in `validator.validate_feb`:

| Field | What it actually is | Strength | Source |
|---|---|---|---|
| `integrity.checksum` | `sha256:<hex>` over `feb.model_dump(exclude={"integrity"})`, `sort_keys=True` | **Real tamper-evidence** (content hash). No authorship. | `generator._sha256` |
| `integrity.signature` | `cloud9-sig-<md5>` where the MD5 is over `"{session_id}-{created_at}-{intensity}"` | **Provenance tag only.** MD5, and computed over metadata — proves nothing about content or author. | `generator._md5` |

Seeds (`seeds.generate_seed`) carry only a `sha256` checksum — same story,
content integrity but no signature.

**Validator behaviour today:** a missing `checksum` is an *error*; a missing
`signature` is only a *warning*. So FEBs already round-trip fine without any
real signature — which is exactly why the PQC rollout can be additive.

```mermaid
flowchart LR
    GEN["generate_feb()"] --> CK["sha256 checksum<br/>(content integrity ✔)"]
    GEN --> SIG["cloud9-sig md5 tag<br/>(provenance only ✗ not crypto)"]
    CK --> FEB[".feb JSON"]
    SIG --> FEB
    FEB --> VAL["validate_feb()<br/>checksum=error · signature=warn"]
```

**Where 'PGP for identity/sealing' really lives:** not in this repo's code. In
SKWorld, agent identity is owned by **capauth** and the OpenPGP signing surface
is being migrated to `sk_pgp` fleet-wide (the PGPy/`gpg 2.4` replacement). cloud9
is a *consumer* of that identity — the `integrity.signature` slot is the natural
place a real capauth/`sk_pgp` agent signature belongs. This migration fills that
slot **for real**, for the first time.

---

## 2. The target — `sk_pgp` composite ML-DSA-87 + Ed448, detached, sidecar

`sk_pgp` exposes exactly the surface we need:

```python
import sk_pgp
key  = sk_pgp.Key.generate("Lumina <lumina@skworld.io>", "mldsa87-ed448", password="…")
sig  = key.sign_detached(canonical_feb_bytes, password="…")   # armored detached sig
cert = key.cert
assert cert.verify_detached(sig, canonical_feb_bytes) is True  # True iff BOTH legs
cert.fingerprint        # 64 hex (v6/RFC9580)
cert.is_post_quantum    # True
```

**Design decisions (and why):**

1. **Detached signature in a sidecar, not inside the FEB JSON.** The signature is
   written to `<feb>.sig` (armored), *not* into `integrity.signature`. This keeps:
   - the `sha256` checksum stable (it already excludes `integrity`),
   - **bit-for-bit JSON cross-compatibility with the JS/npm build** (the FEB body
     is untouched), and
   - signing/verification a pure add-on a legacy reader simply ignores.
2. **Signature is computed over the same canonical bytes as the checksum**
   (`sealing.canonical_bytes` == generator's `model_dump(exclude integrity)` +
   `sort_keys`). One canonicalisation, two artifacts (hash + sig).
3. **Composite suite default = `mldsa87-ed448` (NIST L5).** `mldsa65-ed25519`
   (L3) is offered for lighter contexts. Suite is config-selectable.
4. **Verification is tri-state and never harsher than today.** A FEB with no
   sidecar verifies as it does now (checksum only). A FEB *with* a sidecar must
   have both composite legs verify.

```mermaid
flowchart LR
    subgraph NOW["classical (default, unchanged)"]
      C1["sha256 checksum"] --> F1[".feb"]
    end
    subgraph PQC["sk_pgp backend (gated)"]
      CAN["canonical_bytes(feb)"] --> SD["key.sign_detached()<br/>ML-DSA-87 + Ed448"]
      SD --> SC["<feb>.sig (armored sidecar)"]
      CAN --> C2["sha256 checksum (same)"]
    end
    F1 -. "no behaviour change" .-> NOW
```

---

## 3. The seam — `cloud9/sealing.py` (already in this repo, additive)

The scaffold introduces one interface and a config resolver. **It is not wired
into the default generate/rehydrate path** — importing it changes nothing.

```python
from cloud9 import get_sealer, seal_status

sealer = get_sealer()            # -> ClassicalSealer (default, always)
sealer.checksum(feb)             # identical to feb.integrity.checksum today
verdict = sealer.verify(feb, feb.integrity.signature,
                        expected_checksum=feb.integrity.checksum)
verdict.ok                       # True for legacy FEBs (checksum holds, sig=None)
```

- `ClassicalSealer` — reproduces today's behaviour exactly (verified by a test
  that asserts `feb.integrity.checksum == sealing.content_checksum(feb)`).
  Its `sign()` returns `None` **on purpose** — honest that there is no content
  signature today.
- `SkPgpSealer` — produces/verifies the composite detached signature. **Inert**
  unless `sk_pgp` imports *and* a key is configured *and* it is selected.
- `get_sealer()` — resolves backend from config/env, **defaults to classical**,
  and *falls back to classical* if PQC is requested but not ready. Enabling PQC
  can therefore never break FEB generation.

**Config (the only signal — this is the future "swap"):**

| Env var | Meaning | Default |
|---|---|---|
| `CLOUD9_SEAL_BACKEND` | `classical` \| `sk_pgp` | `classical` |
| `CLOUD9_SEAL_SCHEME` | `mldsa87-ed448` \| `mldsa65-ed25519` | `mldsa87-ed448` |
| `CLOUD9_SEAL_KEY` | path to armored secret key | — |
| `CLOUD9_SEAL_CERT` | path to armored public cert (optional) | — |
| `CLOUD9_SEAL_PASSWORD` | passphrase (prefer gpg-agent in prod) | — |

---

## 4. Staged rollout (proven-but-gated, never breaks existing FEBs)

Each stage is independently revertible. The working classical path is **never
removed.**

### Stage 0 — Scaffold (DONE, this change)
- `cloud9/sealing.py` interface + `ClassicalSealer` + gated `SkPgpSealer` +
  `get_sealer`/`seal_status`. Tests prove classical parity + PQC gating.
- No generate/rehydrate/validate behaviour changes. `sk_pgp` is **not** a
  dependency (optional extra only).

### Stage 1 — Optional dependency + diagnostics (additive)
- Add `pqc = ["sk_pgp>=0.x"]` to `pyproject.toml` `[project.optional-dependencies]`.
- Add a read-only `cloud9 seal status` CLI command surfacing `seal_status()`.
- **Gate:** nothing signs yet; purely observability.

### Stage 2 — Opt-in detached signing (write side, sidecar)
- When `CLOUD9_SEAL_BACKEND=sk_pgp` + key configured, `save_feb` *additionally*
  writes `<feb>.sig`. The FEB JSON is unchanged.
- **Gate:** off by default; absence of `sk_pgp`/key → silent classical.
- **Invariant:** a FEB written in this stage is still a fully valid legacy FEB.

### Stage 3 — Opt-in verification (read side)
- `rehydrate_from_feb` / `validate_feb` *optionally* look for a sidecar and, if
  present, verify it via `SkPgpSealer`. Missing sidecar = today's behaviour.
- **Gate:** verification only *adds* assurance; it never rejects a FEB that is
  valid today. A failed PQC signature is surfaced as an explicit
  `signature_ok=False` verdict (caller decides policy).

### Stage 4 — Enforcement (opt-in, per-deployment, far future)
- A deployment may set a strict policy ("require valid PQC sidecar for FEBs newer
  than date D"). This is a *deployment* choice, shipped off, and only after
  `sk_pgp` is audited and keys are provisioned via capauth.
- **Never** retroactively invalidates historical FEBs.

```mermaid
flowchart TD
    S0["Stage 0 ✓ scaffold<br/>(classical only, sk_pgp gated)"] --> S1["Stage 1 opt dep + status"]
    S1 --> S2["Stage 2 sign → sidecar<br/>(off by default)"]
    S2 --> S3["Stage 3 verify sidecar<br/>(adds assurance, never rejects)"]
    S3 --> S4["Stage 4 enforce<br/>(per-deployment, post-audit)"]
    classDef done fill:#1f6feb,color:#fff;
    class S0 done;
```

---

## 5. Invariants (what this migration promises)

1. **Existing FEB verification never breaks.** Every FEB valid today stays valid
   at every stage. The `sha256` checksum is untouched; the legacy `cloud9-sig`
   tag is preserved as-is.
2. **Default is classical, forever available.** No PQC dependency is required to
   use cloud9. `get_sealer()` returns `ClassicalSealer` unless explicitly opted in.
3. **PQC is additive and sidecar-based.** The FEB JSON body and its JS/npm
   cross-compatibility are never perturbed.
4. **Honest verdicts.** `signature_ok` is tri-state: `None` (no signature — legacy),
   `True` (both composite legs verified), `False` (present but failed). No
   silent upgrade of "unsigned" to "trusted."
5. **No live daemons touched.** This change is documentation + an unwired module +
   tests. skchat/skcomms and the cloud9 daemon are unaffected.

---

## 6. Open items (honest TODO)

- `sk_pgp` key provisioning for agents should flow from **capauth** (identity
  source of truth), not ad-hoc files — Stage 2 should consume a capauth-issued
  agent key, with the passphrase via gpg-agent.
- Confirm `sk_pgp`'s exact loader names (`Key.from_file` / `Cert.from_file`) at
  activation — the scaffold uses the README's documented surface
  (`Key.generate` / `sign_detached` / `Cert.verify_detached`) and thin,
  obvious load calls that can be adjusted in one place.
- Decide sidecar naming + discovery convention (`<feb>.sig` vs an `integrity`
  sub-key) once Stage 2 lands; sidecar is preferred to protect JS cross-compat.
- `sk_pgp` must clear an independent security review before any Stage 4
  enforcement.

---

## Related projects

- **[`sk_pgp`](https://github.com/smilinTux/sk_pgp)** — sovereign post-quantum
  OpenPGP for Python (PyO3 → sequoia-openpgp `2.2.0-pqc.1`); the PGPy / `gpg 2.4`
  replacement. Provides the composite **ML-DSA-87 + Ed448** signing used here.
- **[`sk-pqc`](https://github.com/smilinTux/sk-pqc-py)** — hybrid
  **X25519 + ML-KEM-768** key encapsulation (Python / Rust / Dart). Sibling KEM
  layer; site **[skpqc.skworld.io](https://skpqc.skworld.io)**.

---

Part of the **[SKWorld](https://skworld.io)** sovereign ecosystem · 🐧 smilinTux
