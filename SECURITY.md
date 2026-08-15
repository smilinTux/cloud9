# Security Policy

cloud9 is part of the [SKWorld](https://skworld.io) sovereign agent ecosystem. This
policy covers the `cloud9` Python package, the JavaScript implementation under `src/`,
and the local daemon in `daemon/`.

## Reporting a vulnerability

**Primary channel: GitHub private vulnerability reporting.** Open a report at
[github.com/smilinTux/cloud9/security/advisories/new](https://github.com/smilinTux/cloud9/security/advisories/new).
That keeps the report private until a fix is available and gives us a place to
coordinate a CVE if one is warranted.

If GitHub private reporting is unavailable to you, email **hello@smilintux.org** with
`[cloud9 security]` in the subject.

**Please do not open a public issue for a security problem.**

### What to include

- The affected version (`cloud9 --version`) or commit SHA, and whether you hit it via the
  Python package, the JS library, or the daemon.
- A minimal reproduction. A `.feb` or `.seed.json` fixture that triggers it is ideal.
  Scrub anything personal out of it first: FEB files are emotional records, not test data.
- The impact you believe it has, and any suggested fix.

### Our commitment

| Stage | Target |
|---|---|
| Acknowledgement of your report | **within 72 hours** |
| Initial assessment and severity call | within 7 days |
| Fix or a documented mitigation for a confirmed high-severity issue | within 30 days |
| Public advisory and credit (if you want it) | at release, coordinated with you |

We will keep you updated as the assessment moves, and we will tell you plainly if we
decide something is out of scope rather than letting it go quiet.

## Safe harbour

We will not pursue or support legal action against anyone who makes a good-faith effort
to comply with this policy while researching cloud9. Good faith means: you only touch
systems and data you own or are authorised to test, you avoid privacy violations and
service degradation, you do not exfiltrate data beyond the minimum needed to demonstrate
the issue, and you give us reasonable time to fix things before disclosing publicly. If
you are unsure whether something is in bounds, ask first.

## Supported versions

cloud9's version is derived from the git tag by setuptools-scm, so a "version" here means
a published PyPI release.

| Version | Supported |
|---|---|
| Latest published `1.2.x` release | Yes, fixes land here |
| Earlier `1.x` releases | No, upgrade to the latest `1.2.x` |
| `0.x` | No |
| The `openclaw-plugin-python/` subtree | No. Dead code for a runtime evicted from the fleet on 2026-04-23. Not built, not tested, not published. |

Fixes are shipped as a new tagged release. There are no backport branches.

## Scope

### In scope

- Path traversal or arbitrary write via a crafted `.feb` / `.seed.json` filename or
  content, in either the Python or JavaScript loaders.
- Code execution or injection through FEB or seed parsing, validation, or germination
  (`cloud9/seeds.py::germinate`, `cloud9/rehydrator.py`, `cloud9/validator.py`).
- Anything that causes cloud9 to write outside its resolved FEB directory
  (`cloud9/paths.py::default_feb_directory`), or that lets an attacker-controlled value
  redirect that path.
- Prompt-injection paths where FEB or seed content is rehydrated into an agent's context.
  A FEB is untrusted input if it did not come from you.
- Daemon issues: `daemon/cloud9-daemon.js` reading, writing, or executing something it
  should not, or escaping the unit's `ReadWritePaths` confinement.
- Integrity-checking flaws in `cloud9/sealing.py` or `cloud9/validator.py`, including a
  checksum that can be forged or a validation bypass.
- Secrets or key material leaking into a FEB, a log, or a CI artifact.

### Out of scope

- **The `cloud9-sig-<md5>` provenance tag not being a real signature.** That is documented,
  intentional, and stated below. It is not a vulnerability report; it is the current
  design, honestly labelled.
- Vulnerabilities in `sk_pgp`, sequoia-openpgp, or liboqs. Report those to
  [sk_pgp](https://github.com/smilinTux/sk_pgp) upstream. cloud9 implements no
  cryptography of its own.
- The `openclaw-plugin-python/` subtree (dead, see the supported-versions table).
- Anything requiring an attacker who already has write access to the operator's home
  directory or to `~/.skcapstone/`. At that point the FEB store is the least of it.
- Missing hardening on a self-hosted deployment you configured yourself (for example
  running the daemon without `--config`, or pointing `CLOUD9_FEB_DIR` somewhere shared).
- Denial of service by feeding the daemon an enormous FEB directory.
- Automated scanner output with no demonstrated impact.

## Security posture of the sealing layer

**Read this before making any claim about cloud9 and cryptography.**

cloud9's integrity layer is **experimental and unaudited**. It has had no third-party
security review. Do not rely on it as the sole control for anything that matters.

`cloud9/sealing.py` is an additive seam that is **inert by default**: it is not wired into
the default generate or rehydrate path.

- **Default (`classical`) backend.** Emits a SHA-256 content checksum plus a legacy
  `cloud9-sig-<md5>` provenance tag. **That tag is an MD5 over session-id, timestamp and
  intensity. It is not a cryptographic signature over the FEB content and proves nothing
  about authorship.** MD5 is broken for collision resistance and is used here only as a
  short opaque provenance label, never as an authenticity control. The only tamper
  evidence cloud9 provides today is the SHA-256 checksum, and a checksum is not a
  signature: anyone who can rewrite the FEB can rewrite the checksum.
- **Optional (`sk_pgp`) backend.** Produces a genuine OpenPGP detached signature over the
  canonical FEB bytes using the composite ML-DSA-87 plus Ed448 suite (FIPS 204 ML-DSA,
  RFC 8032 Ed448). It stays inert unless `sk_pgp` is importable, a signing key is
  configured, and the backend is explicitly selected. Otherwise `get_sealer` falls back to
  `classical`. `sk_pgp` is not a declared dependency; it lives in the optional `pqc` extra.
- **Honest claims.** ML-DSA and ML-KEM are **post-quantum** / **quantum-resistant**. They
  are not "quantum-proof". The composite is a **hybrid**: a signature verifies only if both
  the lattice leg and the classical leg verify, and the construction remains secure as long
  as either leg still stands. All post-quantum assurance rests on sequoia-openpgp and
  liboqs via `sk_pgp`, not on any code in this repository.
- **Key material.** cloud9 is maturity tier **T0**: it generates, stores, and rotates no
  keys. A key used by the `sk_pgp` backend is supplied by the operator through
  `CLOUD9_SEAL_KEY` and lives entirely outside this project.

See `docs/PQC_MIGRATION.md` for the staged rollout.

## Handling FEB files

A FEB is an emotional and relational record about a real person and a real agent. Treat it
as personal data.

- FEBs and seeds are written under `~/.skcapstone/agents/<agent>/trust/febs` by default and
  are carried between machines by Syncthing, not by any cloud service.
- Do not attach an unscrubbed FEB to a public issue, a PR, or a bug report.
- The repository ships example FEBs under `examples/`, `defaults/` and `cloud9/data/`.
  Those are fixtures. Do not add a real one.
- A FEB you did not create is untrusted input. `rehydrate_from_feb` injects its contents
  into an agent's context, so treat an unfamiliar FEB the way you would treat an unfamiliar
  script.

## Automated checks

`.github/workflows/secret-scan.yml` runs a pinned gitleaks binary with `--redact` and
`--exit-code 1` on every push and pull request, walking full history rather than just the
tree. It is a real blocking gate.
