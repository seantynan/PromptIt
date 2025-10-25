// background.js

// Set up context menu on extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Root menu
  chrome.contextMenus.create({
    id: "promptit_root",
    title: "PromptIt",
    contexts: ["selection"]
  });

  // Promptlets (example)
  const promptlets = [
    { id: "Prettify", title: "✨ Text Clean Up" },
    { id: "Translate", title: "🇫🇷 Learn French" },
    { id: "FoodAnalyser", title: "🥦 Food & Nutrition Analyse" },
    { id: "MotionWriter", title: "✍️ Compose Motion" }
  ];

  // Add submenus
  for (const p of promptlets) {
    chrome.contextMenus.create({
      id: p.id,
      parentId: "promptit_root",
      title: p.title,
      contexts: ["selection"]
    });
  }
});

// Handle menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "promptit_root") return; // skip root click

  // Open side panel for the tab
  chrome.sidePanel.open({ tabId: tab.id });

  // Send message to sidepanel.js to process the selection
  chrome.tabs.sendMessage(tab.id, {
    action: "runPromptlet",
    promptlet: info.menuItemId,
    text: info.selectionText
  });
});
