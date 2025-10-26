// background.js

// Store last pending message
let pendingMessage = null;

// --- Context menu setup ---
chrome.runtime.onInstalled.addListener(() => {
  // Root menu
  chrome.contextMenus.create({
    id: "promptit_root",
    title: "PromptIt",
    contexts: ["selection"]
  });

  // Promptlets (examples)
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

// --- Handle menu clicks ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "promptit_root") return; // skip root

  // Store message until sidepanel is ready
  pendingMessage = {
    action: "testMessage",
    promptlet: info.menuItemId,
    text: info.selectionText
  };

  // Open side panel
  await chrome.sidePanel.open({ tabId: tab.id });
});

// --- Listen for messages ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getApiKey") {
    sendResponse({ apiKey: OPENAI_API_KEY });
    return true;
  }

  // Sidepanel signals it's ready
  if (msg.action === "sidepanelReady" && pendingMessage) {
    chrome.runtime.sendMessage(pendingMessage);
    pendingMessage = null;
  }

  // Forward results if needed
  if (msg.action === "promptletResult") {
    chrome.runtime.sendMessage({
      action: "promptletResult",
      result: msg.result
    });
  }
});
