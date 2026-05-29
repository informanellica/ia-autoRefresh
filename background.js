// Store active refresh timers per tab
const activeTimers = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRefresh") {
    startRefresh(message.tabId, message.interval);
    sendResponse({ status: "started" });
  } else if (message.action === "stopRefresh") {
    stopRefresh(message.tabId);
    sendResponse({ status: "stopped" });
  } else if (message.action === "getStatus") {
    const timer = activeTimers.get(message.tabId);
    sendResponse({
      active: !!timer,
      interval: timer ? timer.interval : null,
    });
  }
  return true;
});

function startRefresh(tabId, intervalSeconds) {
  stopRefresh(tabId);

  const intervalMs = intervalSeconds * 1000;
  const timerId = setInterval(() => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        stopRefresh(tabId);
        return;
      }
      chrome.tabs.reload(tabId);
    });
  }, intervalMs);

  activeTimers.set(tabId, { timerId, interval: intervalSeconds });
  updateBadge(tabId, intervalSeconds);
  saveState();
}

function stopRefresh(tabId) {
  const timer = activeTimers.get(tabId);
  if (timer) {
    clearInterval(timer.timerId);
    activeTimers.delete(tabId);
    chrome.action.setBadgeText({ text: "", tabId });
    saveState();
  }
}

function updateBadge(tabId, intervalSeconds) {
  let text;
  if (intervalSeconds >= 60) {
    text = Math.floor(intervalSeconds / 60) + "m";
  } else {
    text = intervalSeconds + "s";
  }
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId });
}

// Save state as URL -> interval mapping for persistence across restarts
function saveState() {
  const tabIds = [...activeTimers.keys()];
  if (tabIds.length === 0) {
    chrome.storage.local.set({ savedRules: {} });
    return;
  }

  chrome.tabs.query({}, (tabs) => {
    const rules = {};
    for (const tab of tabs) {
      const timer = activeTimers.get(tab.id);
      if (timer && tab.url) {
        rules[tab.url] = timer.interval;
      }
    }
    chrome.storage.local.set({ savedRules: rules });
  });
}

// Restore timers when the service worker starts (browser restart, SW wake-up)
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

// Restore on service worker startup
restoreState();

// Also restore when a tab finishes loading (handles page navigations & reopened tabs)
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
