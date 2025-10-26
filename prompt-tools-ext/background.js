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
// ✅ Store your API key here (DO NOT COMMIT THIS FILE TO GIT)
const OPENAI_API_KEY = "sk-proj-...your_real_key_here...";

// Listen for messages from content scripts or sidepanel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getApiKey") {
    // Return the API key to the sidepanel
    sendResponse({ apiKey: OPENAI_API_KEY });
    return true; // Keep message channel open
  }

  if (msg.action === "testMessage") {
    // Forward message to sidepanel
    chrome.runtime.sendMessage({
      action: "testMessage",
      text: msg.text,
      promptlet: msg.promptlet
    });
  }

  if (msg.action === "promptletResult") {
    // Forward AI result to sidepanel
    chrome.runtime.sendMessage({
      action: "promptletResult",
      result: msg.result
    });
  }
});
