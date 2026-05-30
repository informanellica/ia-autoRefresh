const DEFAULT_PRESETS = [5, 10, 30, 60, 180, 300, 600, 1800];

let currentTabId = null;
let isActive = false;
let selectedSeconds = 60; // default 1 minute
let presets = [...DEFAULT_PRESETS];
let rememberState = true; // persist across browser restart by default

const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const customValue = document.getElementById("customValue");
const customUnit = document.getElementById("customUnit");
const presetsContainer = document.getElementById("presets");
const themeToggle = document.getElementById("themeToggle");

// Settings panel
const settingsBtn = document.getElementById("settingsBtn");
const backBtn = document.getElementById("backBtn");
const mainView = document.getElementById("mainView");
const settingsView = document.getElementById("settingsView");
const presetEditor = document.getElementById("presetEditor");
const addPresetBtn = document.getElementById("addPresetBtn");
const rememberToggle = document.getElementById("rememberToggle");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

// ---- Theme: default light, follow system, manual override remembered ----
let manualTheme; // "light" | "dark" | undefined (= follow system)

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

const prefersDark = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

// Stored manual choice wins; otherwise follow the system; default light.
function resolveTheme(stored) {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark() ? "dark" : "light";
}

function setTheme(theme) {
  manualTheme = theme;
  applyTheme(theme);
  chrome.storage.local.set({ theme });
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

// Follow OS theme changes while no manual choice is stored.
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (manualTheme !== "light" && manualTheme !== "dark") {
      applyTheme(e.matches ? "dark" : "light");
    }
  });
}

// ---- Load persisted settings, then initialize ----
chrome.storage.local.get(["theme", "presets", "rememberState"], (data) => {
  manualTheme = data.theme;
  applyTheme(resolveTheme(data.theme));
  if (Array.isArray(data.presets) && data.presets.length) {
    presets = data.presets;
  }
  rememberState = data.rememberState !== false;
  renderPresets();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTabId = tabs[0].id;
      checkStatus();
    }
  });
});

function checkStatus() {
  chrome.runtime.sendMessage(
    { action: "getStatus", tabId: currentTabId },
    (response) => {
      if (response && response.active) {
        isActive = true;
        selectedSeconds = response.interval;
        updateUI();
      }
    }
  );
}

function updateUI() {
  if (isActive) {
    statusEl.className = "status active";
    statusEl.textContent = formatInterval(selectedSeconds) + "ごとに更新中";
    toggleBtn.className = "btn btn-stop";
    toggleBtn.textContent = "停止";
  } else {
    statusEl.className = "status inactive";
    statusEl.textContent = "停止中";
    toggleBtn.className = "btn btn-start";
    toggleBtn.textContent = "開始";
  }

  highlightPreset();
}

function formatInterval(seconds) {
  if (seconds >= 3600) {
    return Math.floor(seconds / 3600) + "時間";
  } else if (seconds >= 60) {
    return Math.floor(seconds / 60) + "分";
  }
  return seconds + "秒";
}

function getCustomSeconds() {
  const value = parseInt(customValue.value) || 1;
  const multiplier = parseInt(customUnit.value);
  return value * multiplier;
}

// Reflect a given interval into the custom value/unit fields.
function setCustomFromSeconds(seconds) {
  if (seconds % 60 === 0) {
    customUnit.value = "60";
    customValue.value = seconds / 60;
  } else {
    customUnit.value = "1";
    customValue.value = seconds;
  }
}

// Split seconds into a {value, unit} pair for editing.
function secondsToValueUnit(seconds) {
  if (seconds % 60 === 0) return { value: seconds / 60, unit: 60 };
  return { value: seconds, unit: 1 };
}

// ---- Preset rendering ----
function highlightPreset() {
  presetsContainer.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle(
      "selected",
      parseInt(btn.dataset.seconds) === selectedSeconds
    );
  });
}

function clearPresetSelection() {
  presetsContainer
    .querySelectorAll(".preset-btn")
    .forEach((b) => b.classList.remove("selected"));
}

function renderPresets() {
  presetsContainer.innerHTML = "";
  presets.forEach((seconds) => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.dataset.seconds = seconds;
    btn.textContent = formatInterval(seconds);
    btn.addEventListener("click", () => {
      selectedSeconds = seconds;
      highlightPreset();
      setCustomFromSeconds(seconds);
      if (isActive) {
        startRefresh();
      }
    });
    presetsContainer.appendChild(btn);
  });
  highlightPreset();
}

// ---- Custom input: clear preset selection when editing ----
customValue.addEventListener("input", () => {
  clearPresetSelection();
  selectedSeconds = getCustomSeconds();
});

customUnit.addEventListener("change", () => {
  clearPresetSelection();
  selectedSeconds = getCustomSeconds();
});

// ---- Toggle button ----
toggleBtn.addEventListener("click", () => {
  if (isActive) {
    stopRefresh();
  } else {
    // Use preset if selected, otherwise use custom
    const hasPreset = presetsContainer.querySelector(".preset-btn.selected");
    if (!hasPreset) {
      selectedSeconds = getCustomSeconds();
    }
    startRefresh();
  }
});

function startRefresh() {
  chrome.runtime.sendMessage(
    { action: "startRefresh", tabId: currentTabId, interval: selectedSeconds },
    () => {
      isActive = true;
      updateUI();
    }
  );
}

function stopRefresh() {
  chrome.runtime.sendMessage(
    { action: "stopRefresh", tabId: currentTabId },
    () => {
      isActive = false;
      updateUI();
    }
  );
}

// ---- Settings panel ----
function openSettings() {
  rememberToggle.checked = !rememberState;
  renderPresetEditor();
  mainView.hidden = true;
  settingsView.hidden = false;
}

function closeSettings() {
  settingsView.hidden = true;
  mainView.hidden = false;
}

function addPresetRow(seconds) {
  const { value, unit } = secondsToValueUnit(seconds);

  const row = document.createElement("div");
  row.className = "preset-row";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.value = value;
  input.className = "preset-input";

  const select = document.createElement("select");
  select.className = "preset-unit";
  const optSec = new Option("秒", "1", unit === 1, unit === 1);
  const optMin = new Option("分", "60", unit === 60, unit === 60);
  select.appendChild(optSec);
  select.appendChild(optMin);

  const del = document.createElement("button");
  del.className = "del-btn";
  del.type = "button";
  del.textContent = "×";
  del.title = "削除";
  del.addEventListener("click", () => row.remove());

  row.appendChild(input);
  row.appendChild(select);
  row.appendChild(del);
  presetEditor.appendChild(row);
}

function renderPresetEditor() {
  presetEditor.innerHTML = "";
  presets.forEach((seconds) => addPresetRow(seconds));
}

function collectPresets() {
  const rows = presetEditor.querySelectorAll(".preset-row");
  const result = [];
  rows.forEach((row) => {
    const value = parseInt(row.querySelector(".preset-input").value);
    const unit = parseInt(row.querySelector(".preset-unit").value);
    if (value && value > 0) {
      const seconds = value * unit;
      if (!result.includes(seconds)) result.push(seconds);
    }
  });
  return result;
}

settingsBtn.addEventListener("click", openSettings);
backBtn.addEventListener("click", closeSettings);
addPresetBtn.addEventListener("click", () => addPresetRow(60));

saveSettingsBtn.addEventListener("click", () => {
  const newPresets = collectPresets();
  if (newPresets.length) {
    presets = newPresets;
  } else {
    presets = [...DEFAULT_PRESETS];
  }
  rememberState = !rememberToggle.checked;

  chrome.storage.local.set({ presets, rememberState });
  // If the user opted out of persistence, drop any saved rules immediately.
  if (!rememberState) {
    chrome.storage.local.set({ savedRules: {} });
  }

  renderPresets();
  closeSettings();
});
