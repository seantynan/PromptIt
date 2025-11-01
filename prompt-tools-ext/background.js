// background.js

// Load promptlets and build context menu
async function buildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      const promptlets = data.promptlets;
      if (promptlets.length === 0) return;

      chrome.contextMenus.create({
        id: "promptit_root",
        title: "PromptIt",
        contexts: ["selection"]
      });

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

// Add default promptlets on first install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    if (data.promptlets.length === 0) {
      const defaultPromptlets = [
        {
          name: "Summarize",
          emoji: "💡",
          prompt: "Summarize this text clearly and concisely."
        },
        {
          name: "Rephrase",
          emoji: "✍️",
          prompt: "Rephrase this text to improve clarity and flow."
        }
      ];
      chrome.storage.local.set({ promptlets: defaultPromptlets }, buildContextMenus);
    } else {
      buildContextMenus();
    }
  });
});

chrome.runtime.onStartup.addListener(buildContextMenus);
chrome.storage.onChanged.addListener(buildContextMenus);

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return; // silent if nothing selected
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

chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    // Fallback: open your popup or an options page
    chrome.runtime.openOptionsPage();
  }
});

