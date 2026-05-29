let currentTabId = null;
let isActive = false;
let selectedSeconds = 60; // default 1 minute

const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const customValue = document.getElementById("customValue");
const customUnit = document.getElementById("customUnit");
const presetBtns = document.querySelectorAll(".preset-btn");

// Initialize
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    currentTabId = tabs[0].id;
    checkStatus();
  }
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

  // Highlight matching preset
  presetBtns.forEach((btn) => {
    if (parseInt(btn.dataset.seconds) === selectedSeconds) {
      btn.classList.add("selected");
    } else {
      btn.classList.remove("selected");
    }
  });
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

// Preset buttons
presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedSeconds = parseInt(btn.dataset.seconds);
    presetBtns.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");

    if (isActive) {
      startRefresh();
    }
  });
});

// Toggle button
toggleBtn.addEventListener("click", () => {
  if (isActive) {
    stopRefresh();
  } else {
    // Use preset if selected, otherwise use custom
    const hasPreset = document.querySelector(".preset-btn.selected");
    if (!hasPreset) {
      selectedSeconds = getCustomSeconds();
    }
    startRefresh();
  }
});

// Custom input: clear preset selection when editing
customValue.addEventListener("input", () => {
  presetBtns.forEach((b) => b.classList.remove("selected"));
  selectedSeconds = getCustomSeconds();
});

customUnit.addEventListener("change", () => {
  presetBtns.forEach((b) => b.classList.remove("selected"));
  selectedSeconds = getCustomSeconds();
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
