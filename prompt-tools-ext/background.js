// -------------------------
// Default promptlets (fallback)
// -------------------------
const DEFAULT_PROMPTLETS = [
  { name: "Summarize", emoji: "💡", prompt: "Summarize this text clearly and concisely." },
  { name: "Rephrase", emoji: "✍️", prompt: "Rephrase this text to improve clarity and flow." }
];

// -------------------------
// Build context menus for right-click
// -------------------------
function buildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      // Use stored promptlets if available, otherwise defaults
      const promptlets = (data.promptlets && data.promptlets.length > 0)
        ? data.promptlets
        : DEFAULT_PROMPTLETS;

      // Create root menu
      chrome.contextMenus.create({
        id: "promptit_root",
        title: "PromptIt",
        contexts: ["selection"]
      });

      // Create submenus
      promptlets.forEach(p => {
        chrome.contextMenus.create({
          id: p.name,
          parentId: "promptit_root",
          title: `${p.emoji || ""} ${p.name}`,
          contexts: ["selection"]
        });
      });
    });
  });
}

// -------------------------
// Unified function to run a promptlet
// -------------------------
function runPromptlet(tabId, promptletName, selectionText) {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const promptlets = (data.promptlets && data.promptlets.length > 0)
      ? data.promptlets
      : DEFAULT_PROMPTLETS;

    const promptlet = promptlets.find(p => p.name === promptletName);
    if (!promptlet) return;

    // Open side panel
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId });
    }

    // Send message to content script
    chrome.tabs.sendMessage(tabId, {
      action: "runPromptlet",
      text: selectionText || "",
      prompt: promptlet.prompt
    });
  });
}

// -------------------------
// Right-click context menu click
// -------------------------
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;
  runPromptlet(tab.id, info.menuItemId, info.selectionText);
});

// -------------------------
// Popup / message listener
// -------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'runPromptlet') {
    runPromptlet(msg.tabId, msg.name, msg.text || "");
  }
});

// -------------------------
// Toolbar icon click
// -------------------------
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    chrome.runtime.openOptionsPage();
  }
});

// -------------------------
// Initialize context menus
// -------------------------
buildContextMenus();
chrome.runtime.onStartup.addListener(buildContextMenus);
chrome.storage.onChanged.addListener(buildContextMenus);
