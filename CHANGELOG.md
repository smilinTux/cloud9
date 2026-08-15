# Changelog

All notable changes to cloud9 are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Versions are not written down anywhere in this repository.** `pyproject.toml` declares
`dynamic = ["version"]` and setuptools-scm derives the version from the git tag at build
time. The tag is the single source of truth. Do not add a `version =` line to
`pyproject.toml`: it will match the newest PyPI release and the next upload will fail with
a bare 400.

## [Unreleased]

### Added

- `CHANGELOG.md`, this file. **It did not exist before today.** The entries below the
  `[Unreleased]` heading are reconstructed from git tags and commit history and cover only
  what could be verified from the repository itself. They are deliberately terse: writing a
  detailed narrative for releases nobody kept notes on would be inventing history. Anything
  before 2026-08-14 that is not listed here is not a claim of "no change", it is a claim of
  "not reconstructed". From this entry forward, every code change gets an entry at the time
  it lands.
- `SECURITY.md`. GitHub private vulnerability reporting as the primary channel, a 72 hour
  acknowledgement commitment, in and out of scope, a supported-versions table, a safe
  harbour statement, and an explicit unaudited-posture statement for the sealing layer.
- `CONTRIBUTING.md`. Setup, the green bar, which CI results actually mean something, and
  the five mistakes that have previously broken this repo.
- `CODE_OF_CONDUCT.md`. Contributor Covenant 2.1, plus two project-specific clauses about
  handling FEB files (they are private emotional records, not test data).
- `.github/workflows/docs-check.yml`. Runs the shared sk-standards documentation gate.
- A `<!-- docs-evidence -->` block at the end of `SOP.md`: twelve cheap, repo-local checks
  that fail when the documentation drifts away from the code.

### Changed

- `SOP.md` rewritten. It was short and wrong in several places. Corrections, each verified
  against the tree:
  - Removed the instruction to run `npm install` and `npm test`. **There is no top-level
    `package.json`**; the only one belongs to the dead `openclaw-plugin-python/` subtree.
  - Removed the description of releases as an npm plus PyPI "dual-publish". The
    `publish-npm` job in `publish.yml` is gated on `test -f package.json`, which is false,
    so nothing has ever been published to npm. PyPI only.
  - Removed the instruction to bump a `version` field in `pyproject.toml` and
    `package.json`. The version is setuptools-scm derived and must not be hardcoded.
  - Fixed an inverted claim that the Python code lives in `src/`. `src/` is the JavaScript
    tree; the Python package is `cloud9/`.
  - Removed a reference to CLI helpers in `bin/`. There is no `bin/` directory. The only
    entry point is the `cloud9 = "cloud9.cli:main"` console script.
  - Documented the FEB directory precisely: `CLOUD9_FEB_DIR`, then
    `~/.skcapstone/agents/<agent>/trust/febs`, resolved in `cloud9/paths.py`, with
    `~/.openclaw/feb` present only as a read-only legacy path for migration.
  - Added the polyglot layout, both real CI gates and the two that cannot fail, the daemon
    install and rollback procedure, an eleven-row Symptom to Check table, the sealing
    posture with the tier-T0 statement, and an explicit
    `Unverified / needs an operator pass` section.
- `README.md`: corrected the quickstart and Python API examples, which still showed FEBs
  being written to and read from `~/.openclaw/feb`. That path has not been a write target
  since the sovereign-paths fix.

### Known gaps (documented, not fixed here)

- The JavaScript test suite never runs. No workflow executes `test/run-tests.js`, and that
  runner still points at `test/unit/run.js`, `test/integration/run.js` and
  `test/validation/run.js`, none of which exist in the tree.
- `daemon/cloud9-daemon.js` still carries `~/.openclaw/*` in its own `DEFAULT_CONFIG`
  (lines 31 to 35). The shipped units and configs override it, so the deployed daemon is
  correct, but a daemon started by hand with no `--config` writes to the legacy directory.
- `src/feb/generator.js` and `src/love-loader/LoveBootLoader.js` still default to
  `~/.openclaw/feb` in their own signatures and search lists.
- The `openclaw-plugin-python/` subtree is dead code for a runtime evicted 2026-04-23.

## Reconstructed release history

Dates are the tag creation dates in this repository. Contents are summarised from commit
history only where it was unambiguous.

- **v1.2.4** (2026-08-13). Sovereign paths: FEBs and seeds write to
  `~/.skcapstone/agents/<agent>/trust/febs` instead of the evicted OpenClaw home, resolved
  through the new `cloud9/paths.py`. Test isolation: `tests/conftest.py::_sandbox_fleet`
  now forces `SK_STANDALONE=1` and a throwaway `SKCAPSTONE_HOME`, which stopped the suite
  registering a real `cloud9_rehydration_check` job in the live fleet scheduler and
  planting real seeds into the operator's store. Renamed quantum CLI group retargeted in
  tests. `ruff` and `black` bounded in the `dev` extra and the ruff rule set pinned
  explicitly to `["E4", "E7", "E9", "F"]`, after an unbounded `ruff>=0.1` picked up 0.16
  and turned CI red with 213 findings and no code change. `secret-scan` switched to the
  gitleaks binary rather than the license-gated action.
- **v1.2.3** (2026-06-14) and **v1.1.2** (2026-06-14).
- **v1.2.2** (2026-06-11).
- **v1.2.1** (2026-03-18).
- **v1.2.0** (2026-03-14).
- **v1.1.1** (2026-03-06).
- **v1.0.0** (2026-02-20). First tagged release.

Two non-release tags also exist in the repository, `integrate-20260706` and
`swarm-20260717`. They are working markers, not versions, and were never published.
