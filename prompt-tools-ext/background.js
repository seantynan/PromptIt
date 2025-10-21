chrome.runtime.onInstalled.addListener(() => {
  // Create main context menu
  chrome.contextMenus.create({
    id: "promptit_root",
    title: "PromptIt",
    contexts: ["selection"]
  });

  // Example submenus (Promptlets)
  const promptlets = [
    { id: "summarize", title: "Summarize" },
    { id: "translate", title: "Translate" },
    { id: "rewrite", title: "Rewrite in a better style" }
  ];

  for (const p of promptlets) {
    chrome.contextMenus.create({
      id: p.id,
      parentId: "promptit_root",
      title: p.title,
      contexts: ["selection"]
    });
  }
});

// Handle clicks on menu items
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "promptit_root") {
    // 1️⃣ Open the side panel for this tab
    chrome.sidePanel.open({ tabId: tab.id }).then(() => {
      // 2️⃣ Send a message directly to the side panel
      chrome.runtime.sendMessage({
        action: "runPromptlet",
        promptlet: info.menuItemId,
        text: info.selectionText
      });
    });
  }
});
