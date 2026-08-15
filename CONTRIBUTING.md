# Contributing to cloud9

Thanks for wanting to work on this. cloud9 is the Soul layer of the
[SKWorld](https://skworld.io) sovereign agent ecosystem: it turns an AI's emotional and
relationship state into a plain-JSON file you own, and replays it after a session reset.

**Read [SOP.md](SOP.md) before your first change.** It has the verified build, test,
release and configuration procedure, and a Troubleshooting table that will save you an
afternoon. This file covers the parts specific to contributing.

## Ground rules that are easy to get wrong

These are the traps that have actually bitten this repo. None of them are hypothetical.

1. **Never hardcode a version.** `pyproject.toml` declares `dynamic = ["version"]` and
   setuptools-scm derives it from the git tag. A hardcoded number matches the newest PyPI
   release, so the next tag rebuilds an already-published version and the upload dies with
   a bare 400. If you need the version at runtime, use `cloud9._ver.detect_version`.
2. **Never remove or bypass `tests/conftest.py::_sandbox_fleet`.** `cloud9.cli.main` is a
   click group whose callback calls `integration.ensure_schedule()` and
   `integration.register_self()` on *any* invocation. Without that autouse fixture, every
   `CliRunner` test on a sovereign node registers a real `cloud9_rehydration_check` job in
   the live scheduler at `nodes=all`, and `seed plant` writes real seeds into the
   operator's store. It happened. It must not happen again.
3. **Never write to `~/.openclaw/feb`.** That is `cloud9/paths.py::LEGACY_FEB_DIR`, the home
   of a runtime evicted 2026-04-23, kept only so a migration can find it deliberately. All
   writes go through `cloud9/paths.py::default_feb_directory`.
4. **Never add an unbounded linter dependency.** An unpinned `ruff>=0.1` picked up 0.16,
   whose wider defaults turned this repo red with 213 findings and zero code change.
   `pyproject.toml` now pins `ruff>=0.15,<0.17` and `black>=23.0,<27.0` and sets
   `select = ["E4", "E7", "E9", "F"]` explicitly. Leave those bounds alone.
5. **Never commit a real FEB.** FEBs are emotional records about real people. Fixtures
   only, and keep them under `examples/`, `defaults/` or `cloud9/data/`.

## Setting up

```bash
git clone https://github.com/smilinTux/cloud9.git
cd cloud9
git fetch --tags                # setuptools-scm needs them, or you get 0.0.0+unknown
python3 -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
```

Optional extras: `.[pqc]` adds `sk_pgp` for the opt-in sealing backend, `.[skcapstone]`
adds the sk-alert and skscheduler adapter. Neither is needed to develop or test.

The JavaScript side has **no** top-level `package.json` and no install step. It is plain ES
modules that Node runs directly. The only `package.json` in the tree belongs to the dead
`openclaw-plugin-python/` subtree; ignore it.

## The green bar

```bash
python3 -m pytest tests/ -v --tb=short
black --check cloud9/ tests/
ruff check cloud9/
```

236 tests, about 8 seconds. All three must pass before you open a PR. `pyproject.toml`
already sets `testpaths` and `addopts`, so a bare `pytest` runs the same suite.

Formatting is `black` with its default line length. Run `black cloud9/ tests/` to fix
rather than arguing with the checker.

### Which CI results actually mean something

`ci.yml` and `pytest.yml` are real gates. `secret-scan.yml` is a real gate. The
`integration-skcapstone` job in `pytest.yml` is `continue-on-error: true` on purpose (the
skcapstone sibling is not installable from PyPI), and the test job inside `publish.yml`
ends in `|| true`, so **a green `publish.yml` run is not evidence that tests passed**. See
SOP section 4 for the full table.

**The JavaScript tests do not run in CI.** `test/run-tests.js` still points at suite files
that do not exist in the tree. If you change anything under `src/` or `daemon/`, say so
explicitly in your PR and describe how you exercised it by hand, because nothing automated
will catch you.

## Tests

- New behaviour needs a test. `tests/` mirrors `cloud9/` file for file.
- Use `tmp_path`. The autouse `_sandbox_fleet` fixture already redirects `SKCAPSTONE_HOME`,
  but do not lean on it as your only isolation: pass an explicit `--directory` or set
  `CLOUD9_FEB_DIR` in any test that writes.
- The `sk_pgp`-gated tests in `tests/test_sealing_stage2.py` skip cleanly via
  `pytest.mark.skipif` when the optional backend is absent. Keep that pattern; a crypto
  test that silently self-skips and still reports green is worse than no test.
- `tests/test_integration.py` opts back into integrated mode through its own `home`
  fixture. Follow that pattern if you need skcapstone present.

## Changing a documented fact

`SOP.md` ends in a `<!-- docs-evidence -->` block. Each entry is a cheap, repo-local shell
command that exits zero while the documented fact holds and non-zero when it drifts. The
`docs-check` workflow runs them.

If you change an entry point, a default path, a unit file, a config key, or an environment
variable name, **update the SOP and its evidence check in the same PR.** A red docs-check is
telling you the documentation now lies, not that the gate is broken.

Keep evidence checks hermetic: repo-local, no network, no `systemctl`, no `ssh`, no `curl`,
and fast enough to run on every push.

## Changelog

Every change that touches code needs a dated entry in [CHANGELOG.md](CHANGELOG.md) under
`[Unreleased]`. Keep a Changelog format, newest first. The docs-check gate will look for it.

## Commits and pull requests

- Conventional-commit prefixes: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `refactor:`,
  `chore:`. Scope it when it helps: `fix(paths):`.
- Explain *why* in the body, not just what. This repo's most useful comments are the ones
  that record which outage a line of code prevents.
- Branch from `main`, open a PR, leave it for review. Do not push to `main`.
- **Do not push a tag.** A `v*` tag fires `publish.yml` and uploads to PyPI. Tagging is a
  maintainer action.
- Say plainly what you verified and what you did not. An honest "I could not test the
  daemon on macOS" is worth more than a confident claim that turns out to be false.

## Style

- **No em dashes or en dashes** anywhere: not in code, comments, docs, commit messages, or
  PR descriptions. Use a comma, a parenthesis, a colon, or a new sentence. Regular hyphens
  are fine.
- No claim of "quantum-proof", "unbreakable", or "quantum-safe". Say **post-quantum** or
  **quantum-resistant**, cite the FIPS number, and scope the claim to a surface. If you are
  describing the default sealing backend, remember the `cloud9-sig-<md5>` tag is a
  provenance label and not a signature, and say so.
- Docstrings explain the reasoning, not the syntax.

## Reporting a security issue

Do not open a public issue. See [SECURITY.md](SECURITY.md) for private reporting and the
72-hour acknowledgement commitment.

## Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

cloud9 is GPL-3.0-or-later. By contributing you agree your contribution is licensed the
same way.
