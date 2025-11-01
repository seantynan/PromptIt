// background.js

// -------------------------
// Build context menus
// -------------------------
async function buildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      const promptlets = data.promptlets;
      if (!promptlets || promptlets.length === 0) return;

      // Root menu
      chrome.contextMenus.create({
        id: "promptit_root",
        title: "PromptIt",
        contexts: ["selection"]
      });

      // Individual promptlets
      for (const p of promptlets) {
        chrome.contextMenus.create({
          id: p.name,
          parentId: "promptit_root",
          title: `${p.emoji || ""} ${p.name}`,
          contexts: ["selection"]
        });
      }
    });
  });
}

// -------------------------
// Add default promptlets on install
// -------------------------
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    if (!data.promptlets || data.promptlets.length === 0) {
      const defaultPromptlets = [
        { name: "Summarize", emoji: "💡", prompt: "Summarize this text clearly and concisely." },
        { name: "Rephrase", emoji: "✍️", prompt: "Rephrase this text to improve clarity and flow." }
      ];
      chrome.storage.local.set({ promptlets: defaultPromptlets }, buildContextMenus);
    } else {
      buildContextMenus();
    }
  });
});

// -------------------------
// Rebuild menus on startup or storage change
// -------------------------
chrome.runtime.onStartup.addListener(buildContextMenus);
chrome.storage.onChanged.addListener(buildContextMenus);

// -------------------------
// Handle right-click context menu
// -------------------------
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;

  const promptletName = info.menuItemId;
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const promptlet = data.promptlets.find((p) => p.name === promptletName);
    if (!promptlet) return;

    chrome.sidePanel.open({ tabId: tab.id });
    chrome.tabs.sendMessage(tab.id, {
      action: "runPromptlet",
      text: info.selectionText,
      prompt: promptlet.prompt
    });
  });
});

// -------------------------
// Handle toolbar icon click (popup or direct)
// -------------------------
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    chrome.runtime.openOptionsPage(); // fallback
  }
});

// -------------------------
// Handle messages from popup
// -------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'runPromptlet') {
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      const promptlet = data.promptlets.find((p) => p.name === msg.name);
      if (!promptlet) return;

      chrome.sidePanel.open({ tabId: msg.tabId });
      chrome.tabs.sendMessage(msg.tabId, {
        action: "runPromptlet",
        text: msg.text || "", // optionally pass selected text
        prompt: promptlet.prompt
      });
    });
  }
});
