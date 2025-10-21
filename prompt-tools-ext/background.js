// background.js

// List your Promptlets here for now — later these will be dynamic or user-defined
const promptlets = [
  { id: "frenchify", title: "🗣️ Frenchify" },
  { id: "prettify", title: "✨ Prettify" },
  { id: "summarize", title: "🧠 Summarize" }
];

// Create the parent context menu and its subitems
chrome.runtime.onInstalled.addListener(() => {
  // Parent menu
  chrome.contextMenus.create({
    id: "promptit",
    title: "PromptIt",
    contexts: ["selection"]
  });

  // Sub-menus (promptlets)
  for (const plt of promptlets) {
    chrome.contextMenus.create({
      id: plt.id,
      parentId: "promptit",
      title: plt.title,
      contexts: ["selection"]
    });
  }
});

// Handle clicks on any of the context menu items
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText) return;

  // Send message to the content/side panel script
  await chrome.sidePanel.open({ tabId: tab.id });
  chrome.tabs.sendMessage(tab.id, {
    action: "runPromptlet",
    promptletId: info.menuItemId,
    text: info.selectionText
  });
});
