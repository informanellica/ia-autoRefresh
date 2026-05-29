# Privacy Policy — Auto Refresh

_Last updated: 2026-05-30_

Auto Refresh works entirely on your device.

## Data we collect

**None.** The extension does not collect, store, sell, or transmit any
personal or usage data. It makes no network requests and contains no
analytics, tracking, or advertising code.

## Local storage

To work, the extension stores the following **locally** via the browser's
`storage` API, and never transmits it:

- Your interval presets and theme choice.
- Whether to remember refresh rules across restarts.
- When persistence is enabled, a map of `page URL → refresh interval` so timers
  can resume after a restart. This stays on your device and is cleared when you
  stop the timers or turn persistence off.

## Permissions

- **storage** — save the settings and rules described above.
- **tabs** — read the active tab's URL and reload it; show the interval badge.

The extension reads tab URLs only to match and resume refresh rules; it does
not inspect page content.

## Contact

Questions about this policy: https://informanellica.com
