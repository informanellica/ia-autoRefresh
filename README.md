# Auto Refresh

A Chrome / Edge (Manifest V3) extension that **automatically reloads a tab at a
chosen interval**. Each tab has its own timer, so you can refresh a dashboard
every 30 seconds while leaving everything else alone.

## Features

- **Per-tab auto-reload** — start/stop a refresh timer on the current tab.
- **Presets** — 5s, 10s, 30s, 1m, 3m, 5m, 10m, 30m (editable in settings).
- **Custom interval** — any value in seconds or minutes.
- **Toolbar badge** shows the active interval (e.g. `30s`, `5m`).
- **Persists across restarts** (optional) — remembers per-URL rules and
  resumes them when the browser or tab reopens. Can be turned off in settings.
- **Light / dark theme**, remembered across sessions.

## How it works

A background service worker keeps a `setInterval` timer per tab and calls
`chrome.tabs.reload()` when it fires. The popup is the UI for starting/stopping
and choosing the interval. Rules are stored as `URL → interval` so they can be
restored after a restart (when persistence is on).

## Install (development)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select this folder.

## Build a release zip

Produces `dist/auto-refresh-v<version>.zip` (version read from
`manifest.json`), bundling only the shipped files.

```bash
./build.sh          # Git Bash / macOS / Linux (falls back to PowerShell or Python if `zip` is missing)
pwsh ./build.ps1    # PowerShell
```

## Permissions

| Permission | Why |
|------------|-----|
| `storage`  | Save presets, theme, persistence preference, and per-URL rules. |
| `tabs`     | Identify the active tab, read its URL, and reload it; set the badge. |

## Privacy

No data is collected or transmitted. Settings and refresh rules are stored
locally via the `storage` API. See [PRIVACY.md](PRIVACY.md).

## License

MIT (or your choice — update before publishing).
