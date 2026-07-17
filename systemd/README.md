# Cloud 9 Daemon deployment (systemd, Hermes era)

The daemon runs as a per-agent **systemd user unit**: `cloud9-daemon@<agent>.service`.
The legacy runtime the old units targeted was evicted in April 2026, so the old
`cloud9-daemon.service` (system unit pinned to that runtime's home paths) and
its companion `cloud9-daemon.timer` were removed. The daemon is long-running,
so no timer is needed; `Restart=on-failure` handles recovery.

## Install

```sh
# 1. Per-agent config (paths live under the agent home, see example)
cp daemon/config.hermes.example.json \
   ~/.skcapstone/agents/<agent>/config/cloud9.json
# edit: replace every "lumina" with your agent name

# 2. Health dir used by skcapstone service_health (pid_file check)
mkdir -p ~/.cloud9

# 3. Unit
mkdir -p ~/.config/systemd/user
cp systemd/cloud9-daemon@.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now cloud9-daemon@<agent>.service
```

## Verify

```sh
systemctl --user status cloud9-daemon@<agent>
journalctl --user -u cloud9-daemon@<agent> -f
cat ~/.cloud9/daemon.pid
ls ~/.skcapstone/agents/<agent>/logs/cloud9-daemon.log
```

## Notes

- FEB source of truth: `~/.skcapstone/agents/<agent>/trust/febs/` (set as
  `febDirectory` in the config).
- The unit assumes the repo checkout at `~/clawd/skcapstone-repos/cloud9`
  (WorkingDirectory). Adjust if your checkout lives elsewhere.
- Hardening is preserved: `NoNewPrivileges=true`, `ProtectSystem=strict`,
  plus `ProtectHome=read-only` with explicit `ReadWritePaths` for the agent
  dir and `~/.cloud9`.
- macOS twin: `launchd/com.skcapstone.cloud9-daemon.plist` (same config path,
  logs under the agent `logs/` dir).
