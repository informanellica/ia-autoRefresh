// Active refresh timers per tab: tabId -> { interval, nextFire, _badge }
//   interval: seconds between reloads
//   nextFire: epoch ms of the next reload
//   _badge:   last text written to the badge (avoids redundant API calls)
const activeTimers = new Map();

// A single 1-second master ticker drives every tab's countdown + reload.
// (Sub-minute intervals rule out chrome.alarms, whose minimum period is ~30s.)
let ticker = null;

function ensureTicker() {
  if (ticker === null && activeTimers.size > 0) ticker = setInterval(tick, 1000);
}
function maybeStopTicker() {
  if (ticker !== null && activeTimers.size === 0) {
    clearInterval(ticker);
    ticker = null;
  }
}

function tick() {
  const now = Date.now();
  for (const [tabId, t] of activeTimers) {
    if (now >= t.nextFire) {
      t.nextFire = now + t.interval * 1000;
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          stopRefresh(tabId);
          return;
        }
        chrome.tabs.reload(tabId);
      });
      setBadge(tabId, t.interval);
    } else {
      setBadge(tabId, Math.ceil((t.nextFire - now) / 1000));
    }
  }
}

// Countdown text: "<60s -> Ns", "<60m -> Nm", else "Nh".
function fmtRemaining(seconds) {
  const s = Math.max(0, seconds);
  if (s >= 3600) return Math.ceil(s / 3600) + "h";
  if (s >= 60) return Math.ceil(s / 60) + "m";
  return s + "s";
}

function setBadge(tabId, seconds) {
  const t = activeTimers.get(tabId);
  const text = fmtRemaining(seconds);
  if (t && t._badge === text) return; // unchanged — skip the API call
  if (t) t._badge = text;
  chrome.action.setBadgeText({ tabId, text }).catch(() => {});
}

function startRefresh(tabId, intervalSeconds) {
  activeTimers.set(tabId, {
    interval: intervalSeconds,
    nextFire: Date.now() + intervalSeconds * 1000,
    _badge: null,
  });
  chrome.action.setBadgeBackgroundColor({ tabId, color: "#198754" }).catch(() => {});
  setBadge(tabId, intervalSeconds);
  ensureTicker();
  saveState();
}

function stopRefresh(tabId) {
  if (!activeTimers.has(tabId)) return;
  activeTimers.delete(tabId);
  chrome.action.setBadgeText({ tabId, text: "" }).catch(() => {});
  maybeStopTicker();
  saveState();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRefresh") {
    startRefresh(message.tabId, message.interval);
    sendResponse({ status: "started" });
  } else if (message.action === "stopRefresh") {
    stopRefresh(message.tabId);
    sendResponse({ status: "stopped" });
  } else if (message.action === "getStatus") {
    const timer = activeTimers.get(message.tabId);
    sendResponse({ active: !!timer, interval: timer ? timer.interval : null });
  }
  return true;
});

// Save state as URL -> interval mapping for persistence across restarts.
// Skipped entirely when the user opted out via the "記憶しない" setting.
function saveState() {
  chrome.storage.local.get("rememberState", (cfg) => {
    if (cfg.rememberState === false) {
      chrome.storage.local.set({ savedRules: {} });
      return;
    }
    if (activeTimers.size === 0) {
      chrome.storage.local.set({ savedRules: {} });
      return;
    }
    chrome.tabs.query({}, (tabs) => {
      const rules = {};
      for (const tab of tabs) {
        const timer = activeTimers.get(tab.id);
        if (timer && tab.url) rules[tab.url] = timer.interval;
      }
      chrome.storage.local.set({ savedRules: rules });
    });
  });
}

// Restore timers when the service worker starts (browser restart, SW wake-up).
// The countdown restarts from a full interval (slight drift is acceptable).
function restoreState() {
  chrome.storage.local.get("savedRules", (data) => {
    const rules = data.savedRules;
    if (!rules || Object.keys(rules).length === 0) return;
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.url && rules[tab.url] && !activeTimers.has(tab.id)) {
          startRefresh(tab.id, rules[tab.url]);
        }
      }
    });
  });
}

restoreState();

// Also restore when a tab finishes loading (handles navigations & reopened tabs)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.storage.local.get("savedRules", (data) => {
      const rules = data.savedRules;
      if (rules && rules[tab.url] && !activeTimers.has(tabId)) {
        startRefresh(tabId, rules[tab.url]);
      }
    });
  }
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  stopRefresh(tabId);
});
